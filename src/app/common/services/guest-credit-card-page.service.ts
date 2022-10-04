import { Injectable } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import * as _ from "lodash";
import { Observable } from "rxjs";
import { SESSION_URL_CONST } from "../../common/urls.constants";
import { QUERY_PARAM_ATTRIBUTES } from "../common.constants";
import { StoreService } from "../services/store.service";
import { HttpWrapperService } from "./http-wrapper.service";

@Injectable()
export class GuestCreditCardPageService {
  constructor(
    private _authHttp: HttpWrapperService,
    private storeSrv: StoreService,
    private router: ActivatedRoute
  ) {}

  public getAvailableRoomUpgrade(options: object): Observable<any> {
    const iataNumber = _.get(
      this.storeSrv.getUserSettingsState(),
      "iata.iataNumber"
    );
    if (iataNumber) {
      options[QUERY_PARAM_ATTRIBUTES.IATA] = iataNumber;
    }
    const routeParams = this.router.snapshot.queryParams;
    options[QUERY_PARAM_ATTRIBUTES.PROPETY_CODE] = routeParams.propertyCode;
    return this._authHttp.get(
      SESSION_URL_CONST.AVAILABLE_ROOM_UPGRADE,
      options
    );
  }

  public upgradeRoom(options: object): Observable<any> {
    const iataNumber = _.get(
      this.storeSrv.getUserSettingsState(),
      "iata.iataNumber"
    );
    if (iataNumber) {
      options[QUERY_PARAM_ATTRIBUTES.IATA] = iataNumber;
    }
    return this._authHttp.get(SESSION_URL_CONST.UPGRADE_ROOM, options);
  }

  public validateRoomCodes(params: object): Observable<any> {
    const routeParams = this.router.snapshot.queryParams;
    params[QUERY_PARAM_ATTRIBUTES.PROPETY_CODE] = routeParams.propertyCode;
    return this._authHttp.get(SESSION_URL_CONST.VALIDATE_ROOM_ADDONS, params);
  }

  public getAlacarteAddons(params: object): Observable<any> {
    const routeParams = this.router.snapshot.queryParams;
    params[QUERY_PARAM_ATTRIBUTES.PROPETY_CODE] = routeParams.propertyCode;
    return this._authHttp.get(SESSION_URL_CONST.ALACARTE_ADDONS, params);
  }
}
