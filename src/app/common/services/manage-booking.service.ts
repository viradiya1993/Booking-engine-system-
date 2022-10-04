import { Injectable } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import * as _ from "lodash";
import { Observable, Subscription } from "rxjs";
import { SESSION_URL_CONST } from "../../common/urls.constants";
import { QUERY_PARAM_ATTRIBUTES } from "../common.constants";
import { HttpWrapperService } from "./http-wrapper.service";
import { StoreService } from "./store.service";

@Injectable()
export class ManageBookingService {
  constructor(private _authHttp: HttpWrapperService, private router: ActivatedRoute) {}

  public getReservationLookup(options: object): Observable<any> {
    const routeParams = this.router.snapshot.queryParams;
    options[QUERY_PARAM_ATTRIBUTES.PROPETY_CODE] = routeParams.propertyCode;
    return this._authHttp.get(
      SESSION_URL_CONST.GET_RESERVATION_LOOKUP,
      options
    );
  }

  public cancelBookingRequest(requestBody: object): Observable<any> {
    return this._authHttp.post(
      SESSION_URL_CONST.CANCEL_RESERVATION_REQUEST,
      requestBody
    );
  }

  public getGuestPreference(arrivalDate: string): Observable<any> {
    const params = {
      arrivalDate,
    };
    const routeParams = this.router.snapshot.queryParams;
    params[QUERY_PARAM_ATTRIBUTES.PROPETY_CODE] = routeParams.propertyCode;
    return this._authHttp.get(SESSION_URL_CONST.GET_PREFERENCES, params);
  }

  public changeGuestPreference(requestBody: object): Observable<any> {
    return this._authHttp.post(
      SESSION_URL_CONST.CHANGE_PREFERENCES,
      requestBody
    );
  }
  public verifyReservation(params: object): Observable<any> {
    return this._authHttp.get(SESSION_URL_CONST.VALIDATE_RESERVATION, params);
  }

  public validateModify(confirmationCode: String): Observable<any> {
    const params = {
      confirmationCode,
    };
    return this._authHttp.get(SESSION_URL_CONST.VALIDATE_FOR_MODIFY, params);
  }
}
