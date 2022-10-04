import {
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from "@angular/core";
import * as _ from "lodash";
import { Subscription } from "rxjs";
import { CommonUtility } from "../../common/common.utility";
import { StoreService } from "../../common/services/store.service";
import {
  IBasketState,
  SelectedRoom,
} from "../../common/store/reducers/basket.reducer";
import { AddOnsComponent } from "../../room-listing/rate-plans/add-ons/add-ons.component";

@Component({
  selector: "app-packagelisting",
  templateUrl: "./packagelisting.component.html",
  styleUrls: ["./packagelisting.component.scss"],
})
export class PackagelistingComponent implements OnInit, OnDestroy {
  private _subscription: Subscription;
  packageData: any;
  basketData: IBasketState;
  selectedRoomData: any;
  roomsInBasket: any[];
  maxNoOfSeats: number;
  maxAvailableSeats: number;
  isPackageError: boolean;
  packageError: string;
  totalSeats: number;
  localeObj: any;
  isManageBookingFlow: boolean;
  private _userSettingsSubscriptions: Subscription;
  @ViewChild("lionKingComponent") lionKingComponent: AddOnsComponent;
  @Output() reloadMBVerbiage = new EventEmitter();

  constructor(private storeSvc: StoreService) {}

  ngOnInit() {
    this._userSettingsSubscriptions = this.storeSvc
      .getUserSettings()
      .subscribe((sharedData) => {
        this.localeObj = sharedData.localeObj;
      });
    this.isPackageError = false;
    this.packageError = "";
    this._subscription = this.storeSvc.getBasket().subscribe((data) => {
      this.basketData = data as IBasketState;
      this.totalSeats = 0;
      if (this.basketData.GuestSummary !== undefined) {
        this.maxNoOfSeats =
          this.basketData.GuestSummary.guests[0].adults +
          this.basketData.GuestSummary.guests[0].children;
      }
      if (this.basketData.Rooms.length > 0) {
        // && this.basketData.Rooms[0].Packages !== undefined) {
        this.packageData = this.basketData.Rooms[0].Packages;
        this.selectedRoomData = Object.create(this.basketData.Rooms[0]);
        this.selectedRoomData.Room = this.selectedRoomData.RoomDetails;
        this.roomsInBasket = this.basketData.Rooms;
        this.basketData.Rooms.forEach((roomdata) => {
          if (roomdata.Packages && roomdata.Packages.length > 0) {
            this.totalSeats =
              Number(this.totalSeats) + Number(roomdata.Packages[0].NoOfSeats);
          }
        });
      }
      if (
        this.packageData !== undefined &&
        _.size(this.packageData) > 0 &&
        this.packageData[0].AddonId === "-1"
      ) {
        this.isPackageError = true;
        this.packageError =
          "Selected show time is not available currently. Please select different show time.";
      }
    });
    this.isManageBookingFlow = this.storeSvc.getManageBookingFlowStatus();
  }

  ngOnDestroy() {
    const subscriptionsList = [
      this._subscription,
      this._userSettingsSubscriptions,
    ];
    CommonUtility.removeSubscriptions(subscriptionsList);
  }

  getPackageAvailableFlag() {
    return this.isPackageError;
  }

  editPackageDetail(pkg: any, rooms: SelectedRoom[]) {
    const firstRatePlan = rooms[0].RatePlan.addOnInfo[0];
    if (
      firstRatePlan.addOnType.toLowerCase() ===
        "Ticketing addons".toLowerCase() &&
      firstRatePlan.addOnCode !== undefined
    ) {
      // show lion king here
      this.lionKingComponent.showLionKingDetails(
        /* this.selectedRoomData, */
        firstRatePlan.addOnType,
        firstRatePlan.addOnCode,
        this.packageData[0]
      );
      return false;
    }
  }

  onLionKingPackageSelected(eventData: any) {
    if (eventData.length > 0) {
      let index = 0;
      this.basketData.Rooms.forEach((Roomdata) => {
        const packageData = eventData[index];
        Roomdata.Packages = [];
        Roomdata.Packages.push(packageData);
        index++;
      });
      this.storeSvc.updateMultipleRoomsWithPricing(this.basketData.Rooms);
    } else {
      this.selectedRoomData.Packages.length = 0;
      this.selectedRoomData.Packages.push(eventData);
      this.storeSvc.updateSingleRoom(this.selectedRoomData);
    }
    const basket = this.storeSvc.getBasketState() as IBasketState;

    // Start - checkout page Edit Room issue
    if (
      basket.isRoomEdited &&
      basket.unselectedRooms &&
      basket.unselectedRooms.length > 0
    ) {
      _.forEach(basket.unselectedRooms, (value, key) => {
        if (basket.unselectedRooms[key] !== undefined) {
          basket.unselectedRooms[key] = basket.Rooms[key];
        }
      });
    }
    // End - checkout page Edit Room issue
    if (this.isManageBookingFlow) {
      this.reloadMBVerbiage.emit();
    }
  }

  getTransformedDate(dateStr: string) {
    return CommonUtility.getTransformedDateFromDateStr(dateStr, this.localeObj);
  }

  getTranslatedDate(dateStr: string) {
    const dateString = CommonUtility.getTranslatedDate(dateStr, this.localeObj);
    return dateString;
  }
}
