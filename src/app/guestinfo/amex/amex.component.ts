import {
  AfterViewInit,
  Component,
  EventEmitter,
  NgZone,
  OnDestroy,
  OnInit,
  Output,
  Renderer2,
} from "@angular/core";
import * as _ from "lodash";
import { NGXLogger } from "ngx-logger";
import { NgxUiLoaderService } from "ngx-ui-loader";
import { Subscription } from "rxjs";
import { CommonUtility } from "src/app/common/common.utility";
import { MPGS_SCRIPT_ID } from "../../common/common.constants";
import { NON_DECIMAL_CURRENCIES } from "../../common/common.constants";
import { StoreService } from "../../common/services/store.service";
import { MPGS_Data } from "../../common/utils/MPGS.utils";

declare var Checkout: any;

@Component({
  selector: "app-amex",
  templateUrl: "./amex.component.html",
  styleUrls: ["./amex.component.scss"],
})
export class AmexComponent implements OnInit, OnDestroy {
  mpgsSessionId: string;
  orderId: string;
  merchantId: string;
  merchantName: string;
  addressLine1: string;
  addressLine2: string;
  defaultcurrency: string;
  mpgsData = MPGS_Data;
  totalamount = 0;
  manualDiv = "false";
  cardtype: string;
  taxSum: number;
  currFilterValue = "";
  private _sharedDataSubscription: Subscription;
  currCode = "";
  SelectedRoomList: any;
  isPaymentCurrencyExists = false;
  isPaymentCurrSetToPropDefCurrCode = false;
  @Output() openManualDiv = new EventEmitter();
  private _userSettingsSubscriptions: Subscription;

  constructor(
    private _storeSvc: StoreService,
    private spinner: NgxUiLoaderService,
    private logger: NGXLogger
  ) {}

  ngOnInit() {
    this.GetMPGSSessionResponse();
  }

  scriptsForMpgs(cardType: string) {
    this.cardtype = cardType;
    CommonUtility.removeScript(MPGS_SCRIPT_ID);
    const node = document.querySelector('[title="Hosted Checkout"]');
    if (node) {
      node.parentNode.removeChild(node);
    }
    let scriptObj;
    if (cardType === "AX") {
      scriptObj = {
        id: MPGS_SCRIPT_ID,
        src: this.mpgsData.AmexCheckOutApi,
        isAsync: false,
        isDefer: false,
      };
    } else {
      const masterVisaCheckoutApi = this._storeSvc.getUserSettingsState()
        .propertyInfo.masterVisaCheckoutApi;
      scriptObj = {
        id: MPGS_SCRIPT_ID,
        src: masterVisaCheckoutApi, // add Master/Visa script
        isAsync: false,
        isDefer: false,
      };
    }
    CommonUtility.loadScript(scriptObj);
    const ele = document.getElementById(MPGS_SCRIPT_ID);
    ele.setAttribute("data-cancel", "cancelCallback");
    ele.setAttribute("data-complete", "completeCallback");
    ele.setAttribute("data-error", "errorCallback");
  }

  ngOnDestroy() {
    const subscriptionsList = [
      this._sharedDataSubscription,
      this._userSettingsSubscriptions,
    ];
    CommonUtility.removeSubscriptions(subscriptionsList);
    window["Amexsuccess"] = undefined;
    window["AmexComponent"] = undefined;
  }

  GetMPGSSessionResponse() {
    this._sharedDataSubscription = this._storeSvc
      .getBasket()
      .subscribe((sharedData) => {
        this.mpgsSessionId = _.get(sharedData.MPGSSesResp, "mpgsSessionId");
        this.orderId = _.get(sharedData.MPGSSesResp, "orderId");
        this.merchantId = _.get(sharedData.MPGSSesResp, "merchantId");
        this.merchantName = _.get(sharedData.MPGSSesResp, "merchantName");
        this.addressLine1 = _.get(sharedData.MPGSSesResp, "addressLine1");
        this.addressLine2 = _.get(sharedData.MPGSSesResp, "addressLine2");

        if (sharedData.Rooms !== undefined) {
          this.SelectedRoomList = sharedData.Rooms;
          this.setTotalPrice();
        }
      });
    this.setPaymentCurrencyCode();
  }

  setTotalPrice() {
    this.totalamount = 0;
    this.SelectedRoomList.forEach((element) => {
      if (
        !this.isPaymentCurrencyExists ||
        (this.isPaymentCurrencyExists && this.checkPaymentCurrencyCode()) ||
        this.isPaymentCurrSetToPropDefCurrCode
      ) {
        this.totalamount =
          this.totalamount + _.get(element, "Pricing.DefTotalPrice");
      } else {
        this.totalamount =
          this.totalamount + _.get(element, "Pricing.TotalPrice");
      }
    });
  }

  setPaymentCurrencyCode() {
    if (
      !this.isPaymentCurrencyExists ||
      this.isPaymentCurrSetToPropDefCurrCode
    ) {
      this.defaultcurrency =
        _.get(
          this._storeSvc.getUserSettingsState(),
          "propertyInfo.defaultCurrency"
        ) || "SGD";
    } else {
      const basketSummary = this._storeSvc.getBasketState();
      this.defaultcurrency = _.get(basketSummary, "CurrencyCode");
    }
  }

  checkPaymentCurrencyCode() {
    const defCurrCode =
      _.get(
        this._storeSvc.getUserSettingsState(),
        "propertyInfo.defaultCurrency"
      ) || "SGD";
    const basketSummary = this._storeSvc.getBasketState();
    const selectedCurrCode = _.get(basketSummary, "CurrencyCode");
    return defCurrCode === selectedCurrCode;
  }

  seTotalPriceRounding(totalprice) {
    let totalAmount = this._storeSvc.applyPriceFormatPipe(
      totalprice,
      this.defaultcurrency,
      true
    );
    if (!_.includes(NON_DECIMAL_CURRENCIES, this.defaultcurrency)) {
      totalAmount = totalAmount.toFixed(2);
    }
    return totalAmount;
  }

  onPayWithMPGSLightBox(stayandpay: boolean, counter: number) {
    this.logger.debug(
      [
        this.orderId,
        "MPGS Lightbox launch script called for ORN",
        this.orderId,
      ].join(" :: ")
    );
    if (counter > 0) {
      counter--;
      if (stayandpay) {
        this.totalamount = 1;
      }
      if (!window["Checkout"]) {
        this.scriptsForMpgs(this.cardtype);
        setTimeout(() => {
          this.onPayWithMPGSLightBox(stayandpay, counter);
        }, 2000);
      } else {
        Checkout.configure({
          merchant: this.merchantId,
          order: {
            amount: this.seTotalPriceRounding(this.totalamount),
            currency: this.defaultcurrency,
            description: this.mpgsData.description,
            id: this.orderId,
          },
          session: {
            id: this.mpgsSessionId,
          },
          transaction: {
            acquirer: {
              transactionId: this.mpgsData.transactionId,
            },
          },
          interaction: {
            merchant: {
              name: this.merchantName,
              address: {
                line1: this.addressLine1,
                line2: this.addressLine2,
              },
            },
            displayControl: {
              billingAddress: "HIDE",
              customerEmail: "HIDE",
              orderSummary: "SHOW",
              shipping: "HIDE",
            },
          },
        });
        this.spinner.stop(MPGS_SCRIPT_ID);
        Checkout.showLightbox();
      }
    } else {
      this.openManualDiv.emit();
    }
  }
}
