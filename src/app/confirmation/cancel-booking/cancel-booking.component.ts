import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  TemplateRef,
} from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import * as _ from "lodash";
import { BsModalService } from "ngx-bootstrap";
import { BsModalRef } from "ngx-bootstrap/modal/bs-modal-ref.service";
import { Subscription } from "rxjs";
import { FeatureFlags } from "src/app/common/feature.flags";
import { environment } from "../../../environments/environment";
import { PAYMENT_CARD_TYPE, URL_PATHS } from "../../common/common.constants";
import { CommonUtility } from "../../common/common.utility";
import { ManageBookingService } from "../../common/services/manage-booking.service";
import { StoreService } from "../../common/services/store.service";

@Component({
  selector: "app-cancel-booking",
  templateUrl: "./cancel-booking.component.html",
  styleUrls: ["./cancel-booking.component.scss"],
})
export class CancelBookingComponent implements OnInit, OnDestroy {
  private modalRef: BsModalRef;
  private _userSettingsSubscriptions: Subscription;
  private cancelBookingSubscription: Subscription;
  private validateCancelReservation: Subscription;
  selectedReason: any;
  selectedReasonDefault = "Select reason";
  cancelConfCode: string;
  reasons: any;
  localeObj: any;
  cancellationFeeText: string;
  cardType: string;
  cancelMessageValid: boolean;
  isSubmitButtonEnabled: boolean;
  confirmationPage: boolean;
  showCancelButton: boolean;
  propertyInfo: any;
  isRT4ModifyFlowEnabled: boolean;
  @Output() errorMsg: EventEmitter<any> = new EventEmitter<any>();
  @Input("cancellationRequiredObj") cancellationRequiredObj: any;
  @Input("bookingRefNo") bookingRefNo: string;
  @Input() email: string;
  RTL_Flag: boolean;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private modalService: BsModalService,
    private _storeSvc: StoreService,
    private manageBookingSrv: ManageBookingService
  ) {}

  ngOnDestroy() {
    if (this.modalRef !== undefined) {
      this.modalRef.hide();
    }
    const subscriptionsList = [
      this._userSettingsSubscriptions,
      this.cancelBookingSubscription,
      this.validateCancelReservation,
    ];
    CommonUtility.removeSubscriptions(subscriptionsList);
  }

  ngOnInit() {
    this.isRT4ModifyFlowEnabled = environment.rt4_modify_flow;
    this.selectedReason = {};
    this.reasons = [];
    this.cancellationFeeText = "";
    this.cancelMessageValid = false;
    this._userSettingsSubscriptions = this._storeSvc
      .getUserSettings()
      .subscribe((sharedData) => {
        this.localeObj = sharedData.localeObj;
        this.propertyInfo = sharedData.propertyInfo;
        this.RTL_Flag = CommonUtility.langAlignCheck(
          this._storeSvc.getUserSettingsState().langObj.code,
          FeatureFlags
        );
      });
    if (window.location.pathname === "/" + URL_PATHS.CONFIRMATION_PAGE) {
      this.confirmationPage = true;
    }
  }

  cancelBooking() {
    const langCode = _.get(
      this._storeSvc.getUserSettingsState(),
      "langObj.code"
    );
    const requestObj = {
      // propertyCode: environment.property_code,
      confirmationCode: this.bookingRefNo,
      cancellationReasonCode: this.selectedReason.code,
      propertyCode: this.propertyInfo.propertyCode,
      langCode,
      portalSubdomain: CommonUtility.getSubdomain(),
    };
    this.cancelBookingSubscription = this.manageBookingSrv
      .cancelBookingRequest(requestObj)
      .subscribe((response) => {
        if (_.get(response, "status.statusCode") === 1000) {
          const cancelCode = _.get(response, "data.cancellationCode");
          this._storeSvc.updateResvCancellationCode(cancelCode);
          const params = {
            locale: this.route.snapshot.queryParams.locale || "en",
            cancellationCode: cancelCode,
          };
          const navigationExtras = {
            queryParams: params,
          };
          if (this.propertyInfo.propertyType !== "RVNG") {
            this.modalRef.hide();
          }
          this.router.navigate(
            ["/" + URL_PATHS.CANCEL_BOOKING],
            navigationExtras
          );
        } else if (
          _.get(response, "status.statusCode") === 2505 &&
          this.propertyInfo.propertyType === "RVNG"
        ) {
          this.errorMsg.emit(this.localeObj.tf_99_errorCode_2505);
        } else if (
          _.get(response, "status.statusCode") === 2503 &&
          this.propertyInfo.propertyType === "RVNG"
        ) {
          this.errorMsg.emit(this.localeObj.tf_99_errorCode_2503);
        } else if (
          _.get(response, "status.statusCode") === 2504 &&
          this.propertyInfo.propertyType === "RVNG"
        ) {
          this.errorMsg.emit(this.localeObj.tf_99_errorCode_2504);
        } else if (
          _.get(response, "status.statusCode") === 2100 &&
          this.propertyInfo.propertyType === "RVNG"
        ) {
          this.errorMsg.emit(this.localeObj.tf_99_errorCode_2100);
        } else if (
          _.get(response, "status.statusCode") === 2501 &&
          this.propertyInfo.propertyType === "RVNG"
        ) {
          this.errorMsg.emit(this.localeObj.tf_99_errorCode_2501);
        } else {
          // const navigationExtras = {};
          // this.router.navigate([URL_PATHS.SYSTEM_ERROR], navigationExtras);
          this._storeSvc.setSystemError(true);
        }
      });
  }

  openCancelBooking() {
    // Populate cancellation reasons
    if (
      this.cancellationRequiredObj.cancellationReasons &&
      this.cancellationRequiredObj.cancellationReasons !== undefined &&
      this.cancellationRequiredObj.cancellationReasons !== null
    ) {
      this.reasons = [];
      for (const key in this.cancellationRequiredObj.cancellationReasons) {
        if (
          this.cancellationRequiredObj.cancellationReasons.hasOwnProperty(key)
        ) {
          this.reasons.push({
            code: key,
            reason: this.cancellationRequiredObj.cancellationReasons[key],
          });
        }
      }
      // if (this.reasons.length > 0) {
      //   this.selectedReason = this.reasons[0];
      // }
    }

    // Populate cancellation text and set values for further cancellation related payments
    const roomData = this._storeSvc.getBasketState().Rooms;
    this.cardType = roomData[0].PaymentInfo.cardType;
    const policyflag = CommonUtility.ifPayAndStay(
      this.cancellationRequiredObj.guaranteePercentage
    );

    // Start -- String Interpolation for price figure colour styling
    const defCurrCode =
      _.get(
        this._storeSvc.getUserSettingsState(),
        "propertyInfo.defaultCurrency"
      ) || "SGD";
    const currencySymbol = CommonUtility.getCurrSymbolForType(
      this._storeSvc.getUserSettingsState().propertyInfo,
      defCurrCode
    );
    const refundAmountTag = `<span style="color:red;font-weight:bold;">
    ${currencySymbol}${this.cancellationRequiredObj.cancellationFee}</span>`;
    // End -- String Interpolation for price figure colour styling

    if (!this.isRT4ModifyFlowEnabled) {
      // By Pass MBS Logic to show cancellation related messages
      if (this.cardType) {
        // MBS LOGIC- Cancellation message to show on cancel popup
        if (
          this.cardType === PAYMENT_CARD_TYPE.MASTER_CARD ||
          this.cardType === PAYMENT_CARD_TYPE.VISA ||
          this.cardType === PAYMENT_CARD_TYPE.AMEX ||
          this.cardType === PAYMENT_CARD_TYPE.CHINA_UNION_PAY ||
          this.cardType === PAYMENT_CARD_TYPE.JAPAN_CREDIT_BUREAU ||
          this.cardType === PAYMENT_CARD_TYPE.MASTER_ONLINE ||
          this.cardType === PAYMENT_CARD_TYPE.AMEX_ONLINE ||
          this.cardType === PAYMENT_CARD_TYPE.VISA_ONLINE ||
          this.cardType === PAYMENT_CARD_TYPE.MASTER_MANUAL ||
          this.cardType === PAYMENT_CARD_TYPE.AMEX_MANUAL ||
          this.cardType === PAYMENT_CARD_TYPE.VISA_MANUAL
        ) {
          if (policyflag) {
            this.cancellationFeeText = this.localeObj.tf_5_Confirmation_cancelBooking_nonRefundableAlert;
            this.cancelMessageValid = true;
          } else {
            if (
              this.cancellationRequiredObj.cancellationFeeApply &&
              this.cancellationRequiredObj.cancellationFee !== undefined &&
              this.cancellationRequiredObj.cancellationFee !== null
            ) {
              this.cancellationFeeText = CommonUtility.fillMessage(
                this.localeObj
                  .tf_5_Confirmation_cancelBooking_cancellationChargesAlert,
                [refundAmountTag]
              );
              this.cancelMessageValid = true;
            } else {
              this.cancellationFeeText = this.localeObj.tf_5_Confirmation_cancelBooking_cancelPopAlert5;
              this.cancelMessageValid = true;
            }
          }
        } else if (this.cardType === PAYMENT_CARD_TYPE.ALI) {
          if (policyflag) {
            this.cancellationFeeText = this.localeObj.tf_5_Confirmation_cancelBooking_nonRefundableAlert;
          } else {
            if (
              this.cancellationRequiredObj.cancellationFeeApply &&
              this.cancellationRequiredObj.cancellationFee !== undefined &&
              this.cancellationRequiredObj.cancellationFee !== null
            ) {
              this.cancellationFeeText = CommonUtility.fillMessage(
                this.localeObj
                  .tf_5_Confirmation_cancelBooking_refundProcessedAlert,
                [refundAmountTag]
              );
            } else {
              this.cancellationFeeText = this.localeObj.tf_5_Confirmation_cancelBooking_refundProcessingPeriodAlert;
            }
          }
          this.cancelMessageValid = true;
        }
      }
    }

    if (this.isRT4ModifyFlowEnabled) {
      // RT4 Cancellation message to show on cancel popup
      if (
        this.cancellationRequiredObj &&
        this.cancellationRequiredObj.cancellationFeeApply &&
        this.cancellationRequiredObj.cancellationFee !== undefined &&
        this.cancellationRequiredObj.cancellationFee !== null
      ) {
        this.cancellationFeeText = CommonUtility.fillMessage(
          this.localeObj
            .tf_5_Confirmation_cancelBooking_cancellationChargesAlert,
          [refundAmountTag]
        );
        this.cancelMessageValid = true;
      } else {
        this.cancellationFeeText = this.localeObj.tf_5_Confirmation_cancelBooking_cancelPopAlert5;
        this.cancelMessageValid = true;
      }
    }
  }

  cancellationReasonSelected(reasonObj: any) {
    this.selectedReason = reasonObj;
    this.isSubmitButtonEnabled = true;
  }

  openModal(template: TemplateRef<any>) {
    const params = {
      email: this.email,
      bookingReference: this.bookingRefNo,
    };
    this._storeSvc.setActiveModalElem("cancelBtn-" + this.bookingRefNo);
    this.validateCancelReservation = this.manageBookingSrv
      .getReservationLookup(params)
      .subscribe((data) => {
        const statusCode = _.get(data, "status.statusCode");
        const successFlag = _.get(data, "status.success");
        const dataObj = _.get(data, "data");
        if (!successFlag) {
          this.routeToManageBooking(statusCode);
        } else if (successFlag) {
          if (
            statusCode === 6006 ||
            statusCode === 2100 ||
            statusCode === 2202 ||
            statusCode === 6000 ||
            statusCode === 6005 ||
            statusCode === 6007 ||
            statusCode === 6002 ||
            statusCode === 6901 ||
            statusCode === 1002 ||
            statusCode === 6003
          ) {
            // this.showModifyBtn = false;
            // this.showCancelBtn = false;
            this.routeToManageBooking(statusCode);
          } else if (
            statusCode === 1000 ||
            statusCode === 6902 ||
            statusCode === 6903 ||
            statusCode === 6904
          ) {
            if (statusCode === 1000 || statusCode === 6904) {
              /*
              * Checks for pgDepositAmount flag in reservation look-up API
              * Updates the store if value exists, its used on cancellation page */
              if(!!dataObj.reservationDetails.pgDepositAmount){
                this._storeSvc.setPGDepositAmount(dataObj.reservationDetails.pgDepositAmount);
                }
              this.showCancelButton = true;
              this.openCancelBooking();
              this.modalRef = this.modalService.show(template, {
                class: "modal-sm",
              });
              CommonUtility.focusOnModal("canbel-booking-modal");
            }

            if (statusCode === 6902 || statusCode === 6903) {
              this.showCancelButton = false;
            }
          }
        }
      });
  }

  routeToManageBooking(statusCode?: string) {
    const params = {
      errorCode: statusCode !== undefined ? statusCode : "",
      email: this.email,
      confirmNum: this.bookingRefNo,
    };
    const navigationExtras = {
      queryParams: params,
    };
    this.router.navigate(["/" + URL_PATHS.MANAGE_BOOKING], navigationExtras);
  }
}
