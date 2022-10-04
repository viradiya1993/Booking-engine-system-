import {
  AfterViewChecked,
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
} from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import * as _ from "lodash";
import { BsModalService } from "ngx-bootstrap/modal";
import { BsModalRef } from "ngx-bootstrap/modal/bs-modal-ref.service";
import { Subscription } from "rxjs";
import { FeatureFlags } from "src/app/common/feature.flags";
import { IBasketState } from "src/app/common/store/reducers/basket.reducer";
import { CheckinSummary } from "src/app/search/guestduration/checkinsummary.type";
import {
  ErrorCodesListInComponents,
  QUERY_PARAM_ATTRIBUTES,
  STEP_MAP,
  URL_PATHS,
} from "../../common/common.constants";
import { CommonUtility } from "../../common/common.utility";
import { PromoService } from "../../common/services/promo/promo.service";
import { RoomListingService } from "../../common/services/roomListing.Service";
import { StoreService } from "../../common/services/store.service";
import {
  PromoDetails,
  Promos,
  Room,
  TaxesAndServiceChargesByCurrency,
} from "../../promo";
import { RatecalendarComponent } from "../../search/ratecalendar/ratecalendar.component";
import { RoomsSortByPipe } from "../../common/pipes/rooms-sort-by.pipe";
@Component({
  selector: "app-promo-details",
  templateUrl: "./promo-details.component.html",
  styleUrls: ["./promo-details.component.scss"],
  providers: [ RoomsSortByPipe ],
})
export class PromoDetailsComponent
  implements OnInit, AfterViewInit, AfterViewChecked, OnDestroy {
  public promoDetailsObject: any;
  sortOrder: boolean;
  public availableRooms: Room[];
  public offerIncludes = true;
  private routerSubscription: Subscription;
  public checkInSummary: CheckinSummary;
  isSortOrderAsc: boolean;
  public currencySelection: any = { code: "USD" };
  public tnc = false;
  public modalRef: BsModalRef;
  public localeObj: any;
  public showRoomsList = true;
  _userSettingsSubscriptions: any;
  _basketSubscription: any;
  currencyType: string;
  currCode: string;
  showAvgDiscountedPrice = false;
  supportedCurrencies = [];
  avgPrice: number;
  discountedAvgPrice: number;
  discountedPrice: number;
  // tslint:disable-next-line:no-input-rename
  @Input("searchTransactionId") searchTransactionId = "";
  // tslint:disable-next-line:no-input-rename
  @Input("selectedPromo") selectedPromo: PromoDetails;
  @Input("isCheckInDateEntry") isCheckInDateEntry = true;
  @ViewChild("bedTypesRef") bedTypesDiv: ElementRef<HTMLElement>;
  @ViewChild("rateCal", { static: true }) rateCalander: RatecalendarComponent;
  roomList: Room[];
  selectedRoom: Room;
  selectedRoomCode = "";
  bedTypes = [];
  showClose = false;
  roomCode: string;
  bedType = ""; // bedtypecode
  bedTypeName = "";
  defaultBedType = "";
  unselectedroom: boolean;
  selectedRoomUniqueCode: "";
  filteredChanged: boolean;
  private adultsCount: number;
  private childrenCount: number;
  nightVerbiage: string;
  roomVerbiage: string;
  adultVerbiage: string;
  childVerbiage: string;
  childVeriagewithCount: string;
  @ViewChild("bedTypesRef") lastExpandedRoomDetail: ElementRef<HTMLElement>;
  selectedRoomData: any;
  isManageBookingFlow: boolean;
  accessCode: string;
  offerCode: string;
  isSpecialRate: boolean;
  public multiRoomBanner: boolean;
  public roomBookingOrder: any[];
  isLangChanged: boolean;
  langCode: string;
  isMultiRooms: boolean;
  guestSummary: CheckinSummary;
  guests: number;
  isNextRoomValid: boolean;
  nextRoomNo: number;
  nextRoomAdults: number;
  nextRoomChildren: number;
  allMultiRoomsSelected: boolean;
  isPromoOrSpecialsFlow: boolean;
  showRoomDescriptionOnListing: boolean;
  isDpr4: boolean = false;
  isDpr5: boolean = false;
  isDpr6: boolean = false;
  RTL_Flag: boolean = false;
  showAverageNightlyRate = true;
  public filteredRoomList: any = [];
  public selectedRoomArray: any = [];
  public datesAvail: boolean;
  range: any;
  sortedRoomList: any;
  propertyType: any;

  constructor(
    private modalService: BsModalService,
    private _storeSvc: StoreService,
    private _route: ActivatedRoute,
    private router: Router,
    private roomListingService: RoomListingService,
    private promoService: PromoService,
    private sortBy: RoomsSortByPipe, 
  ) {}

  ngOnDestroy() {
    if (this._storeSvc.getBasketState().isSpecialsFlow) {
      if (window["unloadSpecialsPageSingleFunc"]) {
        window["unloadSpecialsPageSingleFunc"]();
      }
    } else {
      if (window["unloadPromoPageSingleFunc"]) {
        window["unloadPromoPageSingleFunc"]();
      }
    }
    const subscriptionsList = [
      this._userSettingsSubscriptions,
      this._basketSubscription,
      this.routerSubscription,
    ];
    CommonUtility.removeSubscriptions(subscriptionsList);
  }

  ngOnInit() {
    if (this.router.url.includes("/specials")) {
      this._storeSvc.updateCurrentStep(STEP_MAP[URL_PATHS.SPECIALS_PAGE]);

      // Sets the page name for rt4DataLayer
      CommonUtility.setDatalayer({
        rtPAGENAME: "Special Details",
        // Empty error state in data layer, in case of pre existing error
        error_type: "",
        error_code: "",
        error_description: "",
      });
    } else {
      this._storeSvc.updateCurrentStep(STEP_MAP[URL_PATHS.PROMO_PAGE]);

      // Sets the page name for rt4DataLayer
      CommonUtility.setDatalayer({
        rtPAGENAME: "Promo Details",
        // Empty error state in data layer, in case of pre existing error
        error_type: "",
        error_code: "",
        error_description: "",
      });
    }

    const userSettingsState = this._storeSvc.getUserSettingsState();
    const propertyInfo = _.get(userSettingsState, "propertyInfo");
    this.isLangChanged = false;
    this.langCode = userSettingsState.langObj.code;
    this.allMultiRoomsSelected = false;
    this.isPromoOrSpecialsFlow = true;
    this.showRoomDescriptionOnListing = _.get(
      propertyInfo,
      "showRoomDescriptionOnListing"
    );
    this.showAverageNightlyRate = propertyInfo.showAverageNightlyRate;

    this._userSettingsSubscriptions = this._storeSvc
      .getUserSettings()
      .subscribe((sharedData) => {
        this.localeObj = sharedData.localeObj;
        this.RTL_Flag = CommonUtility.langAlignCheck(this._storeSvc.getUserSettingsState().langObj.code, FeatureFlags);
        this.showAverageNightlyRate = this._storeSvc.getUserSettingsState().propertyInfo.showAverageNightlyRate;
        this.nightVerbiage =
          _.get(this.localeObj, "tf_3_MultiRoom_checkinSummery_nightsLc") ||
          "Nights";
        this.roomVerbiage =
          _.get(this.localeObj, "tf_4_Checkout_addons_roomLc") || "Room";
        this.adultVerbiage =
          _.get(this.localeObj, "tf_4_Checkout_checkoutSummery_adults") ||
          "Adults";
        this.childVerbiage =
          _.get(this.localeObj, "tf_1_Calendar_rateCalender_children") ||
          "Children";
        if (!!this._route.snapshot.queryParams.offerCode) {
          this._storeSvc.setSpecialsOfferCode(
            this._route.snapshot.queryParams.offerCode
          );
        }
        this.propertyType = sharedData.propertyInfo.propertyType || '';
      });

    this.supportedCurrencies = propertyInfo.supportedCurrencies;
    this.promoDetailsObject = this.selectedPromo || this.selectedPromo[0];
    this.promoDetailsObject.availableRooms.forEach((element) => {
      element.roomSpecifications = this.roomListingService.getRoomSpec(
        element,
        this.localeObj
      );
    });
    // SET - PROMO DETAILS
    this.filteredRoomList = _.cloneDeep(this.promoDetailsObject.availableRooms);
    this.roomList = this.promoDetailsObject.availableRooms;
    this.sortedRoomList = this.sortBy.transform(this.filteredRoomList, this.currencyType , true);
    if(!(this.propertyType.length > 0 && this.propertyType === 'UD')) {
      if(!!this._storeSvc.getBasketState().roomAttributes) {
        this.updateRoomList(this._storeSvc.getBasketState().roomAttributes);
      }
    }
    this.promoService.promos.subscribe((response) => {
      let offerInfo: any;
      const offerCodeVal = this._route.snapshot.params.offerCode || "";

      if (
        (offerCodeVal === undefined || offerCodeVal === "") &&
        this.accessCode !== "" &&
        response &&
        _.get(response, "status.statusCode") === 1000 &&
        response.data.ratePlanDetails &&
        response.data.ratePlanDetails.length === 1
      ) {
        offerInfo = response.data.ratePlanDetails[0];
      }

      if (
        this.offerCode !== "" &&
        this.offerCode !== null &&
        this.offerCode !== undefined
      ) {
        offerInfo = _.find(response.data.ratePlanDetails, [
          "code",
          this.offerCode,
        ]);
      }
      if (offerInfo) {
        this.promoDetailsObject = {};
        this.roomList = [];
        this.promoDetailsObject = offerInfo;
        this.promoDetailsObject.availableRooms.forEach((element) => {
          element.roomSpecifications = this.roomListingService.getRoomSpec(
            element,
            this.localeObj
          );
        });

        this.setLowestRoomRatePrice();
        if (!(this.isMultiRooms && this.allMultiRoomsSelected)) {
          this.hideAll();
        }
        // SET - PROMO DETAILS
        this.roomList = this.promoDetailsObject.availableRooms;
        this.filteredRoomList = _.cloneDeep(this.promoDetailsObject.availableRooms);
        this.sortedRoomList = this.sortBy.transform(this.filteredRoomList, this.currencyType , true);
        if(!(this.propertyType.length > 0 && this.propertyType === 'UD')) {
          if(!!this._storeSvc.getBasketState().roomAttributes) {
            this.updateRoomList(this._storeSvc.getBasketState().roomAttributes);
          }
        }
      }

      // Start- ADA fix for filters
      setTimeout(() => {
        $('.accesibleDropDown .ng-select.ng-select-single input[type="text"]').each(function() {
          this.setAttribute('tabindex', '-1');
          this.setAttribute('aria-label', 'Dropdown');
        });
      }, 10);
// End- ADA fix for filters
    });

    if (this.roomList.length === 0) {
      this.multiRoomBanner = false;
    }

    this.showAvgDiscountedPrice = false;
    this.isSortOrderAsc = true;
    this.filteredChanged = false;
    this.adultsCount = 0;
    this.childrenCount = 0;
    this.childVeriagewithCount =
      _.get(this.localeObj, "tf_1_Calendar_rateCalender_children") ||
      "Children";
    this._storeSvc.updateSortOrder(true);
    this.isManageBookingFlow = this._storeSvc.getManageBookingFlowStatus();

    this._basketSubscription = this._storeSvc
      .getBasket()
      .subscribe((basket) => {
        this.isSpecialRate = basket.isSpecialsFlow;
        this.guestSummary = basket.GuestSummary;
        this.guests =
          Number(this.guestSummary.guests[0].adults) +
          Number(this.guestSummary.guests[0].children);
        if (
          this.checkInSummary === undefined ||
          !this.compareCheckInSummary(this.checkInSummary, basket.GuestSummary)
        ) {
          if (
            basket.GuestSummary !== undefined &&
            Number(basket.GuestSummary.rooms) > 1
          ) {
            // If multi room booking
            this.isMultiRooms = true;
            this.multiRoomBanner = true;
            this.roomBookingOrder = basket.RoomBookingOrder;

            if (
              basket.RoomBookingOrder.length === 0 &&
              basket.Rooms.length !== 0
            ) {
              this.allMultiRoomsSelected = true;
              this.hideAll();
              this.unselectedroom = true;
              this.roomCode = "";
            } else {
              this.allMultiRoomsSelected = false;
              this.unselectedroom = false;
            }

            if (_.size(this.roomBookingOrder) >= 1) {
              this.isNextRoomValid = true;
              this.nextRoomNo = Number(this.roomBookingOrder[0]);
              this.nextRoomAdults = this.guestSummary.guests[
                this.nextRoomNo
              ].adults;
              this.nextRoomChildren = this.guestSummary.guests[
                this.nextRoomNo
              ].children;
            } else {
              this.isNextRoomValid = false;
            }
          } else {
            this.isMultiRooms = false;
            this.multiRoomBanner = false;
            this.roomBookingOrder = undefined;
          }

          if (this.multiRoomBanner) {
            if (
              !this.compareCheckInSummary(
                this.checkInSummary,
                basket.GuestSummary
              ) ||
              this.isLangChanged === true
            ) {
              this._storeSvc.updateEmptyRooms();
              this._storeSvc.upsertMultiRoomBookingOrder([]);
              basket.Rooms = [];
              this.roomBookingOrder = [];
              this.isLangChanged = false;
            }
            let index = 0;
            if (
              basket.Rooms.length === 0 &&
              this.roomBookingOrder.length === 0
            ) {
              basket.GuestSummary.guests.forEach((element) => {
                this.roomBookingOrder.push(index);
                index++;
              });
              this._storeSvc.upsertMultiRoomBookingOrder(this.roomBookingOrder);
            }
          }
          if (basket.GuestSummary !== undefined) {
            this.checkInSummary = basket.GuestSummary;
          }
        }

        this.currencyType =
          basket.CurrencyCode === undefined
            ? propertyInfo.defaultCurrency
            : basket.CurrencyCode;
        this.currCode = CommonUtility.getCurrSymbolForType(
          this._storeSvc.getUserSettingsState().propertyInfo,
          this.currencyType
        );
        if (
          basket.SortOrder !== undefined &&
          this.sortOrder !== basket.SortOrder
        ) {
          this.showClose = false;
          this.filteredChanged = true;
          this.hideAll();
          this.filteredChanged = false;
          const basketStateObj = this._storeSvc.getBasketState();
          if (basketStateObj.RoomBookingOrder.length === 0 &&
              basketStateObj.Rooms.length === +this.checkInSummary.rooms
              ) {
                this.unselectedroom = this.isMultiRooms ? true : false;
                this.allMultiRoomsSelected = true;
              }
        }
        this.sortOrder =
          basket.SortOrder === undefined || basket.SortOrder ? true : false;
        this.range = !basket.range || basket.range.length === 0 ? [] : basket.range;

        this.setLowestRoomRatePrice();
      });
    // End - Basket subscription

    // Router subscription starts
    this.routerSubscription = this._route.queryParams.subscribe((params) => {
      this.datesAvail = !params["CheckinDate"];
      if (
        params[QUERY_PARAM_ATTRIBUTES.CHECKINDATE] === undefined ||
        params[QUERY_PARAM_ATTRIBUTES.CHECKINDATE] === ""
      ) {
        this.isCheckInDateEntry = false;
      } else {
        this.isCheckInDateEntry = true;
      }
      if (
        params["locale"] !== undefined &&
        params["locale"] !== this.langCode
      ) {
        this.isLangChanged = true;
        this.langCode = params["locale"];
      }
      const checkInSummaryObject = CommonUtility.getCheckInSummaryFromQueryParams(
        params
      );
      this.checkInSummary = checkInSummaryObject.checkinSummary;

      if (
        params[QUERY_PARAM_ATTRIBUTES.ROOMS] === undefined ||
        params[QUERY_PARAM_ATTRIBUTES.ROOMS] === ""
      ) {
        this.checkInSummary.rooms = 1;
        // Browswer backbutton click flow from promo details page after multiroom search
        this.isMultiRooms = false;
        this.multiRoomBanner = false;
        this.roomBookingOrder = undefined;
      } else if (params[QUERY_PARAM_ATTRIBUTES.ROOMS] !== undefined) {
        this.checkInSummary.rooms = params[QUERY_PARAM_ATTRIBUTES.ROOMS];
      }
      this._storeSvc.updateGuestDuration(this.checkInSummary);
      this.accessCode = params[QUERY_PARAM_ATTRIBUTES.ACCESS_CODE] || "";
      this.offerCode = params[QUERY_PARAM_ATTRIBUTES.OFFERCODE] || "";

      // Browser back button flow from checkout page :: handle greyout
      const basketStateObj = this._storeSvc.getBasketState();
      if (
        basketStateObj.RoomBookingOrder.length === 0 &&
        basketStateObj.Rooms.length === +this.checkInSummary.rooms
      ) {
        this.hideAll();
        this.unselectedroom = this.isMultiRooms ? true : false;
        this.allMultiRoomsSelected = true;
      }
    });
    // End - router subscription

    this.checkInSummary.guests.forEach((element) => {
      this.adultsCount = this.adultsCount + Number(element.adults);
      this.childrenCount = this.childrenCount + Number(element.children);
    });

    // Start - Verbiage Settings
    if (this.childrenCount === 1) {
      this.childVerbiage = _.get(this.localeObj, "tf_1_Calendar_rateCalender_child") || "Child";
      this.childVeriagewithCount =
        (_.get(this.localeObj, "tf_3_MultiRoom_packageListing_comma") || ",") +
        " " +
        this.childrenCount +
        " " +
        this.childVerbiage;
    } else if (this.childrenCount > 1) {
      this.childVeriagewithCount =
        (_.get(this.localeObj, "tf_3_MultiRoom_packageListing_comma") || ",") +
        " " +
        this.childrenCount +
        " " +
        this.childVerbiage;
    }
    if (this.childrenCount === 0) {
      this.childVeriagewithCount = "";
    }
    if (this.adultsCount === 1) {
      this.adultVerbiage =
        _.get(this.localeObj, "tf_1_Calendar_rateCalender_adult") || "Adult";
    }
    // End - Verbiage Settings

    // specialsPageSingleFunc / promoPageSingleFunc scripts from admin
    // Depends on which flow the user is on specials or promo
    if (this._storeSvc.getBasketState().isSpecialsFlow) {
      if (window["specialsPageSingleFunc"]) {
        window["specialsPageSingleFunc"]();
      }
    } else {
      if (window["promoPageSingleFunc"]) {
        window["promoPageSingleFunc"]();
      }
    }

    // DPR based on feature flag
    if (FeatureFlags.isFeatureEnabled("dpr4")) {
      this.isDpr4 = true;
    } else if (FeatureFlags.isFeatureEnabled("dpr5")) {
      this.isDpr5 = true;
    } else if (FeatureFlags.isFeatureEnabled("dpr6")) {
      this.isDpr6 = true;
    }
    // Start- ADA fix for filters
    setTimeout(() => {
      $('.currency-dropdown .ng-select.ng-select-single input[type="text"]').each(function() { this.setAttribute('tabindex', '-1'); this.setAttribute('aria-label', 'Dropdown') });
    }, 10);
// End- ADA fix for filters

    this.toggleAccordian();
    // setTimeout(() => {
    //   if(!(this.propertyType.length > 0 && this.propertyType === 'UD')) {
    //     if(this._storeSvc.getBasketState().roomAttributes.length > 0) {
    //       this.updateRoomList(this._storeSvc.getBasketState().roomAttributes);
    //     }
    //   }
    // },3000);

} // End ngOnInit()

  ngAfterViewInit() {
    if (this.lastExpandedRoomDetail === undefined) {
      this.unselectedroom = false;
      this.showClose = false;
    }
  }

  ngAfterViewChecked() {
    if (this.lastExpandedRoomDetail === undefined) {
      this.unselectedroom = false;
      this.showClose = false;
    }
  }

  getAvgRoomPrice(room: any) {
    return this._storeSvc.getAvgRoomPrice(room, this.currencyType);
  }

  getDiscountedRoomPrice(room: any) {
    return this._storeSvc.getDiscountedRoomPrice(room, this.currencyType);
  }

  setLowestRoomRatePrice() {
    if (
      !!this.promoDetailsObject.availableRooms &&
      this.promoDetailsObject.availableRooms.length > 0
    ) {
      let lowestPricedRoom: any;

      if (
        !!this.promoDetailsObject &&
        this.promoDetailsObject.lowestRoomTypeCode !== null
      ) {
        const lowestPriceRoomCode = this.promoDetailsObject.lowestRoomTypeCode;
        lowestPricedRoom = _.filter(
          this.promoDetailsObject.availableRooms,
          function (element) {
            return element.code.indexOf(lowestPriceRoomCode) > -1;
          }
        );

        if (!!lowestPricedRoom) {
          // this.avgPrice =
          //   lowestPricedRoom[0].averagePriceByCurrency[this.currencyType];
          // const discountedAvgPrice =
          //   lowestPricedRoom[0].discountedAveragePriceByCurrency[
          //     this.currencyType
          //   ];
          this.avgPrice = this.getAvgRoomPrice(lowestPricedRoom[0]);
          const discountedAvgPrice = this.getDiscountedRoomPrice(lowestPricedRoom[0]);

          if (!!discountedAvgPrice) {
            this.showAvgDiscountedPrice = true;
            this.discountedAvgPrice = discountedAvgPrice;
          }
        } // end if
      } // end if
    }
  }

  checkDiscountPriceDisplay(roomDiscPriceValue) {
    return !!roomDiscPriceValue ? true : false;
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

  selectRoom(
    roomObject: Room,
    bedTypesDiv: any,
    ratePlanCode?: string,
    uniqueRoomCode?: string
  ) {
    this.selectedRoomArray = !!uniqueRoomCode ? [roomObject,bedTypesDiv, ratePlanCode, uniqueRoomCode] : [roomObject,bedTypesDiv];
    if (this.lastExpandedRoomDetail !== undefined) {
      this.lastExpandedRoomDetail.nativeElement.classList.remove("show");
    }
    this.lastExpandedRoomDetail = bedTypesDiv;
    this.bedTypes = [];
    this.showClose = true;
    this.selectedRoom = roomObject;
    this.selectedRoomCode = roomObject.code;
    this.roomCode = roomObject.code;
    this.bedTypes = _.get(roomObject, "bedTypes");
    this.defaultBedType = roomObject.defaultBedType;
    this.unselectedroom = true;
    this.bedType = roomObject.defaultBedType;
    let selectedRoomBedTypes = [];
    const basketData = this._storeSvc.getBasketState();
    const roomCodes = new Array();
    roomCodes.push(this.selectedRoomCode);

    if (!this.isMultiRooms) {
      selectedRoomBedTypes = this.selectedRoom.bedTypes;
      if (!!selectedRoomBedTypes && selectedRoomBedTypes.length > 0) {
        selectedRoomBedTypes.forEach((bedType) => {
          if (bedType.bedTypeCode === this.bedType) {
            this.bedTypeName = bedType.bedTypeName;
            this.selectedRoomUniqueCode = _.get(bedType, "roomCode");
          }
        });
      }
      bedTypesDiv.classList.add("show");
      CommonUtility.scrollIntoViewName(roomObject.code);
    } else {
      this.selectedRoom.bedTypes.forEach((element) => {
        if (element.roomCode === uniqueRoomCode) {
          this.bedType = element.bedTypeCode;
          // this.emitBedTypeChangedEvent(this.selectedRoom);
        }
        // if (!this.isRoomSubTypeEnabled && this.bedtype === element.bedTypeCode) {
        //   this.availableRoomRatePlans.data.push({
        //     bedTypeCode: element.bedTypeCode,
        //     bedTypeName: element.bedTypeName,
        //     bedTypeImageUrl: element.bedTypeImageURL,
        //     roomCode: element.roomCode,
        //     roomName: this.selectedRoom.name,
        //     availableRatePlans: [],
        //     roomSeqNo: 1
        //   });
        // } else if (this.isRoomSubTypeEnabled) {
        //   this.availableRoomRatePlans.data.push({
        //     bedTypeCode: element.bedTypeCode,
        //     bedTypeName: element.bedTypeName,
        //     bedTypeImageUrl: element.bedTypeImageURL,
        //     roomCode: element.roomCode,
        //     roomName: this.selectedRoom.name,
        //     availableRatePlans: [],
        //     roomSeqNo: 1
        //   });
        // }
      });
      if (this.roomBookingOrder.length >= 1) {
        this.isNextRoomValid = true;
        this.nextRoomNo = Number(this.roomBookingOrder[0]);
        this.nextRoomAdults = this.guestSummary.guests[this.nextRoomNo].adults;
        this.nextRoomChildren = this.guestSummary.guests[
          this.nextRoomNo
        ].children;
      } else {
        this.isNextRoomValid = false;
      }
      if (bedTypesDiv !== null) {
        // this.bedTypesDiv.nativeElement.classList.add('show');
        bedTypesDiv.classList.add("show");
      }
    }
    return false;
  }

  unselectRoom(roomObject: Room, bedTypesDiv: any) {
    this.selectedRoomArray = [];
    this.roomCode = "";
    this.selectedRoomUniqueCode = "";
    this.selectedRoomCode = "";
    this.unselectedroom = false;
    this.showClose = false;
    this.bedType = "";
    this.bedTypeName = "";
    bedTypesDiv.classList.remove("show");
    this.lastExpandedRoomDetail = undefined;
    return false;
  }

  setBedType(bedTypeObject: any) {
    this.bedType = bedTypeObject.bedTypeCode;
    this.bedTypeName = bedTypeObject.bedTypeName;
    let selectedRoomBedTypes = [];
    selectedRoomBedTypes = this.selectedRoom.bedTypes;
    if (!!selectedRoomBedTypes && selectedRoomBedTypes.length > 0) {
      selectedRoomBedTypes.forEach((bedType) => {
        if (bedType.bedTypeCode === bedTypeObject.bedTypeCode) {
          this.selectedRoomUniqueCode = _.get(bedType, "roomCode");
        }
      });
    }
  }

  getSelectedBedTypeRoomRatePlan(bedTypeCode: string) {
    let selectedBedTypeRoomRate = {};

    if (!!this.selectedRoom.bedTypes && this.selectedRoom.bedTypes.length > 0) {
      this.selectedRoom.bedTypes.forEach((bedType) => {
        if (bedType.bedTypeCode === bedTypeCode) {
          selectedBedTypeRoomRate = bedType;
          return selectedBedTypeRoomRate;
        }
      });
    }
    return selectedBedTypeRoomRate;
  }

  onMultiRoomSelected(event: Event, bedTypeDiv: any) {
    // start - rate-plans.comp code
    this._storeSvc.removeErrors(ErrorCodesListInComponents.SelectRoom);
    this.isNextRoomValid = false;
    this.nextRoomAdults = 0;
    this.nextRoomChildren = 0;
    this.nextRoomNo = 0;
    let bedTypeName = "";
    this.selectedRoom.bedTypes.forEach((element) => {
      if (element.bedTypeCode === this.bedType) {
        bedTypeName = element.bedTypeName;
      }
    });
    let bedTypeRoomRateplan: any;
    bedTypeRoomRateplan = this.getSelectedBedTypeRoomRatePlan(this.bedType);
    bedTypeRoomRateplan.name = this.promoDetailsObject.name;
    bedTypeRoomRateplan.code = this.promoDetailsObject.code;
    bedTypeRoomRateplan.marketingConsent = this.promoDetailsObject.marketingConsent;
    bedTypeRoomRateplan.guaranteePercentage = this.promoDetailsObject.guaranteePercentage;
    bedTypeRoomRateplan.policyCode = this.promoDetailsObject.policyCode;
    bedTypeRoomRateplan.policyGuaranteeType = this.promoDetailsObject.policyGuaranteeType;
    bedTypeRoomRateplan.prePaymentType = this.promoDetailsObject.prePaymentType;
    bedTypeRoomRateplan.termsAndConditions = this.promoDetailsObject.termsAndConditions;
    bedTypeRoomRateplan.searchTransactionId = this.searchTransactionId;
    bedTypeRoomRateplan.directbill = this.promoDetailsObject.directbill;
    this.selectedRoomData = {
      roomIndex: Number(this.roomBookingOrder[0]),
      RatePlan: bedTypeRoomRateplan,
      Room: this.selectedRoom,
      BedType: this.bedType,
      BedTypeName: bedTypeName,
      CurrencyCode: this.currencyType,
      CurrencyCodeSymbol: this.currCode,
      Packages: [],
    };
    const guestInfo = this._storeSvc.getGuestInfo();
    if (guestInfo !== "" && !this.isManageBookingFlow) {
      this.selectedRoomData.GuestInfo = guestInfo;
    }

    if (this.isManageBookingFlow) {
      const manageBookingdata = this._storeSvc.getBasketState()
        .ManageRoomBooking;
      this.selectedRoomData.GuestInfo = manageBookingdata.GuestInfo;
      this.selectedRoomData.PaymentInfo = manageBookingdata.PaymentInfo;
    }

    if (this.promoDetailsObject.directbill !== undefined) {
      this._storeSvc.updateIsDirectBillRate(this.promoDetailsObject.directbill);
    }

    this._storeSvc.upsertSingleRoom(
      this.selectedRoomData,
      Number(this.roomBookingOrder[0])
    );

    const basket = this._storeSvc.getBasketState() as IBasketState;

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
    // end - rate-plans.comp code

    // start - room listing page code
    const roomNo = this.roomBookingOrder[0];
    this.roomBookingOrder.shift();
    this._storeSvc.upsertMultiRoomBookingOrder(this.roomBookingOrder);
    const basketData = this._storeSvc.getBasketState();
    const roomType = basketData.Rooms[roomNo].RoomDetails.name;
    const bedType = basketData.Rooms[roomNo].BedType;
    // this._roomSvc.overBookingCheck(this.availableRooms, roomType, bedType, 'add');
    const selectedRooms =
      sessionStorage.getItem("savedRooms") !== null
        ? JSON.parse(sessionStorage.getItem("savedRooms"))
        : [];
    selectedRooms[roomNo] = {
      roomType,
      bedType,
      offerCodeVal: this.promoDetailsObject.code,
    };
    sessionStorage.setItem("savedRooms", JSON.stringify(selectedRooms));

    // start - rooms page code
    if (this.roomBookingOrder.length === 0) {
      this.hideAll();
      this.unselectedroom = true;
      // this.showClose = false;
      bedTypeDiv.classList.remove("show");
    } else {
      bedTypeDiv.classList.remove("show");
      this.showClose = false;
      this.unselectedroom = false;
      this.roomCode = "";
    }
    // end - rooms page code

    const userSettingsState = this._storeSvc.getUserSettingsState();
    const propertyInfo = _.get(userSettingsState, "propertyInfo");
    if (this.roomBookingOrder.length > 0) {
      this.promoService.getAvailablePromosDataWithParams(
        this.checkInSummary,
        this.accessCode,
        this.isSpecialRate,
        propertyInfo,
        this.langCode,
        this.roomBookingOrder[0],
        true,
        this.offerCode
      );
    }
    // end - room listing page code
  }

  multiRoomRemoved(roomNo: number) {
    const basketData = this._storeSvc.getBasketState();
    const roomType = basketData.Rooms[roomNo].RoomDetails.name;
    const bedType = basketData.Rooms[roomNo].BedType;
    // this._roomSvc.overBookingCheck(this.availableRooms, roomType, bedType, 'remove');
    this._storeSvc.updateEmptySingleRoom(Number(roomNo));
    this.roomBookingOrder.unshift(roomNo);
    this._storeSvc.upsertMultiRoomBookingOrder(this.roomBookingOrder);
    const selectedRooms = JSON.parse(sessionStorage.getItem("savedRooms"));
    // selectedRooms = selectedRooms.filter((room, index) => !(room.roomType === roomType && room.bedType === bedType &&
    //   roomNo === index));
    // start - rooms page code
    if (this.roomBookingOrder.length === 0) {
      this.hideAll();
      this.unselectedroom = true;
    } else {
      this.showClose = false;
      this.unselectedroom = false;
      this.roomCode = "";
    }
    selectedRooms[roomNo] = { roomType: "", bedType: "" };
    sessionStorage.setItem("savedRooms", JSON.stringify(selectedRooms));
    const userSettingsState = this._storeSvc.getUserSettingsState();
    const propertyInfo = _.get(userSettingsState, "propertyInfo");
    if (this.roomBookingOrder.length > 0) {
      this.promoService.getAvailablePromosDataWithParams(
        this.checkInSummary,
        this.accessCode,
        this.isSpecialRate,
        propertyInfo,
        this.langCode,
        this.roomBookingOrder[0],
        true,
        this.offerCode
      );
    }
  }

  onPromoMultiRoomSelected() {
    const basketData = this._storeSvc.getBasketState();
    const selectedRoomsInBasket = basketData.Rooms;
    // this.selectedRoomData = {
    //   'RatePlan': bedTypeRoomRateplan,
    //   'Room': selectedRoomsInBasket,
    //   'BedType': this.bedType,
    //   'BedTypeName': undefined,
    //   'CurrencyCode': this.currencyType,
    //   'CurrencyCodeSymbol': this.currCode,
    //   'Packages': []
    // };

    this._storeSvc.updateMultipleRoomsWithPricing(selectedRoomsInBasket);

    // if Lion king show dialog
    // Commenting this to be done in RT4 - PHASE 2.
    // if (bedTypeRoomRateplan.addOnInfo !== undefined && bedTypeRoomRateplan.addOnInfo.length > 0) {
    //   const firstRatePlan = bedTypeRoomRateplan.addOnInfo[0];
    //   if (firstRatePlan.addOnType.toLowerCase() === 'Ticketing addons'.toLowerCase() && firstRatePlan.addOnCode !== undefined) {
    //     // show lion king here
    //     this.lionKingComponent.showLionKingDetails(/* this.selectedRoomData, */
    //       firstRatePlan.addOnType, firstRatePlan.addOnCode, undefined);
    //     return false;
    //   }
    // }
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

  onRoomSelected(event: any, room: Room) {
    let bedTypeRoomRateplan: any;
    bedTypeRoomRateplan = this.getSelectedBedTypeRoomRatePlan(this.bedType);
    bedTypeRoomRateplan.name = this.promoDetailsObject.name;
    bedTypeRoomRateplan.code = this.promoDetailsObject.code;
    bedTypeRoomRateplan.marketingConsent = this.promoDetailsObject.marketingConsent;
    bedTypeRoomRateplan.guaranteePercentage = this.promoDetailsObject.guaranteePercentage;
    bedTypeRoomRateplan.policyCode = this.promoDetailsObject.policyCode;
    bedTypeRoomRateplan.policyGuaranteeType = this.promoDetailsObject.policyGuaranteeType;
    bedTypeRoomRateplan.prePaymentType = this.promoDetailsObject.prePaymentType;
    bedTypeRoomRateplan.termsAndConditions = this.promoDetailsObject.termsAndConditions;
    bedTypeRoomRateplan.searchTransactionId = this.searchTransactionId;
    bedTypeRoomRateplan.directbill = this.promoDetailsObject.directbill;
    this.selectedRoomData = {
      roomIndex: 0,
      RatePlan: bedTypeRoomRateplan,
      Room: this.selectedRoom,
      BedType: this.bedType,
      BedTypeName: this.bedTypeName,
      CurrencyCode: this.currencyType,
      CurrencyCodeSymbol: this.currCode,
      Packages: [],
      GuestPreference: undefined,
    };

    const basket = this._storeSvc.getBasketState() as IBasketState;
    if (
      basket.Rooms &&
      basket.Rooms[0] &&
      basket.Rooms[0].GuestInfo &&
      !this.isManageBookingFlow
    ) {
      this.selectedRoomData.GuestInfo = basket.Rooms[0].GuestInfo;
      this.selectedRoomData.GuestPreference = basket.Rooms[0].GuestPreference;
    } else if (
      basket.guestInfo &&
      basket.guestInfo !== "" &&
      !this.isManageBookingFlow
    ) {
      this.selectedRoomData.GuestInfo = basket.guestInfo;
    }
    const promoData = {
      accessCode: this.accessCode,
      validationState: true,
      offerCode: this.offerCode,
      isSpecialRate: this.isSpecialRate,
    };
    CommonUtility.setDatalayer({
      promo_code: this.accessCode,
      offer_code: this.offerCode,
    });
    this._storeSvc.updatePromoData(promoData);
    this._storeSvc.upsertSingleRoom(this.selectedRoomData);

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
    basket.Rooms.forEach((elem) => { 
      elem.RatePlan['payLater'] = this.promoDetailsObject.payLater || false;
      elem.RatePlan['payNow'] = this.promoDetailsObject.payNow || false;
    });
    if (this.promoDetailsObject.directbill !== undefined) {
      this._storeSvc.updateIsDirectBillRate(this.promoDetailsObject.directbill);
    }
    this._storeSvc.updateCurrentStep(STEP_MAP[URL_PATHS.PROMO_PAGE]);
    CommonUtility.highlightStep("guest-info");
    const rooms = this._storeSvc.getBasketState().Rooms;
    const userSettingsState = this._storeSvc.getUserSettingsState();
    const langObj = _.get(userSettingsState, "langObj");
    const params = CommonUtility.getGuestInfoQueryParams(rooms, langObj);
    const navigationExtras = {
      queryParams: params,
    };
    this.router.navigate(["/" + URL_PATHS.GUEST_INFO_PAGE], navigationExtras);
    // this.router.navigate(['/' + URL_PATHS.GUEST_INFO_PAGE], navigationExtras);
  }

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

  public scrollToSelect() {
    const target = document.getElementById("element");
    if(this.propertyType.length > 0 && this.propertyType === 'UD') {
      target.className = "container filter-panel";
    }
    target.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "start",
    });
    if(this.propertyType.length > 0 && this.propertyType === 'UD') {
      setTimeout(() => {
        target.className = "container a";
      }, 650);
    }
  }

  toggleAccordian() {
    $(".accordion-toggle").removeAttr('role');
    $('.accordian-heading').on('click', function() {
      const $acc = $(this).closest('.accordion');
      $acc.find('.grow').slideToggle();
      $(this).toggleClass('open');
      const isexpanded = $(this).hasClass('open');
      $acc.attr("aria-expanded", "'" + isexpanded + "'");
      });

      $('.accordian-heading').on('keyup.enter', function(e) {
        if (e.key === 'Enter') {
          $(this).trigger('click');
        }
      });
  }

  getTranslatedDate(date: Date) {
    return CommonUtility.getTranslatedDateStr(date, this.localeObj);
  }

  toggleSortOrder() {
    this.isSortOrderAsc = !this.isSortOrderAsc;
    this._storeSvc.updateSortOrder(this.isSortOrderAsc);
  }

  updateCurrencySelection(currency: any) {
    this.currencySelection = currency;
    this._storeSvc.updateCurrencyCodeObj(currency);
    this._storeSvc.updateIntialCurrencyCodeObj(this.currencySelection.code);
    const rooms = this._storeSvc.getBasketState().Rooms;
    this._storeSvc.updateMultipleRoomsWithPricing(rooms);
    rooms.forEach((room) => {
      this.promoDetailsObject.availableRooms.forEach((ele) => {
        if (room.code === ele.code) {
          // this.avgPrice = room.averagePriceByCurrency[currency.code];
          this.avgPrice = this.getAvgRoomPrice(room);
        }
      });
    });
    const guestSummary = this._storeSvc.getBasketState().GuestSummary;
    const offerCode = this._storeSvc.getBasketState().offerCode;
    let errorStatusCode;
    if (guestSummary.restrictionFailed) {
      this._storeSvc.setError(4000);
      errorStatusCode = 4000;
    }
    const params = CommonUtility.getQueryParamObjGuestSummary(
      guestSummary,
      this._storeSvc,
      offerCode,
      errorStatusCode
    );
    const navigationExtras = {
      queryParams: params,
    };
    this.router
      .navigate([], navigationExtras)
      .then((d) => CommonUtility.highlightStep("promo"));
  }

  hideAll() {
    this.selectedRoomUniqueCode = "";
    this.selectedRoomCode = "";
    this.roomCode = undefined;
    if (this.bedTypesDiv) {
      this.bedTypesDiv.nativeElement.classList.remove("show");
    }
    this.lastExpandedRoomDetail = undefined;
    this.bedType = "";
    this.unselectedroom = false;
    this.showClose = false;

    // this.selectedRoomUniqueCode = '';
    // this.selectedRoomCode = '';
    // this.roomcode = undefined;
    // if (this.roomDetailDivs !== undefined) {
    //   this.roomDetailDivs.forEach((child) => {
    //     child.hide();
    //   });
    // }
    // this.unselectedroom = false;
  }

  onCheckInSummaryChanged(eventData: any) {
    const guestSummary = CommonUtility.getGuestSummaryFromEventData(eventData);
    this._storeSvc.updateGuestDuration(guestSummary);
    const offerCode = this._storeSvc.getBasketState().offerCode;
    const params = CommonUtility.getQueryParamObjGuestSummary(
      guestSummary,
      this._storeSvc,
      offerCode
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
    if(this.selectedRoomArray.length > 0 && !this.selectedRoomArray[3]) {
      this.unselectRoom(this.selectedRoomArray[0], this.selectedRoomArray[1]);
    }
    const  val = _.cloneDeep(this.filteredRoomList);
    this.roomList= CommonUtility.attributeFilter(val ,newObj,this.localeObj.tf_1_Calendar_rateCalender_selectDropdown);
  }
}
