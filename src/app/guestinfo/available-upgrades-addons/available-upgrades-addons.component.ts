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
import * as _ from "lodash";
import { BsModalService } from "ngx-bootstrap";
import { BsModalRef } from "ngx-bootstrap/modal/bs-modal-ref.service";
import { Subscription } from "rxjs";
import { FeatureFlags } from "src/app/common/feature.flags";
import {
  NON_DECIMAL_CURRENCIES,
  QUERY_PARAM_ATTRIBUTES,
} from "../../common/common.constants";
import { CommonUtility } from "../../common/common.utility";
import { RatePlan } from "../../common/models/packagedetails";
import { GuestCreditCardPageService } from "../../common/services/guest-credit-card-page.service";
import { RoomListingService } from "../../common/services/roomListing.Service";
import { StoreService } from "../../common/services/store.service";
import { SelectedRoom } from "../../common/store/reducers/basket.reducer";
import { IBasketState } from "../../common/store/reducers/basket.reducer";
import { Room } from "../../room";
import { RoomsBooked } from "../../room-listing/rooms/rooms-booked-updates";
import { CheckinSummary } from "../../search/guestduration/checkinsummary.type";

@Component({
  selector: "app-available-upgrades-addons",
  templateUrl: "./available-upgrades-addons.component.html",
  styleUrls: ["./available-upgrades-addons.component.scss"],
})
export class AvailableUpgradesAddonsComponent implements OnInit, OnDestroy {
  show = true;
  breakfast = true;
  // objCheckin: CheckinSummary;
  availableRoomUpgrade = new Array<any>();
  upgradeSelected: boolean[];
  upgradeSelectedError: boolean[];
  upgradeSelectedRoom = [];
  isAvailable: boolean;
  UpgradeRoomData: any;
  guestSummary: CheckinSummary;
  // room: Room;
  selectedRoomInBasket: SelectedRoom[];
  // ratePlan: RatePlan;
  currCode: string;
  currency: string;
  totalnight: number;
  isMultiRoom = false;
  // totalCost: number;
  private modalRef: BsModalRef;
  // availableAddons: any;
  initialLoad = true;
  currAvailableUpgrade: any;
  currGuestInfo: any;
  currRoomIndex = 0;
  nightVerbiage: String;
  localeObj: any;
  public RTL_Flag: boolean;
  private _userSettingsSubscriptions: Subscription;
  private _basketSubscription: Subscription;
  private upgradeRoomSubscription: Subscription;
  private availableUpgradesSubscription: Subscription;
  upgradeError = false;
  isRoomSelected = false;
  roomSelected: any;
  roomSelectedChecked: any;
  currentSelectedRoom: any;
  roomupdates: RoomsBooked;
  selectedUpgradedRoomCost = [];
  upgradedRoomCost = [];
  errorMsg: string;
  defaultcurrency: string;
  @ViewChild("bummer") bummer: TemplateRef<any>;
  bummerType: string;
  upgradePriceChange = [];
  _sharedDataSubscription: Subscription;
  @Output() upgradeEvent = new EventEmitter<any>();

  constructor(
    private _guestInfoCreditCardService: GuestCreditCardPageService,
    private store: StoreService,
    private modalService: BsModalService,
    private roomListingService: RoomListingService
  ) {}

  ngOnDestroy(): void {
    const subscriptionsList = [
      this._basketSubscription,
      this._sharedDataSubscription,
      this._userSettingsSubscriptions,
      this.availableUpgradesSubscription,
      this.upgradeRoomSubscription,
    ];
    CommonUtility.removeSubscriptions(subscriptionsList);
    if (this.modalRef !== undefined) {
      this.modalRef.hide();
    }
  }

  ngOnInit() {
    this.isAvailable = false;
    this.upgradeSelected = [];
    this.upgradeSelectedError = [];
    this._userSettingsSubscriptions = this.store
      .getUserSettings()
      .subscribe((sharedData) => {
        this.localeObj = sharedData.localeObj;
        this.RTL_Flag = CommonUtility.langAlignCheck(this.store.getUserSettingsState().langObj.code, FeatureFlags);
      });
    const basket = this.store.getBasketState() as IBasketState;
    if (basket.GuestSummary) {
      this.guestSummary = basket.GuestSummary;
      this.totalnight = this.guestSummary.los;
    }
    this._basketSubscription = this.store
      .getBasket()
      .subscribe((basketState) => {
        // if (!this.compareCheckInSummary(basketState.GuestSummary, this.guestSummary) && !this.initialLoad) {
        //   this.guestSummary = basketState.GuestSummary;
        //   this.initialLoad = true;
        //   this.checkAvailableUpgrades();
        // }
        this.guestSummary = basketState.GuestSummary;
        this.currency = basketState.CurrencyCode;
        this.totalnight = this.guestSummary.los;
        this.currCode = CommonUtility.getCurrSymbolForType(
          this.store.getUserSettingsState().propertyInfo,
          this.currency
        );
      });
    /*this.currency = basket.CurrencyCode;
    this.currCode = CommonUtility.getCurrSymbolForType(this.store.getUserSettingsState().propertyInfo, this.currency);*/
    this.selectedRoomInBasket = basket.Rooms;
    this.checkAvailableUpgrades();
    this.nightVerbiage = this.localeObj.tf_2_RoomList_bookingSummery_night;
    if (Number(this.guestSummary.los) > 1) {
      this.nightVerbiage = this.localeObj.tf_4_Checkout_addons_nights;
    }
    this.roomListingService.getRoomBookedUpdates();
    this._sharedDataSubscription = this.store
      .getUserSettings()
      .subscribe((sharedData) => {
        this.defaultcurrency = _.get(
          sharedData,
          "propertyInfo.defaultCurrency"
        );
      });
  }

  checkAvailableUpgradesEvent() {
    this.initialLoad = true;
    this.checkAvailableUpgrades();
  }

  toogleShow() {
    this.show = !this.show;
  }

  toogleBreakFast() {
    this.breakfast = !this.breakfast;
  }

  compareCheckInSummary(newSummary: any, oldSummary: any) {
    if (newSummary === undefined) {
      return true;
    }
    if (Number(newSummary.rooms) !== Number(oldSummary.rooms)) {
      return false;
    }
    if (Number(newSummary.guests.length) !== Number(oldSummary.guests.length)) {
      return false;
    }
    if (Number(newSummary.los) !== Number(oldSummary.los)) {
      return false;
    }
    if (+newSummary.checkindate !== +oldSummary.checkindate) {
      return false;
    }
    if (+newSummary.checkoutdate !== +oldSummary.checkoutdate) {
      return false;
    }
    let index = 0;
    let returnVal = true;
    newSummary.guests.forEach((element) => {
      if (
        Number(element.adults) !== Number(oldSummary.guests[index].adults) ||
        Number(element.children) !== Number(oldSummary.guests[index].children)
      ) {
        returnVal = false;
      }
      index++;
    });
    return returnVal;
  }

  checkAvailableUpgrades() {
    if (this.selectedRoomInBasket !== undefined) {
      if (this.selectedRoomInBasket.length > 1) {
        this.isMultiRoom = true;
      } else {
        this.isMultiRoom = false;
      }
      for (let rNo = 0; rNo < this.selectedRoomInBasket.length; rNo++) {
        this.availableUpgrades(rNo, false);
      }
      this.initialLoad = false;
    }
  }

  gotoPreferences(index?: number) {
    if (index === undefined) {
      index = 0;
    }
    const ele = document.getElementById("RoomPreference" + index);
    if (ele !== undefined && ele !== null) {
      ele.scrollIntoView({
        behavior: "smooth",
        block: "start",
        inline: "nearest",
      });
    }
  }

  upgradeRatePlan() {
    const basket = this.store.getBasketState() as IBasketState;
    // if (_.size(basket.Rooms) > 0) {
    // this.selectedRoomInBasket = basket.Rooms[0];
    const selectionObj = basket.Rooms[this.currRoomIndex];
    // tslint:disable-next-line:prefer-const
    const updatedRoomDetails = selectionObj; // { ...selectionObj };
    const rateCodeVal = _.get(this.store.getBasketState(), "offerCode");
    let queryParams = {};
    queryParams = {
      rateCode: this.roomSelected.rateCode,
      arrivalDate: CommonUtility.formateDate(this.guestSummary.checkindate),
      departureDate: CommonUtility.formateDate(this.guestSummary.checkoutdate),
      numberOfAdults: this.currGuestInfo.adults,
      numberOfChildren: this.currGuestInfo.children,
      roomCode: this.roomSelected.roomCode,
      currency: this.store.getBasketState().CurrencyCode
    };
    if (rateCodeVal !== undefined) {
      queryParams[QUERY_PARAM_ATTRIBUTES.OFFERCODE] = rateCodeVal;
    }
    this.upgradeRoomSubscription = this._guestInfoCreditCardService
      .upgradeRoom(queryParams)
      .subscribe((data) => {
        this.store.removeError(6001);
        const statusFlag = this.store.setError(data.status.statusCode);
        if (data && data.data && statusFlag) {
          this.UpgradeRoomData = data.data[0];
          updatedRoomDetails.OrignalRatePlan = {
            RatePlan: updatedRoomDetails.RatePlan,
            BedType: this.UpgradeRoomData.bedTypeCode,
            BedTypeName: this.UpgradeRoomData.bedTypeName,
            roomView: updatedRoomDetails.RoomDetails.roomView,
            roomType: updatedRoomDetails.RoomDetails.roomType,
            name: updatedRoomDetails.RoomDetails.name,
            largeImageUrl: updatedRoomDetails.RoomDetails.largeImageUrl,
            UniqueCode: updatedRoomDetails.UniqueCode,
            RoomDetails: updatedRoomDetails.RoomDetails,
            RoomCode: updatedRoomDetails.RoomCode,
            UpgradedByPrice:
              this.roomSelectedChecked.costOfUpgrade[this.defaultcurrency] *
              this.totalnight,
          };
          updatedRoomDetails.BedType = this.UpgradeRoomData.bedTypeCode;
          updatedRoomDetails.BedTypeName = this.UpgradeRoomData.bedTypeName;
          updatedRoomDetails.RatePlan = this.UpgradeRoomData.availableRatePlans[0];
          updatedRoomDetails.UniqueCode = this.roomSelected.roomCode;
          updatedRoomDetails.RoomCode = this.roomSelected.roomCode;
          updatedRoomDetails.RoomDetails.roomView = this.roomSelected.roomView;
          updatedRoomDetails.RoomDetails.roomType = this.roomSelected.roomType;
          updatedRoomDetails.RoomDetails.name = this.roomSelected.name;
          updatedRoomDetails.RoomDetails.largeImageUrl = this.roomSelected.imageUrls[0].largeImageUrl;
          updatedRoomDetails.RatePlan.searchTransactionId = this.UpgradeRoomData.searchTransactionId;
          updatedRoomDetails.RatePlan.marketingConsent = this.UpgradeRoomData.marketingConsent;
          this.upgradeSelected[this.currRoomIndex] = true;
          this.upgradeSelectedError[this.currRoomIndex] = false;
          this.upgradeSelectedRoom[this.currRoomIndex] = this.roomSelected;
          this.store.updateSingleRoom(updatedRoomDetails, this.currRoomIndex);
          this.upgradePriceChange[this.currRoomIndex] = false;
          this.show = !this.show;
          this.upgradeEvent.emit(this.currRoomIndex);
          this.modalRef.hide();
          this.modalRef = undefined;
          this.upgradeSelectedRoom[
            this.currRoomIndex
          ].totalCost = this.upgradeSelectedRoom[
            this.currRoomIndex
          ].costOfUpgrade;
          this.calculateRoomPrice(
            this.UpgradeRoomData.availableRatePlans[0].nightlyPrices,
            this.currRoomIndex
          );
          this.selectedUpgradedRoomCost[this.currRoomIndex] = 0;
          this.errorMsg = "";
          this.selectedUpgradedRoomCost[
            this.currRoomIndex
          ] = this.applyPriceFormat(
            this.roomSelected.totalPrice[this.currency]
          );
          this.upgradedRoomCost[this.currRoomIndex] = this.applyPriceFormat(
            this.upgradedRoomCost[this.currRoomIndex]
          );
          if (
            this.selectedUpgradedRoomCost[this.currRoomIndex] !==
            this.upgradedRoomCost[this.currRoomIndex]
          ) {
            this.openBummerModal(this.bummer, "priceChange");
            this.upgradePriceChange[this.currRoomIndex] = true;
            const originalRoomPricePerNight = !_.isEmpty(
              updatedRoomDetails.OrignalRatePlan.RatePlan
                .discountedAveragePriceByCurrency
            )
              ? _.get(
                  updatedRoomDetails,
                  "OrignalRatePlan.RatePlan.discountedAveragePriceByCurrency"
                )
              : _.get(
                  updatedRoomDetails,
                  "OrignalRatePlan.RatePlan.averagePriceByCurrency"
                );
            const updatedRoomPricePerNight = !_.isEmpty(
              this.UpgradeRoomData.availableRatePlans[0]
                .discountedAveragePriceByCurrency
            )
              ? _.get(
                  this.UpgradeRoomData,
                  "availableRatePlans[0].discountedAveragePriceByCurrency"
                )
              : _.get(
                  this.UpgradeRoomData,
                  "availableRatePlans[0].averagePriceByCurrency"
                );
            const originalRoomDefaultPricePerNight =
              _.get(
                updatedRoomDetails,
                "OrignalRatePlan.RatePlan.discountedAveragePriceByCurrency." +
                  this.defaultcurrency
              ) ||
              _.get(
                updatedRoomDetails,
                "OrignalRatePlan.RatePlan.averagePriceByCurrency." +
                  this.defaultcurrency
              );
            const updatedRoomDeffaultPricePerNight =
              _.get(
                this.UpgradeRoomData,
                "availableRatePlans[0].discountedAveragePriceByCurrency." +
                  this.defaultcurrency
              ) ||
              _.get(
                this.UpgradeRoomData,
                "availableRatePlans[0].averagePriceByCurrency." +
                  this.defaultcurrency
              );
            updatedRoomDetails.OrignalRatePlan.UpgradedByPrice =
              (updatedRoomDeffaultPricePerNight -
                originalRoomDefaultPricePerNight) *
              this.totalnight;
            // this.upgradeSelectedRoom[this.currRoomIndex].totalCost = (
            //   updatedRoomPricePerNight - originalRoomPricePerNight) * this.totalnight;
            const totalCost = {};
            Object.keys(updatedRoomPricePerNight).map(function (curr) {
              totalCost[curr] =
                updatedRoomPricePerNight[curr] -
                originalRoomPricePerNight[curr];
            });
            this.upgradeSelectedRoom[this.currRoomIndex].totalCost = totalCost;
            this.errorMsg = CommonUtility.fillMessage(
              this.localeObj
                .tf_4_Checkout_upgradeAddons_upgradePriceMismatchError,
              [
                this.currCode,
                this.selectedUpgradedRoomCost[this.currRoomIndex],
                this.upgradedRoomCost[this.currRoomIndex],
              ]
            );
          }
        } else {
          // this.upgradeSelectedError[this.currRoomIndex] = true;
          this.initialLoad = true;
          this.availableUpgrades(this.currRoomIndex, false);
          this.upgradeError = true;
          this.show = !this.show;
          this.modalRef.hide();
          this.modalRef = undefined;
          this.errorMsg = this.localeObj.tf_4_Checkout_upgradeAddons_upgradeInventoryMismatchError;
          this.openBummerModal(this.bummer, "inventoryChange");
        }
      });
    this.store.setActiveModalElem("g_btn_undo_upgrade");
  }

  openUpgradeModal(
    template: TemplateRef<any>,
    availableUpgrade: any,
    currIndex: number
  ) {
    this.availableUpgrades(currIndex, true, template);
    // this.currAvailableUpgrade = availableUpgrade;
    // // this.currAvailableUpgrade.totalCost = availableUpgrade.costOfUpgrade[this.currency] * this.totalnight;
    // this.currGuestInfo = this.guestSummary.guests[currIndex];
    // this.currRoomIndex = currIndex;
    // this.modalRef = this.modalService.show(template, { class: 'modal-lg' });
    // this.onRoomChange(this.currAvailableUpgrade[0]);
    // const basket = <IBasketState>this.store.getBasketState();
    // const selectionObj = basket.Rooms[this.currRoomIndex];
    // this.currentSelectedRoom = selectionObj;
    // return false;
  }

  undoUpgrade(index: number) {
    const basket = this.store.getBasketState() as IBasketState;
    this.currAvailableUpgrade = basket.Rooms[index];
    const updatedRoomDetails = _.cloneDeep(this.currAvailableUpgrade); // this._dataShareSvc.getSelectedRoomData();
    if (updatedRoomDetails) {
      updatedRoomDetails.BedType = updatedRoomDetails.OrignalRatePlan.BedType;
      updatedRoomDetails.BedTypeName =
        updatedRoomDetails.OrignalRatePlan.BedTypeName;
      updatedRoomDetails.RatePlan = updatedRoomDetails.OrignalRatePlan.RatePlan;
      updatedRoomDetails.RoomDetails.roomView =
        updatedRoomDetails.OrignalRatePlan.roomView;
      updatedRoomDetails.RoomDetails.roomType =
        updatedRoomDetails.OrignalRatePlan.roomType;
      updatedRoomDetails.RoomDetails.name =
        updatedRoomDetails.OrignalRatePlan.name;
      updatedRoomDetails.RoomDetails.largeImageUrl =
        updatedRoomDetails.OrignalRatePlan.largeImageUrl;
      updatedRoomDetails.RoomCode = updatedRoomDetails.OrignalRatePlan.RoomCode;
      updatedRoomDetails.UniqueCode =
        updatedRoomDetails.OrignalRatePlan.UniqueCode;
      updatedRoomDetails.OrignalRatePlan = undefined;

      this.upgradeSelected[index] = false;
      this.upgradeSelectedError[index] = false;
      this.upgradeSelectedRoom[index] = "";
      this.roomSelectedChecked = "";
      this.store.updateSingleRoom(updatedRoomDetails, index);
      if (this.upgradePriceChange[index] === true) {
        this.initialLoad = true;
        this.availableUpgrades(index, false);
        this.upgradePriceChange[index] = false;
      }
      this.show = !this.show;
      // this.modalRef.hide();
    }
    this.upgradeEvent.emit(this.currRoomIndex);
  }

  getMessage(message: string, params: string[]) {
    return CommonUtility.fillMessage(message, params);
  }

  public onRoomChange(val) {
    this.isRoomSelected = true;
    this.roomSelected = val;
    this.roomSelectedChecked = val;
  }

  public closeUpgradeModal() {
    this.isRoomSelected = false;
    this.roomSelected = "";
    this.roomSelectedChecked = "";
  }

  getRoomData(roomCode) {
    this.roomupdates = this.roomListingService.getRoomBookedUpdatesForRoomCode(
      roomCode
    );
    if (this.roomupdates !== undefined && this.roomupdates !== null) {
      return true;
    }
    return false;
  }

  calculateRoomPrice(nightlyPrices, roomIndex) {
    this.upgradedRoomCost[roomIndex] = 0;
    for (let index = 0; index < nightlyPrices.length; index++) {
      if (
        nightlyPrices[index].discountedPriceByCurrency[this.currency] !==
          undefined &&
        nightlyPrices[index].discountedPriceByCurrency[this.currency] !== null
      ) {
        this.upgradedRoomCost[roomIndex] =
          this.upgradedRoomCost[roomIndex] +
          nightlyPrices[index].discountedPriceByCurrency[this.currency];
      } else {
        this.upgradedRoomCost[roomIndex] =
          this.upgradedRoomCost[roomIndex] +
          nightlyPrices[index].priceByCurrency[this.currency];
      }
    }
  }

  openBummerModal(template: TemplateRef<any>, bummerType) {
    this.bummerType = bummerType;
    if (this.modalRef === undefined) {
      this.modalRef = this.modalService.show(template, { class: "modal-md" });
      CommonUtility.focusOnModal('avail-upgrades-bummer-modal');
      this.store.setActiveModalElem('g_btn_upgrade');
    } else {
      return;
    }
  }

  closeBummerModal(bummerType) {
    this.bummerType = "";
    if (this.modalRef !== undefined) {
      this.modalRef.hide();
    }
    this.modalRef = undefined;
    if (bummerType === "inventoryChange") {
      this.availableRoomUpgrade.map((upgrade) => {
        if (upgrade !== null) {
          this.isAvailable = true;
        }
      });
    }
  }

  // method to call upgrade api based on room
  availableUpgrades(
    rNo,
    recheckUpgrades: boolean,
    template?: TemplateRef<any>
  ) {
    let queryParams = {};
    const selectedRoom = this.selectedRoomInBasket[rNo];
    const room = selectedRoom.RoomDetails;
    const ratePlan = selectedRoom.RatePlan;
    const addonPrice_perNight =
      ratePlan.lowestUnitAddOnPrice &&
      ratePlan.lowestUnitAddOnPrice[this.currency]
        ? ratePlan.lowestUnitAddOnPrice[this.currency] / this.totalnight
        : 0;
    // this.currCode = CommonUtility.getCurrSymbolForType(this.selectedRoomInBasket.CurrencyCode);
    queryParams = {
      arrivalDate: CommonUtility.formateDate(this.guestSummary.checkindate),
      departureDate: CommonUtility.formateDate(this.guestSummary.checkoutdate),
      roomCode: selectedRoom.UniqueCode,
      rateCode: ratePlan.code,
      numberOfAdults: this.guestSummary.guests[rNo].adults,
      numberOfChildren: this.guestSummary.guests[rNo].children,
      currencyCode: this.currency,
      currencyPrice:
        ratePlan.discountedAveragePriceByCurrency[this.currency] +
          addonPrice_perNight ||
        ratePlan.averagePriceByCurrency[this.currency] + addonPrice_perNight,
    };
    if (this.initialLoad === true || recheckUpgrades) {
      this.availableRoomUpgrade[rNo] = null;
      this.availableUpgradesSubscription = this._guestInfoCreditCardService
        .getAvailableRoomUpgrade(queryParams)
        .subscribe((data) => {
          if (
            data &&
            data.status &&
            _.get(data, "status.statusCode") !== 1000
          ) {
            this.store.setError(data.status.statusCode);
          }
          if (data && data.data) {
            this.isAvailable = true;
            this.availableRoomUpgrade[rNo] = data.data;
            this.upgradeSelected[rNo] = false;
            this.upgradeSelectedError[rNo] = false;
            if (recheckUpgrades) {
              this.currAvailableUpgrade = this.availableRoomUpgrade[rNo];
              this.currGuestInfo = this.guestSummary.guests[rNo];
              this.currRoomIndex = rNo;
              this.onRoomChange(this.currAvailableUpgrade[0]);
              const basket = this.store.getBasketState() as IBasketState;
              const selectionObj = basket.Rooms[this.currRoomIndex];
              this.currentSelectedRoom = selectionObj;
              this.modalRef = this.modalService.show(template, {
                class: "modal-lg",
              });
              CommonUtility.focusOnModal("avail-upgrades-modal");
            }
          } else {
            this.availableRoomUpgrade[rNo] = null;
            this.isAvailable = false;
            if (recheckUpgrades) {
              this.modalRef = undefined;
              this.errorMsg = this.localeObj.tf_4_Checkout_upgradeAddons_upgradeInventoryCloseError;
              this.openBummerModal(this.bummer, "inventoryClose");
            }
          }
        });
    }
  }

  applyPriceFormat(price) {
    let formattedPrice = this.store.applyPriceFormatPipe(
      price,
      this.currency,
      true
    );
    if (!_.includes(NON_DECIMAL_CURRENCIES, this.defaultcurrency)) {
      formattedPrice = CommonUtility.roundedValue(formattedPrice, 2);
    }
    return formattedPrice;
  }
}
