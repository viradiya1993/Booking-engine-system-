import { Injectable } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { Observable, Subject } from "rxjs";
import { CommonUtility } from "../../../common/common.utility";
import { SESSION_URL_CONST } from "../../../common/urls.constants";
import { CheckinSummary } from "../../../search/guestduration/checkinsummary.type";
import { QUERY_PARAM_ATTRIBUTES } from "../../common.constants";
import { HttpWrapperService } from "../http-wrapper.service";

@Injectable({
  providedIn: "root",
})
export class CrossSellServiceService {
  constructor(private _authHttp: HttpWrapperService, private router: ActivatedRoute) {}

  getCrossSellAddons(
    currCode: string,
    guestSummary: CheckinSummary
  ): Observable<any> {
    let params = {};
    if (guestSummary) {
      params = {
        arrivalDate: CommonUtility.formateDate(guestSummary.checkindate),
        departureDate: CommonUtility.formateDate(guestSummary.checkoutdate),
        currencyCode: currCode === undefined ? "SGD" : currCode,
      };
    }
    const routeParams = this.router.snapshot.queryParams;
    params[QUERY_PARAM_ATTRIBUTES.PROPETY_CODE] = routeParams.propertyCode;
    return this._authHttp.get(SESSION_URL_CONST.CROSS_SELL_ADDONS, params);
  }
}
