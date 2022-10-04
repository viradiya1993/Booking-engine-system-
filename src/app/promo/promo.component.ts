import { HttpClient } from "@angular/common/http";
import {
  Component,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
  ChangeDetectorRef,
  AfterContentChecked,
} from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import * as _ from "lodash";
import { BsModalService } from "ngx-bootstrap/modal";
import { BsModalRef } from "ngx-bootstrap/modal/bs-modal-ref.service";
import { Subscription } from "rxjs";
import { Room } from "src/app/room";
import {
  CUSTOM_CURRENCY_FORMAT,
  DEFAULT_PRIMARY_ROOM_ATTRIBUTE_FILTER,
  DEFAULT_SECONDARY_ROOM_ATTRIBUTE_FILTER,
  ErrorCodesListInComponents,
  NON_DECIMAL_CURRENCIES,
  QUERY_PARAM_ATTRIBUTES,
  STEP_MAP,
  TEALIUM_PAGE_NAMES,
  tealiumScript3,
  URL_PATHS,
} from "../common/common.constants";
import { CommonUtility } from "../common/common.utility";
import { PromoService } from "../common/services/promo/promo.service";
import { StoreService } from "../common/services/store.service";
import { IBasketState } from "../common/store/reducers/basket.reducer";
import { PromoDetails, Promos } from "../promo";
import { CheckinSummary } from "../search/guestduration/checkinsummary.type";
import { PromoDetailsComponent } from "./promoDetails/promo-details.component";
import { PromoListComponent } from "./promoList/promo-list.component";

@Component({
  selector: "app-promo",
  templateUrl: "./promo.component.html",
  styleUrls: ["./promo.component.scss"],
})
export class PromoComponent implements OnInit, OnDestroy {
  private _subscription: Subscription;
  private basketSubscription: Subscription;
  private IPInfoSubscription: Subscription;
  private routerSubscription: Subscription;
  public roomViews$: string[];
  public roomTypes$: string[];
  private checkInSummary: CheckinSummary;
  private currency = "USD";
  private langCode: string;
  rateCode: string;
  currencies: any[];
  isSortOrderAsc: boolean;
  private queryParamsSnapshot: any;
  currencyType: string;
  currCode: string;
  selectedPromo: PromoDetails;
  discountedPrice: number;
  avgPrice: number;
  showPromoDetails: boolean;
  searchTransactionId: string;
  isSpecialsFlow: boolean;
  propertyInfo: any;
  offerCode: string;
  isSpecialRate: boolean;
  accessCode: string;

  public availablePromos: Promos;
  public promoList: PromoDetails[];
  public currencySelection: any = { code: "USD" };
  public availCurr = [];
  public modalRef: BsModalRef;
  public localeObj: any;
  public isCheckInDateEntry = true;
  private _userSettingsSubscriptions: Subscription;
  private _promosSubscription: Subscription;
  private popUpErrorMsg: string;
  @ViewChild("template", { static: true }) errorTemplate: TemplateRef<any>;

  constructor(
    private _authHttp: HttpClient,
    private promoService: PromoService,
    private router: Router,
    private modalService: BsModalService,
    private _storeSvc: StoreService,
    private _route: ActivatedRoute,
    private cdref: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.promoList = [];
    this.searchTransactionId = "";
    const userSettingsState = this._storeSvc.getUserSettingsState();
    this.checkInSummary = new CheckinSummary(
      _.get(userSettingsState, "propertyInfo.propertyTimezone.timezoneOffset")
    );
    this.propertyInfo = _.get(userSettingsState, "propertyInfo");

    this.promoService.promos.subscribe((response) => {
      let noAvailabilityFlag = false;
      let offerDetails: any;

      if (response && _.get(response, "status.statusCode") === 1000) {
        this.availablePromos = response;
        this.promoList = [];
        if (
          this.offerCode !== "" &&
          this.offerCode !== null &&
          this.offerCode !== undefined
        ) {
          offerDetails = _.find(this.availablePromos.data.ratePlanDetails, [
            "code",
            this.offerCode,
          ]);
          if (offerDetails) {
            this.promoList.push(offerDetails);
          } else {
            // noAvailabilityFlag = true;
            this.promoList = this.availablePromos.data.ratePlanDetails;
          }
        } else {
          this.promoList = this.availablePromos.data.ratePlanDetails;
        }
        this.searchTransactionId = this.availablePromos.data.searchTransactionId;
        this.promoService.offersAvail = this.promoList.length;
        if (this.accessCode && !this.router.url.includes("/specials")) {
          if (this.promoList.length === 1) {
            this._storeSvc.updateIsCompoundAccessCode(false);
          } else {
            this._storeSvc.updateIsCompoundAccessCode(true);
          }
        }
        if (this.promoList.length === 1) {
          this.selectedPromo = this.promoList[0];
          this.showPromoDetails = true;
        } else {
          this.showPromoDetails = false;
        }
      } else {
        if (response) {
          if (_.get(response, "status.statusCode") === 6000) {
            noAvailabilityFlag = true;
          }
        }
      }
      if (noAvailabilityFlag) {
        this.redirectToSearchPage();
      }
    });

    this.routerSubscription = this._route.queryParams.subscribe((params) => {
      if (
        params[QUERY_PARAM_ATTRIBUTES.CHECKINDATE] === undefined ||
        params[QUERY_PARAM_ATTRIBUTES.CHECKINDATE] === ""
      ) {
        this.isCheckInDateEntry = false;
      } else {
        this.isCheckInDateEntry = true;
      }
      const checkInSummaryObject = CommonUtility.getCheckInSummaryFromQueryParams(
        params
      );
      this.checkInSummary = checkInSummaryObject.checkinSummary;
      if (
        this.router.url.includes("/specials") ||
        this.promoService.currentFlow === true
      ) {
        this.isSpecialsFlow = true;
        this._storeSvc.updateIsSpecialsFlowFlag(this.isSpecialsFlow);
        this._storeSvc.updateIsPromoFlowFlag(false);
        if (!this.router.url.includes("/specials")) {
          const newParams = _.cloneDeep(this._route.snapshot.queryParams);
          newParams.offerCode =
            this._storeSvc.getBasketState().splOfferCode ||
            this._route.snapshot.queryParams.offerCode;
          this.router.navigate(["/specials"], {
            queryParams: newParams,
            replaceUrl: true,
          });
        }
      } else {
        this.isSpecialsFlow = false;
        this._storeSvc.updateIsPromoFlowFlag(true);
        this._storeSvc.updateIsSpecialsFlowFlag(this.isSpecialsFlow);
      }
      // if (!this.isSpecialsFlow) {
      //   if (checkInSummaryObject.isCheckInDateExists) {
      //     this._storeSvc.updateGuestDuration(this.checkInSummary);
      //     // Reload the rooms listing page if invalid url params
      //     const modifiedParams = checkInSummaryObject.queryParams;
      //     const newParams = {};
      //     _.forEach(params, (v, k) => {
      //       newParams[k] = v;
      //     });
      //     _.forEach(checkInSummaryObject.queryParams, (v, k) => {
      //       newParams[k] = v;
      //     });
      //     if (this.selectedPromo) {
      //       newParams["offerCode"] = this.selectedPromo.code;
      //     }
      //     const navigationExtras = {
      //       queryParams: newParams,
      //     };
      //     this.router.navigate(["/" + URL_PATHS.PROMO_PAGE], navigationExtras);
      //   }
      // }

      this.isSpecialRate = this.isSpecialsFlow
        ? true
        : params[QUERY_PARAM_ATTRIBUTES.IS_SPECIAL_RATE] || false;
      this.accessCode = params[QUERY_PARAM_ATTRIBUTES.ACCESS_CODE] || "";
      this.offerCode = params[QUERY_PARAM_ATTRIBUTES.OFFERCODE] || "";

      CommonUtility.setDatalayer({
        promo_code: this.accessCode,
        offer_code: this.offerCode,
        // Empty error state in data layer, in case of pre existing error
        error_type: "",
        error_code: "",
        error_description: "",
      });

      this.langCode =
        params[QUERY_PARAM_ATTRIBUTES.LOCALE] ||
        this.propertyInfo.defaultLocale;

      if (this.isCheckInDateEntry) {
        this._promosSubscription = this.promoService.getAvailablePromosDataWithParams(
          this.checkInSummary,
          this.accessCode,
          this.isSpecialRate,
          this.propertyInfo,
          this.langCode,
          undefined,
          undefined,
          this.offerCode
        );
      } else {
        this._promosSubscription = this.promoService.getAvailablePromosDataWithParams(
          null,
          this.accessCode,
          this.isSpecialRate,
          this.propertyInfo,
          this.langCode,
          undefined,
          undefined,
          this.offerCode
        );
      } // end of else
    });

    this.isSortOrderAsc = true;

    this.basketSubscription = this._storeSvc.getBasket().subscribe((basket) => {
      this.currencyType =
        basket.CurrencyCode === undefined ? "SGD" : basket.CurrencyCode;
      this.currCode = CommonUtility.getCurrSymbolForType(
        this._storeSvc.getUserSettingsState().propertyInfo,
        this.currencyType
      );
      // const selectedCurrency = _.find(this.currencies, function (obj) {
      //   return obj.code ===  this.currCode;
      // });

      // Specials flow UI-1 bummer
      if (this.isSpecialsFlow) {
        if (
          this._storeSvc.getBasketState().bummerObj.prevRoute ===
          "/" + URL_PATHS.GUEST_INFO_PAGE
        ) {
          this.popUpErrorMsg = this._storeSvc.getBasketState().bummerObj.accessCodeBummer;
          if (!!this.popUpErrorMsg) {
            this.openModal(this.errorTemplate);
            CommonUtility.focusOnModal('promo-bummer-modal');
            CommonUtility.setDatalayer({
              error_type: "bummer",
              error_code: "",
              error_description: this.popUpErrorMsg,
            });
          }
        }
      }
    });

    this.isSortOrderAsc = true;

    this._userSettingsSubscriptions = this._storeSvc
      .getUserSettings()
      .subscribe((sharedData) => {
        this.localeObj = sharedData.localeObj;
      });

    CommonUtility.setDatalayer({}, this._storeSvc);
  }

  ngAfterContentChecked() {
    this.cdref.detectChanges();
  }

  ngOnDestroy(): void {
    const subscriptionList = [
      this.basketSubscription,
      this.routerSubscription,
      this._userSettingsSubscriptions,
    ];
    CommonUtility.removeSubscriptions(subscriptionList);
  }

  openModal(template: TemplateRef<any>) {
    if (this.modalRef === undefined) {
      this.modalRef = this.modalService.show(template, { class: "modal-md" });
    } else {
      return;
    }
  }

  closeErrorPopUp() {
    if (this.modalRef !== undefined) {
      this.modalRef.hide();
    }
    this.modalRef = undefined;
    const bummerObj = {
      accessCodeBummer: "",
      prevRoute: location.pathname,
      displayBummer: false,
    };
    this._storeSvc.updatePromoBummer(bummerObj);
    this.popUpErrorMsg = "";
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
    this.router.navigate(["/" + URL_PATHS.SEARCH_PAGE], navigationExtras);
  }

  promoClickEventHandler(promo) {
    this.showPromoDetails = true;
    this.selectedPromo = promo;
    const params = this._route.snapshot.queryParams;
    const newParams = _.cloneDeep(params);
    newParams["offerCode"] = promo.code;
    newParams["propertyCode"] =
      params[QUERY_PARAM_ATTRIBUTES.PROPETY_CODE] ||
      this.propertyInfo.propertyCode;
    const navigationExtras = {
      queryParams: newParams,
    };
    if (!this.isSpecialsFlow) {
      this.router.navigate(["/" + URL_PATHS.PROMO_PAGE], navigationExtras);
    } else {
      this.router.navigate(["/" + URL_PATHS.SPECIALS_PAGE], navigationExtras);
    }
  }

  updateCurrencySelection(currency: any) {
    this.currencySelection = currency;
  }

  toggleSortOrder() {
    this.isSortOrderAsc = !this.isSortOrderAsc;
  }

  openFiltersModal(template: TemplateRef<any>) {
    this.modalRef = this.modalService.show(
      template,
      Object.assign({}, { class: "modal-md" })
    );
    return false;
  }

  applyFilters() {
    this.modalRef.hide();
  }

  closeFilter() {
    this.modalRef.hide();
  }
}
