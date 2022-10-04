import {
  AfterViewInit,
  Component,
  Input,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
} from "@angular/core";
import {
  ActivatedRoute,
  Router,
} from "@angular/router";
import * as _ from "lodash";
import { BsModalService } from "ngx-bootstrap";
import { BsModalRef } from "ngx-bootstrap/modal/bs-modal-ref.service";
import { Subscription } from "rxjs";
import { environment } from "../../../environments/environment";
import { browserBack, browserRefresh } from "../../app.component";
import {
  ErrorCodesListInComponents,
  MANAGE_BOOKING_FLAG,
  MPGS_SCRIPT_ID,
  PAYMENT_CARD_TYPE,
  STEP_MAP,
  URL_PATHS,
  TEALIUM_PAGE_NAMES,
} from "../../common/common.constants";
import { CommonUtility } from "../../common/common.utility";
import { FeatureFlags } from "../../common/feature.flags";
import { Data, RatePlan } from "../../common/models/packagedetails";
import { ManageBookingService } from "../../common/services/manage-booking.service";
import { PaymentService } from "../../common/services/payment/payment.service";
import { StoreService } from "../../common/services/store.service";
import {
  IBasketState,
  SelectedRoom,
} from "../../common/store/reducers/basket.reducer";
import { PreferencesLightboxComponent } from "../../guestinfo/guest-info-form/preferences-lightbox/preferences-lightbox.component";
import {
  CheckinSummary,
} from "../../search/guestduration/checkinsummary.type";
import { BookingInfoComponent } from  "../booking-info/booking-info.component";

@Component({
  selector: "app-confirmation-page",
  templateUrl: "./confirmation-page.component.html",
  styleUrls: ["./confirmation-page.component.scss"],
})
export class ConfirmationPageComponent
  implements OnInit, AfterViewInit, OnDestroy {
  private _sharedDataSubscription: Subscription;
  private _confDataSubscription: Subscription;
  crossSellAddonsExists = false;
  defCurrCode: string;
  defCurrFilter: string;
  currFilter: string;
  referenceNumber: string;
  referenceNumberList: string[];
  showModifyBooking: boolean[];
  apiLookupCode: string;
  objCheckin: CheckinSummary;
  objData: Data;
  ratePlan: RatePlan;
  tax: number;
  selectedTax: number;
  currFilterValue: string;
  packagePrice: number;
  totalPrice: number;
  currCode: string;
  selectedCurrCode: string;
  selectedCurrFilter: string;
  selectedCurrTotalPrice: number;
  country: string;
  // guest details
  roomLength: number;
  guestName: string;
  mobileNumber: string;
  mobileNumberRequired: boolean;
  email: string;
  isOccasion: boolean;
  occasion: string;
  roomPreference: string;
  checkInTimeText: string;
  countryCode: string;
  guestTitle: string;
  selectedRoom: SelectedRoom;
  selectedRoomList: any;
  addOnTotal: number;
  addOns: any;
  cancellationPolicy: string;
  confReservationDetails: any;
  isMultiRooms: boolean;
  localeObj: any;
  currenturlpath: string;
  isManagebooking = false;
  preferencesData: any;
  private modalRef: BsModalRef;
  guestdetailsString: string[];
  currindex: number;
  currRefNo: string;
  guaranteePercentage: number;
  derbyTagData: any;
  showManageBookingFlag: boolean;
  guestPreferenceDisclaimer: string;
  isIATAPresent = false;
  isConfirmationPage = true;
  isRT4ModifyFlowEnabled: boolean;
  totalPriceByCurrency: any;
  paymentCurrencyCode: string;
  canModify = [];
  showTaxBreakDown: any;
  propertyType: any;
  UDdisableModify: boolean;
  private _userSettingsSubscriptions: Subscription;
  private reservationLookUpSubscription: Subscription;
  private validateModifySubscription: Subscription;
  private routerSubscription: Subscription;
  cancelReserFailed: boolean;
  errorMsg: any;
  @Input("cancellationRequiredObj") cancellationRequiredObj: any;
  @ViewChild("PreferencesLightBox", { static: true })
  preferencesComponent: PreferencesLightboxComponent;
  cancellationObj: {};
  failureStatus: any = [];
  showCancelBooking: boolean[];
  addonTotalCost = 0;
  expandTaxBreakDown: any;
  currency: any;
  addonsList: any;
  addonTotalTax = 0;
  isTaxbreakdownEnabled: any;
  guestCurrencyAddonsTotal: number;
  guestCurrencyAddonsTax: number;
  counter: number;
  suppressRateOnLookup: boolean;
  suppressRateAddonsList: any[] = [];
  addonDefTax = 0;
  addonFormattedTax = 0;
  depositAmount: any = [];
  dueAmount: any = [];
  public transactionID = '';
  showDeposite: boolean;
  public pgDepositAmtAvail = 0;
  additionalGuestNames = [];
  public RTL_Flag: boolean;
  public multiPropertyCurrency: boolean;
  @ViewChild("bookingInfo", { static: true })
  bookingInfo: BookingInfoComponent;
  isPgEnabledProperty: boolean;
  isPrepaidBooking: boolean;

  // guest details
  constructor(
    private _activatedRoute: ActivatedRoute,
    private router: Router,
    private _storeSvc: StoreService,
    private paymentService: PaymentService,
    private manageBookingSrv: ManageBookingService,
    private modalService: BsModalService
  ) {
    const basket = this._storeSvc.getBasketState();
    if (
      basket.CurrentStep === STEP_MAP[URL_PATHS.SEARCH_PAGE] ||
      (basket.CurrentStep === STEP_MAP[URL_PATHS.CONFIRMATION_PAGE] &&
        basket.cancellationCode)
    ) {
      if (!!basket.cancellationCode) {
        this._storeSvc.updateResvCancellationCode("");
      }
      this.router
        .navigateByUrl(URL_PATHS.SEARCH_PAGE)
        .then((d) => CommonUtility.highlightStep("search"));
    } else if (basket.CurrentStep === STEP_MAP[URL_PATHS.GUEST_INFO_PAGE]) {
      this._storeSvc.updateCurrentStep(STEP_MAP[URL_PATHS.CONFIRMATION_PAGE]);
    } else if (
      basket.CurrentStep === STEP_MAP[URL_PATHS.ROOMS_PAGE] &&
      basket.ReservationID !== ""
    ) {
      this.router.navigate(["/" + URL_PATHS.MANAGE_BOOKING]);
    } else if (basket.CurrentStep !== STEP_MAP[URL_PATHS.CONFIRMATION_PAGE]) {
      this.router.navigateByUrl(URL_PATHS.ROOMS_PAGE);
    }
  }

  onCrossSellAddonsExists(crossSellAddonsExists: any) {
    this.crossSellAddonsExists = crossSellAddonsExists;
  }
  openModal(
    template: TemplateRef<any>,
    sizeClass?: string,
    currindex?: number
  ) {
    if (sizeClass !== undefined) {
      this.modalRef = this.modalService.show(template, { class: sizeClass });
    } else {
      this.modalRef = this.modalService.show(template, { class: "modal-sm" });
    }
    this.currRefNo = this.referenceNumberList[currindex];
    this.currindex = currindex;
  }

  openPreferences(sizeClass?: string, currindex?: number) {
    this.currRefNo = this.referenceNumberList[currindex];
    this.currindex = currindex;
    if (sizeClass !== undefined) {
      this.preferencesComponent.openModal(sizeClass);
    } else {
      this.preferencesComponent.openModal("modal-sm");
    }
  }

  ngOnInit() {
    this.counter = 0;
    const basket = this._storeSvc.getBasketState();
    this._storeSvc.updateIs3DSCrediCardFlag(undefined);
    CommonUtility.removeScript(MPGS_SCRIPT_ID);
    CommonUtility.removeScript("TealiumScript1");
    this.isRT4ModifyFlowEnabled = environment.rt4_modify_flow;
    const basketSummary = this._storeSvc.getBasketState();
    this.derbyTagData = [];
    this.showTaxBreakDown = _.get(
      this._storeSvc.getUserSettingsState(),
      "propertyInfo.showTaxBreakDown"
    );
    this.isTaxbreakdownEnabled = FeatureFlags.isFeatureEnabled("taxbreakdown");
    this._storeSvc.updateGuestInfo("");
    if (
      _.get(basketSummary, "Rooms[0].PaymentInfo.cardType") !==
      PAYMENT_CARD_TYPE.ALI
    ) {
      let index = 0;
      basketSummary.Rooms.forEach((roomObj) => {
        const routeParams = this._activatedRoute.snapshot.queryParams;
        if (
          (routeParams.hasOwnProperty("traffic_source") &&
            routeParams["traffic_source"].toLowerCase() === "derbysoft") ||
          (routeParams.hasOwnProperty("utm_source") &&
            routeParams["utm_source"].toLowerCase() === "derbysoft")
        ) {
          const tagString = CommonUtility.populateDerbyTagData(
            basketSummary,
            window["derbyTagUrl"],
            window["derbysoft_pixel_id"],
            window["derbysoft_account_id"],
            index,
            environment.is_rt4_be
          );
          this.derbyTagData.push(tagString);
          index++;
        }
      });
      const script1 = document.getElementById("TealiumScript1");
        if (script1 === null || script1 === undefined) {
          const defaultCurrencyCode =
            _.get(
              this._storeSvc.getUserSettingsState(),
              "propertyInfo.defaultCurrency"
            ) || "SGD";
          const scriptText1 = CommonUtility.populate_utag_data(
            basketSummary,
            this._storeSvc.getUserSettingsState().langObj,
            defaultCurrencyCode,
            TEALIUM_PAGE_NAMES.booking_confirmation,
            TEALIUM_PAGE_NAMES.booking_confirmation
          );
          const scriptObj1 = {
            id: "TealiumScript1",
            type: "text/javascript",
            innerHTML: scriptText1,
          };
          CommonUtility.loadScript(scriptObj1);
        }
    }

    this._storeSvc.removeErrors(ErrorCodesListInComponents.Confirmation);
    this.showManageBookingFlag = MANAGE_BOOKING_FLAG;
    const urlTree = this.router.parseUrl(this.router.url);
    if (urlTree.root.children["primary"] !== undefined) {
      this.currenturlpath = urlTree.root.children["primary"].segments
        .map((it) => it.path)
        .join("/");
    } else {
      this.currenturlpath = "";
    }
    this.isManagebooking = this._storeSvc.getManageBookingFlowStatus() && this.currenturlpath === URL_PATHS.BOOKING_DETAILS;
    this.preferencesData = [];
    this.defCurrFilter =
      _.get(
        this._storeSvc.getUserSettingsState(),
        "propertyInfo.defaultCurrency"
      ) || "SGD";
    this.defCurrCode = CommonUtility.getCurrSymbolForType(
      this._storeSvc.getUserSettingsState().propertyInfo,
      this.defCurrFilter
    );
    CommonUtility.highlightStep("confirmation");
    // reference number List
    this.referenceNumberList = _.get(
      this._storeSvc.getBasketState(),
      "ReservationResp.ResvConfCodes"
    );
    this.canModify = _.get(
      this._storeSvc.getBasketState(),
      "ReservationResp.canModifyByConfCodes"
    );
    this.failureStatus = _.get(
      this._storeSvc.getBasketState(),
      "ReservationResp.failureStatusByConfCodes"
    );
    this.paymentCurrencyCode = _.get(
      this._storeSvc.getBasketState(),
      "paymentCurrencyCode"
    );
    if (
      _.get(basketSummary, "Rooms[0].PaymentInfo.cardType") !==
        PAYMENT_CARD_TYPE.ALI &&
      this.showManageBookingFlag
    ) {
      // this.checkModifyBookingValidity();
    }
  
    this.referenceNumber = this.referenceNumberList[0] ||
    this._activatedRoute.snapshot.queryParamMap.get("confirmation_code") ||
    this._activatedRoute.snapshot.queryParamMap.get("bookingReference");
    (this.tax = 0), (this.totalPrice = 0), (this.selectedTax = 0);
    this.referenceNumberList.push(this.referenceNumber);

    this.selectedCurrTotalPrice = 0;
    this.selectedCurrCode = "";
    this.apiLookupCode = this._activatedRoute.snapshot.queryParamMap.get(
      "confirmation_code"
    );
    this.isConfirmationPage =
      this._activatedRoute.snapshot.routeConfig.path === "confirmation"
        ? true
        : false;
    if (
      this.isManagebooking &&
      (this.referenceNumber === undefined || this.referenceNumber === null)
    ) {
      this.referenceNumber = this.apiLookupCode;
    }

    this.suppressRateOnLookup = _.get(
      this._storeSvc.getBasketState(),
      "ReservationResp.suppressRateOnLookup"
    );

    // form data
    this.guaranteePercentage = _.get(
      basket.Rooms[0],
      "RatePlan.guaranteePercentage"
    );

    this._sharedDataSubscription = this._storeSvc
      .getBasket()
      .subscribe((sharedData) => {
        if (sharedData.ReservationID === '' && sharedData.Rooms[0].RatePlan.policyGuaranteeType === "Pre Payment/Deposit"){
          this.showDeposite = true;
        } else {
          this.showDeposite = false;
        }
        this.refreshData(sharedData);
        const tempSharedData = sharedData.Rooms[0];
        this.currency = tempSharedData?.CurrencyCode;
      });

    // const addtionalGuests = _.get(this.selectedRoom, "additionalGuests");
    // this.additionalGuestNames = [];
    //  addtionalGuests.forEach(element => {
    //    const guest_name = element.first_name + " " + element.last_name;
    //    this.additionalGuestNames.push({
    //      guestFullName: guest_name
    //     });
    //  });

    this._userSettingsSubscriptions = this._storeSvc
      .getUserSettings()
      .subscribe((sharedData) => {
        this.localeObj = sharedData.localeObj;
        this.propertyType = sharedData.propertyInfo.propertyType;
        if (this.propertyType === "UD") {
          this.UDdisableModify = sharedData.propertyInfo.disableModify;
        }
        const guestSummary = this._storeSvc.getBasketState().GuestSummary;
        this.guestdetailsString = CommonUtility.getGuestDetailsString(
          guestSummary,
          this.localeObj
        );
        this.isIATAPresent =
          sharedData.iata && sharedData.iata.iataNumber ? true : false;
        this.RTL_Flag = CommonUtility.langAlignCheck(this._storeSvc.getUserSettingsState().langObj.code, FeatureFlags);
      });
    this.addonsList = basket.addonTotalCost;
    this.addonTotalCost = 0;
    this.addonTotalTax = 0;
    this.guestCurrencyAddonsTotal = 0;
    this.guestCurrencyAddonsTax = 0;
    this.suppressRateAddonsList = [];
    if (!!this.addonsList[0]?.NOT_SPECIFIED) {
      this.addonsList.forEach((element) => {
        const arr = [];
        element.NOT_SPECIFIED.forEach((value) => {
          this.addonTotalCost += value.preTaxAmount || 0;
          this.guestCurrencyAddonsTotal += value.guestCurrencyPreTaxAmount || 0;
          this.addonTotalTax += value.taxAndServices || 0;
          this.guestCurrencyAddonsTax += value.guestCurrencyTaxAndServices || 0;
          arr.push(value.name);
        });
        const strArr = arr.join(", ").replace(/,(?!.*,)/gim, " and");
        this.suppressRateAddonsList.push(strArr);
      });
    }
    this.selectedRoom = basket.Rooms[0];
    this.selectedRoomList = basket.Rooms;
    this.selectedRoomList.forEach((room) => {
      room.showTaxDetails = _.get(
        this._storeSvc.getUserSettingsState(),
        "propertyInfo.expandTaxBreakDown"
      );
      room.Pricing.DefTax += room.addonDefTax;
    });
    if (
      this.selectedRoom !== undefined &&
      this.selectedRoom.PaymentInfo.cardType === PAYMENT_CARD_TYPE.ALI &&
      !this.isManagebooking
    ) {
      this.fetchDetailsFromConfCode(basket);
    } else if (
      this.selectedRoom !== undefined &&
      this.selectedRoom.PaymentInfo.cardType !== PAYMENT_CARD_TYPE.ALI &&
      !this.isManagebooking
    ) {
      this.updateInfoPage(basket);
    } else if (this.isManagebooking) {
      if (
        this.selectedRoom !== undefined &&
        this.selectedRoom.PaymentInfo.cardType === PAYMENT_CARD_TYPE.ALI &&
        !this.apiLookupCode.includes("MBS")
      ) {
        this.fetchDetailsFromConfCode(basket);
      }
    }
    if (basket.CurrentStep === STEP_MAP[URL_PATHS.SEARCH_PAGE]) {
      this.router
        .navigateByUrl(URL_PATHS.SEARCH_PAGE)
        .then((d) => CommonUtility.highlightStep("search"));
    } else if (basket.CurrentStep === STEP_MAP[URL_PATHS.GUEST_INFO_PAGE]) {
      this._storeSvc.updateCurrentStep(STEP_MAP[URL_PATHS.CONFIRMATION_PAGE]);
    } else if (basket.CurrentStep !== STEP_MAP[URL_PATHS.CONFIRMATION_PAGE]) {
      const rateCode = _.get(basket, "offerCode");
      const guestSummary = basket.guestSummary;
      const params = CommonUtility.getQueryParamObjGuestSummary(
        guestSummary,
        this._storeSvc,
        rateCode
      );
      const navigationExtras = {
        queryParams: params,
      };
      this.router
        .navigate(["/" + URL_PATHS.ROOMS_PAGE], navigationExtras)
        .then((d) => CommonUtility.highlightStep("select-room"));
    }
    this.cancellationObj = [];
    this.cancellationObj[this.apiLookupCode] = {
      cancellationFee: 0,
      bookingSource: "",
      cancellationDate: "",
      guaranteePercentage: 0,
      cancellationReasons: [],
    };

    if (browserRefresh || browserBack) {
      this.redirectToManageBooking(undefined, this.email, this.referenceNumber);
    }

    this.lookupReservationDetails();

    this.transactionID = this._activatedRoute.snapshot.queryParamMap.get(
      "master_confirmationCode"
    );
    /*Empties the roomAttributes & price slider values on reservation confirmation*/ 
    this._storeSvc.setRoomAttributes([]);
    this._storeSvc.setPriceSliderRange([]);

    /**TODO: fetching details is conditiona based on card payment for now,
     * later to be combined when backend is ready supporting card payments */
    // this.tax += this.addonTotalTax || 0;
    // this.selectedTax += this.guestCurrencyAddonsTax || 0;
    // this.totalPrice += this.addonTotalCost + this.addonTotalTax || 0;
    // this.selectedCurrTotalPrice +=
    //   this.guestCurrencyAddonsTotal + this.guestCurrencyAddonsTax || 0;
  }

  ngOnDestroy() {
    if (window["unloadConfirmationPageFunc"]) {
      window["unloadConfirmationPageFunc"]();
    }
    const subscriptionsList = [
      this._userSettingsSubscriptions,
      this._sharedDataSubscription,
      this._confDataSubscription,
      this.reservationLookUpSubscription,
      this.validateModifySubscription,
      this.routerSubscription,
    ];
    CommonUtility.removeSubscriptions(subscriptionsList);
  }

  ngAfterViewInit(): void {
    CommonUtility.scrollIntoViewName("Container");
    CommonUtility.highlightStep("confirmation");
  }

  checkModifyBookingValidity() {
    let emailID = "";
    this.showModifyBooking = [];
    this.showCancelBooking = [];
    const rooms = this._storeSvc.getBasketState().Rooms;
    if (rooms !== undefined && rooms.length > 0) {
      emailID = _.get(rooms[0], "GuestInfo.emailAddress");
    }
    this.referenceNumberList.forEach((referenceNumber) => {
      this.checkIsResvValidForModifyCancel(referenceNumber, false);
    });
  }

  isGuestNameExists(firstName, lastName) {
    if (
        (firstName === undefined && lastName === undefined) ||
        (firstName === null && lastName === null) ||
        ($.trim(firstName).length === 0 && $.trim(lastName).length === 0)
      ) {
        return false;
    } else {
      return true;
    }
  }

  checkIsResvValidForModifyCancel(
    referenceNumber: string,
    isBtnClickEventTriggered: boolean,
    template?: TemplateRef<any>,
    sizeClass?: string,
    currindex?: number
  ) {
    const rooms = this._storeSvc.getBasketState().Rooms;
    let emailID = "";
    if (rooms !== undefined && rooms.length > 0) {
      emailID = _.get(rooms[0], "GuestInfo.emailAddress");
    }
    const params = {
      email: emailID,
      bookingReference: referenceNumber,
    };
    this.reservationLookUpSubscription = this.manageBookingSrv
      .verifyReservation(params)
      .subscribe((data) => {
        const statusCode = _.get(data, "status.statusCode");
        const successFlag = _.get(data, "status.success");
        const dataObj = _.get(data, "data");
        if (
          statusCode !== undefined &&
          successFlag !== undefined &&
          successFlag === false
        ) {
          this.showModifyBooking[referenceNumber] = true;
          this.showCancelBooking[referenceNumber] = true;

          if (isBtnClickEventTriggered) {
            // route to  manage booking
            this.routeToManageBooking(statusCode, emailID, referenceNumber);
          }
        } else if (
          dataObj !== null &&
          dataObj !== undefined &&
          successFlag !== undefined &&
          dataObj.failureStatus !== undefined &&
          statusCode === 1000 &&
          successFlag === true
        ) {
          this.failureStatus[referenceNumber] = dataObj.failureStatus;
          this.totalPriceByCurrency = _.get(data, "totalPriceByCurrency");
          if (dataObj.failureStatus === "00") {
            this.showModifyBooking[referenceNumber] = true;
            this.showCancelBooking[referenceNumber] = true;
          }
          if (dataObj.failureStatus === "01") {
            // hide modify , cancel
            this.showModifyBooking[referenceNumber] = false;
            this.showCancelBooking[referenceNumber] = false;
            // do not show up booking lookup at all
            if (isBtnClickEventTriggered) {
              this.routeToManageBooking(statusCode, emailID, referenceNumber);
            }
          }
          if (dataObj.failureStatus === "02") {
            this.showModifyBooking[referenceNumber] = false;
            this.showCancelBooking[referenceNumber] = false;
            // show booking lookup but do not show modify & cancel
          }
          if (dataObj.failureStatus === "03") {
            this.showModifyBooking[referenceNumber] = true;
            this.showCancelBooking[referenceNumber] = false;
          }
          if (dataObj.failureStatus === "04") {
            this.showModifyBooking[referenceNumber] = false;
            this.showCancelBooking[referenceNumber] = true;
          }
          if (
            (dataObj.failureStatus === "00" ||
              dataObj.failureStatus === "03") &&
            isBtnClickEventTriggered
          ) {
            this.validateForModify(true, false, template, sizeClass, currindex);
          }
        }
      });
  }

  routeToManageBooking(
    statusCode: string,
    emailID?: string,
    bookingNumber?: string
  ) {
    location.href = `/${URL_PATHS.MANAGE_BOOKING}?errorCode=${
      statusCode || ""
    }&email=${emailID}&confirmNum=${bookingNumber}`;
  }

  redirectToManageBooking(
    statusCode: string,
    emailID?: string,
    bookingNumber?: string
  ) {
    location.href = `/${URL_PATHS.MANAGE_BOOKING}?errorCode=${
      statusCode || ""
    }&email=${emailID}&confirmNum=${bookingNumber}`;
  }

  refreshData(sharedData: any) {
    this.currFilter =
      sharedData.CurrencyCode === undefined ? "SGD" : sharedData.CurrencyCode;
    this.suppressRateOnLookup = sharedData.ReservationResp.suppressRateOnLookup;
    if (this.currenturlpath === URL_PATHS.BOOKING_DETAILS) {
      this.addonsList = sharedData.addonTotalCost;
      this.addonTotalCost = 0;
      this.addonTotalTax = 0;
      this.guestCurrencyAddonsTotal = 0;
      this.guestCurrencyAddonsTax = 0;
      this.suppressRateAddonsList = [];
      if (!!this.addonsList[0]?.NOT_SPECIFIED) {
        this.addonsList.forEach((element) => {
          const arr = [];
          let defaultCurrTax = 0;
          element.NOT_SPECIFIED.forEach((value) => {
            this.addonTotalCost += value.preTaxAmount || 0;
            this.guestCurrencyAddonsTotal +=
              value.guestCurrencyPreTaxAmount || 0;
            this.addonTotalTax += value.taxAndServices || 0;
            this.guestCurrencyAddonsTax +=
              value.guestCurrencyTaxAndServices || 0;
            arr.push(value.name);
            if (
              !!!sharedData.Rooms[0]?.RatePlan.taxBreakDown.find(
                (data) => data.code === value.addOnId
              )
            ) {

              defaultCurrTax += value.taxAndServices;
            }
          });
          if (
            !_.find(sharedData.Rooms[0].RatePlan.taxBreakDown, {
              description: "addonsTax",
            }) && defaultCurrTax > 0
          ) {
            const obj = {};
            obj["code"] = ""; //
            obj["description"] = "addonsTax";
            obj[
              "name"
            ] = this.localeObj.tf_5_Confirmation_bookingInfo_otherServicetaxes;
            obj["taxAmount"] = { [this.defCurrFilter]: defaultCurrTax };
            sharedData.Rooms[0].RatePlan.taxBreakDown.push(obj);
          }
          const strArr = arr.join(", ").replace(/,(?!.*,)/gim, " and");
          this.suppressRateAddonsList.push(strArr);
        });
      }

      if (this.currenturlpath === URL_PATHS.BOOKING_DETAILS) {
          this.depositAmount[sharedData.ReservationID] = sharedData.pgAmount;
          this.dueAmount[sharedData.ReservationID] = sharedData.ManageRoomBooking.Pricing.TotalPrice - sharedData.pgAmount;
      }
    }
    if (sharedData.GuestSummary.rooms > 1) {
      this.isMultiRooms = true;
    } else {
      this.isMultiRooms = false;
    }
    if (sharedData.Rooms !== undefined) {
      this.selectedRoom = sharedData.Rooms[0];
      this.selectedRoomList = sharedData.Rooms;
      //  this.roomLength = this.selectedRoomList.length;
      let roomIndex = 0;
      this.preferencesData = [];
      this.selectedRoomList.forEach((room) => {
        this.preferencesData[roomIndex] = [];
        if (
          _.get(room, "GuestPreference") !== undefined &&
          _.get(room, "GuestPreference").length > 0
        ) {
          const prefData = room.GuestPreference;
          let index = 0;
          prefData.forEach((preference) => {
            const pref = {
              questionText: "",
              optionsLabel: "",
              questionType: "",
              showPreference: true,
            };
            pref.questionText = preference.questionText;
            pref.questionType = preference.question_type;
            if (preference.question_type === "freeText") {
              pref.optionsLabel = preference.option_text;
            } else {
              let optFlag = false;
              preference.optionsLabel.forEach((opt) => {
                if (!optFlag) {
                  optFlag = true;
                  pref.optionsLabel = opt;
                } else {
                  pref.optionsLabel = pref.optionsLabel + ", " + opt;
                }
              });
            }
            if (
              preference.preQuestionOptionIds !== undefined &&
              preference.preQuestionOptionIds !== null &&
              preference.preQuestionOptionIds.length > 0
            ) {
              pref.showPreference = preference.preQuestionOptionLabel[0];
            }
            if (pref.showPreference) {
              this.preferencesData[roomIndex][index] = pref;
              index++;
            }
          });
          const timePref = [];
          for (
            let innerIndex = 0;
            innerIndex < this.preferencesData[roomIndex].length;
            innerIndex++
          ) {
            if (
              this.preferencesData[roomIndex][innerIndex].questionType !==
                "freeText" &&
              this.preferencesData[roomIndex][innerIndex].questionType !==
                "single" &&
              this.preferencesData[roomIndex][innerIndex].questionType !==
                "multiple"
            ) {
              timePref.push(this.preferencesData[roomIndex][innerIndex]);
              this.preferencesData[roomIndex].splice(innerIndex, 1);
            }
          }
          for (let innerIndex = 0; innerIndex < timePref.length; innerIndex++) {
            this.preferencesData[roomIndex].push(timePref[innerIndex]);
          }
        }
        roomIndex++;
      });
    }
    this.updateInfoPage(sharedData);
  }

  fetchDetailsFromConfCode(basket: IBasketState) {
    this._confDataSubscription = this.paymentService
      .retrieveReservationByConfCode(this.apiLookupCode)
      .subscribe((data) => {
        if (data) {
          const statuscode = _.get(data, "status.statusCode");
          if (statuscode !== 1000) {
            this._storeSvc.setError(statuscode);
            const rooms = this._storeSvc.getBasketState().Rooms;
            const errorCode = statuscode;
            const userSettingsState = this._storeSvc.getUserSettingsState();
            const langObj = _.get(userSettingsState, "langObj");
            const params = CommonUtility.getGuestInfoQueryParams(
              rooms,
              langObj,
              errorCode
            );
            CommonUtility.setDatalayer({
              error_type: "red-error",
              error_code: errorCode,
              error_description: _.get(data, "status.statusText"),
            });
            const navigationExtras = {
              queryParams: params,
            };
            this._storeSvc.updateCurrentStep(
              STEP_MAP[URL_PATHS.GUEST_INFO_PAGE]
            );
            this.router.navigate(
              ["/" + URL_PATHS.GUEST_INFO_PAGE],
              navigationExtras
            );
          }
          //  this.referenceNumber = data[0].data.confirmationCode;
          // this.confReservationDetails = data[0].data.reservationDetails;
          this.referenceNumberList = [];
          const resData = _.get(data, "data");
          resData.forEach((indvData) => {
            // const roomConfData = indvData.data;
            this.referenceNumberList.push(indvData.confirmationCode);
            if (!this.isMultiRooms) {
              this.referenceNumber = indvData.confirmationCode;
            }
          });
          // if (this.showManageBookingFlag) {
          //   this.checkModifyBookingValidity();
          // }
          // TO DO:: set the canModifyByConfCodes[],failureStatusByConfCodes, CanModify  for each booking
          const reservationRespObj = {
            ResvConfCodes: new Array<string>(),
            ConfirmationPageText: "",
          };
          reservationRespObj["ResvConfCodes"] = this.referenceNumberList;
          if (_.get(resData[0], "reservationDetails.confirmationPageText")) {
            reservationRespObj["ConfirmationPageText"] = _.get(
              resData[0],
              "reservationDetails.confirmationPageText"
            );
          }
          this._storeSvc.updateReservationResponse(reservationRespObj);
          const basketSummary = this._storeSvc.getBasketState();
          let index = 0;
          basketSummary.Rooms.forEach((roomObj) => {
            const routeParams = this._activatedRoute.snapshot.queryParams;
            if (
              (routeParams.hasOwnProperty("traffic_source") &&
                routeParams["traffic_source"].toLowerCase() === "derbysoft") ||
              (routeParams.hasOwnProperty("utm_source") &&
                routeParams["utm_source"].toLowerCase() === "derbysoft")
            ) {
              const tagString =
              CommonUtility.populateDerbyTagData(
                basketSummary,
                window["derbyTagUrl"],
                window["derbysoft_pixel_id"],
                window["derbysoft_account_id"],
                index,
                environment.is_rt4_be
              );
              this.derbyTagData.push(tagString);
              index++;
            }
          });
        const script1 = document.getElementById("TealiumScript1");
        if (script1 === null || script1 === undefined) {
          const defaultCurrencyCode =
            _.get(
              this._storeSvc.getUserSettingsState(),
              "propertyInfo.defaultCurrency"
            ) || "SGD";
          const scriptText1 = CommonUtility.populate_utag_data(
            basketSummary,
            this._storeSvc.getUserSettingsState().langObj,
            defaultCurrencyCode,
            TEALIUM_PAGE_NAMES.booking_confirmation,
            TEALIUM_PAGE_NAMES.booking_confirmation
          );
          const scriptObj1 = {
            id: "TealiumScript1",
            type: "text/javascript",
            innerHTML: scriptText1,
          };
          CommonUtility.loadScript(scriptObj1);
        }
      this.updateInfoPage(basket);
      }
    });
  }

  updateInfoPage(basket: IBasketState) {
    (this.tax = 0), (this.totalPrice = 0), (this.selectedTax = 0);
    this.selectedCurrTotalPrice = 0;
    this.selectedCurrCode = "";
    if (
      _.get(this.selectedRoom, "Packages") &&
      this.selectedRoom.Packages.length > 0
    ) {
      this.addOns = this.selectedRoom.Packages;
    }

    this.objCheckin = basket.GuestSummary;
    const tempSharedData = this.selectedRoom;

    this.ratePlan = _.get(tempSharedData, "RatePlan");
    this.currFilterValue = _.get(basket, "CurrencyCode");

    this.cancellationPolicy = _.get(
      tempSharedData,
      "RatePlan.cancellationPolicy"
    );

    this.currCode = CommonUtility.getCurrSymbolForType(
      this._storeSvc.getUserSettingsState().propertyInfo,
      this.currFilterValue
    );
    const pricingDetail = _.get(this.selectedRoom, "Pricing");

    this.packagePrice = _.get(pricingDetail, "PackagePrice");
    this.addOnTotal = _.get(pricingDetail, "TotalAddonPrice");
    this.selectedRoomList.forEach((element) => {
      element.showTaxDetails = _.get(
        this._storeSvc.getUserSettingsState(),
        "propertyInfo.expandTaxBreakDown"
      );
      this.addonDefTax = 0;
      this.addonFormattedTax = 0;
      if (this.currenturlpath === URL_PATHS.BOOKING_DETAILS) {
        if (!!this.addonsList[element.roomIndex]?.NOT_SPECIFIED) {
          this.addonsList[element.roomIndex].NOT_SPECIFIED.forEach((addon) => {
            this.addonDefTax += addon.taxAndServices || 0;
            this.addonFormattedTax += addon.guestCurrencyTaxAndServices || 0;
          });
        }
      }
      this.tax =
        CommonUtility.roundedValue(this.tax, 2) +
        (_.get(element, "Pricing.DefTax") || 0);
      this.selectedTax =
        CommonUtility.roundedValue(this.selectedTax, 2) +
        (_.get(element, "Pricing.FormattedTax") || 0);
      if (this.currenturlpath === URL_PATHS.BOOKING_DETAILS) {
        this.totalPrice =
          this.totalPrice + _.get(element, "Pricing.DefnTotalPriceWithPackageAddOnTaxesByCurrency") || _.get(element, "Pricing.DefTotalPrice");
        this.selectedCurrTotalPrice =
          this.selectedCurrTotalPrice +
          _.get(element, "Pricing.TotalPriceWithPackageAddOnTaxesByCurrency");
      } else {
        this.totalPrice =
          this.totalPrice +
          ((_.get(element, "Pricing.DefnTotalPriceWithPackageAddOnTaxesByCurrency") || _.get(element, "Pricing.DefTotalPrice")));
        this.selectedCurrTotalPrice =
          this.selectedCurrTotalPrice +
          (_.get(element, "Pricing.TotalPriceWithPackageAddOnTaxesByCurrency") +
            this.guestCurrencyAddonsTotal +
            this.guestCurrencyAddonsTax || 0);
      }
    });

    if (this.currenturlpath != URL_PATHS.BOOKING_DETAILS) {
    this.totalPrice +=  this.addonTotalCost + this.addonTotalTax || 0;
    }
    this.selectedCurrCode = _.get(
      this.selectedRoomList[0],
      "Pricing.CurrencySymbol"
    );
    this.selectedCurrFilter = _.get(
      this.selectedRoomList[0],
      "Pricing.CurrencyCode"
    );
    this.country = _.get(this.selectedRoom, "GuestInfo.countryName");
    this.guestName =
      _.get(this.selectedRoom, "GuestInfo.firstName") +
      " " +
      _.get(this.selectedRoom, "GuestInfo.lastName");

    this.mobileNumber = _.get(this.selectedRoom, "GuestInfo.phoneNumber");
    if (!!this.mobileNumber && this.mobileNumber.length === 0) {
      this.mobileNumberRequired = false;
    } else {
      this.mobileNumberRequired = true;
    }
    this.email = _.get(this.selectedRoom, "GuestInfo.emailAddress");
    this.countryCode = _.get(this.selectedRoom, "GuestInfo.callingCode");
    this.guestTitle = _.get(this.selectedRoom, "GuestInfo.salutation") || "";
    this.guestPreferenceDisclaimer = basket.guestPreferenceDisclaimer;

    // Data-Layer Confirmation
    if (this.currenturlpath === URL_PATHS.CONFIRMATION_PAGE) {
      const basketState = this._storeSvc.getBasketState();

      // For each room reserved an entry will be generated in the quoteList array
      // Each entry in the quoteList array will have quoteObj attributes
      // If you want information at a room-level use the quoteList array or the rtObj
      const quotelist = [];
      for (const room of basketState.Rooms) {
        const quoteObj = {
          confCode: basketState.ReservationResp.ResvConfCodes[room.roomIndex], // Confirmation Number
          r: room.Pricing.PackagePrice, // Room rate without tax
          taxesAndFees: room.Pricing.Tax, // Total taxes and fees
          grandTotal:
            room.Pricing.PackagePrice +
            room.Pricing.Tax +
            room.Pricing.TotalAddonPrice, // Total cost with taxes
          rc: room.RatePlan.code, // Rateplan code
          rt: room.RoomDetails.code, // Room details code
          roomTypeName: room.RoomDetails.name, // Room type
          cc: room.Pricing.CurrencyCode, // Currency Code
          sd: CommonUtility.formateDateTime(
            basketState.GuestSummary.checkindate
          ), // check-in date
          ed: CommonUtility.formateDateTime(
            basketState.GuestSummary.checkoutdate
          ), // check-out date
          na: basketState.GuestSummary.guests[room.roomIndex].adults, // Number of Adults
          nc: basketState.GuestSummary.guests[room.roomIndex].children, // Number of Children
          offer_code: basketState.promoData.accessCode, // Promo/Access code
          numRooms: basketState.Rooms.length, // Number of rooms
          nn: basketState.GuestSummary.los, // Number of nights
          bedType: room.BedTypeName, // Bed Type name
        };
        quotelist.push(quoteObj);

        // rtObj consists of attributes w.r.t to the room reservation index
        const rtObj = {};
        rtObj["rtCONFIRMATIONNUMBER_" + room.roomIndex] =
          basketState.ReservationResp.ResvConfCodes[room.roomIndex]; // Confirmation Number
        rtObj["rtARRIVAL_" + room.roomIndex] = CommonUtility.formateDateTime(
          basketState.GuestSummary.checkindate
        ); // check-in date
        rtObj["rtDEPARTURE_" + room.roomIndex] = CommonUtility.formateDateTime(
          basketState.GuestSummary.checkoutdate
        ); // check-out date
        rtObj["rtNUMNIGHTS_" + room.roomIndex] = basketState.GuestSummary.los; // Number of nights
        rtObj["rtADULTS_" + room.roomIndex] =
          basketState.GuestSummary.guests[room.roomIndex].adults; // Number of Adults
        rtObj["rtCHILDREN_" + room.roomIndex] =
          basketState.GuestSummary.guests[room.roomIndex].children; // Number of Children
        rtObj["rtRATEPLAN_" + room.roomIndex] = room.RoomDetails.code; // Rateplan code
        rtObj["rtROOMTYPE_" + room.roomIndex] = room.RoomDetails.name; // Room type
        rtObj["rtADDONVALUE_" + room.roomIndex] = room.Pricing.TotalAddonPrice; // Addon value
        rtObj["rtTOTALRATE_" + room.roomIndex] = room.Pricing.PackagePrice; // Total room rate
        rtObj["rtTOTALRATEWITHTAXES_" + room.roomIndex] =
          room.Pricing.PackagePrice +
          room.Pricing.Tax +
          room.Pricing.TotalAddonPrice; // Total room rate with tax
        rtObj["rtTAX_" + room.roomIndex] = room.Pricing.Tax; // Total tax
        rtObj["rtADR_" + room.roomIndex] =
          (this.selectedCurrTotalPrice - this.tax) /
          basketState.GuestSummary.los; // Average Daily rate
        CommonUtility.setDatalayer(rtObj);
      }

      // Common attributes for the complete reservation
      CommonUtility.setDatalayer({
        rtTOTALCOSTWITHTAXES: this.selectedCurrTotalPrice, // Total price including taxes
        rtTOTALCOST: this.selectedCurrTotalPrice - this.tax, // Total price excluding taxes
        rtTOTALTAX: this.selectedTax, // Total tax
        rtTOTALNUMNIGHTS: basketState.GuestSummary.los, // Number of nights
        rtTOTALADR:
          (this.selectedCurrTotalPrice - this.tax) /
          basketState.GuestSummary.los, // Average Daily rate
        rtCITY: basketState.Rooms[0].GuestInfo.city, // City
        rtSTATE: basketState.Rooms[0].GuestInfo.state, // State
        rtZIPCODE: basketState.Rooms[0].GuestInfo.postalCode, // Zipcode
        rtCOUNTRY: basketState.Rooms[0].GuestInfo.countryCode, // Country
        rtCURRENCYCODE: basketState.CurrencyCode, // Currency Code
        quoteList: quotelist,
        // Empty error state in data layer, in case of pre existing error
        error_type: "",
        error_code: "",
        error_description: "",
      });

      // Data-Layer Reservation-Modification
      if (this._storeSvc.getManageBookingFlowStatus()) {
        CommonUtility.setDatalayer({
          rtPAGENAME: "ChangeRes_" + CommonUtility.getPageName(),
        });
      }
    }
    // confirmationPageFunc() - Confirmation Page scripts from admin
    if (basket.CurrentStep === STEP_MAP[URL_PATHS.CONFIRMATION_PAGE]) {
      if (window["confirmationPageFunc"]) {
        window["confirmationPageFunc"]();
      }
    }
  }

  routetoroomlisting() {
    // if (this.propertyType !== "RVNG") {
    //   this.modalRef.hide();
    // }
    this.updateRoomDataAndGuestSummaryForManageBooking();
    const guestSummary = this._storeSvc.getBasketState().GuestSummary;
    let errorStatusCode;
    if (guestSummary.restrictionFailed) {
      this._storeSvc.setError(4000);
      errorStatusCode = 4000;
    }
    const offerCode = this._storeSvc.getBasketState().offerCode;
    const params = CommonUtility.getQueryParamObjGuestSummary(
      guestSummary,
      this._storeSvc,
      offerCode,
      errorStatusCode
    );
    const navigationExtras = {
      queryParams: params,
    };
    if (
      _.get(
        this._storeSvc.getUserSettingsState(),
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

  getTranslatedDate(dateStr: string) {
    const dateString = CommonUtility.getTranslatedDate(dateStr, this.localeObj);
    return dateString;
  }

  ifPayAndStay() {
    return CommonUtility.ifPayAndStay(
      _.get(this.cancellationRequiredObj, "guaranteePercentage") ||
        this.guaranteePercentage
    );
  }

  getTransformedDate(dateStr: string) {
    return CommonUtility.getTransformedDateFromDateStr(dateStr, this.localeObj);
  }

  public closeFix(event, popover, target) {
    CommonUtility.toggleTooltip(event, popover, target);
  }

  updateRoomDataAndGuestSummaryForManageBooking() {
    const guestSummary = this._storeSvc.getGuestSummary();
    guestSummary["rooms"] = 1;
    guestSummary["guests"] = [guestSummary["guests"][this.currindex]];
    this._storeSvc.updateGuestDuration(guestSummary);

    const rooms = this._storeSvc.getBasketState().Rooms;
    const currPaymentInfo = _.get(rooms[0], "PaymentInfo");
    const roomObj = rooms[this.currindex];
    roomObj["roomIndex"] = 0;
    // roomObj['GuestPreference'] = [];
    roomObj["PaymentInfo"] = _.cloneDeep(currPaymentInfo);
    const currentRoomSelected = [];
    currentRoomSelected.push(roomObj);
    this._storeSvc.updateMultipleRoomsWithPricing(currentRoomSelected);
    roomObj.Pricing.TotalPriceByCurrency = this.totalPriceByCurrency;
    this._storeSvc.updateManageBooking(roomObj);
    this._storeSvc.updateReservationID(this.currRefNo);
  }

  validateForModify(
    allowModifyBooking,
    isPopupProceedButtonClick?: boolean,
    template?: TemplateRef<any>,
    sizeClass?: string,
    currindex?: number
  ) {
    if (allowModifyBooking) {
      if (isPopupProceedButtonClick) {
        if (this.propertyType === "RVNG") {
          this.currindex = currindex;
          this.currRefNo = this.referenceNumberList[currindex];
        }
        this.routetoroomlisting();
      } else {
        this.openModal(template, sizeClass, currindex);
      }
    }
  }

  // gotRoomListingPage(){
  //   const guestSummary = this._storeSvc.getBasketState().GuestSummary;
  //   let errorStatusCode;
  //   if (guestSummary.restrictionFailed) {
  //     this._storeSvc.setError(4000);
  //     errorStatusCode = 4000;
  //   }
  //   const offerCode = this._storeSvc.getBasketState().offerCode;
  //   const params = CommonUtility.getQueryParamObjGuestSummary(
  //     guestSummary,
  //     this._storeSvc,
  //     offerCode,
  //     errorStatusCode
  //   );
  //   const navigationExtras = {
  //     queryParams: params,
  //   };if (
  //     _.get(
  //       this._storeSvc.getUserSettingsState(),
  //       "propertyInfo.redirectOnModification"
  //     ) === "ROOM"
  //   ) {
  //     this.router
  //       .navigate(["/" + URL_PATHS.ROOMS_PAGE], navigationExtras)
  //       .then((d) => CommonUtility.highlightStep("select-room"));
  //   } else {
  //     this.router.navigate(["/" + URL_PATHS.SEARCH_PAGE], navigationExtras);
  //   }
  // } 

  handleModifyBtnDisplay(refNumber) {
    this.isPgEnabledProperty = _.get(
      this._storeSvc.getUserSettingsState(),
      "propertyInfo.pgenabled"
    );

    if (
        this.isConfirmationPage &&
        this.isRT4ModifyFlowEnabled &&
        this.showModifyBooking[refNumber]
        ) {
          if (this.isPgEnabledProperty &&
            this.isPrepaidBooking) {
              return false;
            } else {
            return true;
          }
      } else {
        return false;
      }
  }

  lookupReservationDetails() {
    this.showModifyBooking = [];
    this.showCancelBooking = [];
    if (this.currenturlpath === URL_PATHS.CONFIRMATION_PAGE) {
      this.routerSubscription = this._activatedRoute.queryParams.subscribe(
        (params) => {
          const rooms = this._storeSvc.getBasketState().Rooms;
          this.referenceNumberList.forEach((referenceNumber) => {
            // this loop is added to get the cancellation details , canModify  for each booking
            this.getReservationLookupApiData(referenceNumber);
          }); // end of foreach(referenceNumberList)
        }
      ); // router subscription
    }
  }

  getReservationLookupApiData(
    referenceNumber: string,
    isToValidateResv?: boolean,
    template?: TemplateRef<any>,
    sizeClass?: string,
    currindex?: number
  ) {
    const options = {
      bookingReference: referenceNumber,
      email: this.email,
    };
    this.cancellationObj[referenceNumber] = {
      cancellationFee: 0,
      bookingSource: "",
      cancellationDate: "",
      guaranteePercentage: 0,
      cancellationReasons: [],
    };
    this.reservationLookUpSubscription = this.manageBookingSrv
      .getReservationLookup(options)
      .subscribe((data) => {
        const statusCode = _.get(data, "status.statusCode");
        const successFlag = _.get(data, "status.success");
        const resData = _.get(data, "data.reservationDetails");
        if (!!resData.pgDepositAmount) {
          this._storeSvc.setPGDepositAmount(resData.pgDepositAmount);
          this.pgDepositAmtAvail = resData.pgDepositAmount;
        }
        this.depositAmount[data.data.confirmationCode] = resData.pgDepositAmount;
        this.dueAmount[data.data.confirmationCode] = resData.totalPrice - resData.pgDepositAmount;
        // this.depositAmount = resData.pgDepositAmount;
        // this.dueAmount = resData.totalPrice -this.depositAmount
        if (!!resData.pgDepositAmount) {
          this._storeSvc.setPGDepositAmount(resData.pgDepositAmount);
          this.pgDepositAmtAvail = resData.pgDepositAmount;
        }

        if (data.data.prepaidBooking !== undefined) {
          this.isPrepaidBooking = data.data.prepaidBooking;
        }

        if (!!resData.pgTransactionId) {
          this.transactionID = resData.pgTransactionId;
        }
        const guestSummary = this._storeSvc.getBasketState().GuestSummary;
        if (guestSummary) {
          guestSummary.checkindate = resData.arrivalDate;
          guestSummary.checkoutdate = resData.departureDate;
          this._storeSvc.updateGuestDuration(guestSummary);
        }
        const oldData = _.get(this._storeSvc.getBasketState(), "oldData");
        if (oldData) {
          oldData.prevRoom = resData.roomType;
          oldData.prevArrivalDate = resData.arrivalDate;
          oldData.prevDepartureDate = resData.departureDate;
          oldData["totaPrice"] = resData.totalPrice;
          this._storeSvc.updateOldData(oldData);
        }
        if (!successFlag) {
          this.showModifyBooking[referenceNumber] = false;
          this.showCancelBooking[referenceNumber] = false;
          this.canModify[referenceNumber] = false;
          if (isToValidateResv) {
            this.routeToManageBooking(statusCode, this.email, referenceNumber);
          }
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
            this.showModifyBooking[referenceNumber] = false;
            this.showCancelBooking[referenceNumber] = false;
            if (isToValidateResv) {
              this.routeToManageBooking(
                statusCode,
                this.email,
                referenceNumber
              );
            }
          } else if (
            statusCode === 1000 ||
            statusCode === 6902 ||
            statusCode === 6903 ||
            statusCode === 6904
          ) {
            if (statusCode === 1000) {
              const resData = _.get(data, "data.reservationDetails");
              this.totalPriceByCurrency = _.get(
                resData,
                "totalPriceByCurrency"
              );
            }
            if (statusCode === 1000) {
              this.showModifyBooking[referenceNumber] = true;
              this.showCancelBooking[referenceNumber] = true;
            }

            if (statusCode === 6903) {
              this.showModifyBooking[referenceNumber] = true;
              this.showCancelBooking[referenceNumber] = false;
            }

            if (statusCode === 6904) {
              this.showModifyBooking[referenceNumber] = false;
              this.showCancelBooking[referenceNumber] = true;
            }

            if (statusCode === 6902) {
              this.showModifyBooking[referenceNumber] = false;
              this.showCancelBooking[referenceNumber] = false;
            }

            if (statusCode === 1000) {
              const resData = _.get(data, "data.reservationDetails");

              // Cancellation Last Date
              if (
                _.get(resData, "cancelWithoutPenaltyDateTime") !== undefined &&
                _.get(resData, "cancelWithoutPenaltyDateTime") !== null &&
                _.get(resData, "cancelWithoutPenaltyDateTime") !== "" &&
                _.get(resData, "cancelWithoutPenaltyDateTime").length > 0
              ) {
                this.cancellationObj[referenceNumber]["cancellationDate"] =
                  resData.cancelWithoutPenaltyDateTime;
              } else {
                this.cancellationObj[referenceNumber]["cancellationDate"] = "";
              }

              // Cancellation Fee Applicable Flag
              if (
                _.get(resData, "cancellationFeeApply") !== undefined &&
                _.get(resData, "cancellationFeeApply") !== null
              ) {
                this.cancellationObj[referenceNumber]["cancellationFeeApply"] =
                  resData.cancellationFeeApply;
              } else {
                this.cancellationObj[referenceNumber][
                  "cancellationFeeApply"
                ] = false;
              }

              // Late Cancellation Fee
              if (
                _.get(resData, "lateCancellationFee") !== undefined &&
                _.get(resData, "lateCancellationFee") !== null
              ) {
                this.cancellationObj[referenceNumber]["cancellationFee"] =
                  resData.lateCancellationFee;
              } else {
                this.cancellationObj[referenceNumber]["cancellationFee"] = 0;
              }

              // Booking Source
              if (
                _.get(resData, "bookingSource") !== undefined &&
                _.get(resData, "bookingSource") !== null
              ) {
                this.cancellationObj[referenceNumber]["bookingSource"] = _.get(
                  resData,
                  "bookingSource"
                );
              } else {
                this.cancellationObj[referenceNumber]["bookingSource"] = "";
              }

              // Guarantee Percentage
              if (
                _.get(resData, "guaranteePercentage") !== undefined &&
                _.get(resData, "guaranteePercentage") !== null
              ) {
                this.cancellationObj[referenceNumber][
                  "guaranteePercentage"
                ] = _.get(resData, "guaranteePercentage");
              } else {
                this.cancellationObj[referenceNumber][
                  "guaranteePercentage"
                ] = 0;
              }

              // Cancellation Reasons
              this.cancellationObj[referenceNumber][
                "cancellationReasons"
              ] = _.get(resData, "cancellationReasons");
              this._storeSvc.fetchAlaCarteAddonsTotal(resData.alaCarteAddOns);
            }
            if (statusCode === 1000 || statusCode === 6903) {
              if (isToValidateResv) {
                if (this.propertyType === "RVNG") {
                  this.validateForModify(
                    true,
                    true,
                    template,
                    sizeClass,
                    currindex
                  );
                } else {
                  // this.validateForModify(
                  //   true,
                  //   false,
                  //   template,
                  //   sizeClass,
                  //   currindex
                  // );
                  this.currindex = currindex;
                  this.routetoroomlisting();
                }
              }
            }
          }
        }
      }); // end of getReservationLookup subscription
  }

  isCancelreservationFailed(msg) {
    this.cancelReserFailed = true;
    this.errorMsg = msg;
  }

  taxBreakDown(index) {
    this.selectedRoomList.forEach((room) => {
      if (room.roomIndex === index) {
        room.showTaxDetails = !room.showTaxDetails;
      }
    });
  }
  
  getMessage(message: string, params: string[]) {
    return CommonUtility.fillMessage(message, params);
  }
}
