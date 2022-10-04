import { Injectable, OnInit, ViewChild } from "@angular/core";
import * as _ from "lodash";
import { Observable, Subscription } from "rxjs";
import { ReservationDetails } from "../../../common/models/reservation-details.model";
import { SESSION_URL_CONST } from "../../../common/urls.constants";
import { HttpWrapperService } from "../http-wrapper.service";

import { Router } from "@angular/router";
import { MPGSBookingRequest } from "../../models/MPGS-Booking.model";
import { StoreService } from "../store.service";

@Injectable({
  providedIn: "root",
})
export class MpgsPaymentService {
  userIpAddress: string;
  orderId: string;
  private _sharedDataSubscription: Subscription;

  constructor(
    private _authHttp: HttpWrapperService,
    private _storeSvc: StoreService,
    private router: Router
  ) {}

  public MPGSSessionRequestURL(
    resDetails: ReservationDetails[]
  ): Observable<any> {
    const ipdetails = _.get(
      this._storeSvc.getUserSettingsState(),
      "propertyInfo.clientIp"
    );
    return this._authHttp.post(SESSION_URL_CONST.GET_MPGS_URL, resDetails, {
      ip_address: ipdetails,
    });
  }

  public MPGSBookingRequestURL(SuccessIndicator: string): Observable<any> {
    this._sharedDataSubscription = this._storeSvc
      .getBasket()
      .subscribe((sharedData) => {
        this.orderId = _.get(sharedData.MPGSSesResp, "orderId");
      });

    const MPGSbookingRequest: MPGSBookingRequest = {
      successIndicator: SuccessIndicator,
      orderId: this.orderId,
    };
    return this._authHttp.post(
      SESSION_URL_CONST.GET_MPGS_BOOKING_URL,
      MPGSbookingRequest
    );
  }

  public MPGSTransactionStatusURL(): Observable<any> {
    this._sharedDataSubscription = this._storeSvc
      .getBasket()
      .subscribe((sharedData) => {
        this.orderId = _.get(sharedData.MPGSSesResp, "orderId");
      });
    const params = {
      orn: this.orderId,
    };
    return this._authHttp.get(
      SESSION_URL_CONST.GET_MPGS_TRANSACTION_STATUS_URL,
      params
    );
  }
}
