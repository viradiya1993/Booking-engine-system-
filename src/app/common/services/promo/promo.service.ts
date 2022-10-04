import { Injectable } from "@angular/core";
import { Observable, Subscription } from "rxjs";
import { Subject } from "rxjs";
import { QUERY_PARAM_ATTRIBUTES } from "../../../common/common.constants";
import { CommonUtility } from "../../../common/common.utility";
import { SESSION_URL_CONST } from "../../../common/urls.constants";
import { PromoDetails, Promos } from "../../../promo";
import { CheckinSummary } from "../../../search/guestduration/checkinsummary.type";
import { HttpWrapperService } from "../http-wrapper.service";
import {StoreService} from "../../../common/services/store.service"

@Injectable({
  providedIn: "root",
})
export class PromoService {
  public specialsFlow;
  public offerList;

  private availablePromos = new Subject<Promos>();
  promos = this.availablePromos.asObservable();

  constructor(private _authHttp: HttpWrapperService, private _storeSvc: StoreService) {}

  public set currentFlow(flow) {
    this.specialsFlow = flow;
  }

  public get currentFlow() {
    return this.specialsFlow;
  }

  public set offersAvail(offerCount) {
    this.offerList = offerCount;
  }

  public get offersAvail() {
    return this.offerList;
  }

  public getPromoList(promoApiPayload) {
    return this._authHttp.get(
      SESSION_URL_CONST.GET_PROMO_LIST,
      promoApiPayload
    );
  }

  public getAvailablePromosDataWithParams(
    guestSummary: CheckinSummary,
    accessCode: string,
    isSpecialRate: boolean,
    propertyInfo: any,
    langCode: string,
    roomNo?: number,
    isMultiRoom?: boolean,
    offerCodeVal?: string,
    isCheckInDateEntry?: boolean
  ): any {
    // Make use of values coming in guest Summary
    const rno = roomNo || 0;
    let params = {};
    if (guestSummary !== null) {
      params = {
        propertyCode: propertyInfo.propertyCode,
        arrivalDate: CommonUtility.formateDate(guestSummary.checkindate),
        departureDate: CommonUtility.formateDate(guestSummary.checkoutdate),
        numberOfAdults: guestSummary.guests[rno].adults,
        numberOfChildren: guestSummary.guests[rno].children,
        offerCode: offerCodeVal || "",
        isSpecialRate,
        accessCode,
        locale: langCode,
        rand: Math.floor(Math.random() * 1000000),
        currency: this._storeSvc.getBasketState().CurrencyCode
      };
    } else {
      params = {
        propertyCode: propertyInfo.propertyCode,
        arrivalDate: "",
        departureDate: "",
        offerCode: offerCodeVal || "",
        isSpecialRate,
        accessCode,
        locale: langCode,
        rand: Math.floor(Math.random() * 1000000),
        currency: this._storeSvc.getBasketState().CurrencyCode
      };
    }

    const promise = this._authHttp.get(
      SESSION_URL_CONST.GET_PROMO_LIST,
      params
    );
    promise.subscribe((data) => {
      if (!isMultiRoom) {
        this.availablePromos.next(data);
      } else if (isMultiRoom) {
        this.overBookCheck(data);
      }
    });
    return promise;
  }

  public overBookCheck(promos) {
    const selectedRooms = JSON.parse(sessionStorage.getItem("savedRooms"));
    const offerCode =
      JSON.parse(sessionStorage.getItem("storeState")).basketServiceReducer
        .offerCode || "";

    // if (offerCode && promos.data && promos.data.ratePlanDetails) {
    //   const promoData = _.find(promos.data.ratePlanDetails, ['code', offerCode]);
    //   let availableRooms = promoData.availableRooms;
    //     if (availableRooms &&  availableRooms.length > 0  && selectedRooms && selectedRooms.length > 0) {
    //       selectedRooms.forEach( selectedRoom => {
    //         availableRooms.forEach( room => {
    //           if (room.name === selectedRoom.roomType) {
    //             room.bedTypes.forEach( bedType => {
    //               if (bedType.bedTypeCode === selectedRoom.bedType) {
    //                 bedType.availableRooms --;
    //               }
    //           });
    //           }
    //         });
    //       });
    //       availableRooms.forEach( room => {
    //         room.bedTypes = room.bedTypes.filter(bedtype => bedtype.availableRooms > 0);
    //       });
    //       availableRooms = availableRooms.filter(x => x.bedTypes.find(y => y.availableRooms > 0));
    //       availableRooms.forEach( room => {
    //         if (room.bedTypes.length === 1) {
    //           room.defaultBedType = room.bedTypes[0].bedTypeCode;
    //         }
    //       });
    //     }
    // }

    this.availablePromos.next(promos);
  }
}
