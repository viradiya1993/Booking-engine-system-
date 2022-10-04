import { Location } from "@angular/common";
import { Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import * as _ from "lodash";
import { Subscription } from "rxjs";
import {
  error_code_prefix,
  ErrorCodesListInComponents,
  QUERY_PARAM_ATTRIBUTES,
  STEP_MAP,
  URL_PATHS,
} from "../common/common.constants";
import { CommonUtility } from "../common/common.utility";
import { RatecalendarService } from "../common/services/ratecalendar/ratecalendar.service";
import { StoreService } from "../common/services/store.service";
import { CheckinSummary } from "../search/guestduration/checkinsummary.type";
import { RatecalendarComponent } from "./ratecalendar/ratecalendar.component";

@Component({
  selector: "app-search",
  templateUrl: "./search.component.html",
  styleUrls: ["./search.component.scss"],
})
export class SearchComponent implements OnInit, OnDestroy {
  checkinsummary: CheckinSummary;
  localeObj: any = {};
  enableViewAvailabilityBtn = true;
  iataCode = "";
  showIATA: any;
  isvalidIATA = false;
  iataAgencyName = "";
  prevSelectedRooms: any;
  currentAccessCode: string;
  isValidAccessCode = true;
  private _userSettingsSubscriptions: any;
  showAccessCode: boolean;
  @ViewChild("rateCalComponent", { static: true })
  rateCalendarComponentObj: RatecalendarComponent;
  codeValidted: any;
  priorAccessCode = "";
  errorCode: number;
  errorMsg: string;
  errorFound: boolean;
  public calCounter: number;
  currencies: any[];
  private routerSubscription: Subscription;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private _storeSvc: StoreService,
    private rateCalendarService: RatecalendarService,
    private location: Location
  ) {}

  ngOnInit() {
    this.calCounter = 0;
    this.errorCode = 0;
    this.errorMsg = "";
    this.errorFound = false;

    this.rateCalendarComponentObj.counter = this.calCounter;

    this._storeSvc.updateCurrentStep(STEP_MAP[URL_PATHS.SEARCH_PAGE]);
    this.prevSelectedRooms = this.activatedRoute.snapshot.queryParamMap.get(
      "Rooms"
    );
    const userSettingsState = this._storeSvc.getUserSettingsState();
    this.routerSubscription = this.activatedRoute.queryParams.subscribe(
      (params) => {
        if (params[QUERY_PARAM_ATTRIBUTES.CURRENCY]) {
          const selectedCurrency = _.find(this.currencies, function (obj) {
            return obj.code === params[QUERY_PARAM_ATTRIBUTES.CURRENCY];
          });
          // if (selectedCurrency) {
          //   this._storeSvc.updateCurrencyCodeObj(selectedCurrency);
          // }
        }
      }
    );
    if (
      this.prevSelectedRooms === undefined ||
      this.prevSelectedRooms === null
    ) {
      this.showAccessCode = userSettingsState.propertyInfo.showAccessCode;
      this.showIATA = _.get(userSettingsState, "propertyInfo.showIATA");
      this.checkinsummary = new CheckinSummary(
        _.get(userSettingsState, "propertyInfo.propertyTimezone.timezoneOffset")
      );
      this._userSettingsSubscriptions = this.location.subscribe((path) => {
        if (path.url.includes("search")) {
          const langObject = _.get(userSettingsState, "langObj");
          const rateCode = _.get(this._storeSvc.getBasketState(), "offerCode");
          const checkInSummary = this._storeSvc.getBasketState()[
            "GuestSummary"
          ] as CheckinSummary;
          const params = CommonUtility.getSearchPageQueryParams(
            rateCode,
            langObject,
            checkInSummary,
            this._storeSvc
          );
          const navigationExtras = {
            queryParams: params,
          };
          this.router.navigate(["/" + URL_PATHS.SEARCH_PAGE], navigationExtras);
        }
      });
      this._storeSvc.updateGuestDuration(this.checkinsummary);
      // this._storeSvc.clearBasketValues();
    }
    CommonUtility.removeScript("TealiumScript1");
    CommonUtility.removeScript("TealiumScript2");
    CommonUtility.removeScript("TealiumScript3");
    CommonUtility.removeScript("TealiumScript4");

    const languageObject = userSettingsState.langObj;

    this._storeSvc.removeErrors(ErrorCodesListInComponents.Search);
    this._storeSvc.updateIsErrorPageFlag(false);
    if (!this.activatedRoute.snapshot.queryParamMap.get("Rooms")) {
      this._storeSvc.updateReservationID("");
    }
    this._userSettingsSubscriptions = this._storeSvc
      .getUserSettings()
      .subscribe((sharedData) => {
        this.localeObj = sharedData.localeObj;
        this.iataCode = sharedData.iata.iataNumber;
        this.currencies = sharedData.propertyInfo.supportedCurrencies;
      });
    const urlTree = this.router.parseUrl(this.router.url);
    if (urlTree.root.children["primary"] !== undefined) {
      const currentUrlPath = urlTree.root.children["primary"].segments
        .map((it) => it.path)
        .join("/");
      if (currentUrlPath !== URL_PATHS.SEARCH_PAGE) {
        this.redirectWithParams(urlTree, languageObject);
      } else {
        const rateCode = _.get(urlTree, "queryParams.offerCode");
        const locale = _.get(urlTree, "queryParams.locale");
        const flow_param = _.get(urlTree, "queryParams.flow");
        if (
          rateCode === undefined ||
          rateCode === null ||
          locale === undefined ||
          locale === null ||
          locale.length === 0 ||
          flow_param === undefined ||
          flow_param === null ||
          flow_param.length === 0
        ) {
          this.redirectWithParams(urlTree, languageObject);
        }
      }
    } else {
      this.redirectWithParams(urlTree, languageObject);
    }

    this.activatedRoute.queryParams.subscribe((params) => {
      if (params["errorCode"]) {
        this.errorFound = true;
        this.errorCode = params["errorCode"];
        if (this.localeObj) {
          this.errorMsg = _.get(
            this.localeObj,
            error_code_prefix + this.errorCode
          );
        }
        CommonUtility.setDatalayer({
          error_type: "red-error",
          error_code: this.errorCode,
          error_description: this.errorMsg,
        });
      } else {
        this.errorFound = false;
        this.errorCode = 0;
        this.errorMsg = "";
        CommonUtility.setDatalayer({
          // Empty error state in data layer, in case of pre existing error
          error_type: "",
          error_code: "",
          error_description: "",
        });
      }

      if (this.errorFound === true) {
        const ele = document.getElementsByName("ErrDiv");
        if (ele !== undefined && ele !== null && ele.length > 0) {
          ele[0].scrollIntoView({
            behavior: "smooth",
            block: "start",
            inline: "nearest",
          });
        }
      }
    });

    this._storeSvc.updateCurrentStep(STEP_MAP[URL_PATHS.SEARCH_PAGE]);
    setTimeout(() => {
      CommonUtility.highlightStep("search");
      if(this.errorMsg !=='') {
        setTimeout(()=> {
          document.getElementById("red-error").focus();
        },100);
      }
    }, 500);

    this._storeSvc.updateIsSearchPageVisitedFlag(true);
    this._storeSvc.clearBasketValues();
  }

  ngOnDestroy() {
    const subscriptionsList = [this._userSettingsSubscriptions];
    CommonUtility.removeSubscriptions(subscriptionsList);
  }

  onCheckInSummaryChanged(eventData: any) {
    const guestSummary = CommonUtility.getGuestSummaryFromEventData(eventData);
    this._storeSvc.updateGuestDuration(guestSummary);
    let errorCode;
    if (guestSummary.restrictionFailed) {
      errorCode = 4000;
    }
    const offerCode = this._storeSvc.getBasketState().offerCode;
    const params = CommonUtility.getQueryParamObjGuestSummary(
      guestSummary,
      this._storeSvc,
      offerCode,
      errorCode
    );
    const navigationExtras = {
      queryParams: params,
    };
    this.router
      .navigate(["/" + URL_PATHS.ROOMS_PAGE], navigationExtras)
      .then((d) => CommonUtility.highlightStep("select-room"));
  }

  redirectWithParams(urlTree: any, languageObject: any) {
    const Rooms = _.get(urlTree, "queryParams.Rooms");
    if (Rooms === undefined || Rooms === null) {
      const rateCode = _.get(urlTree, "queryParams.offerCode");
      const params = CommonUtility.getSearchPageQueryParams(
        rateCode,
        languageObject
      );

      const newParams = {};
      _.forEach(params, (v, k) => {
        newParams[k] = v;
      });
      if (_.get(urlTree, "queryParams.errorCode") !== "") {
        newParams["errorCode"] = _.get(urlTree, "queryParams.errorCode");
      }

      const navigationExtras = {
        queryParams: params,
      };
      this.router.navigate(["/" + URL_PATHS.SEARCH_PAGE], navigationExtras);
    }
  }
  checkIsIATAValid(eventData) {
    if (_.get(this._storeSvc.getUserSettingsState(), "propertyInfo.showIATA")) {
      this.iataCode = eventData.iataCode;
      if (eventData.passedBasicValidation) {
        this.enableViewAvailabilityBtn = true;
      } else {
        this.enableViewAvailabilityBtn = false;
      }
    } else {
      this.enableViewAvailabilityBtn = true;
    }
  }
  isAccessCodeValid(eventData) {
    if (this.showAccessCode) {
      this.codeValidted = eventData.codeValidated;
    }
  }

  viewAvailability() {
    this.showIATA = _.get(
      this._storeSvc.getUserSettingsState(),
      "propertyInfo.showIATA"
    );
    if (this.showIATA) {
      const iataObject = _.get(this._storeSvc.getUserSettingsState(), "iata");
      if (this.iataCode === "") {
        iataObject["prevIataNumber"] = iataObject["iataNumber"];
        iataObject["iataNumber"] = "";
        iataObject["iataAgencyName"] = "";
        iataObject["isValidIata"] = false;
        iataObject["isIataFromQueryParam"] = false;
        this._storeSvc.updateIATADetails(iataObject);
      }
    }
    if (this.showIATA && !!this.iataCode) {
      if (this.enableViewAvailabilityBtn) {
        // To Do:  CALL checkIATA API
        const iataObject = _.get(this._storeSvc.getUserSettingsState(), "iata");
        this.rateCalendarService
          .checkIsValidIATACode(this.iataCode)
          .subscribe((responseData) => {
            if (_.get(responseData.status, "statusCode") === 1000) {
              if (_.get(responseData.data, "isValid") === true) {
                this.enableViewAvailabilityBtn = true;
                this.isvalidIATA = true; // pass this to ratecalendar template to show invalid iata message
                this.iataAgencyName = _.get(
                  responseData.data,
                  "iataAgentOrAgencyName"
                );
              } else {
                // this.iataCode = '';
                this.enableViewAvailabilityBtn = false;
                this.isvalidIATA = false;
                this.iataAgencyName = "";
              }
            } else {
              this.enableViewAvailabilityBtn = false;
              // this.iataCode = '';
              this.isvalidIATA = false;
              this.iataAgencyName = "";
            }
            iataObject["prevIataNumber"] = iataObject["iataNumber"];
            iataObject["iataNumber"] = this.iataCode;
            iataObject["iataAgencyName"] = this.iataAgencyName;
            iataObject["isValidIata"] = this.isvalidIATA;
            iataObject["isIataFromQueryParam"] = false;
            this._storeSvc.updateIATADetails(iataObject);
            // this is subscribed in header component
            if (this.enableViewAvailabilityBtn && this.isvalidIATA) {
              this.rateCalendarComponentObj.updateCheckingData();
            }
          });
      }
    } else if (this.showAccessCode) {
      this.currentAccessCode = this._storeSvc.getBasketState().promoData.accessCode;
      if (!!this.currentAccessCode) {
        this.rateCalendarService
          .validateAccessCode(this.currentAccessCode)
          .subscribe((response) => {
            if (
              response.status.success === true &&
              response.status.statusCode === 1000
            ) {
              this.isValidAccessCode = true;
              const modifiedPromoObject = {
                priorAccessCode: this._storeSvc.getBasketState().promoData
                  .accessCode,
                accessCode: this.currentAccessCode,
                validationState: response.status.success,
              };
              this._storeSvc.updatePromoData(modifiedPromoObject);
              if (response.data && response.data.isAccessCodeWithMultiOffers) {
                this._storeSvc.updateIsCompoundAccessCode(true);
              } else {
                this._storeSvc.updateIsCompoundAccessCode(false);
              }
              this.rateCalendarComponentObj.updateCheckingData();
            } else if (
              response.status.success === false &&
              response.status.statusCode === 6000
            ) {
              this.isValidAccessCode = false;
              const modifiedPromoObject = {
                priorAccessCode: this._storeSvc.getBasketState().promoData
                  .accessCode,
                accessCode: "",
                validationState: response.status.success,
              };
              this._storeSvc.updatePromoData(modifiedPromoObject);
              this.rateCalendarComponentObj.validateAccessCode(
                this.isValidAccessCode
              );
            }
          });
      } else if (this.currentAccessCode === "") {
        this.isValidAccessCode = true;
        this.rateCalendarComponentObj.updateCheckingData();
      }
    } else {
      this.enableViewAvailabilityBtn = true;
      this.rateCalendarComponentObj.updateCheckingData();
    }
  }

  counterIncremented(counterVal: any) {
    this.calCounter = counterVal;
    this.rateCalendarComponentObj.counter = this.calCounter;
  }
}
