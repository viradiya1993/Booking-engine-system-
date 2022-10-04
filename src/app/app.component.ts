import { DOCUMENT, Location } from "@angular/common";
import { Component, Inject, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { Meta, Title } from "@angular/platform-browser";
import {
  ActivatedRoute,
  NavigationEnd,
  NavigationStart,
  Router,
} from "@angular/router";
import * as _ from "lodash";
import {
  NgcCookieConsent,
  NgcCookieConsentConfig,
  NgcCookieConsentModule,
  NgcCookieConsentService,
} from "ngx-cookieconsent";
import { NGXLogger } from "ngx-logger";
import { environment } from "src/environments/environment";
import { Store } from "../../node_modules/@ngrx/store";
import { Subscription } from "../../node_modules/rxjs";
import {
  DEFAULT_IP_DETAILS,
  QUERY_PARAM_ATTRIBUTES,
  SHOW_COOKIE_POPUP,
  STEP_MAP,
  TEALIUM_PAGE_NAMES,
  URL_PATHS,
  MAX_AMENITIES_SHOWN,
  FILTERS_SELECT_LABEL,
  FILTERS_CLEAR_LABEL
} from "./common/common.constants";
import { CommonUtility } from "./common/common.utility";
import { AppService } from "./common/services/app.service";
import { DeviceDetectorService } from "./common/services/device-detector.service";
import { StoreService } from "./common/services/store.service";
import {
  Currency,
  IUserSettingsState,
} from "./common/store/reducers/user-settings.reducer";
import { LOCALE_OBJ_EN } from "./common/utils/locale.en";
import { CheckinSummary } from "./search/guestduration/checkinsummary.type";
declare var window: Window;
import * as $ from "jquery";
import { NgxSpinnerService } from "ngx-spinner";

import { BsModalService } from "ngx-bootstrap";
import { FeatureFlags } from "./common/feature.flags";
import { PromoService } from "./common/services/promo/promo.service";

export let browserRefresh = false;
export let browserBack = false;

@Component({
  selector: "app-root",
  styleUrls: ["./app.component.scss"],
  templateUrl: "./app.component.html",
})
export class AppComponent implements OnInit, OnDestroy {
  subscription: Subscription;
  title = "app";
  proceed = false;
  showDiv = true;
  multiproperty = false;
  _subscription: Subscription;
  storeSubscription: Subscription;
  localeObj: any = {};
  propertyInfo: any;
  paramLangCode: string;
  propertyInfoAvailable = false;
  selectedIndex: any;
  roomCode: any;
  private _userSettingsSubscriptions: any;
  isMultiPropertyPage = false;
  thirdStepperLabel = '';
  // private popupOpenSubscription: Subscription;
  private popupCloseSubscription: Subscription;
  private IPInfoSubscription: Subscription;
  private propertyInfoSubscription: Subscription;
  private translationsSubscription: Subscription;
  private cookieConsentUserSettingsSubscription: Subscription;
  private _promosSubscription: Subscription;
  // private initializeSubscription: Subscription;
  // private statusChangeSubscription: Subscription;
  // private revokeChoiceSubscription: Subscription;
  // private noCookieLawSubscription: Subscription;
  private modalSubscription: Subscription;

  constructor(
    private router: Router,
    private store: Store<any>,
    private _storeSvc: StoreService,
    private appSvc: AppService,
    private _route: ActivatedRoute,
    private ccService: NgcCookieConsentService,
    private deviceDetectSrv: DeviceDetectorService,
    private titleService: Title,
    private metaService: Meta,
    private _logger: NGXLogger,
    // private spinner: NgxUiLoaderService,
    private ngxSpinner: NgxSpinnerService,
    private location: Location,
    private promoService: PromoService,
    private modalService: BsModalService,

    @Inject(DOCUMENT) private _document: HTMLDocument
  ) {
    this.router.events.subscribe((e) => {
      if (e instanceof NavigationEnd) {
        if (e.url === "/") {
          window["skipHomeScripts"] = true;
        } else {
          window["skipHomeScripts"] = false;
        }

        console.log("page load");
        CommonUtility.setDatalayer({}, this._storeSvc);
        if (window["customPageLoad"]) {
          window["customPageLoad"]();
        }
      }
      if (e instanceof NavigationStart) {
        browserRefresh = !this.router.navigated;
        browserBack = e.navigationTrigger === "popstate";
      }
    });
  }

  ngOnInit(): void {
    FeatureFlags.setEnabledFeatures();
    this.paramLangCode = "";

    const deviceType = this.deviceDetectSrv.getDeviceType();
    this._storeSvc.updateDeviceType(deviceType);
    this.cookieConsentUserSettingsSubscription = this._storeSvc
      .getUserSettings()
      .subscribe((sharedData) => {
        this.localeObj = sharedData.localeObj;
      });
    const userSettings: IUserSettingsState = this._storeSvc.getUserSettingsState();
    this._subscription = this.store.subscribe((state) => {
      window.sessionStorage["storeState"] = JSON.stringify(state);
    });
    this._userSettingsSubscriptions = this.location.subscribe((path) => {
      if (path.url.includes("rooms")) {
        this.redirectToRoomsPage();
      }
    });

    this.propertyInfoSubscription = this.appSvc
      .getPropertInfo()
      .subscribe((propInfo) => {
        this.propertyInfo = _.get(propInfo, "data");
        if (this.propertyInfo) {
          /* Start -- Multiproperty Related Code **/
          const userSettingsObj: IUserSettingsState = this._storeSvc.getUserSettingsState();
          const selectedPropertyLink = window.location.href;
          const urlObject = new URL(selectedPropertyLink);
          if (
            !!userSettingsObj &&
            (urlObject.searchParams.get("hotel") === null ||
              urlObject.searchParams.get("hotel") === "") &&
            userSettingsObj.multiPropertyInfo.isHotelSelected &&
            !this.propertyInfo.singlePropertyPortal
          ) {
            this._storeSvc.updateMultiPropertyInfo({
              isHotelSelected: false,
              hotelCode: "",
              hotelPortalSubdomain: "",
              hotelName: "",
            });
          }

          if (
            !!userSettingsObj &&
            (urlObject.searchParams.get("hotel") === null ||
              urlObject.searchParams.get("hotel") === "") &&
            !this.propertyInfo.singlePropertyPortal
          ) {
            this.isMultiPropertyPage = true;
          }
          /* End -- Multiproperty Related Code **/
          this.propertyInfo.maxAmenitiesShown =
            this.propertyInfo.maxAmenitiesShown || MAX_AMENITIES_SHOWN;
          this.propertyInfo.clientIp =
            this.propertyInfo.clientIp || DEFAULT_IP_DETAILS.ip;
          this.propertyInfo.masterVisaCheckoutApi = this.propertyInfo.mpgsMCEndpointURL;
          this.propertyInfo.clientCountry =
            this.propertyInfo.clientCountry || DEFAULT_IP_DETAILS.country;
          const eventData = _.get(this.propertyInfo, "eventData");
          if (eventData) {
            this.propertyInfo.eventData = eventData.substring(
              5,
              eventData.length - 2
            );
          } else {
            console.log("x-api-key is missing in propertyInfo API");
          }
        } else {
          console.log("propertyInfo API failed to send data");
        }
        this._storeSvc.updatePropertyInfoObj(this.propertyInfo);
        const params = this._route.snapshot.queryParams;
        const currentStep = _.get(
          this._storeSvc.getBasketState(),
          "CurrentStep"
        );
        const urlTree = this.router.parseUrl(this.router.url);
        let currentUrlPath = "";
        if (urlTree.root.children["primary"] !== undefined) {
          currentUrlPath = urlTree.root.children["primary"].segments
            .map((it) => it.path)
            .join("/");
        } else {
          currentUrlPath = "";
        }
        let selectedCurrency: Currency;
        if (_.get(params, QUERY_PARAM_ATTRIBUTES.CURRENCY)) {
          selectedCurrency = _.find(
            this.propertyInfo.supportedCurrencies,
            function (obj: Currency) {
              return obj.code === params[QUERY_PARAM_ATTRIBUTES.CURRENCY];
            }
          );
        }
        if (
          _.get(
            this._storeSvc.getUserSettingsState(),
            "propertyInfo.singlePropertyPortal"
          ) &&
          !selectedCurrency &&
          (currentUrlPath === URL_PATHS.HOME_PAGE ||
            currentUrlPath === URL_PATHS.GUEST_INFO_PAGE)
        ) {
          const currencyCodeInBasket = _.get(
            this._storeSvc.getBasketState(),
            "CurrencyCode"
          )
            ? _.get(this._storeSvc.getBasketState(), "CurrencyCode")
            : this.propertyInfo.defaultCurrency;
          selectedCurrency = CommonUtility.getCurrencyObjfromPropertyInfo(
            this.propertyInfo,
            currencyCodeInBasket
          );
        } else if (!selectedCurrency) {
          selectedCurrency = CommonUtility.getCurrencyObjfromPropertyInfo(
            this.propertyInfo,
            this.propertyInfo.defaultCurrency
          );
        }
        this._storeSvc.updateCurrencyCodeObj(selectedCurrency);
        this._route.queryParams.subscribe((queryParams) => {
          const us = this._storeSvc.getUserSettingsState();
          if (!!queryParams["locale"]) {
            this.paramLangCode = queryParams.locale || us.langObj.code || "en";
          } else {
            this.paramLangCode = us.propertyInfo.defaultLocale;
          }
          if (
            (_.isEmpty(us.localeObj) ||
              us.langObj.code !== this.paramLangCode ||
              (us.langObj.code === this.paramLangCode &&
                us.langObj.name.length === 0)) &&
            currentStep < STEP_MAP[URL_PATHS.GUEST_INFO_PAGE]
          ) {
            this.translationsSubscription = this.appSvc
              .getLaunageJSON(
                this.paramLangCode,
                this.propertyInfo.propertyCode
              )
              .subscribe((data) => {
                this.localeObj = data;
                _.forEach(LOCALE_OBJ_EN, (v, k) => {
                  if (!this.localeObj[k]) {
                    this.localeObj[k] = v;
                  }
                });
                this.localeObj["tf_1_Calendar_rateCalender_selectDropdown"] = !!this.localeObj["tf_1_Calendar_rateCalender_selectDropdown"] ? this.localeObj["tf_1_Calendar_rateCalender_selectDropdown"] : FILTERS_SELECT_LABEL;
                this.localeObj["tf_2_RoomList_filters_clearBtn"] = !!this.localeObj["tf_2_RoomList_filters_clearBtn"] ? this.localeObj["tf_2_RoomList_filters_clearBtn"] : FILTERS_CLEAR_LABEL;
                this._storeSvc.updateLocaleObj(this.localeObj);
              });
            this._storeSvc.updateLangObj(this.paramLangCode);
          } else {
            this.localeObj = us.localeObj;
          }
        });

        this.propertyInfoAvailable = true;
        this.storeSubscription = this._storeSvc
          .getBasket()
          .subscribe((sharedData) => {
            if (
              sharedData.isDirectBillPolicyRate
            ) {
            this.thirdStepperLabel = this.localeObj.tf_Header_Menu_guestCcInfo_DB;
          } else {
            this.thirdStepperLabel = this.localeObj.tf_Header_Menu_guestCcInfo;
          }

            if (
              sharedData.CurrentStep === 3 ||
              sharedData.isErrorPage === true ||
              this.router.url === "/managebooking" ||
              this.router.url.includes("/promo") ||
              this.router.url === "/promodetails" ||
              this.router.url.includes("/specials") ||
              this.router.url === "/" ||
              this.isMultiPropertyPage
            ) {
              this.showDiv = false;
            } else {
              this.showDiv = true;
            }
          });

        this._userSettingsSubscriptions = this._storeSvc
          .getUserSettings()
          .subscribe((sharedData) => {
            CommonUtility.removeScript("TealiumScript1");
            const basketSummary = this._storeSvc.getBasketState();
            const script1 = document.getElementById("TealiumScript1");
            let pageName = TEALIUM_PAGE_NAMES.booking_search;
            switch (basketSummary.CurrentStep) {
              case 0:
                pageName = TEALIUM_PAGE_NAMES.booking_search;
                break;
              case 1:
                pageName = TEALIUM_PAGE_NAMES.booking_select_room;
                break;
              case 2:
                pageName = TEALIUM_PAGE_NAMES.booking_payment;
                break;
              case 3:
                pageName = TEALIUM_PAGE_NAMES.booking_confirmation;
                break;
              default:
                pageName = TEALIUM_PAGE_NAMES.booking_search;
            }
            if (script1 === null || script1 === undefined) {
              const defaultCurrencyCode =
                _.get(
                  this._storeSvc.getUserSettingsState(),
                  "propertyInfo.defaultCurrency"
                ) || "SGD";
              const scriptText1 = CommonUtility.populate_utag_data(
                basketSummary,
                sharedData.langObj,
                defaultCurrencyCode,
                pageName,
                pageName
              );
              const scriptObj1 = {
                id: "TealiumScript1",
                type: "text/javascript",
                innerHTML: scriptText1,
              };
              CommonUtility.loadScript(scriptObj1);
            }
            this.localeObj = sharedData.localeObj;
            this.setTitle(this.localeObj.tf_Header_Commons_title);
            this.setPortalScripts();
            this.setDescription(this.localeObj.tf_Generic_description);

            // const rateMatchScript = environment.rateMatchScript;
            // const ele = document.getElementById('rateMatchScript');
            // if (rateMatchScript && (ele === null || ele === undefined)) {
            //   const rateMatchScriptObj = {
            //     isAsync: true,
            //     id: 'rateMatchScript',
            //     src: rateMatchScript
            //   };
            //   CommonUtility.loadScript(rateMatchScriptObj);
            // }
          });
      });

    // subscribe to cookieconsent observables to react to main events
    // this.popupOpenSubscription = this.ccService.popupOpen$.subscribe(
    //   () => {
    //     // you can use this.ccService.getConfig() to do stuff...
    //   });

    this.popupCloseSubscription = this.ccService.popupClose$.subscribe(() => {
      // you can use this.ccService.getConfig() to do stuff...
      this._storeSvc.updateGDPRCookieValue(true);
    });

    // this.initializeSubscription = this.ccService.initialize$.subscribe(
    //   (event: NgcInitializeEvent) => {
    //     // you can use this.ccService.getConfig() to do stuff...
    //   });

    // this.statusChangeSubscription = this.ccService.statusChange$.subscribe(
    //   (event: NgcStatusChangeEvent) => {
    //     // you can use this.ccService.getConfig() to do stuff...
    //   });

    // this.revokeChoiceSubscription = this.ccService.revokeChoice$.subscribe(
    //   () => {
    //     // you can use this.ccService.getConfig() to do stuff...
    //   });

    // this.noCookieLawSubscription = this.ccService.noCookieLaw$.subscribe(
    //   (event: NgcNoCookieLawEvent) => {
    //     // you can use this.ccService.getConfig() to do stuff...
    //   });

    this.modalSubscription = this.modalService.onHidden.subscribe(() => {
      if(!!this._storeSvc.getBasketState().focusableModalElem) {
      document
        .getElementById(this._storeSvc.getBasketState().focusableModalElem)
        .focus({ preventScroll: true });
      this._storeSvc.setActiveModalElem("");
      }
    });
  }

  reinitializeCookieConsent() {
    const userSettingsState = this._storeSvc.getUserSettingsState();
    let showCookiePopup = _.get(
      userSettingsState.propertyInfo,
      "showCookiePopup"
    );
    if (showCookiePopup === undefined || showCookiePopup === null) {
      showCookiePopup = SHOW_COOKIE_POPUP;
    }
    if (showCookiePopup) {
      // Check for portal setting to show/hide cookie popup
      const flag = this._storeSvc.getBasketState().GDPRCookieSet;
      if (flag) {
        try {
          this.ccService.destroy();
        } catch (e) {}
      } else {
        const deviceType = this.deviceDetectSrv.getDeviceType();
        const cookie_msg =
          deviceType === "d" || deviceType === "t"
            ? this.localeObj.tf_Header_Commons_gdpr_cookieMsgDesktop
            : this.localeObj.tf_Header_Commons_gdpr_cookieMsgMobile;
        const cookieConfig: NgcCookieConsentConfig = {
          cookie: {
            domain: "tinesoft.github.io",
          },
          position: "top",
          theme: "classic",
          palette: {
            popup: {
              background: "#ffffff",
              text: "#000000",
              link: "#000000",
              border: "#f8e71c",
            },
            button: {
              background: "transparent",
              border: "grey",
              text: "#000000",
            },
            // highlight: { background: '#f8e71c', border: '#f8e71c', text: '#000000' },
          },
          type: "info",
          content: {
            message: cookie_msg,
            dismiss: this.localeObj
              .tf_Header_Common_grpr_cookie_dismiss_message,
            deny: this.localeObj.tf_Header_Commons_gdprDenyMsg,
            link: "",
            href: ""
          },
          elements:{
            messagelink: `<span id="cookieconsent:desc" class="cc-message" tabindex="0">{{message}}</span>`
          }
        };
        try {
          this.ccService.destroy();
        } catch (e) {}
        this.ccService.init(cookieConfig);
      }
    } else {
      try {
        this.ccService.destroy();
      } catch (e) {}
    }
    document
      .querySelector(".cc-compliance")
      ?.children[0].setAttribute(
        "aria-label",
        this.localeObj.tf_Header_Common_grpr_cookie_dismiss_message
      );
  }

  ngOnDestroy(): void {
    const subscriptionsList = [
      this._subscription,
      this.storeSubscription,
      this._userSettingsSubscriptions,
      this.IPInfoSubscription,
      this.propertyInfoSubscription,
      this.translationsSubscription,
      this.popupCloseSubscription,
      this.cookieConsentUserSettingsSubscription,
      this.modalSubscription,
    ];
    CommonUtility.removeSubscriptions(subscriptionsList);
    // this.popupOpenSubscription.unsubscribe();
    // this.initializeSubscription.unsubscribe();
    // this.statusChangeSubscription.unsubscribe();
    // this.revokeChoiceSubscription.unsubscribe();
    // this.noCookieLawSubscription.unsubscribe();
  }

  gotoStep(e: Event, el: HTMLElement, step: string) {
    const userSettingsState = this._storeSvc.getUserSettingsState();
    const languageObject = _.get(userSettingsState, "langObj");
    const rateCode = _.get(this._storeSvc.getBasketState(), "offerCode");
    this._storeSvc.updateIs3DSCrediCardFlag(undefined);
    if (step === "search") {
      const checkInSummary = this._storeSvc.getBasketState()[
        "GuestSummary"
      ] as CheckinSummary;
      const params = CommonUtility.getSearchPageQueryParams(
        rateCode,
        languageObject,
        checkInSummary,
        this._storeSvc
      );
      const navigationExtras = {
        queryParams: params,
      };
      this.router.navigate(["/" + URL_PATHS.SEARCH_PAGE], navigationExtras);
    } else if (step === "select-room") {
      const checkInSummary = this._storeSvc.getBasketState()[
        "GuestSummary"
      ] as CheckinSummary;
      const isPromoFlow = this._storeSvc.getBasketState().isPromoFlow;
      const isSpecialsFlow = this._storeSvc.getBasketState().isSpecialsFlow;
      const accessCodeVal =
        this._storeSvc.getBasketState().promoData.accessCode ||
        this._route.snapshot.queryParams.accessCode;
      const isGuestInfoPageVisited = this._storeSvc.getBasketState()
        .IsGuestInfoPageVisited;
      let offercodeParam;
      let promoRatePlanLandingFlow = false;
      if (isPromoFlow && accessCodeVal === "") {
        offercodeParam = this._route.snapshot.queryParams.offerCode;
        promoRatePlanLandingFlow = !!offercodeParam ? true : false;
      }
      if (
        isGuestInfoPageVisited &&
        ((!!accessCodeVal &&
          this._storeSvc.getBasketState().isCompoundAccessCode) ||
          promoRatePlanLandingFlow ||
          isSpecialsFlow)
      ) {
        this._promosSubscription = this.promoService.getAvailablePromosDataWithParams(
          this._storeSvc.getBasketState().GuestSummary,
          accessCodeVal,
          isSpecialsFlow,
          this._storeSvc.getUserSettingsState().propertyInfo,
          this.paramLangCode,
          undefined,
          undefined,
          offercodeParam,
          undefined
        );

        this.promoService.promos.subscribe((response) => {
          let noAvailabilityFlag = false;
          let offerDetails: any;
          if (response && _.get(response, "status.statusCode") === 1000) {
            const availablePromos = response;
            let otherBookableOffers: any;
            let promoList = [];
            promoList = availablePromos.data.ratePlanDetails;
            const offercode_val = this._route.snapshot.queryParams.offerCode;
            if (
              offercode_val !== "" &&
              offercode_val !== null &&
              offercode_val !== undefined
            ) {
              offerDetails = _.find(availablePromos.data.ratePlanDetails, [
                "code",
                offercode_val,
              ]);

              otherBookableOffers = _.find(
                availablePromos.data.ratePlanDetails,
                function (o) {
                  return o.code !== offercode_val && o.isBookable;
                }
              );
              if (offerDetails && offerDetails.isBookable) {
                this._storeSvc.updateIsSelectedRatePlanAvailable(true);
              } else {
                this._storeSvc.updateIsSelectedRatePlanAvailable(false);
                if (isSpecialsFlow) {
                  const bummerObj = {
                    accessCodeBummer: this.localeObj
                      .tf_2_RoomList_promo_bummer_noAccessCodeOffersAvailableMsg,
                    prevRoute: location.pathname,
                    displayBummer: true,
                  };
                  this._storeSvc.updatePromoBummer(bummerObj);
                }
              }
            }
            if (
              !isSpecialsFlow &&
              !!this._route.snapshot.queryParams.accessCode
            ) {
              if (availablePromos.data.ratePlanDetails.length === 1) {
                this._storeSvc.updateIsCompoundAccessCode(false);
              } else {
                this._storeSvc.updateIsCompoundAccessCode(true);
              }

              if (availablePromos.data.ratePlanDetails.length > 1) {
                if (otherBookableOffers) {
                  this._storeSvc.updateOtherCompoundOffersAvailable(true);
                } else {
                  this._storeSvc.updateOtherCompoundOffersAvailable(false);
                }
              }
            }
            this.redirectToRoomsPage();
          } else {
            if (response) {
              if (_.get(response, "status.statusCode") === 6000) {
                noAvailabilityFlag = true;
                this.redirectToRoomsPage();
              }
            }
          }
        });
      } else {
        this.redirectToRoomsPage();
      }
    } else if (step === "guest-info") {
      const sData = this._storeSvc.getBasketState();
      const rooms = this._storeSvc.getBasketState().Rooms;
      const params = CommonUtility.getGuestInfoQueryParams(
        rooms,
        languageObject
      );
      const navigationExtras = {
        queryParams: params,
      };
      this.router.navigate(["/" + URL_PATHS.GUEST_INFO_PAGE], navigationExtras);
    } else if (step === "confirmation") {
      const rooms = this._storeSvc.getBasketState().Rooms;
      const params = CommonUtility.getConfirmationQueryParams(
        undefined,
        rooms,
        languageObject
      );
      const navigationExtras = {
        queryParams: params,
      };
      this.router.navigate(
        ["/" + URL_PATHS.CONFIRMATION_PAGE],
        navigationExtras
      );
    }
    CommonUtility.highlightStep(step.toString());
  }

  public setTitle(newTitle: string) {
    this.titleService.setTitle(newTitle);
  }

  public setDescription(newDescription: string) {
    this.metaService.updateTag({
      name: "description",
      content: newDescription,
    });
  }

  redirectToRoomsPage() {
    const checkInSummary = this._storeSvc.getBasketState()[
      "GuestSummary"
    ] as CheckinSummary;
    this.roomCode = this._storeSvc.getBasketState().Rooms[0].RoomCode;
    this.selectedIndex = 0;
    const roomsData = this._storeSvc.getBasketState().Rooms;
    const prevOfferCode = roomsData[0].RatePlan.code;
    if (roomsData.length === 1) {
      this.roomCode =
        roomsData[0].UniqueCode + "," + roomsData[0].RatePlan.code;
    } else {
      this.roomCode =
        roomsData[this.selectedIndex].UniqueCode +
        "," +
        roomsData[this.selectedIndex].RatePlan.code;
    }
    if (this.roomCode !== undefined) {
      this._storeSvc.saveEditedRoom(
        true,
        this.selectedIndex,
        roomsData[this.selectedIndex]
      );
      this._storeSvc.updateEmptySingleRoom(this.selectedIndex);
      const roomBookingOrder = [];
      roomBookingOrder.push(this.selectedIndex);
      this._storeSvc.upsertMultiRoomBookingOrder(roomBookingOrder);
    }
    let offerCode = this._storeSvc.getBasketState().offerCode;
    if (
      this._storeSvc.getBasketState().IsGuestInfoPageVisited &&
      !this._storeSvc.getBasketState().isPromoFlow &&
      !this._storeSvc.getBasketState().isSpecialsFlow &&
      !!this._storeSvc.getBasketState().promoData.accessCode
    ) {
      // single accessCode stepper - 'Select Room' click
      offerCode = prevOfferCode;
    }
    const params = CommonUtility.getQueryParamObjGuestSummary(
      checkInSummary,
      this._storeSvc,
      offerCode
    );
    const navigationExtras = {
      queryParams: params,
      fragment: this.roomCode,
    };
    this.router
      .navigate(["/" + URL_PATHS.ROOMS_PAGE], navigationExtras)
      .then((d) => CommonUtility.highlightStep("select-room"));
  }

  setPortalScripts() {
    const currentLang = this._storeSvc.getUserSettingsState().langObj.code;
    const RTL_LANG = ["he", "ar"];
    const body = $("body");
    if (
      FeatureFlags.isFeatureEnabled("rtl") &&
      RTL_LANG.indexOf(currentLang) !== -1
    ) {
      body.attr("dir", "rtl");
    } else {
      body.attr("dir", "auto");
    }
    setTimeout(() => {
      this.ngxSpinner.show();
    }, 10);

    try {
      // Load Favicon
      const favicon = this._document.getElementById("appFavicon");
      if (favicon.getAttribute("data-set") === "true") {
        return;
      }

      favicon.setAttribute("data-set", "true");
      favicon.setAttribute("href", this.propertyInfo.portalFavIconUrl);

      // Load scripts from admin

      // This will auto generate functions in window object
      // for each page load / position event defined in admin

      // The current ones are:
      // - bodyEndFunc() - body-end
      // - headFunc() - head
      // - calendarFunc() - Calendar
      // - roomPageFunc() - Room page
      // - roomRateplanFunc() - Room-Rateplan
      // - multiRoomRateplansFunc() - MultiRoom-Rateplan
      // - checkoutPageFunc() - Checkout Page
      // - confirmationPageFunc() - Confirmation Page
      // - specialsPageMultipleFunc() - Specials page Multiple
      // - specialsPageSingleFunc() - Specials Page Single
      // - promoPageMultipleFunc() - Promo Page Multiple
      // - promoPageSingleFunc() -Promo Page Single
      // - manageBookingLookupPageFunc() - Manage Booking Lookup page
      // - cancellationConfirmationPageFunc() - Cancellation confirmation Page
      // - multiPropertyFunc() - Multiproperty Page

      // Note that there is no function for body-start
      const xhr = new XMLHttpRequest();
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const scriptData = JSON.parse(xhr.response).data;
          if (scriptData) {
            // Add custom GTM scripts
            scriptData["gtmHead"] = `<!-- Google Tag Manager -->
    <script>
      (function (w, d, s, l, i) {
        w[l] = w[l] || [];
        w[l].push({
          "gtm.start": new Date().getTime(),
          event: "gtm.js",
        });
        var f = d.getElementsByTagName(s)[0],
          j = d.createElement(s),
          dl = l != "dataLayer" ? "&l=" + l : "";
        j.async = true;
        j.src = "https://www.googletagmanager.com/gtm.js?id=" + i + dl;
        f.parentNode.insertBefore(j, f);
      })(window, document, "script", "dataLayer", "GTM-T7W322V");
    </script>
    <!-- End Google Tag Manager -->`;

            scriptData["gtmBody"] = `<!-- Google Tag Manager (noscript) -->
    <noscript
      ><iframe
        src="https://www.googletagmanager.com/ns.html?id=GTM-T7W322V"
        height="0"
        width="0"
        style="display: none; visibility: hidden;"
      ></iframe
    ></noscript>
    <!-- End Google Tag Manager (noscript) -->`;
            Object.keys(scriptData).forEach((key) => {
              let scriptLocation = "head";
              const funcName = _.camelCase(key + "Func");
              const unloadFuncName = _.camelCase("unload" + key + "Func");

              if (!window[funcName]) {
                const functionCalled = {};
                functionCalled[funcName] = 0;

                window[funcName] = (forceCall = false) => {
                  if (functionCalled[funcName] === 0 || forceCall) {
                    if (key === "gtmBody" || key === "body-start") {
                      scriptLocation = "body";
                      $(scriptLocation).prepend(scriptData[key]);
                    } else if (key === "Header") {
                      scriptLocation = "body";
                      const headerDiv = document.createElement("div");
                      headerDiv.id = "customHeader";
                      headerDiv.innerHTML = scriptData[key];
                      $(scriptLocation).prepend(headerDiv);
                    } else if (key === "body-end" || key === "footer") {
                      const footerDiv = document.createElement("div");
                      scriptLocation = "body";
                      footerDiv.id = "customFooter";
                      footerDiv.innerHTML = scriptData[key];
                      $(scriptLocation).append(footerDiv);
                    } else if (key === "gtmHead") {
                      $(scriptLocation).prepend(scriptData[key]);
                    } else {
                      $(scriptLocation).append(scriptData[key]);
                    }
                    functionCalled[funcName]++;
                  }

                  window[unloadFuncName] = () => {
                    if (functionCalled[funcName] > 0) {
                      functionCalled[funcName]--;
                    }
                  };
                };
              }
            });
          } else {
            console.log("No scripts setup");
          }
        } else {
          // Request failed
          console.log("The request failed");
        }
      };

      xhr.open(
        "GET",
        `${
          environment.path_prefix
        }/scripts?portalSubdomain=${CommonUtility.getSubdomain()}`
      );
      xhr.send();

      const headElement = document.getElementsByTagName("head")[0];
      const linkElement = document.createElement("link");
      linkElement.href = `${
        environment.custom_scripts_path
      }/${CommonUtility.getSubdomain()}/css/theme.css?ts=${+new Date()}`;
      linkElement.rel = "stylesheet";
      headElement.appendChild(linkElement);
      $("head").append(linkElement);
    } catch (error) {
      console.log(error);
    } finally {
      setTimeout(() => {
        if (!window["skipHomeScripts"]) {
          if (window["headFunc"]) {
            window["headFunc"]();
          }
          if (window["customPageLoad"]) {
            window["customPageLoad"]();
          }

          if (window["headerFunc"]) {
            window["headerFunc"]();
          }
          if (window["bodyStartFunc"]) {
            window["bodyStartFunc"]();
          }
          if (window["gtmBodyFunc"]) {
            window["gtmBodyFunc"]();
          }

          if (window["footerFunc"]) {
            window["footerFunc"]();
          }

          if (window["bodyEndFunc"]) {
            window["bodyEndFunc"]();
          }
          if (window["gtmHeadFunc"]) {
            window["gtmHeadFunc"]();
          }
        }
        this.proceed = true;
        this.reinitializeCookieConsent();
        $('a.cc-btn.cc-dismiss').keyup(function(event){
          if(event.keyCode == 13 || event.keyCode == 32){
            event.target.click();
          }
         });
        this.ngxSpinner.hide();
      }, 2000);
    }
  }
}
