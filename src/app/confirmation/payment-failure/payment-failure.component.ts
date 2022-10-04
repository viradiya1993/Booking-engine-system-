import { Component, OnDestroy, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import * as _ from "lodash";
import {
  QUERY_PARAM_ATTRIBUTES,
  STEP_MAP,
  TRADITIONAL_FLOW,
  URL_PATHS,
} from "../../common/common.constants";
import { CommonUtility } from "../../common/common.utility";
import { StoreService } from "../../common/services/store.service";
@Component({
  selector: "app-payment-failure",
  templateUrl: "./payment-failure.component.html",
  styleUrls: ["./payment-failure.component.scss"],
})
export class PaymentFailureComponent implements OnInit, OnDestroy {
  localeObj: any;
  private _userSettingsSubscriptions: any;
  constructor(
    private _activatedRoute: ActivatedRoute,
    private _router: Router,
    private storeService: StoreService
  ) {}

  ngOnInit() {
    this._userSettingsSubscriptions = this.storeService
      .getUserSettings()
      .subscribe((sharedData) => {
        this.localeObj = sharedData.localeObj;
      });
    let error_code = this._activatedRoute.snapshot.queryParamMap.get(
      "error_code"
    );
    if (!error_code) {
      error_code = "30001";
    }
    if (error_code) {
      this.storeService.setError(Number(error_code));
    }
    const rooms = this.storeService.getBasketState().Rooms;
    const errorCode = error_code;
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
    // this.storeService.setPaymentFailureFlagAndCode(true, error_code);
    CommonUtility.setDatalayer({
      error_type: "red-error",
      error_code: errorCode || "",
      error_description: this.localeObj
        .tf_5_Confirmation_payment_paymentFailureMsg,
    });
    this.storeService.updateCurrentStep(STEP_MAP[URL_PATHS.GUEST_INFO_PAGE]);
    this._router.navigate(["/" + URL_PATHS.GUEST_INFO_PAGE], navigationExtras);
  }

  ngOnDestroy() {
    const subscriptionsList = [this._userSettingsSubscriptions];
    CommonUtility.removeSubscriptions(subscriptionsList);
  }
}
