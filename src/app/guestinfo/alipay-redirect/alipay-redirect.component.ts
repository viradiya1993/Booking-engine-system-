import { AfterViewInit, Component, OnDestroy, OnInit } from "@angular/core";
import * as _ from "lodash";
import { CommonUtility } from "src/app/common/common.utility";
import { StoreService } from "../../common/services/store.service";
import { IBasketState } from "../../common/store/reducers/basket.reducer";

@Component({
  selector: "app-alipay-redirect",
  templateUrl: "./alipay-redirect.component.html",
  styleUrls: ["./alipay-redirect.component.scss"],
})
export class AlipayRedirectComponent
  implements OnInit, AfterViewInit, OnDestroy {
  paramMap: any = {};
  request_url: string;
  localeObj: any;
  private _userSettingsSubscriptions: any;
  constructor(private _storeSvc: StoreService) {}

  ngOnInit() {
    this._userSettingsSubscriptions = this._storeSvc
      .getUserSettings()
      .subscribe((sharedData) => {
        this.localeObj = sharedData.localeObj;
      });
    const basket = this._storeSvc.getBasketState() as IBasketState;
    const alipayResResp =
      _.get(basket, "AlipayResResp.paymentGatewayChargeResponse") ||
      _.get(basket, "AlipayResResp");
    this.request_url = _.get(alipayResResp, "request_url");
    this.paramMap = _.get(alipayResResp, "param_map") || {};
  }

  ngOnDestroy() {
    const subscriptionsList = [this._userSettingsSubscriptions];
    CommonUtility.removeSubscriptions(subscriptionsList);
  }

  ngAfterViewInit() {
    document.forms["alipaysubmit"].submit();
  }
}
