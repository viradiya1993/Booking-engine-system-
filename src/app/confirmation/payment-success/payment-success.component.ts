import { Component, OnDestroy, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import * as _ from "lodash";
import { CommonUtility } from "src/app/common/common.utility";
import {
  QUERY_PARAM_ATTRIBUTES,
  STEP_MAP,
  TRADITIONAL_FLOW,
  URL_PATHS,
} from "../../common/common.constants";
import { PaymentService } from "../../common/services/payment/payment.service";
import { StoreService } from "../../common/services/store.service";
import { Subscription } from "rxjs";

@Component({
  selector: "app-payment-success",
  templateUrl: "./payment-success.component.html",
  styleUrls: ["./payment-success.component.scss"],
})
export class PaymentSuccessComponent implements OnInit, OnDestroy {
  localeObj: any;
  private reservationLookUpSubscription: Subscription;
  private _userSettingsSubscriptions: any;
  constructor(
    private _activatedRoute: ActivatedRoute,
    private _router: Router,
    private storeService: StoreService,
    private paymentService: PaymentService
  ) {}

  ngOnInit() {
    this._userSettingsSubscriptions = this.storeService
      .getUserSettings()
      .subscribe((sharedData) => {
        this.localeObj = sharedData.localeObj;
      });

    let confCode = this._activatedRoute.snapshot.queryParamMap.get(
      "master_confirmationCode"
    );
    // Check - if 3DS Credit Card or not

    const isSimplePayFlow = _.get(this.storeService.getBasketState(), "is3DSCreditCard");
      /*
        isSimplePayFlow = false;  Means; Alipay flow
        isSimplePayFlow = true;  Means; TillPayments/SimplePay flow (3DS Credit Card payment)
      */
     if (!isSimplePayFlow) {
      // Start -- ALIPAY Flow
          if (confCode !== undefined) {
            this.redirectToConfirmationPage(isSimplePayFlow, confCode);
          } else {
            this.redirectToCheckoutPage(isSimplePayFlow);
          }
      // End -- ALIPAY Flow
     } else {
        /** Start -- Till payment  */
        if (confCode !== undefined) {
          const hotelID = _.get(
            this.storeService.getUserSettingsState(),
            "propertyInfo.propertyCode"
          );

          // call the lookup api here then redirect to conf page
            this.paymentService.getSimplePayReservationLookup(confCode, hotelID)
            .subscribe((resResp) => {
              const resData = _.get(resResp, "data");
                  const status = _.get(resResp, "status.statusCode");
                  if (_.size(resData) > 0 && resData[0] && status === 1000) {
                    if (resData.length === 1) {
                      // SingleRoom Booking flow
                      confCode = _.get(resData[0], "confirmationCode");
                      this.redirectToConfirmationPage(isSimplePayFlow, confCode);
                    } else if (resData.length > 1) {
                       // MultiRoom Booking flow
                      //  TO DO::  fetch the confcodes and update the store with these conf codes and then redirect
                      const confCodeList = new Array<string>();
                      for (let index = 0; index < resData.length; index++) {
                        confCodeList[index] = resData[index].confirmationCode;
                      }
                      if (
                        _.size(confCodeList) &&
                        confCodeList[0] &&
                        _.size(resData) > 0 &&
                        resData[0]
                      ) {
                        const reservationRespObj = {
                          ResvConfCodes: new Array<string>(),
                          ConfirmationPageText: "",
                          CanModify: false,
                          canModifyByConfCodes: [],
                          failureStatusByConfCodes: [],
                          guestuid: "",
                          stayuid: "",
                          payuid: "",
                        };
                        reservationRespObj["ResvConfCodes"] = confCodeList;
                        if (_.get(resData[0], "reservationDetails.confirmationPageText")) {
                          reservationRespObj["ConfirmationPageText"] = _.get(
                            resData[0],
                            "reservationDetails.confirmationPageText"
                          );
                        }
                        this.storeService.updateReservationResponse(reservationRespObj);
                        this.redirectToConfirmationPage(isSimplePayFlow);
                      }

                    } // else if
                }
            });
        } else {
          this.redirectToCheckoutPage(isSimplePayFlow);
        }
        /** End -- Till payment  */
     }
  }

  redirectToConfirmationPage(isSimplePayFlow: boolean, confCode?: string) {
    this.storeService.setError(0);
    // this.storeService.setPaymentFailureFlagAndCode(false, undefined);
    this.storeService.updateCurrentStep(
     STEP_MAP[URL_PATHS.CONFIRMATION_PAGE]
   );

   const rooms = this.storeService.getBasketState().Rooms;
   const userSettingsState = this.storeService.getUserSettingsState();
   const langObj = _.get(userSettingsState, "langObj");


   const params = CommonUtility.getConfirmationQueryParams(
     confCode,
     rooms,
     langObj
   );
   const navigationExtras = {
     queryParams: params,
   };
   this._router.navigate(
     ["/" + URL_PATHS.CONFIRMATION_PAGE],
     navigationExtras
   );
  }


  redirectToCheckoutPage(isSimplePayFlow) {
    this.storeService.setError(30001);
    const rooms = this.storeService.getBasketState().Rooms;
    const errorCode = "30001";
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

    CommonUtility.setDatalayer({
      error_type: "red-error",
      error_code: errorCode || "",
      error_description: this.localeObj
        .tf_5_Confirmation_payment_paymentFailureMsg,
    });
    this._router.navigate(
      ["/" + URL_PATHS.GUEST_INFO_PAGE],
      navigationExtras
    );
  }

  ngOnDestroy() {
    const subscriptionsList = [this._userSettingsSubscriptions];
    CommonUtility.removeSubscriptions(subscriptionsList);
  }
}
