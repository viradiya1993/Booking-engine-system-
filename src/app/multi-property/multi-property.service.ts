import { Injectable } from "@angular/core";
import * as _ from "lodash";
import { Subject } from "rxjs";
import { Observable, Subscription } from "rxjs";
import { QUERY_PARAM_ATTRIBUTES } from "../common/common.constants";
import { CommonUtility } from "../common/common.utility";
import { HttpWrapperService } from "../common/services/http-wrapper.service";
import { StoreService } from "../common/services/store.service";
import { SESSION_URL_CONST } from "../common/urls.constants";
@Injectable({
  providedIn: "root",
})
export class MultiPropertyService {
  private availableHotels = new Subject<any>();
  hotelList = this.availableHotels.asObservable();

  constructor(
    private _authHttp: HttpWrapperService,
    private _storeSvc: StoreService
  ) {}

  public getHotelList(multiPropertyReq: boolean): any {
    const currencyCode = this._storeSvc.getBasketState().CurrencyCode;
    const GuestSummary = this._storeSvc.getBasketState().GuestSummary;
    const adults = GuestSummary.guests[0].adults;
    const children = GuestSummary.guests[0].children;
    const rooms = GuestSummary.rooms ? GuestSummary.rooms : 1;
    const roomOccArray = new Array();
    for (let index = 0; index < rooms; index++) {
      const noOfAdults = Number(GuestSummary.guests[index].adults);
      const noOfChildren = Number(GuestSummary.guests[index].children);
      const str = [index + 1, noOfAdults, noOfChildren].join(":");
      roomOccArray.push(str);
    }
    // console.log(this._storeSvc.getBasketState());
    const params = {
      arrivalDate: CommonUtility.formateDate(GuestSummary.checkindate),
      departureDate: CommonUtility.formateDate(GuestSummary.checkoutdate),
      LOS: GuestSummary.los,
      roomOccupancy: [roomOccArray.join(",")],
      locale: GuestSummary.locale,
      currency: currencyCode,
      isMultiPropRequest: multiPropertyReq,
    };
    const iataNumber = _.get(
      this._storeSvc.getUserSettingsState(),
      "iata.iataNumber"
    );
    if (iataNumber) {
      params["iataNumber"] = iataNumber;
    }
    const accessCode = this._storeSvc.getBasketState().promoData.accessCode;
    if (accessCode) {
      params["accessCode"] = accessCode;
    }

    const promise = this._authHttp.get(
      SESSION_URL_CONST.GET_HOTEL_LIST,
      params
    );
    promise.subscribe((data) => {
      this.availableHotels.next(data);
    });
    return promise;
  }
}
