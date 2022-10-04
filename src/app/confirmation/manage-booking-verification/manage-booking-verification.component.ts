import { Component, OnDestroy, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import * as _ from "lodash";
import { Subscription } from "rxjs";
import {
  MANAGE_BOOKING_FLAG,
  URL_PATHS,
} from "src/app/common/common.constants";
import { FeatureFlags } from "src/app/common/feature.flags";
import {
  BOOKING_NUMBER_MAX_LENGTH,
  MANAGE_BOOKING_VERIFICATION,
} from "../../common/common.constants";
import { CommonUtility } from "../../common/common.utility";
import { ManageBookingService } from "../../common/services/manage-booking.service";
import { StoreService } from "../../common/services/store.service";

@Component({
  selector: "app-manage-booking-verification",
  templateUrl: "./manage-booking-verification.component.html",
  styleUrls: ["./manage-booking-verification.component.scss"],
})
export class ManageBookingVerificationComponent implements OnInit, OnDestroy {
  reservationID: string;
  emailID: string;
  emailFieldError = "";
  isMailInvalid: boolean;
  isSubmitButtonVisible: boolean;
  localeObj: any;
  maxBokingResesrvationNumberLength: number;
  showManageBookingFlag = MANAGE_BOOKING_FLAG;
  reservationVerification: any;
  _userSettingsSubscriptions: any;
  reservationLookUpSubscription: Subscription;
  isResIdValid = false;
  isReservationValid = true;
  errorMsg = "";
  resNumberTouched = false;
  emailInputTouched = false;
  routerSubscription: Subscription;
  public RTL_Flag: boolean;

  constructor(
    private router: Router,
    private _storeSvc: StoreService,
    private manageBookingService: ManageBookingService,
    private _route: ActivatedRoute
  ) {}

  ngOnInit() {
    this._userSettingsSubscriptions = this._storeSvc
      .getUserSettings()
      .subscribe((sharedData) => {
        this.localeObj = sharedData.localeObj;
        this.RTL_Flag = CommonUtility.langAlignCheck(this._storeSvc.getUserSettingsState().langObj.code, FeatureFlags);
        this.maxBokingResesrvationNumberLength =
          sharedData.propertyInfo.bookingNumberMaxLength;
      });
    this._storeSvc.updateIsManageBookingFlag(true);

    this.routerSubscription = this._route.queryParams.subscribe((params) => {
      if (this._route.snapshot.queryParams.email) {
        this.emailID = this._route.snapshot.queryParams.email;
        this.isEmailValid();
      }

      if (this._route.snapshot.queryParams.confirmNum) {
        this.reservationID = this._route.snapshot.queryParams.confirmNum;
        this.isReservationIdValid();
      }

      if (this._route.snapshot.queryParams.errorCode) {
        this.emailID = this._route.snapshot.queryParams.email;
        this.reservationID = this._route.snapshot.queryParams.confirmNum;
        this.isReservationValid = false;

        if (+this._route.snapshot.queryParams.errorCode === 2201) {
          this.errorMsg = this.localeObj.tf_5_Confirmation_manageBooking_rescheckError3;
        } else if (+this._route.snapshot.queryParams.errorCode === 2100) {
          this.errorMsg = this.localeObj.tf_99_errorCode_2100;
        } else if (+this._route.snapshot.queryParams.errorCode === 2202) {
          this.errorMsg = this.localeObj.tf_99_errorCode_2202;
        } else if (+this._route.snapshot.queryParams.errorCode === 6003) {
          this.errorMsg = this.localeObj.tf_99_errorCode_6003;
        } else if (+this._route.snapshot.queryParams.errorCode === 6000) {
          this.errorMsg = this.localeObj.tf_99_errorCode_6000;
        } else if (+this._route.snapshot.queryParams.errorCode === 6002) {
          this.errorMsg = this.localeObj.tf_99_errorCode_6002;
        } else if (+this._route.snapshot.queryParams.errorCode === 6005) {
          this.errorMsg = this.localeObj.tf_99_errorCode_6005;
        } else if (+this._route.snapshot.queryParams.errorCode === 6006) {
          this.errorMsg = this.localeObj.tf_99_errorCode_6006;
        } else if (+this._route.snapshot.queryParams.errorCode === 6007) {
          this.errorMsg = this.localeObj.tf_99_errorCode_6007;
        } else if (+this._route.snapshot.queryParams.errorCode === 2204) {
          this.errorMsg = this.localeObj.tf_99_errorCode_2204;
        }
        CommonUtility.setDatalayer({
          error_type: "red-error",
          error_code: +this._route.snapshot.queryParams.errorCode || "",
          error_description: this.errorMsg,
        });
      }
    });

    Object.getOwnPropertyNames(MANAGE_BOOKING_VERIFICATION).forEach((key) => {
      if (this._storeSvc.getErrorHandlerState().error.hasOwnProperty(key)) {
        this.isReservationValid = false;
        this.errorMsg = _.get(this.localeObj, MANAGE_BOOKING_VERIFICATION[key]);
        CommonUtility.setDatalayer({
          error_type: "red-error",
          error_code: key,
          error_description: this.errorMsg,
        });
      }
    });
  }

  ngOnDestroy(): void {
    this._storeSvc.updateIsManageBookingFlag(false);
    const subscriptionsList = [
      this._userSettingsSubscriptions,
      this.reservationLookUpSubscription,
    ];
    CommonUtility.removeSubscriptions(subscriptionsList);
  }

  isEmailValid() {
    this.emailFieldError = CommonUtility.isEmailValid(this.emailID);
    if (this.emailFieldError != null) {
      this.isMailInvalid = true;
      this.isSubmitButtonVisible = false;
    } else {
      this.isMailInvalid = false;
      this.isSubmitButtonVisible = true;
    }
  }

  isReservationIdValid() {
    if (
      this.maxBokingResesrvationNumberLength === undefined ||
      this.maxBokingResesrvationNumberLength === null
    ) {
      this.maxBokingResesrvationNumberLength = BOOKING_NUMBER_MAX_LENGTH;
    }
    if (
      _.size(_.trim(this.reservationID)) > 0 &&
      _.size(_.trim(this.reservationID)) <=
        this.maxBokingResesrvationNumberLength
    ) {
      this.isResIdValid = true;
    } else {
      this.isResIdValid = false;
    }
  }

  isReservationIdExists() {
    return (
      this.reservationID === "" || _.size(_.trim(this.reservationID)) === 0
    );
  }

  routetomanagebooking() {
    const params = {
      email: this.emailID,
      bookingReference: _.trim(this.reservationID),
    };
    const navigationExtras = {
      queryParams: params,
    };
    this.errorMsg = "";
    this.reservationLookUpSubscription = this.manageBookingService
      .getReservationLookup(params)
      .subscribe((data) => {
        const statuscode = _.get(data, "status.statusCode");
        this.isReservationValid =
          statuscode === 1000 ||
          statuscode === 6902 ||
          statuscode === 6903 ||
          statuscode === 6904
            ? true
            : false;
        if (this.isReservationValid) {
          this._storeSvc.updateIsManageBookingFlag(false);
          navigationExtras.queryParams["propertyCode"] = data.data.reservationDetails.propertyCode;
          this.router.navigate(
            ["/" + URL_PATHS.BOOKING_DETAILS],
            navigationExtras
          );
          const resData = _.get(data, "data.reservationDetails");
          const oldData = _.get(this._storeSvc.getBasketState(), "oldData");
          if (oldData) {
            oldData.prevRoom = resData.roomType;
            oldData.prevArrivalDate = resData.arrivalDate;
            oldData.prevDepartureDate = resData.departureDate;
            oldData["totaPrice"] = resData.totalPrice;
            this._storeSvc.updateOldData(oldData);
          }
        } else if (_.get(data, "status.statusCode") === 1002) {
          this.errorMsg = this.localeObj.tf_99_errorCode_1002; // Need to add this into label file
        } else if (_.get(data, "status.statusCode") === 2201) {
          this.errorMsg = this.localeObj.tf_99_errorCode_2201;
        } else if (_.get(data, "status.statusCode") === 2100) {
          this.errorMsg = this.localeObj.tf_99_errorCode_2100;
        } else if (_.get(data, "status.statusCode") === 2202) {
          this.errorMsg = this.localeObj.tf_99_errorCode_2202;
        } else if (_.get(data, "status.statusCode") === 6003) {
          //not yet handled w.r.t redirections part
          this.errorMsg = this.localeObj.tf_99_errorCode_6003;
        } else if (_.get(data, "status.statusCode") === 6000) {
          this.errorMsg = this.localeObj.tf_99_errorCode_6000;
        } else if (_.get(data, "status.statusCode") === 6002) {
          this.errorMsg = this.localeObj.tf_99_errorCode_6002;
        } else if (_.get(data, "status.statusCode") === 6005) {
          this.errorMsg = this.localeObj.tf_99_errorCode_6005;
        } else if (_.get(data, "status.statusCode") === 6006) {
          this.errorMsg = this.localeObj.tf_99_errorCode_6006;
        } else if (_.get(data, "status.statusCode") === 6007) {
          this.errorMsg = this.localeObj.tf_99_errorCode_6007;
        } else if (_.get(data, "status.statusCode") === 2204) {
          //not yet handled w.r.t redirections part
          this.errorMsg = this.localeObj.tf_99_errorCode_2204;
        } else {
          this.errorMsg = this.localeObj.tf_5_Confirmation_manageBooking_rescheckError3;
        }
        if(this.errorMsg !=='') {
          setTimeout(()=> {
            document.getElementById("red-error").focus();
          },100);
        } 
        CommonUtility.setDatalayer({
          error_type: "red-error",
          error_code: _.get(data, "status.statusCode") || "",
          error_description: this.errorMsg,
        });
      });
  }
}
