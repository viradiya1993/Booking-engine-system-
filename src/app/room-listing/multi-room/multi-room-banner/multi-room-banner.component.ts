import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from "@angular/core";
import * as _ from "lodash";
import { Subscription } from "rxjs";
import { CommonUtility } from "src/app/common/common.utility";
import { HttpResponseInterceptor } from "src/app/common/services/http-response.interceptor";
import { Router } from "../../../../../node_modules/@angular/router";
import {
  ErrorCodesListInComponents,
  URL_PATHS,
} from "../../../common/common.constants";
import { RoomListingService } from "../../../common/services/roomListing.Service";
import { StoreService } from "../../../common/services/store.service";
import { CheckinSummary } from "../../../search/guestduration/checkinsummary.type";
import { FeatureFlags } from "src/app/common/feature.flags";

@Component({
  selector: "app-multi-room-banner",
  templateUrl: "./multi-room-banner.component.html",
  styleUrls: ["./multi-room-banner.component.scss"],
})
export class MultiRoomBannerComponent implements OnInit, OnDestroy {
  private _subscriptionSD: Subscription;
  public roomsBooked: any;
  private checkInSummary: CheckinSummary;
  public isReSelection: boolean;
  @Input("roomBookingOrder") roomBookingOrder: any[];
  @Input("rateCode") rateCode: string;
  @Input("isPromoOrSpecialsFlow") isPromoOrSpecialsFlow = false;
  @Output() multiRoomRemoved = new EventEmitter<any>();
  @Output() promoMultiRoomSelected = new EventEmitter<any>();
  localeObj: any;
  RTL_Flag: boolean = false;

  private _userSettingsSubscriptions: Subscription;
  constructor(
    private _roomSvc: RoomListingService,
    private store: StoreService,
    private _router: Router
  ) {}

  ngOnInit() {
    this.isReSelection = false;
    this._userSettingsSubscriptions = this.store
      .getUserSettings()
      .subscribe((sharedData) => {
        this.localeObj = sharedData.localeObj;
        this.RTL_Flag = CommonUtility.langAlignCheck(this.store.getUserSettingsState().langObj.code, FeatureFlags);
      });
    this._subscriptionSD = this.store.getBasket().subscribe((basket) => {
      this.checkInSummary = basket.GuestSummary;
      this.checkInSummary.guests.forEach((element) => {
        element.adults = Number(element.adults);
        element.children = Number(element.children);
      });
      const rooms = basket.Rooms;
      if (rooms !== undefined && rooms.length > 0) {
        let index = 1;
        this.roomsBooked = [];
        rooms.forEach((element) => {
          if (
            element !== [] &&
            element !== undefined &&
            element !== null &&
            element.length !== 0
          ) {
            this.roomsBooked.push({
              roomNo: index,
              roomType: element.RoomDetails.roomType,
              roomView: element.RoomDetails.roomView,
              bedTypeName: element.BedTypeName,
              adults: Number(this.checkInSummary.guests[index - 1].adults),
              children: Number(this.checkInSummary.guests[index - 1].children),
            });
          }
          if (this.roomBookingOrder[0] === index - 1 && element.length === 0) {
            this.isReSelection = true;
          }
          index++;
        });
      } else {
        this.roomsBooked = [];
      }
      if (this.roomsBooked.length === Number(this.checkInSummary.rooms)) {
        const ele = document.getElementsByName("MultiRoomBanner");
        if (ele !== undefined && ele !== null && ele.length > 0) {
          ele[0].scrollIntoView({
            behavior: "smooth",
            block: "start",
            inline: "nearest",
          });
        }
      }
    });
  }

  ngOnDestroy(): void {
    const subscriptionsList = [
      this._subscriptionSD,
      this._userSettingsSubscriptions,
    ];
    CommonUtility.removeSubscriptions(subscriptionsList);
  }

  onMultiRoomSelected(event: Event) {
    const offerCode = this.store.getBasketState().offerCode;
    const userSettingsState = this.store.getUserSettingsState();
    const langObj = _.get(userSettingsState, "langObj");
    const currency = this.store.getBasketState().CurrencyCode;
    const params = CommonUtility.getMultiRoomRateplanQueryParams(
      offerCode,
      langObj,
      currency
    );

    const navigationExtras = {
      queryParams: params,
    };
    HttpResponseInterceptor.reqCounter = 0;
    this._router.navigate(
      ["/" + URL_PATHS.MULTIROOMPLANLISTING],
      navigationExtras
    );
  }

  onPromoMultiRoomSelected() {
    this.promoMultiRoomSelected.emit();
  }

  hideRoom(rooms: any) {
    this.store.removeErrors(ErrorCodesListInComponents.MultiRoomBanner);
    const ele = document.getElementById("DIV-" + rooms.roomNo);
    ele.parentNode.removeChild(ele);
    // this.store.updateEmptySingleRoom(Number(rooms.roomNo) - 1);
    this.multiRoomRemoved.emit(Number(rooms.roomNo) - 1);
  }
}
