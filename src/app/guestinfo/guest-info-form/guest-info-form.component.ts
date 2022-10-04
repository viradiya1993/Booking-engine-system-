import {
  AfterViewInit,
  Component,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild,
} from "@angular/core";
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from "@angular/forms";
import * as _ from "lodash";
import { CommonUtility } from "src/app/common/common.utility";
import { FeatureFlags } from "../../common/feature.flags";
import {
  GUEST_INFO_FORM,
  GUEST_INFO_FORM_ERRORS,
  GUEST_INFO_FORM_FIELDS,
  SALUTATIONS,
} from "../../common/common.constants";
import {
  emailCharactersRegex,
  EXPECTED_TIMES,
  showPreferences,
} from "../../common/common.constants";
import { GuestInfoDetails } from "../../common/models/guest-info-details.model";
import { StoreService } from "../../common/services/store.service";
import { IBasketState } from "../../common/store/reducers/basket.reducer";
import { COUNTRY_DATA_LIST } from "../../common/utils/country-telephone-utils";
import { PreferencesComponent } from "./preferences/preferences.component";
declare var $: any;

@Component({
  selector: "app-guest-info-form",
  templateUrl: "./guest-info-form.component.html",
  styleUrls: ["./guest-info-form.component.scss"],
})
export class GuestInfoFormComponent
  implements OnInit, OnDestroy, AfterViewInit {
  title = "guestForm";
  defaultCountryCode = 1;
  salutationList = SALUTATIONS;
  expectedTimesList = EXPECTED_TIMES;
  countryDataList = COUNTRY_DATA_LIST;
  countryDataList1 = [];
  countryCode: string;
  callingCode;
  fNameFieldError = "";
  lNameFieldError = "";
  emailFieldError = "";
  phoneNumberError = "";
  salutationError = "";
  cityFieldError = "";
  stateFieldError = "";
  addressLine1Error = "";
  addressLine2Error = "";
  zipcodeFieldError = "";
  salutationOpened: boolean;
  countryName: string;
  firstName: string;
  lastName: string;
  state: string;
  city: string;
  addressLine1: string;
  addressLine2: string;
  zipCode: string;
  phoneNumber: string;
  emailID: string;
  salutation: string;
  isFirstNameValid: boolean;
  isLastNameValid: boolean;
  isMailValid: boolean;
  isPhoneNumberValid: boolean;
  isSalutationValid: boolean;
  isCityValid: boolean;
  isStateValid: boolean;
  isStreetAddress1Valid: boolean;
  isStreetAddress2Valid: boolean;
  isZipCodeValid: boolean;
  localeObj: any;
  propertyInfo: any;
  userCountry: any;
  allowModification: any;
  countryNameFromIP: string;
  isManageBookingFlow: boolean;
  resid: string;
  RTL_Flag: boolean;
  showPref = showPreferences;
  mb_validFirstName = false;
  mb_validLastName = false;
  mb_validPhoneNum = false;
  mb_validEmail = false;
  mb_validSalutation = false;
  mb_validCountryName = false;
  mb_validStateName = false;
  mb_validCityName = false;
  mb_validAddressLine1 = false;
  mb_validAddressLine2 = false;
  mb_validZipCode = false;
  displayTitle = true;
  firstNameMaxLength: number;
  lastNameMaxLength: number;
  displayAddressLine1 = false;
  addressLine1MaxLength: number;
  displayAddressLine2 = false;
  addressLine2MaxLength: number;
  addressLine2Required = false;
  displayCity = false;
  cityMaxLength: number;
  cityRequired = false;
  displayState = false;
  stateMaxLength: number;
  stateRequired = false;
  displayZipcode = false;
  zipCodeMaxLength: number;
  zipCodeRequired = false;
  displayPhoneNumber = true;
  phoneNumberMaxLength: number;
  phoneNumberRequired = true;
  emailMaxLength: number;
  initialCountryValue: string;
  stateDataList = [];

  @ViewChild("Preferences", { static: true })
  guestPreferences: PreferencesComponent;
  private _userSettingsSubscriptions: any;
  prefOptions = ["No pref", "pref1", "pref2"];
  guestInfoForm = new FormGroup({
    firstName: new FormControl(),
    lastName: new FormControl(),
    phoneNumber: new FormControl(),
    email: new FormControl(),
    memNumber: new FormControl(),
    city: new FormControl(),
    state: new FormControl(),
    addressLine1: new FormControl(),
    addressLine2: new FormControl(),
    zipCode: new FormControl(),
  });

  roomsCount: number;
  showAdditionalGuests: boolean;
  toggleAddGuestsAddRemove: boolean;
  addtionalGuestInfoByRoom = [];
  displayAdditionalGuestsConfig: boolean;
  isAddGuestFirstNameValid = [];
  isAddGuestLastNameValid = [];
  isAddGuestFirstNameFieldError = [];
  isAddGuestLasttNameFieldError = [];


  constructor(
    private fb: FormBuilder,
    private storeService: StoreService,
    private _storeSvc: StoreService
  ) {}

  ngAfterViewInit(): void {
    setTimeout(() => {
      $("#callCode").intlTelInput({
        autoPlaceholder: "off",
        preventInvalidNumbers: true,
      });
      $("#callCode").val(this.callingCode);
      $("#callCode").trigger("keyup");
      $("#callCode").intlTelInput("setCountry", this.countryCode);
    }, 100);

    $("#callCode").on("countrychange", function (e, countryData) {
      // $('#phoneTel').val('+' + countryData.dialCode);
      // do something with countryData
    });
  }


  ngOnInit() {
    this._userSettingsSubscriptions = this.storeService
      .getUserSettings()
      .subscribe((sharedData) => {
        this.localeObj = sharedData.localeObj;
        this.propertyInfo = sharedData.propertyInfo;
        this.displayAdditionalGuestsConfig = this.propertyInfo.displayAdditionalGuestNames;

       this.setAdditionalGuestDefaults();

        COUNTRY_DATA_LIST.forEach((c) => {
          const country = {};
          country["name"] = _.get(
            this.localeObj,
            "tf_4_Checkout_Location_" + c.countryCode_3
          );
          country["countryCode"] = _.get(c, "countryCode_2");
          this.countryDataList1.push(country);
        });
        if (!this.isFirstNameValid) {
          if (this.firstName !== "") {
            this.fNameFieldError = _.get(
              this.localeObj,
              "tf_4_Checkout_guestDetails_invalidFirstNameError"
            );
          } else {
            this.fNameFieldError = _.get(
              this.localeObj,
              "tf_4_Checkout_guestDetails_firstNameReqError"
            );
          }
        }
        if (!this.isLastNameValid) {
          if (this.lastName !== "") {
            this.lNameFieldError = _.get(
              this.localeObj,
              "tf_4_Checkout_guestDetails_invalidLastNameError"
            );
          } else {
            this.lNameFieldError = _.get(
              this.localeObj,
              "tf_4_Checkout_guestDetails_lastNameReqError"
            );
          }
        }
        if (!this.isMailValid) {
          if (this.emailID !== "") {
            this.emailFieldError = _.get(
              this.localeObj,
              "tf_4_Checkout_guestDetails_invalidEmailError"
            );
          } else {
            this.emailFieldError = _.get(
              this.localeObj,
              "tf_4_Checkout_guestDetails_emailReqError"
            );
          }
        }
        if (!this.isPhoneNumberValid) {
          if (this.phoneNumber !== "") {
            this.phoneNumberError = _.get(
              this.localeObj,
              "tf_4_Checkout_guestDetails_invalidPhoneNumberError"
            );
          } else {
            this.phoneNumberError = _.get(
              this.localeObj,
              "tf_4_Checkout_guestDetails_phoneNumberReqError"
            );
          }
        }
        if (!this.isCityValid) {
          if (this.city !== "") {
            this.cityFieldError = _.get(
              this.localeObj,
              "tf_4_Checkout_guestDetails_invalidCity"
            );
          } else {
            this.cityFieldError = _.get(
              this.localeObj,
              "tf_4_Checkout_guestDetails_cityReqError"
            );
          }
        }
        if (!this.isStateValid) {
          if (this.state !== "") {
            this.stateFieldError = _.get(
              this.localeObj,
              "tf_4_Checkout_guestDetails_invalidState"
            );
          } else {
            this.stateFieldError = _.get(
              this.localeObj,
              "tf_4_Checkout_guestDetails_stateReqError"
            );
          }
        }
        if (!this.isStreetAddress1Valid) {
          if (this.addressLine1 !== "") {
            this.addressLine1Error = _.get(
              this.localeObj,
              "tf_4_Checkout_guestDetails_invalidAddressLine1"
            );
          } else {
            this.addressLine1Error = _.get(
              this.localeObj,
              "tf_4_Checkout_guestDetails_addressLine1ReqError"
            );
          }
        }
        if (!this.isStreetAddress2Valid) {
          if (this.addressLine2 !== "") {
            this.addressLine2Error = _.get(
              this.localeObj,
              "tf_4_Checkout_guestDetails_invalidAddressLine2"
            );
          } else {
            this.addressLine2Error = _.get(
              this.localeObj,
              "tf_4_Checkout_guestDetails_addressLine2ReqError"
            );
          }
        }
        if (!this.isZipCodeValid) {
          if (this.zipCode !== "") {
            this.zipcodeFieldError = _.get(
              this.localeObj,
              "tf_4_Checkout_guestDetails_invalidZipCode"
            );
          } else {
            this.zipcodeFieldError = _.get(
              this.localeObj,
              "tf_4_Checkout_guestDetails_zipCodeReqError"
            );
          }
        }

        const guestDetailsValidationSettings = CommonUtility.getGuestDetailsValidationSettings(
          this.propertyInfo
        );
        this.displayTitle = guestDetailsValidationSettings.displayTitle;
        this.firstNameMaxLength =
          guestDetailsValidationSettings.firstNameMaxLength;
        this.lastNameMaxLength =
          guestDetailsValidationSettings.lastNameMaxLength;
        this.displayAddressLine1 =
          guestDetailsValidationSettings.displayAddressLine1;
        this.addressLine1MaxLength =
          guestDetailsValidationSettings.addressLine1MaxLength;
        this.displayAddressLine2 =
          guestDetailsValidationSettings.displayAddressLine2;
        this.addressLine2MaxLength =
          guestDetailsValidationSettings.addressLine2MaxLength;
        this.addressLine2Required =
          guestDetailsValidationSettings.addressLine2Required;
        this.displayState = guestDetailsValidationSettings.displayState;
        this.stateMaxLength = guestDetailsValidationSettings.stateMaxLength;
        this.stateRequired = guestDetailsValidationSettings.stateRequired;
        this.displayCity = guestDetailsValidationSettings.displayCity;
        this.cityMaxLength = guestDetailsValidationSettings.cityMaxLength;
        this.cityRequired = guestDetailsValidationSettings.cityRequired;
        this.displayZipcode = guestDetailsValidationSettings.displayZipcode;
        this.zipCodeMaxLength = guestDetailsValidationSettings.zipCodeMaxLength;
        this.zipCodeRequired = guestDetailsValidationSettings.zipCodeRequired;
        this.displayPhoneNumber =
          guestDetailsValidationSettings.displayPhoneNumber;
        this.phoneNumberMaxLength =
          guestDetailsValidationSettings.phoneNumberMaxLength;
        this.phoneNumberRequired =
          guestDetailsValidationSettings.phoneNumberRequired;
        this.emailMaxLength = guestDetailsValidationSettings.emailMaxLength;
        this.RTL_Flag = CommonUtility.langAlignCheck(this._storeSvc.getUserSettingsState().langObj.code, FeatureFlags);
      });

  // start  -  additional guest values
        this.displayAdditionalGuests();
  // End -  additional guest values

    let q;
    const basket = this.storeService.getBasketState() as IBasketState;
    if (
      basket.Rooms.length > 0 &&
      basket.Rooms[0] !== undefined &&
      basket.Rooms[0] !== null
    ) {
      if (
        basket.Rooms[0].GuestInfo !== undefined &&
        basket.Rooms[0].GuestInfo !== null
      ) {
        this.salutation = basket.Rooms[0].GuestInfo.salutation;
        this.firstName = basket.Rooms[0].GuestInfo.firstName;
        this.lastName = basket.Rooms[0].GuestInfo.lastName;
        this.countryName = basket.Rooms[0].GuestInfo.countryName;
        this.initialCountryValue = this.countryName;
        this.callingCode = basket.Rooms[0].GuestInfo.callingCode;
        this.countryCode = basket.Rooms[0].GuestInfo.countryCode;
        this.emailID = basket.Rooms[0].GuestInfo.emailAddress;
        this.phoneNumber = basket.Rooms[0].GuestInfo.phoneNumber;
        this.state = basket.Rooms[0].GuestInfo.state;
        this.city = basket.Rooms[0].GuestInfo.city;
        this.addressLine1 = basket.Rooms[0].GuestInfo.streetAddress1;
        this.addressLine2 = basket.Rooms[0].GuestInfo.streetAddress2;
        this.zipCode = basket.Rooms[0].GuestInfo.postalCode;
        $("#callCode").val(this.callingCode);
      } else {
        this.firstName = "";
        this.lastName = "";
        this.phoneNumber = "";
        this.emailID = "";
        this.salutation =
          this.displayTitle === true ? this.salutationList[0] : "";
        this.callingCode = this.countryDataList[192].callingCode;
        this.countryName =
          _.get(this.localeObj, this.countryDataList[192].countryCode_2) ||
          this.countryDataList[192].name;
        this.initialCountryValue = this.countryName;
        this.countryCode = _.get(this.countryDataList[192], "countryCode_2");
        this.state = "";
        this.city = "";
        this.addressLine1 = "";
        this.addressLine2 = "";
        this.zipCode = "";
      }
    }
    this.salutationOpened = false;
    this.isFirstNameValid = true;
    this.isLastNameValid = true;
    this.isMailValid = true;
    this.isPhoneNumberValid = true;
    this.isSalutationValid = true;
    this.isCityValid = true;
    this.isStateValid = true;
    this.isStreetAddress1Valid = true;
    this.isStreetAddress2Valid = true;
    this.isZipCodeValid = true;
    this.userCountry = _.get(
      this._storeSvc.getUserSettingsState(),
      "propertyInfo.clientCountry"
    );
    this.allowModification = _.get(
      this._storeSvc.getUserSettingsState(),
      "propertyInfo.allowModifyCustomerDetails"
    );
    this.isManageBookingFlow = this._storeSvc.getManageBookingFlowStatus();
    if (
      this.userCountry !== "" &&
      this.userCountry !== undefined &&
      basket.Rooms[0].GuestInfo === undefined &&
      !this.isManageBookingFlow
    ) {
      // q = _.find(COUNTRY_DATA_LIST, { 'name': this.userCountry });
      q = COUNTRY_DATA_LIST.find(
        (country) =>
          country.name.toUpperCase() === this.userCountry.toUpperCase()
      );
      if (q !== undefined) {
        this.callingCode = q.callingCode;
        this.countryCode = q.countryCode_2;
        this.countryName = _.get(this.localeObj, q.countryCode_3) || q.name;
        this.initialCountryValue = this.countryName;
        $("#callCode").val(this.callingCode);
        $("#callCode").trigger("keyup");
        $("#callCode").intlTelInput("setCountry", this.countryCode);
      }
    }

    this.resid = this._storeSvc.getReservationID();
    if (this.isManageBookingFlow) {
      this.mb_validFirstName = this.isNameValid("firstName");
      this.mb_validLastName = this.isNameValid("lastName");
      this.mb_validPhoneNum = this.isPhoneNumValid();
      this.mb_validEmail = this.isEmailValid("email");
      this.mb_validSalutation = true;
      if (
        _.get(
          this.storeService.getUserSettingsState(),
          "propertyInfo.propertyType"
        ) === "RVNG"
      ) {
        COUNTRY_DATA_LIST.find((country) => {
          if (
            this.countryName.length === 2 &&
            country.countryCode_2 === this.countryName
          ) {
            this.countryName = country.name;
          } else if (
            this.countryName.length === 3 &&
            country.countryCode_3 === this.countryName
          ) {
            this.countryName = country.name;
          }
        });
      }
      this.mb_validCountryName = this.countryName === "" ? false : true;
      if (this.countryName === "") {
        const countryName = _.get(
          this._storeSvc.getUserSettingsState(),
          "propertyInfo.clientCountry"
        );
        const countryList = COUNTRY_DATA_LIST.find(
          (country) =>
            country.name.toUpperCase() === this.userCountry.toUpperCase()
        );
        if (countryList !== undefined) {
          this.callingCode = countryList.callingCode;
          this.countryCode = countryList.countryCode_2;
          this.countryName = countryName;
          this.initialCountryValue = this.countryName;
        }
      }
      this.mb_validStateName = this.isNameValid("state");
      this.mb_validCityName = this.isNameValid("city");
      this.mb_validAddressLine1 = this.isNameValid("addressLine1");
      this.mb_validAddressLine2 = this.isNameValid("addressLine2");
      this.mb_validZipCode = this.isNameValid("zipCode");
    }
    if (!this.isManageBookingFlow) {
      const permanentStoreData = JSON.parse(
        localStorage.getItem("guestDetails")
      );
      GUEST_INFO_FORM_FIELDS.map((key) => {
        if (_.has(permanentStoreData, key)) {
          this[key] = _.get(permanentStoreData, key);
        }
      });
      if (!!_.get(permanentStoreData, "streetAddress1")) {
        this.addressLine1 = _.get(permanentStoreData, "streetAddress1");
      }
      if (!!_.get(permanentStoreData, "streetAddress2")) {
        this.addressLine2 = _.get(permanentStoreData, "streetAddress2");
      }
      if (!!_.get(permanentStoreData, "postalCode")) {
        this.zipCode = _.get(permanentStoreData, "postalCode");
      }
      if (!!_.get(permanentStoreData, "emailAddress")) {
        this.emailID = _.get(permanentStoreData, "emailAddress");
      }
      if (!!!_.get(permanentStoreData, "salutation")) {
        this.salutation =
          this.displayTitle === true ? this.salutationList[0] : "";
      }
    }

    COUNTRY_DATA_LIST.forEach((c) => {
      if (c.countryCode_2 === this.countryCode) {
        this.stateDataList = c.states;
      }
    });
  }

  setAdditionalGuestDefaults() {
    this.isAddGuestFirstNameValid.fill(true);
    this.isAddGuestLastNameValid.fill(true);
    this.isAddGuestFirstNameFieldError.fill('');
    this.isAddGuestLasttNameFieldError.fill('');
  }

  displayAdditionalGuests() {
    // this.toggleAddGuestsAddRemove = false;
    this.roomsCount = this.storeService.getBasketState().Rooms.length;
    this.addtionalGuestInfoByRoom = [];
    const adultsCnt = this.storeService.getBasketState().GuestSummary.guests[0].adults - 1; // basket room adultsCount-1
    this.isManageBookingFlow = this._storeSvc.getManageBookingFlowStatus();
    if ((this.roomsCount === 1 && adultsCnt === 0) || this.roomsCount > 1) {
     this.showAdditionalGuests = false;
    } else if (this.roomsCount === 1 && adultsCnt >= 1 ) {
     this.showAdditionalGuests = true;
     this.addtionalGuestInfoByRoom = [];
     let check = 0;

     const savedAdditionalGuestData = JSON.parse(localStorage.getItem("additionalGuestInfo"));
     for (let aCnt = 0; aCnt < adultsCnt ; aCnt ++) {
      const firstname = (
        !this.isManageBookingFlow
        ) ? ((!!savedAdditionalGuestData && !!savedAdditionalGuestData[aCnt]) ? savedAdditionalGuestData[aCnt].first_name : '')
          : (!!this.storeService.getBasketState().ManageRoomBooking.additionalGuests ?
          !!this.storeService.getBasketState().ManageRoomBooking.additionalGuests[aCnt] ? this.storeService.getBasketState().ManageRoomBooking.additionalGuests[aCnt].first_name : '' : '');
      const lastname = (
        !this.isManageBookingFlow
        ) ? ((!!savedAdditionalGuestData && !!savedAdditionalGuestData[aCnt]) ? savedAdditionalGuestData[aCnt].last_name : '')
          : (!!this.storeService.getBasketState().ManageRoomBooking.additionalGuests ?
          !!this.storeService.getBasketState().ManageRoomBooking.additionalGuests[aCnt] ? this.storeService.getBasketState().ManageRoomBooking.additionalGuests[aCnt].last_name : '' : '');
       if (this.isManageBookingFlow && (firstname !== '' || lastname !== '')) {
         check++;
       }
       this.addtionalGuestInfoByRoom.push({
         first_name: firstname,
         last_name: lastname
       });
      } // for loop
      // To auto-open the additional guests inputs
      this.toggleAddGuestsAddRemove = (this.isManageBookingFlow && check > 0) ? true : false;
   }
  }

  toggleAddtionalGuests(expand: boolean) {
    this.setAdditionalGuestDefaults();
    if (expand) {
      $("#Room1Guest2FirstName").focus();
      if (this.addtionalGuestInfoByRoom.length === 0) {
        this.displayAdditionalGuests();
      }
    } else {
      // If additional guests are removed in Managebooking flow - update store & localstorage
        const additionalGuestsInfo = JSON.parse(localStorage.getItem("additionalGuestInfo"));
        if (
            (additionalGuestsInfo !== null && additionalGuestsInfo.length > 0) ||
             this.addtionalGuestInfoByRoom.length > 0
          ) {
          this.addtionalGuestInfoByRoom = [];
          localStorage.setItem("additionalGuestInfo", JSON.stringify([]));
          this.storeService.updateRoomAddionalGuests([], 0);
        }

      $("#RemoveGuestRoom1").focus();
    }
    this.toggleAddGuestsAddRemove = expand;
    return false;
  }

  getAddtionalGuests() {
    return this.addtionalGuestInfoByRoom;
  }

  ngOnDestroy() {
    const subscriptionsList = [this._userSettingsSubscriptions];
    CommonUtility.removeSubscriptions(subscriptionsList);
  }

  onKeyPress(field: string, event: any) {
    if (
      field === "firstName" &&
      event.target.value.length >= this.firstNameMaxLength
    ) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (
      field === "lastName" &&
      event.target.value.length >= this.lastNameMaxLength
    ) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (field === "email" && event.target.value.length >= this.emailMaxLength) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (
      field === "phoneNumber" &&
      event.target.value.length >= this.phoneNumberMaxLength
    ) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (
      field === "addressLine1" &&
      event.target.value.length >= this.addressLine1MaxLength
    ) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (
      field === "addressLine2" &&
      event.target.value.length >= this.addressLine2MaxLength
    ) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (field === "city" && event.target.value.length >= this.cityMaxLength) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (field === "state" && event.target.value.length >= this.stateMaxLength) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (
      field === "zipCode" &&
      event.target.value.length >= this.zipCodeMaxLength
    ) {
      event.preventDefault();
      event.stopPropagation();
    }
  }
  onKeyUp(field: string) {
    if (field === "firstName" && this.isFirstNameValid) {
      if (
        this.firstName === "" ||
        this.firstName === undefined ||
        this.firstName === null
      ) {
        this.isFirstNameValid = false;
        if (this.localeObj) {
          this.fNameFieldError = _.get(
            this.localeObj,
            "tf_4_Checkout_guestDetails_firstNameReqError"
          );
        } else {
          this.fNameFieldError = GUEST_INFO_FORM_ERRORS.FIRST_NAME_REQUIRED;
        }
      } else {
        this.isFirstNameValid = true;
      }
    } else if (field === "lastName" && this.isLastNameValid) {
      if (
        this.lastName === "" ||
        this.lastName === undefined ||
        this.lastName === null
      ) {
        this.isLastNameValid = false;
        if (this.localeObj) {
          this.lNameFieldError = _.get(
            this.localeObj,
            "tf_4_Checkout_guestDetails_invalidLastNameError"
          );
        } else {
          this.lNameFieldError = GUEST_INFO_FORM_ERRORS.LAST_NAME_REQUIRED;
        }
      } else {
        this.isLastNameValid = true;
      }
    } else if (field === "email" && this.isMailValid) {
      if (
        this.emailID === "" ||
        this.emailID === undefined ||
        this.emailID === null
      ) {
        this.isMailValid = false;
        if (this.localeObj) {
          this.emailFieldError = _.get(
            this.localeObj,
            "tf_4_Checkout_guestDetails_emailReqError"
          );
        } else {
          this.emailFieldError = GUEST_INFO_FORM_ERRORS.EMAIL_REQUIRED;
        }
      } else {
        this.isMailValid = true;
      }
    } else if (field === "phoneNumber" && this.isPhoneNumberValid) {
      if (
        (this.phoneNumber === "" ||
          this.phoneNumber === undefined ||
          this.phoneNumber === null) &&
        this.phoneNumberRequired
      ) {
        this.isPhoneNumberValid = false;
        if (this.localeObj) {
          this.phoneNumberError = _.get(
            this.localeObj,
            "tf_4_Checkout_guestDetails_phoneNumberReqError"
          );
        } else {
          this.phoneNumberError = GUEST_INFO_FORM_ERRORS.PHONE_NUMBER_REQUIRED;
        }
      } else {
        this.isPhoneNumberValid = true;
      }
    } else if (field === "zipCode" && this.isZipCodeValid) {
      this.zipCode = this.zipCode.trim();
      if (
        (this.zipCode === "" ||
          this.zipCode === undefined ||
          this.zipCode === null) &&
        this.zipCodeRequired
      ) {
        this.isZipCodeValid = false;
        if (this.localeObj) {
          this.zipcodeFieldError = _.get(
            this.localeObj,
            "tf_4_Checkout_guestDetails_zipCodeReqError"
          );
        } else {
          this.zipcodeFieldError = GUEST_INFO_FORM_ERRORS.ZIP_CODE_REQUIRED;
        }
      } else {
        this.isZipCodeValid = true;
      }
    } else if (field === "state") {
      if (
        (this.state === "" ||
          this.state === undefined ||
          this.state === null) &&
        this.stateRequired
      ) {
        this.isStateValid = false;
        if (this.localeObj) {
          this.stateFieldError = _.get(
            this.localeObj,
            "tf_4_Checkout_guestDetails_stateReqError"
          );
        } else {
          this.stateFieldError = GUEST_INFO_FORM_ERRORS.STATE_REQUIRED;
        }
      } else {
        this.isStateValid = true;
      }
    } else if (field === "addressLine1") {
      if (
        this.addressLine1.trim() === "" ||
        this.addressLine1 === undefined ||
        this.addressLine1 === null
      ) {
        this.isStreetAddress1Valid = false;
        if (this.localeObj) {
          this.addressLine1Error = _.get(
            this.localeObj,
            "tf_4_Checkout_guestDetails_addressLine1ReqError"
          );
        } else {
          this.addressLine1Error =
            GUEST_INFO_FORM_ERRORS.ADDRESS_LINE1_REQUIRED;
        }
      } else {
        this.isStreetAddress1Valid = true;
      }
    } else if (field === "addressLine2") {
      if (
        (this.addressLine2.trim() === "" ||
          this.addressLine2 === undefined ||
          this.addressLine2 === null) &&
        this.addressLine2Required
      ) {
        this.isStreetAddress2Valid = false;
        if (this.localeObj) {
          this.addressLine2Error = _.get(
            this.localeObj,
            "tf_4_Checkout_guestDetails_addressLine2ReqError"
          );
        } else {
          this.addressLine2Error =
            GUEST_INFO_FORM_ERRORS.ADDRESS_LINE2_REQUIRED;
        }
      } else {
        this.isStreetAddress2Valid = true;
      }
    } else if (field === "city") {
      if (
        (this.city === "" || this.city === undefined || this.city === null) &&
        this.cityRequired
      ) {
        this.isCityValid = false;
        if (this.localeObj) {
          this.cityFieldError = _.get(
            this.localeObj,
            "tf_4_Checkout_guestDetails_cityReqError"
          );
        } else {
          this.cityFieldError = GUEST_INFO_FORM_ERRORS.CITY_REQUIRED;
        }
      } else {
        this.isCityValid = true;
      }
    }
  }

  isNameValid(field: string) {
    if (field === "firstName") {
      if (
        this.firstName === "" ||
        this.firstName === null ||
        this.firstName === undefined
      ) {
        if (this.localeObj) {
          this.fNameFieldError = _.get(
            this.localeObj,
            "tf_4_Checkout_guestDetails_firstNameReqError"
          );
        } else {
          this.fNameFieldError = GUEST_INFO_FORM_ERRORS.FIRST_NAME_REQUIRED;
        }
        this.isFirstNameValid = false;
        return false;
      } else {
        this.isFirstNameValid = true;
      }
    } else if (field === "lastName") {
      if (
        this.lastName === "" ||
        this.lastName === null ||
        this.lastName === undefined
      ) {
        if (this.localeObj) {
          this.lNameFieldError = _.get(
            this.localeObj,
            "tf_4_Checkout_guestDetails_lastNameReqError"
          );
        } else {
          this.lNameFieldError = GUEST_INFO_FORM_ERRORS.LAST_NAME_REQUIRED;
        }
        this.isLastNameValid = false;
        return false;
      } else {
      this.isLastNameValid = true;
      }
    } else if (field === "zipCode") {
      if (this.zipCodeRequired && this.displayZipcode) {
        if (
          this.zipCode.trim() === "" ||
          this.zipCode === null ||
          this.zipCode === undefined
        ) {
          if (this.localeObj) {
            this.zipcodeFieldError = _.get(
              this.localeObj,
              "tf_4_Checkout_guestDetails_zipCodeReqError"
            );
          } else {
            this.zipcodeFieldError = GUEST_INFO_FORM_ERRORS.ZIP_CODE_REQUIRED;
          }
          this.isZipCodeValid = false;
          return false;
        } else {
        this.isZipCodeValid = true;
        }
      } else if (this.isManageBookingFlow) {
        this.isZipCodeValid = true;
      }
    } else if (field === "state") {
      if (this.stateRequired && this.displayState) {
        if (
          this.state === "" ||
          this.state === undefined ||
          this.state === null
        ) {
          this.isStateValid = false;
          if (this.localeObj) {
            this.stateFieldError = _.get(
              this.localeObj,
              "tf_4_Checkout_guestDetails_stateReqError"
            );
          } else {
            this.stateFieldError = GUEST_INFO_FORM_ERRORS.STATE_REQUIRED;
          }
          this.isStateValid = false;
          return false;
        } else {
          this.isStateValid = true;
        }
      } else if (this.isManageBookingFlow) {
        this.isStateValid = true;
      }
    } else if (field === "city") {
      if (this.cityRequired && this.displayCity) {
        if (this.city === "" || this.city === undefined || this.city === null) {
          this.isCityValid = false;
          if (this.localeObj) {
            this.cityFieldError = _.get(
              this.localeObj,
              "tf_4_Checkout_guestDetails_cityReqError"
            );
          } else {
            this.cityFieldError = GUEST_INFO_FORM_ERRORS.CITY_REQUIRED;
          }
          this.isCityValid = false;
          return false;
        } else {
          this.isCityValid = true;
        }
      } else if (this.isManageBookingFlow) {
        this.isCityValid = true;
      }
    } else if (field === "addressLine1") {
      if (this.displayAddressLine1) {
        if (
          this.addressLine1.trim() === "" ||
          this.addressLine1 === undefined ||
          this.addressLine1 === null
        ) {
          this.isStreetAddress1Valid = false;
          if (this.localeObj) {
            this.addressLine1Error = _.get(
              this.localeObj,
              "tf_4_Checkout_guestDetails_addressLine1ReqError"
            );
          } else {
            this.addressLine1Error =
              GUEST_INFO_FORM_ERRORS.ADDRESS_LINE1_REQUIRED;
          }
          return false;
        } else {
          this.isStreetAddress1Valid = true;
        }
      } else if (this.isManageBookingFlow) {
        this.isStreetAddress1Valid = true;
      }
    } else if (field === "addressLine2") {
      if (this.addressLine2Required && this.displayAddressLine2) {
        if (
          this.addressLine2.trim() === "" ||
          this.addressLine2 === undefined ||
          this.addressLine2 === null
        ) {
          this.isStreetAddress2Valid = false;
          if (this.localeObj) {
            this.addressLine2Error = _.get(
              this.localeObj,
              "tf_4_Checkout_guestDetails_addressLine2ReqError"
            );
          } else {
            this.addressLine2Error =
              GUEST_INFO_FORM_ERRORS.ADDRESS_LINE2_REQUIRED;
          }
          return false;
        } else {
          this.isStreetAddress2Valid = true;
        }
      } else if (this.isManageBookingFlow) {
        this.isStreetAddress2Valid = true;
      }
    }
    return true;
  }

  onCountrySelected(country: any) {
    const countryToSet = this.countryDataList.find((c) => {
      return c.countryCode_2 === country.countryCode;
    });
    if (countryToSet !== undefined || countryToSet !== null) {
      this.callingCode = countryToSet.callingCode;
      this.countryCode = countryToSet.countryCode_2;
      this.countryName =
        _.get(this.localeObj, countryToSet.countryCode_3) || countryToSet.name;
      this.initialCountryValue = this.countryName;
      COUNTRY_DATA_LIST.forEach((c) => {
        if (c.countryCode_2 === this.countryCode) {
          this.state = "";
          this.stateDataList = c.states;
        }
      });
      $("#callCode").val(this.callingCode);
      $("#callCode").trigger("keyup");
      $("#callCode").intlTelInput("setCountry", this.countryCode);
      setTimeout(() => {
        $(
          ".ng-select.ng-select.ng-select-single.ng-select-filtered:not(.ng-select-opened) .ng-select-container.ng-has-value .ng-value-container .ng-value"
        ).css("visibility", "visible");
      }, 100);
    }
    this.getGuestFormData();
  }

  // Checks for empty or invalid country name and sets it to the initial/updated value
  @HostListener("document:click", ["$event"]) clickedOutside($event) {
    if (!!!this.countryName) {
      this.countryName = this.initialCountryValue;
    }
  }

  onStateSelected(event) {
    this.state = event.name;
    this.isStateValid = true;
  }

  onPhoneCodeSelected(countryData: any) {
    this.callingCode = countryData.callingCode;
    if (countryData.callingCode.length === 4) {
      const item = document.querySelectorAll(".country-icon");
      if (item.length !== 0) {
        item[0].classList.remove("country-icon");
        item[0].classList.add("country-small-icon");
      }
    } else {
      const item = document.querySelectorAll(".country-small-icon");
      if (item.length !== 0) {
        item[0].classList.remove("country-small-icon");
        item[0].classList.add("country-icon");
      }
    }
  }

  isPhoneNumValid() {
    if (
      this.phoneNumber === "" ||
      this.phoneNumber === undefined ||
      this.phoneNumber === null
    ) {
      this.isPhoneNumberValid = false;
      if (this.localeObj) {
        this.phoneNumberError = _.get(
          this.localeObj,
          "tf_4_Checkout_guestDetails_phoneNumberReqError"
        );
      } else {
        this.phoneNumberError = GUEST_INFO_FORM_ERRORS.PHONE_NUMBER_REQUIRED;
      }
      return false;
    } else if (!/^([0-9]+)$/.test(this.phoneNumber)) {
      this.isPhoneNumberValid = false;
      if (this.localeObj) {
        this.phoneNumberError = _.get(
          this.localeObj,
          "tf_4_Checkout_guestDetails_invalidPhoneNumberError"
        );
      } else {
        this.phoneNumberError = GUEST_INFO_FORM_ERRORS.PHONE_INVALID;
      }
      return false;
    } else {
      this.isPhoneNumberValid = true;
      return true;
    }
  }

  isEmailValid(field: string) {
    // tslint:disable-next-line:max-line-length
    const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (
      this.emailID === "" ||
      this.emailID === null ||
      this.emailID === undefined
    ) {
      this.isMailValid = false;
      if (this.localeObj) {
        this.emailFieldError = _.get(
          this.localeObj,
          "tf_4_Checkout_guestDetails_emailReqError"
        );
      } else {
        this.emailFieldError = GUEST_INFO_FORM_ERRORS.EMAIL_REQUIRED;
      }
      return false;
    } else if (!emailCharactersRegex.test(this.emailID)) {
      if (this.localeObj) {
        this.emailFieldError = _.get(
          this.localeObj,
          "tf_4_Checkout_guestDetails_onlyEnglishChars"
        );
      } else {
        this.emailFieldError = GUEST_INFO_FORM_ERRORS.EMAIL_VAILDATE;
      }
      this.isMailValid = false;
      this.emailID = this.emailID.replace(/[^\u0000-\u007F]+/g, "");
      return false;
    } else if (!emailRegex.test(this.emailID)) {
      if (this.localeObj) {
        this.emailFieldError = _.get(
          this.localeObj,
          "tf_4_Checkout_guestDetails_invalidEmailError"
        );
      } else {
        this.emailFieldError = GUEST_INFO_FORM_ERRORS.EMAIL_INVALID;
      }
      this.isMailValid = false;
      return false;
    } else {
      this.isMailValid = true;
      return true;
    }
  }

  checkTypedCharacters(event) {
    const charactersTyped = event.key;
    this.checkEmailCharacters(event, charactersTyped);
  }

  checkPastedCharacters(event) {
    const clipboardData =
      event.clipboardData || _.get(window, "clipboardData") || "";
    const text = clipboardData !== "" ? clipboardData.getData("text") : "";
    this.checkEmailCharacters(event, text);
  }

  checkEmailCharacters(event, text) {
    if (!emailCharactersRegex.test(text) || event.keyCode === 229) {
      if (this.localeObj) {
        this.emailFieldError = _.get(
          this.localeObj,
          "tf_4_Checkout_guestDetails_onlyEnglishChars"
        );
      } else {
        this.emailFieldError = GUEST_INFO_FORM_ERRORS.EMAIL_VAILDATE;
      }
      this.isMailValid = false;
      event.preventDefault();
      event.stopPropagation();
      // if ( event.keyCode === 229 && event.key === ' ') {
      //   this.emailID = this.emailID.replace(/[^\u0000-\u007F]+/g , '');
      // }
    } else {
      this.emailFieldError = "";
      this.isMailValid = true;
    }
  }

  // isAddtionalGuestNameValid(field, val, indx) {
  //   if (!!val) {
  //     if (field === "firstName") {
  //         this.isAddGuestFirstNameValid[indx] = true;
  //         return true;
  //       }
  //     if (field === "lastName") {
  //       this.isAddGuestLastNameValid[indx] = true;
  //       return true;
  //       }
  //   } else {
  //     return true;
  //   }
  // }

  // showAddGuestsInfoErrors() {
  //  if (
  //     this.displayAdditionalGuestsConfig &&
  //     this.showAdditionalGuests &&
  //     this.addtionalGuestInfoByRoom.length > 1
  //     ) {
  //     this.addtionalGuestInfoByRoom.forEach(
  //       (
  //         element: any,
  //         index: number
  //       ) => {
  //             if (!!element.first_name) {
  //               this.isAddGuestFirstNameValid[index] = false;
  //               if (this.localeObj) {
  //                 this.isAddGuestFirstNameFieldError[index] = _.get(
  //                   this.localeObj,
  //                   "tf_4_Checkout_guestDetails_invalidFirstNameError"
  //                 );
  //               } else {
  //                 this.isAddGuestFirstNameFieldError[index] = GUEST_INFO_FORM_ERRORS.FIRST_NAME_INVALID;
  //               }
  //             } else {
  //               this.isAddGuestFirstNameValid[index] = true;
  //               this.isAddGuestFirstNameFieldError[index] = '';
  //             }

  //             if (!!element.last_name) {
  //               this.isAddGuestLastNameValid[index] = false;
  //               if (this.localeObj) {
  //                 this.isAddGuestLasttNameFieldError[index] = _.get(
  //                   this.localeObj,
  //                   "tf_4_Checkout_guestDetails_invalidLastNameError"
  //                 );
  //               } else {
  //                 this.isAddGuestLasttNameFieldError[index] = GUEST_INFO_FORM_ERRORS.LAST_NAME_INVALID;
  //               }
  //             } else {
  //               this.isAddGuestLastNameValid[index] = true;
  //               this.isAddGuestLasttNameFieldError[index] = '';
  //             }
  //     }); // end foreach
  //  }
  // }

  showValidationErrors(guestData: any) {
    if (guestData.firstName === undefined || guestData.firstName === "") {
      this.isFirstNameValid = false;
      if (this.localeObj) {
        this.fNameFieldError = _.get(
          this.localeObj,
          "tf_4_Checkout_guestDetails_firstNameReqError"
        );
      } else {
        this.fNameFieldError = GUEST_INFO_FORM_ERRORS.FIRST_NAME_REQUIRED;
      }
    }
    if (guestData.lastName === undefined || guestData.lastName === "") {
      this.isLastNameValid = false;
      if (this.localeObj) {
        this.lNameFieldError = _.get(
          this.localeObj,
          "tf_4_Checkout_guestDetails_lastNameReqError"
        );
      } else {
        this.lNameFieldError = GUEST_INFO_FORM_ERRORS.LAST_NAME_REQUIRED;
      }
    }
    if (guestData.emailAddress === undefined || guestData.emailAddress === "") {
      this.isMailValid = false;
      if (this.localeObj) {
        this.emailFieldError = _.get(
          this.localeObj,
          "tf_4_Checkout_guestDetails_emailReqError"
        );
      } else {
        this.emailFieldError = GUEST_INFO_FORM_ERRORS.ZIP_CODE_REQUIRED;
      }
    } else if (!emailCharactersRegex.test(guestData.emailAddress)) {
      this.isMailValid = false;
      if (this.localeObj) {
        this.emailFieldError = _.get(
          this.localeObj,
          "tf_4_Checkout_guestDetails_onlyEnglishChars"
        );
      } else {
        this.emailFieldError = GUEST_INFO_FORM_ERRORS.ZIP_CODE_INVALID;
      }
    }
    if (this.phoneNumberRequired && this.displayPhoneNumber) {
      if (guestData.phoneNumber === undefined || guestData.phoneNumber === "") {
        this.isPhoneNumberValid = false;
        if (this.localeObj) {
          this.phoneNumberError = _.get(
            this.localeObj,
            "tf_4_Checkout_guestDetails_phoneNumberReqError"
          );
        } else {
          this.phoneNumberError = GUEST_INFO_FORM_ERRORS.PHONE_NUMBER_REQUIRED;
        }
      }
    }
    if (this.stateRequired && this.displayState) {
      if (
        guestData.state === undefined ||
        guestData.state === "" ||
        guestData.state === null
      ) {
        this.isStateValid = false;
        if (this.localeObj) {
          this.stateFieldError = _.get(
            this.localeObj,
            "tf_4_Checkout_guestDetails_stateReqError"
          );
        } else {
          this.stateFieldError = GUEST_INFO_FORM_ERRORS.STATE_REQUIRED;
        }
      }
    }
    if (this.cityRequired && this.displayCity) {
      if (
        guestData.city === undefined ||
        guestData.city === "" ||
        guestData.city === null
      ) {
        this.isCityValid = false;
        if (this.localeObj) {
          this.cityFieldError = _.get(
            this.localeObj,
            "tf_4_Checkout_guestDetails_cityReqError"
          );
        } else {
          this.cityFieldError = GUEST_INFO_FORM_ERRORS.CITY_REQUIRED;
        }
      }
    }
    if (this.displayAddressLine1) {
      if (
        guestData.streetAddress1 === undefined ||
        guestData.streetAddress1 === "" ||
        guestData.streetAddress1 === null
      ) {
        this.isStreetAddress1Valid = false;
        if (this.localeObj) {
          this.addressLine1Error = _.get(
            this.localeObj,
            "tf_4_Checkout_guestDetails_addressLine1ReqError"
          );
        } else {
          this.addressLine1Error =
            GUEST_INFO_FORM_ERRORS.ADDRESS_LINE1_REQUIRED;
        }
      }
    }
    if (this.addressLine2Required && this.displayAddressLine2) {
      if (
        guestData.streetAddress2 === undefined ||
        guestData.streetAddress2 === "" ||
        guestData.streetAddress2 === null
      ) {
        this.isStreetAddress2Valid = false;
        if (this.localeObj) {
          this.addressLine2Error = _.get(
            this.localeObj,
            "tf_4_Checkout_guestDetails_addressLine2ReqError"
          );
        } else {
          this.addressLine2Error =
            GUEST_INFO_FORM_ERRORS.ADDRESS_LINE2_REQUIRED;
        }
      }
    }
    if (this.zipCodeRequired && this.displayZipcode) {
      if (guestData.postalCode === undefined || guestData.postalCode === "") {
        this.isZipCodeValid = false;
        if (this.localeObj) {
          this.zipcodeFieldError = _.get(
            this.localeObj,
            "tf_4_Checkout_guestDetails_zipCodeReqError"
          );
        } else {
          this.zipcodeFieldError = GUEST_INFO_FORM_ERRORS.ZIP_CODE_REQUIRED;
        }
      }
    }
  }

  updateSalType(salType: string) {
    this.salutation = salType;
  }

  resetPreferences(event: any) {
    if (event === -1) {
      this.guestPreferences.preferencesAPI();
    } else {
      this.guestPreferences.resetRoomPreferences(event);
    }
  }

  validatePreferences() {
    if (this.showPref) {
      const flag = this.guestPreferences.validateGuestPreferences();
      return flag;
    } else {
      return -1;
    }
  }

  getMultiRoomAdditionalGuests() {
    if (this.showPref) {
      return this.guestPreferences.addtionalGuestInfoByRoom;
    } else {
      return [];
    }
  }

  // showMutiRoomGuestsValidationErrors() {
  //   if (this.showPref) {
  //     return this.guestPreferences.showMultiRoomAddGuestsInfoErrors();
  //   } else {
  //     return [];
  //   }
  // }

  getGuestFormData() {
    const guestInfo = new GuestInfoDetails();
    guestInfo.firstName = this.firstName;
    guestInfo.lastName = this.lastName;
    guestInfo.phoneNumber = this.phoneNumber;
    if (this.phoneNumberRequired && this.displayPhoneNumber) {
      guestInfo.phoneNumber = this.phoneNumber;
    } else {
      if (
        guestInfo.phoneNumber === null ||
        guestInfo.phoneNumber === undefined ||
        guestInfo.phoneNumber === ""
      ) {
        guestInfo.phoneNumber = null;
      } else {
        guestInfo.phoneNumber = this.phoneNumber;
      }
    }
    const countryToSet = this.countryDataList.find((c) => {
      // if (c.countryCode_2 === this.countryCode && c.states !== undefined) {
      //   c.states.find((stateCode) => {
      //     if (stateCode.name === this.state) {
      //       this.state = stateCode.code;
      //     }
      //   });
      // }
      return c.countryCode_2 === this.countryCode;
    });
    guestInfo.emailAddress = this.emailID;
    guestInfo.countryCode = this.countryCode;
    guestInfo.salutation = this.displayTitle === true ? this.salutation : "";
    guestInfo.callingCode = $("#callCode").val();
    guestInfo.countryName = countryToSet.name;
    if (this.stateRequired && this.displayState) {
      guestInfo.state = this.state;
    } else {
      if (
        this.state === null ||
        this.state === undefined ||
        this.state === ""
      ) {
        guestInfo.state = null;
      } else {
        guestInfo.state = this.state;
      }
    }
    if (this.cityRequired && this.displayCity) {
      guestInfo.city = this.city;
    } else {
      if (this.city === null || this.city === undefined || this.city === "") {
        guestInfo.city = null;
      } else {
        guestInfo.city = this.city;
      }
    }
    if (this.displayAddressLine1) {
      guestInfo.streetAddress1 = this.addressLine1;
    } else {
      if (
        this.addressLine1 === null ||
        this.addressLine1 === undefined ||
        this.addressLine1 === ""
      ) {
        guestInfo.streetAddress1 = null;
      } else {
        guestInfo.streetAddress1 = this.addressLine1;
      }
    }
    if (this.addressLine2Required && this.displayAddressLine2) {
      guestInfo.streetAddress2 = this.addressLine2;
    } else {
      if (
        this.addressLine2 === null ||
        this.addressLine2 === undefined ||
        this.addressLine2 === ""
      ) {
        guestInfo.streetAddress2 = null;
      } else {
        guestInfo.streetAddress2 = this.addressLine2;
      }
    }
    if (this.zipCodeRequired && this.displayZipcode) {
      guestInfo.postalCode = this.zipCode;
    } else {
      if (
        this.zipCode === "" ||
        this.zipCode === null ||
        this.zipCode === undefined
      ) {
        guestInfo.postalCode = null;
      } else {
        guestInfo.postalCode = this.zipCode;
      }
    }
    return guestInfo;
  }


  getGuestPreferences(roomID?: number) {
    if (roomID === undefined) {
      roomID = 0;
    }
    let gPreference;
    if (this.showPref) {
      gPreference = this.guestPreferences.guestPreferenceData(roomID);
    }
    return gPreference;
  }

  setAdditionalGuests(roomID?: number) {
    if (roomID === undefined) {
      roomID = 0;
    }

    let additionalGuests: any;
    additionalGuests = this.guestPreferences.getAdditionalGuestsByRooom(roomID);
    return additionalGuests;
  }
}
