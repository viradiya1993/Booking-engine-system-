import {
  Component,
  OnDestroy,
  OnInit,
  Renderer2,
  TemplateRef,
  ViewChild,
} from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { State } from "@ngrx/store";
import * as _ from "lodash";
import { BsModalService } from "ngx-bootstrap/modal";
import { BsModalRef } from "ngx-bootstrap/modal/bs-modal-ref.service";
import { NGXLogger } from "ngx-logger";
import { Subscription } from "rxjs";
import {
  CUSTOM_CURRENCY_FORMAT,
  DEFAULT_PRIMARY_ROOM_ATTRIBUTE_FILTER,
  DEFAULT_SECONDARY_ROOM_ATTRIBUTE_FILTER,
  ErrorCodesListInComponents,
  NON_DECIMAL_CURRENCIES,
  QUERY_PARAM_ATTRIBUTES,
  STEP_MAP,
  URL_PATHS,
} from "../../common/common.constants";
import { CommonUtility } from "../../common/common.utility";
import { errorMsgMap } from "../../common/error-codes/error-codes-en";
import { PromoService } from "../../common/services/promo/promo.service";
import { RoomListingService } from "../../common/services/roomListing.Service";
import { StoreService } from "../../common/services/store.service";
import { IBasketState } from "../../common/store/reducers/basket.reducer";
import { AvailableRooms, Room } from "../../room";
import { CheckinSummary } from "../../search/guestduration/checkinsummary.type";
import { RoomsComponent } from "../rooms/rooms.component";
import { FeatureFlags } from "src/app/common/feature.flags";

@Component({
  selector: "app-room-listing-page",
  templateUrl: "./room-listing-page.component.html",
  styleUrls: ["./room-listing-page.component.scss"],
})
export class RoomListingComponent implements OnInit, OnDestroy {
  private _subscription: Subscription;
  private basketSubscription: Subscription;
  private IPInfoSubscription: Subscription;
  private routerSubscription: Subscription;
  public roomViews$: string[];
  public roomTypes$: string[];
  public availableRooms: AvailableRooms;
  public roomsList$: Room[];
  public isParamsValid: boolean;
  public multiRoomBanner: boolean;
  public guestInfoEditClicked: boolean;
  public guestInfoSelectedRoom: string;
  public roomBookingOrder: any[];
  private checkInSummary: CheckinSummary;
  public lowPriceData: any;
  private currency = "SGD";
  private maxChild = 0;
  private maxAdult = 0;
  private isLangChanged: boolean;
  private langCode: string;
  public isGuestInfoPageVisited: boolean;
  rateCode: string;
  currencySelection: any = { code: "SGD" };
  modalRef: BsModalRef;
  roomTypeFilter = DEFAULT_PRIMARY_ROOM_ATTRIBUTE_FILTER;
  roomViewFilter = DEFAULT_SECONDARY_ROOM_ATTRIBUTE_FILTER;
  localeObj: any;
  currencies: any[];
  isSortOrderAsc: boolean;
  private _userSettingsSubscriptions: Subscription;
  private queryParamsSnapshot: any;
  RTL_Flag: boolean = false;

  @ViewChild("Rooms", { static: true }) Rooms: RoomsComponent;
  noSelectedPackagesFound: any;
  isSelectedPackageNotFound: boolean;
  dlErrorCode: any;
  filteredRoomList: Room[];
  propertyType: any;
  constructor(
    private _roomSvc: RoomListingService,
    private modalService: BsModalService,
    private _route: ActivatedRoute,
    private _router: Router,
    private _storeSvc: StoreService,
    private renderer: Renderer2,
    private state: State<any>,
  ) {}

  ngOnInit() {
    this.verifyRoomsParam();
    const basketState = this._storeSvc.getBasketState() as IBasketState;
    this.isGuestInfoPageVisited = basketState.IsGuestInfoPageVisited;

    if (basketState.CurrentStep !== STEP_MAP[URL_PATHS.ROOMS_PAGE]) {
      this._storeSvc.updateCurrentStep(STEP_MAP[URL_PATHS.ROOMS_PAGE]);
    }

    this._storeSvc.removeErrors(ErrorCodesListInComponents.RoomListingPage);
    this.isParamsValid = true;
    this.checkInSummary = undefined;
    this.guestInfoEditClicked = false;
    this.guestInfoSelectedRoom = "";
    this.rateCode = "";
    this.rateCode = basketState.offerCode;
    this.isLangChanged = false;
    this.langCode = this._storeSvc.getUserSettingsState().langObj.code;

    this._userSettingsSubscriptions = this._storeSvc
      .getUserSettings()
      .subscribe((sharedData) => {
        this.localeObj = sharedData.localeObj;
        this.currencies = sharedData.propertyInfo.supportedCurrencies;
        this.RTL_Flag = CommonUtility.langAlignCheck(this._storeSvc.getUserSettingsState().langObj.code, FeatureFlags);
        const basketData = this._storeSvc.getBasketState();
        this.propertyType = sharedData.propertyInfo.propertyType || '';
        if (basketData.ResetFilters) {
          this.roomTypeFilter = this.localeObj.tf_2_RoomList_rooms_primaryRoomAttribute;
          this.roomViewFilter = this.localeObj.tf_2_RoomList_roomListFilters_secondaryRoomAttribute;
        }
      });
    this.isSortOrderAsc = true;

    this.basketSubscription = this._storeSvc
      .getBasket()
      .subscribe((basketData) => {
        this.rateCode = basketData.offerCode;
        if (
          this.checkInSummary === undefined ||
          !this.compareCheckInSummary(
            this.checkInSummary,
            basketData.GuestSummary
          )
        ) {
          if (
            basketData.GuestSummary !== undefined &&
            Number(basketData.GuestSummary.rooms) > 1
          ) {
            this.multiRoomBanner = true;
            this.roomBookingOrder = basketData.RoomBookingOrder;
          } else {
            this.multiRoomBanner = false;
            this.roomBookingOrder = undefined;
          }
          if (this.multiRoomBanner) {
            if (
              !this.compareCheckInSummary(
                this.checkInSummary,
                basketData.GuestSummary
              ) ||
              this.isLangChanged === true
            ) {
              this._storeSvc.updateEmptyRooms();
              this._storeSvc.upsertMultiRoomBookingOrder([]);
              basketData.Rooms = [];
              this.roomBookingOrder = [];
              this.isLangChanged = false;
            }
            let index = 0;
            if (
              basketData.Rooms.length === 0 &&
              this.roomBookingOrder.length === 0
            ) {
              basketData.GuestSummary.guests.forEach((element) => {
                this.roomBookingOrder.push(index);
                index++;
              });
              this._storeSvc.upsertMultiRoomBookingOrder(this.roomBookingOrder);
            }
          }
          if (basketData.GuestSummary !== undefined) {
            this.checkInSummary = basketData.GuestSummary;
          }
        }

        this.currency = basketData.CurrencyCode;
        this.currencySelection.code = basketData.CurrencyCode;
        if (window["ratematchJSON"]) {
          window["ratematchJSON"]["currency"] = this.currency;
          window["ratematchJSON"]["hotel_lowest_price"] = this.lowestRoomPrice(
            this.multiRoomBanner,
            this.roomBookingOrder,
            this.lowPriceData,
            this.currency
          );
          window["ratematchJSON"]["currency_show_decimal"] = _.includes(
            NON_DECIMAL_CURRENCIES,
            this.currency
          )
            ? false
            : true;
          window["ratematchJSON"]["currency_thousands_separator"] =
            _.get(CUSTOM_CURRENCY_FORMAT[this.currency], "SEPERATOR") !==
            undefined
              ? "dot"
              : "comma";
          CommonUtility.setDatalayer(window["ratematchJSON"]);
        }
        this.renderer.setAttribute(
          document.body,
          "data-currency",
          this.currency
        );
      });

    this._subscription = this._roomSvc.rooms.subscribe((data) => {
      if (data && _.get(data, "status.statusCode") !== 1000) {
        this._storeSvc.setError(data.status.statusCode);
      }
      this.availableRooms = data;

      if (this.availableRooms.data) {
        if (
          this.isGuestInfoPageVisited &&
          !!this._route.snapshot.queryParams.accessCode &&
          this._storeSvc.getBasketState().isSelectedRatePlanAvailable !== "" &&
          !this._storeSvc.getBasketState().isSelectedRatePlanAvailable &&
          this._storeSvc.getBasketState().isCompoundAccessCode &&
          this._storeSvc.getBasketState()
            .isOtherCompoundAccessCodeOfferAvailable !== "" &&
          this._storeSvc.getBasketState()
            .isOtherCompoundAccessCodeOfferAvailable
        ) {
          this._storeSvc.removeError(3001);

          // Bummber - 1
          const bummerObj = {
            accessCodeBummer: this.localeObj
              .tf_2_RoomList_promo_bummer_accessCodeOffersAvailableMsg,
            prevRoute: this._storeSvc.getBasketState().bummerObj.prevRoute,
            displayBummer: true,
          };
          this._storeSvc.updatePromoBummer(bummerObj);
        }

        if (
          (this.isGuestInfoPageVisited &&
            !!this._route.snapshot.queryParams.accessCode &&
            this._storeSvc.getBasketState().isSelectedRatePlanAvailable !==
              "" &&
            !this._storeSvc.getBasketState().isSelectedRatePlanAvailable &&
            !this._storeSvc.getBasketState().isCompoundAccessCode) ||
          (this.isGuestInfoPageVisited &&
            this._storeSvc.getBasketState().isSpecialsFlow &&
            this._storeSvc.getBasketState().isSelectedRatePlanAvailable !==
              "" &&
            !this._storeSvc.getBasketState().isSelectedRatePlanAvailable)
        ) {

          // show Bummer -2 here as  well as per BER-610
          const bummerObj = {
            accessCodeBummer: this.localeObj
              .tf_2_RoomList_promo_bummer_noAccessCodeOffersAvailableMsg,
            prevRoute: location.pathname,
            displayBummer: true,
          };
          this._storeSvc.updatePromoBummer(bummerObj);
        }

        let roomTypes;
        let roomViewFilter = DEFAULT_SECONDARY_ROOM_ATTRIBUTE_FILTER;
        let roomTypeFilter = DEFAULT_PRIMARY_ROOM_ATTRIBUTE_FILTER;
        if (this.localeObj && this.localeObj !== undefined) {
          roomViewFilter = _.get(
            this.localeObj,
            "tf_2_RoomList_roomListFilters_secondaryRoomAttribute"
          ) || DEFAULT_SECONDARY_ROOM_ATTRIBUTE_FILTER;
          roomTypeFilter = _.get(
            this.localeObj,
            "tf_2_RoomList_rooms_primaryRoomAttribute"
          ) || DEFAULT_PRIMARY_ROOM_ATTRIBUTE_FILTER;
        }
        this.roomViews$ =
          this.availableRooms.data.roomviews.length > 0 &&
          this.availableRooms.data.roomviews !== undefined &&
          !this.availableRooms.data.roomviews.includes(null)
            ? [roomViewFilter, ...this.availableRooms.data.roomviews]
            : [];
        if (
          this.availableRooms.data.roomtypes.length > 0 &&
          this.availableRooms.data.roomtypes !== undefined
        ) {
          this.roomTypes$ = [
            roomTypeFilter,
            ...this.availableRooms.data.roomtypes,
          ];
        } else {
          roomTypes = this.availableRooms.data.availableRooms.map((element) =>
            element.roomType.toString().split("-").shift().trim()
          );
          roomTypes = Array.from(new Set(roomTypes));
          this.roomTypes$ = [roomTypeFilter, ...roomTypes];
        }

        // Start- ADA fix for filters
        setTimeout(() => {
          $('.accesibleDropDown .ng-select.ng-select-single input[type="text"]').each(function() { this.setAttribute('tabindex', '-1'); this.setAttribute('aria-label', 'Dropdown') });
        }, 10);

        // End- ADA fix for filters
        this.roomsList$ = this.availableRooms.data.availableRooms;
        this.filteredRoomList = _.cloneDeep(this.availableRooms.data.availableRooms);
        // if(!!this._storeSvc.getBasketState().roomAttributes && this.multiRoomBanner) {
          this.updateRoomList(this._storeSvc.getBasketState().roomAttributes);
        // }
        this._storeSvc.updateSortOrder(true);
        if (this.roomsList$.length === 0) {
          this.multiRoomBanner = false;
        }
        this.lowPriceData = _.get(this.availableRooms.data, "lowestPricedRoom");
      } else {
        let isPromoRatePlanLandingFlow = false;
        if (
          this.isGuestInfoPageVisited &&
          this._storeSvc.getBasketState().isPromoFlow &&
          this._route.snapshot.queryParams.accessCode === "" &&
          this._storeSvc.getBasketState().promoData.accessCode === "" &&
          !!this._storeSvc.getBasketState().promoData.offerCode &&
          !this._storeSvc.getBasketState().isSelectedRatePlanAvailable &&
          !this._storeSvc.getBasketState().isCompoundAccessCode
        ) {
          isPromoRatePlanLandingFlow = true;
        }

        if (
          (this._storeSvc.getBasketState().isSelectedRatePlanAvailable !== "" &&
            this.isGuestInfoPageVisited &&
            !!this._route.snapshot.queryParams.accessCode &&
            !this._storeSvc.getBasketState().isSelectedRatePlanAvailable &&
            (!this._storeSvc.getBasketState().isCompoundAccessCode ||
              (this._storeSvc.getBasketState().isCompoundAccessCode &&
                this._storeSvc.getBasketState()
                  .isOtherCompoundAccessCodeOfferAvailable !== "" &&
                !this._storeSvc.getBasketState()
                  .isOtherCompoundAccessCodeOfferAvailable))) ||
          (this.isGuestInfoPageVisited &&
            !!this._route.snapshot.queryParams.accessCode &&
            (!this._storeSvc.getBasketState().isCompoundAccessCode ||
              (this._storeSvc.getBasketState().isCompoundAccessCode &&
                this._storeSvc.getBasketState().isSelectedRatePlanAvailable !==
                  "" &&
                !this._storeSvc.getBasketState().isSelectedRatePlanAvailable &&
                this._storeSvc.getBasketState()
                  .isOtherCompoundAccessCodeOfferAvailable !== "" &&
                !this._storeSvc.getBasketState()
                  .isOtherCompoundAccessCodeOfferAvailable))) ||
          isPromoRatePlanLandingFlow
        ) {
          // Guest info page visited, selected offer is no more, it is a single accessCode flow
          // Bummber - 2
          const bummerObj = {
            accessCodeBummer: this.localeObj
              .tf_2_RoomList_promo_bummer_noAccessCodeOffersAvailableMsg,
            prevRoute: this._storeSvc.getBasketState().bummerObj.prevRoute,
            displayBummer: true,
          };
          this._storeSvc.updatePromoBummer(bummerObj);
        }

        this.roomsList$ = undefined;
        this.roomViews$ = undefined;
        this.roomTypes$ = undefined;
        this.multiRoomBanner = false;
        this.lowPriceData = "";
        const iataNumberUrlParam = this._route.snapshot.queryParams.iataNumber;
        if (iataNumberUrlParam) {
          // check the basket iataCode, agency name presence
          const userSettingsState = this._storeSvc.getUserSettingsState();
          const langObj = _.get(userSettingsState, "langObj");
          const offerCode = this._storeSvc.getBasketState().offerCode;
          const params = CommonUtility.getSearchPageQueryParams(
            offerCode,
            langObj
          );
          const newParams = {};
          _.forEach(params, (v, k) => {
            newParams[k] = v;
          });
          newParams["errorCode"] = 4000;
          const navigationExtras = {
            queryParams: newParams,
          };
          this._router.navigate(
            ["/" + URL_PATHS.SEARCH_PAGE],
            navigationExtras
          );
        } else {
          const accessCodeParam = this._route.snapshot.queryParams.accessCode;
          const selectedRoom = this.state.getValue().basketServiceReducer.Rooms;
          if (
            (accessCodeParam !== undefined && accessCodeParam !== "") ||
            isPromoRatePlanLandingFlow
          ) {
            if (selectedRoom.length > 0 || isPromoRatePlanLandingFlow) {
              const offerCode = this._storeSvc.getBasketState().offerCode;
              const params = CommonUtility.getQueryParamObjGuestSummary(
                this.checkInSummary,
                this._storeSvc,
                offerCode
              );
              const newParams = {};
              _.forEach(params, (v, k) => {
                newParams[k] = v;
              });
              if (newParams[QUERY_PARAM_ATTRIBUTES.ACCESS_CODE] !== undefined) {
                const priorAccessCode = this._storeSvc.getBasketState()
                  .promoData.accessCode;
                const modifiedPromoObject = {
                  priorAccessCode,
                  accessCode: "",
                  validationState: true,
                };
                this._storeSvc.updatePromoData(modifiedPromoObject);
                delete newParams[QUERY_PARAM_ATTRIBUTES.ACCESS_CODE];
              }
              if (
                newParams[QUERY_PARAM_ATTRIBUTES.IS_SPECIAL_RATE] !== undefined
              ) {
                delete newParams[QUERY_PARAM_ATTRIBUTES.IS_SPECIAL_RATE];
              }
              if (newParams[QUERY_PARAM_ATTRIBUTES.OFFERCODE] !== undefined) {
                delete newParams[QUERY_PARAM_ATTRIBUTES.OFFERCODE];
              }
              const newParams1 = {};
              _.forEach(newParams, (v, k) => {
                newParams1[k] = v;
              });
              const navigationExtras = {
                queryParams: newParams1,
              };
              // Remove the accessCode , offerCode, isSpecialRate params from url and reload the page
              this._router
                .navigate(["/" + URL_PATHS.ROOMS_PAGE], navigationExtras)
                .then((d) => CommonUtility.highlightStep("select-room"));
            } else {
              this.redirectToSearchPage();
            }
          }
        }
      }
      window["ratematchJSON"] = {
        hotel_lowest_price:
          this.lowPriceData !== ""
            ? this.lowestRoomPrice(
                this.multiRoomBanner,
                this.roomBookingOrder,
                this.lowPriceData,
                this.currency
              )
            : "",
        arrival_date: this.checkInSummary.checkindate,
        departure_date: this.checkInSummary.checkoutdate,
        currency: this.currency,
        num_rooms: this.checkInSummary.rooms,
        num_adults: this.maxAdult,
        num_children: this.maxChild,
        availability_error: null,
        hotel_lowest_rate_plan_name: _.get(this.lowPriceData, "ratePlanName"),
        locale: this.langCode,
        is_special_rate:
          this._route.snapshot.queryParams.offerCode === "" ||
          this._route.snapshot.queryParams.offerCode === undefined
            ? false
            : true,
        currency_show_decimal: _.includes(NON_DECIMAL_CURRENCIES, this.currency)
          ? false
          : true,
        currency_decimal_separator: "dot",
        currency_thousands_separator:
          _.get(CUSTOM_CURRENCY_FORMAT[this.currency], "SEPERATOR") !==
          undefined
            ? "dot"
            : "comma",
        currency_thousands_style: 3,
      };
      CommonUtility.setDatalayer(window["ratematchJSON"]);
      // seting attributes for ratematch DOM
      this.renderer.setAttribute(document.body, "data-currency", this.currency);
      this.renderer.setAttribute(document.body, "data-language", this.langCode);
      this.renderer.setAttribute(document.body, "data-pageLoaded", "true");
      this.renderer.setAttribute(document.body, "data-filterApplied", "false");

      this.routerSubscription = this._route.queryParams.subscribe((params) => {
        const quotelist = [];
        const guestSummary = this._storeSvc.getGuestSummary();
        for (const guestInfo of this._storeSvc.getGuestSummary().guests) {
          if (!!this.roomsList$) {
            const quoteObj = {
              lr: _.get(
                this.lowPriceData,
                "averagePriceByCurrency." + guestSummary.currency
              ), // lowest rate room displayed
              hr: _.get(
                this.roomsList$[this.roomsList$.length - 1],
                "averagePriceByCurrency." + guestSummary.currency
              ), // highest rate room displayed
              cc: guestSummary.currency, // currency code
              sd: CommonUtility.formateDate(guestSummary.checkindate), // check-in date [Format YYYY-MM-DD]
              ed: CommonUtility.formateDate(guestSummary.checkoutdate), // check-out date [Format YYYY-MM-DD]
              na: guestInfo.adults, // number of adults
              nc: guestInfo.children, // number of children
              nr: guestSummary.rooms, // number of rooms
              nn: guestSummary.los, // number of nights
            };
            quotelist.push(quoteObj);
          }
        }

        CommonUtility.setDatalayer({
          quoteList: quotelist,
          rtNUMROOMS: this._storeSvc.getGuestSummary().guests.length,
          rt4OFFERCODE: params.offerCode || null,
          rt4ACCESSCODE: params.accessCode || null,
          rt4IATACODE: params.iataNumber || null,
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
      });
    });

    this.routerSubscription = this._route.queryParams.subscribe((params) => {
      const rateCodeParam = params[QUERY_PARAM_ATTRIBUTES.OFFERCODE];
      const localeParam = params[QUERY_PARAM_ATTRIBUTES.LOCALE];
      if (
        rateCodeParam === undefined ||
        rateCodeParam === null ||
        localeParam === undefined ||
        localeParam === null ||
        localeParam.length === 0
      ) {
        const redirectParams = {};
        _.forEach(params, (v, k) => {
          redirectParams[k] = v;
        });
        const us = this._storeSvc.getUserSettingsState();
        const languageObj = _.get(us, "langObj");
        redirectParams[QUERY_PARAM_ATTRIBUTES.LOCALE] =
          _.get(languageObj, "code") || "en";
        redirectParams[QUERY_PARAM_ATTRIBUTES.OFFERCODE] = "";
        if (
          rateCodeParam !== undefined &&
          rateCodeParam !== null &&
          rateCodeParam.length > 0
        ) {
          redirectParams[QUERY_PARAM_ATTRIBUTES.OFFERCODE] = rateCodeParam;
        }
        if (
          localeParam !== undefined &&
          localeParam !== null &&
          localeParam.length > 0
        ) {
          redirectParams[QUERY_PARAM_ATTRIBUTES.LOCALE] = localeParam;
        }
        const navigationExtras = {
          queryParams: redirectParams,
        };
        this._router
          .navigate(["/" + URL_PATHS.ROOMS_PAGE], navigationExtras)
          .then((d) => CommonUtility.highlightStep("select-room"));
      }
      if (
        params[QUERY_PARAM_ATTRIBUTES.OFFERCODE] !== undefined &&
        params[QUERY_PARAM_ATTRIBUTES.OFFERCODE] !== null &&
        params[QUERY_PARAM_ATTRIBUTES.OFFERCODE].length > 0
      ) {
        this.rateCode = params[QUERY_PARAM_ATTRIBUTES.OFFERCODE];
        this._storeSvc.updateOfferCode(this.rateCode);
      } else {
        this.rateCode = this._storeSvc.getBasketState().offerCode;
      }
      const errorCode = params["ErrorCode"];
      if (
        params["locale"] !== undefined &&
        params["locale"] !== this.langCode
      ) {
        // const us = this._storeSvc.getUserSettingsState().langObj;
        this.isLangChanged = true;
        this.langCode = params["locale"];
      }
      const storedLangObj = this._storeSvc.getUserSettingsState().langObj;
      if (
        params["locale"] !== undefined &&
        storedLangObj.code !== params["locale"]
      ) {
        const us = this._storeSvc.getUserSettingsState();
        const languageObj = CommonUtility.getLangObjfromPropertyInfo(
          us.propertyInfo,
          params["locale"]
        );
        if (languageObj.code !== params["locale"]) {
          languageObj.code = params["locale"];
          languageObj.name = "";
        }
        this._storeSvc.updateLangObj(languageObj.code);
        const newParams = {};
        _.forEach(params, (v, k) => {
          newParams[k] = v;
        });
        newParams["reset"] = "yes";
        const navigationExtras = {
          queryParams: newParams,
        };
        this._router
          .navigate(["/" + URL_PATHS.ROOMS_PAGE], navigationExtras)
          .then((d) => CommonUtility.highlightStep("select-room"));
      }
      if (errorCode && Number(errorCode) === 3001) {
        this.noSelectedPackagesFound = errorMsgMap[errorCode];
        this.dlErrorCode = errorCode;
        this.isSelectedPackageNotFound = true;
        CommonUtility.setDatalayer({
          error_type: "red-error",
          error_code: this.dlErrorCode,
          error_description: this.noSelectedPackagesFound,
        });
      } else if (errorCode && Number(errorCode) === 4000) {
        this.roomsList$ = [];
        this.roomTypes$ = [];
        this.roomViews$ = [];
        this.lowPriceData = "";
        this._storeSvc.setError(4000);
        this.isParamsValid = false;
        this.multiRoomBanner = false;
        return;
      }
      const userSettings = this._storeSvc.getUserSettingsState();
      const checkInSummaryObject = CommonUtility.getCheckInSummaryFromQueryParams(
        params
      );
      const checkInSummary = checkInSummaryObject.checkinSummary;
      const iataObject = _.get(this._storeSvc.getUserSettingsState(), "iata");
      iataObject["prevIataNumber"] = iataObject["iataNumber"];
      iataObject["iataNumber"] = _.get(params, QUERY_PARAM_ATTRIBUTES.IATA);
      this._storeSvc.updateIATADetails(iataObject);

      if (!this._storeSvc.getBasketState().isSearchPageVisited) {
        // if guest directly landed on rooms page
        this._storeSvc.updateIsSearchPageVisitedFlag(true);
      }
      if (checkInSummaryObject.isCheckInDateExists) {
        if (checkInSummaryObject.isvalidParam) {
          if (this.isLangChanged) {
            this.roomBookingOrder = [];
            this.checkInSummary = undefined;
            this._storeSvc.upsertMultiRoomBookingOrder([]);
            this._storeSvc.updateEmptyRooms();
          }
          this._storeSvc.updateGuestDuration(checkInSummary);
          if (params[QUERY_PARAM_ATTRIBUTES.CURRENCY]) {
            if (basketState.IsGuestInfoPageVisited) {
              // Browser back button flow from tillpayments to roomlisting page to guestInfo
              if (basketState.is3DSCreditCard !== undefined && basketState.is3DSCreditCard) {
                this.goToGuestInfoPage(userSettings, basketState);
                return;
              }

              // Browser back button flow from guestinfo to roomlisting page
              const selectedCurrency = { code: basketState.CurrencyCode };
              this._storeSvc.updateIsGuestInfoVisitedFlag(false);
              const guestSummary = this._storeSvc.getBasketState().GuestSummary;
              let errorStatusCode;
              if (guestSummary.restrictionFailed) {
                this._storeSvc.setError(4000);
                errorStatusCode = 4000;
              }

              const offer_code =
                this.rateCode !== undefined &&
                this.rateCode !== "" &&
                this.rateCode.length > 0
                  ? this.rateCode
                  : undefined;
              // fetch the currency code from currency code and set to url params and then reload
              const newparams = CommonUtility.getQueryParamObjGuestSummary(
                guestSummary,
                this._storeSvc,
                offer_code,
                errorStatusCode
              );
              const navigationExtras = {
                queryParams: newparams,
              };
              this._router
                .navigate([], navigationExtras)
                .then((d) => CommonUtility.highlightStep("select-room"));
            } else {
              const selectedCurrency = _.find(this.currencies, function (obj) {
                return obj.code === params[QUERY_PARAM_ATTRIBUTES.CURRENCY];
              });
              if (selectedCurrency) {
                this._storeSvc.updateCurrencyCodeObj(selectedCurrency);
                if (!this._storeSvc.getBasketState().isSearchPageVisited) {
                  // if guest directly landed on rooms page
                  this._storeSvc.updateIsSearchPageVisitedFlag(true);
                }
              }
            }
          }
          let roomNo = 0;
          if (this.multiRoomBanner) {
            if (this.roomBookingOrder.length > 0) {
              roomNo = this.roomBookingOrder[0];
            } else {
              roomNo = Number(checkInSummary.rooms) - 1;
            }
          }
          const oldParams = _.cloneDeep(this.queryParamsSnapshot);
          const newParams = _.cloneDeep(params);
          // _.unset(oldParams, "Currency");
          // _.unset(newParams, "Currency");
          setTimeout(() =>{ 
            if (!_.isEqual(oldParams, newParams)) {
              this._roomSvc.getAvailableRoomsDataWithParams(
                checkInSummary,
                this.rateCode,
                roomNo,
                this.multiRoomBanner
              );
            }
          },100);
          this.queryParamsSnapshot = params;
          this.isParamsValid = true;
          this.setMaxGuestInfoForRateMatch(checkInSummary);
          // this._roomSvc.getLowestRoomPrice(checkInSummary, basketState.CurrencyCode);
        } else {
          // Reload the rooms listing page if invalid url params
          this._storeSvc.updateGuestDuration(checkInSummary);
          const modifiedParams = checkInSummaryObject.queryParams;
          const newParams = {};
          _.forEach(params, (v, k) => {
            newParams[k] = v;
          });
          _.forEach(checkInSummaryObject.queryParams, (v, k) => {
            newParams[k] = v;
          });
          const navigationExtras = {
            queryParams: newParams,
          };
          this._router
            .navigate(["/" + URL_PATHS.ROOMS_PAGE], navigationExtras)
            .then((d) => CommonUtility.highlightStep("select-room"));
        }
      } else {
        // Set no availability error if checkingDate is undefined.
        this.isParamsValid = false;
      }
    });

    setTimeout(() => {
      // roomPageFunc() - Room page script from admin
      if (window["roomPageFunc"]) {
        window["roomPageFunc"]();
      }
      // if(!(this.propertyType.length > 0 && this.propertyType === 'UD')) {
      //   if(this._storeSvc.getBasketState().roomAttributes.length > 0) {
      //     this.updateRoomList(this._storeSvc.getBasketState().roomAttributes);
      //   }
      // }
    }, 3000);
  }

  redirectToSearchPage() {
    const userSettingsState = this._storeSvc.getUserSettingsState();
    const langObj = _.get(userSettingsState, "langObj");
    const searchPageparams = CommonUtility.getSearchPageQueryParams(
      undefined,
      langObj
    );
    const newParams = {};
    _.forEach(searchPageparams, (v, k) => {
      newParams[k] = v;
    });
    newParams["errorCode"] = 4000;
    const navigationExtras = {
      queryParams: newParams,
    };
    this._router.navigate(["/" + URL_PATHS.SEARCH_PAGE], navigationExtras);
  }

  toggleSortOrder() {
    this.isSortOrderAsc = !this.isSortOrderAsc;
  }

  updateCurrencySelection(currency) {
    this.currencySelection = currency;
  }

  updateRoomView(name) {
    this.roomViewFilter = name;
  }

  updateRoomType(name) {
    this.roomTypeFilter = name;
  }

  applyFilters() {
    this.updateCurrencyMobileSelection(this.currencySelection);
    // this._storeSvc.updateCurrencyCodeObj(this.currencySelection);
    this._storeSvc.updateRoomView(this.roomViewFilter);
    this._storeSvc.updateRoomType(this.roomTypeFilter);
    this._storeSvc.updateSortOrder(this.isSortOrderAsc);
    const rooms = this._storeSvc.getBasketState().Rooms;
    this._storeSvc.updateMultipleRoomsWithPricing(rooms);
    this.modalRef.hide();
  }

  goToGuestInfoPage(userSettings: any, basketState: any) {
    this._storeSvc.updateIsGuestInfoVisitedFlag(false);
    const rooms = basketState.Rooms;
    const langObj = _.get(userSettings, "langObj");
    const params = CommonUtility.getGuestInfoQueryParams(
      rooms,
      langObj
    );
    const navigationExtras = {
      queryParams: params,
    };
    this._router
    .navigate(["/" + URL_PATHS.GUEST_INFO_PAGE], navigationExtras)
    .then((d) => CommonUtility.highlightStep("guest-info"));
  }

  multiRoomBooked() {
    const roomNo = this.roomBookingOrder[0];
    this.roomBookingOrder.shift();
    this._storeSvc.upsertMultiRoomBookingOrder(this.roomBookingOrder);
    const basketData = this._storeSvc.getBasketState();
    const roomType = basketData.Rooms[roomNo].RoomDetails.name;
    const bedType = basketData.Rooms[roomNo].BedType;
    // this._roomSvc.overBookingCheck(this.availableRooms, roomType, bedType, 'add');
    const selectedRooms =
      sessionStorage.getItem("savedRooms") !== null
        ? JSON.parse(sessionStorage.getItem("savedRooms"))
        : [];
    selectedRooms[roomNo] = { roomType, bedType };
    sessionStorage.setItem("savedRooms", JSON.stringify(selectedRooms));
    if (this.roomBookingOrder.length > 0) {
      this._roomSvc.getAvailableRoomsDataWithParams(
        this.checkInSummary,
        this.rateCode,
        this.roomBookingOrder[0],
        true
      );
    }
  }

  compareCheckInSummary(newSummary: any, oldSummary: any) {
    if (newSummary === undefined) {
      return true;
    }
    if (Number(newSummary.rooms) !== Number(oldSummary.rooms)) {
      return false;
    }
    if (Number(newSummary.guests.length) !== Number(oldSummary.guests.length)) {
      return false;
    }
    if (Number(newSummary.los) !== Number(oldSummary.los)) {
      return false;
    }
    if (+newSummary.checkindate !== +oldSummary.checkindate) {
      return false;
    }
    if (+newSummary.checkoutdate !== +oldSummary.checkoutdate) {
      return false;
    }
    let index = 0;
    let returnVal = true;
    newSummary.guests.forEach((element) => {
      if (
        Number(element.adults) !== Number(oldSummary.guests[index].adults) ||
        Number(element.children) !== Number(oldSummary.guests[index].children)
      ) {
        returnVal = false;
      }
      index++;
    });
    return returnVal;
  }

  multiRoomRemoved(roomNo: number) {
    const basketData = this._storeSvc.getBasketState();
    // this._roomSvc.overBookingCheck(this.availableRooms, roomType, bedType, 'remove');
    this._storeSvc.updateEmptySingleRoom(Number(roomNo));
    this.roomBookingOrder.unshift(roomNo);
    this._storeSvc.upsertMultiRoomBookingOrder(this.roomBookingOrder);
    const selectedRooms = JSON.parse(sessionStorage.getItem("savedRooms"));
    // selectedRooms = selectedRooms.filter((room, index) => !(room.roomType === roomType && room.bedType === bedType &&
    //   roomNo === index));
    selectedRooms[roomNo] = { roomType: "", bedType: "" };
    sessionStorage.setItem("savedRooms", JSON.stringify(selectedRooms));
    if (this.roomBookingOrder.length > 0) {
      this._roomSvc.getAvailableRoomsDataWithParams(
        this.checkInSummary,
        this.rateCode,
        this.roomBookingOrder[0],
        true
      );
    }
  }

  openFiltersModal(template: TemplateRef<any>) {
    this._storeSvc.setActiveModalElem("mobile_filters_UD");
    this.modalRef = this.modalService.show(
      template,
      Object.assign({}, { class: "modal-md" })
    );
    return false;
  }

  setMaxGuestInfoForRateMatch(checkInSummary: CheckinSummary) {
    let adults = 0;
    let children = 0;
    const guests = checkInSummary.guests;
    guests.forEach((guestInfo) => {
      adults += guestInfo.adults;
      children += guestInfo.children;
    });
    this.maxAdult = adults;
    this.maxChild = children;
  }

  ngOnDestroy(): void {
    if (this.modalRef !== undefined) {
      this.modalRef.hide();
    }

    const subscriptionsList = [
      this._subscription,
      this.basketSubscription,
      this._userSettingsSubscriptions,
      this.IPInfoSubscription,
      this.routerSubscription,
    ];
    CommonUtility.removeSubscriptions(subscriptionsList);

    if (window["unloadRoomPageFunc"]) {
      window["unloadRoomPageFunc"]();
    }
  }

  public lowestRoomPrice(
    multiRoomBanner,
    roomBookingOrder,
    lowPriceData,
    currency
  ) {
    const basketData = this._storeSvc.getBasketState();
    let roomNo = 0;
    let adults = 0;
    let children = 0;
    let children_ages = "";
    if (multiRoomBanner) {
      if (roomBookingOrder.length > 0) {
        roomNo = roomBookingOrder[0];
      } else {
        roomNo = Number(basketData.GuestSummary.rooms) - 1;
      }
    }
    let guestsCount = 0;
    const los = _.get(basketData, "GuestSummary.los") || 0;
    if (basketData.GuestSummary.guests.length > roomNo) {
      adults = basketData.GuestSummary.guests[roomNo].adults;
      children = basketData.GuestSummary.guests[roomNo].children;
      for (let index = 0; index < children; index++) {
        if (children_ages !== "") {
          children_ages = children_ages + ",8";
        } else {
          children_ages = "8";
        }
      }
      guestsCount = adults + children;
    }
    let lowestRoomPrice = _.get(
      lowPriceData,
      "averagePriceByCurrency." + currency
    );
    const addOnUnitPrice = _.get(lowPriceData, "lowestAddOnPrice." + currency);
    if (addOnUnitPrice) {
      lowestRoomPrice = lowestRoomPrice + (addOnUnitPrice * guestsCount) / los;
    }
    lowestRoomPrice = this._storeSvc.applyPriceFormatPipe(
      lowestRoomPrice,
      currency,
      true
    );
    if (!_.includes(NON_DECIMAL_CURRENCIES, this.currency)) {
      lowestRoomPrice = CommonUtility.roundedValue(lowestRoomPrice, 2);
    }
    return lowestRoomPrice;
  }

  /**
     * Checks whether URL consists of 'Rooms' param
     * If not adds it based on 'Adults' per room
    */
  verifyRoomsParam(){
     if(!this._route.snapshot.queryParams.Rooms) {
      window.location.search += '&Rooms=1';
      const arr = [];
      for(const params in this._route.snapshot.queryParams) {
          if(params.includes('Adults_')) {
              arr.push(+(params.replace(/[^0-9.]/g,'')));
          }
      }
      window.location.search += '&Rooms='+Math.max(...arr);
    }
  }

  updateRoomList(update) {
    if(this.Rooms.selectedRoomArray.length > 0 && !this.Rooms.selectedRoomArray[2]) {
      this.Rooms.unselectRoom(this.Rooms.selectedRoomArray[0], this.Rooms.selectedRoomArray[1]);
    }    
    const  val = _.cloneDeep(this.filteredRoomList);
    this.roomsList$= CommonUtility.attributeFilter(val ,update,this.localeObj.tf_1_Calendar_rateCalender_selectDropdown);
  }

  updateCurrencyMobileSelection(currency: any) {
    this.currencySelection.code = currency.code;
    // this.currencySelection = currency;
    this._storeSvc.updateCurrencyCodeObj(currency);
    this._storeSvc.updateIntialCurrencyCodeObj(this.currencySelection.code);
    CommonUtility.setDatalayer({
      currency: currency.code,
    });
    const isManagebooking = this._storeSvc.getManageBookingFlowStatus();
    if (!isManagebooking) {
      const rooms = this._storeSvc.getBasketState().Rooms;
      this._storeSvc.updateMultipleRoomsWithPricing(rooms);
    }
    const guestSummary = this._storeSvc.getBasketState().GuestSummary;
    let errorStatusCode;
    if (guestSummary.restrictionFailed) {
      this._storeSvc.setError(4000);
      errorStatusCode = 4000;
    }
    const urlParams = this._route.snapshot.queryParams;
    const params = CommonUtility.getQueryParamObjGuestSummary(
      guestSummary,
      this._storeSvc,
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
    if (this._router.url.includes("/specials")) {
      this._router.navigate(["/" + URL_PATHS.SPECIALS_PAGE], navigationExtras);
    } else if (this._router.url.includes("/promo")) {
      this._router.navigate(["/" + URL_PATHS.PROMO_PAGE], navigationExtras);
    } else {
      this._router
        .navigate([], navigationExtras)
        .then((d) => CommonUtility.highlightStep("select-room"));
    }
  }
  
}
