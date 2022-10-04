import {
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
  TemplateRef,
  ViewChild,
} from "@angular/core";
import * as _ from "lodash";
import { BsModalService } from "ngx-bootstrap";
import { BsModalRef } from "ngx-bootstrap/modal/bs-modal-ref.service";
import { NgxSpinnerService } from "ngx-spinner";
import { Subscription } from "rxjs";
import {
  calendar_month_prefix,
  PAYMENT_CARD_TYPE,
} from "src/app/common/common.constants";
import { CommonUtility } from "../../common/common.utility";
import { RatePlan } from "../../common/models/packagedetails";
import { PaymentService } from "../../common/services/payment/payment.service";
import { StoreService } from "../../common/services/store.service";
import { FeatureFlags } from "../../common/feature.flags";

@Component({
  selector: "app-guest-info-footer",
  templateUrl: "./guest-info-footer.component.html",
  styleUrls: ["./guest-info-footer.component.scss"],
})
export class GuestInfoFooterComponent implements OnInit, OnDestroy {
  private _sharedDataSubscription: Subscription;
  private modalRef: BsModalRef;
  noCancellationDate: Date;
  isPastCancellationDate: boolean;
  isStayAndPay = false;
  termsAccepted: boolean;
  showTermsError: boolean;
  termsErrorMsg: string;
  ratePlan: RatePlan;
  marketingConsent: string;
  localeObj: any;
  consentAccepted: string;
  isManageBookingFlow: boolean;
  currentTotalPrice: number;
  previousTotalPrice: number;
  previousPaymentMethod: any;
  currCode: string;
  currency: string;
  sameAmountFlag: boolean;
  policyDepositAmount: number;
  currentWindow: boolean;
  totalCancelFee: number;
  futureWindow: boolean;
  cancelStartDate: any;
  cancelStartTime: any;
  totalFutureCancelFee: any;
  cancelFutureStartDate: any;
  cancelFutureStartTime: any;
  disableProceedButton = false;
  currentCancellationWindow = {};
  futureCancellationWindows = [];
  private _userSettingsSubscriptions: Subscription;
  @Output() paymentEvent = new EventEmitter<any>();
  noCancelDate: string;
  policyGuaranteeType: any;
  defCurrencyFilter: string;
  defCurrCode: string;
  RTL_Flag: boolean = false;
  propertyType: any;
  pgDepositAmtAvail: number = 0;
  additionalAmount : any = 0;
  refundAmount : any = 0;
  @ViewChild("modifyBookingWarningTemplate") modifyWaringTemplate: TemplateRef<any>;

  constructor(
    private storeSrv: StoreService,
    private modalService: BsModalService,
    private ngxSpinner: NgxSpinnerService,
    private paymentservice: PaymentService
  ) {}

  ngOnInit() {
    this.marketingConsent = "";
    this.consentAccepted = "NO";
    this.currentWindow = false;
    this.futureWindow = false;
    this.storeSrv.updateMarketingConsent(this.consentAccepted);
    this._userSettingsSubscriptions = this.storeSrv
      .getUserSettings()
      .subscribe((sharedData) => {
        this.localeObj = sharedData.localeObj;
        this.RTL_Flag = CommonUtility.langAlignCheck(this.storeSrv.getUserSettingsState().langObj.code, FeatureFlags);
      });
    this.defCurrencyFilter =
      _.get(
        this.storeSrv.getUserSettingsState(),
        "propertyInfo.defaultCurrency"
      ) || "SGD";
    this.propertyType = _.get(
      this.storeSrv.getUserSettingsState(),
      "propertyInfo.propertyType"
    );
    this.defCurrCode = CommonUtility.getCurrSymbolForType(
      this.storeSrv.getUserSettingsState().propertyInfo,
      this.defCurrencyFilter
    );
    this.isManageBookingFlow = this.storeSrv.getManageBookingFlowStatus();
    if (this.isManageBookingFlow) {
      this.previousPaymentMethod = this.storeSrv.getSingleRoomCreditCardInfo();
    }
    this._sharedDataSubscription = this.storeSrv
      .getBasket()
      .subscribe((sharedData) => {
        this.currency = sharedData.CurrencyCode;
        this.currCode = CommonUtility.getCurrSymbolForType(
          this.storeSrv.getUserSettingsState().propertyInfo,
          this.currency
        );
        if (sharedData.Rooms !== undefined) {
          const tempSharedData = sharedData.Rooms[0];
          if (tempSharedData) {
            this.ratePlan = _.get(tempSharedData, "RatePlan");
            this.policyGuaranteeType = _.get(
              this.ratePlan,
              "policyGuaranteeType"
            );
            const policyData = _.get(
              this.ratePlan,
              "cancellationPolicyInfoList"
            );
            this.currentCancellationWindow = {};
            this.futureCancellationWindows = [];
            if (policyData !== undefined) {
              this.currentCancellationWindow = _.find(policyData, {
                type: "current",
              });
              this.futureCancellationWindows = policyData.filter(
                (cancellationWindow) => {
                  return cancellationWindow.type === "future";
                }
              );
            }

            if (this.currentCancellationWindow !== undefined) {
              this.currentWindow = true;
              this.totalCancelFee = this.currentCancellationWindow["lateFee"];
            } else {
              this.currentWindow = false;
              this.totalCancelFee = 0;
            }

            if (
              this.futureCancellationWindows !== undefined &&
              this.futureCancellationWindows.length > 0
            ) {
              let policyIndex = 0;
              this.futureWindow = true;
              this.totalFutureCancelFee = [];
              this.cancelFutureStartDate = [];
              this.cancelFutureStartTime = [];
              _.forEach(this.futureCancellationWindows, (v) => {
                this.totalFutureCancelFee[policyIndex] = v.lateFee;
                this.cancelFutureStartDate[policyIndex] = v.cancelStartDateTime;
                this.cancelFutureStartTime[policyIndex] = v.cancelStartDateTime;
                policyIndex++;
              });
            } else {
              this.futureWindow = false;
              this.futureCancellationWindows = [];
              this.totalFutureCancelFee = [];
              this.cancelFutureStartDate = [];
              this.cancelFutureStartTime = [];
            }

            // Set total policy deposit amount for singleroom
              this.policyDepositAmount = _.get(
                this.ratePlan,
                "policyDepositAmount"
              );

            // Set total policy deposit amount for multiroom
            if (
                this.storeSrv.getBasketState().Rooms.length > 1 &&
                this.policyGuaranteeType === 'Pre Payment/Deposit') {
                  let ratePlanObject;
                  let policyDepositPrice = 0;
                  this.storeSrv.getBasketState().Rooms.forEach((room) => {
                    ratePlanObject = _.get(room, "RatePlan");
                    if (!!ratePlanObject.policyDepositAmount) {
                      policyDepositPrice += ratePlanObject.policyDepositAmount;
                    }
                  });
                this.policyDepositAmount = policyDepositPrice;
            }

            this.marketingConsent = _.get(this.ratePlan, "marketingConsent");
            this.noCancelDate = _.get(this.ratePlan, "noCancellationDate");
            this.isPastCancellationDate = _.get(
              this.ratePlan,
              "isPastCancellationDate"
            );
            const guaranteePercentage = _.get(
              this.ratePlan,
              "guaranteePercentage"
            );
            if (!guaranteePercentage) {
              this.isStayAndPay = true;
            } else {
              this.isStayAndPay = false;
            }
            if (this.noCancelDate) {
              this.noCancellationDate = new Date(this.noCancelDate);
            }
          }
          if (this.isManageBookingFlow) {
            const currentRoom = this.storeSrv.getBasketState().Rooms[0];
            this.currentTotalPrice = _.get(currentRoom.Pricing, "TotalPrice");
            this.previousTotalPrice = _.get(
              sharedData.ManageRoomBooking.Pricing,
              "TotalPriceByCurrency"
            );
            if (
              this.previousTotalPrice[this.currency] === this.currentTotalPrice
            ) {
              this.sameAmountFlag = true;
            }
          }
          this.disableProceedButton = this.paymentservice.disableProceedButton;
        }
      });
  }

  checkBookingAmount() {
    this._sharedDataSubscription = this.storeSrv
      .getBasket()
      .subscribe((sharedData) => {
        const tempSharedData = sharedData.Rooms[0];
        this.currentTotalPrice = _.get(tempSharedData.Pricing, "TotalPrice");
        if (this.isManageBookingFlow) {
          if (
            this.previousTotalPrice[this.currency] === this.currentTotalPrice
          ) {
            this.sameAmountFlag = true;
          } else {
            this.sameAmountFlag = false;
          }
        }
      });
  }

  termsCheckbox(event: any) {
    if (event.target.checked) {
      this.termsAccepted = true;
      this.showTermsError = false;
    } else {
      this.termsAccepted = false;
    }
  }

  termsCheckboxOnEnter(e) {
    e.target.previousElementSibling.click();
    if (e.keyCode === 32) {
      e.preventDefault();
    }
  }

  consentcheckbox(event: any) {
    if (event.target.checked) {
      this.consentAccepted = "YES";
    } else {
      this.consentAccepted = "NO";
    }
  }

  ngOnDestroy() {
    const subscriptionsList = [
      this._sharedDataSubscription,
      this._userSettingsSubscriptions,
    ];
    CommonUtility.removeSubscriptions(subscriptionsList);
    if (this.modalRef !== undefined) {
      this.modalRef.hide();
    }
  }

  openModal(template: TemplateRef<any>) {
    this.modalRef = this.modalService.show(template, { class: "modal-md" });
    CommonUtility.focusOnModal("tnc-modal");
    this.storeSrv.setActiveModalElem("g_link_tnc");
  }

  getTermsConditionsFlag() {
    return this.showTermsError;
  }

  proceedToPayment(isPopupProceed: boolean) {
    const basketData = this.storeSrv.getBasketState();
    this.ngxSpinner.show("reservationLoader");
    const ele = document.getElementsByClassName("form-check-input");
    if (!this.termsAccepted) {
      this.showTermsError = true;
      this.termsErrorMsg = this.localeObj.tf_4_Checkout_paymentMethodFooter_termsAndConditionsError;
      setTimeout(() => {
        this.ngxSpinner.hide("reservationLoader");
      }, 100);
    } else {
      this.showTermsError = false;
        if(basketData.ReservationResp.ResvConfCodes.length != 0){
          if(basketData.oldData.totaPrice < basketData.Rooms[0].Pricing.TotalPrice){
            this.additionalAmount = CommonUtility.roundedValue(basketData.Rooms[0].Pricing.TotalPrice - basketData.oldData.totaPrice, 2);
          }else{
            this.refundAmount =  CommonUtility.roundedValue(basketData.oldData.totaPrice - basketData.Rooms[0].Pricing.TotalPrice, 2);
        }
        this.modalRef = this.modalService.show(this.modifyWaringTemplate, { class: "modal-md" });
        CommonUtility.focusOnModal("modify_BookingWarning_Template");
        setTimeout(() => {
          this.ngxSpinner.hide("reservationLoader");
        }, 100);
      }
    }
    if(basketData.ReservationResp.ResvConfCodes.length == 0){
      this.paymentEvent.emit(isPopupProceed)
    }
  }

  modifyproceedPayment(isPopupProceed: boolean){
    this.modalRef.hide();
    this.paymentEvent.emit(isPopupProceed)
  }

  getTranslatedDate(date: string) {
    const dateToken = date.split(" ");
    const month = dateToken[1];
    const year = dateToken[5];
    const currDate = dateToken[2];
    return CommonUtility.fillMessage(
      this.localeObj.tf_5_Confirmation_bookingInfo_dateStr,
      [this.localeObj[calendar_month_prefix + month], currDate, year]
    );
  }

  getMessage(message: string, params: string[]) {
    return CommonUtility.fillMessage(message, params);
  }

  ifCardTypeAlipay() {
    if (this.previousPaymentMethod.cardType === "AL") {
      return true;
    }
    return false;
  }

  compareBookingAmount(): boolean {
    const currentRoom = this.storeSrv.getBasketState().Rooms[0];
    this.currentTotalPrice = _.get(currentRoom.Pricing, "TotalPrice");
    if (this.currentTotalPrice === this.previousTotalPrice[this.currency]) {
      this.sameAmountFlag = true;
    } else {
      this.sameAmountFlag = false;
    }
    if (this.currentTotalPrice > this.previousTotalPrice[this.currency]) {
      return true;
    } else if (
      this.currentTotalPrice < this.previousTotalPrice[this.currency]
    ) {
      return false;
    }
  }
}
