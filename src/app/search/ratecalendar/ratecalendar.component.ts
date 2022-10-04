import {
  AfterViewChecked,
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  Renderer2,
} from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { State } from "@ngrx/store";
import * as _ from "lodash";
import { Subscription } from "rxjs";
import { FeatureFlags } from "src/app/common/feature.flags";
import { environment } from "../../../environments/environment";
import {
  DAY_MILLIS,
  ErrorCodesListInComponents,
  MAX_ROOM_SELECTION,
  MONTH_NAMES,
  noOfCalendarMonthsToLoad,
  QUERY_PARAM_ATTRIBUTES,
  RATE_CAL_CURRENCY_CODE,
  RATE_CALENDAR_SETTINGS,
  URL_PATHS,
} from "../../common/common.constants";
import { CommonUtility } from "../../common/common.utility";
import { AvailableRoomRatePlans } from "../../common/models/packagedetails";
import { PromoService } from "../../common/services/promo/promo.service";
import { RatecalendarService } from "../../common/services/ratecalendar/ratecalendar.service";
import { RatePlanListingService } from "../../common/services/ratePlanListing.Service";
import { RoomListingService } from "../../common/services/roomListing.Service";
import { StoreService } from "../../common/services/store.service";
import { CheckinSummary, Guests } from "../guestduration/checkinsummary.type";
import { RateDetail, Rates } from "./rates";
@Component({
  selector: "app-ratecalendar",
  templateUrl: "./ratecalendar.component.html",
  styleUrls: ["./ratecalendar.component.scss"],
})
export class RatecalendarComponent
  implements OnInit, OnDestroy, AfterViewInit, AfterViewChecked {
  public calendarStartOnSunday: boolean;
  private maxSelectionAllowed: number;
  private maxAdultsAllowed: number; // public constant
  private maxChildrenAllowed: number; // public constant
  private maximumOccupancyPerRoom: number;
  private minAdultsAllowed: number; // public constant
  private minChildrenAllowed: number; // public constant

  private defaultNoOfAdultsPerRoom: number; // public constant
  private defaultNoOfChildrenPerRoom: number; // public constant
  private maxNoOfRoomsBookable: number;
  private defualtLos: number;

  public showIATA = false;
  private iataCode: string;
  private isValidIATA = false;
  private iataErrorMessage = "";
  private iataAgencyName = "";
  isCheckIataApivalid: boolean;
  public enableViewAvailabilityBtn = true;

  private accessCode: string;
  private inputFieldAccessCode: string;
  private isAccessCodeInvalid: boolean;
  private accessCodeErrorMsg: string;
  public showAccessCode: boolean;
  public adultAge: any;
  private isAccessCodeModified: boolean;
  private noOfCalendarMonthsToLoad: any;

  @Input("renderingMode") renderingMode = "POPUP";
  @Input("checkinsummary") checkinsummary: CheckinSummary;
  @Input("isPromoDetailsPage") isPromoDetailsPage = false;
  @Input("selectedPromoCode") selectedPromoCode = "";
  @Input() isMultiProp = false;
  @Input("displayRateCal") displayRateCal;
  @Output() noOfAdults;
  @Output() noOfChildren;
  @Output() selectionStartDate: Date;
  @Output() selectionEndDate: Date;
  @Output() checkInSummaryChanged = new EventEmitter<CheckinSummary>();
  @Output() rateCalendarClose = new EventEmitter();
  @Output() checkAvailableUpgrades = new EventEmitter();
  @Output() updatePreference = new EventEmitter();
  @Output() iataErrors = new EventEmitter();
  @Output() accessCodeErrors = new EventEmitter();
  @Output() calCounter = new EventEmitter();
  @Output() multiPropertyCheckInSummaryChanged = new EventEmitter<
    CheckinSummary
  >();
  @Output() checkAvailability = new EventEmitter();

  currencyCode: any;
  componentData: Rates;
  localeObj: any;
  popoverText: any;
  dates: any[] = [];
  weeks: any[] = [];

  private firstTimeDataLoad = true;
  private selectionStarted = false;
  private selectionCount = 0;
  private dayRatesLoaded: boolean;
  public enableRateCalendar = false;
  private currFilterValue: boolean;

  private calanderStartMonth: number;
  private calanderEndMonth: number;
  private endDateRate: string;
  private tempCheckinsummary: CheckinSummary;

  private selectedAfterMinLOS: number;
  private selectedAfterMaxLOS: number;
  private selectedBeforeMaxLOS: number;
  private startAllowedDate: Date;
  private endAllowedDate: Date;

  private scrollActionInProgress = false;
  private _subscription: Subscription;
  public roomSelectionArray: any;
  public showAddRoom: boolean;
  private propertyTimeZoneOffSet: number;
  private maxLeadTime: number;

  private priorAccessCode: string;
  private currentUrlPath: string;
  private selectedRoom: any;
  private selectedRoomData: any;
  private callAvailableRoomsAPI: boolean;
  private offerCode: string;
  private isSpecialRate;
  private restrictionsFailed: boolean;
  private noOfMonthsLoaded: number;
  private calendarRange: number;
  public minCalendarMonths: number;
  private lastDateOfLoadedRates: Date;
  availableRoomRatePlans: AvailableRoomRatePlans = {
    status: "",
    data: [],
    id: "",
  };
  public isPromoOrSpecialsFlow: boolean;

  private _userSettingsSubscriptions: Subscription;
  private routerSubscription: Subscription;
  guestSummary: CheckinSummary;
  private defaultCurrency: string;
  public ratesShownInCurrency: string;
  public isOfferCodeMappedToAccessCode = false;
  public counter: number;
  public RTL_Flag: boolean;
  public checkoutDate: number = 0;
  public updatedCheckoutDate: any;
  public checkinDate: any;
  public refreshRateCalendar: boolean = false;
  public promoCode: any = '';
  calendarFilter: any = [];
  displayCalFilter: boolean;
  propertyType: any;

  constructor(
    private rateCalanderSvc: RatecalendarService,
    private router: Router,
    private _route: ActivatedRoute,
    private ratePlanSrv: RatePlanListingService,
    private state: State<any>,
    private roomListingSrv: RoomListingService,
    private _storeSvc: StoreService,
    private promoSvc: PromoService,
    private renderer: Renderer2
  ) {}

  ngAfterViewInit() {
    if (this.roomSelectionArray.length > this.maxNoOfRoomsBookable) {
      this.roomSelectionArray.splice(
        this.maxNoOfRoomsBookable,
        this.roomSelectionArray.length - this.maxNoOfRoomsBookable
      );
    }
    // CommonUtility.scrollIntoViewName('firstSelectedDate');
    const el = document.querySelector(".firstSelectedDate");
    if (el !== undefined && el !== null) {
      el.parentElement.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      });
    }
  }

  ngOnInit() {
    const userSettings = this._storeSvc.getUserSettingsState();
    this.calendarStartOnSunday =
      _.get(userSettings.propertyInfo, "calendarStartDay") !== "Monday";
    this.showIATA = userSettings.propertyInfo.showIATA;
    this.iataCode = "";
    this.isValidIATA = true;
    this.iataErrorMessage = "";

    this.showAccessCode = userSettings.propertyInfo.showAccessCode;
    this.adultAge = userSettings.propertyInfo.adultAge;
    this.noOfMonthsLoaded = 0;
    this.calendarRange = 0;
    this.minCalendarMonths = 0;
    this.maxAdultsAllowed = 0;
    this.maxChildrenAllowed = 0;
    this.maximumOccupancyPerRoom = 0;
    this.minAdultsAllowed = 0;
    this.minChildrenAllowed = 0;
    this.defaultNoOfAdultsPerRoom = 0;
    this.defaultNoOfChildrenPerRoom = 0;
    this.maxNoOfRoomsBookable = 0;
    this.defualtLos = 0;
    this.maxLeadTime = 0;

    // SET - RateCalendar Defaults
    const rateCalendarDefaults = CommonUtility.getRateCalendarConfigs();

    this.calendarRange = rateCalendarDefaults.maxCalendarRange;
    this.maxSelectionAllowed = rateCalendarDefaults.maxLOS;
    this.minAdultsAllowed = rateCalendarDefaults.minAdults;
    this.minChildrenAllowed = rateCalendarDefaults.minChildren;
    this.maxAdultsAllowed = rateCalendarDefaults.maxAdults;
    this.maxChildrenAllowed = rateCalendarDefaults.maxChildren;
    this.maximumOccupancyPerRoom = rateCalendarDefaults.maxOccupancy;
    this.defaultNoOfAdultsPerRoom = rateCalendarDefaults.defualtAdults;
    this.defaultNoOfChildrenPerRoom = rateCalendarDefaults.defaultChildren;
    this.maxNoOfRoomsBookable = rateCalendarDefaults.maxNoOfRoomsAllowed;
    this.defualtLos = rateCalendarDefaults.defaultLOS;
    this.minCalendarMonths = rateCalendarDefaults.minCalendarRange;
    this.maxLeadTime = rateCalendarDefaults.maxLeadTime;

    this.offerCode = "";
    const prevOfferCode = this._storeSvc.getBasketState().offerCode;
    const prevAccessCode = this._storeSvc.getBasketState().promoData.accessCode;
    this.restrictionsFailed = false;
    this.dayRatesLoaded = false;
    let firstTimeFlag = true;
    this.lastDateOfLoadedRates = null;
    this.checkinsummary = this.state.getValue().basketServiceReducer.GuestSummary;

    this.isSpecialRate =
      this._route.snapshot.queryParams[
        QUERY_PARAM_ATTRIBUTES.IS_SPECIAL_RATE
      ] || false;
    const urlTree = this.router.parseUrl(this.router.url);
    if (urlTree.root.children["primary"] !== undefined) {
      this.currentUrlPath = urlTree.root.children["primary"].segments
        .map((it) => it.path)
        .join("/");
    } else {
      this.currentUrlPath = "";
    }
    if (
      this.currentUrlPath === URL_PATHS.SPECIALS_PAGE ||
      this.currentUrlPath === URL_PATHS.PROMO_PAGE
    ) {
      this.isPromoOrSpecialsFlow = true;
      this.counter = 0;
    } else {
      this.isPromoOrSpecialsFlow = false;
    }

    this.offerCode = prevOfferCode;
    if (prevAccessCode !== undefined) {
      this.accessCode = prevAccessCode;
    } else {
      this.accessCode = "";
    }
    const currentOfferCodeFromSnapShot = this._route.snapshot.queryParams[
      QUERY_PARAM_ATTRIBUTES.OFFERCODE
    ];
    const currentAccessCodeFromSnapShot = this._route.snapshot.queryParams[
      QUERY_PARAM_ATTRIBUTES.ACCESS_CODE
    ];
    if (
      this.currentUrlPath !== URL_PATHS.GUEST_INFO_PAGE &&
      currentOfferCodeFromSnapShot
    ) {
      this.offerCode = currentOfferCodeFromSnapShot;
    }

    if (
      this.currentUrlPath !== URL_PATHS.GUEST_INFO_PAGE &&
      this.isPromoDetailsPage &&
      this.selectedPromoCode !== ""
    ) {
      this.offerCode = this.selectedPromoCode;
    }

    if (
      this.currentUrlPath !== URL_PATHS.GUEST_INFO_PAGE &&
      currentAccessCodeFromSnapShot &&
      !this.isMultiProp
    ) {
      this.accessCode = currentAccessCodeFromSnapShot;
    }
    this._route.queryParams.subscribe((params) => {
      if (prevAccessCode !== "") {
        this.accessCode = prevAccessCode;
      } else {
        this.accessCode = params[QUERY_PARAM_ATTRIBUTES.ACCESS_CODE] || "";
      }
      this.isSpecialRate = params[QUERY_PARAM_ATTRIBUTES.IS_SPECIAL_RATE];
      const currentOfferCodeFromSubscription =
        params[QUERY_PARAM_ATTRIBUTES.OFFERCODE];
      const currentAccessCodeFromSubscription =
        params[QUERY_PARAM_ATTRIBUTES.ACCESS_CODE];
      if (
        this.currentUrlPath !== URL_PATHS.GUEST_INFO_PAGE &&
        currentOfferCodeFromSubscription
      ) {
        this.offerCode = currentOfferCodeFromSubscription;
      }
      if (this.offerCode && this.offerCode !== prevOfferCode) {
        this._storeSvc.updateOfferCode(this.offerCode);
      }
      if (
        this.currentUrlPath !== URL_PATHS.GUEST_INFO_PAGE &&
        currentAccessCodeFromSubscription &&
        !this.isMultiProp
      ) {
        this.accessCode = currentAccessCodeFromSubscription;
      }
      const promoData = {
        priorAccessCode: prevAccessCode,
        accessCode: this.accessCode,
        offerCode: this.offerCode,
        isSpecialRate: this.isSpecialRate,
      };
      this._storeSvc.updatePromoData(promoData);
    });
    this._userSettingsSubscriptions = this._storeSvc
      .getUserSettings()
      .subscribe((sharedData) => {
        this.localeObj = sharedData.localeObj;
        this.popoverText = this.getMessage(this.localeObj.tf_1_Calendar_rateCalender_childrenBedding, [this.adultAge]);
        const iataObj = sharedData.iata;
        this.RTL_Flag = CommonUtility.langAlignCheck(
          this._storeSvc.getUserSettingsState().langObj.code,
          FeatureFlags
        );
        this.propertyType = sharedData.propertyInfo.propertyType || '';
        this.iataErrorMessage = "";
        if (
          this.showIATA &&
          // iataObj.isIataFromQueryParam !== undefined &&
          // !iataObj.isIataFromQueryParam &&
          iataObj.iataNumber !== "" &&
          iataObj.iataNumber !== undefined
        ) {
          if (iataObj.isValidIata) {
            this.isValidIATA = true;
            this.iataErrorMessage = "";
            this.iataCode = iataObj.iataNumber;
            this.enableViewAvailabilityBtn = true;
          } else {
            this.isValidIATA = false;
            this.enableViewAvailabilityBtn = false;
            this.iataErrorMessage = this.localeObj.tf_1_Calendar_roomsGuest_invalidIataError;
          }
        }
        // if (iataObj.isIataFromQueryParam) {
        // auto populate the url iata number into IATA Entry input
        this.iataCode = iataObj.iataNumber;
        // }
        if (this.iataCode === "" || this.iataCode === undefined) {
          this.iataErrorMessage = "";
        }

        this.propertyTimeZoneOffSet = _.get(
          sharedData,
          "propertyInfo.propertyTimezone.timezoneOffset"
        );
        if (this.promoSvc.offerList > 1 && this.isPromoOrSpecialsFlow) {
          this.enableRateCalendar = false;
        } else {
          this.enableRateCalendar = _.get(
            sharedData,
            "propertyInfo.enableRateCalendar"
          );
        }
        /** Start -MultiProperty page :: Disable - rates & restrictions calendar */
        const isSinglePropertyPortal = _.get(
          sharedData,
          "propertyInfo.singlePropertyPortal"
        );
        const multiPropertyInfo = sharedData.multiPropertyInfo;

        if (
          !isSinglePropertyPortal &&
          !multiPropertyInfo.isHotelSelected &&
          multiPropertyInfo.hotelCode === ""
        ) {
          this.enableRateCalendar = false;
        }
        /** End -MultiProperty page :: Disable - rates & restrictions calendar */

        this.maxLeadTime = _.get(sharedData, "propertyInfo.maxLeadTime");
        this.defaultCurrency = _.get(
          sharedData,
          "propertyInfo.defaultCurrency"
        );
        if (
          this._storeSvc.getUserSettingsState().multiPropertyInfo
            .isHotelSelected
        ) {
          this.ratesShownInCurrency = CommonUtility.fillMessage(
            this.localeObj.tf_1_Calendar_rateCalender_ratesShownInCurrency,
            [this._storeSvc.getBasketState().CurrencyCode]
          );
        } else {
          this.ratesShownInCurrency = CommonUtility.fillMessage(
            this.localeObj.tf_1_Calendar_rateCalender_ratesShownInCurrency,
            [this.defaultCurrency]
          );
        }
        if (
          this.maxLeadTime !== undefined &&
          this.maxLeadTime !== null &&
          this.maxLeadTime > 0
        ) {
          this.maxLeadTime = this.maxLeadTime + 1;
        }
        if (
          firstTimeFlag &&
          (this.propertyTimeZoneOffSet === 0 || this.propertyTimeZoneOffSet)
        ) {
          firstTimeFlag = false;
          this.updateView();
        }
      });
    this.roomSelectionArray = [];
    this.showAddRoom = true;
    if (this._storeSvc.getManageBookingFlowStatus()) {
      this.showAddRoom = false;
    } else {
      this.showAddRoom = true;
    }
    this.roomSelectionArray.push({
      noOfAdults: this.defaultNoOfAdultsPerRoom,
      noOfChildren: this.defaultNoOfChildrenPerRoom,
    });

    this.startAllowedDate = undefined;
    this.endAllowedDate = undefined;

    this.currFilterValue = this._storeSvc.getBasketState().CurrencyCode;
    this.currencyCode =
      this._storeSvc.getBasketState().CurrencyCode || RATE_CAL_CURRENCY_CODE;
    this.endDateRate = "";
    this.selectedRoom = this.state.getValue().basketServiceReducer.Rooms;
    if (
      this.checkinsummary !== undefined &&
      this.checkinsummary.checkindate !== undefined
    ) {
      this.roomSelectionArray.pop();
      this.checkinsummary.guests.forEach((element) => {
        let adults = element.adults;
        let children = element.children;
        if (
          element.adults > this.maxAdultsAllowed ||
          element.adults > this.maximumOccupancyPerRoom
        ) {
          adults =
            this.maxAdultsAllowed > this.maximumOccupancyPerRoom
              ? this.maximumOccupancyPerRoom
              : this.maxAdultsAllowed;
        } else if (element.adults < this.minAdultsAllowed) {
          adults = this.minAdultsAllowed;
        }
        if (element.children > this.maxChildrenAllowed) {
          children = this.maxChildrenAllowed;
        } else if (element.children < this.minChildrenAllowed) {
          children = this.minChildrenAllowed;
        }
        if (adults + children > this.maximumOccupancyPerRoom) {
          children = this.maximumOccupancyPerRoom - adults;
        }
        this.roomSelectionArray.push({
          noOfAdults: adults,
          noOfChildren: children,
        });
      });
      if (this.roomSelectionArray.length >= this.maxNoOfRoomsBookable) {
        this.showAddRoom = false;
      }
      // this.updateView();
    }
    this.callAvailableRoomsAPI = true;
    this.accessCode = this._storeSvc.getBasketState().promoData.accessCode;
    this.priorAccessCode = "";
    this._storeSvc.currentCurrency.subscribe(update => {
      if(update) {
        this.updateCurrPrices();
      }
    });
    this.displayCalFilter = location.pathname === '/search' ? true : false;
  }

  ngOnDestroy(): void {
    const subscriptionsList = [
      this._subscription,
      this._userSettingsSubscriptions,
      this.routerSubscription,
    ];
    CommonUtility.removeSubscriptions(subscriptionsList);
    if (window["unloadCalendarFunc"]) {
      window["unloadCalendarFunc"]();
    }
    if (window["unloadCalendarFunc"]) {
      window["unloadCalendarFunc"]();
    }
  }

  ngAfterViewChecked() {
    if (window["calendarFunc"]) {
      if (!window["skipHomeScripts"]) {
        window["calendarFunc"]();
      }
    }
    if (this.dayRatesLoaded) {
      const items = document.querySelectorAll(".dayItem");
      let startDateValid = false;
      let endDateValid = false;
      let invalidDateRangeFlag = false;
      let startDateElement = null;
      let endDateElement = null;
      for (let index = 0; index < items.length; index++) {
        const element = items[index];
        const elDate = new Date(element.getAttribute("data-dayData"));
        const isAvail = element.getAttribute("data-isAvailable");
        const checkInDateFlag = CommonUtility.compareDates(
          elDate,
          this.selectionStartDate
        );
        const checkOutDateFlag = CommonUtility.compareDates(
          elDate,
          this.selectionEndDate
        );
        if (checkInDateFlag >= 0 && checkOutDateFlag <= 0) {
          if (isAvail !== "true") {
            invalidDateRangeFlag = true;
          }
        }
        if (
          checkInDateFlag === 0 &&
          items[index].classList.contains("firstSelectedDate")
        ) {
          startDateValid = true;
          startDateElement = element;
          if (element.classList.contains("checkinNotAllowed")) {
            invalidDateRangeFlag = true;
          }
        }
        if (
          checkOutDateFlag === 0 &&
          items[index].classList.contains("lastSelectedDate")
        ) {
          endDateValid = true;
          endDateElement = element;
          if (element.classList.contains("checkoutNotAllowed")) {
            invalidDateRangeFlag = true;
          }
        }
      }
      if (startDateValid && endDateValid) {
        if (invalidDateRangeFlag) {
          setTimeout(
            () =>
              this.checkSelectedDatesAvailability(
                items,
                startDateElement,
                endDateElement
              ),
            100
          );
        }
        if (
          this.counter === 0 &&
          document.getElementById("checkInDate") !== null
        ) {
          CommonUtility.scrollIntoViewId("checkInDate");
          this.counter++;
          this.calCounter.emit(this.counter);
        }
      }
    }
  }

  checkBasicIATAValidation(iataNumber) {
    const iataNum = iataNumber;
    this.iataCode = iataNum;
    if (!!iataNum && _.trim(iataNum).length > 20) {
      this.isValidIATA = false;
      this.iataErrorMessage = this.localeObj.tf_1_Calendar_roomsGuest_iataMaxLengthError;
    } else {
      this.isValidIATA = true;
      this.iataErrorMessage = "";
    }
    const isMultiPorperty = !_.get(
      this._storeSvc.getUserSettingsState(),
      "propertyInfo.singlePropertyPortal"
    );
    if (this.renderingMode === "INLINE") {
      this.iataErrors.emit({
        iataCode: this.iataCode,
        passedBasicValidation: this.isValidIATA,
      });
    } else {
      if (this.isValidIATA) {
        this.enableViewAvailabilityBtn = true;
        if (isMultiPorperty) {
          const iataObject = _.get(
            this._storeSvc.getUserSettingsState(),
            "iata"
          );
          iataObject.iataNumber = iataNumber;
        }
      } else {
        this.enableViewAvailabilityBtn = false;
      }
    }
  }

  addAccessCode(code: any) {
    if (this.showAccessCode) {
      const currentAccessCode = code.trim();
      this.accessCode = currentAccessCode;
      this.isAccessCodeInvalid = false;
      this.enableViewAvailabilityBtn = true;
      this.priorAccessCode = this._storeSvc.getBasketState().promoData.accessCode;
      const modifiedPromoObject = {
        priorAccessCode: this.priorAccessCode,
        accessCode: currentAccessCode,
      };
      this._storeSvc.updatePromoData(modifiedPromoObject);
    }
  }

  validateAccessCode(isValidAccessCode) {
    if (!isValidAccessCode) {
      this.isAccessCodeInvalid = !isValidAccessCode;
      CommonUtility.scrollIntoViewId("guestDurationInfoDiv", {
        block: "start",
      });
    }
  }

  checkSelectedDatesAvailability(
    items: any,
    startDateElement: any,
    endDateElement: any
  ) {
    const startDate = new Date(startDateElement.getAttribute("data-dayData"));
    for (let index = 0; index < items.length - 1; index++) {
      const element = items[index];
      const elDate = new Date(element.getAttribute("data-dayData"));
      const isAvail = element.getAttribute("data-isAvailable");
      if (
        elDate > startDate &&
        isAvail === "true" &&
        element.getAttribute("data-dayData") !== null
      ) {
        let nextIndex = 0;
        for (nextIndex = index + 1; nextIndex < items.length; nextIndex++) {
          const tempEle = items[nextIndex];
          if (tempEle.getAttribute("data-dayData") !== null) {
            break;
          }
        }
        const nextDateElemet = items[nextIndex];
        const nextEleDate = new Date(
          nextDateElemet.getAttribute("data-dayData")
        );
        const nextDateAvail = nextDateElemet.getAttribute("data-isAvailable");
        if (
          nextDateAvail === "true" &&
          nextDateElemet.getAttribute("data-dayData") !== null
        ) {
          this.selectionStartDate = new Date(
            element.getAttribute("data-dayData")
          );
          this.selectionEndDate = new Date(
            nextDateElemet.getAttribute("data-dayData")
          );
          CommonUtility.removeClassFromElement("partOfSelection");
          CommonUtility.removeClassFromElement("availableForSelection");
          CommonUtility.removeClassFromElement("start-end-date");
          CommonUtility.removeClassFromElement("firstSelectedDate");
          CommonUtility.removeClassFromElement("lastSelectedDate");
          element.classList.add("partOfSelection");
          element.classList.add("firstSelectedDate");
          element.classList.add("start-end-date");
          nextDateElemet.classList.add("partOfSelection");
          nextDateElemet.classList.add("lastSelectedDate");
          nextDateElemet.classList.add("start-end-date");
          if (_.size(this.dates) > 0) {
            this.dates.forEach((ele) => {
              if (ele.dayRate === "Check out") {
                ele.dayRate = this.endDateRate;
                this.endDateRate = "";
              }
            });
          }
          if (_.size(this.dates) > 0) {
            this.dates.forEach((ele) => {
              const dateVal = ele.actualDate;
              if (
                nextEleDate.getDate() === dateVal.getDate() &&
                nextEleDate.getMonth() === dateVal.getMonth() &&
                nextEleDate.getFullYear() === dateVal.getFullYear()
              ) {
                this.endDateRate = ele.dayRate;
                ele.dayRate = "Check out";
              }
            });
          }
          break;
        }
      }
    }
  }

  addNewRoom() {
    if (this.roomSelectionArray.length === this.maxNoOfRoomsBookable) {
      return;
    }
    this.roomSelectionArray.push({
      noOfAdults: this.defaultNoOfAdultsPerRoom,
      noOfChildren: this.defaultNoOfChildrenPerRoom,
    });
    setTimeout(() => {
      $("#adults-field-" + (this.roomSelectionArray.length - 1)).focus();
    }, 10);
    if (this.roomSelectionArray.length === this.maxNoOfRoomsBookable) {
      this.showAddRoom = false;
    }
  }

  removeRoom(index: number) {
    this.roomSelectionArray.splice(index, 1);
    if (
      this.roomSelectionArray.length < this.maxNoOfRoomsBookable &&
      !this.showAddRoom
    ) {
      this.showAddRoom = true;
    }
  }

  // currencyUpdated(sharedData: any) {
  //   this.sharedMemoryData = sharedData;
  // }

  checkDateRestrictions(
    startDate: Date,
    endDate: Date,
    selectedDaysCount: number
  ) {
    let minLos = -1;
    // let maxLos = 9;
    let maxLos = this.maxSelectionAllowed + 1;
    this.dates.forEach((ele) => {
      const flag1 = CommonUtility.compareDates(ele.actualDate, endDate);
      const flag2 = CommonUtility.compareDates(ele.actualDate, endDate);
      if (flag1 >= 0 && flag2 < 0) {
        if (ele.maxLos < maxLos) {
          maxLos = ele.maxLos;
        }
        if (ele.minLos > minLos) {
          minLos = ele.minLos;
        }
      }
    });
    if (selectedDaysCount < minLos || selectedDaysCount > maxLos) {
      this.restrictionsFailed = true;
    } else {
      this.restrictionsFailed = false;
    }
  }

  viewHotelsAvailability() {
    if (this.selectionStarted) {
      this.selectionEndDate = new Date(this.selectionStartDate);
      this.selectionEndDate.setDate(this.selectionEndDate.getDate() + 1);
    }
    const tempSummary = new CheckinSummary(this.propertyTimeZoneOffSet);
    const prevSelectedRooms = this._route.snapshot.queryParamMap.get("Rooms");
    const currentStep = _.get(this._storeSvc.getBasketState(), "CurrentStep");
    if (
      (prevSelectedRooms !== undefined ||
        prevSelectedRooms !== null ||
        +prevSelectedRooms > 0) &&
      currentStep === 0
    ) {
      this.checkinsummary.rooms = undefined;
      this._storeSvc.updateEmptyRooms();
    }
    tempSummary.guests.pop();
    let index = 0;
    this.roomSelectionArray.forEach((element) => {
      tempSummary.guests[index] = new Guests(
        Number(element.noOfAdults),
        Number(element.noOfChildren)
      );
      index++;
    });
    tempSummary.checkindate = this.selectionStartDate;
    tempSummary.checkoutdate = this.selectionEndDate;
    tempSummary.rooms = this.roomSelectionArray.length;

    const diffDays = CommonUtility.getUTCDiffDays(
      tempSummary.checkindate,
      tempSummary.checkoutdate
    );
    tempSummary.los = diffDays;
    this.checkDateRestrictions(
      this.selectionStartDate,
      this.selectionEndDate,
      diffDays
    );

    if (this.restrictionsFailed) {
      tempSummary.restrictionFailed = true;
    }

    let roomsChanged = false;
    let guestsChanged = false;
    let isMultiRooms = false;

    let checkInChanged = false;
    let checkOutChanged = false;

    if (tempSummary.rooms !== Number(this.checkinsummary.rooms)) {
      roomsChanged = true;
      guestsChanged = true;
    }
    if (+tempSummary.checkindate !== +this.checkinsummary.checkindate) {
      checkInChanged = true;
    }
    if (+tempSummary.checkoutdate !== +this.checkinsummary.checkoutdate) {
      checkOutChanged = true;
    }

    if (
      tempSummary.guests.length === Number(this.checkinsummary.guests.length)
    ) {
      index = 0;
      this.checkinsummary.guests.forEach((element) => {
        if (
          Number(element.adults) !== tempSummary.guests[index].adults ||
          Number(element.children) !== tempSummary.guests[index].children
        ) {
          guestsChanged = true;
        }
        index++;
      });
    }

    if (this.showIATA && !this.isPromoOrSpecialsFlow) {
      const iataObject = _.get(this._storeSvc.getUserSettingsState(), "iata");
      if (this.iataCode === "" && iataObject["prevIataNumber"] !== "") {
        iataObject["prevIataNumber"] = iataObject["iataNumber"];
        iataObject["iataNumber"] = this.iataCode;
        iataObject["iataAgencyName"] = "";
        iataObject["isValidIata"] = false;
        iataObject["isIataFromQueryParam"] = false;
        this._storeSvc.updateIATADetails(iataObject);
      }
    }

    if (this.showIATA && !!this.iataCode) {
      const iata = this.iataCode;
      const prevIataCode = this._storeSvc.getUserSettingsState().iata
        .iataNumber;
      if (this.enableViewAvailabilityBtn) {
        // To Do:  CALL checkIATA API
        const iataObject = _.get(this._storeSvc.getUserSettingsState(), "iata");
        this.rateCalanderSvc
          .checkIsValidIATACode(this.iataCode)
          .subscribe((responseData) => {
            if (_.get(responseData.status, "statusCode") === 1000) {
              if (_.get(responseData.data, "isValid") === true) {
                this.enableViewAvailabilityBtn = true;
                this.isValidIATA = true; // pass this to ratecalendar template to show invalid iata message
                this.iataErrorMessage = "";
                this.iataAgencyName = _.get(
                  responseData.data,
                  "iataAgentOrAgencyName"
                );
              } else {
                // this.iataCode = '';
                this.enableViewAvailabilityBtn = false;
                this.isValidIATA = false;
                this.iataAgencyName = "";
                this.isCheckIataApivalid = true;
              }
            } else {
              this.enableViewAvailabilityBtn = false;
              // this.iataCode = '';
              this.isValidIATA = false;
              this.iataAgencyName = "";
              this.isCheckIataApivalid = false;
            }
            iataObject["prevIataNumber"] = iataObject["iataNumber"];
            iataObject["iataNumber"] = this.iataCode;
            iataObject["iataAgencyName"] = this.iataAgencyName;
            iataObject["isValidIata"] = this.isValidIATA;
            iataObject["isIataFromQueryParam"] = false;
            this._storeSvc.updateIATADetails(iataObject);
            if (this.enableViewAvailabilityBtn && this.isValidIATA) {
              this.multiPropertyCheckInSummaryChanged.emit(tempSummary);
            }
          });
      }
    }

    const promoObj = _.get(this._storeSvc.getBasketState(), "promoData");
    const promoData = {
      priorAccessCode: promoObj["priorAccessCode"],
      accessCode: this.accessCode,
      validationState: false,
      offerCode: "",
      isSpecialRate: false,
    };
    this._storeSvc.updatePromoData(promoData);

    if (tempSummary.rooms > 1) {
      isMultiRooms = true;
    }
    if (
      !guestsChanged &&
      !roomsChanged &&
      !checkInChanged &&
      !checkOutChanged
    ) {
      this.rateCalendarClose.emit();
      return;
    } else if (this.iataCode && this.isValidIATA && this.isCheckIataApivalid) {
      this.multiPropertyCheckInSummaryChanged.emit(tempSummary);
    } else if (!this.iataCode) {
      this.multiPropertyCheckInSummaryChanged.emit(tempSummary);
    }
  }

  viewAvailability() {

    if(this.iataCode != ""){
      const iataObject = _.get(this._storeSvc.getUserSettingsState(), "iata");
      iataObject["iataNumber"] = this.iataCode;
    }

    if(location.pathname === "/search") {
      if(this.displayCalFilter && Array.isArray(this.calendarFilter) && this.calendarFilter !== null) {
        this._storeSvc.setRoomAttributes(this.calendarFilter);
      }
      this.checkAvailability.emit();
    } else {

    if (this.showIATA && !this.isPromoOrSpecialsFlow) {
      const iataObject = _.get(this._storeSvc.getUserSettingsState(), "iata");
      if (this.iataCode === "" && iataObject["prevIataNumber"] !== "") {
        iataObject["prevIataNumber"] = iataObject["iataNumber"];
        iataObject["iataNumber"] = "";
        iataObject["iataAgencyName"] = "";
        iataObject["isValidIata"] = false;
        iataObject["isIataFromQueryParam"] = false;
        this._storeSvc.updateIATADetails(iataObject);
      }
    }
    if (this.showIATA && !!this.iataCode && !this.isPromoOrSpecialsFlow) {
      const iata = this.iataCode;
      const prevIataCode = this._storeSvc.getUserSettingsState().iata
        .iataNumber;
      if (this.enableViewAvailabilityBtn) {
        // To Do:  CALL checkIATA API
        const iataObject = _.get(this._storeSvc.getUserSettingsState(), "iata");
        this.rateCalanderSvc
          .checkIsValidIATACode(this.iataCode)
          .subscribe((responseData) => {
            if (_.get(responseData.status, "statusCode") === 1000) {
              if (_.get(responseData.data, "isValid") === true) {
                this.enableViewAvailabilityBtn = true;
                this.isValidIATA = true; // pass this to ratecalendar template to show invalid iata message
                this.iataErrorMessage = "";
                this.iataAgencyName = _.get(
                  responseData.data,
                  "iataAgentOrAgencyName"
                );
              } else {
                // this.iataCode = '';
                this.enableViewAvailabilityBtn = false;
                this.isValidIATA = false;
                this.iataAgencyName = "";
              }
            } else {
              this.enableViewAvailabilityBtn = false;
              // this.iataCode = '';
              this.isValidIATA = false;
              this.iataAgencyName = "";
            }
            iataObject["prevIataNumber"] = iataObject["iataNumber"];
            iataObject["iataNumber"] = this.iataCode;
            iataObject["iataAgencyName"] = this.iataAgencyName;
            iataObject["isValidIata"] = this.isValidIATA;
            iataObject["isIataFromQueryParam"] = false;
            this._storeSvc.updateIATADetails(iataObject); //check code here
            if (
              this.enableViewAvailabilityBtn &&
              this.isValidIATA &&
              this.currentUrlPath !== URL_PATHS.GUEST_INFO_PAGE
            ) {
              const routeParams = this._route.snapshot.queryParams;
              const roomNo = Number(routeParams.Rooms) - 1;
              this.updateCheckingData();
              this.guestSummary = this._storeSvc.getGuestSummary();
              const params = CommonUtility.getQueryParamObjGuestSummary(
                this.guestSummary,
                this._storeSvc,
                routeParams.offerCode
              );
              const navigationExtras = {
                queryParams: params,
              };
              this.router
                .navigate(["/" + URL_PATHS.ROOMS_PAGE], navigationExtras)
                .then((data) => CommonUtility.highlightStep("select-room"));
            } else if (this.enableViewAvailabilityBtn && this.isValidIATA) {
              if (prevIataCode === iata) {
                this.updateCheckingData();
              } else {
                this.selectedRoom = this.state.getValue().basketServiceReducer.Rooms[0];
                const roomCode = [];
                let ratePlanAvailable = false;
                roomCode.push(this.selectedRoom.RoomCode);
                // const rateCode = this.selectedRoom.RatePlan.code
                const rateCode = "";
                this.guestSummary = this._storeSvc.getGuestSummary();
                const routeParams = this._route.snapshot.queryParams;
                const offerCode = "";
                const params = CommonUtility.getQueryParamObjGuestSummary(
                  this.guestSummary,
                  this._storeSvc,
                  // routeParams.offerCode,
                  offerCode
                );
                const navigationExtras = {
                  queryParams: params,
                };
                this.ratePlanSrv
                  .getRatePlanList(roomCode, this.guestSummary, rateCode)
                  .subscribe((response) => {
                    if (response.data === null) {
                      // tslint:disable-next-line: max-line-length
                      this.router
                        .navigate(
                          ["/" + URL_PATHS.ROOMS_PAGE],
                          navigationExtras
                        )
                        .then((data) =>
                          CommonUtility.highlightStep("select-room")
                        );
                    } else {
                      response.data[0].availableRatePlans.filter((e) => {
                        if (e["code"] === rateCode) {
                          ratePlanAvailable = true;
                        }
                      });
                      if (!ratePlanAvailable) {
                        this._storeSvc.setError(3013);
                        // tslint:disable-next-line: max-line-length
                        this.router
                          .navigate(
                            ["/" + URL_PATHS.ROOMS_PAGE],
                            navigationExtras
                          )
                          .then((data) =>
                            CommonUtility.highlightStep("select-room")
                          );
                        this.updateCheckingData();
                      } else {
                        this.updateCheckingData();
                      }
                    }
                  });
              }
            }
          });
      }
    } else if (this.showAccessCode && !this.isPromoOrSpecialsFlow) {
      const code = this.accessCode.trim();
      const prevAccessCode = this._storeSvc.getBasketState().promoData
        .priorAccessCode;
      this.guestSummary = this._storeSvc.getGuestSummary();
      const routeParams = this._route.snapshot.queryParams;
      const roomNo = Number(routeParams.Rooms) - 1;
      if (this.currentUrlPath !== URL_PATHS.GUEST_INFO_PAGE) {
        if (code === "") {
          this.enableViewAvailabilityBtn = true;
          this.updateCheckingData();
          // this.guestSummary = this._storeSvc.getGuestSummary();
          // this.roomListingSrv.getAvailableRoomsDataWithParams(
          //   this.guestSummary,
          //   routeParams.offerCode,
          //   roomNo,
          //   routeParams.multi
          // );

        } else {
          this.rateCalanderSvc
            .validateAccessCode(code)
            .subscribe((response) => {
              if (
                response.status.success === true &&
                response.status.statusCode === 1000
              ) {
                this.isAccessCodeModified = true;
                this.enableViewAvailabilityBtn = true;
                const modifiedPromoObject = {
                  priorAccessCode: this._storeSvc.getBasketState().promoData
                    .priorAccessCode,
                  accessCode: this._storeSvc.getBasketState().promoData
                    .accessCode,
                  validationState: response.status.success,
                };
                this._storeSvc.updatePromoData(modifiedPromoObject);

                if (
                  response.data &&
                  response.data.isAccessCodeWithMultiOffers
                ) {
                  this._storeSvc.updateIsCompoundAccessCode(true);
                } else {
                  this._storeSvc.updateIsCompoundAccessCode(false);
                }
                this.roomListingSrv.getAvailableRoomsDataWithParams(
                  this.guestSummary,
                  routeParams.offerCode,
                  roomNo,
                  routeParams.multi
                );
                this.updateCheckingData();
              } else if (
                response.status.success === false &&
                response.status.statusCode === 6000
              ) {
                this.validateAccessCode(false);
                this.enableViewAvailabilityBtn = false;
                const modifiedPromoObject = {
                  priorAccessCode: this._storeSvc.getBasketState().promoData
                    .priorAccessCode,
                  accessCode: "",
                  validationState: response.status.success,
                };
                this._storeSvc.updatePromoData(modifiedPromoObject);
              }
            });
        }
      } else if (this.currentUrlPath === URL_PATHS.GUEST_INFO_PAGE) {
        if (prevAccessCode === code) {
          this.enableViewAvailabilityBtn = true;
          this.updateCheckingData();
        } else {
          if (code === "") {
            this.enableViewAvailabilityBtn = true;
            const offerCode = "";
            const modifiedPromoObject = {
              priorAccessCode: this._storeSvc.getBasketState().promoData
                .accessCode,
              accessCode: code,
              isSpecialRate: this._storeSvc.getBasketState().isSpecialsFlow,
              validationState: false,
            };
            this._storeSvc.updatePromoData(modifiedPromoObject);
            this.updateCheckingData();
            if (!this._storeSvc.getBasketState().isSpecialsFlow) {
              const params = CommonUtility.getQueryParamObjGuestSummary(
                this.guestSummary,
                this._storeSvc,
                offerCode
              );
              const navigationExtras = {
                queryParams: params,
              };
              this.router
                .navigate(["/" + URL_PATHS.ROOMS_PAGE], navigationExtras)
                .then((data) => CommonUtility.highlightStep("select-room"));
            }
          } else if (!!code) {
            this.rateCalanderSvc
              .validateAccessCode(code)
              .subscribe((response) => {
                if (
                  response.status.success === true &&
                  response.status.statusCode === 1000
                ) {
                  this.isAccessCodeModified = true;
                  this.enableViewAvailabilityBtn = true;
                  const modifiedPromoObject = {
                    priorAccessCode: this._storeSvc.getBasketState().promoData
                      .priorAccessCode,
                    accessCode: this._storeSvc.getBasketState().promoData
                      .accessCode,
                    validationState: response.status.success,
                  };
                  this._storeSvc.updatePromoData(modifiedPromoObject);

                  if (
                    response.data &&
                    response.data.isAccessCodeWithMultiOffers
                  ) {
                    this._storeSvc.updateIsCompoundAccessCode(true);
                  } else {
                    this._storeSvc.updateIsCompoundAccessCode(false);
                  }
                  const promoData = _.get(
                    this._storeSvc.getBasketState(),
                    "promoData"
                  );
                  const userSettingsState = this._storeSvc.getUserSettingsState();
                  if (
                    this.selectedRoom !== undefined &&
                    this.selectedRoom.length > 0 &&
                    ((promoData.priorAccessCode === "" &&
                      promoData.accessCode !== "") ||
                      (promoData.priorAccessCode !== "" &&
                        promoData.priorAccessCode !== promoData.accessCode))
                  ) {
                    // call to promo api
                    const promoApiPayload = {
                      propertyCode: userSettingsState.propertyInfo.propertyCode,
                      arrivalDate: CommonUtility.formateDate(
                        this.guestSummary.checkindate
                      ),
                      departureDate: CommonUtility.formateDate(
                        this.guestSummary.checkoutdate
                      ),
                      numberOfAdults: this.guestSummary.guests[0].adults,
                      numberOfChildren: this.guestSummary.guests[0].children,
                      isSpecialRate: false,
                      accessCode: promoData.accessCode,
                      offerCode: "",
                      locale: userSettingsState.langObj.code,
                      rand: Math.floor(Math.random() * 1000000),
                      currency: this._storeSvc.getBasketState().CurrencyCode
                    };
                    this.promoSvc
                      .getPromoList(promoApiPayload)
                      .subscribe((responseData) => {
                        if (
                          responseData &&
                          _.get(responseData, "status.statusCode") === 1000
                        ) {
                          const availablePromos = responseData;
                          const offerCode = this.selectedRoom[0].RatePlan.code;
                          let offerDetails: any;
                          if (
                            offerCode !== "" &&
                            offerCode !== null &&
                            offerCode !== undefined
                          ) {
                            offerDetails = _.find(
                              availablePromos.data.ratePlanDetails,
                              ["code", offerCode]
                            );
                            const otherBookableOffers = _.find(
                              availablePromos.data.ratePlanDetails,
                              function (o) {
                                return o.code !== offerCode && o.isBookable;
                              }
                            );
                            if (offerDetails && offerDetails.isBookable) {
                              this.isOfferCodeMappedToAccessCode = true;
                            } else {
                              this.isOfferCodeMappedToAccessCode = false;
                            }

                            if (availablePromos.data.ratePlanDetails) {
                              if (
                                availablePromos.data.ratePlanDetails.length ===
                                1
                              ) {
                                this._storeSvc.updateIsCompoundAccessCode(
                                  false
                                );
                              } else {
                                this._storeSvc.updateIsCompoundAccessCode(true);
                              }
                            }

                            this._storeSvc.updateIsSelectedRatePlanAvailable(
                              this.isOfferCodeMappedToAccessCode
                            );
                            if (
                              !!promoData.accessCode &&
                              availablePromos.data.ratePlanDetails.length > 1
                            ) {
                              if (otherBookableOffers) {
                                this._storeSvc.updateOtherCompoundOffersAvailable(
                                  true
                                );
                              } else {
                                this._storeSvc.updateOtherCompoundOffersAvailable(
                                  false
                                );
                              }
                            }
                          }
                          this.updateCheckingData();
                        } else {
                          this.isOfferCodeMappedToAccessCode = false;
                          this._storeSvc.updateIsSelectedRatePlanAvailable(
                            this.isOfferCodeMappedToAccessCode
                          );
                          this.updateCheckingData();
                        }
                      });
                  }
                } else if (
                  response.status.success === false &&
                  response.status.statusCode === 6000
                ) {
                  this.validateAccessCode(false);
                  this.enableViewAvailabilityBtn = false;
                  const modifiedPromoObject = {
                    priorAccessCode: this._storeSvc.getBasketState().promoData
                      .priorAccessCode,
                    accessCode: this._storeSvc.getBasketState().promoData
                      .accessCode,
                    validationState: response.status.success,
                  };
                  this._storeSvc.updatePromoData(modifiedPromoObject);
                }
              });
          }
        }
      }
    } else {
      this.enableViewAvailabilityBtn = true;
      this.updateCheckingData();
    }
   }
  }

  updateCheckingData() {
    if (
      !this.isAccessCodeInvalid &&
      this.showAccessCode &&
      !this.isPromoOrSpecialsFlow
    ) {
      this.enableViewAvailabilityBtn = false;
    }
    if (this.selectionStarted) {
      this.selectionEndDate = new Date(this.selectionStartDate);
      this.selectionEndDate.setDate(this.selectionEndDate.getDate() + 1);
    }
    const tempSummary = new CheckinSummary(this.propertyTimeZoneOffSet);
    const prevSelectedRooms = this._route.snapshot.queryParamMap.get("Rooms");
    const currentStep = _.get(this._storeSvc.getBasketState(), "CurrentStep");
    if (
      (prevSelectedRooms !== undefined ||
        prevSelectedRooms !== null ||
        +prevSelectedRooms > 0) &&
      currentStep === 0
    ) {
      this.checkinsummary.rooms = undefined;
      this._storeSvc.updateEmptyRooms();
    }
    tempSummary.guests.pop();
    let index = 0;
    this.roomSelectionArray.forEach((element) => {
      tempSummary.guests[index] = new Guests(
        Number(element.noOfAdults),
        Number(element.noOfChildren)
      );
      index++;
    });
    tempSummary.checkindate = this.selectionStartDate;
    tempSummary.checkoutdate = this.selectionEndDate;
    tempSummary.rooms = this.roomSelectionArray.length;

    const diffDays = CommonUtility.getUTCDiffDays(
      tempSummary.checkindate,
      tempSummary.checkoutdate
    );
    tempSummary.los = diffDays;
    this.checkDateRestrictions(
      this.selectionStartDate,
      this.selectionEndDate,
      diffDays
    );

    if (this.restrictionsFailed) {
      tempSummary.restrictionFailed = true;
    }

    let roomsChanged = false;
    let guestsChanged = false;
    let isMultiRooms = false;

    let checkInChanged = false;
    let checkOutChanged = false;

    if (tempSummary.rooms !== Number(this.checkinsummary.rooms)) {
      roomsChanged = true;
      guestsChanged = true;
    }
    if (+tempSummary.checkindate !== +this.checkinsummary.checkindate) {
      checkInChanged = true;
    }
    if (+tempSummary.checkoutdate !== +this.checkinsummary.checkoutdate) {
      checkOutChanged = true;
    }

    if (
      tempSummary.guests.length === Number(this.checkinsummary.guests.length)
    ) {
      index = 0;
      this.checkinsummary.guests.forEach((element) => {
        if (
          Number(element.adults) !== tempSummary.guests[index].adults ||
          Number(element.children) !== tempSummary.guests[index].children
        ) {
          guestsChanged = true;
        }
        index++;
      });
    }
    if (tempSummary.rooms > 1) {
      isMultiRooms = true;
    }

    const userSettingsState = this._storeSvc.getUserSettingsState();
    const showIATA = _.get(userSettingsState, "propertyInfo.showIATA");
    const iataObject = _.get(userSettingsState, "iata");
    let isIATACodeChanged = false;
    let checkIATA = true;

    if (
      (iataObject["iataNumber"] === "" ||
        iataObject["iataNumber"] === undefined) &&
      (iataObject["prevIataNumber"] === "" ||
        iataObject["prevIataNumber"] === undefined)
    ) {
      checkIATA = false;
    }
    if (
      showIATA &&
      iataObject["iataNumber"] !== undefined &&
      iataObject["iataNumber"] !== iataObject["prevIataNumber"]
    ) {
      isIATACodeChanged = true;
    }
    const isPromoFlow = this._storeSvc.getBasketState().isPromoFlow;
    const isSpecialsFlow = this._storeSvc.getBasketState().isSpecialsFlow;
    const promoData = _.get(this._storeSvc.getBasketState(), "promoData");
    // const offercode_val = this._route.snapshot.queryParams.offerCode;
    // Promo details / Specials details page update popup without changes should call
    // let isPromoSpecialsDetailsPage = false;
    // if (
    //     (this.router.url.includes("/specials") || this.router.url.includes("/promo") ) &&
    //     !!this._storeSvc.getBasketState().splOfferCode &&
    //     offercode_val
    //   ) {
    //   isPromoSpecialsDetailsPage = true;
    // }

    let isAccessCodeChanged = false;
    if (isPromoFlow || !!this._storeSvc.getBasketState().promoData.accessCode) {
      const bummerObj = {
        accessCodeBummer: this.localeObj
          .tf_2_RoomList_promo_bummer_noAccessCodeOffersAvailableMsg,
        prevRoute: location.pathname,
        displayBummer: false,
      };
      this._storeSvc.updatePromoBummer(bummerObj);
    }

    if (this.showAccessCode) {
      if (
        (promoData.priorAccessCode === "" && promoData.accessCode !== "") ||
        (promoData.priorAccessCode !== undefined &&
          promoData.priorAccessCode !== "" &&
          promoData.priorAccessCode !== promoData.accessCode)
      ) {
        isAccessCodeChanged = true;
      }
    } // end of if (this.showAccessCode)

    if (
      (!guestsChanged &&
        !roomsChanged &&
        !checkInChanged &&
        !checkOutChanged &&
        !isPromoFlow &&
        !showIATA &&
        !this.showAccessCode &&
        !isSpecialsFlow) ||
      (this.showAccessCode &&
        !guestsChanged &&
        !roomsChanged &&
        !checkInChanged &&
        !checkOutChanged &&
        !isAccessCodeChanged &&
        !isIATACodeChanged &&
        !checkIATA &&
        !this.isPromoDetailsPage) ||
      (this.showAccessCode &&
        isAccessCodeChanged &&
        this.isOfferCodeMappedToAccessCode &&
        !guestsChanged &&
        !roomsChanged &&
        !checkInChanged &&
        !checkOutChanged &&
        !isIATACodeChanged &&
        !checkIATA) ||
      (showIATA &&
        checkIATA &&
        !guestsChanged &&
        !roomsChanged &&
        !checkInChanged &&
        !checkOutChanged &&
        !isIATACodeChanged)
    ) {
      this.rateCalendarClose.emit();
      return;
    } else {
      this._storeSvc.removeError(6003);
      this._storeSvc.removeErrors(ErrorCodesListInComponents.RateCalander);
    }
    if (
      this.currentUrlPath === "" ||
      this.currentUrlPath === URL_PATHS.SEARCH_PAGE
    ) {
      this.checkInSummaryChanged.emit(tempSummary);
      this.removeMultiRoomSessionStorage(isMultiRooms);
    } else if (this.currentUrlPath === URL_PATHS.ROOMS_PAGE) {
      if (guestsChanged || roomsChanged || checkInChanged || checkOutChanged) {
        this._storeSvc.updateEmptyRooms();
        this._storeSvc.upsertMultiRoomBookingOrder([]);
        this.renderer.setAttribute(document.body, "data-pageLoaded", "false");
        this.removeMultiRoomSessionStorage(isMultiRooms);
      }
      this.checkInSummaryChanged.emit(tempSummary);
    } else if (
      this.selectedRoom !== undefined &&
      _.size(this.selectedRoom) > 0 &&
      (guestsChanged || roomsChanged)
    ) {
      if (guestsChanged && isMultiRooms) {
        this._storeSvc.updateEmptyRooms();
        this._storeSvc.upsertMultiRoomBookingOrder([]);
        this.removeMultiRoomSessionStorage(isMultiRooms);
      }
      this.checkInSummaryChanged.emit(tempSummary);
      if (this.currentUrlPath !== URL_PATHS.GUEST_INFO_PAGE || roomsChanged) {
        this._storeSvc.updateEmptyRooms();
        this._storeSvc.upsertMultiRoomBookingOrder([]);
        this.removeMultiRoomSessionStorage(isMultiRooms);
      }
      // this.checkInSummaryChanged.emit(tempSummary);
    } else if (
      tempSummary.restrictionFailed &&
      this.currentUrlPath === URL_PATHS.GUEST_INFO_PAGE
    ) {
      this.checkInSummaryChanged.emit(tempSummary);
    } else if (this.currentUrlPath === URL_PATHS.GUEST_INFO_PAGE) {
      // if iata Code modified/added OR if accessCode modified/added then redirect
      // user to room lising page (from checkout page)
      if (this.selectedRoom !== undefined && _.size(this.selectedRoom) > 0) {
        if (
          (this.showAccessCode &&
            isAccessCodeChanged &&
            !this.isOfferCodeMappedToAccessCode) ||
          (showIATA && checkIATA && isIATACodeChanged)
        ) {
          this.checkInSummaryChanged.emit(tempSummary);
        }
      }
      if (
        this.selectedRoom !== undefined &&
        _.size(this.selectedRoom) > 0 &&
        !guestsChanged &&
        !roomsChanged &&
        this.selectedRoom[0] &&
        this.selectedRoom[0].Packages !== undefined &&
        _.size(this.selectedRoom[0].Packages) > 0
      ) {
        this._storeSvc.updatePaymentCurrencyCodeObj(false, "");
        const addOnDate = new Date(this.selectedRoom[0].Packages[0].ShowTime);
        addOnDate.setHours(tempSummary.checkindate.getHours());
        addOnDate.setMinutes(tempSummary.checkindate.getMinutes());
        addOnDate.setSeconds(tempSummary.checkindate.getSeconds());
        const flag1 = CommonUtility.compareDates(
          addOnDate,
          tempSummary.checkindate
        );
        const flag2 = CommonUtility.compareDates(
          addOnDate,
          tempSummary.checkoutdate
        );
        if (!(flag1 >= 0 && flag2 < 0)) {
          // this._storeSvc.setError(3001);
          this._storeSvc.updateEmptyRooms();
          this._storeSvc.upsertMultiRoomBookingOrder([]);
          this.checkInSummaryChanged.emit(tempSummary);
          return;
        }
      }
      let bedTypeFound = false;
      let ratePlansFound = false;
      let ratePlanFound = false;
      const roomCodes = [];
      if (this.selectedRoom.length > 0) {
        if (isMultiRooms) {
          // let isFirst = true;
          _.forEach(this.selectedRoom, (room) => {
            roomCodes.push(room.UniqueCode);
            // if (!isFirst) {
            //   roomCodes = roomCodes + ',' + room.UniqueCode;
            // } else {
            //   isFirst = false;
            //   roomCodes = room.UniqueCode;
            // }
          });
        } else {
          roomCodes.push(this.selectedRoom[0].UniqueCode);
        }
        this._storeSvc.updateRateCalModifyFlag(true);
        const tmpSubscription = this.ratePlanSrv
          .getRatePlanList(roomCodes, tempSummary)
          .subscribe((ratePlanData) => {
            if (tmpSubscription !== undefined) {
              tmpSubscription.unsubscribe();
            }
            this.availableRoomRatePlans = ratePlanData as AvailableRoomRatePlans;
            if (
              this.availableRoomRatePlans.data &&
              this.availableRoomRatePlans.data.length > 0
            ) {
              ratePlansFound = true;
              if (isMultiRooms) {
                const ratePlanRoomsMap = CommonUtility.consolidateRatePlansforMultiRoom(
                  this.availableRoomRatePlans,
                  tempSummary.rooms,
                  tempSummary,
                  this._storeSvc
                );
                let selectedRatePlan;
                ratePlanRoomsMap.forEach((element) => {
                  if (
                    element.ratePlan.code === this.selectedRoom[0].RatePlan.code
                  ) {
                    ratePlanFound = true;
                    bedTypeFound = true;
                    selectedRatePlan = element.rooms;
                  }
                });
                const availableRooms = this.roomListingSrv
                  .getAvailableRoomsDataWithParams(tempSummary, this.offerCode)
                  .subscribe((roomsList) => {
                    if (availableRooms !== undefined) {
                      availableRooms.unsubscribe();
                    }
                    const roomsData = [];
                    index = 0;
                    this.selectedRoom.forEach((room) => {
                      roomsData[index] = [];
                      let ratePlan;
                      roomsList.data.availableRooms.forEach((element) => {
                        element.bedTypes.forEach((bedtype) => {
                          if (bedtype.roomCode === room.UniqueCode) {
                            if (
                              ratePlanFound &&
                              selectedRatePlan !== undefined
                            ) {
                              selectedRatePlan.forEach((ele) => {
                                if (ele.roomCode === room.UniqueCode) {
                                  ratePlan = ele.ratePlan;
                                }
                              });
                            }
                            room.RoomDetails = element;
                            room.RatePlan = ratePlan;
                            room.Pricing = undefined;
                            roomsData[index] = room;
                          }
                        });
                      });
                      index++;
                    });
                    const roomBookingOrder = [];
                    index = 0;
                    roomsData.forEach((ele) => {
                      if (
                        ele === undefined ||
                        ele === null ||
                        ele.length === 0
                      ) {
                        roomBookingOrder.push(index);
                      }
                      index++;
                    });
                    if (
                      roomBookingOrder !== undefined &&
                      roomBookingOrder.length > 0
                    ) {
                      bedTypeFound = false;
                    } else {
                      bedTypeFound = true;
                    }
                    this._storeSvc.upsertMultiRoomBookingOrder(
                      roomBookingOrder
                    );
                    this._storeSvc.updateMultipleRoomsWithPricing(roomsData);
                    this.checkAvailableUpgrades.emit();
                    this.updatePreference.emit();
                    this.rateCalendarClose.emit();
                  });
              } else {
                this.availableRoomRatePlans.data.forEach((bedTypeRatePlan) => {
                  if (
                    bedTypeRatePlan.bedTypeCode === this.selectedRoom[0].BedType
                  ) {
                    bedTypeFound = true;
                    bedTypeRatePlan.availableRatePlans.forEach((ratePlan) => {
                      if (
                        ratePlan.code === this.selectedRoom[0].RatePlan.code
                      ) {
                        ratePlanFound = true;
                        if (ratePlanFound) {
                          const availableRooms = this.roomListingSrv
                            .getAvailableRoomsDataWithParams(
                              tempSummary,
                              this.offerCode
                            )
                            .subscribe((roomsList) => {
                              if (availableRooms !== undefined) {
                                availableRooms.unsubscribe();
                              }
                              if (this.selectedRoom.length > 1) {
                              }
                              roomsList.data.availableRooms.forEach(
                                (element) => {
                                  element.bedTypes.forEach((bedtype) => {
                                    if (
                                      bedtype.roomCode ===
                                      this.selectedRoom[0].UniqueCode
                                    ) {
                                      this.selectedRoom[0].RatePlan = ratePlan;
                                      this.selectedRoom[0].RatePlan.searchTransactionId =
                                        bedTypeRatePlan["searchTransactionId"];
                                      this.selectedRoom[0].RatePlan.marketingConsent =
                                        bedTypeRatePlan["marketingConsent"];
                                      this.selectedRoom[0].Pricing = undefined;
                                      this.selectedRoom[0].RoomDetails = element;
                                      this._storeSvc.updateMultipleRoomsWithPricing(
                                        this.selectedRoom
                                      );
                                      this.checkAvailableUpgrades.emit();
                                      this.updatePreference.emit();
                                      this.rateCalendarClose.emit();
                                    }
                                  });
                                }
                              );
                            });
                        }
                      }
                    });
                  }
                });
              }

              if (!ratePlansFound || !bedTypeFound || !ratePlanFound) {
                if (!ratePlansFound || !bedTypeFound) {
                  this._storeSvc.setError(3000);
                } else {
                  this._storeSvc.setError(3001);
                }

                this._storeSvc.updateEmptyRooms();
                this._storeSvc.upsertMultiRoomBookingOrder([]);
                this.checkInSummaryChanged.emit(tempSummary);
              }
            } else {
              // this._storeSvc.setError(3000);
              // this._storeSvc.updateEmptyRooms();
              // this._storeSvc.upsertMultiRoomBookingOrder([]);
              this.checkInSummaryChanged.emit(tempSummary);
            }
          });
      } else {
        this._storeSvc.setError(3000);
        this._storeSvc.updateEmptyRooms();
        this._storeSvc.upsertMultiRoomBookingOrder([]);
        this.checkInSummaryChanged.emit(tempSummary);
      }
    } else if (this.callAvailableRoomsAPI === true) {
      // this._storeSvc.setError(3000);
      this._storeSvc.updateEmptyRooms();
      this._storeSvc.upsertMultiRoomBookingOrder([]);
      if (this.router.url.includes("/specials")) {
        this.promoSvc.currentFlow = true;
      }
      this.checkInSummaryChanged.emit(tempSummary);
    }
    if (this.router.url.includes("/specials")) {
      this.promoSvc.currentFlow = true;
    }
    this._storeSvc.updateGuestDuration(tempSummary);
    this._storeSvc.updateRoomType(
      this.localeObj.tf_2_RoomList_rooms_primaryRoomAttribute
    );
    this._storeSvc.updateRoomView(
      this.localeObj.tf_2_RoomList_roomListFilters_secondaryRoomAttribute
    );
  }

  updateView() {
    const propertyTimeZoneDate = CommonUtility.getCurrentDateFromPropertyTimeZone(
      this.propertyTimeZoneOffSet
    );
    const prevSelectedRooms = this._route.snapshot.queryParamMap.get("Rooms");
    this.tempCheckinsummary = Object.create(this.checkinsummary);
    if (
      CommonUtility.compareDates(
        this.tempCheckinsummary.checkindate,
        propertyTimeZoneDate
      ) < 0
    ) {
      this.tempCheckinsummary.checkindate = new Date(
        propertyTimeZoneDate.getFullYear(),
        propertyTimeZoneDate.getMonth(),
        propertyTimeZoneDate.getDate()
      );
      this.tempCheckinsummary.checkoutdate = new Date(
        propertyTimeZoneDate.getFullYear(),
        propertyTimeZoneDate.getMonth(),
        propertyTimeZoneDate.getDate() + this.defualtLos
      );
    }
    if (this.currentUrlPath === URL_PATHS.SEARCH_PAGE) {
      if (
        CommonUtility.compareDates(
          this.tempCheckinsummary.checkindate,
          propertyTimeZoneDate
        ) > 0
      ) {
        if (prevSelectedRooms === undefined || prevSelectedRooms === null) {
          this.tempCheckinsummary.checkindate = new Date(
            propertyTimeZoneDate.getFullYear(),
            propertyTimeZoneDate.getMonth(),
            propertyTimeZoneDate.getDate()
          );
          this.tempCheckinsummary.checkoutdate = new Date(
            propertyTimeZoneDate.getFullYear(),
            propertyTimeZoneDate.getMonth(),
            propertyTimeZoneDate.getDate() + this.defualtLos
          );
        }
      }
    }
    if (this.tempCheckinsummary.guests[0].adults !== undefined) {
      this.noOfAdults = this.tempCheckinsummary.guests[0].adults;
    }
    if (this.tempCheckinsummary.guests[0].children !== undefined) {
      this.noOfChildren = this.tempCheckinsummary.guests[0].children;
    }

    if (this.tempCheckinsummary.checkindate !== undefined) {
      this.selectionStartDate = this.tempCheckinsummary.checkindate;
    }

    if (this.tempCheckinsummary.checkoutdate !== undefined) {
      this.selectionEndDate = this.tempCheckinsummary.checkoutdate;
    }

    this._subscription = this.rateCalanderSvc.calanderRates.subscribe(
      (data) => {
        if (this.firstTimeDataLoad) {
          this.firstTimeDataLoad = false;
          this.componentData = Object.create(data);
          this.componentData.currencyIndex = 0; // hard coded for now.
          this.componentData.currencyCode =
            CommonUtility.getCurrSymbolForType(
              this._storeSvc.getUserSettingsState().propertyInfo,
              this.componentData.currencyCodes[0]
            ) || this.componentData.currencyCodes[0];

          this.currencyCode = this._storeSvc.getBasketState().CurrencyCode.code;

          if (this.currencyCode) {
            this.componentData.currencyIndex = this.componentData.currencyCodes.indexOf(
              this.currencyCode
            );
            this.componentData.currencyCode = this.currencyCode;
            this.componentData.currencyCode = CommonUtility.getCurrSymbolForType(
              this._storeSvc.getUserSettingsState().propertyInfo,
              this.currencyCode
            );
          }
          // this.initializeDateArray();
        } else {
          this.scrollActionInProgress = false;
          if (
            data !== undefined &&
            data.rates !== undefined &&
            data.rates.length > 0
          ) {
            const itemsToAdd = Object.create(data);
            itemsToAdd.rates.forEach((rateItem) =>
              this.componentData.rates.push(rateItem)
            );
          }
          // this.loadNextMonth();
        }
        this.applyRatesToCalander();
      }
    );

    this.initializeDateArray();
    this.loadRatesFromServer();
  }
  getMessage(message: string, params: string[]) {
    return CommonUtility.fillMessage(message, params);
  }
  applyRatesToCalander() {
    this.scrollActionInProgress = false;
    this.dates.forEach((objData) => {
      const dayData = this.getDay(objData.date);
      if (dayData !== undefined) {
        if (objData.dayRate === "Check out") {
          this.endDateRate = dayData.dayRate;
        } else {
          objData.dayRate = dayData.dayRate;
        }
        objData.currCode = this.componentData.currencyCode;
        objData.isAvailable = dayData.available;

        objData.minLos = dayData.minLos;
        objData.maxLos = dayData.maxLos;

        if (objData.maxLos === undefined) {
          objData.maxLos = this.maxSelectionAllowed;
        }
        if (!objData.isAvailable) {
          objData.customCss = objData.customCss + " notAvailableDate";
        }

        if (!objData.isAvailable && dayData.isClosedToArrival && !dayData.isClosedToDeparture) {
          objData.customCss = objData.customCss.replace("notAvailableDate", '');
        }

        if (!objData.isAvailable && dayData.dayRates === null && !dayData.isClosedToDeparture) {
          objData.customCss = objData.customCss.replace("notAvailableDate", '');
          objData.customCss = objData.customCss + " checkOutAllowed";
        }

        if (
          objData.actualDate < this.startAllowedDate ||
          objData.actualDate > this.endAllowedDate
        ) {
          objData.customCss = objData.customCss + " notPartOfSelection";
        }

        if (dayData.isClosedToArrival) {
          objData.customCss = objData.customCss + " checkinNotAllowed";
        }
        if (dayData.isClosedToDeparture) {
          objData.customCss = objData.customCss + " checkoutNotAllowed";
          objData.customCss = objData.customCss.replace("checkOutAllowed", '');
        }
        if (!objData.isAvailable && dayData.dayRates === null && dayData.isClosedToDeparture  && dayData.isClosedToArrival) {
          objData.customCss = objData.customCss + " notAvailableDate";
          objData.customCss = objData.customCss.replace("checkOutAllowed", '');
          objData.customCss = objData.customCss.replace("checkinNotAllowed", '');
          objData.customCss = objData.customCss.replace("checkoutNotAllowed", '');
        }
        if(objData.isAvailable && dayData.dayRates !== null && !dayData.isClosedToDeparture  && !dayData.isClosedToArrival){
          objData.customCss = objData.customCss.replaceAll("notAvailableDate", "");
        }
        if(!objData.isAvailable && dayData.dayRates === null && !dayData.isClosedToDeparture  && !dayData.isClosedToArrival) {
          objData.customCss = objData.customCss.replaceAll("notAvailableDate", "");
        }
        if((objData.customCss.includes("firstSelectedDate") && objData.customCss.includes("start-end-date") && this.formateDate(this.tempCheckinsummary.checkindate) !== dayData.date) ||
        (objData.customCss.includes("lastSelectedDate") && objData.customCss.includes("start-end-date") && this.formateDate(this.tempCheckinsummary.checkoutdate) !== dayData.date)
        ) {
          objData.customCss = objData.customCss.includes("firstSelectedDate") ? objData.customCss.replaceAll("firstSelectedDate", "") :  objData.customCss.replaceAll("lastSelectedDate", "");
          objData.customCss = objData.customCss.replaceAll("start-end-date", "");
          objData.customCss = objData.customCss.replaceAll("partOfSelection", "");
        }

      }
    });
    this.dayRatesLoaded = true;
    // setTimeout(() => this.removeAppliedStylesIfNotAvailable(), 0);
  }

  // refreshView() {
  //   this.tempCheckinsummary.checkindate.setMonth(this.tempCheckinsummary.checkindate.getMonth() - 1);
  //   this.tempCheckinsummary.checkoutdate.setMonth(this.tempCheckinsummary.checkoutdate.getMonth() - 1);
  //   if (this.tempCheckinsummary.checkindate <= new Date()) {
  //     this.tempCheckinsummary.checkindate.setDate(new Date().getDate() + 1);
  //   }
  //   this.initializeDateArray();
  //   this.loadRatesFromServer();
  // }

  loadRatesFromServer(
    nextMonthFlag = false,
    pStartDate = new Date(),
    pEndDate = new Date(),
    filterVal = {},
  ) {
    if (nextMonthFlag) {
      let params: any;
      if (this.currentUrlPath === URL_PATHS.GUEST_INFO_PAGE) {
        params = {
          startDate: this.formateDate(pStartDate),
          endDate: this.formateDate(pEndDate),
          adults: this.checkinsummary.guests[0].adults,
          children: this.checkinsummary.guests[0].children,
          rateCode: "BAR",
          currency: this._storeSvc.getBasketState().CurrencyCode
          // customTimeout: 1000,
        };
      } else {
        params = {
          startDate: this.formateDate(pStartDate),
          endDate: this.formateDate(pEndDate),
          adults: this.checkinsummary.guests[0].adults,
          children: this.checkinsummary.guests[0].children,
          rateCode: "BAR",
          offerCode: this.offerCode, // ,
          currency: this._storeSvc.getBasketState().CurrencyCode
          // customTimeout: 1000,
        };
        params["currency"] = this._storeSvc.getBasketState().CurrencyCode;
        params[QUERY_PARAM_ATTRIBUTES.ACCESS_CODE] = this._storeSvc.getBasketState().promoData.accessCode;
        params[QUERY_PARAM_ATTRIBUTES.VALIDATE_IATA_API_PARAM] = this._storeSvc.getUserSettingsState().iata.iataNumber;
        if(Object.keys(filterVal).length > 0) {
          params = {...params, ...filterVal};
        }
        if(this._storeSvc.getBasketState().roomAttributes.length > 0 && Object.keys(filterVal).length === 0){
          const val = {};
          val["attributes"] = this.rateCalendarParam();
          params = {...params, ...val};
        }
      }

      if (this.enableRateCalendar) {
        this.rateCalanderSvc.getRoomRates(params);
      }
    } else {
      const tempDate = CommonUtility.getCurrentDateFromPropertyTimeZone(
        this.propertyTimeZoneOffSet
      );
      const startDate = new Date(
        tempDate.getFullYear(),
        tempDate.getMonth(),
        tempDate.getDate()
      );
      this.noOfCalendarMonthsToLoad = this.minCalendarMonths
        ? this.minCalendarMonths
        : noOfCalendarMonthsToLoad;
      let monthsToLoad = this.noOfCalendarMonthsToLoad;
      if (this.calendarRange - this.noOfMonthsLoaded < monthsToLoad) {
        monthsToLoad = this.calendarRange - this.noOfMonthsLoaded;
      }
      // startDate.setDate(1);
      const endDate = new Date(
        startDate.getFullYear(),
        startDate.getMonth(),
        1
      );
      endDate.setMonth(endDate.getMonth() + monthsToLoad);
      endDate.setDate(0);
      this.noOfMonthsLoaded = monthsToLoad;
      const checkOutDate = this.checkinsummary.checkoutdate;
      const checkOutDateUTC = CommonUtility.getUTCFromDate(checkOutDate);
      const startDateUTC = CommonUtility.getUTCFromDate(startDate);
      const difference_ms = Math.abs(checkOutDateUTC - startDateUTC);
      const monthDiff = Math.ceil(difference_ms / (DAY_MILLIS * 30));
      if (monthDiff >= this.minCalendarMonths) {
        endDate.setDate(1);
        endDate.setFullYear(this.checkinsummary.checkoutdate.getFullYear());
        endDate.setMonth(this.checkinsummary.checkoutdate.getMonth() + 1);
        endDate.setDate(0);
      }

      let params: any;
      if (this.currentUrlPath === URL_PATHS.GUEST_INFO_PAGE) {
        params = {
          startDate: this.formateDate(startDate),
          endDate: this.formateDate(endDate),
          adults: this.checkinsummary.guests[0].adults,
          children: this.checkinsummary.guests[0].children,
          rateCode: "BAR",
          // customTimeout: 1000,
        };
      } else {
        params = {
          startDate: this.formateDate(startDate),
          endDate: this.formateDate(endDate),
          adults: this.checkinsummary.guests[0].adults,
          children: this.checkinsummary.guests[0].children,
          rateCode: "BAR",
          offerCode: this.offerCode,
          currency: this._storeSvc.getBasketState().CurrencyCode,
          // customTimeout: 1000,
        };
        params["currency"] = this._storeSvc.getBasketState().CurrencyCode;
        params[QUERY_PARAM_ATTRIBUTES.ACCESS_CODE] = this._storeSvc.getBasketState().promoData.accessCode;
        params[QUERY_PARAM_ATTRIBUTES.VALIDATE_IATA_API_PARAM] = this._storeSvc.getUserSettingsState().iata.iataNumber;
        if(Object.keys(filterVal).length > 0) {
          params = {...params, ...filterVal};
        }
        if(this._storeSvc.getBasketState().roomAttributes.length > 0 && Object.keys(filterVal).length === 0){
          const val = {};
          val["attributes"] = this.rateCalendarParam();
          params = {...params, ...val};
        }
      }

      this.lastDateOfLoadedRates = CommonUtility.setDateValue(
        endDate.getFullYear(),
        endDate.getMonth(),
        endDate.getDate()
      );
      if (this.enableRateCalendar) {
        this.rateCalanderSvc.getRoomRates(params);
      }
    }
    this.promoCode = this.accessCode;
    this.refreshRateCalendar = false;
  }

  formateDate(dateToFormat: Date): string {
    return (
      dateToFormat.getFullYear() +
      "-" +
      ("00" + (dateToFormat.getMonth() + 1).toString()).slice(-2) +
      "-" +
      ("00" + dateToFormat.getDate().toString()).slice(-2)
    );
  }

  addDays(srcDate: Date, daysToAdd: number): Date {
    const newDate = new Date(srcDate);
    newDate.setDate(newDate.getDate() + daysToAdd);
    return newDate;
  }

  updateAdultCount(flag: number, index: number) {
    const adults = Number(this.roomSelectionArray[index].noOfAdults) + flag;
    if (adults < this.minAdultsAllowed) {
      this.roomSelectionArray[index].noOfAdults = this.minAdultsAllowed;
    } else if (
      adults + this.roomSelectionArray[index].noOfChildren <=
        this.maximumOccupancyPerRoom &&
      adults <= this.maxAdultsAllowed
    ) {
      this.roomSelectionArray[index].noOfAdults = adults;
    }
  }

  changeAdultCount(index: number) {
    if (isNaN(this.roomSelectionArray[index].noOfAdults)) {
      this.roomSelectionArray[index].noOfAdults = this.defaultNoOfAdultsPerRoom;
    } else {
      if (this.roomSelectionArray[index].noOfAdults < this.minAdultsAllowed) {
        this.roomSelectionArray[index].noOfAdults = this.minAdultsAllowed;
      }
      if (this.roomSelectionArray[index].noOfAdults > this.maxAdultsAllowed) {
        this.roomSelectionArray[index].noOfAdults = this.maxAdultsAllowed;
      }
    }
  }

  updateChildCount(flag: number, index: number) {
    const children = Number(this.roomSelectionArray[index].noOfChildren) + flag;
    if (children < this.minChildrenAllowed) {
      this.roomSelectionArray[index].noOfChildren = this.minChildrenAllowed;
    } else if (
      children + this.roomSelectionArray[index].noOfAdults <=
        this.maximumOccupancyPerRoom &&
      children <= this.maxChildrenAllowed
    ) {
      this.roomSelectionArray[index].noOfChildren = children;
    }
  }

  changeChildrenCount(index: number) {
    if (isNaN(this.roomSelectionArray[index].noOfChildren)) {
      this.roomSelectionArray[
        index
      ].noOfChildren = this.defaultNoOfChildrenPerRoom;
    } else {
      if (
        this.roomSelectionArray[index].noOfChildren < this.minChildrenAllowed
      ) {
        this.roomSelectionArray[index].noOfChildren = this.minChildrenAllowed;
      }
      if (
        this.roomSelectionArray[index].noOfChildren > this.maxChildrenAllowed
      ) {
        this.roomSelectionArray[index].noOfChildren = this.maxChildrenAllowed;
      }
    }
  }

  onMouseScroll(data: Event) {
    const lastLoadedDate = this.dates[this.dates.length - 1];
    const calendarLastDate = new Date(lastLoadedDate.actualDate);
    calendarLastDate.setDate(calendarLastDate.getDate() + 1);
    const lastDateToLoad = CommonUtility.getCurrentDateFromPropertyTimeZone(
      this.propertyTimeZoneOffSet
    );
    lastDateToLoad.setDate(1);
    const years = Math.floor(this.calendarRange / 12);
    const months = this.calendarRange % 12;
    lastDateToLoad.setFullYear(lastDateToLoad.getFullYear() + years);
    lastDateToLoad.setMonth(lastDateToLoad.getMonth() + months);
    lastDateToLoad.setDate(0);
    let lastDate = CommonUtility.getCurrentDateFromPropertyTimeZone(
      this.propertyTimeZoneOffSet
    );
    lastDate.setDate(lastDate.getDate() + this.maxLeadTime);
    if (
      CommonUtility.compareDates(lastDateToLoad, lastDate) < 0 ||
      this.maxLeadTime === undefined ||
      this.maxLeadTime === null
    ) {
      lastDate = CommonUtility.setDateValue(
        lastDateToLoad.getFullYear(),
        lastDateToLoad.getMonth(),
        lastDateToLoad.getDate()
      );
    }
    if (!this.scrollActionValidity(calendarLastDate, lastDateToLoad)) {
      return;
    }
    const el = (data.srcElement as Element) || (data.target as Element);
    // if (Math.abs(el.scrollHeight - el.scrollTop - el.clientHeight) <= 2) {
    if (
      Math.abs(el.scrollHeight - el.scrollTop - el.clientHeight) <=
      this.minCalendarMonths
    ) {
      this.scrollActionInProgress = true;
      this.loadNextMonth();
    }
  }

  initializeDateArray() {
    let startDateFlag = false,
      endDateFlag = false;

    this.weeks = [];
    this.dates = [];
    const tempDate = CommonUtility.getCurrentDateFromPropertyTimeZone(
      this.propertyTimeZoneOffSet
    );
    const currentDate = new Date(
      tempDate.getFullYear(),
      tempDate.getMonth(),
      tempDate.getDate()
    );

    const currentDateTemp = new Date(
      tempDate.getFullYear(),
      tempDate.getMonth(),
      tempDate.getDate()
    );
    const startDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    );
    startDate.setHours(
      this.checkinsummary.checkindate.getHours(),
      this.checkinsummary.checkindate.getMinutes(),
      this.checkinsummary.checkindate.getSeconds(),
      this.checkinsummary.checkindate.getMilliseconds()
    );
    this.noOfCalendarMonthsToLoad = this.minCalendarMonths
      ? this.minCalendarMonths
      : noOfCalendarMonthsToLoad;
    let monthsToLoad = this.noOfCalendarMonthsToLoad;
    if (this.calendarRange - this.noOfMonthsLoaded < monthsToLoad) {
      monthsToLoad = this.calendarRange - this.noOfMonthsLoaded;
    }
    const endDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    );
    endDate.setMonth(endDate.getMonth() + monthsToLoad);
    const startDateUTC = CommonUtility.getUTCFromDate(startDate);
    const endDateUTC = CommonUtility.getUTCFromDate(
      this.checkinsummary.checkoutdate
    );
    const difference_ms = Math.abs(endDateUTC - startDateUTC);
    const monthDiff = Math.abs(Math.round(difference_ms / (DAY_MILLIS * 30)));
    if (monthDiff >= this.minCalendarMonths) {
      endDate.setFullYear(this.checkinsummary.checkoutdate.getFullYear());
      endDate.setMonth(this.checkinsummary.checkoutdate.getMonth() + 1);
    }
    endDate.setDate(0);
    endDate.setHours(
      startDate.getHours(),
      startDate.getMinutes(),
      startDate.getSeconds(),
      startDate.getMilliseconds()
    );

    this.calanderStartMonth = startDate.getMonth() + 1;
    this.calanderEndMonth = endDate.getMonth() + 1;
    let loopBreakFlag = false;
    let compareValue = CommonUtility.compareDates(endDate, startDate);
    if (compareValue < 0) {
      loopBreakFlag = true;
    }
    for (const index = startDate; !loopBreakFlag; ) {
      const objData = {
        isAvailable: true,
        actualDate: new Date(index),
        dayOfWeek: index.getDay(),
        month: MONTH_NAMES[index.getMonth()],
        dayNo: index.getDate(),
        year: index.getFullYear() + "",
        date: this.formateDate(index),
        calendarDate: new Date(index).toDateString(),
        dayRate: "",
        currCode: "",
        customCss: "dayItem",
        type: "COL",
        minLos: 0,
        maxLos: this.maxSelectionAllowed,
      };
      // prior dates are not allowed
      const currentDateFlag = CommonUtility.compareDates(
        index,
        currentDateTemp
      );
      if (currentDateFlag < 0) {
        objData.isAvailable = false;
        objData.customCss = objData.customCss + " pastDate";
      }
      const flag1 = CommonUtility.compareDates(
        index,
        this.tempCheckinsummary.checkindate
      );
      const flag2 = CommonUtility.compareDates(
        index,
        this.tempCheckinsummary.checkoutdate
      );
      if (flag1 >= 0 && flag2 <= 0) {
        objData.customCss = objData.customCss + " partOfSelection";
        if (flag1 === 0) {
          startDateFlag = true;
          objData.customCss = objData.customCss + " firstSelectedDate";
          objData.customCss = objData.customCss + " start-end-date";
          this.selectionStartDate = new Date(index);
        } else if (flag2 === 0) {
          endDateFlag = true;
          objData.customCss = objData.customCss + " lastSelectedDate";
          objData.customCss = objData.customCss + " start-end-date";
          this.endDateRate = objData.dayRate;
          objData.dayRate = "Check out";
          this.selectionEndDate = new Date(index);
        } else {
          objData.customCss = objData.customCss + " availableForSelection";
        }
      }

      this.dates.push(objData);
      index.setDate(index.getDate() + 1);
      index.setHours(0, 0, 0, 0);
      compareValue = CommonUtility.compareDates(endDate, index);
      if (compareValue >= 0) {
        loopBreakFlag = false;
      } else {
        loopBreakFlag = true;
      }
    }

    let week = {
      month: "",
      year: "",
      days: [],
    };
    this.dates.forEach((item) => {
      if (item.dayNo === 1) {
        // push this week to collection and start new
        if (this.weeks.length > 0) {
          this.weeks.push(week);
        }
        week = {
          month: "",
          year: "",
          days: [],
        };
        week.month = item.month;
        week.year = item.year;

        let index: number;
        if (item.dayOfWeek === 0 && !this.calendarStartOnSunday) {
          // Make sunday the last day of the week
          index = 7;
        } else {
          index = item.dayOfWeek;
        }
        // If week starts on Sunday, our index starts at 0
        // If week starts on Monday, our index starts at 1
        const weekIndexStart = this.calendarStartOnSunday ? 0 : 1;

        for (; index > weekIndexStart; index--) {
          week.days.push({
            isAvailable: false,
            dayOfWeek: 0,
            month: "",
            year: "",
            dayNo: 0,
            date: "", // '2018-09-11',
            dayRate: "",
            customCss: "dayItem",
            type: "DUMMY",
          });
        }
      }

      week.days.push(item);

      const weekIndexEnd = this.calendarStartOnSunday ? 6 : 0;
      if (
        item.dayOfWeek === weekIndexEnd ||
        item === this.dates[this.dates.length - 1]
      ) {
        this.weeks.push(week);
        week = {
          month: "",
          year: "",
          days: [],
        };
      }
    });
  }

  scrollActionValidity(
    calendarLastLoadedDate: Date,
    calendarLastDateToLoad: Date
  ) {
    if (
      calendarLastDateToLoad.getFullYear() <
      calendarLastLoadedDate.getFullYear()
    ) {
      return false;
    }
    if (
      calendarLastDateToLoad.getFullYear() ===
        calendarLastLoadedDate.getFullYear() &&
      calendarLastDateToLoad.getMonth() < calendarLastLoadedDate.getMonth()
    ) {
      return false;
    }
    if (this.calendarRange === this.noOfMonthsLoaded) {
      return false;
    }
    return true;
  }

  loadNextMonth() {
    const lastLoadedDate = this.dates[this.dates.length - 1];
    const tempNewWeeks = [];
    const tempNewDates = [];

    const startDate = new Date(lastLoadedDate.actualDate);
    startDate.setDate(startDate.getDate() + 1);
    let lastDate = CommonUtility.getCurrentDateFromPropertyTimeZone(
      this.propertyTimeZoneOffSet
    );
    lastDate.setDate(lastDate.getDate() + this.maxLeadTime);
    const lastDateToLoad = CommonUtility.getCurrentDateFromPropertyTimeZone(
      this.propertyTimeZoneOffSet
    );
    lastDateToLoad.setDate(1);
    const years = Math.floor(this.calendarRange / 12);
    const months = this.calendarRange % 12;
    lastDateToLoad.setFullYear(lastDateToLoad.getFullYear() + years);
    lastDateToLoad.setMonth(lastDateToLoad.getMonth() + months);
    lastDateToLoad.setDate(0);
    if (
      CommonUtility.compareDates(lastDateToLoad, lastDate) < 0 ||
      this.maxLeadTime === undefined ||
      this.maxLeadTime === null
    ) {
      lastDate = CommonUtility.setDateValue(
        lastDateToLoad.getFullYear(),
        lastDateToLoad.getMonth(),
        lastDateToLoad.getDate()
      );
    }

    if (!this.scrollActionValidity(startDate, lastDateToLoad)) {
      return;
    }
    this.noOfCalendarMonthsToLoad = this.minCalendarMonths
      ? this.minCalendarMonths
      : noOfCalendarMonthsToLoad;
    let monthsToLoad = this.noOfCalendarMonthsToLoad;
    if (this.calendarRange - this.noOfMonthsLoaded < monthsToLoad) {
      monthsToLoad = this.calendarRange - this.noOfMonthsLoaded;
    }
    const startingMonthFrom = new Date(startDate);
    let endDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    endDate.setMonth(endDate.getMonth() + monthsToLoad);
    endDate.setDate(0);
    this.noOfMonthsLoaded += monthsToLoad;
    if (
      (lastDateToLoad.getFullYear() === endDate.getFullYear() &&
        lastDateToLoad.getMonth() < endDate.getMonth()) ||
      lastDateToLoad.getFullYear() < lastDateToLoad.getFullYear()
    ) {
      endDate = CommonUtility.setDateValue(
        lastDateToLoad.getFullYear(),
        lastDateToLoad.getMonth() + 1,
        0
      );
    }

    // this.calanderStartMonth = startDate.getMonth() + 1;
    this.calanderEndMonth = endDate.getMonth() + 1;

    let loopBreakFlag = false;
    let compareValue = CommonUtility.compareDates(endDate, startDate);
    if (compareValue < 0) {
      loopBreakFlag = true;
    }
    for (const index = startDate; !loopBreakFlag; ) {
      const objData = {
        isAvailable: true,
        actualDate: new Date(index),
        dayOfWeek: index.getDay(),
        month: MONTH_NAMES[index.getMonth()],
        dayNo: index.getDate(),
        year: index.getFullYear() + "",
        date: this.formateDate(index),
        dayRate: "",
        currCode: "",
        customCss: "dayItem",
        type: "COL",
        minLos: 0,
        maxLos: this.maxSelectionAllowed,
      };

      // prior dates are not allowed
      const dayData = undefined; // this.getDay(objData.date);
      if (dayData !== undefined) {
        if (objData.dayRate === "Check out") {
          this.endDateRate = dayData.dayRate;
        } else {
          objData.dayRate = dayData.dayRate;
        }
        objData.currCode = this.componentData.currencyCode;
        objData.isAvailable = dayData.available;

        objData.minLos = dayData.minLos;
        objData.maxLos = dayData.maxLos;

        if (objData.maxLos === undefined) {
          objData.maxLos = this.maxSelectionAllowed;
        }

        if (!objData.isAvailable) {
          objData.customCss = objData.customCss + " notAvailableDate";
        }

        if (!objData.isAvailable && dayData.dayRates === null && !dayData.isClosedToDeparture) {
          objData.customCss = objData.customCss.replace("notAvailableDate", '');
          objData.customCss = objData.customCss + " checkOutAllowed";
        }

        if (dayData.isClosedToArrival) {
          objData.customCss = objData.customCss + " checkinNotAllowed";
        }
        if (dayData.isClosedToDeparture) {
          objData.customCss = objData.customCss + " checkoutNotAllowed";
          objData.customCss = objData.customCss.replace("checkOutAllowed", '');
        }
        if (!objData.isAvailable && dayData.dayRates === null && dayData.isClosedToDeparture  && dayData.isClosedToArrival) {
          objData.customCss = objData.customCss + " notAvailableDate";
          objData.customCss = objData.customCss.replace("checkOutAllowed", '');
          objData.customCss = objData.customCss.replace("checkinNotAllowed", '');
          objData.customCss = objData.customCss.replace("checkoutNotAllowed", '');
        }
      }

      tempNewDates.push(objData);
      index.setDate(index.getDate() + 1);
      index.setHours(0, 0, 0, 0);
      compareValue = CommonUtility.compareDates(endDate, index);
      if (compareValue >= 0) {
        loopBreakFlag = false;
      } else {
        loopBreakFlag = true;
      }
    }

    let week = {
      month: "",
      year: "",
      days: [],
    };

    tempNewDates.forEach((item) => {
      this.dates.push(item);
      if (item.dayNo === 1) {
        // push this week to collection and start new
        if (tempNewWeeks.length > 0) {
          tempNewWeeks.push(week);
        }
        week = {
          month: "",
          year: "",
          days: [],
        };
        week.month = item.month;
        week.year = item.year;

        let index: number;
        if (item.dayOfWeek === 0 && !this.calendarStartOnSunday) {
          index = 7;
        } else {
          index = item.dayOfWeek;
        }

        // If week starts on Sunday, our index starts at 0
        // If week starts on Monday, our index starts at 1
        const weekIndexStart = this.calendarStartOnSunday ? 0 : 1;

        for (; index > weekIndexStart; index--) {
          week.days.push({
            isAvailable: false,
            dayOfWeek: 0,
            month: "",
            year: "",
            dayNo: 0,
            date: "", // '2018-09-11',
            dayRate: "",
            customCss: "dayItem",
            type: "DUMMY",
          });
        }
      }

      week.days.push(item);

      const weekIndexEnd = this.calendarStartOnSunday ? 6 : 0;
      if (
        item.dayOfWeek === weekIndexEnd ||
        item === tempNewDates[tempNewDates.length - 1]
      ) {
        tempNewWeeks.push(week);
        week = {
          month: "",
          year: "",
          days: [],
        };
      }
    });

    tempNewWeeks.forEach((item) => this.weeks.push(item));
    if (
      (lastDateToLoad.getFullYear() === endDate.getFullYear() &&
        lastDateToLoad.getMonth() === endDate.getMonth() &&
        lastDateToLoad.getDate() < endDate.getDate()) ||
      (lastDateToLoad.getFullYear() === endDate.getFullYear() &&
        lastDateToLoad.getMonth() < endDate.getMonth()) ||
      lastDateToLoad.getFullYear() < endDate.getFullYear()
    ) {
      endDate = CommonUtility.setDateValue(
        lastDateToLoad.getFullYear(),
        lastDateToLoad.getMonth(),
        lastDateToLoad.getDate()
      );
    }
    this.lastDateOfLoadedRates = CommonUtility.setDateValue(
      endDate.getFullYear(),
      endDate.getMonth(),
      endDate.getDate()
    );
    if (CommonUtility.compareDates(endDate, startingMonthFrom) >= 0) {
      this.loadRatesFromServer(true, startingMonthFrom, endDate);
    } else {
      this.applyRatesToCalander();
    }
  }

  hoverStylingEnable(el: HTMLElement) {
    if (
      (el.classList.contains("notAvailableDate") && !el.classList.contains("checkOutAllowed")) ||
      el.classList.contains("pastDate") ||
      el.classList.contains("notAvailableDay")
    ) {
      return;
    } else if (
      el.classList.contains("checkinNotAllowed") &&
      !this.selectionStarted
    ) {
      return;
    } else if (
      this.selectionStarted &&
      el.classList.contains("notPartOfSelection")
    ) {
      return;
    } else if (
      this.selectionStarted &&
      el.classList.contains("firstSelectedDate")
    ) {
      return;
    } else if (this.selectionStarted) {
      const selectedDate = new Date(el.getAttribute("data-dayData"));
      const items = document.querySelectorAll(".dayItem");
      const selectedDayCount = CommonUtility.getUTCDiffDays(
        selectedDate,
        this.selectionStartDate
      );
      this.selectionCount = 0;
      if (this.selectionStartDate < selectedDate) {
        if (items.length > 0) {
          for (let index = 0; index < items.length; index++) {
            const element = items[index];
            const elDate = new Date(element.getAttribute("data-dayData"));
            if (
              !element.classList.contains("notPartOfSelection") &&
              !element.classList.contains("notAvailableDate")
            ) {
              if (elDate > this.selectionStartDate && elDate <= selectedDate) {
                if (this.selectionCount < this.selectedAfterMinLOS) {
                  element.classList.add("mandatoryToSelect");
                }
                element.classList.add("partOfSelection");
                element.classList.add("availableForSelection");
                this.selectionCount = this.selectionCount + 1;
              } else if (
                elDate > selectedDate ||
                elDate < this.selectionStartDate
              ) {
                element.classList.remove("partOfSelection");
                element.classList.remove("availableForSelection");
              }
            }
          }
        }
      } else if (this.selectionStartDate > selectedDate) {
        if (items.length > 0) {
          for (let index = items.length - 1; index >= 0; index--) {
            const element = items[index];
            const elDate = new Date(element.getAttribute("data-dayData"));
            if (
              !element.classList.contains("notPartOfSelection") &&
              !element.classList.contains("notAvailableDate")
            ) {
              if (elDate >= selectedDate && elDate < this.selectionStartDate) {
                element.classList.add("partOfSelection");
                element.classList.add("availableForSelection");
                this.selectionCount = this.selectionCount + 1;
              } else if (
                elDate < selectedDate ||
                elDate > this.selectionStartDate
              ) {
                element.classList.remove("partOfSelection");
                element.classList.remove("availableForSelection");
              }
            }
          }
        }
      }
    } else {
      el.classList.add("hoverStyling");
    }
  }

  hoverStylingDisable(el: HTMLElement) {
    if (!this.selectionStarted && el.classList.contains("hoverStyling")) {
      el.classList.remove("hoverStyling");
    }
  }

  dayClicked(e: Event, itemData: any, el: HTMLElement) {
    if (!this.selectionStarted && el.classList.contains("checkinNotAllowed")) {
      return;
    }
    if (!this.selectionStarted && !itemData.isAvailable) {
      return;
    }

    if (_.size(this.dates) > 0) {
      this.dates.forEach((element) => {
        if (element.dayRate === "Check out") {
          element.dayRate = this.endDateRate;
          this.endDateRate = "";
        }
      });
    }

    if (!this.selectionStarted) {
      if (itemData.type === "COL" && itemData.isAvailable) {
        const items = document.querySelectorAll(".dayItem");
        if (items.length > 0) {
          for (let index = 0; index < items.length; index++) {
            const element = items[index];
            element.classList.remove("partOfSelection");
            element.classList.remove("firstSelectedDate");
            element.classList.remove("lastSelectedDate");
            element.classList.remove("availableForSelection");
            element.classList.remove("mandatoryToSelect");
            element.classList.remove("hoverStyling");
            element.classList.remove("start-end-date");
          }
        }

        this.selectionStarted = true;
        this.checkoutDate = 0;
        this.updatedCheckoutDate = 0;
        this.selectionStartDate = new Date(el.getAttribute("data-dayData"));
        el.classList.add("partOfSelection");
        el.classList.add("firstSelectedDate");
        el.classList.add("start-end-date");
        this.selectedAfterMinLOS = itemData.minLos;
        this.selectedAfterMaxLOS = itemData.maxLos;

        this.selectionCount = 0;
        const endAllowedDate = new Date(this.selectionStartDate);
        // endAllowedDate.setDate(endAllowedDate.getDate() + 7);
        endAllowedDate.setDate(
          endAllowedDate.getDate() + this.maxSelectionAllowed
        );
        this.endAllowedDate = endAllowedDate;

        if (items.length > 0) {
          this.selectedBeforeMaxLOS = 1;
          let tempMaxLOS = 1;
          for (let index = items.length - 1; index >= 0; index--) {
            const element = items[index];
            const elDate = new Date(element.getAttribute("data-dayData"));
            const isAvail = element.getAttribute("data-isAvailable");
            if (
              elDate < this.selectionStartDate &&
              this.selectedBeforeMaxLOS <= this.maxSelectionAllowed
            ) {
              if (isAvail === "true") {
                this.selectedBeforeMaxLOS = this.selectedBeforeMaxLOS + 1;
              } else if (
                isAvail !== "true" &&
                element.getAttribute("data-dayData") === null
              ) {
              } else {
                break;
              }
            } else if (
              elDate < this.selectionStartDate &&
              this.selectedBeforeMaxLOS >= this.maxSelectionAllowed
            ) {
              break;
            }
          }

          for (let index = 0; index < items.length; index++) {
            const element = items[index];
            const elDate = new Date(element.getAttribute("data-dayData"));
            const isAvail = element.getAttribute("data-isAvailable");
            if (
              elDate > this.selectionStartDate &&
              tempMaxLOS < this.maxSelectionAllowed
            ) {
              if (
                isAvail === "true" ||
                (element.classList.contains("notAvailableDate")  && !element.classList.contains("checkOutAllowed"))
              ) {
                tempMaxLOS = tempMaxLOS + 1;
              } else if (
                isAvail !== "true" &&
                element.getAttribute("data-dayData") === null
              ) {
              } else {
                break;
              }
            } else if (
              elDate > this.selectionStartDate &&
              tempMaxLOS >= this.maxSelectionAllowed
            ) {
              break;
            }
          }

          if (
            (tempMaxLOS === 1 && this.selectedBeforeMaxLOS === 1) ||
            (tempMaxLOS < this.selectedAfterMinLOS &&
              this.selectedBeforeMaxLOS === 1)
          ) {
            if (items.length > 0) {
              for (let index = 0; index < items.length; index++) {
                const element = items[index];
                element.classList.remove("firstSelectedDate");
                element.classList.remove("partOfSelection");
                element.classList.remove("availableForSelection");
                element.classList.remove("notPartOfSelection");
                element.classList.remove("mandatoryToSelect");
                element.classList.remove("hoverStyling");
                element.classList.remove("start-end-date");
              }
            }
            this.selectionStarted = false;
            return;
          }
          this.selectedAfterMaxLOS =
            this.selectedAfterMaxLOS > tempMaxLOS
              ? tempMaxLOS
              : this.selectedAfterMaxLOS;
        }

        const startAllowedDate = new Date(this.selectionStartDate);
        startAllowedDate.setDate(
          startAllowedDate.getDate() - (this.selectedBeforeMaxLOS - 1)
        );
        this.startAllowedDate = startAllowedDate;
        if (items.length > 0) {
          let isNotAvailFound = false;
          for (let index = 0; index < items.length; index++) {
            const element = items[index];
            const elDate = new Date(element.getAttribute("data-dayData"));
            const isAvail = element.getAttribute("data-isAvailable");
            if (elDate < startAllowedDate || elDate > endAllowedDate) {
              element.classList.add("notPartOfSelection");
            } else if (
              elDate > this.selectionStartDate &&
              elDate <= endAllowedDate &&
              isAvail !== "true"
            ) {
              isNotAvailFound = true;
            } else if (
              this.selectedAfterMaxLOS < this.selectedAfterMinLOS &&
              elDate > this.selectionStartDate &&
              elDate <= endAllowedDate
            ) {
              element.classList.add("notPartOfSelection");
            }
            if (isNotAvailFound && isAvail === "true") {
              element.classList.add("notPartOfSelection");
            }
          }
        }
      }
    } else {
      if (el.classList.contains("availableForSelection")) {
        let proposedEndDate = new Date(el.getAttribute("data-dayData"));
        const selectedDayCount = CommonUtility.getUTCDiffDays(
          proposedEndDate,
          this.selectionStartDate
        );
        const flag = CommonUtility.compareDates(
          this.selectionStartDate,
          proposedEndDate
        );
        if (flag < 0) {
          this.checkDateRestrictions(
            this.selectionStartDate,
            proposedEndDate,
            selectedDayCount
          );
        } else if (+this.selectionStartDate > +proposedEndDate) {
          this.checkDateRestrictions(
            proposedEndDate,
            this.selectionStartDate,
            selectedDayCount
          );
        }
        /*if (this.selectionStartDate < proposedEndDate &&
          (selectedDayCount < this.selectedAfterMinLOS || selectedDayCount > this.selectedAfterMaxLOS)) {
          return;
        } else if (this.selectionStartDate > proposedEndDate &&
          (selectedDayCount < itemData.minLos || selectedDayCount > itemData.maxLos)) {
          return;
        }*/

        if (
          this.selectionStartDate < proposedEndDate &&
          el.classList.contains("checkoutNotAllowed")
        ) {
          return;
        } else if (this.selectionStartDate > proposedEndDate) {
          if (el.classList.contains("checkinNotAllowed")) {
            return;
          }
          const prevSelectedDate = document.querySelectorAll(
            ".firstSelectedDate"
          );
          if (prevSelectedDate.length > 0) {
            for (let index = 0; index < prevSelectedDate.length; index++) {
              const element = prevSelectedDate[index];
              if (element.classList.contains("checkoutNotAllowed")) {
                return;
              }
            }
          }
        }

        this.selectionStarted = false;
        if (this.selectionStartDate < proposedEndDate) {
          el.classList.add("lastSelectedDate");
          el.classList.add("start-end-date");
        } else {
          const prevSelectedDate = document.querySelectorAll(
            ".firstSelectedDate"
          );
          if (prevSelectedDate.length > 0) {
            for (let index = 0; index < prevSelectedDate.length; index++) {
              const element = prevSelectedDate[index];
              element.classList.remove("firstSelectedDate");
              element.classList.add("lastSelectedDate");
            }
          }
          el.classList.add("firstSelectedDate");
          el.classList.add("start-end-date");
        }
        if (this.selectionStartDate > proposedEndDate) {
          proposedEndDate = this.selectionStartDate;
        }
        if (_.size(this.dates) > 0) {
          this.dates.forEach((element) => {
            // const dateVal = new Date(element.date);
            const dateVal = element.actualDate;
            if (
              proposedEndDate.getDate() === dateVal.getDate() &&
              proposedEndDate.getMonth() === dateVal.getMonth() &&
              proposedEndDate.getFullYear() === dateVal.getFullYear()
            ) {
              this.endDateRate = element.dayRate;
              element.dayRate = "Check out";
              console.log("test"+ element);
              setTimeout(() => {
                $("input#adults-field-0").focus();
              }, 10);
            }
          });
        }
        this.selectionEndDate = new Date(el.getAttribute("data-dayData"));
        if (this.selectionEndDate < this.selectionStartDate) {
          const tempDate = this.selectionStartDate;
          this.selectionStartDate = this.selectionEndDate;
          this.selectionEndDate = tempDate;
        }

        this.selectedAfterMinLOS = 1;
        this.selectedAfterMaxLOS = this.maxSelectionAllowed;

        this.startAllowedDate = undefined;
        this.endAllowedDate = undefined;

        const items = document.querySelectorAll(".dayItem");
        if (items.length > 0) {
          for (let index = 0; index < items.length; index++) {
            const element = items[index];
            const elDate = new Date(element.getAttribute("data-dayData"));
            if (
              elDate < this.selectionStartDate ||
              elDate > this.selectionEndDate
            ) {
              element.classList.remove("partOfSelection");
              element.classList.remove("availableForSelection");
              element.classList.remove("lastSelectedDate");
              element.classList.remove("firstSelectedDate");
              element.classList.remove("start-end-date");
              element.classList.remove("mandatoryToSelect");
              element.classList.remove("hoverStyling");
            }
            if (element.classList.contains("notPartOfSelection")) {
              element.classList.remove("notPartOfSelection");
            }
          }
        }
        if(el.classList.contains('start-end-date')) {
          this.checkoutDate = proposedEndDate.getDate();
          this.updatedCheckoutDate = proposedEndDate;
        }
      }
      CommonUtility.scrollIntoViewId("guestDurationInfoDiv", {
        block: "start",
      });
    }
    this.checkinDate = new Date(document.querySelector('.firstSelectedDate').getAttribute('data-daydata'));
  }

  getDay(day: string): RateDetail {
    if (this.componentData.rates !== undefined) {
      let obj = this.componentData.rates.find((v) => v.date === day);
      if (obj !== undefined) {
        if (
          obj.dayRates !== null &&
          obj.dayRates[this.componentData.currencyIndex] !== undefined
        ) {
          obj.dayRate = obj.dayRates[this.componentData.currencyIndex]
            .toFixed(0)
            .toString();
        } else {
          obj.dayRate = "";
        }
      } else if (obj === undefined && this.lastDateOfLoadedRates !== null) {
        const dateTokens = CommonUtility.getCalYearMonthDatefromString(day);
        const dayValue = new Date(
          dateTokens[0],
          dateTokens[1],
          dateTokens[2],
          0,
          0,
          0
        );
        if (
          CommonUtility.compareDates(this.lastDateOfLoadedRates, dayValue) < 0
        ) {
          obj = {
            date: day,
            dayRates: null,
            isClosedToArrival: false,
            isClosedToDeparture: false,
            minLos: 0,
            maxLos: 0,
            numRoomsAvailable: null,
            available: false,
            dayRate: "",
          };
        }
      }
      return obj;
    } else {
      return undefined;
    }
  }

  getMonth(month: string) {
    return this.localeObj[month];
  }

  makeId(i: number) {
    return "bedding_policy" + i;
  }

  closeFix(event, popover, target) {
    if (event.target.id === target) {
      popover.show();
    } else {
      popover.hide();
    }
  }

  getCalMonthHeading(month: string, year: number) {
    return CommonUtility.fillMessage(
      this.localeObj.tf_1_Calendar_rateCalender_calMonthHeading,
      [this.localeObj[month], year]
    );
  }

  removeAppliedStylesIfNotAvailable() {
    const elementsList = document.querySelectorAll(".dayItem");
    for (let index = 0; index < elementsList.length; index++) {
      if (elementsList[index].getAttribute("data-isavailable") === "false") {
        elementsList[index].classList.remove("partOfSelection");
        elementsList[index].classList.remove("availableForSelection");
        elementsList[index].classList.remove("lastSelectedDate");
        elementsList[index].classList.remove("firstSelectedDate");
        elementsList[index].classList.remove("start-end-date");
        elementsList[index].classList.remove("mandatoryToSelect");
        elementsList[index].classList.remove("hoverStyling");
      }
    }
  }

  // method to remove rooms in session storage when rooms page is reset
  removeMultiRoomSessionStorage(isMultiRoom) {
    if (isMultiRoom) {
      sessionStorage.removeItem("savedRooms");
    }
  }

  navigateCal(e) {
    const dayList = document.querySelectorAll(".cal-list li");
    const focusableDay = Array.from(dayList).filter(
      (item: any) => item.dataset.isavailable === "true"
    );
    let currentLI = focusableDay.indexOf(document.activeElement);
    let nextIndex = 0;
    const keyName = e.key;
    switch (keyName) {
      case "ArrowLeft":
        nextIndex = currentLI > 0 ? --currentLI : 0;
        (focusableDay[nextIndex] as HTMLElement)?.focus();
        break;
      case "ArrowRight":
        nextIndex =
          currentLI < dayList.length - 1 ? ++currentLI : dayList.length - 1;
        (focusableDay[nextIndex] as HTMLElement)?.focus();
        break;
      case "ArrowUp":
        nextIndex = currentLI > 0 ? currentLI - 7 : 0;
        (focusableDay[nextIndex] as HTMLElement)?.focus();
        break;
      case "ArrowDown":
        nextIndex =
          currentLI < dayList.length - 1 ? currentLI + 7 : dayList.length - 1;
        (focusableDay[nextIndex] as HTMLElement)?.focus();
        break;
    }
  }

  public isCTD(elem) {
    // if (elem.includes('checkinNotAllowed') && !elem.includes('checkoutNotAllowed')) {
    if (!elem.includes('checkoutNotAllowed')) {
      return true;
    } else {
      return false;
    }
  }

  /** Function checks if the date object consists of "checkOutAllowed" class.
   *  Returns true or false value which decides to display the checkout text on calendar.
   */
  public toggleCheckOutLabel(elem) {
    return elem.includes("checkOutAllowed") && elem.includes("lastSelectedDate");
  }

  public checkInitialParamChange(elem, value?) {
    if(Array.isArray(value) && value !== null) {
      this.calendarFilter = value;
    }
    this.refreshRateCalendar = false;
    this.enableViewAvailabilityBtn =  true

    // Check for Calendar filters
    if(this.calendarFilter.length > 0) {
      this.calendarFilter.forEach(room => {
        if( room["selectedFilterValues"].length === 0 && room["prevfilterVal"] === this.localeObj.tf_1_Calendar_rateCalender_selectDropdown) {
          this.refreshRateCalendar = false;
        } else if (room["prevfilterVal"] !== room["selectedFilterValues"]) {
          this.refreshRateCalendar = true;
        }
      });
    }

    // Check for promo code changes
    if(this.promoCode !== this.accessCode) {
      this.refreshRateCalendar = true;
    }
    // Check for IATA code changes
    if(this._storeSvc.getUserSettingsState().iata.iataNumber !== this.iataCode) {
      this.refreshRateCalendar = true;
    }
    // Check for Calendar changes
    if( this.checkoutDate !== 0) {
      if(new Date(this._storeSvc.getGuestSummary().checkindate).getDate() !== this.checkinDate.getDate() ||
       new Date(this._storeSvc.getGuestSummary().checkoutdate).getDate() !== this.updatedCheckoutDate.getDate())
       {
        this.refreshRateCalendar = true;
      }
    }
    // Check for Rooms check-in summary
    value = elem === 'guestCount' ? value : 0;
    if(this.roomSelectionArray.length !== this._storeSvc.getGuestSummary().guests.length) {
      this.refreshRateCalendar = true;
    } else if((this._storeSvc.getGuestSummary().guests[value].adults !== this.roomSelectionArray[value].noOfAdults) ||
    (this._storeSvc.getGuestSummary().guests[value].children !== this.roomSelectionArray[value].noOfChildren)) {
      this.refreshRateCalendar = true;
    }
  }

  resetDefaultsOnRefresh() {
    if(Array.isArray(this.calendarFilter) && this.calendarFilter !== null) {
      this._storeSvc.setRoomAttributes(this.calendarFilter);
    }
    const param = {};
    param["currency"] = this._storeSvc.getBasketState().CurrencyCode;
    param[QUERY_PARAM_ATTRIBUTES.ACCESS_CODE] = this._storeSvc.getBasketState().promoData.accessCode;
    param[QUERY_PARAM_ATTRIBUTES.VALIDATE_IATA_API_PARAM] = this._storeSvc.getUserSettingsState().iata.iataNumber;
    // Calendar filters params
    const obj = {};
    this._storeSvc.getBasketState().roomAttributes.forEach(elem => {
        const key = Object.values(elem.options);
        const index = _.indexOf(key, elem.selectedFilterValues);
        if(index !== -1) {
            obj[elem.selectFilterName] = Object.keys(elem.options)[index];
        } else if(elem.selectionType ==='multiple') {
          let list = '';
          if(elem.selectedFilterValues !== this.localeObj.tf_1_Calendar_rateCalender_selectDropdown) {
          elem.selectedFilterValues.forEach(element => {
            const key = Object.values(elem.options);
            const index = _.indexOf(key, element);
            if(index !== -1) {
            list += Object.keys(elem.options)[index]+';';
            }
          });
          if(list.length > 0) {
          obj[elem.selectFilterName] = list;
          }
        }
      }
    });
    param["attributes"] = Object.entries(obj).reduce((str, [p, val]) => {
      if(p === Object.keys(obj)[Object.keys(obj).length - 1]) {
        return `${str}${p}:${val}`;
      } else {
        return `${str}${p}:${val},`;
      }
    }, '');

    //Updates summary guest details
    const guest = [];
    this.roomSelectionArray.forEach((element, index) => {
      guest[index] = new Guests(
        Number(element.noOfAdults),
        Number(element.noOfChildren)
      );
    });
    this._storeSvc.getGuestSummary().guests = guest;

    //Updates guest summary dates
    if(this.checkoutDate !== 0) {
    this._storeSvc.getGuestSummary().checkindate = this.checkinDate;
    this._storeSvc.getGuestSummary().checkoutdate = this.updatedCheckoutDate;
    }

    // this.loadRatesFromServer(false, new Date(),new Date(),param);
    this.updateCurrPrices(false, new Date(),new Date(),param);
    if(!!this.promoCode && this.showAccessCode) {
      this.rateCalanderSvc
        .validateAccessCode(this.promoCode)
          .subscribe((response) => {
            if (
              response.status.success === true &&
              response.status.statusCode === 1000
              ) {
                this.isAccessCodeModified = true;
                this.enableViewAvailabilityBtn = true;
                const modifiedPromoObject = {
                  priorAccessCode: this._storeSvc.getBasketState().promoData
                    .priorAccessCode,
                  accessCode: this._storeSvc.getBasketState().promoData
                    .accessCode,
                  validationState: response.status.success,
                };
                this._storeSvc.updatePromoData(modifiedPromoObject);
              } else if (
                response.status.success === false &&
                response.status.statusCode === 6000
              ) {
                this.validateAccessCode(false);
                this.enableViewAvailabilityBtn = false;
                const modifiedPromoObject = {
                  priorAccessCode: this._storeSvc.getBasketState().promoData
                    .priorAccessCode,
                  accessCode: "",
                  validationState: response.status.success,
                };
              this._storeSvc.updatePromoData(modifiedPromoObject);
            }
        });
      }
      if (this.showIATA && !!this.iataCode) {
        const iata = this.iataCode;
        const prevIataCode = this._storeSvc.getUserSettingsState().iata
          .iataNumber;
          const iataObject = _.get(this._storeSvc.getUserSettingsState(), "iata");
          this.rateCalanderSvc
            .checkIsValidIATACode(this.iataCode)
            .subscribe((responseData) => {
              if (_.get(responseData.status, "statusCode") === 1000) {
                if (_.get(responseData.data, "isValid") === true) {
                  this.enableViewAvailabilityBtn = true;
                  this.isValidIATA = true;
                  this.iataErrorMessage = "";
                  this.iataAgencyName = _.get(
                    responseData.data,
                    "iataAgentOrAgencyName"
                  );
                } else {
                  this.enableViewAvailabilityBtn = false;
                  this.isValidIATA = false;
                  this.iataAgencyName = "";
                  this.isCheckIataApivalid = true;
                }
              } else {
                this.enableViewAvailabilityBtn = false;
                this.isValidIATA = false;
                this.iataAgencyName = "";
                this.isCheckIataApivalid = false;
              }
              iataObject["prevIataNumber"] = iataObject["iataNumber"];
              iataObject["iataNumber"] = this.iataCode;
              iataObject["iataAgencyName"] = this.iataAgencyName;
              iataObject["isValidIata"] = this.isValidIATA;
              iataObject["isIataFromQueryParam"] = false;
              this._storeSvc.updateIATADetails(iataObject);
          });
      }

    //Updates initial filters value
    this._storeSvc.getBasketState().roomAttributes.forEach(elem => {
      elem["prevfilterVal"] = elem["selectedFilterValues"];
    });
  }

  //Calls ratecalendar API and updates the prices
  updateCurrPrices(val?, initialDate?, finalDate?, params?) {
    if(!val) {
      this.loadRatesFromServer(val, initialDate,finalDate,params);
    } else {
      this.loadRatesFromServer();
    }
    this._subscription = this.rateCalanderSvc.calanderRates.subscribe(
      (data) => {
          this.firstTimeDataLoad = false;
          this.componentData = Object.create(data);
          this.componentData.currencyIndex = 0;
          this.componentData.currencyCode =
            CommonUtility.getCurrSymbolForType(
              this._storeSvc.getUserSettingsState().propertyInfo,
              this.componentData.currencyCodes[0]
            ) || this.componentData.currencyCodes[0];

          this.currencyCode = this._storeSvc.getBasketState().CurrencyCode.code;

          if (this.currencyCode) {
            this.componentData.currencyIndex = this.componentData.currencyCodes.indexOf(
              this.currencyCode
            );
            this.componentData.currencyCode = this.currencyCode;
            this.componentData.currencyCode = CommonUtility.getCurrSymbolForType(
              this._storeSvc.getUserSettingsState().propertyInfo,
              this.currencyCode
            );
          }
        this.applyRatesToCalander();
      }
    );
  }
  public displayFilters() {
    if(this.displayCalFilter || (location.pathname=== "/rooms" && this.displayRateCal)) {
      return true;
    }
    return false;
  }

  public rateCalendarParam() {
    const obj = {}; const param ={};
    this._storeSvc.getBasketState().roomAttributes.forEach(elem => {
    const key = Object.values(elem.options);
    const index = _.indexOf(key, elem.selectedFilterValues);
    if(index !== -1) {
      obj[elem.selectFilterName] = Object.keys(elem.options)[index];
    } else if(elem.selectionType ==='multiple') {
      let list = '';
      if(elem.selectedFilterValues !== this.localeObj.tf_1_Calendar_rateCalender_selectDropdown) {
        elem.selectedFilterValues.forEach(element => {
          const key = Object.values(elem.options);
          const index = _.indexOf(key, element);
          if(index !== -1) {
            list += Object.keys(elem.options)[index]+';';
          }
        });
        if(list.length > 0) {
          obj[elem.selectFilterName] = list;
        }
      }
     }
    });
    param["attributes"] = Object.entries(obj).reduce((str, [p, val]) => {
      if(p === Object.keys(obj)[Object.keys(obj).length - 1]) {
        return `${str}${p}:${val}`;
      } else {
        return `${str}${p}:${val},`;
      }
    }, '');
    return param["attributes"];
  }
}
