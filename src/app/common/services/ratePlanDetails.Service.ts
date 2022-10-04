import { Injectable } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { Observable } from "rxjs";
import { SESSION_URL_CONST } from "../../common/urls.constants";
import { HttpWrapperService } from "./http-wrapper.service";

@Injectable({
  providedIn: "root",
})
export class RatePlanDetailsService {
  private static CacheFactory: any[] = [];

  constructor(private _authHttp: HttpWrapperService, private router: ActivatedRoute) {}

  public getPackageDetails(id: string): Observable<any> {
    const routeParams = this.router.snapshot.queryParams;
    const params = {
      propertyCode : routeParams.propertyCode
    }
    SESSION_URL_CONST.GET_RATE_PLAN_DETAILS.path_suffix = id ? id : 1;
    return this._authHttp.get(SESSION_URL_CONST.GET_RATE_PLAN_DETAILS, params);
  }
}
