import {
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
} from "@angular/core";
import * as _ from "lodash";
import { Subscription } from "rxjs";
import {
  ActivatedRoute,
  NavigationEnd,
  Router,
} from "../../../../node_modules/@angular/router";
import {
  QUERY_PARAM_ATTRIBUTES,
  TRADITIONAL_FLOW,
  URL_PATHS,
} from "../common.constants";
import { CommonUtility } from "../common.utility";
import { FeatureFlags } from "../feature.flags";
import { AppService } from "../services/app.service";
import { HeaderService } from "../services/header.service";
import { StoreService } from "../services/store.service";
import { IUserSettingsState } from "../store/reducers/user-settings.reducer";
import { LOCALE_OBJ_EN } from "../utils/locale.en";

@Component({
  selector: "app-header",
  templateUrl: "./header.component.html",
  styleUrls: ["./header.component.scss"],
})
export class HeaderComponent implements OnInit, OnDestroy {
  logo: any = {};
  languages: any[];
  languagesOrder: any[];
  confirmationPage = false;
  @Input("localeObj") localeObj: any;
  @Input("isMultiPropertyPage") isMultiPropertyPage: boolean;
  propertyInfo: any;
  selectedLang: any = { code: "en", name: "English" };
  currentUrlPath: string;
  showLangOptions: boolean;
  private storeSubscription: Subscription;
  private _userSettingsSubscriptions: any;
  private _routeListener: any;
  isErrPage = false;
  isMBpage = false;
  home_page: string;
  isIataNumberValid: boolean;
  iataNumber: string;
  agencyName: string;
  isMultiproperty: boolean;
  showIATA: boolean;
  required: boolean;
  deviceType: string;
  headerMenuData = [];
  displayHeader: boolean;
  availableRooms = true;
  singlePropertyPortal: any;
  GuestSummary;
  @ViewChild("lightboxmodel") dialogBox: ElementRef;
  @ViewChild("container") container;
  @ViewChild("dropdown") dropdown;
  prevExpandedLink: any = "";
  navArr: string;
  RTL_Flag = false;
  selectedHotelName = "";
  showMap: boolean;
  mobileView: boolean;
  public currencies: any[];
  public currencySelection: any = { code: "USD" };
  propertyType: any;

  constructor(
    private storeSvc: StoreService,
    private appSvc: AppService,
    private _route: ActivatedRoute,
    private router: Router,
    private headerSvc: HeaderService,
  ) {
    document.addEventListener("click", this.offClickHandler.bind(this));
    this._routeListener = this.router.events.subscribe((e) => {
      if (e instanceof NavigationEnd) {
        this.headerMenuData = [];
        /** headerRouteCheck():
         * Gets triggered twice on initial load wrt '/' & '/search' path
         * Manages header menu items for all the pages, please do not comment it out
         */
        this.headerRouteCheck();
      }
    });
  }

  ngOnInit() {
    this.headerRouteCheck();
    this.GuestSummary = this.storeSvc.getBasketState().GuestSummary;
    this.showLangOptions = true;
    this.languagesOrder = [];
    this.selectedLang = this.storeSvc.getUserSettingsState().langObj;
    this.storeSvc.getUserSettings().subscribe((sharedData) => {
      this.propertyType = _.get(sharedData.propertyInfo, "propertyType") || '';
      this.showIATA = _.cloneDeep(sharedData.propertyInfo.showIATA);
      this.localeObj = sharedData.localeObj || {};
      this.languages = _.cloneDeep(sharedData.propertyInfo.supportedLanguages);
      this.logo.src = sharedData.propertyInfo.portalLogoUrl;
      this.logo.alt = sharedData.propertyInfo.portalLogoAltText;
      this.logo.destinationLink =
        sharedData.propertyInfo.portalLogoDestinationText || "";
      this.deviceType = sharedData.deviceType;
      this.RTL_Flag = CommonUtility.langAlignCheck(
        this.storeSvc.getUserSettingsState().langObj.code,
        FeatureFlags
      );
      this.displayHeader = sharedData.propertyInfo.displayHeader;
      this.currencies = sharedData.propertyInfo.supportedCurrencies;
      let index = 0;
      if (
        this.languages !== undefined &&
        this.languages !== null &&
        this.languages.length > 0
      ) {
        this.languages.forEach((lang) => {
          const obj = {
            code: lang.code,
            index,
          };
          this.languagesOrder.push(obj);
          index++;
        });
      }
      let addIndex;
      let removeIndex;
      if (sharedData.langObj.code !== this.selectedLang.code) {
        // _.forEach(LOCALE_OBJ_EN, (v, k) => {
        //   if (!this.localeObj[k]) {
        //     this.localeObj[k] = v;
        //   }
        // });
        if (
          _.get(this.selectedLang, "code") === undefined ||
          _.get(this.selectedLang, "code") === null ||
          _.get(this.selectedLang, "code") === ""
        ) {
          if (this.checkLanguageArray(sharedData.langObj.code)) {
            removeIndex = -1;
            this.languagesOrder.forEach((orderObj) => {
              if (orderObj.code === sharedData.langObj.code) {
                removeIndex = orderObj.index;
              }
            });
            if (removeIndex !== -1) {
              this.languages.splice(removeIndex, 1);
            }
          }
        } else {
          removeIndex = -1;
          addIndex = -1;
          this.languagesOrder.push((orderObj) => {
            if (orderObj.code === sharedData.langObj.code) {
              removeIndex = orderObj.index;
            } else if (orderObj.code === this.selectedLang.code) {
              addIndex = orderObj.index;
            }
          });
          if (removeIndex !== -1 && addIndex !== -1) {
            this.languages.splice(addIndex, 0, this.selectedLang);
            this.languages.splice(removeIndex, 1);
          }
        }
        this.selectedLang = sharedData.langObj;
        this.storeSvc.updateLocaleObj(this.localeObj);
      } else {
        if (this.checkLanguageArray(sharedData.langObj.code)) {
          removeIndex = -1;
          this.languagesOrder.forEach((orderObj) => {
            if (orderObj.code === sharedData.langObj.code) {
              removeIndex = orderObj.index;
            }
          });
          if (removeIndex !== -1) {
            this.languages.splice(removeIndex, 1);
          }
        }
      }
      this.selectedLang = sharedData.langObj;
    });

    this.storeSubscription = this.storeSvc
      .getBasket()
      .subscribe((sharedData) => {
        if (sharedData.CurrentStep < 2) {
          this.showMap = sharedData.mapView;
          this.mobileView = sharedData.mobileView;
          const urlTree = this.router.parseUrl(this.router.url);
          if (urlTree.root.children["primary"] !== undefined) {
            this.currentUrlPath = urlTree.root.children["primary"].segments
              .map((it) => it.path)
              .join("/");
          } else {
            this.currentUrlPath = "";
          }
          if (
            this.currentUrlPath !== "rooms" &&
            this.currentUrlPath !== "search" &&
            this.currentUrlPath !== "/" &&
            this.currentUrlPath !== ""
          ) {
            this.showLangOptions = false;
          } else {
            this.showLangOptions = true;
          }
        } else {
          this.showLangOptions = false;
        }
        if (sharedData.CurrentStep === 3) {
          this.confirmationPage = true;
        } else {
          this.confirmationPage = false;
        }
        if (sharedData.isErrorPage) {
          this.isErrPage = true;
        } else {
          this.isErrPage = false;
        }
        if (sharedData.isManageBookingPage) {
          this.isMBpage = true;
        } else {
          this.isMBpage = false;
        }
        if (
          this.currentUrlPath === "promo" ||
          this.currentUrlPath === "specials"
        ) {
          this.showLangOptions = true;
        }
        if (sharedData.CurrencyCode !== undefined) {
          this.currencySelection.code = sharedData.CurrencyCode;
        }
      });
    const iataObject = _.get(this.storeSvc.getUserSettingsState(), "iata");
    this.isIataNumberValid = false;
    this.iataNumber = iataObject["iataNumber"];
    this.agencyName = iataObject["iataAgencyName"];
    if (this.iataNumber) {
      this.isIataNumberValid = true;
    }
    const queryParams = this._route.snapshot.queryParams;
    const iataNumberFromQueryParams = queryParams[QUERY_PARAM_ATTRIBUTES.IATA];
    if (iataNumberFromQueryParams || this.isIataNumberValid) {
      this.iataDetails(iataNumberFromQueryParams);
    } else {
      this.isIataNumberValid = false;
      iataObject["prevIataNumber"] = iataObject["iataNumber"];
      iataObject["iataNumber"] = "";
      iataObject["iataAgencyName"] = "";
      iataObject["isValidIata"] = this.isIataNumberValid;
      this.storeSvc.updateIATADetails(iataObject);
    }
    this._route.queryParams.subscribe((params) => {
      const urlTree = this.router.parseUrl(this.router.url);
      this.selectedHotelName = this.storeSvc.getUserSettingsState().multiPropertyInfo.hotelName;
      if (urlTree.root.children["primary"] !== undefined) {
        this.currentUrlPath = urlTree.root.children["primary"].segments
          .map((it) => it.path)
          .join("/");
      } else {
        this.currentUrlPath = "";
      }

      // On Appln load Reset- Is Promo Flow ,Is Specials Flow  Flags and OfferCode in the store
      if (
        this.currentUrlPath === "search" ||
        this.currentUrlPath === "/" ||
        this.currentUrlPath === ""
      ) {
        this.resetPromoSpecialsFlowFlags();
      }

      if (
        this.currentUrlPath !== "rooms" &&
        this.currentUrlPath !== "search" &&
        this.currentUrlPath !== "/" &&
        this.currentUrlPath !== ""
      ) {
        this.showLangOptions = false;
      } else {
        this.showLangOptions = true;
      }

      this.isMultiproperty = this.isMultiPropertyPage;
    });

    this._userSettingsSubscriptions = this.storeSvc
      .getUserSettings()
      .subscribe((sharedData) => {
        const iataNumber = sharedData.iata && sharedData.iata.iataNumber;
        const tempiataObject = _.get(
          this.storeSvc.getUserSettingsState(),
          "iata"
        );
        this.singlePropertyPortal = _.get(
          this.storeSvc.getUserSettingsState(),
          "propertyInfo.singlePropertyPortal"
        );
        const baskState = this.storeSvc.getBasketState();
        const isManagebooking = this.storeSvc.getManageBookingFlowStatus();
        if (
          !isManagebooking &&
          iataNumber &&
          iataNumber !== "" &&
          tempiataObject.prevIataNumber !== "" &&
          tempiataObject.isValidIata &&
          tempiataObject.iataAgencyName === "" &&
          (tempiataObject.isIataFromQueryParam === true ||
            (baskState.ReservationID !== "" &&
              baskState.ReservationID !== null))
        ) {
          this.iataDetails(iataNumber);
        } else if (
          isManagebooking &&
          iataNumber &&
          iataNumber !== "" &&
          tempiataObject.iataAgencyName === "" &&
          (tempiataObject.isIataFromQueryParam === true ||
            (baskState.ReservationID !== "" &&
              baskState.ReservationID !== null))
        ) {
          this.iataDetails(iataNumber);
        }

        const showIATA = sharedData.propertyInfo.showIATA;
        if (
          showIATA === true &&
          iataNumber !== "" &&
          tempiataObject.iataAgencyName !== ""
        ) {
          this.isIataNumberValid = true;
          this.iataNumber = iataNumber;
          this.agencyName = tempiataObject.iataAgencyName;
        }
        // case - when iata removed from the edit popup
        if (
          showIATA === true &&
          iataNumber === "" &&
          tempiataObject.iataAgencyName === "" &&
          tempiataObject.prevIataNumber !== "" &&
          tempiataObject.isIataFromQueryParam === false
        ) {
          this.isIataNumberValid = false;
          this.iataNumber = "";
          this.agencyName = "";
        }
      });
  }

  ngOnDestroy() {
    const subscriptionsList = [
      this._userSettingsSubscriptions,
      this._routeListener,
    ];
    CommonUtility.removeSubscriptions(subscriptionsList);
  }

  resetPromoSpecialsFlowFlags() {
    if (
      this.storeSvc.getBasketState().isPromoFlow ||
      this.storeSvc.getBasketState().isSpecialsFlow
    ) {
      this.storeSvc.updateOfferCode("");
      if (this.storeSvc.getBasketState().isPromoFlow) {
        this.storeSvc.updateIsPromoFlowFlag(false);
      }
      if (this.storeSvc.getBasketState().isSpecialsFlow) {
        this.storeSvc.updateIsSpecialsFlowFlag(false);
      }
    }
  }

  navigateToHomePage() {
    const userSettingsState = this.storeSvc.getUserSettingsState();
    const languageObject = _.get(userSettingsState, "langObj");

    this.resetPromoSpecialsFlowFlags();

    const rateCode = _.get(this.storeSvc.getBasketState(), "offerCode");
    if (this.logo.destinationLink) {
      this.openNewWindow(this.logo.destinationLink);
    } else {
      const params = CommonUtility.getSearchPageQueryParams(
        rateCode,
        languageObject
      );
      const navigationExtras = {
        queryParams: params,
      };
      this.router.navigate(["/" + URL_PATHS.SEARCH_PAGE], navigationExtras);
    }
  }

  checkLanguageArray(code: string) {
    let flag = false;
    if (
      this.languages !== undefined &&
      this.languages !== null &&
      this.languages.length > 0
    ) {
      this.languages.forEach((lang) => {
        if (lang.code === code) {
          flag = true;
        }
      });
    }
    return flag;
  }

  configureLanguagesArray(lang: any) {
    let addIndex = -1;
    let removeIndex = -1;
    this.languagesOrder.push((orderObj) => {
      if (orderObj.code === this.selectedLang.code) {
        addIndex = orderObj.index;
      }
      if (orderObj.code === lang.code) {
        removeIndex = orderObj.index;
      }
    });
    if (removeIndex !== -1 && addIndex !== -1) {
      this.languages.splice(addIndex, 0, this.selectedLang);
      this.languages.splice(removeIndex, 1);
    }
  }

  searchLabel(){
    this.headerMenuData.forEach((item) =>{
      let keyFromLocalObj = Object.keys(this.localeObj).find(val => this.localeObj[val] === item.name);
      if(keyFromLocalObj){
        item.name = this.localeObj[keyFromLocalObj];
      }
   })
  }

  updateLanguageSelection(lang: any) {
    this.configureLanguagesArray(lang);
    this.selectedLang = lang;
    this.storeSvc.updateLangObj(lang.code);
    const userSettings: IUserSettingsState = this.storeSvc.getUserSettingsState();
    const propertyCode = !!userSettings
      ? userSettings.propertyInfo.propertyCode
      : null;
    const languageCode = lang.code || "en";
    this.appSvc.getLaunageJSON(languageCode, propertyCode).subscribe((data) => {
      this.localeObj = data;
      this.searchLabel();
      _.forEach(LOCALE_OBJ_EN, (v, k) => {
        if (!this.localeObj[k]) {
          this.localeObj[k] = v;
        }
      });
      this.storeSvc.updateLocaleObj(this.localeObj);
      const urlTree = this.router.parseUrl(this.router.url);
      if (urlTree.root.children["primary"] !== undefined) {
        this.currentUrlPath = urlTree.root.children["primary"].segments
          .map((it) => it.path)
          .join("/");
      } else {
        this.currentUrlPath = "";
      }
      if (this.currentUrlPath === "rooms") {
        let errorCode;
        const offerCode = this.storeSvc.getBasketState().offerCode;
        const guestSummary = this.storeSvc.getBasketState().GuestSummary;
        if (guestSummary.restrictionFailed) {
          errorCode = 4000;
        }
        const params = CommonUtility.getQueryParamObjGuestSummary(
          guestSummary,
          this.storeSvc,
          offerCode,
          errorCode
        );
        const navigationExtras = {
          queryParams: params,
        };
        this.router
          .navigate(["/" + URL_PATHS.ROOMS_PAGE], navigationExtras)
          .then((d) => CommonUtility.highlightStep("select-room"));
      } else if (this.currentUrlPath === "search") {
        const offerCode = this.storeSvc.getBasketState().offerCode;
        const params = CommonUtility.getSearchPageQueryParams(offerCode, lang);
        const navigationExtras = {
          queryParams: params,
        };
        this.router.navigate(["/" + URL_PATHS.SEARCH_PAGE], navigationExtras);
      } else if (this.isMultiproperty && this.currentUrlPath === "") {
        // reset the store's resetfilter flag and reload the page with new lang code
        this.storeSvc.updateMultiPropFilters(true);
        const navigationExtras = this.getCurrentURLQueryParams(languageCode);
        this.router.navigate(["/"], navigationExtras);
      }
    });
    this.openLanguageDropdown(document.getElementById("lang-dropdown"));
    const width = window.innerWidth;
    if (width < 992) {
      const el = document.getElementById("mobileLanguageDropdown");
      el.classList.remove("show");
      this.collapseMobileMenu();
    }
  }

  public getCurrentURLQueryParams(languageCode) {
    const urlparams = this._route.snapshot.queryParams;
    const checkInSummaryObject = CommonUtility.getCheckInSummaryFromQueryParams(
      urlparams
    );
    const checkInSummary = checkInSummaryObject.checkinSummary;
    if (checkInSummaryObject.isCheckInDateExists) {
      let errorCode;
      const offerCode = this.storeSvc.getBasketState().offerCode;
      const guestSummary = this.storeSvc.getBasketState().GuestSummary;
      if (guestSummary.restrictionFailed) {
        errorCode = 4000;
      }
      const params = CommonUtility.getQueryParamObjGuestSummary(
        guestSummary,
        this.storeSvc,
        offerCode,
        errorCode
      );
      params[QUERY_PARAM_ATTRIBUTES.LOCALE] = languageCode;
      const navigationExtras = {
        queryParams: params,
      };

      return navigationExtras;
    } else {
      // const offerCode = this.storeSvc.getBasketState().offerCode;
      //   const params = CommonUtility.getSearchPageQueryParams(offerCode);
        const params = [];
        params[QUERY_PARAM_ATTRIBUTES.LOCALE] = languageCode;
        const navigationExtras = {
          queryParams: params,
        };
      return navigationExtras;
    }
  }

  public iataDetails(iataNumberFromQueryParams) {
    this.headerSvc
      .validateIATANumber(iataNumberFromQueryParams)
      .subscribe((responseData) => {
        const iataObject = _.get(this.storeSvc.getUserSettingsState(), "iata");
        // iataObject['iataNumber'] = iataNumberFromQueryParams;
        iataObject["iataAgencyName"] = "";
        if (_.get(responseData.status, "statusCode") === 1000) {
          if (_.get(responseData.data, "isValid") === true) {
            this.isIataNumberValid = true;
            this.agencyName = _.get(responseData.data, "iataAgentOrAgencyName");
            const baskState = this.storeSvc.getBasketState();
            const queryParams = this._route.snapshot.queryParams;
            if (
              baskState.ReservationID !== "" &&
              baskState.ReservationID !== null
            ) {
              this.iataNumber = iataNumberFromQueryParams;
            } else if (this.isIataNumberValid && iataObject["iataNumber"]) {
              this.iataNumber = iataObject["iataNumber"];
            } else {
              this.iataNumber = queryParams[QUERY_PARAM_ATTRIBUTES.IATA];
            }
            iataObject["iataAgencyName"] = this.agencyName;
          } else {
            this.isIataNumberValid = false;
            this.agencyName = "";
            this.iataNumber = "";
          }
        } else {
          this.isIataNumberValid = false;
          this.agencyName = "";
          this.iataNumber = iataObject.isIataFromQueryParam
            ? iataObject.iataNumber
            : "";
          const urlTree = this.router.parseUrl(this.router.url);
          const test = !_.isEmpty(urlTree.root.children)
            ? urlTree.root.children["primary"].segments
                .map((it) => it.path)
                .join("/")
            : "";
          if (test && test === "guestCreditCardInfo") {
            const guestSummary = this.storeSvc.getBasketState().GuestSummary;
            let errorCode;
            if (guestSummary.restrictionFailed) {
              errorCode = 4000;
            }
            const offerCode = this.storeSvc.getBasketState().offerCode;
            const params = CommonUtility.getQueryParamObjGuestSummary(
              guestSummary,
              this.storeSvc,
              offerCode,
              errorCode
            );
            params["iataNumber"] = "";
            const navigationExtras = {
              queryParams: params,
            };
            const rooms = this.storeSvc.getBasketState().Rooms;
            if (rooms.length > 1) {
              this.storeSvc.updateEmptyRooms();
              this.storeSvc.upsertMultiRoomBookingOrder([]);
              sessionStorage.removeItem("savedRooms");
            }
            this.router
              .navigate(["/" + URL_PATHS.ROOMS_PAGE], navigationExtras)
              .then((d) => CommonUtility.highlightStep("select-room"));
          }
        }
        if (
          !!this._route.snapshot.queryParams.iataNumber ||
          this.storeSvc.getManageBookingFlowStatus()
        ) {
          iataObject["prevIataNumber"] = iataObject["iataNumber"];
          iataObject["iataNumber"] = this.iataNumber;
          iataObject["isValidIata"] = this.isIataNumberValid;
          iataObject["isIataFromQueryParam"] = true;
          this.storeSvc.updateIATADetails(iataObject);
        } else {
          iataObject["prevIataNumber"] = iataObject["iataNumber"];
          iataObject["iataNumber"] = "";
          iataObject["iataAgencyName"] = "";
          iataObject["isValidIata"] = false;
          iataObject["isIataFromQueryParam"] = true;
          this.storeSvc.updateIATADetails(iataObject);
        }
      });
  }

  // Main Nav reactive css

  cssClassForRightAlignedItems(i: number, numberOfColumns: string) {
    let isRightSidedItem = false;
    if (i > 6 && numberOfColumns !== "4") {
      isRightSidedItem = true;
    }
    return {
      "dropdown-menu": true,
      "dropdown-menu-right": isRightSidedItem,
    };
  }
  addMenuShowClass(el: HTMLElement, headerMenuData) {
    const width = window.innerWidth;
    if (
      (width > 992 || this.deviceType === "d") &&
      headerMenuData.subMenuItems.length > 0
    ) {
      el.classList.add("show");
    }
  }
  removeMenuShowClass(el: HTMLElement, headerMenuData) {
    const width = window.innerWidth;
    if (
      (width > 992 || this.deviceType === "d") &&
      headerMenuData.subMenuItems.length > 0
    ) {
      el.classList.remove("show");
    }
  }
  expandMobileMenu() {
    const el = document.getElementById("outerMobileMenuButton");
    el.classList.remove("collapsed");
    el.setAttribute("aria-expanded", "true");
    el.nextSibling["classList"].remove("collapse");
    el.nextSibling["classList"].add("collapsing");
    setTimeout(() => {
      el.nextSibling["classList"].remove("collapsing");
      el.nextSibling["classList"].add("collapse");
      el.nextSibling["classList"].add("show");
    }, 300);
    const innerButton = document.getElementById("innerMobileMenuButton");
    innerButton["classList"].remove("collapsed");
    innerButton.setAttribute("aria-expanded", "true");
  }
  collapseMobileMenu() {
    const el = document.getElementById("innerMobileMenuButton");
    el.classList.add("collapsed");
    el.setAttribute("aria-expanded", "false");
    const grandParent = el.parentElement["parentElement"];
    grandParent["classList"].remove("collapse");
    grandParent["classList"].remove("show");
    grandParent["classList"].add("collapsing");
    setTimeout(() => {
      grandParent["classList"].remove("collapsing");
      grandParent["classList"].add("collapse");
    }, 300);
    const outerButton = document.getElementById("outerMobileMenuButton");
    outerButton["classList"].add("collapsed");
    outerButton.setAttribute("aria-expanded", "false");
  }

  expandInnerMobileMenu(el: HTMLElement, mainNavItems) {
    const width = window.innerWidth;

    if (width < 992 && el.classList.contains("nav-link") ) {
      el.setAttribute("aria-expanded", "true");
      el.parentElement["classList"].toggle("show");
      if (mainNavItems.subMenuItems.length > 0) {
        /* el.nextSibling.nextSibling.nextSibling.nextSibling.nextSibling["classList"].toggle(
          "show"
        );*/

        el.parentElement.children[1].classList.toggle("show");
        if (this.prevExpandedLink !== "" && el !== this.prevExpandedLink) {
          this.prevExpandedLink.setAttribute("aria-expanded", "false");
          this.prevExpandedLink.parentElement["classList"].remove("show");
          /* this.prevExpandedLink.nextSibling.nextSibling.nextSibling.nextSibling[
             "classList"
            ].remove("show"); */
          this.prevExpandedLink.parentElement.children[1].classList.remove("show");
        }
        this.prevExpandedLink = el;
      }
      return false;
    }
    return true;
  }

  toggleMenuForDesktop(el: HTMLElement) {
    const width = window.innerWidth;
    const parent = el.parentElement;
    if (width < 992) {
      const ariaExpanded = el.firstChild["attributes"].getNamedItem(
        "aria-expanded"
      );
      if (ariaExpanded) {
        if (ariaExpanded.value === "true") {
          ariaExpanded["value"] = "false";
        } else {
          ariaExpanded["value"] = "true";
        }
      }
      el.classList.toggle("show");
    }
  }

  openLanguageDropdown(el: HTMLElement, id?) {
    const ariaExpanded = el.attributes.getNamedItem("aria-expanded");
    if (ariaExpanded) {
      if (ariaExpanded.value === "true") {
        ariaExpanded["value"] = "false";
      } else {
        ariaExpanded["value"] = "true";
      }
    }
    el.parentElement["classList"].toggle("show");
    el.nextSibling["classList"].toggle("show");
    setTimeout(() => {
      document
        .querySelectorAll("li.dropdown-item.menu-item")
        .forEach((e) => e.setAttribute("tabindex", "0"));
    }, 10);
    const width = window.innerWidth;
    if (width < 992 && id ==='mobileLanguageDropdown') {
      const ele = document.getElementById(id);
      ele.parentElement.parentElement.classList.add("show");
    }
  }

  openSuppFieldsDropdown(el) {
    this.openLanguageDropdown(document.getElementById(el));
  }

  closeSuppFieldsDropdown(elem, id) {
    const el = document.getElementById(elem);
    const ariaExpanded = el.attributes.getNamedItem("aria-expanded");
    if (ariaExpanded && ariaExpanded.value === "true") {
      ariaExpanded["value"] = "false";
    }
    el.parentElement.classList.remove("show");
    document.getElementById(id).classList.remove("show");
    setTimeout(() => {
      document
        .querySelectorAll("li.dropdown-item.menu-item")
        .forEach((e) => e.removeAttribute("tabindex"));
    }, 10);
  }

  offClickHandler(event: any) {
    if (event.target === document.getElementById("lang-dropdown")) {
      this.openLanguageDropdown(event.target);
    } else if (!!document.getElementById("lang-dropdown")) {
      document
        .getElementById("lang-dropdown")
        .parentElement["classList"].remove("show");
      document
        .getElementById("lang-dropdown")
        .nextSibling["classList"].remove("show");
    }
  }

  bookRoom(element: HTMLElement) {
    element.parentElement.classList.toggle("show");
    element.nextSibling["classList"].toggle("show");
  }

  closeCalendarPopup() {
    const BookingView = document.getElementById("BookingView");
    const BookingViewButton = document.getElementById("BookingViewBtn");
    BookingView.classList.remove("show");
    BookingViewButton.classList.remove("show");
  }

  // header response data

  headerRouteCheck() {
    this.headerSvc.getHeaderMenuItems().subscribe((headerData) => {
      this.headerMenuData = [];
      if (headerData.data) {
        headerData.data.forEach((element) => {
          element.numberOfColumns = "1";
          if (element.linkType === "NEW_TAB") {
            element.linkType = "_blank";
          } else if (element.linkType === "EXISTING_TAB") {
            element.linkType = "_self";
          }
          element.subMenuItems.forEach((linkType) => {
            if (linkType.linkType === "NEW_TAB") {
              linkType.linkType = "_blank";
            } else if (linkType.linkType === "EXISTING_TAB") {
              linkType.linkType = "_self";
            }
          });
          if (
            this.currentUrlPath === URL_PATHS.SEARCH_PAGE &&
            element.displayMenuPages.includes("CALENDAR")
          ) {
            this.headerMenuData.push(element);
          } else if (
            this.currentUrlPath === URL_PATHS.ROOMS_PAGE &&
            element.displayMenuPages.includes("ROOM_RATEPLAN")
          ) {
            this.headerMenuData.push(element);
          } else if (
            this.currentUrlPath === URL_PATHS.GUEST_INFO_PAGE &&
            element.displayMenuPages.includes("CHECKOUT")
          ) {
            this.headerMenuData.push(element);
          } else if (
            this.currentUrlPath === URL_PATHS.CONFIRMATION_PAGE &&
            element.displayMenuPages.includes("CONFIRMATION")
          ) {
            this.headerMenuData.push(element);
          } else if (
            (this.currentUrlPath === URL_PATHS.MANAGE_BOOKING &&
              element.displayMenuPages.includes("MANAGE_BOOKING")) ||
            this.currentUrlPath === URL_PATHS.BOOKING_DETAILS
          ) {
            this.headerMenuData.push(element);
          } else if (
            this.currentUrlPath === URL_PATHS.SPECIALS_PAGE &&
            element.displayMenuPages.includes("SPECIALS")
          ) {
            this.headerMenuData.push(element);
          } else if (
            this.currentUrlPath === URL_PATHS.PROMO_PAGE &&
            element.displayMenuPages.includes("PROMO_PAGE")
          ) {
            this.headerMenuData.push(element);
          } else if (
            this.isMultiproperty &&
            element.displayMenuPages.includes("MULTI_PROPERTY")
          )
           {
            this.headerMenuData.push(element);
        } else if (this.isMultiproperty && element.displayMenuPages.includes("MULTI_PROPERTY") && element.opens === 'EXTERNAL'){
            this.headerMenuData.push(element);
          }
        });
      }
      const navItemsList = [];
      this.headerMenuData.map((data) => {
        navItemsList.push(data.name);
      });
      this.navArr = navItemsList.join("  ");
      if (!!document.getElementById("nav-items")) {
        if (this.navArr.length > 120) {
          document.getElementById("nav-items").style.flexFlow = "row wrap";
        } else {
          document.getElementById("nav-items").style.flexWrap = "nowrap";
        }
      }
    });
  }

  mainNavResponse(data, el) {
    const width = window.innerWidth;
    if (width < 992 && !data.hasOwnProperty("subMenuItems")) {
      this.collapseMobileMenu();
      const grandParent = el.parentElement.parentElement.parentElement;
      grandParent.classList.remove("show");
    }
    if (data.opens === "CALENDAR") {
      const userSettingsState = this.storeSvc.getUserSettingsState();
      const offerCode = this.storeSvc.getBasketState().offerCode;
      const languageObject = _.get(userSettingsState, "langObj");
      const params = CommonUtility.getSearchPageQueryParams(
        offerCode,
        languageObject
      );
      const navigationExtras = {
        queryParams: params,
      };
      const externalParams = [];
      for (const key in navigationExtras.queryParams) {
        if (navigationExtras.queryParams) {
          externalParams.push(key + "=" + navigationExtras.queryParams[key]);
        }
      }
      const externalNavigation = externalParams.join("&");
      if (data.linkType === "_self") {
        this.router.navigate(["/" + URL_PATHS.SEARCH_PAGE], navigationExtras);
      } else if (data.linkType === "_blank") {
        window.open("/" + URL_PATHS.SEARCH_PAGE + "?" + externalNavigation);
      }
    } else if (data.opens === "ROOMS") {
      const guestSummary = this.storeSvc.getBasketState().GuestSummary;
      let errorCode;
      if (guestSummary.restrictionFailed) {
        errorCode = 4000;
      }
      const offerCode = this.storeSvc.getBasketState().offerCode;
      const params = CommonUtility.getQueryParamObjGuestSummary(
        guestSummary,
        this.storeSvc,
        offerCode,
        errorCode
      );
      const navigationExtras = {
        queryParams: params,
      };
      const externalParams = [];
      for (const key in navigationExtras.queryParams) {
        if (navigationExtras.queryParams) {
          externalParams.push(key + "=" + navigationExtras.queryParams[key]);
        }
      }
      const externalNavigation = externalParams.join("&");
      if (data.linkType === "_self") {
        this.router
          .navigate(["/" + URL_PATHS.ROOMS_PAGE], navigationExtras)
          .then((d) => CommonUtility.highlightStep("select-room"));
      } else if (data.linkType === "_blank") {
        window.open("/" + URL_PATHS.ROOMS_PAGE + "?" + externalNavigation);
      }
    } else if (data.opens === "MANAGE_BOOKING") {
      if (data.linkType === "_self") {
        this.router.navigate(["/" + URL_PATHS.MANAGE_BOOKING]);
      } else if (data.linkType === "_blank") {
        window.open("/" + URL_PATHS.MANAGE_BOOKING);
      }
    } else if (data.opens === "EXTERNAL") {
      if (data.linkType === "_self") {
        location.assign(data.hyperlink);
      } else if (data.linkType === "_blank") {
        window.open(data.hyperlink);
      }
    } else if (data.opens === "SPECIALS") {
      const guestSummary = this.storeSvc.getBasketState().GuestSummary;
      let errorCode;
      if (guestSummary.restrictionFailed) {
        errorCode = 4000;
      }
      let currentAccessCode = "";
      if (!!this._route.snapshot.queryParams.accessCode) {
        currentAccessCode = this._route.snapshot.queryParams.accessCode;
      }
      const promoData = {
        accessCode: currentAccessCode,
        validationState: true,
        offerCode: this.storeSvc.getBasketState().offerCode,
        isSpecialRate: true,
      };
      this.storeSvc.updatePromoData(promoData);
      this.storeSvc.updateIsSpecialsFlowFlag(true);
      this.storeSvc.setSpecialsOfferCode("");
      const offerCode = this.storeSvc.getBasketState().offerCode;
      const params = CommonUtility.getQueryParamObjGuestSummary(
        guestSummary,
        this.storeSvc,
        offerCode,
        errorCode
      );
      const navigationExtras = {
        queryParams: params,
      };
      const externalParams = [];
      for (const key in navigationExtras.queryParams) {
        if (navigationExtras.queryParams) {
          externalParams.push(key + "=" + navigationExtras.queryParams[key]);
        }
      }
      const externalNavigation = externalParams.join("&");
      if (data.linkType === "_self") {
        this.router.navigate(["/" + URL_PATHS.SPECIALS_PAGE], navigationExtras);
      } else if (data.linkType === "_blank") {
        window.open("/" + URL_PATHS.SPECIALS_PAGE + "?" + externalNavigation);
      }
    }
    if (data.hasOwnProperty("subMenuItems")) {
      if (width < 992 && data.subMenuItems.length === 0) {
        this.collapseMobileMenu();
      }
    }
  }

  openNewWindow(link: string) {
    const urlPath = link.includes("://") ? link : "https://" + link;
    window.open(urlPath, "_self");
  }

  onCheckInSummaryChanged(eventData: any) {
    const guestSummary = CommonUtility.getGuestSummaryFromEventData(eventData);
    this.storeSvc.updateGuestDuration(guestSummary);
    let errorCode;
    if (guestSummary.restrictionFailed) {
      errorCode = 4000;
      this.availableRooms = false;
    } else {
      this.availableRooms = true;
    }
    const offerCode = this.storeSvc.getBasketState().offerCode;
    const params = CommonUtility.getQueryParamObjGuestSummary(
      guestSummary,
      this.storeSvc,
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

  navigateLang(e) {
    CommonUtility.navigateDropDown(e);
  }
  
  updateCurrencySelection(currency: any) {
    if(this.currentUrlPath === URL_PATHS.SEARCH_PAGE) {
      this.currencySelection.code = _.get(currency, "code");
      this.storeSvc.updateCurrencyCodeObj(currency);
      this.storeSvc.updateIntialCurrencyCodeObj(this.currencySelection.code);
      CommonUtility.setDatalayer({
        currency: _.get(currency, "code"),
      });
      const width = window.innerWidth;
      if (width < 992) {
        const el = document.getElementById("mobileCurrencyDropdown");
        el.classList.remove("show");
        this.collapseMobileMenu();
      }
      // Modifies RateCalendar rates
      this.storeSvc.changeCurrency(true);
    } else if(this.currentUrlPath === URL_PATHS.PROMO_PAGE || this.currentUrlPath === URL_PATHS.ROOMS_PAGE
      || this.currentUrlPath === URL_PATHS.SPECIALS_PAGE) {
      this.currencySelection.code = _.get(currency, "code");
      this.storeSvc.updateCurrencyCodeObj(currency);
      this.storeSvc.updateIntialCurrencyCodeObj(this.currencySelection.code);
      CommonUtility.setDatalayer({
        currency: _.get(currency, "code"),
      });
      const isManagebooking = this.storeSvc.getManageBookingFlowStatus();
      if (!isManagebooking) {
        const rooms = this.storeSvc.getBasketState().Rooms;
        this.storeSvc.updateMultipleRoomsWithPricing(rooms);
      }
      const guestSummary = this.storeSvc.getBasketState().GuestSummary;
      let errorStatusCode;
      if (guestSummary.restrictionFailed) {
        this.storeSvc.setError(4000);
        errorStatusCode = 4000;
      }
      const urlParams = this._route.snapshot.queryParams;
      const params = CommonUtility.getQueryParamObjGuestSummary(
        guestSummary,
        this.storeSvc,
        undefined,
        errorStatusCode
      );
      params["offerCode"] = urlParams["offerCode"] ? urlParams["offerCode"] : "";
      params["accessCode"] = urlParams["accessCode"]
        ? urlParams["accessCode"]
        : "";
      params["propertyCode"] = urlParams["propertyCode"]
        ? urlParams["propertyCode"]
        : "";
      const navigationExtras = {
        queryParams: params
      };
      if (this.router.url.includes("/specials")) {
        this.router.navigate(["/" + URL_PATHS.SPECIALS_PAGE], navigationExtras);
      } else if (this.router.url.includes("/promo")) {
        this.router.navigate(["/" + URL_PATHS.PROMO_PAGE], navigationExtras);
      } else {
        this.router
          .navigate([], navigationExtras)
          .then((d) => CommonUtility.highlightStep("select-room"));
      }
    }
  }
  public displayCurrency() {
    if(window.location.pathname === '/'+ URL_PATHS.PROMO_PAGE || window.location.pathname === '/'+ URL_PATHS.ROOMS_PAGE
      || window.location.pathname === '/'+ URL_PATHS.SPECIALS_PAGE || window.location.pathname === '/'+ URL_PATHS.SEARCH_PAGE ||
      window.location.pathname === '/' + URL_PATHS.MULTIROOMPLANLISTING) {
        return true;
    } else {
    return false;
    }
  }
}
