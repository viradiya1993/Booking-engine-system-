import {
  Component,
  Input,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
} from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import * as _ from "lodash";
import { BsModalService } from "ngx-bootstrap";
import { BsModalRef } from "ngx-bootstrap/modal/bs-modal-ref.service";
import { Subscription } from "rxjs";
import { FeatureFlags } from "src/app/common/feature.flags";
import { HttpWrapperService } from "src/app/common/services/http-wrapper.service";
import { ManageBookingService } from "src/app/common/services/manage-booking.service";
import { environment } from "../../../environments/environment";
import {
  MANAGE_BOOKING_FLAG,
  SHOW_RESEND_EMAIL_BUTTON,
  URL_PATHS,
} from "../../common/common.constants";
import { CommonUtility } from "../../common/common.utility";
import { Data, RatePlan } from "../../common/models/packagedetails";
import { StoreService } from "../../common/services/store.service";
import { IBasketState } from "../../common/store/reducers/basket.reducer";
import { SESSION_URL_CONST } from "../../common/urls.constants";
import { PreferencesLightboxComponent } from "../../guestinfo/guest-info-form/preferences-lightbox/preferences-lightbox.component";
import { Room } from "../../room";
import { CheckinSummary } from "../../search/guestduration/checkinsummary.type";
@Component({
  selector: "app-booking-info",
  templateUrl: "./booking-info.component.html",
  styleUrls: ["./booking-info.component.scss"],
})
export class BookingInfoComponent implements OnInit, OnDestroy {
  private _sharedDataSubscription: Subscription;
  @Input("refNumber") refNumber: string;
  objCheckin: CheckinSummary;
  objData: Data;
  currCode: string;
  defCurrCode: string;
  tax: number;
  packagePrice: number;
  ratePlan: RatePlan;
  defCurrFilter: string;
  currFilterValue: string;
  totalPrice: number;
  lightboxData: Room;
  isMultiRooms: boolean;
  localeObj: any;
  currenturlpath: string;
  ismanagebooking = false;
  roomIndex: number;
  private modalRef: BsModalRef;
  nightVerbiage: string;
  private _userSettingsSubscriptions: any;
  guaranteePercentage: number;
  showManageBookingFlag: boolean;
  confirmationPageText: string;
  isIATAPresent = false;
  failureStatus: String;
  message: string;
  isResendEmailMessage = false;
  resendEmailDisplayFlag = false;
  reservationType: string;
  isRT4ModifyFlowEnabled: boolean;
  showMailResendOption: boolean;
  private validateModifySubscription: Subscription;
  @Input("email") email: string;
  paymentCurrencyCode: string;
  selectedCurrCode: string;
  selectedCurrFilter: any;
  selectedCurrencyPrice: number;
  isCrossSellAddOnsExists: false;
  canModify: boolean;
  showModifyBtn: boolean;
  showCancelBtn: boolean;
  cancelReserFailed: boolean;
  externalRefNumber: any;
  errorMsg: any;
  suppressRateOnLookup: boolean;
  public RTL_Flag: boolean;

  propertyType: any;
  UDdisableModify: boolean;
  @Input("cancellationRequiredObj") cancellationRequiredObj: any;
  @Input("guestdetailsString") guestdetailsString: any;
  @Input("isPrepaidBooking") isPrepaidBooking: boolean;
  @ViewChild("PreferencesLightBox", { static: true })
  preferencesComponent: PreferencesLightboxComponent;
  addonTotalCost: number;
  guestCurrencyAddonsTotal: number;
  addonTotalTax: number;
  guestCurrencyAddonsTax: number;
  public pgDepositAmtAvail: number;
  public transactionID: string = '';
  checkInDate: string;
  checkOutDate: string;

  @Input() set crossSellAddonsExists(data: any) {
    this.isCrossSellAddOnsExists = data;
  }

  constructor(
    private store: StoreService,
    private router: Router,
    private modalService: BsModalService,
    private manageBookingSrv: ManageBookingService,
    private _authHttp: HttpWrapperService,
    private _activatedRoute: ActivatedRoute,
  ) {}

  ngOnDestroy() {
    if (window["unloadManageBookingLookupPageFunc"]) {
      window["unloadManageBookingLookupPageFunc"]();
    }
    if (this.modalRef !== undefined) {
      this.modalRef.hide();
    }
    const subscriptionsList = [
      this._sharedDataSubscription,
      this._userSettingsSubscriptions,
      this.validateModifySubscription,
    ];
    CommonUtility.removeSubscriptions(subscriptionsList);
  }

  openModal(template: TemplateRef<any>, sizeClass?: string) {
    if (sizeClass !== undefined) {
      this.modalRef = this.modalService.show(template, { class: sizeClass });
    } else {
      this.modalRef = this.modalService.show(template, { class: "modal-sm" });
      CommonUtility.focusOnModal("modify-reservation-modal");
    }
  }

  openPreferences(sizeClass?: string) {
    this.roomIndex = 0;
    if (sizeClass !== undefined) {
      this.preferencesComponent.openModal(sizeClass);
    } else {
      this.preferencesComponent.openModal("modal-sm");
    }
  }

  ngOnInit() {
    this.showMailResendOption = SHOW_RESEND_EMAIL_BUTTON;
    this.confirmationPageText = "";
    this.showManageBookingFlag = MANAGE_BOOKING_FLAG;
    this.isRT4ModifyFlowEnabled = environment.rt4_modify_flow;
    this.store.updateIs3DSCrediCardFlag(undefined);
    this.defCurrFilter =
      _.get(
        this.store.getUserSettingsState(),
        "propertyInfo.defaultCurrency"
      ) || "SGD";
    this.defCurrCode = CommonUtility.getCurrSymbolForType(
      this.store.getUserSettingsState().propertyInfo,
      this.defCurrFilter
    );
    (this.tax = 0), (this.totalPrice = 0), (this.selectedCurrencyPrice = 0);
    const urlTree = this.router.parseUrl(this.router.url);
    this.paymentCurrencyCode = _.get(
      this.store.getBasketState(),
      "paymentCurrencyCode"
    );
    if (urlTree.root.children["primary"] !== undefined) {
      this.currenturlpath = urlTree.root.children["primary"].segments
        .map((it) => it.path)
        .join("/");
    } else {
      this.currenturlpath = "";
    }
    this._userSettingsSubscriptions = this.store
      .getUserSettings()
      .subscribe((sharedData) => {
        this.localeObj = sharedData.localeObj;
        this.RTL_Flag = CommonUtility.langAlignCheck(this.store.getUserSettingsState().langObj.code, FeatureFlags);
        this.propertyType = sharedData.propertyInfo.propertyType;
        if (this.propertyType === "UD") {
          this.UDdisableModify = sharedData.propertyInfo.disableModify;
        }
        this.isIATAPresent =
          sharedData.iata && sharedData.iata.iataNumber ? true : false;
        this.showMailResendOption =
          sharedData.propertyInfo.showMailResendOption;
      });
    this._sharedDataSubscription = this.store
      .getBasket()
      .subscribe((sharedData) => {
        this.addonTotalCost = 0;
        this.guestCurrencyAddonsTotal = 0;
        this.addonTotalTax = 0;
        this.guestCurrencyAddonsTax = 0;
        if (!!sharedData.addonTotalCost[0]?.NOT_SPECIFIED) {
          sharedData.addonTotalCost.forEach((element) => {
            element.NOT_SPECIFIED.forEach((costPrice) => {
              this.addonTotalCost += costPrice.preTaxAmount || 0;
              this.guestCurrencyAddonsTotal +=
                costPrice.guestCurrencyPreTaxAmount || 0;
              this.addonTotalTax += costPrice.taxAndServices || 0;
              this.guestCurrencyAddonsTax +=
                costPrice.guestCurrencyTaxAndServices || 0;
            });
          });
        }
        this.confirmationPageText =
          sharedData.ReservationResp.ConfirmationPageText;
        (this.tax = 0), (this.totalPrice = 0), (this.selectedCurrencyPrice = 0);
        const data = sharedData as IBasketState;
        this.pgDepositAmtAvail = data.pgAmount;
        if (!!data.pgTransactionId) {
          this.transactionID = data.pgTransactionId;
        }
        if (sharedData.GuestSummary.rooms > 1) {
          this.isMultiRooms = true;
        } else {
          this.isMultiRooms = false;
        }
        if (data.GuestSummary !== undefined) {
          this.objCheckin = data.GuestSummary;
          // this.checkInDate = CommonUtility.getTranlatedDateLabels(
          //   this.objCheckin.checkindate.getFullYear()+"-"+
          //   (this.objCheckin.checkindate.getMonth() + 1)+"-"+
          //   this.objCheckin.checkindate.getDate()
          //   , this.localeObj)+", "+this.objCheckin.checkindate.getFullYear();
          // this.checkOutDate = CommonUtility.getTranlatedDateLabels(
          //   this.objCheckin.checkoutdate.getFullYear()+"-"+
          //   (this.objCheckin.checkoutdate.getMonth() + 1)+"-"+
          //   this.objCheckin.checkoutdate.getDate()
          //   , this.localeObj)+", "+this.objCheckin.checkoutdate.getFullYear();
        }
        if (data.Rooms !== undefined && data.Rooms.length > 0) {
          data.Rooms.forEach((room) => {
            this.totalPrice = this.totalPrice + (room.Pricing.DefnTotalPriceWithPackageAddOnTaxesByCurrency || room.Pricing.DefTotalPrice);
            this.selectedCurrencyPrice =
              this.selectedCurrencyPrice +
              (_.get(room, "Pricing.TotalPriceWithPackageAddOnTaxesByCurrency") || 0);
          });
          if (!this.ismanagebooking) {
            this.totalPrice += this.addonTotalCost + this.addonTotalTax || 0;
            this.selectedCurrencyPrice +=
              this.guestCurrencyAddonsTotal + this.guestCurrencyAddonsTax || 0;
          }
          this.selectedCurrCode = _.get(
            data.Rooms[0],
            "Pricing.CurrencySymbol"
          );
          this.selectedCurrFilter = _.get(
            data.Rooms[0],
            "Pricing.CurrencyCode"
          );
          const tempSharedData = data.Rooms[0]; // sharedData['SelectedRoomData'];
          this.ratePlan = tempSharedData.RatePlan;
          this.currFilterValue = tempSharedData.CurrencyCode;
          this.currCode = CommonUtility.getCurrSymbolForType(
            this.store.getUserSettingsState().propertyInfo,
            this.currFilterValue
          );
        }
        this.suppressRateOnLookup =
          sharedData.ReservationResp.suppressRateOnLookup;
        if (this.currenturlpath === URL_PATHS.BOOKING_DETAILS) {
          this.ismanagebooking = true;
          this.refNumber = sharedData.ReservationID;
          this.externalRefNumber = sharedData.ExternalConfNumber;
          this.canModify =
            sharedData.ReservationResp && sharedData.ReservationResp.CanModify;
          this.failureStatus =
            sharedData.ReservationResp &&
            sharedData.ReservationResp.failureStatus;
          this.showModifyBtn = sharedData.ReservationResp.showModify;
          this.showCancelBtn = sharedData.ReservationResp.showCancel;
        } else {
          this.ismanagebooking = false;
        }

        // Data-Layer Lookup
        // For room being looked up an entry will be generated in the quoteList array
        // The entry in the quoteList array will have quoteObj attributes
        // If you want information at a room-level use the quoteList array or the rtObj
        if (this.currenturlpath === URL_PATHS.BOOKING_DETAILS) {
          const quotelist = [];
          const room = sharedData.Rooms;
          if (room.length > 0) {
            const quoteObj = {
              confCode: sharedData.ReservationResp.ResvConfCodes[0], // Confirmation Number
              r: room[0].Pricing.PackagePrice, // Room rate without tax
              taxesAndFees: room[0].Pricing.Tax, // Total taxes and fees
              grandTotal:
                room[0].Pricing.PackagePrice +
                room[0].Pricing.Tax +
                room[0].Pricing.TotalAddonPrice, // Total cost with taxes
              rc: room[0].RatePlan.code, // Rateplan code
              rt: room[0].RoomDetails.code, // Room details code
              roomTypeName: room[0].RoomDetails.name, // Room type
              cc: room[0].Pricing.CurrencyCode, // Currency Code
              sd: CommonUtility.formateDateTime(
                sharedData.GuestSummary.checkindate
              ), // check-in date
              ed: CommonUtility.formateDateTime(
                sharedData.GuestSummary.checkoutdate
              ), // check-out date
              na: sharedData.GuestSummary.guests[0].adults, // Number of Adults
              nc: sharedData.GuestSummary.guests[0].children, // Number of Children
              offer_code: sharedData.promoData.accessCode, // Promo/Access code
              numRooms: sharedData.Rooms.length, // Number of rooms
              nn: sharedData.GuestSummary.los, // Number of nights
              bedType: room[0].BedTypeName, // Bed Type name
            };
            quotelist.push(quoteObj);

            // rtObj consists of attributes w.r.t to the room being looked up
            const rtObj = {};
            rtObj["rtCONFIRMATIONNUMBER_" + 0] =
              sharedData.ReservationResp.ResvConfCodes; // Confirmation Number
            rtObj["rtARRIVAL_" + 0] = CommonUtility.formateDateTime(
              sharedData.GuestSummary.checkindate
            ); // check-in date
            rtObj["rtDEPARTURE_" + 0] = CommonUtility.formateDateTime(
              sharedData.GuestSummary.checkoutdate
            ); // check-out date
            rtObj["rtNUMNIGHTS_" + 0] = sharedData.GuestSummary.los; // Number of nights
            rtObj["rtADULTS_" + 0] = sharedData.GuestSummary.guests[0].adults; // Number of Adults
            rtObj["rtCHILDREN_" + 0] =
              sharedData.GuestSummary.guests[0].children; // Number of Children
            rtObj["rtRATEPLAN_" + 0] = room[0].RoomDetails.code; // Rateplan code
            rtObj["rtROOMTYPE_" + 0] = room[0].RoomDetails.name; // Room type
            rtObj["rtADDONVALUE_" + 0] = room[0].Pricing.TotalAddonPrice; // Addon value
            rtObj["rtTOTALRATE_" + 0] = room[0].Pricing.PackagePrice; // Total room rate
            rtObj["rtTOTALRATEWITHTAXES_" + 0] =
              room[0].Pricing.PackagePrice +
              room[0].Pricing.Tax +
              room[0].Pricing.TotalAddonPrice; // Total room rate with tax
            rtObj["rtTAX_" + 0] = room[0].Pricing.Tax; // Total tax
            rtObj["rtADR_" + 0] =
              (room[0].Pricing.PackagePrice - room[0].Pricing.Tax) /
              sharedData.GuestSummary.los; // Average Daily rate
            CommonUtility.setDatalayer(rtObj);

            // Common attributes for lookup reservation
            CommonUtility.setDatalayer({
              rtPAGENAME: "LookUp",
              rtTOTALCOSTWITHTAXES: sharedData.Rooms[0].Pricing.PackagePrice, // Total price including taxes
              rtTOTALCOST:
                sharedData.Rooms[0].Pricing.PackagePrice -
                sharedData.Rooms[0].Pricing.Tax, // Total price excluding taxes
              rtTOTALTAX: sharedData.Rooms[0].Pricing.Tax, // Total tax
              rtTOTALNUMNIGHTS: sharedData.GuestSummary.los, // Number of nights
              rtTOTALADR:
                (sharedData.Rooms[0].Pricing.PackagePrice -
                  sharedData.Rooms[0].Pricing.Tax) /
                sharedData.GuestSummary.los, // Average Daily rate
              rtCITY: sharedData.Rooms[0].GuestInfo.city, // City
              rtSTATE: sharedData.Rooms[0].GuestInfo.state, // State
              rtZIPCODE: sharedData.Rooms[0].GuestInfo.postalCode, // Zipcode
              rtCOUNTRY: sharedData.Rooms[0].GuestInfo.countryCode, // Country
              rtCURRENCYCODE: sharedData.CurrencyCode, // Currency Code
              quoteList: quotelist,
              // Empty error state in data layer, in case of pre existing error
              error_type: "",
              error_code: "",
              error_description: "",
            });
          }
        }
      });
    // this.totalPrice += this.addonTotalCost + this.addonTotalTax || 0;
    // this.selectedCurrencyPrice +=
    //   this.guestCurrencyAddonsTotal + this.guestCurrencyAddonsTax || 0;
    this.nightVerbiage = this.localeObj.tf_2_RoomList_bookingSummery_night;
    if (Number(this.objCheckin.los > 1)) {
      this.nightVerbiage = this.localeObj.tf_3_MultiRoom_checkinSummery_nightsLc;
    }

    // manageBookingLookupPageFunc() - Manage Booking Lookup page load from scripts
    if (this.currenturlpath === URL_PATHS.BOOKING_DETAILS) {
      if (window["manageBookingLookupPageFunc"]) {
        window["manageBookingLookupPageFunc"]();
      }
    }
    this.transactionID = this._activatedRoute.snapshot.queryParamMap.get(
      "master_confirmationCode"
    );
  }

  onEnhanceClicked(value: string) {
    const ele = document.getElementById(value).previousElementSibling;
    ele.scrollIntoView({
      behavior: "smooth",
      block: "start",
      inline: "nearest",
    });
  }

  getTranslatedDate(dateStr: string) {
    const tokes = dateStr.split(" ");
    if (tokes.length > 1) {
      return CommonUtility.fillMessage(
        this.localeObj.tf_5_Confirmation_bookingInfo_dateStr,
        [this.localeObj[tokes[1]], tokes[0], tokes[2]]
      );
    } else {
      return dateStr;
    }
  }

  getTotalPriceMessage() {
    return CommonUtility.fillMessage(
      this.localeObj.tf_5_Confirmation_bookingInfo_totalPriceFor,
      [this.objCheckin.los + "", this.nightVerbiage]
    );
  }

  ifModifyBookingVisible() {
    if (
      !CommonUtility.ifPayAndStay(
        this.cancellationRequiredObj.guaranteePercentage
      )
    ) {
      if (!this.cancellationRequiredObj.cancellationFeeApply) {
        return true;
      }
    }
    return false;
  }

  routetoroomlisting() {
    // if (this.propertyType !== "RVNG") {
    //   this.modalRef.hide();
    // }
    const guestSummary = this.store.getBasketState().GuestSummary;
    let errorStatusCode;
    if (guestSummary.restrictionFailed) {
      this.store.setError(4000);
      errorStatusCode = 4000;
    }
    const offerCode = this.store.getBasketState().offerCode;
    const params = CommonUtility.getQueryParamObjGuestSummary(
      guestSummary,
      this.store,
      offerCode,
      errorStatusCode
    );
    const navigationExtras = {
      queryParams: params,
    };
    if (
      _.get(
        this.store.getUserSettingsState(),
        "propertyInfo.redirectOnModification"
      ) === "ROOM"
    ) {
      this.router
        .navigate(["/" + URL_PATHS.ROOMS_PAGE], navigationExtras)
        .then((d) => CommonUtility.highlightStep("select-room"));
    } else {
      this.router.navigate(["/" + URL_PATHS.SEARCH_PAGE], navigationExtras);
    }
  }

  ifPayAndStay() {
    return CommonUtility.ifPayAndStay(
      _.get(this.cancellationRequiredObj, "guaranteePercentage") ||
        this.guaranteePercentage
    );
  }

  validateForModify(
    allowModifyBooking,
    isPopupProceedButtonClick?: boolean,
    template?: TemplateRef<any>,
    sizeClass?: string
  ) {
    if (allowModifyBooking) {
      // if (isPopupProceedButtonClick) {
        this.routetoroomlisting();
      // } else {
      //   this.openModal(template, sizeClass);
      // }
    } else {
      // this.modalRef.hide();
      this.routeToManageBooking();
    }
  }

  handleModifyBtnDisplay() {
    const isPgEnabledProperty = _.get(
      this.store.getUserSettingsState(),
      "propertyInfo.pgenabled"
    );
    if (
        this.isRT4ModifyFlowEnabled &&
        this.showModifyBtn
        ) {
          if (isPgEnabledProperty &&
            this.isPrepaidBooking) {
              return false;
            } else {
            return true;
          }
      } else {
        return false;
      }
  }

  checkIsModifyAllowed(template?: TemplateRef<any>, sizeClass?: string) {
    const params: any = {
      email: this.email,
      bookingReference: _.trim(this.refNumber),
    };
    this.cancelReserFailed = false;
    this.validateModifySubscription = this.manageBookingSrv
      .getReservationLookup(params)
      .subscribe((data) => {
        const statusCode = _.get(data, "status.statusCode");
        const successFlag = _.get(data, "status.success");
        const dataObj = _.get(data, "data");
        const oldData = _.get(this.store.getBasketState(), "oldData");
        if (oldData) {
          oldData.prevRoom = dataObj.reservationDetails.roomType;
          oldData.prevArrivalDate = dataObj.reservationDetails.arrivalDate;
          oldData.prevDepartureDate = dataObj.reservationDetails.departureDate;
          this.store.updateOldData(oldData);
        }

        if (data.data.prepaidBooking !== undefined) {
          this.isPrepaidBooking = data.data.prepaidBooking;
        }
        this.canModify = false;
        this.failureStatus = "";
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
            this.showModifyBtn = false;
            this.showCancelBtn = false;
            this.routeToManageBooking(statusCode);
          } else if (
            statusCode === 1000 ||
            statusCode === 6902 ||
            statusCode === 6903 ||
            statusCode === 6904
          ) {
            if (statusCode === 1000) {
              this.showModifyBtn = true;
              this.showCancelBtn = true;

              /*
              * Checks for pgDepositAmount flag in reservation look-up API
              * Updates the store if value exists, its used in modification modal */
              if (!!dataObj.reservationDetails.pgDepositAmount){
              this.store.setPGDepositAmount(dataObj.reservationDetails.pgDepositAmount);
              }
            }

            if (statusCode === 6903) {
              this.showModifyBtn = true;
              this.showCancelBtn = false;
            }

            if (statusCode === 6904) {
              this.showModifyBtn = false;
              this.showCancelBtn = true;
            }

            if (statusCode === 6902) {
              this.showModifyBtn = false;
              this.showCancelBtn = false;
            }

            if (statusCode === 1000 || statusCode === 6903) {
              if (this.propertyType === "RVNG") {
                this.validateForModify(true, true, template, sizeClass);
              } else {
                this.validateForModify(true, false, template, sizeClass);
              }
            }
          }
        }
      });
  }

  routeToManageBooking(statusCode?: string) {
    const params = {
      errorCode: statusCode !== undefined ? statusCode : "",
      email: this.email,
      confirmNum: this.refNumber,
    };
    const navigationExtras = {
      queryParams: params,
    };
    this.router.navigate(["/" + URL_PATHS.MANAGE_BOOKING], navigationExtras);
  }

  onResendEmailClicked() {
    const typeObj = this.store.getReservationType();
    if (typeObj.isNew || typeObj.isModified) {
      this.reservationType = "new";
    }
    if ((typeObj.isModified && typeObj.isCancelled) || typeObj.isCancelled) {
      this.reservationType = "cancel";
    }
    const emailInfo = {
      confirmationCode: this.refNumber,
      email: this.email,
      type: this.reservationType,
    };
    this._authHttp
      .get(SESSION_URL_CONST.RESEND_EMAIL_REQUEST, emailInfo)
      .subscribe((response) => {
        this.resendEmailDisplayFlag = true;
        setTimeout(() => {
          this.resendEmailDisplayFlag = false;
        }, 30000);
        if (_.get(response, "status.statusCode") === 1000) {
          this.message = this.localeObj.tf_5_Confirmation_bookingInfo_resendEmailSuccessMsg;
          this.isResendEmailMessage = true;
        } else {
          this.message = this.localeObj.tf_5_Confirmation_bookingInfo_resendEmailFailureMsg;
          this.isResendEmailMessage = false;
        }
      });
  }

  isCancelreservationFailed(msg) {
    this.cancelReserFailed = true;
    this.errorMsg = msg;
  }

  getMessage(message: string, params: string[]) {
    return CommonUtility.fillMessage(message, params);
  }
}
