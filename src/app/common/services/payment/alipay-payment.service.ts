import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import * as _ from "lodash";
import { Observable } from "rxjs";
import {
  QUERY_PARAM_ATTRIBUTES,
  STEP_MAP,
  TRADITIONAL_FLOW,
  URL_PATHS,
} from "../../../common/common.constants";
import { ReservationDetails } from "../../../common/models/reservation-details.model";
import { SESSION_URL_CONST } from "../../../common/urls.constants";
import { CommonUtility } from "../../common.utility";
import { AlipayRedirectResponse } from "../../models/alipay-redirect-response.model";
import { PaymentUtils } from "../../utils/payment.utils";
import { HttpWrapperService } from "../http-wrapper.service";
import { StoreService } from "../store.service";

@Injectable({
  providedIn: "root",
})
export class AlipayPayment {
  userIpAddress: string;

  constructor(
    private _authHttp: HttpWrapperService,
    private storeService: StoreService,
    private router: Router
  ) {}

  public alipayChargeRequestURL(
    resDetails: ReservationDetails[]
  ): Observable<any> {
    // TODO : fetch ip address of current m/c
    const ipdetails = _.get(
      this.storeService.getUserSettingsState(),
      "propertyInfo.clientIp"
    );
    return this._authHttp.post(SESSION_URL_CONST.GET_ALIPAY_URL, resDetails, {
      ip_address: ipdetails,
    });
  }

  public getQueryParamObjAlipay(paramMap: Map<string, string>) {
    const queryParams: string[] = [];
    _.forEach(paramMap, function (value, key) {
      queryParams.push([key, value].join("="));
    });
    return ["?", queryParams.join("&")].join("");
  }

  public proceedReservationForAlipay(resDetails: ReservationDetails[]) {
    this.alipayChargeRequestURL(resDetails).subscribe((data) => {
      if (_.get(data, "status.statusCode") !== 1000) {
        this.storeService.setError(_.get(data, "status.statusCode"));
        if (
          _.get(data, "status.statusCode") === 3013 ||
          _.get(data, "status.statusCode") === 9000 ||
          _.get(data, "status.statusCode") === 6003
        ) {
          const guestSummary = this.storeService.getBasketState().GuestSummary;
          const offerCode = this.storeService.getBasketState().offerCode;
          const params = CommonUtility.getQueryParamObjGuestSummary(
            guestSummary,
            this.storeService,
            offerCode
          );
          const navigationExtras = {
            queryParams: params,
          };
          this.router
            .navigate(["/" + URL_PATHS.ROOMS_PAGE], navigationExtras)
            .then((d) => CommonUtility.highlightStep("select-room"));
        } else if (
          _.get(data, "status.statusCode") === 3012 ||
          _.get(data, "status.statusCode") === 9001 ||
          _.get(data, "status.statusCode") === 6004
        ) {
          const curr = this.storeService.getBasketState().CurrencyCode;
          const defCurr =
            _.get(
              this.storeService.getUserSettingsState(),
              "propertyInfo.defaultCurrency"
            ) || "SGD";
          const basketRooms = PaymentUtils.updateLatestPricesInBasekt(
            data,
            this.storeService.getBasketState(),
            curr,
            defCurr,
            "status.statusCode"
          );
          const latestResvDetails = _.get(data, "data.reservationDetails");
          if (
            latestResvDetails[0].latestPolicyCode &&
            latestResvDetails[0].latestGuaranteePercentage !== undefined &&
            latestResvDetails[0].latestAlipayAlertText !== undefined &&
            latestResvDetails[0].latestIsPastCancellationDate !== undefined &&
            latestResvDetails[0].latestMpgsAlertText !== undefined &&
            latestResvDetails[0].latestPolicyText !== undefined &&
            latestResvDetails[0].latestPolicyGuaranteeType !== undefined &&
            latestResvDetails[0].latestPrePaymentType !== undefined &&
            latestResvDetails[0].latestCancellationPolicy ! == undefined
          ) {
            this.storeService.updatePolicyCodeAndGuaranteePercentage(
              latestResvDetails[0].latestPolicyCode,
              latestResvDetails[0].latestGuaranteePercentage,
              latestResvDetails[0].latestAlipayAlertText,
              latestResvDetails[0].latestIsPastCancellationDate,
              latestResvDetails[0].latestMpgsAlertText,
              latestResvDetails[0].latestPolicyText,
              latestResvDetails[0].latestPolicyGuaranteeType,
              latestResvDetails[0].latestPrePaymentType, 
              latestResvDetails[0].latestCancellationPolicy
            );
          }
          this.storeService.updateMultipleRoomsWithPricing(basketRooms);
          const rooms = this.storeService.getBasketState().Rooms;
          const userSettingsState = this.storeService.getUserSettingsState();
          const langObj = _.get(userSettingsState, "langObj");
          const errorCode = _.get(data, "status.statusCode");
          const params = CommonUtility.getGuestInfoQueryParams(
            rooms,
            langObj,
            errorCode
          );
          const navigationExtras = {
            queryParams: params,
          };
          this.router
            .navigate(["/" + URL_PATHS.GUEST_INFO_PAGE], navigationExtras)
            .then((d) => CommonUtility.highlightStep("guest-info"));
        } else {
          const rooms = this.storeService.getBasketState().Rooms;
          const errorCode = _.get(data, "status.statusCode");
          const userSettingsState = this.storeService.getUserSettingsState();
          const langObj = _.get(userSettingsState, "langObj");
          const params = CommonUtility.getGuestInfoQueryParams(
            rooms,
            langObj,
            errorCode
          );
          const navigationExtras = {
            queryParams: params,
          };
          this.router
            .navigate(["/" + URL_PATHS.GUEST_INFO_PAGE], navigationExtras)
            .then((d) => CommonUtility.highlightStep("guest-info"));
        }
      } else {
        if (data && data.data) {
          if (
            data.data.paymentGatewayChargeResponse &&
            data.data.paymentGatewayChargeResponse.param_map
          ) {
            const resConfData: AlipayRedirectResponse = data.data;
            this.storeService.updateAlipayResResp(resConfData);
            this.router.navigateByUrl("/aliPay");
          } else if (data.data.reservationResponseDetails) {
            const rooms = this.storeService.getBasketState().Rooms;
            const userSettingsState = this.storeService.getUserSettingsState();
            const langObj = _.get(userSettingsState, "langObj");
            const bookingRef =
              data.data.reservationResponseDetails[0].confirmationCode;
            const params = CommonUtility.getConfirmationQueryParams(
              bookingRef,
              rooms,
              langObj
            );
            const navigationExtras = {
              queryParams: params,
            };
            this.router
              .navigate(["/" + URL_PATHS.CONFIRMATION_PAGE], navigationExtras)
              .then((d) => CommonUtility.highlightStep("guest-info"));
          }
        }
      }
    });
  }
}
