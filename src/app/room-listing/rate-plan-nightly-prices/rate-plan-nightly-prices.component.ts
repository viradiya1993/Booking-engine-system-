import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import * as _ from "lodash";
import { CommonUtility } from "../../common/common.utility";
import {
  RatePlan,
  SelectedNightPriceFormat,
} from "../../common/models/packagedetails";
import { RatePlanListingService } from "../../common/services/ratePlanListing.Service";
import { StoreService } from "../../common/services/store.service";
import { FeatureFlags } from "src/app/common/feature.flags";

@Component({
  selector: "app-rate-plan-nightly-prices",
  templateUrl: "./rate-plan-nightly-prices.component.html",
  styleUrls: ["./rate-plan-nightly-prices.component.scss"],
})
export class RatePlanNightlyPricesComponent implements OnInit, OnDestroy {
  addOnPrice: number;
  los: number;
  currFilterValue: string;
  currCode: string;
  tax: number;
  collectPrice: SelectedNightPriceFormat[];
  commentsAdded: string[];
  totalPrice: number;
  packagePriceDetails: string;
  localeObj: any;
  RTL_Flag: boolean = false;
  private _userSettingsSubscriptions: any;
  private basketSubscription: any;
  @Input() ratePlan: RatePlan;
  @Input() roomNo: number;
  @Input() index: number;
  constructor(
    private ratePlanListingService: RatePlanListingService,
    private _storeSvc: StoreService
  ) {}

  ngOnDestroy() {
    const subscriptionsList = [
      this._userSettingsSubscriptions,
      this.basketSubscription,
    ];
    CommonUtility.removeSubscriptions(subscriptionsList);
  }

  ngOnInit() {
    this.los = 1;
    this.addOnPrice = 0;
    this.packagePriceDetails = "";
    this.roomNo = this.roomNo || 0;
    this._userSettingsSubscriptions = this._storeSvc
      .getUserSettings()
      .subscribe((sharedData) => {
        this.localeObj = sharedData.localeObj;
        this.RTL_Flag = CommonUtility.langAlignCheck(this._storeSvc.getUserSettingsState().langObj.code, FeatureFlags);
      });
    this.basketSubscription = this._storeSvc.getBasket().subscribe((basket) => {
      if (basket["CurrencyCode"] !== undefined) {
        this.currFilterValue = basket["CurrencyCode"];
        this.addOnPrice = _.get(this.ratePlan, [
          "lowestUnitAddOnPrice",
          this.currFilterValue,
        ]);
        let addOnAvailable = true;
        if (this.addOnPrice === undefined) {
          this.addOnPrice = 0;
          addOnAvailable = false;
        }
        let selectedOccupancy = 1;
        if (basket["GuestSummary"] !== undefined) {
          selectedOccupancy =
            Number(basket["GuestSummary"].guests[this.roomNo].adults) +
            Number(basket["GuestSummary"].guests[this.roomNo].children);
        }
        this.addOnPrice = this.addOnPrice * selectedOccupancy;
        this.packagePriceDetails = "";
        if (addOnAvailable) {
          this.packagePriceDetails = CommonUtility.packageDynamicString(
            selectedOccupancy
          );
        }
        this.los = basket["GuestSummary"].los;
        this.collectPrice = this.ratePlanListingService.getNightPrice(
          this.ratePlan,
          this.currFilterValue
        );
        this.tax = this.ratePlanListingService.getTax(
          this.ratePlan,
          this.currFilterValue
        );
        this.commentsAdded = this.ratePlanListingService.getComments(
          this.ratePlan
        );
        this.totalPrice = 0.0;
        this.collectPrice.forEach((pr) => {
          pr.price = Number(
            CommonUtility.formattedPrice(
              pr.price,
              this.currFilterValue,
              this._storeSvc
            )
          );
          pr.effectiveDateFormat = CommonUtility.getTranlatedDateLabels(pr.effectiveDateFormat, this.localeObj);
          const roomRate = CommonUtility.roundedValue(
            pr.price + this.addOnPrice / this.los,
            2
          );
          const formatedRoomRate = this._storeSvc.applyPriceFormatPipe(
            roomRate,
            this.currFilterValue,
            true
          );
          this.totalPrice = this.totalPrice + Number(formatedRoomRate);
        });
        this.totalPrice =
          this.totalPrice + CommonUtility.roundedValue(this.tax, 2);
        this.totalPrice = CommonUtility.roundedValue(this.totalPrice, 2);
        this.currCode = CommonUtility.getCurrSymbolForType(
          this._storeSvc.getUserSettingsState().propertyInfo,
          this.currFilterValue
        );
      }
    });
  }

  getTranslatedDate(dateStr: string) {
    const tokes = dateStr.split(" ");
    if (tokes.length > 1) {
      return CommonUtility.fillMessage(
        this.localeObj.tf_2_RoomList_ratePlans_nightlyPricesDateStr,
        [this.localeObj[tokes[1]], tokes[0]]
      );
    } else {
      return dateStr;
    }
  }

  public closeFix(event, popover, priceAvail) {
    this.tooltipAriaLabel(priceAvail);
    CommonUtility.toggleTooltip(
      event,
      popover,
      "popover-nightly-rate-plan-" + this.index
    );
  }

  public tooltipAriaLabel(priceAvail) {
    let labelvalue = 'Nightly prices for ';
    let formattedStr = '';
    priceAvail.forEach(element => {
        let date = this.getTranslatedDate(element.effectiveDateFormat);
        formattedStr +=  date + ' - ' + this.currCode + element.price + ', ';
    });
    labelvalue += formattedStr;
    if (this.tax > 0) {
     labelvalue +=  this.localeObj.tf_4_Checkout_priceSummery_taxAndServiceCharges + ' - ' + this.currCode + this.tax;
    }
    labelvalue += ', ' + this.localeObj.tf_4_Checkout_priceSummery_total + ' - ' + this.currCode + this.totalPrice;
    document.getElementById("popover-nightly-rate-plan-" + this.index).setAttribute('aria-label', labelvalue);
  }
}
