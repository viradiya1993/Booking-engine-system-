import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  TemplateRef,
  ViewChild,
} from "@angular/core";
import { Router } from "@angular/router";
import * as _ from "lodash";
import { BsModalService } from "ngx-bootstrap/modal";
import { BsModalRef } from "ngx-bootstrap/modal/bs-modal-ref.service";
import { NgxSpinnerService } from "ngx-spinner";
import { Subscription } from "rxjs";
import { IBasketState } from "src/app/common/store/reducers/basket.reducer";
import {
  ErrorCodesListInComponents,
  QUERY_PARAM_ATTRIBUTES,
  TRADITIONAL_FLOW,
  URL_PATHS,
} from "../../common/common.constants";
import { CommonUtility } from "../../common/common.utility";
import { FeatureFlags } from "../../common/feature.flags";
import { AvailableRoomRatePlans } from "../../common/models/packagedetails";
import { RatePlanListingService } from "../../common/services/ratePlanListing.Service";
import { StoreService } from "../../common/services/store.service";
import { Room } from "../../room";
import { CheckinSummary } from "../../search/guestduration/checkinsummary.type";
import { AddOnsComponent } from "./add-ons/add-ons.component";

@Component({
  selector: "app-rate-plans",
  templateUrl: "./rate-plans.component.html",
  styleUrls: ["./rate-plans.component.scss"],
})
export class RatePlansComponent implements OnInit, OnDestroy {
  currFilterValue: string;
  currCode: string;
  kingSizeBedAvailable: boolean;
  twinSizeBedAvailable: boolean;
  kingSizeBedSelected: boolean;
  twinSizeBedSelected: boolean;
  guestSummary: CheckinSummary;
  bedTypeImg: string;
  bedtype: string;
  roomCode: string;
  bedTypeCode:string;
  bedTypeName:string;
  selectedRoomData: any;
  guests: number;
  isMultiRooms: boolean;
  isDpr1: boolean;
  isDpr2: boolean;
  isDpr3: boolean;
  isNextRoomValid: boolean;
  nextRoomNo: number;
  nextRoomAdults: number;
  nextRoomChildren: number;
  localeObj: any;
  isManageBookingFlow: boolean;
  isRoomSubTypeEnabled: boolean;
  private _userSettingsSubscriptions: Subscription;
  @ViewChild("lionKingComponent", { static: true })
  lionKingComponent: AddOnsComponent;
  @Output() multiRoomBooked = new EventEmitter();
  @Output() bedTypeChanged = new EventEmitter();

  private _subscription: Subscription;
  modalRef: BsModalRef;
  @ViewChild("roomDetails", { static: true }) roomDetailsDiv: ElementRef<
    HTMLElement
  >;
  @Input() selectedRoom: Room;
  @Input("roomBookingOrder") roomBookingOrder: any[];
  @Input("rateCode") rateCode: string;
  availableRoomRatePlans: AvailableRoomRatePlans = {
    status: "",
    data: [],
    id: "",
  };
  RTL_Flag: boolean;
  @Input("showAverageNightlyRate") showAverageNightlyRate: string;
  public filteredRatePlan: any = [];

  constructor(
    private router: Router,
    private modalService: BsModalService,
    private ratePlanListingService: RatePlanListingService,
    private _storeSvc: StoreService,
    private ngxSpinner: NgxSpinnerService,
  ) {}

  ngOnDestroy() {
    if (window["unloadRoomRateplanFunc"]) {
      window["unloadRoomRateplanFunc"]();
    }
    const subscriptionsList = [
      this._subscription,
      this._userSettingsSubscriptions,
    ];
    CommonUtility.removeSubscriptions(subscriptionsList);
  }

  ngOnInit() {
    this._userSettingsSubscriptions = this._storeSvc
      .getUserSettings()
      .subscribe((sharedData) => {
        this.localeObj = sharedData.localeObj;
        this.isRoomSubTypeEnabled =
          sharedData.propertyInfo.isRoomSubTypeEnabled;
        this.isManageBookingFlow = this._storeSvc.getManageBookingFlowStatus();
        this.RTL_Flag = CommonUtility.langAlignCheck(
          this._storeSvc.getUserSettingsState().langObj.code,
          FeatureFlags
        );
      });
    this._subscription = this._storeSvc.getBasket().subscribe((basket) => {
      this.currFilterValue = basket.CurrencyCode;
      this.currCode = CommonUtility.getCurrSymbolForType(
        this._storeSvc.getUserSettingsState().propertyInfo,
        this.currFilterValue
      );
      this.guestSummary = basket.GuestSummary;
      this.guests =
        Number(this.guestSummary.guests[0].adults) +
        Number(this.guestSummary.guests[0].children);
      if (basket.GuestSummary.rooms > 1) {
        this.isMultiRooms = true;
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
      }
    });

    if (!this.isMultiRooms) {
      // roomRateplanFunc() - Room-Rateplan scripts from admin
      if (window["roomRateplanFunc"]) {
        window["roomRateplanFunc"]();
      }
    }
    // DPR based on feature flag
    if (FeatureFlags.isFeatureEnabled("dpr1")) {
      this.isDpr1 = true;
    } else if (FeatureFlags.isFeatureEnabled("dpr2")) {
      this.isDpr2 = true;
    } else if (FeatureFlags.isFeatureEnabled("dpr3")) {
      this.isDpr3 = true;
    }
  }

  openModal(template: TemplateRef<any>) {
    this.modalRef = this.modalService.show(template, { class: "modal-lg" });
    return false;
  }

  onMultiRoomSelected(event: Event) {
    this._storeSvc.removeErrors(ErrorCodesListInComponents.SelectRoom);
    this.isNextRoomValid = false;
    this.nextRoomAdults = 0;
    this.nextRoomChildren = 0;
    this.nextRoomNo = 0;
    let bedTypeName = "";
    this.selectedRoom.bedTypes.forEach((element) => {
      if (element.bedTypeCode === this.bedtype) {
        bedTypeName = element.bedTypeName;
      }
    });
    this.selectedRoomData = {
      roomIndex: Number(this.roomBookingOrder[0]),
      RatePlan: undefined,
      Room: this.selectedRoom,
      BedType: this.bedtype,
      BedTypeName: bedTypeName,
      CurrencyCode: this.currFilterValue,
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
    this.multiRoomBooked.emit();
  }

  getBedTypeImg(bedTypeCode: string) {
    this.selectedRoom.bedTypes.forEach((element) => {
      if (element["bedTypeCode"] === bedTypeCode) {
        this.bedTypeImg = element["bedTypeImageURL"];
      }
    });
  }

  emitBedTypeChangedEvent(selectedRoom: any) {
    const eventData = {};
    eventData["bedTypeCode"] = this.bedtype;
    eventData["selectedRoom"] = selectedRoom;
    setTimeout(() => {
      this.ngxSpinner.hide();
    }, 1000);
    this.bedTypeChanged.emit(eventData);
  }

  show(selectedRoom: any, ratePlanCode?: string, uniqueRoomCode?: string) {
    this.selectedRoom = selectedRoom;
    this.roomCode = this.selectedRoom.code;
    this.bedtype = selectedRoom.defaultBedType;
    this.emitBedTypeChangedEvent(this.selectedRoom);
    const basketState = this._storeSvc.getBasketState();
    this.currFilterValue = basketState.CurrencyCode;
    const roomCodes = new Array();
    roomCodes.push(this.selectedRoom.code);
    this.currCode = CommonUtility.getCurrSymbolForType(
      this._storeSvc.getUserSettingsState().propertyInfo,
      this.currFilterValue
    );
    if(!!this._storeSvc.getBasketState().roomAttributes){
      const val = this._storeSvc.getBasketState().roomAttributes.filter(offers => offers.selectFilterName === "Offer");
      if(val.length > 0) {
       this.filteredRatePlan = val[0].selectedFilterValues === this.localeObj.tf_1_Calendar_rateCalender_selectDropdown  ?  [] :  val[0].selectedFilterValues;
      }
    }
    if (!this.isMultiRooms) {
      let ratePlanCodeParam;
      if (this.rateCode && this.rateCode.length > 0) {
        ratePlanCodeParam = this.rateCode;
      }
      const tmpSubscription = this.ratePlanListingService
        .getRatePlanList(roomCodes, this.guestSummary, ratePlanCodeParam)
        .subscribe((data) => {
          if (tmpSubscription !== undefined) {
            if (!this.isRoomSubTypeEnabled) {
              if (data.data) {
                data.data = data.data.filter(
                  (ratePlan) => ratePlan.bedTypeCode === this.bedtype
                );
              }
            }
            tmpSubscription.unsubscribe();
          }
          this._storeSvc.setError(data.status.statusCode);
          if (_.get(data, "status.statusCode") === 1000) {
            this._storeSvc.removeError(6001);
            this._storeSvc.removeError(8000);
            this._storeSvc.removeError(9000);
          }
          this.availableRoomRatePlans = data as AvailableRoomRatePlans;
          if (
            this.availableRoomRatePlans.data &&
            this.availableRoomRatePlans.data.length > 0
          ) {
            let irpFound = false;
            this.availableRoomRatePlans.data.forEach((ratePlan, index) => {
              // TODO : we need to remove this as this is done only to support dev
              this.selectedRoom.bedTypes.forEach((element) => {
                if (element["bedTypeCode"] === ratePlan.bedTypeCode) {
                  ratePlan.bedTypeImageUrl = element["bedTypeImageURL"];
                }
              });
              if (ratePlanCode && uniqueRoomCode) {
                ratePlan.availableRatePlans.forEach((irp) => {
                  if (
                    irp.code === ratePlanCode &&
                    ratePlan.roomCode === uniqueRoomCode
                  ) {
                    irpFound = true;
                    this.bedtype =
                      _.get(ratePlan, "bedTypeCode") ||
                      selectedRoom.defaultBedType;
                    this.emitBedTypeChangedEvent(this.selectedRoom);
                  }
                });
              } else if (!ratePlanCode && uniqueRoomCode) {
                if (ratePlan.roomCode === uniqueRoomCode) {
                  this.bedtype = _.get(ratePlan, "bedTypeCode");
                  this.emitBedTypeChangedEvent(this.selectedRoom);
                }
              }
              ratePlan.availableRatePlans.forEach((irp) => {
                irp.cancellationPolicy = irp.cancellationPolicy
                  ? irp.cancellationPolicy.replace("SGD", this.currCode)
                  : "";
                irp.searchTransactionId = ratePlan["searchTransactionId"];
                irp["marketingConsent"] = ratePlan["marketingConsent"];
                this.roundedvalues(irp);
              });
            });
            if (!irpFound && ratePlanCode && uniqueRoomCode) {
              // this._storeSvc.setError(3001);
            }
            if (this.roomDetailsDiv !== null) {
              this.roomDetailsDiv.nativeElement.classList.add("show");
            }
          }
        });
    } else {
      this.availableRoomRatePlans = { status: "", data: [], id: "" };
      this.availableRoomRatePlans["data"] = [];
      this.selectedRoom.bedTypes.forEach((element) => {
        if (element.roomCode === uniqueRoomCode) {
          this.bedtype = element.bedTypeCode;
          this.emitBedTypeChangedEvent(this.selectedRoom);
        }
        if (
          !this.isRoomSubTypeEnabled &&
          this.bedtype === element.bedTypeCode
        ) {
          this.availableRoomRatePlans.data.push({
            bedTypeCode: element.bedTypeCode,
            bedTypeName: element.bedTypeName,
            bedTypeImageUrl: element.bedTypeImageURL,
            roomCode: element.roomCode,
            roomName: this.selectedRoom.name,
            availableRatePlans: [],
            roomSeqNo: 1,
          });
        } else if (this.isRoomSubTypeEnabled) {
          this.availableRoomRatePlans.data.push({
            bedTypeCode: element.bedTypeCode,
            bedTypeName: element.bedTypeName,
            bedTypeImageUrl: element.bedTypeImageURL,
            roomCode: element.roomCode,
            roomName: this.selectedRoom.name,
            availableRatePlans: [],
            roomSeqNo: 1,
          });
        }
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
      if (this.roomDetailsDiv !== null) {
        this.roomDetailsDiv.nativeElement.classList.add("show");
      }
    }
  }

  hide() {
    if (this.roomDetailsDiv !== null) {
      this.roomDetailsDiv.nativeElement.classList.remove("show");
    }
    this.availableRoomRatePlans = undefined;
    // this.selectedRoomData = undefined;
    // if (this._subscription !== undefined) {
    //   this._subscription.unsubscribe();
    // }
    // if (this._subscription !== undefined) {
    //   this._subscription.unsubscribe();
    // }
  }

  onRoomSelected(event: any, ratePlan: any, ee: any) {
    for(let i=0;i < this.selectedRoom.bedTypes.length; i++){
      if(this.bedtype ===this.selectedRoom.bedTypes[i].bedTypeCode){
        this.bedTypeName = this.selectedRoom.bedTypes[i].bedTypeName;
        this.bedTypeCode = this.selectedRoom.bedTypes[i].bedTypeCode;
      }      
    }
    this.selectedRoomData = {
      roomIndex: 0,
      RatePlan: ratePlan,
      Room: this.selectedRoom,
      BedType: this.bedtype,
      BedTypeName: this.bedTypeName,
      BedTypeCode: this.bedTypeCode,
      CurrencyCode: this.currFilterValue,
      CurrencyCodeSymbol: this.currCode,
      Packages: [],
      GuestPreference: undefined,
    };
    this._storeSvc.setAvailableRatePlans(this.availableRoomRatePlans.data[0]);
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
    if (this.isManageBookingFlow) {
      const manageBookingdata = this._storeSvc.getBasketState()
        .ManageRoomBooking;
      this.selectedRoomData.GuestInfo = manageBookingdata.GuestInfo;
      this.selectedRoomData.PaymentInfo = manageBookingdata.PaymentInfo;
    }
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

  getAvgRatePlanPrice(ratePlan: any) {
    return this._storeSvc.getAvgRatePlanPrice(ratePlan, this.currFilterValue);
  }

  getDiscountedRatePlanPrice(ratePlan: any) {
    return this._storeSvc.getDiscountedRatePlanPrice(ratePlan, this.currFilterValue);
  }

  setBedType(bedtype: string) {
   this.ngxSpinner.show();
    this.bedtype = bedtype;
    this.emitBedTypeChangedEvent(this.selectedRoom);
  }

  onLionKingPackageSelected(eventData: any) {
    this.selectedRoomData.Packages = [];
    this.selectedRoomData.Packages.push(eventData);
    this._storeSvc.upsertSingleRoom(this.selectedRoomData);
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

  public closeFix(event, popover, target) {
    CommonUtility.toggleTooltip(event, popover, target);
  }

  public roundedvalues(irp) {
    irp.formattedAveragePriceByCurrency = [];
    irp.formattedLowestUnitAddOnPrice = [];
    const pricekeys = Object.keys(irp.averagePriceByCurrency);
    for (const key of pricekeys) {
      irp.formattedAveragePriceByCurrency[key] = Number(
        CommonUtility.formattedPrice(
          (!this.showAverageNightlyRate ? irp.totalPriceByCurrency[key] : irp.averagePriceByCurrency[key]),
          key,
          this._storeSvc
        )
      );
    }
    const addonnkeys = Object.keys(irp.lowestUnitAddOnPrice);
    for (const key of addonnkeys) {
      irp.formattedLowestUnitAddOnPrice[key] = Number(
        CommonUtility.formattedPrice(
          irp.lowestUnitAddOnPrice[key],
          key,
          this._storeSvc
        )
      );
    }
  }
}
