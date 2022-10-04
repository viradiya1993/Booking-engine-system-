import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from "@angular/core";
import { Router } from "@angular/router";
import * as _ from "lodash";
import { BsModalService } from "ngx-bootstrap/modal";
import { BsModalRef } from "ngx-bootstrap/modal/bs-modal-ref.service";
import { Subscription } from "rxjs";
import {
  MANAGE_BOOKING_FLAG,
  URL_PATHS,
} from "src/app/common/common.constants";
import { SMALL_LAPTOP_WIDTH } from "../common/common.constants";
import { BOOKING_NUMBER_MAX_LENGTH } from "../common/common.constants";
import { CommonUtility } from "../common/common.utility";
import { ManageBookingService } from "../common/services/manage-booking.service";
import { StoreService } from "../common/services/store.service";

@Component({
  selector: "app-manage-booking-lightbox",
  templateUrl: "./manage-booking-lightbox.component.html",
  styleUrls: ["./manage-booking-lightbox.component.scss"],
})
export class ManageBookingLightboxComponent implements OnInit, OnDestroy {
  modalRef: BsModalRef;
  localeObj: any;
  _userSettingsSubscriptions: any;
  reservationID: string;
  emailID: string;
  emailFieldError = "";
  isMailInvalid: boolean;
  isSubmitButtonVisible: boolean;
  maxBokingResesrvationNumberLength: number;
  showManageBookingFlag = MANAGE_BOOKING_FLAG;
  reservationVerification: any;
  reservationLookUpSubscription: Subscription;
  isResIdValid = false;
  isReservationValid = true;
  errorMsg = "";
  resNumberTouched = false;
  emailInputTouched = false;
  @ViewChild("lightboxmodel", { static: true }) dialogBox: ElementRef;
  statuscode: any;

  constructor(
    private modalService: BsModalService,
    private _storeSvc: StoreService,
    private router: Router,
    private manageBookingService: ManageBookingService
  ) {}

  ngOnInit() {
    this._userSettingsSubscriptions = this._storeSvc
      .getUserSettings()
      .subscribe((sharedData) => {
        this.localeObj = sharedData.localeObj;
        this.maxBokingResesrvationNumberLength =
          sharedData.propertyInfo.bookingNumberMaxLength;
      });
    this._storeSvc.updateIsManageBookingFlag(true);
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
        this.statuscode = _.get(data, "status.statusCode");
        this.isReservationValid =
          this.statuscode === 1000 ||
          this.statuscode === 6902 ||
          this.statuscode === 6903 ||
          this.statuscode === 6904
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
            this._storeSvc.updateOldData(oldData);
          }
          this.closeManageBooking();
          const width = window.innerWidth;
          if (width < SMALL_LAPTOP_WIDTH) {
            CommonUtility.collapseMobileMenu();
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
          error_description: this.statuscode,
        });
      });
  }

  openManageBooking() {
    try {
      this.modalRef = this.modalService.show(
        this.dialogBox,
        Object.assign({}, { class: "modal-lg" })
      );
      this.isSubmitButtonVisible = false;
      CommonUtility.focusOnModal("modal-id");
    } catch (err) {
      console.log(err);
    }
    return false;
  }

  closeManageBooking() {
    this.reservationID = "";
    this.emailID = "";
    this.isMailInvalid = false;
    this.isReservationValid = true;
    this.modalRef.hide();
  }
}
