import { Component, OnDestroy, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import * as _ from "lodash";
import { Subscription } from "rxjs";
import { CommonUtility } from "src/app/common/common.utility";
import { FeatureFlags } from "src/app/common/feature.flags";
import {
  QUERY_PARAM_ATTRIBUTES,
  TRADITIONAL_FLOW,
  URL_PATHS,
} from "../../common/common.constants";
import { StoreService } from "../../common/services/store.service";
import { IBasketState } from "../../common/store/reducers/basket.reducer";

@Component({
  selector: "app-cancel-booking-confirmation",
  templateUrl: "./cancel-booking-confirmation.component.html",
  styleUrls: ["./cancel-booking-confirmation.component.scss"],
})
export class CancelBookingConfirmationComponent implements OnInit, OnDestroy {
  cancellationCode: string;
  localeObj: any;
  cancellationRefNumber: string;
  private _userSettingsSubscriptions: Subscription;
  private routerSubscription: Subscription;
  public pgDepositAmtAvail: number;
  public currCode: string;
  public propertyPhone: any;
  RTL_Flag: boolean;
  defCurrCode: string;

  constructor(
    private router: Router,
    private _route: ActivatedRoute,
    private _storeSvc: StoreService
  ) {}

  ngOnInit() {
    this.cancellationCode = "";
    this.cancellationRefNumber = "";
    const basketState = this._storeSvc.getBasketState() as IBasketState;
    this.cancellationRefNumber = basketState.cancellationCode;

    this.defCurrCode =
      _.get(
        this._storeSvc.getUserSettingsState(),
        "propertyInfo.defaultCurrency"
      ) || "SGD";

    this.pgDepositAmtAvail = CommonUtility.roundedValue(
      basketState.pgAmount, 2);
    this._userSettingsSubscriptions = this._storeSvc
      .getUserSettings()
      .subscribe((sharedData) => {
        this.localeObj = sharedData.localeObj;
        this.propertyPhone = sharedData.propertyInfo.phone;
        this.RTL_Flag = CommonUtility.langAlignCheck(
          this._storeSvc.getUserSettingsState().langObj.code,
          FeatureFlags
        );
      });
    this.routerSubscription = this._route.queryParams.subscribe((params) => {
      if (
        params["cancellationCode"] !== undefined &&
        params["cancellationCode"] !== null &&
        this.cancellationRefNumber === params["cancellationCode"]
      ) {
        this.cancellationCode = params["cancellationCode"];
      } else {
        this.cancellationCode = this.cancellationRefNumber;
      }
    });
    // cancellationConfirmationPageFunc() - Cancellation confirmation Page scripts from admin
    if (window["cancellationConfirmationPageFunc"]) {
      window["cancellationConfirmationPageFunc"]();
    }
  }

  ngOnDestroy() {
    if (window["unloadCancellationConfirmationPageFunc"]) {
      window["unloadCancellationConfirmationPageFunc"]();
    }
    const subscriptionsList = [
      this._userSettingsSubscriptions,
      this.routerSubscription,
    ];
    CommonUtility.removeSubscriptions(subscriptionsList);
  }

  redirectToHomepage() {
    const userSettingsState = this._storeSvc.getUserSettingsState();
    const langObj = _.get(userSettingsState, "langObj");
    const offerCode = this._storeSvc.getBasketState().offerCode;
    const params = CommonUtility.getSearchPageQueryParams(offerCode, langObj);
    const navigationExtras = {
      queryParams: params,
    };
    this.router.navigate(["/" + URL_PATHS.SEARCH_PAGE], navigationExtras);
  }

  getCancellationCodeString() {
    return CommonUtility.fillMessage(
      this.localeObj.tf_5_Confirmation_cancelBooking_cancellationNumber,
      [this.cancellationCode]
    );
  }

  getMessage(message: string, params: string[]) {
    return CommonUtility.fillMessage(message, params);
  }
}
