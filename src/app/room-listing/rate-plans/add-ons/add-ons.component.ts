import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  TemplateRef,
  ViewChild,
  ViewEncapsulation,
} from "@angular/core";
import * as _ from "lodash";
import { CarouselConfig } from "ngx-bootstrap/carousel";
import { BsModalService } from "ngx-bootstrap/modal";
import { BsModalRef } from "ngx-bootstrap/modal/bs-modal-ref.service";
import { Subscription } from "rxjs";
import { Router } from "../../../../../node_modules/@angular/router";
import {
  ADD_ON_END_TIME,
  ADD_ON_START_TIME,
  NON_DECIMAL_CURRENCIES,
  URL_PATHS,
} from "../../../common/common.constants";
import { CommonUtility } from "../../../common/common.utility";
import { RatePlanListingService } from "../../../common/services/ratePlanListing.Service";
import { StoreService } from "../../../common/services/store.service";
import { IBasketState } from "../../../common/store/reducers/basket.reducer";
import { CheckinSummary } from "../../../search/guestduration/checkinsummary.type";

declare var $: any;

@Component({
  selector: "app-add-ons",
  moduleId: "module.id",
  templateUrl: "./add-ons.component.html",
  styleUrls: ["./add-ons.component.scss"],
  providers: [
    {
      provide: CarouselConfig,
      useValue: { interval: 15000, noPause: true, showIndicators: true },
    },
  ],
  encapsulation: ViewEncapsulation.None,
})
export class AddOnsComponent implements OnInit, OnDestroy {
  packageData: any;
  modalRef: BsModalRef;
  showSeatPlan = false;

  seatsSelected: number[]; // = 1;
  selectedCategory: string;
  selectedShowTime: string;
  selectedShowTimeLabel: string;
  maxRoomTotalOccupancy: number[];

  acknowledgeVal = false;
  selectedRoomData: any;
  selectedAddonType: string;
  selectedAddonCode: string;
  selectedRatePlanName: string;
  optionsData = new Array<any>();
  selectedCategoryData: any;
  selectedPackageDetail: any;
  selectedPackagePrice: number;

  noOfOccupants: number[]; // GuestInfo.adults + GuestInfo.Children
  noOfMaxAvailable: number;
  basketData: IBasketState;
  seatsRequiredArray: Map<number, number[]>;
  seatsUnavailableError = false;
  isMultiRoom = false;
  totatSeatselected = 0;
  localeObj: any;
  totalAdults = 0;
  totalChild = 0;
  roomVerbiage: string;
  nightVerbiage: string;
  objCheckin: CheckinSummary;
  packagePrice: any;
  private _userSettingsSubscriptions: Subscription;
  private ratesListSubscription: Subscription;

  currencyCode: string;
  @ViewChild("lightboxmodel", { static: true }) roomDetailsPopup: TemplateRef<
    any
  >;

  _subscription: Subscription;
  guestSummary: CheckinSummary;
  Rooms: any;
  defCurrCode: string;
  currCode: string;
  childVerbiage: string;
  adultVerbiage: string;
  @Input() packageId: string;
  @Input() packageName: string;
  @Input() packageDescr: string;
  @Output() lionKingPackageSelected = new EventEmitter();

  constructor(
    private modalService: BsModalService,
    private _storeSvc: StoreService,
    private _ratePlanSvc: RatePlanListingService,
    private _router: Router
  ) {}

  ngOnDestroy(): void {
    const subscriptionsList = [
      this._subscription,
      this._userSettingsSubscriptions,
      this.ratesListSubscription,
    ];
    CommonUtility.removeSubscriptions(subscriptionsList);
    if (this.modalRef !== undefined) {
      this.modalRef.hide();
    }
  }

  ngOnInit() {
    this._userSettingsSubscriptions = this._storeSvc
      .getUserSettings()
      .subscribe((sharedData) => {
        this.localeObj = sharedData.localeObj;
      });
    this.defCurrCode =
      _.get(
        this._storeSvc.getUserSettingsState(),
        "propertyInfo.defaultCurrency"
      ) || "SGD";
    const basket = this._storeSvc.getBasketState() as IBasketState;
    this.objCheckin = basket.GuestSummary;
    for (let index = 0; index < this.objCheckin.guests.length; index++) {
      this.totalAdults += Number(this.objCheckin.guests[index].adults);
      this.totalChild += Number(this.objCheckin.guests[index].children);
    }
    if (this.totalChild === 0) {
      this.childVerbiage = "";
    } else if (this.totalChild === 1) {
      this.childVerbiage =
        (_.get(this.localeObj, "tf_3_MultiRoom_packageListing_comma") || ",") +
        " " +
        this.totalChild +
        " " +
        this.localeObj.tf_2_RoomList_ratePlans_child;
    } else {
      this.childVerbiage =
        (_.get(this.localeObj, "tf_3_MultiRoom_packageListing_comma") || ",") +
        " " +
        this.totalChild +
        " " +
        this.localeObj.tf_1_Calendar_rateCalender_children;
    }
  }

  openRoomDetailsModal(template: TemplateRef<any>) {
    this.modalRef = this.modalService.show(
      template,
      Object.assign({}, { class: "modal-lg" })
    );
    return false;
  }

  showLionKingDetails(
    /* data: any,  */ addOnType: string,
    addOnCode: string,
    packageDetail: any
  ) {
    this.selectedAddonCode = addOnCode;
    this.selectedAddonType = addOnType;
    this.selectedPackageDetail = packageDetail;
    this.seatsRequiredArray = new Map<number, number[]>();
    this.guestSummary = this._storeSvc.getGuestSummary();
    this.nightVerbiage = this.localeObj.tf_4_Checkout_addons_nights;
    this.roomVerbiage = this.localeObj.tf_4_Checkout_addons_roomLc;
    this.adultVerbiage = this.localeObj.tf_1_Calendar_rateCalender_adult;
    this.totatSeatselected = 0;
    if (Number(this.guestSummary.los) === 1) {
      this.nightVerbiage = this.localeObj.tf_2_RoomList_bookingSummery_night;
    }
    if (Number(this.guestSummary.rooms) > 1) {
      this.roomVerbiage = this.localeObj.tf_4_Checkout_addons_roomsText;
    }
    if (Number(this.totalAdults) > 1) {
      this.adultVerbiage = this.localeObj.tf_4_Checkout_checkoutSummery_adults;
    }
    this.acknowledgeVal = false;

    this._subscription = this._storeSvc.getBasket().subscribe((basket) => {
      this.basketData = basket as IBasketState;
      this.noOfOccupants = [];
      if (this.basketData.GuestSummary !== undefined) {
        if (this.basketData.GuestSummary.guests.length > 1) {
          for (
            let index = 0;
            index < this.basketData.GuestSummary.guests.length;
            index++
          ) {
            const guest = this.basketData.GuestSummary.guests[index];
            // this.noOfOccupants[index] = 1;
            this.noOfOccupants[index] =
              Number(guest.adults) + Number(guest.children);
            this.totatSeatselected =
              this.totatSeatselected + this.noOfOccupants[index];
          }
        } else {
          // this.noOfOccupants[0] = 1;
          this.noOfOccupants[0] =
            Number(this.basketData.GuestSummary.guests[0].adults) +
            Number(this.basketData.GuestSummary.guests[0].children);
          this.totatSeatselected = this.noOfOccupants[0];
        }
      }
    });
    const basketState = this._storeSvc.getBasketState() as IBasketState;
    this.selectedRoomData = basketState.Rooms[0]; // TODO: remove dependency from selectedRoomData in html
    this.selectedRatePlanName = _.get(this.selectedRoomData, "RatePlan.name");
    this.currencyCode = basketState.CurrencyCode;
    this.currCode = CommonUtility.getCurrSymbolForType(
      this._storeSvc.getUserSettingsState().propertyInfo,
      this.currencyCode
    );
    this.seatsSelected = this.noOfOccupants;
    this.maxRoomTotalOccupancy = Object.create(this.seatsSelected);
    this.Rooms = basketState.Rooms;
    this.selectedPackagePrice = 0;
    if (this.Rooms !== undefined) {
      if (this.Rooms.length > 1) {
        this.isMultiRoom = true;
        for (let index = 0; index < this.basketData.Rooms.length; index++) {
          const tempSharedData = this.basketData.Rooms[index];
          this.maxRoomTotalOccupancy[index] = Number(
            tempSharedData.RoomDetails.maxTotalOccupancy
          );
          this.selectedPackagePrice += +(
            _.get(tempSharedData, [
              "RatePlan",
              "discountedAveragePriceByCurrency",
              this.currencyCode,
            ]) ||
            _.get(tempSharedData, [
              "RatePlan",
              "averagePriceByCurrency",
              this.currencyCode,
            ])
          );
        }
        //   this.selectedPackagePrice = this.selectedPackagePrice/ this.Rooms.length;
      } else {
        this.isMultiRoom = false;
        const tempSharedData = this.Rooms[0];
        this.maxRoomTotalOccupancy[0] = Number(
          tempSharedData.RoomDetails.maxTotalOccupancy
        );
        this.selectedPackagePrice = +(
          _.get(tempSharedData, [
            "RatePlan",
            "discountedAveragePriceByCurrency",
            this.currencyCode,
          ]) ||
          _.get(tempSharedData, [
            "RatePlan",
            "averagePriceByCurrency",
            this.currencyCode,
          ])
        );
      }
    }

    for (let rno = 0; rno < this.noOfOccupants.length; rno++) {
      const roomOccupants = this.noOfOccupants[rno];
      // tslint:disable-next-line:prefer-const
      let tempArr = new Array<number>(); // TODO check population on maxRoomTotalOccupancy
      for (
        let index = 1;
        index <= this.maxRoomTotalOccupancy[rno] + 2;
        index++
      ) {
        tempArr.push(index);
        // this.seatsRequiredArray.push(index);
      }
      this.seatsRequiredArray.set(rno, tempArr);
    }
    this.openRoomDetailsModal(this.roomDetailsPopup);
    this.checkAvailableAddons();
  }

  showSeatingPlan() {
    this.showSeatPlan = !this.showSeatPlan;
    if (this.showSeatPlan) {
      setTimeout(() => {
        $(".carousel").swipe({
          swipe(event, direction, distance, duration, fingerCount, fingerData) {
            // console.log('direction :: ' + direction);
            if (direction === "left") {
              $(this)[0].getElementsByClassName("left")[0].click();
            }
            if (direction === "right") {
              $(this)[0].getElementsByClassName("right")[0].click();
            }
          },
          allowPageScroll: "vertical",
        });
      }, 2000);
    }
    return false;
  }

  selectLionKingPackage() {
    if (this.noOfMaxAvailable >= this.totatSeatselected) {
      // tslint:disable-next-line:prefer-const
      let selectionObj: any;
      if (this.isMultiRoom) {
        selectionObj = [];
        // selectionObj = new Map<String, any>();
        for (let index = 0; index < this.Rooms.length; index++) {
          const roomData = this.Rooms[index];
          const obj = {
            Name: this.packageData.addOnName,
            NoOfSeats: this.seatsSelected[index],
            /*  'roomCodeVsSeatNumMap': roomCodeVsSeatMap,*/
            ShowTime: this.selectedCategoryData.addOnDateTime,
            Category: this.selectedCategory,
            Price: this.selectedCategoryData.price,
            DefPrice: this.selectedCategoryData.defPrice,
            TotalPrice:
              this.applyPriceFormat(
                this.selectedCategoryData.price,
                this.currencyCode
              ) * parseInt(this.seatsSelected[index].toString(), 0),
            DefTotalPrice:
              this.applyPriceFormat(
                this.selectedCategoryData.defPrice,
                this.defCurrCode
              ) * parseInt(this.seatsSelected[index].toString(), 0),
            AddonType: this.selectedAddonType,
            AddonCode: this.selectedAddonCode,
            AddonId: this.packageData.addOnId,
            AddOnConsent: this.acknowledgeVal,
            AddonPriceByCurrencyObj: this.selectedCategoryData
              .priceByCurrencyObj,
          };
          // selectionObj.set(roomData.UniqueCode, obj);
          selectionObj.push(obj);
        }
      } else {
        // TODO: check TotalPrice in single selection if reqired currencyCode
        selectionObj = {
          Name: this.packageData.addOnName,
          NoOfSeats: this.seatsSelected[0],
          /*  'roomCodeVsSeatNumMap': roomCodeVsSeatMap,*/
          ShowTime: this.selectedCategoryData.addOnDateTime,
          Category: this.selectedCategory,
          Price: this.selectedCategoryData.price,
          DefPrice: this.selectedCategoryData.defPrice,
          TotalPrice:
            this.applyPriceFormat(
              this.selectedCategoryData.price,
              this.currencyCode
            ) * parseInt(this.totatSeatselected.toString(), 0),
          DefTotalPrice:
            this.applyPriceFormat(
              this.selectedCategoryData.defPrice,
              this.defCurrCode
            ) * parseInt(this.totatSeatselected.toString(), 0),
          AddonType: this.selectedAddonType,
          AddonCode: this.selectedAddonCode,
          AddonId: this.packageData.addOnId,
          AddOnConsent: this.acknowledgeVal,
          AddonPriceByCurrencyObj: this.selectedCategoryData.priceByCurrencyObj,
        };
        //  selectionObj.push(obj);
      }
      this.modalRef.hide();
      this.lionKingPackageSelected.emit(selectionObj);
      this.seatsUnavailableError = false;
      return false;
    } else {
      this.seatsUnavailableError = true;
    }
  }

  showCategorySelected(val: string) {
    this.selectedCategoryData.categorySelected = val;
    const itemIndex = this.optionsData.find(
      (e) => e.addOnDateTime === this.selectedCategoryData.addOnDateTime
    );
    const selectedcateItem = itemIndex.categories.find(
      (e) => e.category === val
    );
    this.selectedCategoryData.price = selectedcateItem.price[this.currencyCode];
    this.selectedCategoryData.defPrice =
      selectedcateItem.price[this.defCurrCode];
    this.selectedCategoryData.availableCount = selectedcateItem.availableCount;
    this.selectedCategory = val;
    this.noOfMaxAvailable = this.selectedCategoryData.availableCount;
    this.selectedCategoryData.priceByCurrencyObj = selectedcateItem.price;
    this.getPackagePrice();
  }

  showTimeSelected(val: any) {
    const itemIndex = this.optionsData.find(
      (e) => e.addOnDateTime === val.addOnDateTime
    );
    this.selectedShowTime = val.addOnDateTime;
    this.selectedShowTimeLabel = this.getFromattedTimeSlot(
      this.selectedShowTime
    );
    if (itemIndex !== undefined) {
      this.selectedCategoryData = itemIndex;
      this.selectedCategory = this.selectedCategoryData.categories[0].category;
      this.noOfMaxAvailable = this.selectedCategoryData.categories[0].availableCount;
      this.selectedCategoryData.price = this.selectedCategoryData.categories[0].price[
        this.currencyCode
      ];
      this.selectedCategoryData.defPrice = this.selectedCategoryData.categories[0].price[
        this.defCurrCode
      ];
      this.selectedCategoryData.availableCount = this.noOfMaxAvailable;
      this.selectedCategoryData.priceByCurrencyObj = this.selectedCategoryData.categories[0].price;
      this.getPackagePrice();
    }
  }

  showSeatsSelected(val: number, rno: number) {
    this.seatsSelected[rno] = val;
    this.totatSeatselected = 0;
    for (let index = 0; index < this.seatsSelected.length; index++) {
      this.totatSeatselected =
        Number(this.totatSeatselected) + Number(this.seatsSelected[index]);
    }
    // console.log(this.totatSeatselected);
    this.populateOptionsDataBasedOnSeats(this.totatSeatselected);
    const lowestItem = this.optionsData[0];
    this.selectedCategoryData = {
      addOnDateTime: lowestItem.addOnDateTime,
      categoryType: lowestItem.categoryType,
      price: lowestItem.categories[0].price[this.currencyCode],
      defPrice: lowestItem.categories[0].price[this.defCurrCode],
      availableCount: lowestItem.categories[0].availableCount,
      categorySelected: lowestItem.categories[0].category,
      priceByCurrencyObj: lowestItem.categories[0].price,
    };
    this.selectedShowTime = this.selectedCategoryData.addOnDateTime;
    this.selectedShowTimeLabel = this.getFromattedTimeSlot(
      this.selectedShowTime
    );
    this.selectedCategory = this.selectedCategoryData.categorySelected;
    this.getPackagePrice();
  }

  applyPackageSettings() {
    if (this.selectedPackageDetail !== undefined) {
      //  this.seatsSelected[0] = this.selectedPackageDetail.NoOfSeats;
      this.totatSeatselected = 0;
      for (let index = 0; index < this.basketData.Rooms.length; index++) {
        const roomObj = this.basketData.Rooms[index];
        this.seatsSelected[index] = Number(roomObj.Packages[0].NoOfSeats);
        this.totatSeatselected =
          +this.totatSeatselected + +this.seatsSelected[index];
      }
      // TODO: check behavior here, update no of seats in selectedPackageDetails as array
      this.selectedShowTime = this.selectedPackageDetail.ShowTime;
      this.selectedShowTimeLabel = this.getFromattedTimeSlot(
        this.selectedShowTime
      );
      this.showTimeSelected({ addOnDateTime: this.selectedShowTime });
      this.selectedCategory = this.selectedPackageDetail.Category;
      this.selectedCategoryData.price = this.selectedPackageDetail.Price;
      this.selectedCategoryData.defPrice = this.selectedPackageDetail.DefPrice;
      this.selectedCategoryData.priceByCurrencyObj = this.selectedPackageDetail.AddonPriceByCurrencyObj;
      this.getPackagePrice();
    }
  }

  checkAvailableAddons() {
    let totalcount = 0;
    this.noOfOccupants.forEach((roomOccupant) => {
      totalcount = totalcount + roomOccupant;
    });
    const userSettings = this._storeSvc.getUserSettingsState();
    const obj = {
      addOnCode: this.selectedAddonCode,
      rateCode: this.selectedRoomData.RatePlan.code,
      startDate: [
        CommonUtility.formateDate(this.guestSummary.checkindate),
        ADD_ON_START_TIME,
      ].join(" "),
      endDate: [
        CommonUtility.formateDate(this.guestSummary.checkoutdate),
        ADD_ON_END_TIME,
      ].join(" "),
      count: totalcount, // Number(this.basketData.GuestSummary.guests[0].adults) + Number(this.basketData.GuestSummary.guests[0].children)
    };

    this.ratesListSubscription = this._ratePlanSvc
      .getAvailableAddons(obj)
      .subscribe((data) => {
        if (_.get(data, "status.statusCode") !== 1000) {
          this.modalRef.hide();
          this._storeSvc.setError(data.status.statusCode);
          const checkInSummary = this._storeSvc.getBasketState()[
            "GuestSummary"
          ] as CheckinSummary;
          const offerCode = this._storeSvc.getBasketState().offerCode;
          const params = CommonUtility.getQueryParamObjGuestSummary(
            checkInSummary,
            this._storeSvc,
            offerCode,
            _.get(data, "status.statusCode")
          );
          const navigationExtras = {
            queryParams: params,
          };
          this._router.navigate(["/", URL_PATHS.ROOMS_PAGE], navigationExtras);
        } else {
          this.packageData = data.data;
          let navigateToRooms = false;
          if (
            this.packageData.allOptions.length === 0 &&
            this.packageData.lowest === null
          ) {
            navigateToRooms = true;
          } else if (this.selectedPackageDetail !== undefined) {
            let previousShowTimeFound = false;
            this.packageData.allOptions.forEach((element) => {
              if (
                element.addOnDateTime === this.selectedPackageDetail.ShowTime
              ) {
                previousShowTimeFound = true;
              }
            });
            if (!previousShowTimeFound) {
              navigateToRooms = true;
            }
          }
          if (navigateToRooms) {
            this.modalRef.hide();
            this._storeSvc.setError(3001);
            const checkInSummary = this._storeSvc.getBasketState()[
              "GuestSummary"
            ] as CheckinSummary;
            const offerCode = this._storeSvc.getBasketState().offerCode;
            const params = CommonUtility.getQueryParamObjGuestSummary(
              checkInSummary,
              this._storeSvc,
              offerCode,
              3001
            );
            const navigationExtras = {
              queryParams: params,
            };
            this._router.navigate(
              ["/", URL_PATHS.ROOMS_PAGE],
              navigationExtras
            );
          }
          this.populateOptionsDataBasedOnSeats(totalcount);
          this.applyDefaultSettings();
        }
      });
  }

  populateOptionsDataBasedOnSeats(minSeatCount: number) {
    if (this.packageData.allOptions !== undefined) {
      this.packageData.allOptions = _.sortBy(this.packageData.allOptions, [
        "addOnDateTime",
      ]);
      this.optionsData = new Array<any>();
      for (let index = 0; index < this.packageData.allOptions.length; index++) {
        const element = this.packageData.allOptions[index];
        const itemIndex = this.optionsData.find(
          (e) => e.addOnDateTime === element.addOnDateTime
        );
        const cateObj = {
          category: element.category,
          price: element.price,
          availableCount: element.availableCount,
        };
        if (cateObj.availableCount < minSeatCount) {
          continue;
        }
        if (itemIndex !== undefined) {
          const catItem = itemIndex.categoryType.find(
            (e) => e === element.category
          );
          itemIndex.categories.push(cateObj);
          if (catItem === undefined) {
            itemIndex.categoryType.push(element.category);
          }
        } else {
          const cateArray = new Array<any>();
          cateArray.push(cateObj);
          const addOnDateTimeLabel = this.getFromattedTimeSlot(
            element.addOnDateTime
          );
          this.optionsData.push({
            addOnDateTime: element.addOnDateTime,
            categories: cateArray,
            categoryType: [element.category],
            addOnDateTimeLabel,
          });
        }
      }
    }
  }

  applyDefaultSettings() {
    const lowestItem = this.optionsData.find(
      (e) => e.addOnDateTime === this.packageData.lowest.addOnDateTime
    );
    this.selectedCategoryData = {
      addOnDateTime: this.packageData.lowest.addOnDateTime,
      categoryType: lowestItem.categoryType,
      price: this.packageData.lowest.price[this.currencyCode],
      defPrice: this.packageData.lowest.price[this.defCurrCode],
      availableCount: this.packageData.lowest.availableCount,
      categorySelected: this.packageData.lowest.category,
      priceByCurrencyObj: this.packageData.lowest.price,
    };
    this.selectedShowTime = this.packageData.lowest.addOnDateTime;
    this.selectedShowTimeLabel = this.getFromattedTimeSlot(
      this.selectedShowTime
    );
    this.selectedCategory = this.packageData.lowest.category;
    this.noOfMaxAvailable = this.packageData.lowest.availableCount;
    this.getPackagePrice();
    this.applyPackageSettings();
  }

  getValues(map) {
    return Array.from(map.values());
  }

  getFromattedTimeSlot(timeSlot: string) {
    return timeSlot.split(" ").join(" | ");
  }

  // method to round the values based on decimals
  applyPriceFormat(price, currencyCode) {
    const formattedPrice = CommonUtility.roundedValue(price, 2);
    return this._storeSvc.applyPriceFormatPipe(
      formattedPrice,
      currencyCode,
      true
    );
  }

  // method to set Package price
  getPackagePrice() {
    let addonPrice = 0;
    if (this.basketData.GuestSummary.guests.length > 0) {
      for (
        let index = 0;
        index < this.basketData.GuestSummary.guests.length;
        index++
      ) {
        const guest = this.basketData.GuestSummary.guests[index];
        let totalSeatsSelected = Number(guest.adults) + Number(guest.children);
        if (this.seatsSelected && this.seatsSelected[index]) {
          totalSeatsSelected = Number(this.seatsSelected[index]);
        }
        const lowestUnitAddonPrice = Number(
          CommonUtility.formattedPrice(
            this.selectedCategoryData.price,
            this.currencyCode,
            this._storeSvc
          )
        );
        const unitAddonPrice =
          lowestUnitAddonPrice * (totalSeatsSelected / this.guestSummary.los);
        const formattedUnitPrice = Number(
          CommonUtility.formattedPrice(
            unitAddonPrice,
            this.currencyCode,
            this._storeSvc
          )
        );
        addonPrice = addonPrice + formattedUnitPrice;
        addonPrice = Number(
          CommonUtility.formattedPrice(
            addonPrice,
            this.currencyCode,
            this._storeSvc
          )
        );
      }
    }
    if (this.basketData.GuestSummary.guests.length === 1) {
      this.selectedPackagePrice = Number(
        CommonUtility.formattedPrice(
          this.selectedPackagePrice,
          this.currencyCode,
          this._storeSvc
        )
      );
    }
    this.packagePrice = this.selectedPackagePrice + addonPrice;
  }
}
