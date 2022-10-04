import { Injectable } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import * as _ from "lodash";
import { Observable } from "rxjs";
import {
  META_SEARCH_PARAMS,
  QUERY_PARAM_ATTRIBUTES,
  URL_PATHS,
} from "../../common/common.constants";
import { CommonUtility } from "../../common/common.utility";
import {
  RatePlan,
  SelectedNightPriceFormat,
} from "../../common/models/packagedetails";
import { SESSION_URL_CONST } from "../../common/urls.constants";
import {
  CheckinSummary,
  ICheckinSummary,
} from "../../search/guestduration/checkinsummary.type";
import { StoreService } from "../services/store.service";
import { HttpResponseInterceptor } from "./http-response.interceptor";
import { HttpWrapperService } from "./http-wrapper.service";

@Injectable()
export class RatePlanListingService {
  private static CacheFactory: any[] = [];

  constructor(
    private _authHttp: HttpWrapperService,
    private router: ActivatedRoute,
    private storeSrv: StoreService
  ) {}

  public getRatePlanList(
    roomCodes: string[],
    guestSummary: ICheckinSummary,
    rateCode?: string
  ): Observable<any> {
    // const rno = roomNo || 0;  this.roomCodes.join(',')
    const isPromoFlow = this.storeSrv.getBasketState().isPromoFlow;
    const isSpecialsFlow = this.storeSrv.getBasketState().isSpecialsFlow;
    const promoData = _.get(this.storeSrv.getBasketState(), "promoData");
    if (roomCodes.length === 1) {
      HttpResponseInterceptor.reqCounter = 0;
    }
    const roomOccArray = new Array();
    for (let index = 0; index < roomCodes.length; index++) {
      const uniqueCodes = roomCodes[index].split(",");
      _.forEach(uniqueCodes, (uniqueCode) => {
        const noOfAdults = Number(guestSummary.guests[index].adults);
        const noOfChildren = Number(guestSummary.guests[index].children);
        const str = [uniqueCode, index + 1, noOfAdults, noOfChildren].join(":");
        roomOccArray.push(str);
      });
    }

    const id = roomCodes.join(",");
    SESSION_URL_CONST.GET_AVAILABLE_RATE_PLANS.path_suffix = id ? id : 1;
    let params = {};
    const iataNumber = _.get(
      this.storeSrv.getUserSettingsState(),
      "iata.iataNumber"
    );
    const accessCode =
      !this.router.snapshot.queryParams.accessCode &&
      this.storeSrv.getBasketState().promoData.priorAccessCode
        ? this.router.snapshot.queryParams.accessCode
        : this.storeSrv.getBasketState().promoData.accessCode;
    if (guestSummary) {
      params = {
        arrivalDate: CommonUtility.formateDate(guestSummary.checkindate),
        departureDate: CommonUtility.formateDate(guestSummary.checkoutdate),
        roomOccupancy: [roomOccArray.join(",")],
        currency: this.storeSrv.getBasketState().CurrencyCode
      };

      if (accessCode && !iataNumber) {
        params[QUERY_PARAM_ATTRIBUTES.ACCESS_CODE] = accessCode;
      }

      if (iataNumber) {
        params[QUERY_PARAM_ATTRIBUTES.IATA] = iataNumber;
      }

      if (rateCode !== undefined && !isPromoFlow) {
        params[QUERY_PARAM_ATTRIBUTES.OFFERCODE] = rateCode;
      }

      if (isPromoFlow || isSpecialsFlow) {
        params[QUERY_PARAM_ATTRIBUTES.ACCESS_CODE] = promoData.accessCode;
      }
      if (
        isSpecialsFlow &&
        this.storeSrv.getBasketState().isSelectedRatePlanAvailable === ""
      ) {
        params[QUERY_PARAM_ATTRIBUTES.OFFERCODE] = promoData.offerCode;
      }

      if (
        isSpecialsFlow &&
        this.storeSrv.getBasketState().isSelectedRatePlanAvailable !== "" &&
        !this.storeSrv.getBasketState().isSelectedRatePlanAvailable &&
        location.pathname === "/" + URL_PATHS.ROOMS_PAGE
      ) {
        params[QUERY_PARAM_ATTRIBUTES.OFFERCODE] = "";
      }
      if (
        location.pathname === "/" + URL_PATHS.ROOMS_PAGE &&
        accessCode &&
        this.storeSrv.getBasketState().isCompoundAccessCode
      ) {
        // Don't pass the offerCode to availability api in accesscode edit flow on stepper click
        params[QUERY_PARAM_ATTRIBUTES.OFFERCODE] = "";
      }
    }
    const routeParams = this.router.snapshot.queryParams;
    META_SEARCH_PARAMS.filter((item) => {
      if (routeParams.hasOwnProperty(item) && !!routeParams[item]) {
        params[item] = routeParams[item];
      }
    });
    params[QUERY_PARAM_ATTRIBUTES.PROPETY_CODE] = routeParams.propertyCode;
    return this._authHttp.get(
      SESSION_URL_CONST.GET_AVAILABLE_RATE_PLANS,
      params
    );
  }

  public getAvailableAddons(options: object): Observable<any> {
    return this._authHttp.get(SESSION_URL_CONST.AVAILABLE_ADDONS, options);
  }

  public getNightPrice(
    rPlan: RatePlan,
    currType: string
  ): SelectedNightPriceFormat[] {
    const nightPrice: SelectedNightPriceFormat[] = [];
    let priceSelected = 0.0;
    rPlan.nightlyPrices.forEach((elemet) => {
      const obj: SelectedNightPriceFormat = {
        effectiveDateFormat: "",
        price: 0.0,
        currCode: "",
      };
      obj.effectiveDateFormat = elemet.effectiveDate;
      priceSelected =
        elemet.discountedPriceByCurrency[currType] ||
        elemet.priceByCurrency[currType];
      obj.price = priceSelected;
      obj.currCode = currType;
      nightPrice.push(obj);
    });
    return nightPrice;
  }

  public getTax(rPlan: RatePlan, currType: string): number {
    let tax = 0.0;
    tax = (rPlan.taxesAndServiceChargesByCurrency[currType] || 0.0) + (rPlan.packageAddOnTaxesByCurrency[currType] || 0.0);
    return tax;
  }

  public getComments(rPlan: RatePlan): string[] {
    const commentsAdded: string[] = [];
    if (rPlan.rateplanComments && rPlan.rateplanComments !== undefined) {
      rPlan.rateplanComments.forEach((element) => {
        commentsAdded.push(element);
      });
      return commentsAdded;
    }
  }
}
