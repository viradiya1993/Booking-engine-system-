import { Injectable } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { QUERY_PARAM_ATTRIBUTES } from "../common.constants";
import { SESSION_URL_CONST } from "../urls.constants";
import { HttpWrapperService } from "./http-wrapper.service";

@Injectable()
export class HeaderService {
  constructor(private _authHttp: HttpWrapperService, private router: ActivatedRoute) {}

  public validateIATANumber(iataNumber: string): any {
    const params = {};
    params[QUERY_PARAM_ATTRIBUTES.VALIDATE_IATA_API_PARAM] = iataNumber;
    const promise = this._authHttp.get(
      SESSION_URL_CONST.VALIDATE_IATA_NUMBER,
      params
    );
    return promise;
  }

  public getHeaderMenuItems(): any {
    const routeParams = this.router.snapshot.queryParams;
    const params = {
      propertyCode : routeParams.propertyCode
    }
    return this._authHttp.get(SESSION_URL_CONST.HEADER_MENU_ITEMS, params);
  }
}
