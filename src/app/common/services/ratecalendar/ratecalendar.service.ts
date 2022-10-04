import { Injectable } from "@angular/core";
import { Observable, Subject } from "rxjs";
import { QUERY_PARAM_ATTRIBUTES } from "../../../common/common.constants";
import { SESSION_URL_CONST } from "../../../common/urls.constants";
import { Rates } from "../../../search/ratecalendar/rates";
import { HttpWrapperService } from "../http-wrapper.service";

@Injectable({
  providedIn: "root",
})
export class RatecalendarService {
  private availableRates = new Subject<Rates>();
  calanderRates = this.availableRates.asObservable();

  constructor(private _contentService: HttpWrapperService) {}

  public getRoomRates(reqObj: any): Observable<any> {
    // Make use of values coming in guest Summary
    const params = {
      startDate: reqObj.startDate,
      endDate: reqObj.endDate,
      customTimeout: reqObj.customTimeout,
      currency: reqObj.currency ? reqObj.currency : "",
    };
    if (reqObj[QUERY_PARAM_ATTRIBUTES.OFFERCODE]) {
      params[QUERY_PARAM_ATTRIBUTES.OFFERCODE] =
        reqObj[QUERY_PARAM_ATTRIBUTES.OFFERCODE];
    }
    for (const [key, value] of Object.entries(reqObj)) {
      if(!(!!value)){
        delete reqObj[key];
      } else {
        params[key] = value;
      }
    }
    const promise = this._contentService.get(
      SESSION_URL_CONST.RATE_CALANDER,
      params
    );
    // const promise =  this._contentService.get(SESSION_URL_CONST.RATE_CALANDER);
    promise.subscribe((data) => {
      this.availableRates.next(data.data);
    });
    return promise;
  }

  public checkIsValidIATACode(iataNumber: string): any {
    const params = {};
    params[QUERY_PARAM_ATTRIBUTES.VALIDATE_IATA_API_PARAM] = iataNumber;
    const promise = this._contentService.get(
      SESSION_URL_CONST.VALIDATE_IATA_NUMBER,
      params
    );
    return promise;
  }

  public validateAccessCode(accessCode: string): any {
    const params = {};
    params[QUERY_PARAM_ATTRIBUTES.VALIDATE_ACCESS_CODE] = accessCode;
    const promise = this._contentService.get(
      SESSION_URL_CONST.VALIDATE_ACCESS_CODE,
      params
    );
    return promise;
  }
}
