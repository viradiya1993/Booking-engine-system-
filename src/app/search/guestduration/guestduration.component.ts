import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import * as _ from "lodash";
import { Subscription } from "rxjs";
import {
  MONTHS_MAP,
  QUERY_PARAM_ATTRIBUTES,
  URL_PATHS,
} from "../../common/common.constants";
import { CommonUtility } from "../../common/common.utility";
import { RatecalendarService } from "../../common/services/ratecalendar/ratecalendar.service";
import { RoomListingService } from "../../common/services/roomListing.Service";
import { StoreService } from "../../common/services/store.service";
import { RatecalendarComponent } from "../ratecalendar/ratecalendar.component";
import { CheckinSummary, ICheckinSummary } from "./checkinsummary.type";
import { FeatureFlags } from 'src/app/common/feature.flags';

@Component({
  selector: "app-guestduration",
  templateUrl: "./guestduration.component.html",
  styleUrls: ["./guestduration.component.scss"],
})
export class GuestdurationComponent implements OnInit, OnDestroy {
  guestSummary: ICheckinSummary = new CheckinSummary();
  private _roomListSubscription: Subscription;
  private _dataShareSubscription: Subscription;
  private _accessCodeSubscription: Subscription;
  private nightVerbiage: string;
  private roomVerbiage: string;
  private adultVerbiage: string;
  private childVerbiage: string;
  private adultsCount: number;
  private childrenCount: number;
  childVeriagewithCount: string;
  localeObj: any;
  private _userSettingsSubscriptions: any;
  accessCode: string;
  enableAccessCodeField: boolean;
  private checkin: string;
  date_checkin: string[];
  @Input() isPromoSpecialsFlow: boolean;
  @Input() isMultiProp: boolean;
  @Input() isCheckinSummaryAvailable: boolean;
  @Input() showMap: boolean;
  @ViewChild("rateCal", { static: true }) rateCalander: RatecalendarComponent;
  @Output() multiPropertyCheckInSummaryChanged = new EventEmitter<CheckinSummary>();
  RTL_Flag: boolean = false;
  @Input("roomsListAvail") roomsListAvail;

  availableRooms = true;
  accessCodeStatus: string;
  isAccessCodeValid = true;
  showAccessCode: boolean;
  private isSpecialRate: boolean;
  private offerCode: string;
  private currentUrlPath: string;
  public accessCodePathValidation = false;

  constructor(
    private _roomListingService: RoomListingService,
    private storeService: StoreService,
    private _router: Router,
    private _route: ActivatedRoute,
    private rateCalendarService: RatecalendarService
  ) {}

  ngOnDestroy() {
    const subscriptionsList = [
      this._dataShareSubscription,
      this._roomListSubscription,
      this._userSettingsSubscriptions,
      this._accessCodeSubscription,
    ];
    CommonUtility.removeSubscriptions(subscriptionsList);
  }
  ngOnInit() {
    this.availableRooms = false;
    this._roomListSubscription = this._roomListingService.rooms.subscribe(
      (data) => {
        if (data && _.get(data, "status.statusCode") !== 1000) {
          this.storeService.setError(data.status.statusCode);
        }
        this.availableRooms = false;
        if (
          data !== null &&
          data.data !== null &&
          data.data.availableRooms !== null &&
          data.data.availableRooms.length > 0
        ) {
          this.availableRooms = true;
        }
      }
    );
    this._userSettingsSubscriptions = this.storeService
      .getUserSettings()
      .subscribe((sharedData) => {
        this.RTL_Flag = CommonUtility.langAlignCheck(this.storeService.getUserSettingsState().langObj.code, FeatureFlags);
        this.localeObj = sharedData.localeObj;
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
        this.adultsCount = 0;
        this.childrenCount = 0;
        this.childVeriagewithCount =
          _.get(this.localeObj, "tf_1_Calendar_rateCalender_children") ||
          "Children";
        this.guestSummary = this.storeService.getGuestSummary();
        if (Number(this.guestSummary.los) === 1) {
          this.nightVerbiage =
            _.get(this.localeObj, "tf_2_RoomList_bookingSummery_night") ||
            "Night";
        }
        if (Number(this.guestSummary.rooms) > 1) {
          this.roomVerbiage =
            _.get(this.localeObj, "tf_4_Checkout_addons_roomsText") || "Rooms";
        }
        this.guestSummary.guests.forEach((element) => {
          this.adultsCount = this.adultsCount + Number(element.adults);
          this.childrenCount = this.childrenCount + Number(element.children);
        });
        if (this.childrenCount === 1) {
          this.childVerbiage = _.get(this.localeObj, "tf_1_Calendar_rateCalender_child") || "Child";
          this.childVeriagewithCount =
            (_.get(this.localeObj, "tf_3_MultiRoom_packageListing_comma") ||
              ",") +
            " " +
            this.childrenCount +
            " " +
            this.childVerbiage;
        } else if (this.childrenCount > 1) {
          this.childVeriagewithCount =
            (_.get(this.localeObj, "tf_3_MultiRoom_packageListing_comma") ||
              ",") +
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
            _.get(this.localeObj, "tf_1_Calendar_rateCalender_adult") ||
            "Adult";
        }
      });
    this.showAccessCode = this.storeService.getUserSettingsState().propertyInfo.showAccessCode;
    if (this.showAccessCode) {
      this._accessCodeSubscription = this.storeService
        .getBasket()
        .subscribe((data) => {
          if (
            this._route.snapshot.queryParams.accessCode &&
            data.promoData.priorAccessCode === "" &&
            data.promoData.accessCode === ""
          ) {
            this.onAccessCodeChange(
              this._route.snapshot.queryParams.accessCode,
              this.guestSummary
            );
          } else if (
            this.accessCode &&
            data.promoData.priorAccessCode !== "" &&
            data.promoData.priorAccessCode !== this.accessCode
          ) {
            return;
          } else if (
            !this._route.snapshot.queryParams.accessCode &&
            data.promoData.priorAccessCode
          ) {
            this.accessCode = this._route.snapshot.queryParams.accessCode;
          } else if (
            (data.promoData.priorAccessCode ||
              data.promoData.priorAccessCode === "") &&
            data.promoData.accessCode
          ) {
            this.accessCode = data.promoData.accessCode;
          }
          if (this.accessCode === "" || this.accessCode === undefined) {
            this.enableAccessCodeField = true;
            this.accessCodeStatus = this.localeObj.tf_2_RoomList_guestDuration_button_promoApply;
          } else {
            if (data.promoData.validationState === true) {
              this.isAccessCodeValid = true;
              this.enableAccessCodeField = false;
              this.accessCodeStatus = this.localeObj.tf_2_RoomList_guestDuration_button_promoEdit;
            } else if (data.promoData.validationState === false) {
              this.isAccessCodeValid = false;
              this.enableAccessCodeField = true;
              this.accessCodeStatus = this.localeObj.tf_2_RoomList_guestDuration_button_promoApply;
            }
          }
          if (this.accessCodeStatus === undefined) {
            if (!!this._route.snapshot.queryParams.accessCode) {
              this.enableAccessCodeField = false;
              this.accessCodeStatus = this.localeObj.tf_2_RoomList_guestDuration_button_promoEdit;
            } else {
              this.isAccessCodeValid = true;
              this.enableAccessCodeField = true;
              this.accessCodeStatus = this.localeObj.tf_2_RoomList_guestDuration_button_promoApply;
            }
          }
          if (this.showAccessCode && this.isMultiProp) {
            if (!!this.accessCode) {
              this.accessCodePathValidation = true;
              this.isAccessCodeValid = true;
              this.enableAccessCodeField = false;
              this.accessCodeStatus = this.localeObj.tf_2_RoomList_guestDuration_button_promoEdit;
            } else if (
              this.accessCode === "" ||
              this.accessCode === undefined
            ) {
              this.enableAccessCodeField = true;
              this.accessCodeStatus = this.localeObj.tf_2_RoomList_guestDuration_button_promoApply;
              this.isAccessCodeValid = true;
            }
          }
        });
    }

    this._dataShareSubscription = this.storeService
      .getBasket()
      .subscribe((data) => {
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
        this.adultsCount = 0;
        this.childrenCount = 0;
        this.childVeriagewithCount =
          _.get(this.localeObj, "tf_1_Calendar_rateCalender_children") ||
          "Children";
        this.guestSummary = data.GuestSummary;
        if (Number(this.guestSummary.los) === 1) {
          this.nightVerbiage =
            _.get(this.localeObj, "tf_2_RoomList_bookingSummery_night") ||
            "Night";
        }
        if (Number(this.guestSummary.rooms) > 1) {
          this.roomVerbiage =
            _.get(this.localeObj, "tf_4_Checkout_addons_roomsText") || "Rooms";
        }
        this.guestSummary.guests.forEach((element) => {
          this.adultsCount = this.adultsCount + Number(element.adults);
          this.childrenCount = this.childrenCount + Number(element.children);
        });
        if (this.childrenCount === 1) {
          this.childVerbiage = _.get(this.localeObj, "tf_1_Calendar_rateCalender_child") || "Child";
          this.childVeriagewithCount =
            (_.get(this.localeObj, "tf_3_MultiRoom_packageListing_comma") ||
              ",") +
            " " +
            this.childrenCount +
            " " +
            this.childVerbiage;
        } else if (this.childrenCount > 1) {
          this.childVeriagewithCount =
            (_.get(this.localeObj, "tf_3_MultiRoom_packageListing_comma") ||
              ",") +
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
            _.get(this.localeObj, "tf_1_Calendar_rateCalender_adult") ||
            "Adult";
        }
        setTimeout(() => {
          if (window.innerWidth > 768) {
            const guestDetailsGrid = document.getElementById("guestDuration");
            if (!!guestDetailsGrid) {
              if (!guestDetailsGrid.className.includes("d-md-flex d-none")) {
                guestDetailsGrid.className = guestDetailsGrid.className
                  .trim()
                  .concat(" d-md-flex d-none");
              }
              if (guestDetailsGrid.clientHeight > 100) {
                guestDetailsGrid.className = guestDetailsGrid.className.replace(
                  "d-md-flex d-none",
                  ""
                );
              } else if (
                !guestDetailsGrid.className.includes("d-md-flex d-none")
              ) {
                guestDetailsGrid.className = guestDetailsGrid.className.concat(
                  " d-md-flex d-none"
                );
              }
            }
          }
        }, 1500);
      });
    this.offerCode = "";
    const prevOfferCode = this.storeService.getBasketState().offerCode;
    const urlTree = this._router.parseUrl(this._router.url);
    if (urlTree.root.children["primary"] !== undefined) {
      this.currentUrlPath = urlTree.root.children["primary"].segments
        .map((it) => it.path)
        .join("/");
    } else {
      this.currentUrlPath = "";
    }
    this.offerCode = prevOfferCode;
    const currentOfferCodeFromSnapShot = this._route.snapshot.queryParams[
      QUERY_PARAM_ATTRIBUTES.OFFERCODE
    ];
    if (
      this.currentUrlPath !== URL_PATHS.GUEST_INFO_PAGE &&
      currentOfferCodeFromSnapShot
    ) {
      this.offerCode = currentOfferCodeFromSnapShot;
    }
    if (this.currentUrlPath === URL_PATHS.ROOMS_PAGE || this.isMultiProp) {
      this.accessCodePathValidation = true;
    } else {
      this.accessCodePathValidation = false;
    }
    this._route.queryParams.subscribe((params) => {
      this.offerCode = prevOfferCode;
      const currentOfferCodeFromSubscription =
        params[QUERY_PARAM_ATTRIBUTES.OFFERCODE];
      if (
        this.currentUrlPath !== URL_PATHS.GUEST_INFO_PAGE &&
        currentOfferCodeFromSubscription
      ) {
        this.offerCode = currentOfferCodeFromSubscription;
      }
      if (this.offerCode && this.offerCode !== prevOfferCode) {
        this.storeService.updateOfferCode(this.offerCode);
      }
      const accessCodeParamVal = this._route.snapshot.queryParams.accessCode;
      if (accessCodeParamVal && accessCodeParamVal !== "") {
        this.guestSummary = this.storeService.getBasketState().GuestSummary;
        this.onAccessCodeChange(accessCodeParamVal, this.guestSummary);
      }
    });
  }

  public resetMultiPropertyPageInfo() {
    this.storeService.resetMultiPropertyPageInfo();
  }

  onAccessCodeChangeGetHotels(code: any, guestSummary) {
    if (this.showAccessCode) {
      if (
        this.accessCodeStatus ===
        this.localeObj.tf_2_RoomList_guestDuration_button_promoEdit
      ) {
        this.enableAccessCodeField = true;
        this.accessCodeStatus = this.localeObj.tf_2_RoomList_guestDuration_button_promoApply;
      } else if (
        this.accessCodeStatus ===
        this.localeObj.tf_2_RoomList_guestDuration_button_promoApply
      ) {
        const updatedAccessCode = code.trim();
        if (!!updatedAccessCode) {
          this.accessCode = updatedAccessCode;
          this.accessCodeStatus = this.localeObj.tf_2_RoomList_guestDuration_button_promoEdit;
          this.enableAccessCodeField = false;
          this.isAccessCodeValid = true;
          const promoData = {
            priorAccessCode: this.storeService.getBasketState().promoData
              .accessCode,
            accessCode: this.accessCode,
            offerCode: this.offerCode,
            isSpecialRate: false,
            validationState: true,
          };
          this.storeService.updatePromoData(promoData);
          // emit to get the hotels list for the accessCode
          this.multiPropertyCheckInSummaryChanged.emit(guestSummary);
        } else {
          this.accessCodeStatus = this.localeObj.tf_2_RoomList_guestDuration_button_promoApply;
          this.enableAccessCodeField = true;
          this.isAccessCodeValid = true;
          const promoData = {
            priorAccessCode: this.storeService.getBasketState().promoData
              .accessCode,
            accessCode: this.accessCode,
            offerCode: this.offerCode,
            isSpecialRate: this.isSpecialRate,
            validationState: false,
          };
          this.storeService.updatePromoData(promoData);
          // emit to get the hotels list for the accessCode
          this.multiPropertyCheckInSummaryChanged.emit(guestSummary);
        }
      }
    }
  }

  onAccessCodeChange(code: any, guestSummary) {
    if (this.showAccessCode) {
      const routeParams = this._route.snapshot.queryParams;
      const roomNo = Number(routeParams.Rooms) - 1;
      if (
        this.accessCodeStatus ===
        this.localeObj.tf_2_RoomList_guestDuration_button_promoEdit
      ) {
        this.enableAccessCodeField = true;
        this.accessCodeStatus = this.localeObj.tf_2_RoomList_guestDuration_button_promoApply;
      } else if (
        this.accessCodeStatus ===
        this.localeObj.tf_2_RoomList_guestDuration_button_promoApply
      ) {
        const updatedAccessCode = code.trim();
        if (!!updatedAccessCode) {
          this.accessCode = updatedAccessCode;
          this.rateCalendarService
            .validateAccessCode(this.accessCode)
            .subscribe((response) => {
              if (
                response.status.success === true &&
                response.status.statusCode === 1000
              ) {
                this.accessCodeStatus = this.localeObj.tf_2_RoomList_guestDuration_button_promoEdit;
                this.enableAccessCodeField = false;
                this.isAccessCodeValid = true;
                const promoData = {
                  priorAccessCode: this.storeService.getBasketState().promoData
                    .accessCode,
                  accessCode: this.accessCode,
                  offerCode: this.offerCode,
                  isSpecialRate: this.isSpecialRate,
                  validationState: response.status.success,
                };
                this.storeService.updatePromoData(promoData);
                if (
                  response.data &&
                  response.data.isAccessCodeWithMultiOffers
                ) {
                  this.storeService.updateIsCompoundAccessCode(true);
                } else {
                  this.storeService.updateIsCompoundAccessCode(false);
                }
                this.onCheckInSummaryChanged(guestSummary);
                this._roomListingService.getAvailableRoomsDataWithParams(
                  guestSummary,
                  routeParams.offerCode,
                  roomNo,
                  routeParams.multi
                );
              } else if (
                response.status.success === false &&
                response.status.statusCode === 6000
              ) {
                this.accessCodeStatus = this.localeObj.tf_2_RoomList_guestDuration_button_promoApply;
                this.enableAccessCodeField = true;
                this.isAccessCodeValid = false;
                const promoData = {
                  priorAccessCode: this.storeService.getBasketState().promoData
                    .accessCode,
                  accessCode: "",
                  offerCode: this.offerCode,
                  isSpecialRate: this.isSpecialRate,
                  validationState: response.status.success,
                };
                this.storeService.updatePromoData(promoData);
                this.onCheckInSummaryChanged(guestSummary);
                this._roomListingService.getAvailableRoomsDataWithParams(
                  guestSummary,
                  routeParams.offerCode,
                  roomNo,
                  routeParams.multi
                );
              }
            });
        } else {
          this.accessCode = "";
          this.accessCodeStatus = this.localeObj.tf_2_RoomList_guestDuration_button_promoApply;
          this.enableAccessCodeField = true;
          this.isAccessCodeValid = true;
          const promoData = {
            priorAccessCode: this.storeService.getBasketState().promoData
              .accessCode,
            accessCode: this.accessCode,
            offerCode: this.offerCode,
            isSpecialRate: this.isSpecialRate,
            validationState: false,
          };
          this.storeService.updatePromoData(promoData);
          this.onCheckInSummaryChanged(guestSummary);
          this._roomListingService.getAvailableRoomsDataWithParams(
            guestSummary,
            routeParams.offerCode,
            roomNo,
            routeParams.multi
          );
        }
      }
    }
  }

  onMultiPropertyCheckInSummaryChanged(eventData: any) {
    const guestSummary = CommonUtility.getGuestSummaryFromEventData(eventData);
    this.storeService.updateGuestDuration(guestSummary);
    this.multiPropertyCheckInSummaryChanged.emit(eventData);
  }

  onCheckInSummaryChanged(eventData: any) {
    const guestSummary = CommonUtility.getGuestSummaryFromEventData(eventData);
    this.storeService.updateGuestDuration(guestSummary);
    let errorCode;
    if (guestSummary.restrictionFailed) {
      errorCode = 4000;
      this.availableRooms = false;
    } else {
      this.availableRooms = true;
    }
    const offerCode = this.storeService.getBasketState().offerCode;
    const accessCode = this.storeService.getBasketState().promoData
      ? this.storeService.getBasketState().promoData.accessCode
      : "";
    const params = CommonUtility.getQueryParamObjGuestSummary(
      guestSummary,
      this.storeService,
      offerCode,
      errorCode,
      accessCode
    );
    const navigationExtras = {
      queryParams: params,
    };
    if (!this.isPromoSpecialsFlow) {
      this._router
        .navigate(["/" + URL_PATHS.ROOMS_PAGE], navigationExtras)
        .then((d) => CommonUtility.highlightStep("select-room"));
    } else {
      this._router
        .navigate(["/" + URL_PATHS.PROMO_PAGE], navigationExtras)
        .then((d) => CommonUtility.highlightStep("promo"));
    }
    // this._roomListingService.getAvailableRoomsDataWithParams(guestSummary);
  }

  getTranslatedDate(date: Date) {
    return CommonUtility.getTranslatedDateStr(date, this.localeObj);
  }

  onResize() {
    const guestDetailsGrid = document.getElementById("guestDuration");
    if (
      window.innerWidth <= 768 &&
      !guestDetailsGrid.className.includes("d-md-flex d-none")
    ) {
      guestDetailsGrid.className = guestDetailsGrid.className
        .trim()
        .concat(" d-md-flex d-none");
    } else if (window.innerWidth > 768 && guestDetailsGrid.clientHeight > 88) {
      guestDetailsGrid.className = guestDetailsGrid.className.replace(
        "d-md-flex d-none",
        ""
      );
    }
  }
}
