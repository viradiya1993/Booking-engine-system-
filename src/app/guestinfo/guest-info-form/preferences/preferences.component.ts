import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from "@angular/core";
import { Router } from "@angular/router";
import * as _ from "lodash";
import { Subscription } from "rxjs";
import { CommonUtility } from "src/app/common/common.utility";
import { environment } from "../../../../environments/environment";
import {
  GUEST_INFO_FORM_ERRORS,
  PREFERENCES_TYPES,
  QUERY_PARAM_ATTRIBUTES,
  showPreferences,
  STRING_REGEX,
  TIME_PREFERENCE,
  URL_PATHS
} from "../../../common/common.constants";
import {
  GuestPreferences,
  MultiRoomGuestPreference,
} from "../../../common/models/preferences.model";
import { ManageBookingService } from "../../../common/services/manage-booking.service";
import { StoreService } from "../../../common/services/store.service";

@Component({
  selector: "app-preferences",
  templateUrl: "./preferences.component.html",
  styleUrls: ["./preferences.component.scss"],
})
export class PreferencesComponent implements OnInit, OnDestroy {
  isExpectedTime: boolean;
  expectedTime: any;
  expectedTimeabbvr: string;
  occasion: string;
  opt: string;
  occasionSelect: boolean;
  roomPreference = [];

  prefNameFieldError: string;
  expectedTimesList: any;
  localeObj: any;
  mDDSettings: any;
  los: any;
  rooms: any;
  selectedPreference = new Array<MultiRoomGuestPreference>();
  count: number;
  preferencesData: any;
  defaultPreferencesData: any;
  showDoneBtn: boolean;
  validationFailure: boolean;
  showPref = showPreferences;
  sameSubtypeAndViewTypeFlag = true;
  previousPreferenceData: any;
  preferenceAPIResponse: any;
  guestPreferenceDisclaimer: string;
  AM_PM_obj: any;
  @Input("source") source: string;
  @Input("roomIndex") roomIndex: number;
  @Input("bookingRef") bookingRef: string;
  @Input("guestdetailsString") guestdetailsString = [];
  @Output() changePreferencesClose = new EventEmitter();
  RoomType: string;
  ViewType: string;
  BedTypeName: string;
  AdultsCount: number;
  ChildrenCount: number;
  isManageBookingCriticalModifyFlow = false;
  isSatisfiesCriticalModifyFlowChecks = false;
  isRT4ModifyFlowEnabled: boolean;
  private _userSettingsSubscriptions: Subscription;
  private _sharedDataSubscription: Subscription;
  private getPreferencesSubscription: Subscription;
  private changePreferencesSubscription: Subscription;
  preferenceErrorMessage: any;
  isValidText: boolean;

  roomsCount: number;
  showAdditionalGuests = [];
  toggleAddGuestsAddRemove = [];
  addtionalGuestInfoByRoom = [];
  propertyInfo: any;
  displayAdditionalGuests = false;
  isAddGuestFirstNameValid = [];
  isAddGuestLastNameValid = [];
  isAddGuestFirstNameFieldError = [];
  isAddGuestLasttNameFieldError = [];
  isManageBookingFlow: boolean;

  constructor(
    private storeService: StoreService,
    private manageBookingService: ManageBookingService,
    private router: Router
  ) {}

  ngOnInit() {
    this.guestPreferenceDisclaimer = "";
    this.validationFailure = true;
    this.isRT4ModifyFlowEnabled = environment.rt4_modify_flow;
    if (this.source === "confirmation") {
      this.showDoneBtn = true;
    } else {
      this.showDoneBtn = false;
    }
    this._userSettingsSubscriptions = this.storeService
      .getUserSettings()
      .subscribe((sharedData) => {
        this.localeObj = sharedData.localeObj;
        this.propertyInfo = sharedData.propertyInfo;
        this.displayAdditionalGuests = this.propertyInfo.displayAdditionalGuestNames;
        this.AM_PM_obj = {
          AM: this.localeObj["tf_Generic_AM"],
          PM: this.localeObj["tf_Generic_PM"],
        };
      });
    const basketState = this.storeService.getBasketState();
    this.rooms = _.get(basketState, "Rooms");
    this.los = _.get(basketState.GuestSummary, "los");
    if (this.source === undefined && !!this.bookingRef) {
      this.isManageBookingCriticalModifyFlow = true;
    }
    this.preferencesAPI();
    if (this.roomIndex !== undefined) {
      this.RoomType = this.rooms[this.roomIndex].RoomDetails.roomType;
      this.ViewType = this.rooms[this.roomIndex].RoomDetails.roomView;
      this.BedTypeName = this.rooms[this.roomIndex].BedTypeName;
    }
    this.setInitialAdditionalGuests();
  }

  setInitialAdditionalGuests() {
    const roomCnt = this.rooms.length;
    if (roomCnt > 1 && this.displayAdditionalGuests) {
      this.toggleAddGuestsAddRemove.fill(false);
      for (let j = 0; j < roomCnt; j++) {
        const guestAddtional = this.setAdditionalGuestsByRooom(j);
        this.setAdditionalGuestDefaults(j);
      }
    } else {
      this.toggleAddGuestsAddRemove.fill(false);
    }
  }

  setAdditionalGuestDefaults(roomID) {
    this.isAddGuestFirstNameValid[roomID] = [];
    this.isAddGuestLastNameValid[roomID] = [];
    this.isAddGuestFirstNameFieldError[roomID] = [];
    this.isAddGuestLasttNameFieldError[roomID] = [];
    this.isAddGuestFirstNameValid[roomID].fill(true);
    this.isAddGuestLastNameValid[roomID].fill(true);
    this.isAddGuestFirstNameFieldError[roomID].fill('');
    this.isAddGuestLasttNameFieldError[roomID].fill('');
  }

  toggleAddtionalGuests(roomID, isRemoveGuest?: boolean) {
    this.setAdditionalGuestDefaults(roomID);
    this.toggleAddGuestsAddRemove[roomID] = !this.toggleAddGuestsAddRemove[roomID];
    if (isRemoveGuest) {
      this.resetAdditionalGuestInputs(roomID);
    }
    return false;
  }

  getAddtionalGuests() {
    return this.addtionalGuestInfoByRoom;
  }

  ngOnDestroy() {
    const subscriptionsList = [
      this._sharedDataSubscription,
      this._userSettingsSubscriptions,
      this.getPreferencesSubscription,
      this.changePreferencesSubscription,
    ];
    CommonUtility.removeSubscriptions(subscriptionsList);
  }

  checkBlankSpaceValidation(optionValues, prefObject: any) {
    const selected_optionValues = optionValues.trim();
    this.preferenceErrorMessage = this.localeObj.tf_4_Checkout_preferences_preferenceReqError;
    if (prefObject.requiredObj.require) {
      if (selected_optionValues === "") {
        prefObject.requiredObj.showReqError = true;
      }
      if (selected_optionValues !== "") {
        prefObject.requiredObj.showReqError = false;
      }
    } else {
      prefObject.requiredObj.showReqError = false;
    }
  }

  updateTime(i: number, opt: any, qID: string) {
    this.preferencesData[i].forEach((ele) => {
      if (ele["questionID"] === qID && ele["preferenceType"] === "time") {
        ele["requiredObj"].changed = true;
        ele["selected_time_str"] = opt.time; // + ' ' + _.findKey(this.AM_PM_obj, (value) => value === ele.selected_am_pm);
        ele["selected_time"] = opt;
        ele["selected_optionValues"] = opt.text;
      }
    });
  }

  updateTimeAMPM(i: number, am_pm_opt: string, qID: string) {
    this.preferencesData[i].forEach((ele) => {
      if (ele["questionID"] === qID && ele["preferenceType"] === "time") {
        const currSelectedTimeObj = ele["selected_time"];
        ele["selected_am_pm"] = am_pm_opt;
        ele["requiredObj"].changed = true;
        ele["timeOptArr"] = [];
        let index = 0;
        let prevTimeValueIndex = -1;
        ele["options"].forEach((el) => {
          if (el.am_pm === am_pm_opt) {
            const opt = el.hour + ":" + el.minute;
            if (opt === currSelectedTimeObj.time) {
              prevTimeValueIndex = index;
            }
            ele["timeOptArr"][index] = {
              time: opt,
              id: el.optionID,
              text: el.optionValue,
            };
            index++;
          }
        });
        let timeOptIndex = 0;
        if (prevTimeValueIndex > -1) {
          timeOptIndex = prevTimeValueIndex;
        }
        ele["selected_time"] = ele["timeOptArr"][timeOptIndex];
        ele["selected_time_str"] =
          ele["timeOptArr"][timeOptIndex].time +
          " " +
          _.findKey(this.AM_PM_obj, (value) => value === ele.selected_am_pm);
        ele["selected_optionValues"] = ele["timeOptArr"][timeOptIndex].text;
      }
    });
  }

  updatePreQuestionData(
    i: number,
    preference: any,
    selectedPreOption: any,
    preQuestionID: string
  ) {
    preference["selected_preOptionID"] = selectedPreOption.optionId;
    preference["selected_preOptionValue"] = selectedPreOption.optionLabel;
    preference["selected_showMainQuestionValue"] =
      selectedPreOption.isPreQuestionOptionToShowMainQuestion;
    this.preferencesData[i].forEach((pref) => {
      if (pref["preQuestionId"] === preQuestionID) {
        pref["selected_preOptionID"] = preference["selected_preOptionID"];
        pref["selected_preOptionValue"] = preference["selected_preOptionValue"];
        pref["selected_showMainQuestionValue"] =
          preference["selected_showMainQuestionValue"];
        if (pref["selected_showMainQuestionValue"]) {
          if (
            pref["selected_optionValues"] &&
            pref["selected_optionValues"].length > 0 &&
            pref["selected_optionID"].length > 0
          ) {
            pref["requiredObj"].changed = true;
          } else {
            pref["requiredObj"].changed = false;
          }
        } else {
          pref["requiredObj"].changed = true;
        }
      }
    });
  }

  updateSingleSelect(i: number, qID: number, opt: any) {
    this.preferencesData[i].forEach((ele) => {
      if (
        ele["questionID"] === qID &&
        ele["questionType"] === PREFERENCES_TYPES.SINGLE
      ) {
        ele["selected_optionValues"] = opt.optionValue;
        ele["selected_optionID"] = opt.optionId;
        ele["requiredObj"].changed = true;
      }
    });
  }

  onMultiDropDownItemSelect(event: any, qID: string, i: number) {
    // const el = <HTMLInputElement>event.target;
    if(event.length === 0 && !event[0]) {
      this.onMultiDropDownItemDeSelect(event, qID, i);
    }
    this.preferencesData[i].forEach((ele) => {
      if (
        ele["questionID"] === qID &&
        ele["questionType"] === PREFERENCES_TYPES.MULTIPLE
      ) {
        const optID = ele["selected_optionID"];
        if (
          optID === "" ||
          optID === [] ||
          optID.length === 0 ||
          optID === null ||
          optID === undefined
        ) {
          ele["selected_optionID"] = [];
          if (event[0]) {
            event.forEach(option => {
              ele["selected_optionID"][0] = _.get(option, "optionId");
            });
          }
        } else if (event[0]) {
            event.forEach(option => {
              if(!ele.selected_optionID.includes(option.optionId)) {
                ele.selected_optionID.push(_.get(option, "optionId"));
              }
            });
        }
        const optVal = ele["selected_optionValues"];
        if (
          optVal === "" ||
          optVal === [] ||
          optVal.length === 0 ||
          optVal === null ||
          optVal === undefined
        ) {
          if (event[0]) {
            event.forEach(option => {
              ele["selected_optionValues"][0] = _.get(option, "optionValue");
            });
          }
        } else if (event[0]){
            event.forEach(option => {
              if(!ele.selected_optionValues.includes(option.optionValue)) {
              ele.selected_optionValues.push(_.get(option, "optionValue"));
              }
            });
        }
        ele["requiredObj"].changed = true;
      }
    });
  }

  onMultiDropDownItemDeSelect(event: any, qID: string, i: number) {
    this.preferencesData[i].forEach((ele) => {
      if (
        ele["questionID"] === qID &&
        ele["questionType"] === PREFERENCES_TYPES.MULTIPLE
      ) {
        const optID = ele["selected_optionID"];
        let preventEventFlag = false;
        let optIndex = 0;
        if (ele["readOnly"] && ele["nonEditableOptionID"].length > 0) {
          ele["nonEditableOptionID"].forEach((nonEditableID) => {
            if (nonEditableID.optionID === _.get(event, "optionId")) {
              preventEventFlag = true;
              optIndex = nonEditableID.index;
            }
          });
        }
        if (preventEventFlag) {
          const optionObj = {
            optionId: _.get(event, "optionId"),
            optionValue: _.get(event, "optionValue"),
          };
          const clonedOptionsArr = _.cloneDeep(ele["multiSelectOptions"]);
          clonedOptionsArr.splice(optIndex, 0, optionObj);
          ele["multiSelectOptions"] = clonedOptionsArr;
        } else {
          if (ele["readOnly"] && ele["nonEditableOptionID"].length > 0) {
            ele["nonEditableOptionID"].forEach((nonEditableID) => {
              let changeOrderIndex = 0;
              ele["multiSelectOptions"].forEach((multiSelectOpt) => {
                if (nonEditableID.optionID === multiSelectOpt.optionId) {
                  nonEditableID.index = changeOrderIndex;
                }
                changeOrderIndex++;
              });
            });
          }
          if (
            optID === "" ||
            optID === [] ||
            optID.length === 0 ||
            optID === null ||
            optID === undefined
          ) {
            return;
          } else {
            let index = 0;
            let optionIndex = 0;
            ele.selected_optionID.forEach((optionID) => {
              if (optionID === _.get(event, "optionId")) {
                optionIndex = index;
              }
              index++;
            });
            ele.selected_optionID.splice(optionIndex, 1);
          }
          const optVal = ele["selected_optionValues"];
          if (
            optVal === "" ||
            optVal === [] ||
            optVal.length === 0 ||
            optVal === null ||
            optVal === undefined
          ) {
            return;
          } else {
            let index = 0;
            let optionIndex = 0;
            ele.selected_optionValues.forEach((optionVal) => {
              if (optionVal === _.get(event, "optionValue")) {
                optionIndex = index;
              }
              index++;
            });
            ele.selected_optionValues.splice(optionIndex, 1);
          }
          if (
            ele.selected_optionID.length === 0 &&
            ele.selected_optionValues.length === 0
          ) {
            ele["requiredObj"].changed = false;
          }
        }
      }
    });
  }

  updateFreeText(event: any, qID: string, roomId: number) {
    this.preferencesData[roomId].forEach((ele) => {
      if (
        ele["questionID"] === qID &&
        ele["questionType"] === PREFERENCES_TYPES.FREETEXT
      ) {
        if (
          ele["selected_optionValues"] !== "" &&
          ele["selected_optionValues"].length > 0
        ) {
          ele["requiredObj"].changed = true;
        } else {
          ele["requiredObj"].changed = false;
        }
      }
    });
  }

  onKeyUp(field: string) {
    if (field === "expectedTime" && this.isExpectedTime) {
      if (this.expectedTime === undefined || this.expectedTime === null) {
        this.isExpectedTime = false;
        this.prefNameFieldError = "Please enter your first name";
      } else {
        this.isExpectedTime = true;
      }
    }
  }

  changePreference() {
    if (this.source === "confirmation") {
      const flag = this.validateGuestPreferences();
      if (flag !== -1) {
        return false;
      }
      const prefData = this.guestPreferenceData();
      const guestPrefObject = [];
      let arrivalTimeOptionValue = "";
      let prefIndex = 0;
      prefData.forEach((element) => {
        const obj = {};
        if (
          _.get(element, "question_type") === "arrivalTime" &&
          arrivalTimeOptionValue === ""
        ) {
          arrivalTimeOptionValue = _.get(element, "optionValue");
        }
        obj["question_id"] = _.get(element, "question_id");
        if (
          _.get(element, "preQuestionOptionIds") !== undefined &&
          _.get(element, "preQuestionOptionIds") !== null &&
          _.get(element, "preQuestionOptionIds").length > 0
        ) {
          obj["preQuestionOptionIds"] = _.get(element, "preQuestionOptionIds");
        }
        if (
          _.get(element, "option_ids") !== undefined &&
          _.get(element, "option_ids") !== null &&
          _.get(element, "option_ids").length > 0
        ) {
          obj["option_ids"] = _.get(element, "option_ids");
        } else if (
          _.get(element, "option_text") !== undefined &&
          _.get(element, "option_text") !== null
        ) {
          obj["option_text"] = _.get(element, "option_text");
        }
        guestPrefObject[prefIndex] = obj;
        prefIndex++;
      });
      const requestBody = {
        confirmationCode: this.bookingRef,
        propertyCode: environment.property_code,
        arrivalTimeInfo: arrivalTimeOptionValue,
        guestRoomPreferences: guestPrefObject,
      };
      this.changePreferencesSubscription = this.manageBookingService
        .changeGuestPreference(requestBody)
        .subscribe((response) => {
          if (_.get(response, "status.statusCode") === 1000) {
            this.storeService.upsertSingleRoomGuestPreference(
              prefData,
              this.roomIndex
            );
            this.changePreferencesClose.emit();
            const rooms = this.storeService.getBasketState().Rooms;
            const userSettingsState = this.storeService.getUserSettingsState();
            const langObj = _.get(userSettingsState, "langObj");
            const params = CommonUtility.getConfirmationQueryParams(
              this.bookingRef,
              rooms,
              langObj
            );
            const navigationExtras = {
              queryParams: params,
            };
            this.router.navigate(
              ["/" + URL_PATHS.CONFIRMATION_PAGE],
              navigationExtras
            );
          } else {
            // const navigationExtras = {};
            // this.router.navigate([URL_PATHS.SYSTEM_ERROR], navigationExtras);
            this.storeService.setSystemError(true);
          }
        });
    }
  }

  isAddtionalGuestNameValid(field, val, indx, roomID) {
    if (val !== undefined && val !== null && val !== "") {
      if (field === "firstName") {
        if (!STRING_REGEX.test(val)) {
          this.isAddGuestFirstNameValid[roomID][indx] = false;
          if (this.localeObj) {
            this.isAddGuestFirstNameFieldError[roomID][indx] = _.get(
              this.localeObj,
              "tf_4_Checkout_guestDetails_invalidFirstNameError"
            );
          } else {
            this.isAddGuestFirstNameFieldError[roomID][indx] = GUEST_INFO_FORM_ERRORS.FIRST_NAME_INVALID;
          }
          return false;
        } else {
          this.isAddGuestFirstNameValid[roomID][indx] = true;
          return true;
        }
      }
      if (field === "lastName") {
        if (!STRING_REGEX.test(val)) {
          this.isAddGuestLastNameValid[roomID][indx] = false;
          if (this.localeObj) {
            this.isAddGuestLasttNameFieldError[roomID][indx] = _.get(
              this.localeObj,
              "tf_4_Checkout_guestDetails_invalidLastNameError"
            );
          } else {
            this.isAddGuestLasttNameFieldError[roomID][indx] = GUEST_INFO_FORM_ERRORS.LAST_NAME_INVALID;
          }
          return false;
        } else {
          this.isAddGuestLastNameValid[roomID][indx] = true;
          return true;
        }
      }
    } else {
      return true;
    }
  }

  setAdditionalGuestsByRooom(roomID?: number) {
    if (roomID === undefined) {
      roomID = 0;
    }

      if (this.displayAdditionalGuests &&
         (this.storeService.getBasketState().GuestSummary.guests[roomID].adults - 1 > 0)) {
        this.showAdditionalGuests[roomID] = true;
      } else {
        this.showAdditionalGuests[roomID] = false;
      }

    this.addtionalGuestInfoByRoom[roomID] = [];
    this.isManageBookingFlow = this.storeService.getManageBookingFlowStatus();
    let check = 0;
    const adultsCnt = this.storeService.getBasketState().GuestSummary.guests[roomID].adults - 1; // basket room adultsCount-1
    const savedAdditionalGuestData = JSON.parse(localStorage.getItem("additionalGuestInfo"));
    for (let aCnt = 0; aCnt < adultsCnt ; aCnt ++) {
      const firstname = (
        !this.isManageBookingFlow
        ) ? ((!!savedAdditionalGuestData && !!savedAdditionalGuestData[aCnt]) ? savedAdditionalGuestData[aCnt].first_name : '')
          : (aCnt === 0 ? this.storeService.getBasketState().ManageRoomBooking.additionalGuests[aCnt].first_name : '');
      const lastname = (
        !this.isManageBookingFlow
        ) ? ((!!savedAdditionalGuestData && !!savedAdditionalGuestData[aCnt]) ? savedAdditionalGuestData[aCnt].last_name : '')
          : (aCnt === 0 ? this.storeService.getBasketState().ManageRoomBooking.additionalGuests[aCnt].last_name : '');

      if (this.isManageBookingFlow && (firstname !== '' || lastname !== '')) {
        // check to auto expand the additional guest names in manage booking flow if names exists
        check++;
      }
      this.addtionalGuestInfoByRoom[roomID].push({
        first_name: firstname,
        last_name: lastname
      });
    }
    // check to auto expand the additional guest names in manage booking flow if names exists
    this.toggleAddGuestsAddRemove[roomID] = (this.isManageBookingFlow && check > 0) ? true : false;
    return this.addtionalGuestInfoByRoom[roomID];
  }

  resetAdditionalGuestInputs(roomID: number) {
    const adultsCnt = this.storeService.getBasketState().GuestSummary.guests[roomID].adults - 1;
    this.addtionalGuestInfoByRoom[roomID] = [];
    for (let aCnt = 0; aCnt < adultsCnt ; aCnt ++) {
      this.addtionalGuestInfoByRoom[roomID].push({
        first_name: '',
        last_name: ''
      });
    }
  }

  getAdditionalGuestsByRooom(roomID?: number) {
    return this.addtionalGuestInfoByRoom[roomID];
  }

  // showMultiRoomAddGuestsInfoErrors() {
  //   if (
  //      this.displayAdditionalGuests &&
  //      this.showAdditionalGuests &&
  //      this.addtionalGuestInfoByRoom.length > 1
  //      ) {
  //       let roomIndex = 0;
  //       this.addtionalGuestInfoByRoom.forEach(
  //       guestByRoom => {
  //               guestByRoom.forEach((
  //                 element: any,
  //                 index: number
  //               ) => {
  //                   if ((element.first_name !== "" && element.first_name !== undefined && element.first_name !== null) &&
  //                   !STRING_REGEX.test(element.first_name)) {
  //                     this.isAddGuestFirstNameValid[roomIndex][index] = false;
  //                     if (this.localeObj) {
  //                       this.isAddGuestFirstNameFieldError[roomIndex][index] = _.get(
  //                         this.localeObj,
  //                         "tf_4_Checkout_guestDetails_invalidFirstNameError"
  //                       );
  //                     } else {
  //                       this.isAddGuestFirstNameFieldError[roomIndex][index] = GUEST_INFO_FORM_ERRORS.FIRST_NAME_INVALID;
  //                     }
  //                   } else {
  //                     this.isAddGuestFirstNameValid[roomIndex][index] = true;
  //                     this.isAddGuestFirstNameFieldError[roomIndex][index] = '';
  //                   }

  //                   if ((element.last_name !== "" && element.last_name !== undefined && element.last_name !== null) &&
  //                   !STRING_REGEX.test(element.last_name)) {
  //                     this.isAddGuestLastNameValid[roomIndex][index] = false;
  //                     if (this.localeObj) {
  //                       this.isAddGuestLasttNameFieldError[roomIndex][index] = _.get(
  //                         this.localeObj,
  //                         "tf_4_Checkout_guestDetails_invalidLastNameError"
  //                       );
  //                     } else {
  //                       this.isAddGuestLasttNameFieldError[roomIndex][index] = GUEST_INFO_FORM_ERRORS.LAST_NAME_INVALID;
  //                     }
  //                   } else {
  //                     this.isAddGuestLastNameValid[roomIndex][index] = true;
  //                     this.isAddGuestLasttNameFieldError[roomIndex][index] = '';
  //                   }
  //           }); // end guests foreach
  //         roomIndex++;
  //     }); // End room by foreach
  //   }
  //  }

  isPrefsAvailable() {
    if (this.preferencesData === undefined ||
       (this.preferencesData && this.preferencesData.length === 0 )) {
        return false;
    } else {
        return true;
    }
  }

  guestPreferenceData(roomID?: number) {
    if (roomID === undefined) {
      roomID = 0;
    }
    if (
      this.preferencesData === undefined ||
      this.preferencesData.length === 0 ||
      this.preferencesData.length <= roomID
    ) {
      return [];
    }
    const roomPref = this.preferencesData[roomID];

    roomPref.forEach((preference) => {
      const pref = {
        question_type: "",
        question_id: "",
        questionLabel: "",
        questionText: "",
        option_ids: [],
        optionsLabel: [],
        option_text: "",
        optionValue: "",
        preQuestionOptionIds: [],
        preQuestionOptionLabel: [],
      };
      pref.question_type = preference.questionType;
      if (preference.isPreQuestionRequired) {
        pref.question_id = preference.preQuestionId;
        pref.preQuestionOptionIds.push(preference.selected_preOptionID);
        pref.preQuestionOptionLabel.push(
          preference.selected_showMainQuestionValue
        );
      }
      if (
        !preference.isPreQuestionRequired ||
        (preference.isPreQuestionRequired &&
          preference.selected_showMainQuestionValue)
      ) {
        if (!preference.isPreQuestionRequired) {
          pref.question_id = preference.questionID;
        }
        pref.questionLabel = preference.questionLabel;
        pref.questionText = preference.questionText;
        if (preference.preferenceType === "time") {
          const val = preference.selected_time;
          // const am_pm = preference.selected_am_pm;
          if (
            val !== undefined &&
            val !== null &&
            val.time !== undefined &&
            val.id !== undefined &&
            val.time !== "" &&
            val.id !== ""
          ) {
            // && am_pm !== undefined && am_pm !== null && am_pm !== '') {
            pref.option_ids[0] = preference.selected_time.id;
            pref.optionsLabel[0] = preference.selected_optionValues;
            pref.optionValue = preference.selected_time_str;
          }
        } else {
          if (preference.questionType === PREFERENCES_TYPES.FREETEXT) {
            pref.option_text = preference.selected_optionValues;
          } else if (preference.questionType === PREFERENCES_TYPES.SINGLE) {
            const optId = preference.selected_optionID;
            const optVal = preference.selected_optionValues;
            if (
              optId !== undefined &&
              optId !== null &&
              optId !== "" &&
              optVal !== undefined &&
              optVal !== null &&
              optVal !== ""
            ) {
              pref.option_ids[0] = preference.selected_optionID;
              pref.optionsLabel[0] = preference.selected_optionValues;
            }
          } else if (preference.questionType === PREFERENCES_TYPES.MULTIPLE) {
            const optId = preference.selected_optionID;
            const optVal = preference.selected_optionValues;
            if (
              optId !== undefined &&
              optId !== null &&
              optId !== "" &&
              optId.length > 0 &&
              optVal !== undefined &&
              optVal !== null &&
              optVal !== "" &&
              optVal.length > 0
            ) {
              preference.selected_optionID.forEach((ele) => {
                pref.option_ids.push(ele);
              });
              preference.selected_optionValues.forEach((ele) => {
                pref.optionsLabel.push(ele);
              });
            }
          }
        }
      }
      let prefernceValid = false;
      if (
        preference.isPreQuestionRequired &&
        pref.preQuestionOptionIds.length > 0 &&
        !preference.selected_showMainQuestionValue
      ) {
        prefernceValid = true;
      } else if (
        !preference.isPreQuestionRequired ||
        (preference.isPreQuestionRequired &&
          pref.preQuestionOptionIds.length > 0 &&
          preference.selected_showMainQuestionValue)
      ) {
        if (
          pref.question_type === PREFERENCES_TYPES.FREETEXT &&
          pref.option_text !== "" &&
          pref.option_text !== undefined &&
          pref.option_text !== null &&
          pref.option_text.length > 0
        ) {
          prefernceValid = true;
        }
        if (
          pref.question_type !== PREFERENCES_TYPES.FREETEXT &&
          pref.option_ids.length > 0
        ) {
          prefernceValid = true;
        }
      }
      if (prefernceValid) {
        // this.selectedPreference[roomID].guestPreference.push(pref);
        let flag = false;
        let count = 0;
        if (this.selectedPreference.length) {
          this.selectedPreference[roomID].guestPreference.forEach(
            (savedPref, index) => {
              if (savedPref.question_id === pref.question_id) {
                flag = true;
                count = index;
              }
            }
          );
        }
        if (!flag) {
          this.selectedPreference[roomID].guestPreference.push(pref);
        } else {
          this.selectedPreference[roomID].guestPreference.splice(
            count,
            1,
            pref
          );
        }
      }
    });
    return this.selectedPreference[roomID].guestPreference;
  }

  resetRoomPreferences(event: any) {
    this.previousPreferenceData = _.cloneDeep(this.preferencesData);
    this.preferencesApiData(this.preferenceAPIResponse);
    this.addSelectedTimePreferenceValue();
  }

  validateGuestPreferences() {
    if (this.showPref) {
      this.validationFailure = true;
      let roomIndex = -1;
      let index = 0;
      this.preferencesData.forEach((roomData) => {
        roomData.forEach((preference) => {
          if (
            preference.requiredObj.require &&
            !preference.requiredObj.changed
          ) {
            this.validationFailure = false;
            if (roomIndex === -1) {
              roomIndex = index;
            }
          }
        });
        index++;
      });
      return roomIndex;
    } else {
      return -1;
    }
  }

  preferencesApiData(result: any) {
    if (this.showPref) {
      let roomTypeValue = "";
      let roomViewValue = "";
      const guestPreference = [];
      this.sameSubtypeAndViewTypeFlag = true;
      this.rooms.forEach((room) => {
        if (roomTypeValue && roomViewValue) {
          if (
            roomTypeValue !== _.get(room, "RoomDetails.roomType") ||
            roomViewValue !== _.get(room, "RoomDetails.roomView")
          ) {
            this.sameSubtypeAndViewTypeFlag = false;
          }
        } else {
          roomTypeValue = _.get(room, "RoomDetails.roomType");
          roomViewValue = _.get(room, "RoomDetails.roomView");
        }
        guestPreference.push(room.GuestPreference);
      });
      let specificRoomPref = false;
      let specificRoomPrefIndex = 0;
      let specificPreferences;
      let manageBookingGuestPreferences;

      if (
        this.source &&
        this.roomIndex > -1 &&
        this.bookingRef &&
        this.source === "confirmation" &&
        this.bookingRef !== "" &&
        this.bookingRef.length > 0
      ) {
        specificRoomPref = true;
        specificRoomPrefIndex = this.roomIndex;
      } else if (guestPreference !== []) {
        for (let i = 0; i < guestPreference.length; i++) {
          if (guestPreference[i] !== undefined) {
            specificRoomPref = true;
          }
        }
      }
      this.preferencesData = [];
      this.selectedPreference = new Array<MultiRoomGuestPreference>();
      if (!specificRoomPref && !this.isManageBookingCriticalModifyFlow) {
        // new reservation flow
        for (let i = 0; i < this.rooms.length; i++) {
          const temp = new MultiRoomGuestPreference();
          temp["guestPreference"] = new Array<GuestPreferences>();
          this.selectedPreference.push(temp);
        }
      } else if (guestPreference !== []) {
        if (this.rooms.length === 1) {
          specificPreferences = guestPreference[0];
        } else {
          specificPreferences = guestPreference;
        }
        for (let i = 0; i < this.rooms.length; i++) {
          const temp = new MultiRoomGuestPreference();
          temp["guestPreference"] = new Array<GuestPreferences>();
          this.selectedPreference.push(temp);
        }
      } else {
        const temp = new MultiRoomGuestPreference();
        temp["guestPreference"] = new Array<GuestPreferences>();
        this.selectedPreference.push(temp);

        if (this.isManageBookingCriticalModifyFlow) {
          manageBookingGuestPreferences = _.get(
            this.storeService.getBasketState().ManageRoomBooking,
            "GuestPreference"
          );
        }
        // confirmation page flow--- change preference
        specificPreferences = _.get(
          this.storeService.getBasketState().Rooms[specificRoomPrefIndex],
          "GuestPreference"
        );
      }
      if ((_.get(result, "data") === null) || (_.get(result, "data") === undefined)) {
        return;
      }
      let room_index = 0;
      const roomsData = this.storeService.getBasketState().Rooms;
      const totalPreferencesCount =
        _.get(result, "data.preferences").length +
        _.get(result, "data.arrivalTimeGuestPreferences").length;
      let previouseRoomUniqueCodeManageBooking = "";
      if (this.isManageBookingCriticalModifyFlow) {
        previouseRoomUniqueCodeManageBooking = _.get(
          this.storeService.getBasketState().ManageRoomBooking,
          "UniqueCode"
        );
      }

      roomsData.forEach((room) => {
        if (
          this.isManageBookingCriticalModifyFlow &&
          previouseRoomUniqueCodeManageBooking === room.UniqueCode &&
          !this.isRT4ModifyFlowEnabled
        ) {
          specificPreferences = manageBookingGuestPreferences;
          this.isSatisfiesCriticalModifyFlowChecks = true;
        }
        if (
          !specificRoomPref ||
          (!specificRoomPref && !this.isSatisfiesCriticalModifyFlowChecks) ||
          (specificRoomPref && room_index === specificRoomPrefIndex) ||
          this.rooms.length > 1 ||
          this.isSatisfiesCriticalModifyFlowChecks
        ) {
          let prefRoomIndex;
          if (!specificRoomPref && !this.isSatisfiesCriticalModifyFlowChecks) {
            prefRoomIndex = room_index; // new reservation flow
          } else {
            prefRoomIndex = room_index;
          }
          this.preferencesData[prefRoomIndex] = [];
          for (
            let indexValue = 0;
            indexValue < totalPreferencesCount;
            indexValue++
          ) {
            this.preferencesData[prefRoomIndex][indexValue] = null;
          }
          const occasionRoomPref = _.get(result, "data.preferences");
          const timePref = _.get(result, "data.arrivalTimeGuestPreferences");
          let prefIndex = 0;

          timePref.forEach((element) => {
            const prefOpt = {};
            const question = _.get(element, "question");
            if (question) {
              prefIndex = _.get(element, "orderIndex") - 1;
              prefOpt["preferenceType"] = "time";
              prefOpt["isPreQuestionRequired"] = false;
              prefOpt["preQuestionOptions"] = [];
              prefOpt["preQuestionLabel"] = "";
              prefOpt["preQuestionText"] = "";
              prefOpt["preQuestionId"] = "";
              prefOpt["questionType"] = _.get(element, "questionType");
              prefOpt["required"] = _.get(element, "required");
              prefOpt["questionID"] = _.get(element, "question.questionId");
              prefOpt["questionText"] = _.get(element, "question.questionText");
              prefOpt["questionLabel"] = _.get(
                element,
                "question.questionLabel"
              );
              prefOpt["extraInformation"] = _.get(
                element,
                "question.extraInformation"
              );
              prefOpt["maxOptionsAllowed"] = _.get(
                element,
                "maxOptionsAllowed"
              );
              prefOpt["requiredObj"] = {
                require: _.get(element, "required"),
                changed: false,
              };
              prefOpt["options"] = new Array();
              prefOpt["selected_time"] = {};
              // prefOpt['selected_am_pm'] = '';
              prefOpt["selected_time_str"] = "";
              prefOpt["preQuestionOptions"] = [];
              prefOpt["preQuestionLabel"] = "";
              prefOpt["preQuestionText"] = "";
              prefOpt["preQuestionId"] = "";
              prefOpt["selected_preOptionID"] = "";
              prefOpt["selected_preOptionValue"] = "";
              prefOpt["selected_showMainQuestionValue"] = false;
              let index = 0;
              if (prefOpt["isPreQuestionRequired"] === true) {
                prefOpt["preQuestionLabel"] = _.get(
                  element,
                  "preQuestion.questionLabel"
                );
                prefOpt["preQuestionText"] = _.get(
                  element,
                  "preQuestion.questionText"
                );
                prefOpt["preQuestionId"] = _.get(
                  element,
                  "preQuestion.questionId"
                );

                const preOptArr = _.get(element, "preQuestion.preOptions");
                index = 0;
                preOptArr.forEach((ele) => {
                  const preOpt = {};
                  preOpt["optionId"] = ele.optionId;
                  preOpt["optionLabel"] = ele.optionLabel;
                  preOpt["optionValue"] = ele.optionValue;
                  preOpt["isPreQuestionOptionToShowMainQuestion"] =
                    ele.isPreQuestionOptionToShowMainQuestion;
                  preOpt["default"] = ele.default;
                  if (preOpt["default"] === true) {
                    if (!ele.isPreQuestionOptionToShowMainQuestion) {
                      prefOpt["requiredObj"].changed = true;
                    }
                    prefOpt["selected_preOptionID"] = ele.optionId;
                    prefOpt["selected_preOptionValue"] = ele.optionLabel;
                    prefOpt["selected_showMainQuestionValue"] =
                      ele.isPreQuestionOptionToShowMainQuestion;
                  }
                  prefOpt["preQuestionOptions"][index] = preOpt;
                  index++;
                });
              }
              index = 0;
              // let default_am_pm = '';
              const optArr = _.get(element, "question.options");
              optArr.forEach((optEle) => {
                const opt = {};
                opt["optionID"] = _.get(optEle, "optionId");
                opt["optionLabel"] = _.get(optEle, "optionLabel");
                opt["optionValue"] = _.get(optEle, "optionValue");
                opt["isDefault"] = _.get(optEle, "default");
                opt["isMultiRoomOnly"] = false;
                if (
                  _.get(optEle, "hour") !== null &&
                  _.get(optEle, "hour") !== undefined &&
                  _.get(optEle, "hour").length > 0 &&
                  _.get(optEle, "minute") !== null &&
                  _.get(optEle, "minute") !== undefined &&
                  _.get(optEle, "minute").length > 0
                ) {
                  opt["hour"] = _.get(optEle, "hour");
                  opt["minute"] = _.get(optEle, "minute");
                  // opt['am_pm'] = this.AM_PM_obj[_.get(optEle, 'timeFormat')];
                  // if (opt['isDefault'] === true) {
                  //   if (!prefOpt['isPreQuestionRequired'] ||
                  //     (prefOpt['isPreQuestionRequired'] && prefOpt['selected_showMainQuestionValue'])) {
                  //     prefOpt['requiredObj'].changed = true;
                  //   }
                  //   // default_am_pm = opt['am_pm'];
                  //   prefOpt['selected_time'] = { time: opt['hour'] + ':' + opt['minute'], id: opt['optionID'],
                  //   text: opt['optionValue'] };
                  //   prefOpt['selected_optionValues'] = opt['optionValue'];
                  //   // prefOpt['selected_time_str'] = opt['hour'] + ':' + opt['minute'] + ' '
                  //   //   + _.findKey(this.AM_PM_obj, (value) => value === opt['am-pm']);
                  //   prefOpt['selected_time_str'] = opt['hour'] + ':' + opt['minute'];
                  // }
                  prefOpt["options"][index] = opt;
                  index++;
                }
              });
              // prefOpt['am_pm_Opt'] = [];
              // let optFound = false;
              // prefOpt['options'].forEach(ele => {
              //   if (ele.am_pm === this.localeObj.tf_Generic_AM) {
              //     optFound = true;
              //   }
              // });
              // if (optFound) {
              //   prefOpt['am_pm_Opt'].push(this.localeObj.tf_Generic_AM);
              // }
              // optFound = false;
              // prefOpt['options'].forEach(ele => {
              //   if (ele.am_pm === this.localeObj.tf_Generic_PM) {
              //     optFound = true;
              //   }
              // });
              // if (optFound) {
              //   prefOpt['am_pm_Opt'].push(this.localeObj.tf_Generic_PM);
              // }
              prefOpt["timeOptArr"] = [];
              index = 0;
              // if (default_am_pm === '') {
              //   prefOpt['options'].forEach(ele => {
              //     if (ele.am_pm === this.localeObj.tf_Generic_AM) {
              //       const opt = ele.hour + ':' + ele.minute;
              //       prefOpt['timeOptArr'][index] = { time: opt, id: ele.optionID, text: ele.optionValue };
              //       index++;
              //     }
              //   });
              //   if (prefOpt['timeOptArr'].length > 0) {
              //     default_am_pm = this.localeObj.tf_Generic_AM;
              //     prefOpt['selected_time'] = prefOpt['timeOptArr'][0];
              //     prefOpt['selected_optionValues'] = prefOpt['timeOptArr'][0].text;
              //     prefOpt['selected_time_str'] = prefOpt['timeOptArr'][0].time + ' '
              //       + _.findKey(this.AM_PM_obj, (value) => value === default_am_pm);
              //   } else {
              //     prefOpt['options'].forEach(ele => {
              //       if (ele.am_pm === this.localeObj.tf_Generic_PM) {
              //         const opt = ele.hour + ':' + ele.minute;
              //         prefOpt['timeOptArr'][index] = { time: opt, id: ele.optionID, text: ele.optionValue };
              //         index++;
              //       }
              //     });
              //     if (prefOpt['timeOptArr'].length > 0) {
              //       default_am_pm = this.localeObj.tf_Generic_PM;
              //       prefOpt['selected_time'] = prefOpt['timeOptArr'][0];
              //       prefOpt['selected_optionValues'] = prefOpt['timeOptArr'][0].text;
              //       prefOpt['selected_time_str'] = prefOpt['timeOptArr'][0].time + ' '
              //         + _.findKey(this.AM_PM_obj, (value) => value === default_am_pm);
              //     }
              //   }
              // } else {
              //   prefOpt['options'].forEach(ele => {
              //     if (default_am_pm === ele.am_pm) {
              //       const opt = ele.hour + ':' + ele.minute;
              //       prefOpt['timeOptArr'][index] = { time: opt, id: ele.optionID, text: ele.optionValue };
              //       index++;
              //     }
              //   });
              // }
              prefOpt["options"].forEach((ele) => {
                const opt = ele.hour + ":" + ele.minute;
                prefOpt["timeOptArr"][index] = {
                  time: opt,
                  id: ele.optionID,
                  text: ele.optionValue,
                };
                index++;
              });
              // if (prefOpt['requiredObj'].changed !== true) {
              //   prefOpt['selected_time'] = prefOpt['timeOptArr'][0];
              //   prefOpt['selected_optionValues'] = prefOpt['timeOptArr'][0].text;
              //   prefOpt['selected_time_str'] = prefOpt['timeOptArr'][0].time;
              //   // prefOpt['selected_am_pm'] = default_am_pm;
              //   prefOpt['requiredObj'].changed = true;
              // }
              if (
                _.get(prefOpt, "options").length > 0 &&
                _.get(prefOpt, "timeOptArr").length > 0
              ) {
                this.preferencesData[prefRoomIndex][prefIndex] = prefOpt;
              }
            }
          });

          occasionRoomPref.forEach((element) => {
            const prefOpt = {};
            prefOpt["multiRoomsDisplaySettings"] = _.get(
              element,
              "multiRoomsDisplaySettings"
            );
            const roomQuestion = _.get(element, "roomQuestion");
            let multiRoomDisplayFlag;
            if (
              prefOpt["multiRoomsDisplaySettings"] ===
              "SAME_SUB_VIEW_TYPE_MULTIROOMS"
            ) {
              multiRoomDisplayFlag = this.sameSubtypeAndViewTypeFlag;
            } else {
              multiRoomDisplayFlag = true;
            }

            if (multiRoomDisplayFlag === true && roomQuestion) {
              prefIndex = _.get(element, "orderIndex") - 1;
              prefOpt["preferenceType"] = "preference";
              prefOpt["isPreQuestionRequired"] = _.get(
                element,
                "isPreQuestionRequired"
              );
              prefOpt["questionType"] = _.get(element, "questionType");
              prefOpt["required"] = _.get(element, "required");
              prefOpt["questionID"] = _.get(element, "roomQuestion.questionId");
              prefOpt["questionText"] = _.get(
                element,
                "roomQuestion.questionText"
              );
              prefOpt["questionLabel"] = _.get(
                element,
                "roomQuestion.questionLabel"
              );
              prefOpt["extraInformation"] = _.get(
                element,
                "roomQuestion.extraInformation"
              );
              prefOpt["maxOptionsAllowed"] = _.get(
                element,
                "maxOptionsAllowed"
              );

              prefOpt["requiredObj"] = {
                require: _.get(element, "required"),
                changed: false,
                showReqError: false,
              };
              prefOpt["preQuestionOptions"] = [];
              prefOpt["preQuestionLabel"] = "";
              prefOpt["preQuestionText"] = "";
              prefOpt["preQuestionId"] = "";
              prefOpt["selected_preOptionID"] = "";
              prefOpt["selected_preOptionValue"] = "";
              prefOpt["selected_showMainQuestionValue"] = false;
              let index = 0;
              if (prefOpt["isPreQuestionRequired"] === true) {
                prefOpt["preQuestionLabel"] = _.get(
                  element,
                  "preQuestion.questionLabel"
                );
                prefOpt["preQuestionText"] = _.get(
                  element,
                  "preQuestion.questionText"
                );
                prefOpt["preQuestionId"] = _.get(
                  element,
                  "preQuestion.questionId"
                );

                const preOptArr = _.get(element, "preQuestion.preOptions");
                index = 0;
                preOptArr.forEach((ele) => {
                  const preOpt = {};
                  preOpt["optionId"] = ele.optionId;
                  preOpt["optionLabel"] = ele.optionLabel;
                  preOpt["optionValue"] = ele.optionValue;
                  preOpt["isPreQuestionOptionToShowMainQuestion"] =
                    ele.isPreQuestionOptionToShowMainQuestion;
                  preOpt["default"] = ele.default;
                  if (preOpt["default"] === true) {
                    if (!ele.isPreQuestionOptionToShowMainQuestion) {
                      prefOpt["requiredObj"].changed = true;
                    }
                    prefOpt["selected_preOptionID"] = ele.optionId;
                    prefOpt["selected_preOptionValue"] = ele.optionLabel;
                    prefOpt["selected_showMainQuestionValue"] =
                      ele.isPreQuestionOptionToShowMainQuestion;
                  }
                  prefOpt["preQuestionOptions"][index] = preOpt;
                  index++;
                });
              }
              prefOpt["selected_optionID"] = "";
              prefOpt["selected_optionValues"] = undefined;
              prefOpt["options"] = new Array();
              prefOpt["nonEditableOptionID"] = [];
              prefOpt["readOnly"] = false;
              if (prefOpt["questionType"] === PREFERENCES_TYPES.MULTIPLE) {
                prefOpt["multiSelectOptions"] = [];
                prefOpt["selected_optionID"] = [];
                prefOpt["selected_optionValues"] = [];
              }
              if (prefOpt["questionType"] !== PREFERENCES_TYPES.FREETEXT) {
                const quesOpt = _.get(element, "roomQuestion.options");
                index = 0;
                let multiselectIndex = 0;
                quesOpt.forEach((options) => {
                  const allowedRooms = options.roomSubTypes;
                  let optionValid = false;
                  if (
                    !this.isSatisfiesCriticalModifyFlowChecks &&
                    options.isMultiRoomOnly &&
                    roomsData.length === 1
                  ) {
                    optionValid = false;
                  } else if (
                    (specificRoomPref ||
                      this.isSatisfiesCriticalModifyFlowChecks) &&
                    options.isMultiRoomOnly &&
                    roomsData.length === 1
                  ) {
                    optionValid = false;
                    if (
                      this.checkOptionInSpecificRoomPreference(
                        specificPreferences,
                        prefOpt["questionID"],
                        options.optionId,
                        prefOpt["questionType"]
                      )
                    ) {
                      optionValid = true;
                      prefOpt["nonEditableOptionID"].push({
                        optionID: options.optionId,
                        index,
                      });
                      prefOpt["readOnly"] = true;
                    }
                  } else if (
                    (specificRoomPref ||
                      this.isSatisfiesCriticalModifyFlowChecks) &&
                    this.checkOptionInSpecificRoomPreference(
                      specificPreferences,
                      prefOpt["questionID"],
                      options.optionId,
                      prefOpt["questionType"]
                    )
                  ) {
                    optionValid = true;
                    if (options.isMultiRoomOnly) {
                      prefOpt["nonEditableOptionID"].push({
                        optionID: options.optionId,
                        index,
                      });
                      prefOpt["readOnly"] = true;
                    }
                  } else if (
                    (specificRoomPref ||
                      this.isSatisfiesCriticalModifyFlowChecks) &&
                    options.isMultiRoomOnly &&
                    !this.checkOptionInSpecificRoomPreference(
                      specificPreferences,
                      prefOpt["questionID"],
                      options.optionId,
                      prefOpt["questionType"]
                    )
                  ) {
                    optionValid = false;
                  } else {
                    if (allowedRooms === null || allowedRooms === undefined) {
                      optionValid = true;
                    } else {
                      optionValid = false;
                      for (const key in allowedRooms) {
                        if (allowedRooms.hasOwnProperty(key)) {
                          if (
                            room["RoomDetails"] !== undefined &&
                            room.RoomDetails.roomType === allowedRooms[key]
                          ) {
                            optionValid = true;
                          }
                        }
                      }
                    }
                  }
                  if (
                    options.optionId === null ||
                    options.optionId === undefined ||
                    options.optionId.length === 0
                  ) {
                    optionValid = false;
                  }
                  if (optionValid) {
                    const optData = {};
                    optData["optionId"] = options.optionId;
                    optData["optionLabel"] = options.optionLabel;
                    optData["optionValue"] = options.optionValue;
                    optData["isDefault"] = options.isDefault;
                    optData["isMultiRoomOnly"] = options.isMultiRoomOnly;
                    prefOpt["options"][index] = optData;
                    index++;
                    if (optData["isDefault"] === true) {
                      if (
                        !prefOpt["isPreQuestionRequired"] ||
                        (prefOpt["isPreQuestionRequired"] &&
                          prefOpt["selected_showMainQuestionValue"])
                      ) {
                        prefOpt["requiredObj"].changed = true;
                      }
                      if (
                        prefOpt["questionType"] !== PREFERENCES_TYPES.MULTIPLE
                      ) {
                        prefOpt["selected_optionID"] = options.optionId;
                        prefOpt["selected_optionValues"] = options.optionValue;
                      } else {
                        prefOpt["selected_optionID"][multiselectIndex] =
                          options.optionId;
                        prefOpt["selected_optionValues"][multiselectIndex] =
                          options.optionValue;
                        prefOpt["multiSelectOptions"][multiselectIndex] = {
                          optionId: options.optionId,
                          optionValue: options.optionValue,
                        };
                        multiselectIndex++;
                      }
                    }
                  }
                });
              }
              if (prefOpt["questionType"] === PREFERENCES_TYPES.MULTIPLE) {
                prefOpt["settings"] = {
                  singleSelection: false,
                  idField: "optionId",
                  textField: "optionValue",
                  itemsShowLimit: 5,
                  limitSelection: prefOpt["maxOptionsAllowed"],
                  enableCheckAll: false,
                  allowSearchFilter: false,
                };
              } else if (prefOpt["questionType"] === PREFERENCES_TYPES.SINGLE) {
                prefOpt["settings"] = {
                  singleSelection: true,
                  idField: "optionId",
                  textField: "optionLabel",
                  itemsShowLimit: 5,
                  enableCheckAll: false,
                  allowSearchFilter: false,
                };
              }
              if (
                prefOpt["questionType"] === PREFERENCES_TYPES.FREETEXT ||
                _.get(prefOpt, "options").length > 0
              ) {
                this.preferencesData[prefRoomIndex][prefIndex] = prefOpt;
              }
            }
          });
          this.preferencesData[prefRoomIndex] = this.preferencesData[
            prefRoomIndex
          ].filter((currValue) => {
            return currValue !== null;
          });
        }
        room_index++;
      });
      this.defaultPreferencesData = [];
      this.defaultPreferencesData = _.cloneDeep(this.preferencesData);
      if (specificRoomPref || this.isSatisfiesCriticalModifyFlowChecks) {
        if (this.rooms.length === 1) {
          this.updatedPreferences(specificPreferences, 0);
        } else {
          for (let i = 0; i < specificPreferences.length; i++) {
            this.updatedPreferences(specificPreferences[i], i);
          }
        }
      }
    }
  }

  checkOptionInSpecificRoomPreference(
    specificRoomPreference: any,
    questionId: string,
    optionId: string,
    questionTpye: string
  ) {
    let returnVal = false;
    specificRoomPreference.forEach((specificPreference) => {
      if (specificPreference !== undefined) {
        if (
          specificPreference.question_id === questionId &&
          specificPreference.question_type === questionTpye
        ) {
          specificPreference.option_ids.forEach((optId) => {
            if (optId === optionId) {
              returnVal = true;
            }
          });
        }
      }
    });
    return returnVal;
  }

  addSelectedTimePreferenceValue() {
    for (let index = 0; index < this.rooms.length; index++) {
      this.previousPreferenceData[index].forEach((prevPreference) => {
        if (prevPreference["preferenceType"] === TIME_PREFERENCE) {
          this.preferencesData[index].forEach((currPreference) => {
            if (
              currPreference["preferenceType"] === TIME_PREFERENCE &&
              currPreference["questionID"] === prevPreference["questionID"]
            ) {
              currPreference["selected_time"] = _.cloneDeep(
                prevPreference["selected_time"]
              );
              currPreference["selected_am_pm"] = _.get(
                prevPreference,
                "selected_am_pm"
              );
              currPreference["selected_optionValues"] = _.get(
                prevPreference,
                "selected_optionValues"
              );
              currPreference["selected_time_str"] = _.get(
                prevPreference,
                "selected_time_str"
              );
              currPreference["selected_showMainQuestionValue"] = _.get(
                prevPreference,
                "selected_showMainQuestionValue"
              );
              currPreference["selected_preOptionValue"] = _.get(
                prevPreference,
                "selected_preOptionValue"
              );
              currPreference["selected_preOptionID"] = _.get(
                prevPreference,
                "selected_preOptionID"
              );
              currPreference["timeOptArr"] = _.get(
                prevPreference,
                "timeOptArr"
              );
            }
          });
        }
      });
    }
  }

  preferencesAPI() {
    const basketState = this.storeService.getBasketState();
    const arrivalDate = _.get(basketState.GuestSummary, "checkindate");
    const date = CommonUtility.formateDate(arrivalDate);
    this.getPreferencesSubscription = this.manageBookingService
      .getGuestPreference(date)
      .subscribe((result) => {
        this.preferenceAPIResponse = _.cloneDeep(result);
        this.guestPreferenceDisclaimer = _.get(
          result,
          "data.guestPreferenceDisclaimer"
        );
        if (
          this.guestPreferenceDisclaimer === null ||
          this.guestPreferenceDisclaimer === undefined
        ) {
          this.guestPreferenceDisclaimer = "";
        }
        this.storeService.updateGuestPreferenceDisclaimer(
          this.guestPreferenceDisclaimer
        );
        this.preferencesApiData(result);
      });
  }

  checkAddGuestNamesVisibility(indx: number, isAddGuest: boolean) {
    if (isAddGuest) {
      return (this.displayAdditionalGuests && this.showAdditionalGuests[indx] && !this.toggleAddGuestsAddRemove[indx]);
    } else {
      return (this.displayAdditionalGuests && this.showAdditionalGuests[indx] && this.toggleAddGuestsAddRemove[indx]);
    }
  }

  getMessage(message: string, params: string[]) {
    return CommonUtility.fillMessage(message, params);
  }

  public updatedPreferences(specificPreferences, roomIndex) {
    specificPreferences.forEach((specificPref) => {
      this.preferencesData[roomIndex].forEach((preference) => {
        if (preference.questionType === specificPref.question_type) {
          if (
            (specificPref.preQuestionOptionIds.length > 0 &&
              preference.isPreQuestionRequired &&
              specificPref.question_id === preference.preQuestionId) ||
            (specificPref.preQuestionOptionIds.length === 0 &&
              !preference.isPreQuestionRequired &&
              specificPref.question_id === preference.questionID)
          ) {
            if (preference.isPreQuestionRequired) {
              preference.preQuestionOptions.forEach((preQuesOpt) => {
                if (
                  preQuesOpt.optionId === specificPref.preQuestionOptionIds[0]
                ) {
                  preference["selected_preOptionID"] = preQuesOpt.optionId;
                  preference["selected_preOptionValue"] =
                    preQuesOpt.optionLabel;
                  preference["selected_showMainQuestionValue"] =
                    preQuesOpt.isPreQuestionOptionToShowMainQuestion;
                }
              });
            }
            switch (preference.questionType) {
              case PREFERENCES_TYPES.FREETEXT:
                preference["requiredObj"].changed = true;
                preference.selected_optionValues = specificPref.option_text;
                break;
              case PREFERENCES_TYPES.MULTIPLE:
                let multiSelectOptIndex = 0;
                specificPref.option_ids.forEach((multiSelectOption) => {
                  preference.options.forEach((option) => {
                    if (option.optionId === multiSelectOption) {
                      const optID = preference["selected_optionID"];
                      preference.nonEditableOptionID.forEach(
                        (nonEditableID) => {
                          if (nonEditableID.optionID === option.optionId) {
                            nonEditableID.index = multiSelectOptIndex;
                          }
                        }
                      );
                      if (
                        optID === "" ||
                        optID === [] ||
                        optID.length === 0 ||
                        optID === null ||
                        optID === undefined
                      ) {
                        preference["selected_optionID"] = [];
                        preference["selected_optionID"][0] = _.get(
                          option,
                          "optionId"
                        );
                      } else {
                        preference.selected_optionID[
                          multiSelectOptIndex
                        ] = _.get(option, "optionId");
                      }
                      const optVal = preference["selected_optionValues"];
                      if (
                        optVal === "" ||
                        optVal === [] ||
                        optVal.length === 0 ||
                        optVal === null ||
                        optVal === undefined
                      ) {
                        preference["selected_optionValues"] = [];
                        preference["selected_optionValues"][0] = _.get(
                          option,
                          "optionValue"
                        );
                      } else {
                        preference.selected_optionValues[
                          multiSelectOptIndex
                        ] = _.get(option, "optionValue");
                      }
                      preference["multiSelectOptions"][multiSelectOptIndex] = {
                        optionId: option.optionId,
                        optionValue: option.optionValue,
                      };
                      multiSelectOptIndex++;
                      preference["requiredObj"].changed = true;
                    }
                  });
                });
                preference["settings"] = {
                  singleSelection: false,
                  idField: "optionId",
                  textField: "optionValue",
                  itemsShowLimit: 5,
                  limitSelection: preference["maxOptionsAllowed"],
                  enableCheckAll: false,
                  allowSearchFilter: false,
                };
                break;
              case PREFERENCES_TYPES.SINGLE:
                preference.options.forEach((option) => {
                  if (option.optionId === specificPref.option_ids[0]) {
                    preference["selected_optionValues"] = option.optionValue;
                    preference["selected_optionID"] = option.optionId;
                    preference["requiredObj"].changed = true;
                  }
                });
                break;
              case PREFERENCES_TYPES.TIME_BASED:
                preference.options.forEach((timeOpt) => {
                  if (timeOpt.optionID === specificPref.option_ids[0]) {
                    preference.selected_optionValues = timeOpt.optionValue;
                    preference.selected_am_pm = timeOpt.am_pm;
                    const timeVal = timeOpt.hour + ":" + timeOpt.minute;
                    preference.selected_time = {
                      time: timeVal,
                      id: timeOpt.optionID,
                      text: timeOpt.optionValue,
                    };
                    preference["selected_time_str"] = timeVal; // + ' ' + _.findKey(this.AM_PM_obj, (value) => value === timeOpt.am_pm);
                  }
                });
                preference["requiredObj"].changed = true;
                preference["timeOptArr"] = [];
                let index = 0;
                preference.options.forEach((el) => {
                  if (el.am_pm === preference.selected_am_pm) {
                    const opt = el.hour + ":" + el.minute;
                    preference["timeOptArr"][index] = {
                      time: opt,
                      id: el.optionID,
                      text: el.optionValue,
                    };
                    index++;
                  }
                });
                break;
              default:
                break;
            }
          }
        }
      });
    });
  }

  selectedPreferenceFn(item, selected) {
    if (selected.optionId && item.optionId)
      return item.optionId === selected.optionId;
  }
}
