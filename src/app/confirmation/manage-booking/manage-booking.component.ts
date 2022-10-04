import { Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import * as _ from "lodash";
import { Subscription } from "rxjs";
import {
  QUERY_PARAM_ATTRIBUTES,
  STEP_MAP,
  URL_PATHS,
} from "../../common/common.constants";
import { CommonUtility } from "../../common/common.utility";
import { GuestInfoDetails } from "../../common/models/guest-info-details.model";
import { Preferences } from "../../common/models/preferences.model";
import { ManageBookingService } from "../../common/services/manage-booking.service";
import { StoreService } from "../../common/services/store.service";
import { COUNTRY_DATA_LIST } from "../../common/utils/country-telephone-utils";
import {
  CheckinSummary,
  Guests,
} from "../../search/guestduration/checkinsummary.type";
import { ConfirmationPageComponent } from "../confirmation-page/confirmation-page.component";

@Component({
  selector: "app-manage-booking",
  templateUrl: "./manage-booking.component.html",
  styleUrls: ["./manage-booking.component.scss"],
})
export class ManageBookingComponent implements OnInit, OnDestroy {
  path: string;
  countryDataList = COUNTRY_DATA_LIST;
  private reservationLookUpSubscription: Subscription;
  cancellationReasons: any;
  cancellationDate: string;
  cancellationFee: number;
  bookingSource: string;
  guaranteePercentage: number;
  cancellationRequiredObj: any;
  localeObj: any;
  private _userSettingsSubscriptions: Subscription;
  private routerSubscription: Subscription;
  @ViewChild("ConfirmationPage", { static: true })
  confirmationPage: ConfirmationPageComponent;
  paymentInfo: any;

  constructor(
    private router: Router,
    private _route: ActivatedRoute,
    private manageBookingService: ManageBookingService,
    private storeSrv: StoreService
  ) {
    this.routerSubscription = this._route.queryParams.subscribe((params) => {
      this.storeSrv.updateReservationID(params["bookingReference"]);
      this.storeSrv.updateCurrentStep(STEP_MAP[URL_PATHS.CONFIRMATION_PAGE]);
    });
  }

  ngOnInit() {
    this.path = this.router.url;
    this.cancellationReasons = [];
    this.cancellationDate = "";
    this.bookingSource = "";
    this.cancellationFee = 0;
    this.guaranteePercentage = 0;
    this.cancellationRequiredObj = {
      cancellationFee: 0,
      bookingSource: "",
      cancellationDate: "",
      guaranteePercentage: 0,
      cancellationReasons: [],
    };
    this._userSettingsSubscriptions = this.storeSrv
      .getUserSettings()
      .subscribe((sharedData) => {
        this.localeObj = sharedData.localeObj;
      });
    this.routerSubscription = this._route.queryParams.subscribe((params) => {
      this.storeSrv.updateReservationID(params["bookingReference"]);
      const options = {
        bookingReference: params["bookingReference"],
        email: params["email"],
      };
      this.storeSrv.updateCurrentStep(STEP_MAP[URL_PATHS.CONFIRMATION_PAGE]);
      this.reservationLookUpSubscription = this.manageBookingService
        .getReservationLookup(options)
        .subscribe((data) => {
          const statuscode = _.get(data, "status.statusCode");
          const successFlag = _.get(data, "status.success");
          if (!successFlag) {
            this.reloadPage(
              statuscode,
              params["email"],
              params["bookingReference"]
            );
          }
          if (
            successFlag &&
            (statuscode === 1000 ||
              statuscode === 6902 ||
              statuscode === 6903 ||
              statuscode === 6904)
          ) {
            const resData = _.get(data, "data.reservationDetails");
            if (!params["bookingReference"].includes("MBS")) {
              this.storeSrv.updateReservationID(
                data.data && data.data.confirmationCode
              );
            }
            this.storeSrv.setAlaCarteAddonsTotal([
              data.data.reservationDetails.alaCarteAddOns,
            ]);

            if(!!data.data.reservationDetails.pgTransactionId) {
            this.storeSrv.setPGTransactionID(data.data.reservationDetails.pgTransactionId);
            } else {
              this.storeSrv.setPGTransactionID('');
            }

            const oldData = _.get(this.storeSrv.getBasketState(), "oldData");
            if (oldData) {
              oldData.prevRoom = resData.roomType;
              oldData.prevArrivalDate = resData.arrivalDate;
              oldData.prevDepartureDate = resData.departureDate;
              this.storeSrv.updateOldData(oldData);
            }
            this.storeSrv.updateExternalConfID(
              data.data && data.data.externalConfirmationCode
            );
            const iataNumber = _.get(
              data,
              "data.reservationDetails.iataNumber"
            );
            if (
              iataNumber !== "" &&
              iataNumber !== null &&
              iataNumber !== undefined
            ) {
              const iataObj = {};
              iataObj["prevIataNumber"] = "";
              iataObj["iataNumber"] = iataNumber;
              iataObj["iataAgencyName"] = "";
              iataObj["isValidIata"] = true;
              this.storeSrv.updateIATADetails(iataObj);
            }
            // Update Confirmation Code in store
            const confCodeList = [];
            confCodeList[0] = params["bookingReference"];
            const reservationRespObj = {
              ResvConfCodes: new Array<string>(),
              ConfirmationPageText: "",
              canModifyByConfCodes: [],
              failureStatusByConfCodes: [],
              showModify: false,
              showCancel: false,
              suppressRateOnLookup: false,
              guestuid: "",
              stayuid: "",
              payuid: "",
            };
            reservationRespObj["ResvConfCodes"] = confCodeList;
            reservationRespObj["CanModify"] = _.get(data, "data.canModify");
            const reserDetails = _.get(data, "data.reservationDetails");
            if (
              _.get(
                this.storeSrv.getUserSettingsState(),
                "propertyInfo.propertyType"
              ) === "RVNG"
            ) {
              reservationRespObj.guestuid = reserDetails.guestuid;
              reservationRespObj.stayuid = reserDetails.stayuid;
              reservationRespObj.payuid = reserDetails.payuid;
            }
            // reservationRespObj.canModifyByConfCodes[confCodeList[0]] = _.get(
            //   data,
            //   "data.canModify"
            // );
            reservationRespObj.canModifyByConfCodes = [confCodeList[0]];

            if (_.get(resData, "confirmationPageText")) {
              reservationRespObj["ConfirmationPageText"] = _.get(
                resData,
                "confirmationPageText"
              );
            }
            if (_.get(resData, "failureStatus")) {
              reservationRespObj["failureStatus"] = _.get(
                resData,
                "failureStatus"
              );
              reservationRespObj.failureStatusByConfCodes[
                confCodeList[0]
              ] = _.get(resData, "failureStatus");
            }
            if (statuscode === 1000) {
              reservationRespObj.showModify = true;
              reservationRespObj.showCancel = true;
            }
            if (statuscode === 6002) {
              reservationRespObj.showModify = false;
              reservationRespObj.showCancel = false;
            }
            if (statuscode === 6003) {
              reservationRespObj.showModify = true;
              reservationRespObj.showCancel = false;
            }
            if (statuscode === 6004) {
              reservationRespObj.showModify = false;
              reservationRespObj.showCancel = true;
            }

            //Edit propertyInfoObject's - default currency in case of multiproperty reservation look-up
            if(resData.propertyDefaultCurrency) {
            this.storeSrv.getUserSettingsState().propertyInfo.defaultCurrency = resData.propertyDefaultCurrency;
            this.storeSrv.updatePropertyInfoObj(this.storeSrv.getUserSettingsState().propertyInfo); 
            }

            // Populate Ala-carte addons
            this.storeSrv.fetchAlaCarteAddonsTotal(resData.alaCarteAddOns);
            
            // Updates default currency in case of multiproperty reservtion look-up
            this.confirmationPage.defCurrFilter = resData.propertyDefaultCurrency || _.get(
              this.storeSrv.getUserSettingsState(),
              "propertyInfo.defaultCurrency"
            ) || "SGD";
            this.confirmationPage.bookingInfo.defCurrFilter = this.confirmationPage.defCurrFilter;
            this.confirmationPage.defCurrCode = CommonUtility.getCurrSymbolForType(
              this.storeSrv.getUserSettingsState().propertyInfo,
              resData.propertyDefaultCurrency
            );
            this.confirmationPage.bookingInfo.defCurrCode = this.confirmationPage.defCurrCode;
            this.confirmationPage.multiPropertyCurrency = (resData.propertyDefaultCurrency.length > 0) ? true : false;

            if (data.data.prepaidBooking !== undefined) {
              this.confirmationPage.isPrepaidBooking = data.data.prepaidBooking;
            }

            // SuppressRateOnLookup
            reservationRespObj.suppressRateOnLookup = _.get(
              resData,
              "suppressRateOnLookup"
            );
            this.cancellationRequiredObj["suppressRateOnLookup"] = _.get(
              resData,
              "suppressRateOnLookup"
            );

            this.storeSrv.updateReservationResponse(reservationRespObj);

            // Cancellation Last Date
            if (
              _.get(resData, "cancelWithoutPenaltyDateTime") !== undefined &&
              _.get(resData, "cancelWithoutPenaltyDateTime") !== null &&
              _.get(resData, "cancelWithoutPenaltyDateTime") !== "" &&
              _.get(resData, "cancelWithoutPenaltyDateTime").length > 0
            ) {
              this.cancellationDate = resData.cancelWithoutPenaltyDateTime;
              this.cancellationRequiredObj["cancellationDate"] =
                resData.cancelWithoutPenaltyDateTime;
            } else {
              this.cancellationDate = "";
              this.cancellationRequiredObj["cancellationDate"] = "";
            }

            // Cancellation Fee Applicable Flag
            if (
              _.get(resData, "cancellationFeeApply") !== undefined &&
              _.get(resData, "cancellationFeeApply") !== null
            ) {
              this.cancellationRequiredObj["cancellationFeeApply"] =
                resData.cancellationFeeApply;
            } else {
              this.cancellationRequiredObj["cancellationFeeApply"] = false;
            }

            // Late Cancellation Fee
            if (
              _.get(resData, "lateCancellationFee") !== undefined &&
              _.get(resData, "lateCancellationFee") !== null
            ) {
              this.cancellationFee = resData.lateCancellationFee;
              this.cancellationRequiredObj["cancellationFee"] =
                resData.lateCancellationFee;
            } else {
              this.cancellationFee = 0;
              this.cancellationRequiredObj["cancellationFee"] = 0;
            }

            // Booking Source
            if (
              _.get(resData, "bookingSource") !== undefined &&
              _.get(resData, "bookingSource") !== null
            ) {
              this.bookingSource = _.get(resData, "bookingSource");
              this.cancellationRequiredObj["bookingSource"] = _.get(
                resData,
                "bookingSource"
              );
            } else {
              this.bookingSource = "";
              this.cancellationRequiredObj["bookingSource"] = "";
            }

            // Guarantee Percentage
            if (
              _.get(resData, "guaranteePercentage") !== undefined &&
              _.get(resData, "guaranteePercentage") !== null
            ) {
              this.cancellationRequiredObj["guaranteePercentage"] = _.get(
                resData,
                "guaranteePercentage"
              );
            } else {
              this.cancellationRequiredObj["guaranteePercentage"] = 0;
            }

            if (!!resData.pgDepositAmount) {
              this.storeSrv.setPGDepositAmount(resData.pgDepositAmount);
              }

            const defCurrencyCode = this.storeSrv.getUserSettingsState()
              .propertyInfo.defaultCurrency;
            // Guest Summary population
            const guestSummary = new CheckinSummary();
            const checkindate = this.getCalYearMonthDatefromString(
              resData.arrivalDate
            );
            guestSummary.checkindate = new Date(
              checkindate[0],
              checkindate[1],
              checkindate[2],
              0,
              0,
              0
            );
            const checkoutdate = this.getCalYearMonthDatefromString(
              resData.departureDate
            );
            guestSummary.checkoutdate = new Date(
              checkoutdate[0],
              checkoutdate[1],
              checkoutdate[2],
              0,
              0,
              0
            );
            guestSummary.currency = defCurrencyCode;
            guestSummary.locale = "en";
            guestSummary.restrictionFailed = false;
            guestSummary.rooms = 1;
            guestSummary.guests[0] = new Guests(
              resData.numberOfAdults,
              resData.numberOfChildren
            );
            const timeDiff = Math.abs(
              guestSummary.checkindate.getTime() -
                guestSummary.checkoutdate.getTime()
            );
            const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
            guestSummary.los = diffDays;
            // Storing the Guest Summary into Basket
            this.storeSrv.updateGuestDuration(guestSummary);

            const iataObject = {};
            iataObject["prevIataNumber"] = iataObject["iataNumber"];
            iataObject["iataNumber"] = undefined;
            iataObject["iataAgencyName"] = "";
            if (_.get(resData, "iataNumber") !== undefined) {
              iataObject["iataNumber"] = resData.iataNumber;
            }
            if (_.get(resData, "iataAgencyName") !== undefined) {
              iataObject["iataAgencyName"] = resData.iataAgencyName;
            }
            this.storeSrv.updateIATADetails(iataObject);

            // Guest-Info population
            const guestInfo = new GuestInfoDetails();
            guestInfo.firstName =
              resData.guestInfo.firstName &&
              resData.guestInfo.firstName !== null
                ? resData.guestInfo.firstName
                : "";
            guestInfo.lastName =
              resData.guestInfo.lastName && resData.guestInfo.lastName !== null
                ? resData.guestInfo.lastName
                : "";
            const countryToSet = this.countryDataList.find((c) => {
              return c.countryCode_2 === resData.guestInfo.countryCode;
            });
            guestInfo.phoneNumber = !!countryToSet
              ? resData.guestInfo.phoneNumber &&
                resData.guestInfo.phoneNumber.substr(
                  countryToSet.callingCode.split("+")[1].length
                )
              : resData.guestInfo.phoneNumber;
            guestInfo.emailAddress = resData.guestInfo.emailAddress;
            guestInfo.countryCode = resData.guestInfo.countryCode;
            guestInfo.salutation = resData.guestInfo.salutation || "";
            guestInfo.city = resData.guestInfo.city;
            guestInfo.state = resData.guestInfo.state;
            guestInfo.streetAddress1 = resData.guestInfo.streetAddress1;
            guestInfo.streetAddress2 = resData.guestInfo.streetAddress2;
            guestInfo.postalCode = resData.guestInfo.postalCode;
            guestInfo.callingCode =
              countryToSet && countryToSet.callingCode
                ? countryToSet && countryToSet.callingCode
                : "";
            guestInfo.countryName =
              resData.guestInfo.countryName &&
              resData.guestInfo.countryName !== "Unknown" &&
              resData.guestInfo.countryName !== null
                ? resData.guestInfo.countryName
                : "";
            // Guest-Preferences population
            const guestPreferences = [];
            const prefData = _.get(resData, "guestPreferences");
            let prefIndex = 0;
            if (prefData) {
              prefData.forEach((preference) => {
                const pref = {
                  question_type: "",
                  question_id: "",
                  questionLabel: "",
                  option_ids: [],
                  optionsLabel: [],
                  option_text: "",
                  preQuestionOptionIds: [],
                  preQuestionOptionLabel: [],
                };
                pref["question_type"] = preference.questionType;
                pref["question_id"] = preference.questionId;
                pref["questionLabel"] = preference.questionLabel;
                pref["questionText"] = preference.questionText;
                let index = 0;
                if (
                  preference.preOptions !== null &&
                  preference.preOptions !== undefined &&
                  preference.preOptions.length > 0
                ) {
                  const preOptions = preference.preOptions;
                  preOptions.forEach((ele) => {
                    pref["preQuestionOptionIds"][index] = ele.optionId;
                    pref["preQuestionOptionLabel"][index] =
                      ele.isPreQuestionOptionToShowMainQuestion;
                    index++;
                  });
                }
                if (preference.questionType === "freeText") {
                  pref["option_text"] = preference.optionText;
                } else if (
                  preference.options !== null &&
                  preference.options !== undefined &&
                  preference.options.length > 0
                ) {
                  const prefOpt = preference.options;
                  const type = preference.questionType;
                  index = 0;
                  prefOpt.forEach((ele) => {
                    pref["option_ids"][index] = ele.optionId;
                    pref["optionsLabel"][index] = ele.optionValue;
                    index++;
                  });
                }
                guestPreferences[prefIndex] = pref;
                prefIndex++;
              });
            }

            // Ticketing add-on package population
            const packageDetails = [];

            if (
              _.get(resData, "packages") !== null &&
              _.get(resData, "packages") !== undefined &&
              _.get(resData, "packages").length > 0
            ) {
              const pkgData = {
                AddOnConsent: resData.packages[0].addOnConsent,
                AddonId: resData.packages[0].addOnId,
                Category: resData.packages[0].category,
                Price: resData.packages[0].unitPrice,
                DefPrice: resData.packages[0].unitPrice,
                TotalPrice: resData.totalAddOnPrice,
                DefTotalPrice: resData.totalAddOnPrice,
                Name: resData.packages[0].name,
                NoOfSeats: resData.packages[0].count,
                ShowTime: resData.packages[0].dateTime,
              };
              packageDetails.push(pkgData);
            }
            // Rateplan details population

            if(resData.packageAddOnTaxes > 0) {
              const obj = {};
              obj["code"] = "PAT";
              obj["description"] = "Package Addon Tax";
              obj[
                "name"
              ] = this.localeObj.tf_5_Confirmation_bookingInfo_packageAddonTaxes;
              obj["taxAmount"] = {
                [resData.propertyDefaultCurrency || _.get(
                  this.storeSrv.getUserSettingsState(),
                  "propertyInfo.defaultCurrency"
                ) || "SGD"] : resData.packageAddOnTaxes
              };
              resData.taxBreakDown.push(obj)
            }
            const ratePlan = {
              code: resData.rateCode,
              name: resData.ratePlanName,
              cancellationPolicy: resData.cancellationPolicy,
              guaranteePercentage: resData.guaranteePercentage,
              taxBreakDown: resData.taxBreakDown,
              packageAddOnTaxesByCurrency: {
                [this.storeSrv.getUserSettingsState()
                  .propertyInfo.defaultCurrency ] : (resData.packageAddOnTaxes || 0)
              }
            };

            // Pricing object population
            const code = CommonUtility.getCurrSymbolForType(
              this.storeSrv.getUserSettingsState().propertyInfo,
              defCurrencyCode
            );
            const pricing = {
              CurrencyCode: defCurrencyCode,
              CurrencySymbol: code,
              Tax: resData.taxAndServices,
              DefTax: resData.taxAndServices,
              DefRoomRateAddonPrice: resData.preTaxAmount,
              PackagePrice: resData.totalRoomPrice,
              DefPackagePrice: resData.totalRoomPrice,
              TotalAddonPrice: resData.totalAddOnPrice,
              DefTotalAddonPrice: resData.totalAddOnPrice,
              TotalPrice: resData.totalPrice,
              DefTotalPrice: resData.totalPrice,
              TotalPriceByCurrency: resData.totalPriceByCurrency,
            };

            // Room details object population
            const roomDetails = {
              code: resData.roomCode,
              name: resData.roomType + " " + resData.roomView,
              roomType: resData.roomType,
              roomView: resData.roomView,
              largeImageUrl: resData.largeImageUrl,
            };

            // Payment Info population
            if (resData.creditCardDetails) {
              let cardNum = resData.creditCardDetails.cardNumber;
              if (cardNum.length === 4) {
                cardNum = "xxxxxxxxxxxx" + cardNum;
              }
              this.paymentInfo = {
                cardType: resData.creditCardDetails.cardType,
                cardHolderName: resData.creditCardDetails.cardHolderName,
                expMonth: resData.creditCardDetails.expMonth,
                expYear: resData.creditCardDetails.expYear,
                cardNumber: cardNum,
              };
            }
            // Room object population
            const roomObj = [
              {
                SerialNo: 1,
                roomIndex: 0,
                UniqueCode: resData.roomCode,
                RoomCode: resData.roomCode,
                RoomDetails: roomDetails,
                RatePlan: ratePlan,
                Pricing: pricing,
                GuestInfo: guestInfo,
                PaymentInfo: this.paymentInfo || "",
                Packages: packageDetails,
                BedTypeName: resData.bedTypeName,
                CurrencyCode: defCurrencyCode,
                CurrencyCodeSymbol: code,
                additionalGuests: resData.additionalGuests || []
              },
            ];

            // Store GuestPreferenceDisclaimer Text
            let guestPreferenceDisclaimer = "";
            guestPreferenceDisclaimer = _.get(
              resData,
              "guestPreferenceDisclaimer"
            );
            this.storeSrv.updateGuestPreferenceDisclaimer(
              guestPreferenceDisclaimer
            );
            // Storing Room object into Basket reducer
            this.storeSrv.updateRoomsWithoutCalculation(roomObj);
            this.storeSrv.updateManageBooking(roomObj[0]);

            this.storeSrv.upsertSingleRoomGuestPreference(guestPreferences, 0);
            const basketData = this.storeSrv.getBasketState();
            this.confirmationPage.refreshData(basketData);

            // Cancellation Reasons population
            this.cancellationReasons = resData.cancellationReasons;
            this.cancellationRequiredObj["cancellationReasons"] = _.get(
              resData,
              "cancellationReasons"
            );
          }
          // else {
          //   const navigationExtras = {};
          //   this.router.navigate([URL_PATHS.SYSTEM_ERROR], navigationExtras);
          // }
        });
    });
  }

  ngOnDestroy() {
    const subscriptionsList = [
      this.reservationLookUpSubscription,
      this._userSettingsSubscriptions,
      this.routerSubscription,
    ];
    CommonUtility.removeSubscriptions(subscriptionsList);
  }

  // method to retain date irrespective of time zones
  public getCalYearMonthDatefromString(dateStr: string) {
    const tokens = dateStr.split("-");
    return [Number(tokens[0]), Number(tokens[1]) - 1, Number(tokens[2])];
  }

  reloadPage(statusCode?: string, emailId?: string, bookRefNumber?: string) {
    const params = {
      errorCode: statusCode !== undefined ? statusCode : "",
      email: emailId,
      confirmNum: bookRefNumber,
    };
    const navigationExtras = {
      queryParams: params,
    };
    this.router.navigate(["/" + URL_PATHS.MANAGE_BOOKING], navigationExtras);
  }
}
