import {
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
  ViewEncapsulation,
} from "@angular/core";
import { Router } from "@angular/router";
import * as _ from "lodash";
import { Subscription } from "rxjs";
import {
  ErrorCodesListInComponents,
  NON_DECIMAL_CURRENCIES,
  QUERY_PARAM_ATTRIBUTES,
  URL_PATHS,
} from "../../common/common.constants";
import { CommonUtility } from "../../common/common.utility";
import { FeatureFlags } from "../../common/feature.flags";
import { Data, RatePlan } from "../../common/models/packagedetails";
import { StoreService } from "../../common/services/store.service";
import { SelectedRoom } from "../../common/store/reducers/basket.reducer";
import { Room } from "../../room";
import { CheckinSummary } from "../../search/guestduration/checkinsummary.type";
import { RatecalendarComponent } from "../../search/ratecalendar/ratecalendar.component";

@Component({
  selector: "app-credit-guest-widget",
  templateUrl: "./credit-guest-widget.component.html",
  styleUrls: ["./credit-guest-widget.component.scss"],
})
export class CreditGuestWidgetComponent implements OnInit, OnDestroy {
  private _sharedDataSubscription: Subscription;
  @ViewChild("rateCal", { static: true }) rateCalander: RatecalendarComponent;
  objCheckin: CheckinSummary;
  objData: Data;
  id: string;
  ratePlan: RatePlan;
  tax: number;
  selectedRoomInContext: SelectedRoom;
  currFilterValue: string;
  packagePrice: number;
  totalPrice: number;
  currCode: string;
  lightboxData: Room;
  bedTypeName: string;
  selectedImage: string;
  roomType: string;
  roomView: string;
  roomCode: string;
  selectedRoomList: any;
  selectedPackage: any;
  defCurrencyFilter: string;
  defCurrCode: string;
  showDefaultPrice: boolean;
  defaultTotalPrice: number;
  multiRoom = true;
  selectedIndex: number;
  totalPriceSum: number;
  taxSum: number;
  localeObj: any;
  showTaxDetails: boolean;
  showTaxBreakDown: any;
  expandTaxBreakDown: any;
  guestdetailsString: string[];
  taxes = [];
  currency: any;
  multiRoomTaxes: any;
  isTaxbreakdownEnabled: any;
  @Output() checkAvailableUpgrades = new EventEmitter();
  @Output() reloadPreferencesAndPaymentMethod = new EventEmitter();
  @Output() saveGuestInfo = new EventEmitter();
  private _userSettingsSubscriptions: Subscription;
  addonTotalCost: any;
  addonTotalTax: any;
  addonsList: any;
  multiResAddonTaxBreak: any[];
  RTL_Flag: boolean;
  constructor(private _storeSvc: StoreService, private router: Router) {}

  ngOnDestroy() {
    const subscriptionsList = [
      this._sharedDataSubscription,
      this._userSettingsSubscriptions,
    ];
    CommonUtility.removeSubscriptions(subscriptionsList);
  }

  ngOnInit() {
    this.showDefaultPrice = false;
    this.selectedIndex = 0;
    this.defaultTotalPrice = 0;
    this.defCurrencyFilter =
      _.get(
        this._storeSvc.getUserSettingsState(),
        "propertyInfo.defaultCurrency"
      ) || "SGD";
    this.isTaxbreakdownEnabled = FeatureFlags.isFeatureEnabled("taxbreakdown");
    this.showTaxDetails = _.get(
      this._storeSvc.getUserSettingsState(),
      "propertyInfo.expandTaxBreakDown"
    );
    this.showTaxBreakDown = _.get(
      this._storeSvc.getUserSettingsState(),
      "propertyInfo.showTaxBreakDown"
    );
    this.defCurrCode = CommonUtility.getCurrSymbolForType(
      this._storeSvc.getUserSettingsState().propertyInfo,
      this.defCurrencyFilter
    );
    this._userSettingsSubscriptions = this._storeSvc
      .getUserSettings()
      .subscribe((sharedData) => {
        this.localeObj = sharedData.localeObj;
        this.RTL_Flag = CommonUtility.langAlignCheck(this._storeSvc.getUserSettingsState().langObj.code, FeatureFlags);
      });
    this._sharedDataSubscription = this._storeSvc
      .getBasket()
      .subscribe((sharedData) => {
        this.addonsList = sharedData.addonTotalCost;
        this.addonTotalCost = 0;
        this.addonTotalTax = 0;
        if (!CommonUtility.isAPIListEmpty(this.addonsList)) {
          this.addonsList.forEach((element) => {
            element.NOT_SPECIFIED.forEach((value) => {
              this.addonTotalCost +=
                value.guestCurrencyPreTaxAmount || value.preTaxAmount || 0;
              this.addonTotalTax +=
                value.guestCurrencyTaxAndServices || value.taxAndServices || 0;
            });
          });
        }
        if (sharedData.GuestSummary) {
          this.objCheckin = sharedData.GuestSummary;
          this.guestdetailsString = CommonUtility.getGuestDetailsString(
            this.objCheckin,
            this.localeObj
          );
        }

        if (sharedData.Rooms !== undefined) {
          this.selectedRoomList = sharedData.Rooms;
          this.selectedRoomList.forEach((room) => {
            room.multiRoomTaxBreakDown = _.get(
              this._storeSvc.getUserSettingsState(),
              "propertyInfo.expandTaxBreakDown"
            );
          });
          this.multiRoom = this.selectedRoomList.length > 1 ? true : false;
          const tempSharedData = sharedData.Rooms[0];
          if (!tempSharedData) {
            return;
          }
          this.selectedRoomInContext = sharedData.Rooms[0];
          this.lightboxData = tempSharedData.RoomDetails;
          if (this.lightboxData !== undefined) {
            this.selectedPackage = tempSharedData.Packages[0];
            this.selectedImage = this.lightboxData.largeImageUrl;
            this.roomView = this.lightboxData.roomView;
            this.roomType = this.lightboxData.roomType;
          }
          this.roomCode = tempSharedData.RoomCode;
          this.ratePlan = tempSharedData.RatePlan;
          this.bedTypeName = tempSharedData.BedTypeName;

          this.currFilterValue = sharedData.CurrencyCode;
          this.currCode = CommonUtility.getCurrSymbolForType(
            this._storeSvc.getUserSettingsState().propertyInfo,
            this.currFilterValue
          );
          if (this.currCode !== this.defCurrCode) {
            this.showDefaultPrice = true;
          } else {
            this.showDefaultPrice = false;
          }
          if (
            this.selectedRoomList[0].RatePlan !== undefined &&
            this.selectedRoomList[0].Pricing === undefined
          ) {
            this._storeSvc.updateMultipleRoomsWithPricing(
              this.selectedRoomList
            );
            return;
          }

          const priceData = tempSharedData.Pricing;
          this.currency = tempSharedData.CurrencyCode;
          this.taxes = tempSharedData.RatePlan
            ? tempSharedData.RatePlan.taxBreakDown
            : "";
          const curr = this.currency;
          (this.taxSum = 0), (this.totalPriceSum = 0);
          this.defaultTotalPrice = 0;

          this.selectedRoomList.forEach((element) => {
            element["addonDefTax"] = 0;
            element["addonFormattedTax"] = 0;
            element["packageAddonsTax"] = 0;
            if (
              _.find(element.RatePlan.taxBreakDown, {
                description: "Package Addon Tax",
              })
            ) {
              element.RatePlan.taxBreakDown = element.RatePlan.taxBreakDown.filter(
                (tax) => tax.description !== "Package Addon Tax"
              );
            }
            if(element.RatePlan.packageAddOnTaxesByCurrency[curr]) {
            const obj = {};
            obj["code"] = "";
            obj["description"] = "Package Addon Tax";
            obj[
              "name"
            ] = this.localeObj.tf_5_Confirmation_bookingInfo_packageAddonTaxes;
            obj["taxAmount"] = {
              [curr]: element.RatePlan.packageAddOnTaxesByCurrency[curr],
              [this.defCurrencyFilter]: element.RatePlan.packageAddOnTaxesByCurrency[this.defCurrencyFilter],
            };
            element["packageAddonsTax"] += element.RatePlan.packageAddOnTaxesByCurrency[curr];
            element.RatePlan.taxBreakDown.push(obj);
          }
            if (
              !_.isEmpty(this.addonsList[element.roomIndex])
            ) {
              if (
                this.addonsList[element.roomIndex]?.NOT_SPECIFIED.length > 0
              ) {
                let selectedCurrTax = 0;
                let defaultCurrTax = 0;
                this.addonsList[element.roomIndex]?.NOT_SPECIFIED.forEach(
                  (addon) => {
                    if (
                      !!!element.RatePlan.taxBreakDown.find(
                        (data) => data.code === addon.addOnId
                      )
                    ) {
                      selectedCurrTax += addon.guestCurrencyTaxAndServices;
                      defaultCurrTax += addon.taxAndServices;
                    }
                    element["addonDefTax"] += addon.taxAndServices || 0;
                    element["addonFormattedTax"] +=
                      addon.guestCurrencyTaxAndServices || 0;
                  }
                );
                if (
                  _.find(element.RatePlan.taxBreakDown, {
                    description: "addonsTax",
                  })
                ) {
                  element.RatePlan.taxBreakDown = element.RatePlan.taxBreakDown.filter(
                    (tax) => tax.description !== "addonsTax"
                  );
                }
                if (
                  !_.find(element.RatePlan.taxBreakDown, {
                    description: "addonsTax",
                  })
                ) {
                  const obj = {};
                  obj["code"] = "";
                  obj["description"] = "addonsTax";
                  obj[
                    "name"
                  ] = this.localeObj.tf_5_Confirmation_bookingInfo_otherServicetaxes;
                  obj["taxAmount"] = {
                    [curr]: selectedCurrTax,
                    [this.defCurrencyFilter]: defaultCurrTax,
                  };
                  element.RatePlan.taxBreakDown.push(obj);
                }
              }
            } else if (element.RatePlan) {
              element.RatePlan.taxBreakDown = element.RatePlan.taxBreakDown.filter(
                (tax) => tax.description !== "addonsTax"
              );
              if (this.taxes.length > 0) {
                this.taxes = element.RatePlan.taxBreakDown.filter(
                  (tax) => tax.description !== "addonsTax"
                );
              }
            }
            if (this.showDefaultPrice) {
              this.taxSum =
                CommonUtility.roundedValue(this.taxSum, 2) +
                _.get(element, "Pricing.FormattedTax");
              this.totalPriceSum =
                this.totalPriceSum +
                _.get(element, "Pricing.FormattedTotalPrice");
              this.defaultTotalPrice =
                this.defaultTotalPrice +
                _.get(element, "Pricing.DefnTotalPriceWithPackageAddOnTaxesByCurrency");
            } else {
              this.taxSum =
                CommonUtility.roundedValue(this.taxSum, 2) +
                _.get(element, "Pricing.DefTax") || 0;
              this.totalPriceSum =
                this.totalPriceSum + _.get(element, "Pricing.DefnTotalPriceWithPackageAddOnTaxesByCurrency") ||
                0;
            }
          });
          if (this.showDefaultPrice) {
            this.taxSum += this.addonTotalTax || 0;
            this.totalPriceSum += this.addonTotalCost + this.addonTotalTax || 0;
          } else {
            this.taxSum += this.addonTotalTax || 0;
            this.totalPriceSum += this.addonTotalCost + this.addonTotalTax || 0;
          }

          if (this.showDefaultPrice && this.selectedRoomList.length === 1) {
            this.defaultTotalPrice = _.get(priceData, "DefnTotalPriceWithPackageAddOnTaxesByCurrency");
            this.packagePrice = _.get(priceData, "RoomRateAddonPrice");
            this.tax =
              CommonUtility.roundedValue(_.get(priceData, "Tax"), 2) +
              this.addonTotalTax;
            this.totalPrice =
              _.get(priceData, "TotalPriceWithPackageAddOnTaxesByCurrency") +
              this.addonTotalCost +
              this.addonTotalTax;
          } else if (
            !this.showDefaultPrice &&
            this.selectedRoomList.length === 1
          ) {
            this.packagePrice = _.get(priceData, "DefRoomRateAddonPrice");
            this.tax =
              CommonUtility.roundedValue(_.get(priceData, "DefTax"), 2) +
              this.addonTotalTax;
            this.totalPrice =
              _.get(priceData, "DefnTotalPriceWithPackageAddOnTaxesByCurrency") +
              this.addonTotalCost +
              this.addonTotalTax;
          }
        }
      });
  }

  isNonDecimalCurrency(currencyType) {
    return _.includes(NON_DECIMAL_CURRENCIES, currencyType);
  }

  // setPriceRoundingFormat(totalprice) {
  //   return CommonUtility.setDecimalToFixed(totalprice);
  // }

  onCheckInSummaryChanged(eventData: any, roomCode?: string, roomNo?: number) {
    this.saveGuestInfo.emit();

    if (eventData !== null) {
      this.objCheckin = Object.create(eventData);
      // this._dataShareSvc.triggerGuestSummary(this.objCheckin);
      // this._roomListingService.getAvailableRoomsDataWithParams(this.objCheckin);
      this._storeSvc.updateGuestDuration(this.objCheckin);
      let errorCode;
      if (this.objCheckin.restrictionFailed) {
        errorCode = 4000;
      }
      const userSettingsState = this._storeSvc.getUserSettingsState();
      const showIATA = _.get(userSettingsState, "propertyInfo.showIATA");
      const iataObject = _.get(userSettingsState, "iata");

      if (this._storeSvc.getBasketState().isSpecialsFlow) {
        this._storeSvc.updateIsSelectedRatePlanAvailable(false);
      }
      const offerCode = this._storeSvc.getBasketState().offerCode;
      const params = CommonUtility.getQueryParamObjGuestSummary(
        this.objCheckin,
        this._storeSvc,
        offerCode,
        errorCode
      );

      const navigationExtras = {
        queryParams: params,
      };
      this.router
        .navigate(["/" + URL_PATHS.ROOMS_PAGE], navigationExtras)
        .then((d) => CommonUtility.highlightStep("select-room"));
    } else {
      this._storeSvc.updateIs3DSCrediCardFlag(undefined);
      if (this._storeSvc.getBasketState().isPromoFlow) {
        let accessCode = this._storeSvc.getBasketState().promoData.accessCode;
        if (!!accessCode) {
          accessCode = "";
        }
        const bummerObj = {
          accessCodeBummer: accessCode,
          prevRoute: "/" + URL_PATHS.ROOMS_PAGE,
          displayBummer: false,
        };
        this._storeSvc.updatePromoBummer(bummerObj);
      }
      const roomsData = this._storeSvc.getBasketState().Rooms;
      if (roomsData.length === 1) {
        roomCode = roomsData[0].UniqueCode + "," + roomsData[0].RatePlan.code;
      } else {
        roomCode =
          roomsData[this.selectedIndex].UniqueCode +
          "," +
          roomsData[this.selectedIndex].RatePlan.code;
      }
      if (roomCode !== undefined) {
        this._storeSvc.saveEditedRoom(
          true,
          this.selectedIndex,
          roomsData[this.selectedIndex]
        );
        this._storeSvc.updateEmptySingleRoom(this.selectedIndex);
        const roomBookingOrder = [];
        roomBookingOrder.push(this.selectedIndex);
        this._storeSvc.upsertMultiRoomBookingOrder(roomBookingOrder);
      // unset preferences on checkout page room edit link click
        for (let j = 0; j < roomsData.length; j++) {
          this._storeSvc.upsertSingleRoomGuestPreference(undefined, j);
        }
      }
      const offerCode = this._storeSvc.getBasketState().offerCode;
      const params = CommonUtility.getQueryParamObjGuestSummary(
        this.objCheckin,
        this._storeSvc,
        offerCode
      );
      const navigationExtras = {
        queryParams: params,
        fragment: roomCode,
      };
      this._storeSvc.removeError(3013);
      if (roomsData.length > 1) {
        this.removeMultiRoomBookingOrder(roomNo);
      }
      this.router
        .navigate(["/" + URL_PATHS.ROOMS_PAGE], navigationExtras)
        .then((data) => CommonUtility.highlightStep("select-room"));
    }
    return false;
  }

  changeIndex(value): void {
    this.selectedIndex = value;
    $(".accordion-toggle")[value].click();
  }

  getTransformedDate(dateStr: string) {
    return CommonUtility.getTransformedDateFromDateStr(dateStr, this.localeObj);
  }

  getTranslatedDate(date: Date) {
    return CommonUtility.getTranslatedDateStr(date, this.localeObj);
    // return CommonUtility.fillMess  age(this.localeObj.tf_5_Confirmation_bookingInfo_dateStr,
    //   [this.localeObj[MONTHS_MAP[date.getMonth()]], date.getDate(), date.getFullYear()]);
  }

  public closeFix(event, popover, target) {
    CommonUtility.toggleTooltip(event, popover, target);
  }

  checkAvailableUpgradesEvent() {
    this.checkAvailableUpgrades.emit();
  }

  reloadGuestPreference() {
    this.reloadPreferencesAndPaymentMethod.emit();
  }

  removeMultiRoomBookingOrder(roomNo) {
    const selectedRooms = JSON.parse(sessionStorage.getItem("savedRooms"));
    selectedRooms[roomNo] = { roomType: "", bedType: "" };
    sessionStorage.setItem("savedRooms", JSON.stringify(selectedRooms));
  }

  taxBreakDown() {
    this.showTaxDetails = !this.showTaxDetails;
  }

  multiResTaxBreakDown(index) {
    this.selectedRoomList.forEach((room) => {
      if (room.roomIndex === index) {
        room.multiRoomTaxBreakDown = !room.multiRoomTaxBreakDown;
      }
    });
  }
}
