import {
  Component,
  HostListener,
  Input,
  OnChanges,
  OnInit,
  TemplateRef,
  ViewChild,
} from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import * as _ from "lodash";
import { BsModalService } from "ngx-bootstrap";
import { BsModalRef } from "ngx-bootstrap/modal/bs-modal-ref.service";
import { Subscription } from "rxjs";
import { URL_PATHS } from "src/app/common/common.constants";
import { CommonUtility } from "src/app/common/common.utility";
import { FeatureFlags } from "src/app/common/feature.flags";
import { HttpWrapperService } from "src/app/common/services/http-wrapper.service";
import { StoreService } from "src/app/common/services/store.service";
import { IBasketState } from "src/app/common/store/reducers/basket.reducer";
import { MultiPropertyService } from "../multi-property.service";
import { RoomListingService } from "../../common/services/roomListing.Service";
@Component({
  selector: "app-alternate-property",
  templateUrl: "./alternate-property.component.html",
  styleUrls: ["./alternate-property.component.scss"],
})
export class AlternatePropertyComponent implements OnInit {
  private modalRef: BsModalRef;
  private counter = 0;
  public propertyList = [];
  private _userSettingsSubscriptions: Subscription;
  private _basketSubscription: Subscription;
  private routerSubscription: Subscription;
  public localeObj: any;
  public maxAmenitiesShown: any;
  public defCurr: any;
  public currencyType: any;
  public alterPropExists: any;
  public currCode: string;
  public isCheckinSummaryAvailable: boolean;
  public isDpr9: boolean = false;
  public isDpr10: boolean = false;
  public alertMessageExists: boolean = false;
  public displayStarRating: boolean = true;
  public RTL_Flag: boolean;
  @Input() searchCritertiaAvail = false;
  @ViewChild("AlterProperty") AlterProperty: TemplateRef<any>;
  public alertArrayIsPopulated: any;
  private errorHandlerSubscription: Subscription;
  private _roomsListSubscription: Subscription;
  public alertMessages = [];
  public errorCode: number;
  public noAvailabiliyAlertMsg = false;

  constructor(
    private modalService: BsModalService,
    private _authHttp: HttpWrapperService,
    private _storeSvc: StoreService,
    private _multiPropServ: MultiPropertyService,
    private _route: ActivatedRoute,
    private _roomSvc: RoomListingService
  ) {}

  ngOnInit(): void {
    this._userSettingsSubscriptions = this._storeSvc
      .getUserSettings()
      .subscribe((sharedData) => {
        this.localeObj = sharedData.localeObj;
        this.RTL_Flag = CommonUtility.langAlignCheck(this._storeSvc.getUserSettingsState().langObj.code, FeatureFlags);
        this.alterPropExists = sharedData.propertyInfo.isAlternatePropertiesExist || false;
        this.displayStarRating = sharedData.propertyInfo.displayStarRating;
        this.maxAmenitiesShown = sharedData.propertyInfo.maxAmenitiesShown;
        if (sharedData.propertyInfo.alertMessages) {
          this.alertArrayIsPopulated = sharedData.propertyInfo.alertMessages.length || 0;
          this.alertMessages = sharedData.propertyInfo.alertMessages;
          sharedData.propertyInfo.alertMessages.forEach(element => {
            if (this.checkAlertIntent(element)) {
              this.alertMessageExists = true;
            }
          });
        }
      });

      this._roomsListSubscription = this._roomSvc.rooms.subscribe((data) => {
        if (data && _.get(data, "status.statusCode") === 4000) {
          this.errorCode = 4000;
          this.showNoAvailMsgAlternatePropModel();
        }
      });


      this._route.queryParams.subscribe((params) => {
        const errorCode = params["errorCode"];
        this.errorCode = errorCode;
        if (this.errorCode === 4000 ) {
          this.showNoAvailMsgAlternatePropModel();
        }
      });

    this.defCurr = _.get(
      this._storeSvc.getUserSettingsState(),
      "propertyInfo.defaultCurrency"
    );
    this._basketSubscription = this._storeSvc
      .getBasket()
      .subscribe((basketState) => {
        const basket = this._storeSvc.getBasketState() as IBasketState;
        this.currencyType =
          basketState.CurrencyCode === undefined
            ? this.defCurr
            : basketState.CurrencyCode;
        this.currCode = CommonUtility.getCurrSymbolForType(
          this._storeSvc.getUserSettingsState().propertyInfo,
          this.currencyType
        );
      });

    this.routerSubscription = this._route.queryParams.subscribe((urlparams) => {
      const basketCheckinSummary = this._storeSvc.getBasketState().GuestSummary;

      // Start - Check for checkinDate presence
      const checkInSummaryObject = CommonUtility.getCheckInSummaryFromQueryParams(
        urlparams
      );
      const checkInSummary = checkInSummaryObject.checkinSummary;
      if (checkInSummaryObject.isCheckInDateExists) {
        this.isCheckinSummaryAvailable = true;
        this._storeSvc.updateGuestDuration(checkInSummary);
      } else {
        this.isCheckinSummaryAvailable = false;
      }
    });

    /** opens alternate property modal when the user tries to leaves window */
    document.addEventListener("mouseout", (e) => {
      this.setAlertMessageData();
      this.alertMessages.forEach(element => {
          if (
            e.clientY <= 0 &&
            this.modalRef === undefined &&
            location.pathname === "/" + URL_PATHS.SEARCH_PAGE &&
            this.alterPropExists && (this.alertArrayIsPopulated > 0 && this.checkAlertIntent(element))
          ) {
            this.getAlternateProp();
          }
        });
    });
    /** Enables DPR Tagline display */
    if (FeatureFlags.isFeatureEnabled("dpr9")) {
      this.isDpr9 = true;
    } else if (FeatureFlags.isFeatureEnabled("dpr10")) {
      this.isDpr10 = true;
    }
  }

  setAlertMessageData() {
    this.localeObj =  _.get(
        this._storeSvc.getUserSettingsState(),
        "localeObj"
      );
    this.alterPropExists = _.get(
        this._storeSvc.getUserSettingsState(),
        "propertyInfo.isAlternatePropertiesExist"
      ) || false;

    const alertMessages = _.get(
    this._storeSvc.getUserSettingsState(),
        "propertyInfo.alertMessages"
      );
    this.alertArrayIsPopulated = (alertMessages) ? alertMessages.length : 0;
  }

  showNoAvailMsgAlternatePropModel() {
    this.setAlertMessageData();
    if (
      this.modalRef === undefined &&
      this.alterPropExists &&
      this.errorCode === 4000 &&
      this.alertArrayIsPopulated &&
      (location.pathname === "/" + URL_PATHS.ROOMS_PAGE ||
      location.pathname === "/" + URL_PATHS.SEARCH_PAGE)) {
        this.alertMessages = _.get(
          this._storeSvc.getUserSettingsState(),
          "propertyInfo.alertMessages"
        );
      this.alertMessages.forEach(element => {
      if (this.checkAlertNoAvailAlertMsg(element)) {
          this.noAvailabiliyAlertMsg = true;
          this.getAlternateProp();
      }
      });
    }
  }


  /** Function to open modal */
  openModal() {
    this.modalRef = this.modalService.show(this.AlterProperty, {
      class: "modal-md alternate-prop",
    });
    CommonUtility.focusOnModal('ap-modal');
  }

  /** Calls API to check data availability */
  getAlternateProp() {
    this._multiPropServ.getHotelList(false);
    this._multiPropServ.hotelList.subscribe((data) => {
      this.alterPropExists = data.status.statusCode === 1000 ? true : false;
      data.data.hotels.map((element) => {
        element["starRating"] = Math.trunc(element.rating);
        element["splitStar"] =
          Number((element.rating - element.starRating).toFixed(1)) * 100 + "%";
        element["discountedPrice"] = this.checkPriceAvailability(
          element.strike_off_price
        );
        element["leadOffPrice"] = this.checkPriceAvailability(
          element.lead_off_price
        );
        element["currCode"] = this.currCodeAvailability(element.lead_off_price);
        element["currType"] = this.setCurrencyType(element.lead_off_price);
      });
      this.propertyList = data.data.hotels;
      this.openModal();
    });
  }

  /** Checks price availability w.r.t. default currency */
  public checkPriceAvailability(currency) {
    if (!_.isEmpty(currency)) {
      const currAvail = Object.keys(currency);
      if (
        !_.isEmpty(currency) &&
        (_.includes(currAvail, this.currencyType) ||
          _.includes(currAvail, this.defCurr))
      ) {
        return true;
      }
    }
    return false;
  }

  /** Checks price availability w.r.t. default code */
  public currCodeAvailability(currency) {
    const currAvail = Object.keys(currency);
    if (_.includes(currAvail, this.currencyType) === true) {
      return CommonUtility.getCurrSymbolForType(
        this._storeSvc.getUserSettingsState().propertyInfo,
        this.currencyType
      );
    } else if (_.includes(currAvail, this.defCurr) === true) {
      return CommonUtility.getCurrSymbolForType(
        this._storeSvc.getUserSettingsState().propertyInfo,
        this.defCurr
      );
    } else {
      return "";
    }
  }

  /** Sets price & currency code w.r.t. default */
  public setCurrencyType(currency) {
    const currAvail = Object.keys(currency);
    if (_.includes(currAvail, this.currencyType) === true) {
      console.log(this.currencyType, this.defCurr, currAvail);
      return this.currencyType;
    } else if (_.includes(currAvail, this.defCurr) === true) {
      return this.defCurr;
    } else {
      return "";
    }
  }

  /** Manages amenities tool-tip display */
  public closeFix(event, popover, target) {
    CommonUtility.toggleTooltip(event, popover, target);
  }

  /** Routes user to available alternate property */
  public viewHotel(hotelInfo: any) {
    const selPropertySubdomain = hotelInfo.singlePropertyPortalSubdomainLink;

    this._storeSvc.updateMultiPropertyInfo({
      isHotelSelected: true,
      hotelCode: hotelInfo.hotelCode,
      hotelPortalSubdomain: selPropertySubdomain,
      hotelName: "",
    });

    const userSettingsData = this._storeSvc.getUserSettingsState();
    const propertyInfo = userSettingsData.propertyInfo;
    const openPropertyPageInExistingTab =
      propertyInfo.openPropertyPageInExistingTab;

    let selectedPropertyLink = "";

    // View hotel on the single property portal
    const currentURL = new URL(window.location.href);
    selectedPropertyLink =
      currentURL.protocol + "//" + selPropertySubdomain + "/";

    if (this.isCheckinSummaryAvailable) {
      // get the rooms page link with checkin params
      selectedPropertyLink = this.getRoomsPageUrl(selectedPropertyLink);
    }

    // Open the property in the Existing Tab
    window.location.href = selectedPropertyLink;
  }

  /** Sets Query Params for routing */
  public getRoomsPageUrl(selectedPropertyLink, hotelID?: string) {
    // Set the checkin summary url query params from basket
    const CheckinSummary = this._storeSvc.getBasketState().GuestSummary;
    const params = CommonUtility.getQueryParamObjGuestSummary(
      CheckinSummary,
      this._storeSvc,
      this._route.snapshot.queryParams.offerCode
    );
    const urlObject = new URL(selectedPropertyLink);
    const queryString = Object.keys(params)
      .map((key) => {
        if (key !== "") {
          return key + "=" + params[key];
        } else {
          return "";
        }
      })
      .join("&");

    urlObject.search = queryString;
    urlObject.pathname = URL_PATHS.ROOMS_PAGE;
    if (!!hotelID) {
      urlObject.searchParams.set("hotel", hotelID);
    }

    selectedPropertyLink = urlObject.href;

    return selectedPropertyLink;
  }

  public checkAlertIntent(elem) {
    if (
      elem.content === "ALTERNATE_PROPERTY" &&
      elem.location === "CALENDAR_PAGE" &&
      elem.trigger === "EXIT_INTENT" &&
      elem.displayType === "POP_UP"
    ) {
      return true;
    } else {
      return false;
    }
  }

  public checkAlertNoAvailAlertMsg(elem) {
    if (
      elem.content === "ALTERNATE_PROPERTY" &&
      elem.location === "CALENDAR_PAGE" &&
      elem.trigger === "NO_AVAILABILITY" &&
      elem.displayType === "POP_UP"
    ) {
      return true;
    } else {
      return false;
    }
  }
}
