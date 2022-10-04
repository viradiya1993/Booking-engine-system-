import { Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import * as _ from "lodash";
import { Subscription } from "rxjs";
import {
  STEP_MAP,
  URL_PATHS,
} from "../../../common/common.constants";
import { CommonUtility } from "../../../common/common.utility";
import { AvailableRoomRatePlans } from "../../../common/models/packagedetails";
import { RatePlanListingService } from "../../../common/services/ratePlanListing.Service";
import { StoreService } from "../../../common/services/store.service";
import { SelectedRoom } from "../../../common/store/reducers/basket.reducer";
import { ICheckinSummary } from "../../../search/guestduration/checkinsummary.type";
import { AddOnsComponent } from "../../rate-plans/add-ons/add-ons.component";
import { FeatureFlags } from "src/app/common/feature.flags";

@Component({
  selector: "app-multiroom-rate-plan",
  templateUrl: "./multiroom-rate-plan.component.html",
  styleUrls: ["./multiroom-rate-plan.component.scss"],
})
export class MultiroomRatePlanComponent implements OnInit, OnDestroy {
  availableRoomRatePlans: AvailableRoomRatePlans = {
    status: "",
    data: [],
    id: "",
  };
  currFilterValue: string;
  currCode: string;
  guestSummary: ICheckinSummary;
  private _subscription: Subscription;
  selectedRoomInBasket: SelectedRoom[];
  roomCodes: string[];
  tmpSubscription: Subscription;
  localeObj: any;
  rateplanVsRoomDetailsMap: Map<string, any>;
  selectedRoomData: any;
  bedtype = "King Bed";
  guestdetailsString: string[];
  private _userSettingsSubscriptions: Subscription;
  @ViewChild("lionKingComponent", { static: true })
  lionKingComponent: AddOnsComponent;
  RTL_Flag: boolean = false;
  showAverageNightlyRate = true;
  public filteredRatePlan: any = [];
  constructor(
    private ratePlanListingService: RatePlanListingService,
    private _storeSvc: StoreService,
    private router: Router,
    private _route: ActivatedRoute
  ) {}

  ngOnDestroy() {
    if (window["unloadmultiRoomRateplansFunc"]) {
      window["unloadmultiRoomRateplansFunc"]();
    }
    const subscriptionsList = [
      this._subscription,
      this.tmpSubscription,
      this._userSettingsSubscriptions,
    ];
    CommonUtility.removeSubscriptions(subscriptionsList);
  }

  ngOnInit() {
    CommonUtility.highlightStep("select-room");
    const basket = this._storeSvc.getBasketState();

    this._userSettingsSubscriptions = this._storeSvc
      .getUserSettings()
      .subscribe((sharedData) => {
        this.localeObj = sharedData.localeObj;
        this.RTL_Flag = CommonUtility.langAlignCheck(this._storeSvc.getUserSettingsState().langObj.code, FeatureFlags);
      });
    this.roomCodes = [];
    if (basket.CurrentStep !== STEP_MAP[URL_PATHS.ROOMS_PAGE]) {
      this._storeSvc.updateCurrentStep(STEP_MAP[URL_PATHS.ROOMS_PAGE]);
    }
    this.guestdetailsString = CommonUtility.getGuestDetailsString(
      basket.GuestSummary,
      this.localeObj
    );
    this.currFilterValue = basket.CurrencyCode;
    this.currCode = CommonUtility.getCurrSymbolForType(
      this._storeSvc.getUserSettingsState().propertyInfo,
      this.currFilterValue
    );
    this.showAverageNightlyRate = _.get(
      this._storeSvc.getUserSettingsState(),
      "propertyInfo.showAverageNightlyRate"
    );

    this.guestSummary = basket.GuestSummary;
    _.forEach(basket.Rooms, (room) => {
      this.roomCodes.push(room.UniqueCode);
    });
    this.selectedRoomInBasket = basket.Rooms;
    const rateCode = this._storeSvc.getBasketState().offerCode;
    this.tmpSubscription = this.ratePlanListingService
      .getRatePlanList(this.roomCodes, this.guestSummary, rateCode)
      .subscribe((data) => {
        const status = this._storeSvc.setError(data.status.statusCode);
        if (!status) {
          this.backToRoomSelectionClicked();
        } else {
          this._storeSvc.removeError(6001);
          this.availableRoomRatePlans = data as AvailableRoomRatePlans;
          this.rateplanVsRoomDetailsMap = CommonUtility.consolidateRatePlansforMultiRoom(
            this.availableRoomRatePlans,
            this.selectedRoomInBasket.length,
            this.guestSummary,
            this._storeSvc
          );
          if (this.rateplanVsRoomDetailsMap.size === 0) {
            this._storeSvc.setError(6001);
            this.backToRoomSelectionClicked();
          }
        }
      });

    // multiRoomRateplansFunc() - MultiRoom-Rateplan scripts from admin
    if (window["multiRoomRateplansFunc"]) {
      window["multiRoomRateplansFunc"]();
    }

    if(!!this._storeSvc.getBasketState().roomAttributes){
      const val = this._storeSvc.getBasketState().roomAttributes.filter(offers => offers.selectFilterName === "Offer");
      if(val.length > 0) {
       this.filteredRatePlan = val[0].selectedFilterValues === this.localeObj.tf_1_Calendar_rateCalender_selectDropdown  ?  [] :  val[0].selectedFilterValues;
      }
    }
  }

  getValues(map) {
    return Array.from(map.values());
  }

  onRoomSelected(event: any, ratePlan: any, ee: any) {
    this.selectedRoomData = {
      RatePlan: ratePlan,
      Room: this.selectedRoomInBasket,
      BedType: this.bedtype,
      BedTypeName: undefined,
      CurrencyCode: this.currFilterValue,
      CurrencyCodeSymbol: this.currCode,
      Packages: [],
    };

    this._storeSvc.setAvailableRatePlans(this.availableRoomRatePlans.data[0]);

    let selectedRatePlanRoomMap;
    this.rateplanVsRoomDetailsMap.forEach((element) => {
      if (element.ratePlan.code === ratePlan.code) {
        selectedRatePlanRoomMap = element.rooms;
      }
    });

    let index = 0;
    _.forEach(this.selectedRoomInBasket, (selectedRoom) => {
      selectedRoom.RatePlan = _.get(selectedRatePlanRoomMap[index], "ratePlan");
      selectedRoom.Packages = [];
      index++;
    });

    this._storeSvc.updateMultipleRoomsWithPricing(this.selectedRoomInBasket);

    // if Lion king show dialog
    if (ratePlan.addOnInfo !== undefined && ratePlan.addOnInfo.length > 0) {
      const firstRatePlan = ratePlan.addOnInfo[0];
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
          undefined
        );
        return false;
      }
    }
    if (ratePlan.directbill !== undefined) {
      this._storeSvc.updateIsDirectBillRate(ratePlan.directbill);
    }
    CommonUtility.highlightStep("guest-info");
    const rooms = this._storeSvc.getBasketState().Rooms;
    const userSettingsState = this._storeSvc.getUserSettingsState();
    const langObj = _.get(userSettingsState, "langObj");
    const params = CommonUtility.getGuestInfoQueryParams(rooms, langObj);
    const navigationExtras = {
      queryParams: params,
    };
    this.router.navigate(["/" + URL_PATHS.GUEST_INFO_PAGE], navigationExtras);
  }

  getAvgRatePrice(ratePlan: any) {
    return this._storeSvc.getAvgRatePlanPrice(ratePlan, this.currFilterValue);
  }

  getDiscountedRatePlanPrice(ratePlan: any) {
    return this._storeSvc.getDiscountedRatePlanPrice(ratePlan, this.currFilterValue);
  }

  onLionKingPackageSelected(eventData: any) {
    let index = 0;
    this.selectedRoomInBasket.forEach((Roomdata) => {
      const packageData = eventData[index];
      Roomdata.Packages = [];
      Roomdata.Packages.push(packageData);
      index++;
    });

    this._storeSvc.updateMultipleRoomsWithPricing(this.selectedRoomInBasket);
    const basket = this._storeSvc.getBasketState();

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

    CommonUtility.highlightStep("guest-info");
    const rooms = this._storeSvc.getBasketState().Rooms;
    const userSettingsState = this._storeSvc.getUserSettingsState();
    const langObj = _.get(userSettingsState, "langObj");
    const params = CommonUtility.getGuestInfoQueryParams(rooms, langObj);
    const navigationExtras = {
      queryParams: params,
    };
    this.router.navigate(["/" + URL_PATHS.GUEST_INFO_PAGE], navigationExtras);
  }

  backToRoomSelectionClicked() {
    const offerCode = this._storeSvc.getBasketState().offerCode;
    const params = CommonUtility.getQueryParamObjGuestSummary(
      this.guestSummary,
      this._storeSvc,
      offerCode
    );
    const navigationExtras = {
      queryParams: params,
    };
    this.router
      .navigate(["/" + URL_PATHS.ROOMS_PAGE], navigationExtras)
      .then((d) => CommonUtility.highlightStep("select-room"));
    return false;
  }

  public closeFix(event, popover, target) {
    CommonUtility.toggleTooltip(event, popover, target);
  }
}
