import { HttpClient } from "@angular/common/http";
import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  TemplateRef,
  ViewChild,
} from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import * as _ from "lodash";
import { BsModalService } from "ngx-bootstrap/modal";
import { BsModalRef } from "ngx-bootstrap/modal/bs-modal-ref.service";
import { Subscription } from "rxjs";
import {
  URL_PATHS,
} from "../../common/common.constants";
import { CommonUtility } from "../../common/common.utility";
import { PromoService } from "../../common/services/promo/promo.service";
import { StoreService } from "../../common/services/store.service";
import { PromoDetails, Promos } from "../../promo";
import { CheckinSummary } from "../../search/guestduration/checkinsummary.type";
import { RatecalendarComponent } from "../../search/ratecalendar/ratecalendar.component";
import { FeatureFlags } from "../../common/feature.flags";
// import { EventEmitter } from 'protractor';

@Component({
  selector: "app-promo-list",
  templateUrl: "./promo-list.component.html",
  styleUrls: ["./promo-list.component.scss"],
})
export class PromoListComponent implements OnInit, OnDestroy {
  private basketSubscription: Subscription;
  public roomViews$: string[];
  public roomTypes$: string[];
  public checkInSummary: CheckinSummary;
  private currency = "USD";
  private langCode: string;
  currencies: any[];
  isSortOrderAsc: boolean;
  currencyType: string;
  currCode: string;
  avgPrice: number;
  discountedPrice: number;
  errorMessage: string;
  showPromoList = false;
  selectedPromo: PromoDetails;
  sortOrder: boolean;
  supportedCurrencies = [];
  showAvgDiscountedPrice = false;
  RTL_Flag: boolean = false;
  showAverageNightlyRate = false;

  @Input("promoList") promoList: PromoDetails[];
  @Input() promoList$: PromoDetails[];
  @Input("isCheckInDateEntry") isCheckInDateEntry = true;
  @ViewChild("rateCal", { static: true }) rateCalander: RatecalendarComponent;
  @Output() isPromoSelected: EventEmitter<any> = new EventEmitter();
  public availablePromos: Promos;
  public currencySelection: any = { code: "USD" };
  public availCurr = [];
  public modalRef: BsModalRef;
  public localeObj: any;
  private _userSettingsSubscriptions: Subscription;
  range: any;
  propertyType: any;

  constructor(
    private _authHttp: HttpClient,
    private promoService: PromoService,
    private router: Router,
    private modalService: BsModalService,
    private _storeSvc: StoreService,
    private _route: ActivatedRoute
  ) {}

  ngOnDestroy() {
    if (this._storeSvc.getBasketState().isSpecialsFlow) {
      if (window["unloadSpecialsPageMultipleFunc"]) {
        window["unloadSpecialsPageMultipleFunc"]();
      }
    } else {
      if (window["unloadPromoPageMultipleFunc"]) {
        window["unloadPromoPageMultipleFunc"]();
      }
    }
    const subscriptionsList = [
      this._userSettingsSubscriptions,
      this.basketSubscription,
    ];
    CommonUtility.removeSubscriptions(subscriptionsList);
  }

  ngOnInit() {
    // this.promoList = [];
    const userSettingsState = this._storeSvc.getUserSettingsState();
    const propertyInfo = _.get(userSettingsState, "propertyInfo");
    this.showAverageNightlyRate = propertyInfo.showAverageNightlyRate;
    this.supportedCurrencies = propertyInfo.supportedCurrencies;
    this.checkInSummary = this._storeSvc.getGuestSummary();

    this._userSettingsSubscriptions = this._storeSvc
      .getUserSettings()
      .subscribe((sharedData) => {
        this.localeObj = sharedData.localeObj;
        this._storeSvc.setSpecialsOfferCode("");
        this.RTL_Flag = CommonUtility.langAlignCheck(this._storeSvc.getUserSettingsState().langObj.code, FeatureFlags);
        this.propertyType = sharedData.propertyInfo.propertyType || '';
      });

    this.basketSubscription = this._storeSvc.getBasket().subscribe((basket) => {
      this.currencyType =
        basket.CurrencyCode === undefined
          ? propertyInfo.defaultCurrency
          : basket.CurrencyCode;
      this.currCode = CommonUtility.getCurrSymbolForType(
        this._storeSvc.getUserSettingsState().propertyInfo,
        this.currencyType
      );
      this.sortOrder =
        basket.SortOrder === undefined || basket.SortOrder ? true : false;
      this.range = !basket.range || basket.range.length === 0 ? [] : basket.range;
    });
    this.isSortOrderAsc = true;

    // specialsPageMultipleFunc / promoPageMultipleFunc scripts from admin
    // Depends on which flow the user is on specials or promo
    if (this._storeSvc.getBasketState().isSpecialsFlow) {
      if (window["specialsPageMultipleFunc"]) {
        window["specialsPageMultipleFunc"]();
      }
    } else {
      if (window["promoPageMultipleFunc"]) {
        window["promoPageMultipleFunc"]();
      }
    }
    if(!(this.propertyType.length > 0 && this.propertyType === 'UD')) {
      if(this._storeSvc.getBasketState().roomAttributes.length > 0) {
        this.updateRoomList(this._storeSvc.getBasketState().roomAttributes);
      }
    }
  }

  getAvgRoomPrice(room: any) {
    return this._storeSvc.getAvgRoomPrice(room, this.currencyType);
  }

  getDiscountedRoomPrice(room: any) {
    return this._storeSvc.getDiscountedRoomPrice(room, this.currencyType);
  }

  getPromoData(promo: PromoDetails) {
    if (!!promo.availableRooms && promo.availableRooms.length > 0) {
      let lowestPricedRoom = [];
      let lowestPriceRoomCode: any;
      lowestPriceRoomCode = "";

      if (!!promo && promo.lowestRoomTypeCode !== null) {
        lowestPriceRoomCode = promo.lowestRoomTypeCode;
        lowestPricedRoom = _.filter(promo.availableRooms, function (element) {
          return element.code.indexOf(lowestPriceRoomCode) > -1;
        });

        if (!!lowestPricedRoom) {
          // this.avgPrice =
          //   lowestPricedRoom[0].averagePriceByCurrency[this.currencyType];
          //   const discountedAvgPrice =
          //   lowestPricedRoom[0].discountedAveragePriceByCurrency[
          //     this.currencyType
          //   ];
          this.avgPrice = this.getAvgRoomPrice(lowestPricedRoom[0]);
          const discountedAvgPrice = this.getDiscountedRoomPrice(lowestPricedRoom[0]);

          if (!!discountedAvgPrice) {
            this.showAvgDiscountedPrice = true;
            this.discountedPrice = discountedAvgPrice;
          } else {
            this.showAvgDiscountedPrice = false;
            this.discountedPrice = undefined;
          }
        } // end if
      } // end if
    }
    return true;
  }

  public promoSeleted(promo: PromoDetails) {
    this.isPromoSelected.emit(promo);
  }

  // Mobile Filter Modal
  public openFiltersModal(template: TemplateRef<any>) {
    this.modalRef = this.modalService.show(
      template,
      Object.assign({}, { class: "modal-md" })
    );
    return false;
  }

  public applyFilters() {
    this.modalRef.hide();
  }

  public closeFilter() {
    this.modalRef.hide();
  }

  updateCurrencySelection(currency: any) {
    this.currencySelection = currency;
    this._storeSvc.updateCurrencyCodeObj(currency);
    this._storeSvc.updateIntialCurrencyCodeObj(this.currencySelection.code);
    const avgPrice = [];
    this.promoList.filter((ele) => {
      ele.availableRooms.filter((price) => {
        // avgPrice.push(price.averagePriceByCurrency[this.currencyType]);
        const roomPrice = this.getAvgRoomPrice(price);
        avgPrice.push(roomPrice);
      });
      this.avgPrice = Math.min(...avgPrice);
    });
  }

  toggleSortOrder() {
    this.isSortOrderAsc = !this.isSortOrderAsc;
    this._storeSvc.updateSortOrder(this.isSortOrderAsc);
  }

  onCheckInSummaryChanged(eventData: any) {
    const guestSummary = CommonUtility.getGuestSummaryFromEventData(eventData);
    this._storeSvc.updateGuestDuration(guestSummary);
    let errorCode;
    // if (guestSummary.restrictionFailed) {
    //   errorCode = 4000;
    //   this.availableRooms = false;
    // } else {
    //   this.availableRooms = true;
    // }
    const offerCode = this._storeSvc.getBasketState().offerCode;
    const params = CommonUtility.getQueryParamObjGuestSummary(
      guestSummary,
      this._storeSvc,
      offerCode,
      errorCode
    );
    const navigationExtras = {
      queryParams: params,
    };

    this.router
      .navigate(["/" + URL_PATHS.PROMO_PAGE], navigationExtras)
      .then((d) => CommonUtility.highlightStep("promo"));
  }

  updateRoomList(update) {
    let newObj = update.filter(val => val.attributeName !== "Offer");
    const  initialArr = _.cloneDeep(this.promoList$);
    const finalArr = _.cloneDeep(this.promoList$);
    let filteredArr = [];
    initialArr.forEach((elem) => {
      const filterVal = CommonUtility.attributeFilter(elem.availableRooms ,newObj,this.localeObj.tf_1_Calendar_rateCalender_selectDropdown);
      filteredArr.push(filterVal);
    });
    initialArr.forEach((elem, index) => {
      if(filteredArr[index].length === 0) {
        finalArr.splice(index,1);
      }
    });
    this.promoList = finalArr;
  }
}
