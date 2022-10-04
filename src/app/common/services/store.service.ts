import { Inject, Injectable } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { State, Store } from "@ngrx/store";
import * as _ from "lodash";
import * as Rollbar from "rollbar";
import { BehaviorSubject } from "rxjs";
import { RollbarService } from "src/app/rollbar";
import { environment } from "src/environments/environment";
import {
  CUSTOM_CURRENCY_FORMAT,
  DUMMY_CC_DETAILS,
  error_code_prefix,
  NON_DECIMAL_CURRENCIES,
  PAYMENT_CARD_TYPE,
  showPreferences,
} from "../../common/common.constants";
import { RatePlan } from "../../common/models/packagedetails";
import { PricingDetail } from "../../common/models/pricing-detail.model";
import { CustomPriceFormatPipe } from "../../common/pipes/decimal-format.pipe";
import { STORE_ACTIONS } from "../../common/store/actions/appActions";
import { AppState } from "../../common/store/reducers";
import {
  CheckinSummary,
  ICheckinSummary,
} from "../../search/guestduration/checkinsummary.type";
import { CommonUtility } from "../common.utility";
import { CreditCardDetails } from "../models/credit-card-details.model";
import { GuestInfoDetails } from "../models/guest-info-details.model";
import { ReservationDetails } from "../models/reservation-details.model";
import { IErrorHandlerState } from "../store/reducers/error-handler.reducer";
import { IUserSettingsState } from "../store/reducers/user-settings.reducer";
import {
  PAYMENT_FAILURE_CALLBACK,
  PAYMENT_SUCCESS_CALLBACK,
} from "../urls.constants";
@Injectable()
export class StoreService {
  constructor(
    private store: Store<any>,
    private state: State<AppState>,
    private _route: ActivatedRoute,
    private pricePipe: CustomPriceFormatPipe,
    @Inject(RollbarService) private rollbar: Rollbar
  ) {}
  
  private userModifiedCurr = new BehaviorSubject(false);
  currentCurrency = this.userModifiedCurr.asObservable();

  getBasketState() {
    return this.state.value.basketServiceReducer;
  }

  getBasket() {
    return this.store.select("basketServiceReducer");
  }

  getErrorHandlerState() {
    return this.state.value.errorHandlerReducer;
  }

  getErrorHandler() {
    return this.store.select("errorHandlerReducer");
  }

  getUserSettings() {
    return this.store.select("userSettingsReducer");
  }

  getUserSettingsState(): IUserSettingsState {
    return this.state.value.userSettingsReducer;
  }

  getGuestSummary(): CheckinSummary {
    return this.state.getValue().basketServiceReducer.GuestSummary;
  }

  getGuestInfo() {
    return this.state.getValue().basketServiceReducer.guestInfo;
  }

  getSingleRoomGuestInfo() {
    if (this.state.getValue().basketServiceReducer.Rooms.length > 0) {
      return this.state.getValue().basketServiceReducer.Rooms[0].GuestInfo;
    } else {
      if (this.getManageBookingFlowStatus()) {
        return this.state.getValue().basketServiceReducer.ManageRoomBooking
          .GuestInfo;
      }
    }
    return undefined;
  }

  getSingleRoomCreditCardInfo() {
    if (this.state.getValue().basketServiceReducer.Rooms.length > 0) {
      return this.state.getValue().basketServiceReducer.Rooms[0].PaymentInfo;
    } else {
      if (this.getManageBookingFlowStatus()) {
        return this.state.getValue().basketServiceReducer.ManageRoomBooking
          .PaymentInfo;
      }
    }
    return undefined;
  }

  getSingleRoomInfo() {
    if (_.get(this.state.getValue(), "basketServiceReducer.Rooms.length") > 0) {
      return this.state.getValue().basketServiceReducer.Rooms[0];
    }
    return undefined;
  }

  getReservationID() {
    return this.state.getValue().basketServiceReducer.ReservationID;
  }

  getManageBookingFlowStatus() {
    if (
      this.state.getValue().basketServiceReducer.ReservationID !== "" &&
      this.state.getValue().basketServiceReducer.ReservationID !== undefined &&
      this.state.getValue().basketServiceReducer.ReservationID !== null
    ) {
      return true;
    }
    return false;
  }
  getReservationType() {
    let isNew = false;
    let isModified = false;
    let isCancelled = false;
    const reservationID = this.state.getValue().basketServiceReducer
      .ReservationID;
    const cancellationCode = this.state.getValue().basketServiceReducer
      .cancellationCode;
    if (
      reservationID !== "" &&
      reservationID !== undefined &&
      reservationID !== null &&
      (cancellationCode === "" ||
        cancellationCode === undefined ||
        cancellationCode === null)
    ) {
      isModified = true;
    } else {
      isNew = true;
    }
    if (
      cancellationCode !== "" &&
      cancellationCode !== undefined &&
      cancellationCode !== null
    ) {
      isCancelled = true;
    }
    return { isNew, isModified, isCancelled };
  }

  updateGDPRCookieValue(value: boolean) {
    this.store.dispatch({
      type: STORE_ACTIONS.ACTION_GDPR_SET,
      payload: value,
    });
  }

  updateSortOrder(sortOrder: any) {
    this.store.dispatch({
      type: STORE_ACTIONS.ACTION_SORT_ORDER_SET,
      payload: sortOrder,
    });
  }

  updateGuestDuration(guestDuration: ICheckinSummary) {
    this.store.dispatch({
      type: STORE_ACTIONS.ACTION_GUEST_DURATION_SET,
      payload: guestDuration,
    });
  }

  updateMapView(mapView: any) {
    this.store.dispatch({
      type: STORE_ACTIONS.ACTION_MAP_VIEW,
      payload: mapView,
    });
  }

  updateViewType(mobileView: any) {
    this.store.dispatch({
      type: STORE_ACTIONS.ACTION_VIEW_TYPE,
      payload: mobileView,
    });
  }

  updateRateCalModifyFlag(isRateCalModify) {
    this.store.dispatch({
      type: STORE_ACTIONS.ACTION_RATE_CAL_MODIFY_FLAG,
      payload: isRateCalModify,
    });
  }

  updateAlipayResResp(resResp: any) {
    this.store.dispatch({
      type: STORE_ACTIONS.ACTION_ALIPAY_RESRESP_SET,
      payload: resResp,
    });
  }

  updateMPGSSesResp(resResp: any) {
    this.store.dispatch({
      type: STORE_ACTIONS.ACTION_MPGS_SESRESP_SET,
      payload: resResp,
    });
  }

  updateRoomType(roomtype: any) {
    this.store.dispatch({
      type: STORE_ACTIONS.ACTION_ROOM_TYPE_SET,
      payload: roomtype,
    });
  }

  updateOfferCode(code: string) {
    this.store.dispatch({
      type: STORE_ACTIONS.ACTION_OFFER_CODE_SET,
      payload: code,
    });
  }

  updateRateCode(code: string) {
    this.store.dispatch({
      type: STORE_ACTIONS.ACTION_RATE_CODE_SET,
      payload: code,
    });
  }

  updateRoomView(roomview: any) {
    this.store.dispatch({
      type: STORE_ACTIONS.ACTION_ROOM_VIEW_SET,
      payload: roomview,
    });
  }

  updateLocationView(location: any) {
    this.store.dispatch({
      type: STORE_ACTIONS.ACTION_RESET_MULTI_PROP_FILTERS,
      payload: false,
    });

    this.store.dispatch({
      type: STORE_ACTIONS.ACTION_LOCATION_SET,
      payload: location,
    });
  }

  updateRatingView(rating: any) {
    this.store.dispatch({
      type: STORE_ACTIONS.ACTION_RESET_MULTI_PROP_FILTERS,
      payload: false,
    });

    this.store.dispatch({
      type: STORE_ACTIONS.ACTION_RATING_SET,
      payload: rating,
    });
  }

  updateHotelListSortOrder(sortOrder: any) {
    this.store.dispatch({
      type: STORE_ACTIONS.ACTION_HOTEL_LIST_SORT_ORDER,
      payload: sortOrder,
    });
  }

  updateCurrencyCode(currCode: any) {
    if (this.getBasketState().isSearchPageVisited) {
      this.store.dispatch({
        type: STORE_ACTIONS.ACTION_UPDATE_RESET_FILTERS_FLAG,
        payload: false,
      });
    }
    this.store.dispatch({
      type: STORE_ACTIONS.ACTION_CURRENCY_CODE_SET,
      payload: currCode,
    });
  }

  updateManageBooking(room: any) {
    this.store.dispatch({
      type: STORE_ACTIONS.ACTION_MANAGE_ROOM_SET,
      payload: room,
    });
  }

  updateDeviceType(deviceType: any) {
    this.store.dispatch({
      type: STORE_ACTIONS.ACTION_UPDATE_DEVICE_TYPE,
      payload: deviceType,
    });
  }

  updatePolicyCodeAndGuaranteePercentage(
    policyCode: any,
    guaranteePercentage: any,
    alipayAlertText: any,
    isPastCancellationDate: any,
    mpgsAlertText: any,
    policyText: any,
    policyGuaranteeType: any,
    prePaymentType: any,
    cancellationPolicy: any,
  ) {
    let resData;
    resData = this.getBasketState().Rooms;
    for (let index = 0; index < this.getBasketState().Rooms.length; index++) {
      resData[index].RatePlan.policyCode = policyCode;
      resData[index].RatePlan.guaranteePercentage = guaranteePercentage;
      resData[index].RatePlan.alipayAlertText = alipayAlertText;
      resData[index].RatePlan.isPastCancellationDate = isPastCancellationDate;
      resData[index].RatePlan.mpgsAlertText = mpgsAlertText;
      resData[index].RatePlan.policyText = policyText;
      resData[index].RatePlan.policyGuaranteeType = policyGuaranteeType;
      resData[index].RatePlan.prePaymentType = prePaymentType;
      resData[index].RatePlan.cancellationPolicy = cancellationPolicy;
      this.store.dispatch({
        type: STORE_ACTIONS.ACTION_UPDATE_POLICY_CODE_GUARANTEE_PERCENTAGE,
        payload: resData[index].RatePlan,
        roomNo: index,
      });
    }
  }

  calculateRoomPricing(room: any) {
    if (
      room.RatePlan === undefined ||
      room === [] ||
      room === undefined ||
      room === null
    ) {
      return undefined;
    }
    const currCode = this.getBasketState().CurrencyCode;
    const defCurrCode =
      _.get(this.getUserSettingsState(), "propertyInfo.defaultCurrency") ||
      "SGD";
    let totalPrice = 0;
    let defTotalPrice = 0;
    let FormattedTotalPrice = 0;
    let totalPricewithPackageAddons = 0;
    let DefnTotalPriceWithPackageAddOn = 0;
    const tax = room.RatePlan.taxesAndServiceChargesByCurrency[currCode] || 0.0;
    const unFormattedTax = CommonUtility.roundedValue(
      room.RatePlan.taxesAndServiceChargesByCurrency[currCode],
      2
    );
    const FormattedTax =
      Number(this.applyPriceFormatPipe(unFormattedTax, currCode, true)) || 0.0;
    const defTax =
      room.RatePlan.taxesAndServiceChargesByCurrency[defCurrCode] || 0.0;

    let totalOfAddons = 0;
    let defTotalOfAddons = 0;
    let FormattedTotalOfAddons = 0;
    if (room.Packages !== undefined && room.Packages.length > 0) {
      for (let index = 0; index < room.Packages.length; index++) {
        room.Packages[index].Price =
          room.Packages[index].AddonPriceByCurrencyObj[currCode];
        room.Packages[index].TotalPrice =
          room.Packages[index].Price * room.Packages[index].NoOfSeats;
        totalOfAddons += room.Packages[index].TotalPrice;
        defTotalOfAddons += room.Packages[index].DefTotalPrice;
        const FormattedAddonPrice = CommonUtility.roundedValue(
          room.Packages[index].Price,
          2
        );
        FormattedTotalOfAddons =
          this.applyPriceFormatPipe(FormattedAddonPrice, currCode, true) *
          room.Packages[index].NoOfSeats;
      }
    }

    let packagePrice = 0;
    let defPackagePrice = 0;
    let roomRate = 0;
    let defRoomRate = 0;
    let packagePriceWithPackageAddons = 0;
    let defPackagePriceWithPackageAddons = 0;
    let userPackageAddonsTaxes = 0;
    let defPackageAddonsTaxes = 0;
    const GuestSummaryObj = this.getGuestSummary();
    if (totalOfAddons !== 0) {
      // const addonprice = CommonUtility.roundedValue(totalOfAddons, 2);
      // const formattedAddonPrice = this.applyPriceFormatPipe(addonprice, currCode, true);
      roomRate += Number(FormattedTotalOfAddons);
    }
    if (defTotalOfAddons !== 0) {
      const addonprice = CommonUtility.roundedValue(defTotalOfAddons, 2);
      const formattedAddonPrice = this.applyPriceFormatPipe(
        addonprice,
        currCode,
        true
      );
      defRoomRate += Number(formattedAddonPrice);
    }
    for (let index = 0; index < room.RatePlan.nightlyPrices.length; index++) {
      userPackageAddonsTaxes = room.RatePlan.packageAddOnTaxesByCurrency[currCode];
      defPackageAddonsTaxes = room.RatePlan.packageAddOnTaxesByCurrency[defCurrCode];
      if (
        room.RatePlan.nightlyPrices[index].discountedPriceByCurrency[
          currCode
        ] !== undefined &&
        room.RatePlan.nightlyPrices[index].discountedPriceByCurrency[
          currCode
        ] !== null
      ) {
        packagePrice =
          packagePrice +
          room.RatePlan.nightlyPrices[index].discountedPriceByCurrency[
            currCode
          ];
        packagePriceWithPackageAddons = packagePriceWithPackageAddons +
          room.RatePlan.nightlyPrices[index].discountedPriceByCurrencyWithPackageAddOnsTaxes[
          currCode
          ];
        const roomPrice = CommonUtility.roundedValue(
          room.RatePlan.nightlyPrices[index].discountedPriceByCurrency[
            defCurrCode
          ],
          2
        );
        if(_.get(this.getUserSettingsState(), "propertyInfo.propertyType") === "UD") {
          defPackagePrice = room.RatePlan.pretaxPriceByCurrency[currCode];
          defPackagePriceWithPackageAddons = room.RatePlan.pretaxPriceByCurrency[currCode];
        } else {
          const formattedPackagePrice = this.applyPriceFormatPipe(
            roomPrice,
            defCurrCode,
            true
          );
          defPackagePrice = defPackagePrice + formattedPackagePrice;
          defPackagePriceWithPackageAddons = defPackagePriceWithPackageAddons +
          this.applyPriceFormatPipe(
            CommonUtility.roundedValue(
              room.RatePlan.nightlyPrices[index].discountedPriceByCurrencyWithPackageAddOnsTaxes[
              defCurrCode
              ],
              2
            ),
            defCurrCode,
            true
          );
        }


        const roomRatePrice = CommonUtility.roundedValue(
          room.RatePlan.nightlyPrices[index].discountedPriceByCurrency[
          currCode
          ],
          2
        );
        const formatedRoomRate = this.applyPriceFormatPipe(
          roomRatePrice,
          currCode,
          true
        );

        const defRoomRatePrice = CommonUtility.roundedValue(
          room.RatePlan.nightlyPrices[index].discountedPriceByCurrency[
          defCurrCode
          ],
          2
        );
        const defFormatedRoomRate = this.applyPriceFormatPipe(
          defRoomRatePrice,
          defCurrCode,
          true
        );
        
        totalPricewithPackageAddons = (roomRate + Number
          (this.applyPriceFormatPipe(
            CommonUtility.roundedValue(
              room.RatePlan.nightlyPrices[index].discountedPriceByCurrencyWithPackageAddOnsTaxes[currCode],
            2), currCode,true
          )
        )) || (roomRate + Number
          (this.applyPriceFormatPipe(
            CommonUtility.roundedValue(
              room.RatePlan.nightlyPrices[index].priceByCurrencyWithPackageAddOnsTaxes[currCode],
            2), currCode,true
          )
        ));

        DefnTotalPriceWithPackageAddOn = (defRoomRate + Number
          (this.applyPriceFormatPipe(
            CommonUtility.roundedValue(
              room.RatePlan.nightlyPrices[index].discountedPriceByCurrencyWithPackageAddOnsTaxes[defCurrCode],
            2), defCurrCode,true
          )
        )) ||(defRoomRate + Number
          (this.applyPriceFormatPipe(
            CommonUtility.roundedValue(
              room.RatePlan.nightlyPrices[index].priceByCurrencyWithPackageAddOnsTaxes[defCurrCode],
            2), defCurrCode,true
          )
        ));

        roomRate = roomRate + Number(formatedRoomRate);
        defRoomRate = defRoomRate + Number(defFormatedRoomRate);
      } else {
        packagePrice =
          packagePrice +
          room.RatePlan.nightlyPrices[index].priceByCurrency[currCode];

        packagePriceWithPackageAddons = packagePriceWithPackageAddons +
          room.RatePlan.nightlyPrices[index].discountedPriceByCurrencyWithPackageAddOnsTaxes[
          currCode
          ];
        const roomPrice = CommonUtility.roundedValue(
          room.RatePlan.nightlyPrices[index].priceByCurrency[defCurrCode],
          2
        );
        if (_.get(this.getUserSettingsState(), "propertyInfo.propertyType") === "UD") {
          defPackagePrice = room.RatePlan.pretaxPriceByCurrency[currCode];
          defPackagePriceWithPackageAddons = room.RatePlan.pretaxPriceByCurrency[currCode];
        } else {
          const formattedPackagePrice = this.applyPriceFormatPipe(
            roomPrice,
            defCurrCode,
            true
          );
          defPackagePrice = defPackagePrice + formattedPackagePrice;
          defPackagePriceWithPackageAddons = defPackagePriceWithPackageAddons +
          this.applyPriceFormatPipe(
            CommonUtility.roundedValue(
              room.RatePlan.nightlyPrices[index].priceByCurrencyWithPackageAddOnsTaxes[
              defCurrCode
              ],
              2
            ),
            defCurrCode,
            true
          );
        }

        const roomRatePrice = CommonUtility.roundedValue(
          room.RatePlan.nightlyPrices[index].priceByCurrency[currCode],
          2
        );
        const formatedRoomRate = this.applyPriceFormatPipe(
          roomRatePrice,
          currCode,
          true
        );

        totalPricewithPackageAddons = (roomRate + Number
          (this.applyPriceFormatPipe(
            CommonUtility.roundedValue(
              room.RatePlan.nightlyPrices[index].discountedPriceByCurrencyWithPackageAddOnsTaxes[currCode],
            2), currCode,true
          )
        )) || (roomRate + Number
          (this.applyPriceFormatPipe(
            CommonUtility.roundedValue(
              room.RatePlan.nightlyPrices[index].priceByCurrencyWithPackageAddOnsTaxes[currCode],
            2), currCode,true
          )
        ));

        const defRoomRatePrice = CommonUtility.roundedValue(
          room.RatePlan.nightlyPrices[index].priceByCurrency[defCurrCode],
          2
        );
        const defFormatedRoomRate = this.applyPriceFormatPipe(
          defRoomRatePrice,
          defCurrCode,
          true
        );

        DefnTotalPriceWithPackageAddOn = (defRoomRate + Number
          (this.applyPriceFormatPipe(
            CommonUtility.roundedValue(
              room.RatePlan.nightlyPrices[index].discountedPriceByCurrencyWithPackageAddOnsTaxes[defCurrCode],
            2), defCurrCode,true
          )
        )) || ( defRoomRate + Number
          (this.applyPriceFormatPipe(
            CommonUtility.roundedValue(
              room.RatePlan.nightlyPrices[index].priceByCurrencyWithPackageAddOnsTaxes[defCurrCode],
            2), defCurrCode,true
          )
        ));

        roomRate = roomRate + Number(formatedRoomRate);
        defRoomRate = defRoomRate + Number(defFormatedRoomRate);
      }
    }
    totalPrice = CommonUtility.roundedValue(roomRate + tax, 2);
    defTotalPrice = CommonUtility.roundedValue(defRoomRate + defTax, 2);
    FormattedTotalPrice = CommonUtility.roundedValue(
      roomRate + FormattedTax,
      2
    );
    const packagePriceData = new PricingDetail();
    packagePriceData.PackagePrice = packagePrice;
    packagePriceData.DefPackagePrice = defPackagePrice;
    packagePriceData.Tax = tax;
    packagePriceData.DefTax = defTax;
    packagePriceData.FormattedTax = FormattedTax;
    packagePriceData.TotalPrice = totalPrice;
    packagePriceData.DefTotalPrice = defTotalPrice;
    packagePriceData.FormattedTotalPrice = FormattedTotalPrice;
    packagePriceData.CurrencyCode = currCode;
    packagePriceData.CurrencySymbol = CommonUtility.getCurrSymbolForType(
      this.getUserSettingsState().propertyInfo,
      currCode
    );
    packagePriceData.TotalAddonPrice = totalOfAddons;
    packagePriceData.DefTotalAddonPrice = defTotalOfAddons;
    packagePriceData.RoomRateAddonPrice = roomRate;
    packagePriceData.DefRoomRateAddonPrice = defRoomRate;
    packagePriceData.TotalPriceByCurrency = totalPrice;
    packagePriceData.PackagePriceWithPackageAddons = packagePriceWithPackageAddons;
    packagePriceData.DefPackagePriceWithPackageAddOnTaxes = defPackagePriceWithPackageAddons;
    packagePriceData.TotalPriceWithPackageAddOnTaxesByCurrency = CommonUtility.roundedValue(totalPrice + (userPackageAddonsTaxes || 0), 2);
    packagePriceData.DefnTotalPriceWithPackageAddOnTaxesByCurrency = CommonUtility.roundedValue(defTotalPrice + (defPackageAddonsTaxes || 0), 2);
    return packagePriceData;
  }

  upsertSingleRoom(room: any, roomNo?: number) {
    let uniquecode;
    let roomCode;
    let guestInfo;
    let paymentInfo;
    let guestPreference;
    if (room.GuestInfo !== undefined) {
      guestInfo = room.GuestInfo;
    }
    if (room.GuestPreference !== undefined) {
      guestPreference = room.GuestPreference;
    }
    if (room.PaymentInfo !== undefined) {
      paymentInfo = room.PaymentInfo;
    }
    if (room.Room !== undefined) {
      if (room.Room.length > 1) {
        room.Room.forEach((element) => {
          if (element.bedTypeName === room.BedTypeName) {
            uniquecode = element.roomCode;
          }
        });
      } else {
        room.Room.bedTypes.forEach((element) => {
          if (element.bedTypeCode === room.BedType) {
            uniquecode = element.roomCode;
          }
        });
      }
      roomCode = room.Room.code;
    } else {
      roomCode = undefined;
    }
    this.store.dispatch({
      type: STORE_ACTIONS.ACTION_ROOM_SET,
      payload: {
        SerialNo: 1,
        roomIndex: room.roomIndex, // For single room
        RoomCode: roomCode,
        BedTypeCode:room.BedTypeCode,
        RoomDetails: room.Room,
        RatePlan: room.RatePlan,
        UniqueCode: uniquecode,

        GuestInfo: guestInfo,
        OrignalRatePlan: undefined,

        PaymentInfo: paymentInfo,
        OtherGuestInfo: undefined,

        Pricing: this.calculateRoomPricing(room),

        Packages: room.Packages,
        BedType: room.BedType,
        BedTypeName: room.BedTypeName,
        CurrencyCode: room.CurrencyCode,
        CurrencyCodeSymbol: room.CurrencyCodeSymbol,
        GuestPreference: guestPreference,
      },
      roomNo: roomNo || 0,
    });
  }

  updateMultipleRoomsWithPricing(rooms: any) {
    rooms.forEach((element) => {
      element.Pricing = this.calculateRoomPricing(element);
    });
    this.store.dispatch({
      type: STORE_ACTIONS.ACTION_ROOMS_SET,
      payload: rooms,
    });
  }

  updatePricingData(pricingData: any, roomNo?: number) {
    this.store.dispatch({
      type: STORE_ACTIONS.ACTION_ROOM_PRICING_SET,
      payload: pricingData,
      roomNo: roomNo || 0,
    });
  }

  updateSingleRoom(room: any, roomNo?: number) {
    room.Pricing = this.calculateRoomPricing(room);
    const rNo = roomNo || 0;
    this.store.dispatch({
      type: STORE_ACTIONS.ACTION_ROOM_SET,
      payload: room,
      roomNo: rNo,
    });
  }

  updateRoomsWithoutCalculation(roomsObj: any) {
    this.store.dispatch({
      type: STORE_ACTIONS.ACTION_ROOMS_SET,
      payload: roomsObj,
    });
  }

  updateEmptySingleRoom(roomNo: number) {
    this.store.dispatch({
      type: STORE_ACTIONS.ACTION_ROOM_SET,
      payload: [],
      roomNo,
    });
  }

  saveEditedRoom(isRoomEdited: boolean, roomNo: number, roomObjEdited) {
    this.store.dispatch({
      type: STORE_ACTIONS.ACTION_SET_UNSELECTED_ROOM,
      payload: roomObjEdited,
      roomNo,
      isRoomEdited,
    });
  }

  updateEmptyRooms() {
    this.store.dispatch({
      type: STORE_ACTIONS.ACTION_ROOMS_SET,
      payload: [],
    });
  }

  upsertMultiRoomBookingOrder(roomBookingOrder: number[]) {
    this.store.dispatch({
      type: STORE_ACTIONS.ACTION_ROOM_ORDER_SET,
      payload: roomBookingOrder,
    });
  }

  upsertSingleRoomRatePlan(ratePlan: RatePlan, roomNo?: number) {
    this.store.dispatch({
      type: STORE_ACTIONS.ACTION_ROOM_RATEPLAN_SET,
      payload: ratePlan,
      roomNo: roomNo || 0,
    });
  }

  upsertSingleRoomGuestInfo(guestInfo: any, roomNo?: number) {
    this.store.dispatch({
      type: STORE_ACTIONS.ACTION_ROOM_GUESTINFO_SET,
      payload: guestInfo,
      roomNo: roomNo || 0,
    });
  }

  upsertSingleRoomGuestPreference(guestPreference: any, roomNo?: number) {
    this.store.dispatch({
      type: STORE_ACTIONS.ACTION_ROOM_GUESTPREFERENCE_SET,
      payload: guestPreference,
      roomNo: roomNo || 0,
    });
  }

  upsertSingleRoomOtherGuestInfo(otherInfo: any, roomNo?: number) {
    this.store.dispatch({
      type: STORE_ACTIONS.ACTION_ROOM_OTHERGUEST_SET,
      payload: otherInfo,
      roomNo: roomNo || 0,
    });
  }

  upsertSingleRoomPaymentInfo(paymentInfo: any, roomNo?: number) {
    this.store.dispatch({
      type: STORE_ACTIONS.ACTION_ROOM_PAYMENT_SET,
      payload: paymentInfo,
      roomNo: roomNo || 0,
    });
  }

  updateCurrentStep(stepNumber: number) {
    this.store.dispatch({
      type: STORE_ACTIONS.ACTION_CURRENT_STEP_SET,
      payload: stepNumber,
    });
  }

  updateIsGuestInfoVisitedFlag(isVisited: boolean) {
    this.store.dispatch({
      type: STORE_ACTIONS.ACTION_IS_GUESTINFO_VISITED,
      payload: isVisited,
    });
  }

  updateGuestInfo(guestInfo: any) {
    this.store.dispatch({
      type: STORE_ACTIONS.ACTION_SAVE_GUEST_INFO,
      payload: guestInfo,
    });
  }

  applyPriceFormatPipe(
    priceValue,
    currencyType,
    removeSeparator?,
    separator?: string
  ) {
    if (priceValue !== undefined && priceValue !== null && !isNaN(priceValue)) {
      if (_.includes(NON_DECIMAL_CURRENCIES, currencyType)) {
        priceValue = this.pricePipe.transform(priceValue, "", currencyType);
        if (removeSeparator) {
          let separatorToReplace = ",";
          if (
            _.get(CUSTOM_CURRENCY_FORMAT[currencyType], "SEPERATOR") !==
            undefined
          ) {
            separatorToReplace = _.get(
              CUSTOM_CURRENCY_FORMAT[currencyType],
              "SEPERATOR"
            );
          }

          if (separatorToReplace === ".") {
            priceValue = _.replace(
              priceValue,
              new RegExp("\\" + separatorToReplace, "g"),
              ""
            );
          } else {
            priceValue = _.replace(
              priceValue,
              new RegExp(separatorToReplace, "g"),
              ""
            );
          }
        }
      }
    }
    return priceValue;
  }

  public resetMultiPropertyPageInfo() {
    const selectedPropertyLink = window.location.href;
    const urlObject = new URL(selectedPropertyLink);
    const userSettings = this.getUserSettingsState();
    if (
      !!userSettings &&
      urlObject.searchParams.get("hotel") === null &&
      userSettings.multiPropertyInfo.isHotelSelected &&
      !userSettings.propertyInfo.singlePropertyPortal
    ) {
      this.updateMultiPropertyInfo({
        isHotelSelected: false,
        hotelCode: "",
        hotelPortalSubdomain: "",
        hotelName: "",
      });
    }
  }

  updateRoomAddionalGuests(guestInfo: any, roomNumber?: number) {
    this.store.dispatch({
    type: STORE_ACTIONS.ACTION_UPDATE_ADDITIONAL_GUESTS,
    payload: guestInfo,
    roomNo: roomNumber
    });
  }

  getReservationDetails(): ReservationDetails[] {
    const reservationDetailsData = new Array<ReservationDetails>();
    let paymentInfo;
    const paymentData = this.getBasketState().Rooms[0];
    for (
      let index_outer = 0;
      index_outer < this.getBasketState().Rooms.length;
      index_outer++
    ) {
      const tmpData = this.getBasketState().Rooms[index_outer];
      const tmpGuestSummary = this.getBasketState().GuestSummary;
      const currFilterValue =
        _.get(this.getUserSettingsState(), "propertyInfo.defaultCurrency") ||
        "SGD";
      // populating the same guest information for all the rooms as it is common for all
      // TO DO: Need to chage this to below line once multiple guest informations can be taken from UI
      // const guestInfo = tmpData.GuestInfo;
      const guestInfo = _.get(this.getBasketState().Rooms[0], "GuestInfo");
      const guestPreference = _.get(
        this.getBasketState().Rooms[index_outer],
        "GuestPreference"
      );

      const additionalGuests =  _.get(
        this.getBasketState().Rooms[index_outer],
       "additionalGuests"
      );

      const guaranteePercentage = _.get(
        tmpData.RatePlan,
        "guaranteePercentage"
      );
      if (this.getManageBookingFlowStatus()) {
        // const gp = _.get(tmpData.RatePlan, 'guaranteePercentage');
        if (guaranteePercentage === 0 && !environment.rt4_modify_flow) {
          paymentInfo = _.cloneDeep(
            this.getBasketState().ManageRoomBooking.PaymentInfo
          );
        } else {
          paymentInfo = tmpData.PaymentInfo;
        }
      } else {
        paymentInfo = paymentData.PaymentInfo;
      }

      // TO DO --> based on the paymentcurrencyexists flag in the basket update the new payment price properties

      const reservDetails = new ReservationDetails();
      reservDetails.langCode =
        _.get(this.getUserSettingsState(), "langObj.code") || "en";
      reservDetails.deviceType =
        _.get(this.getUserSettingsState(), "deviceType") || "d";
      reservDetails.roomIndex = tmpData.roomIndex;
      reservDetails.propertyCode = _.get(
        this.getUserSettingsState(),
        "propertyInfo.propertyCode"
      );
      if (
        _.get(this.getUserSettingsState(), "propertyInfo.propertyType") !== "UD"
      ) {
        reservDetails.alaCarteAddOns =
          this.getBasketState().addonTotalCost[reservDetails.roomIndex] || {};
      }
      let addonTotalCost = 0;
      let addonTotalTax = 0;
      if (this.getBasketState().addonTotalCost[reservDetails.roomIndex]) {
        this.getBasketState().addonTotalCost[
          reservDetails.roomIndex
        ]?.NOT_SPECIFIED?.forEach((addon) => {
          addonTotalCost += addon.preTaxAmount;
          addonTotalTax += addon.taxAndServices;
        });
      }

      if (
        _.get(this.getUserSettingsState(), "propertyInfo.propertyType") ===
        "RVNG"
      ) {
        reservDetails.guestuid = _.get(
          this.getBasketState().ReservationResp,
          "guestuid"
        );
        reservDetails.stayuid = _.get(
          this.getBasketState().ReservationResp,
          "stayuid"
        );
        reservDetails.payuid = _.get(
          this.getBasketState().ReservationResp,
          "payuid"
        );
      }

      /* Start - check if multiproperty Portal */
      const userSettingsStateObject = this.getUserSettingsState();
      const multiPropertyInfo = userSettingsStateObject.multiPropertyInfo;
      let isHotelSelected = false;
      const viewOnSinglePropertyPortalFlag = userSettingsStateObject.propertyInfo.viewHotelInSinglePropertyPortal;
      let selectedHotelPortalSubdomain = "";
      if (!!userSettingsStateObject) {
        if (
          !userSettingsStateObject.propertyInfo.singlePropertyPortal &&
          multiPropertyInfo.isHotelSelected
        ) {
          isHotelSelected = true;
        } else {
          isHotelSelected = false;
        }

        if (isHotelSelected) {
          selectedHotelPortalSubdomain = (viewOnSinglePropertyPortalFlag) ?
            multiPropertyInfo.hotelPortalSubdomain : CommonUtility.getSubdomain();
        }
      }
      /* End - check if multiproperty Portal */
      reservDetails.portalSubdomain = isHotelSelected
        ? selectedHotelPortalSubdomain
        : CommonUtility.getSubdomain();
      reservDetails.numberOfAdults = tmpGuestSummary.guests[index_outer].adults;
      reservDetails.numberOfChildren =
        tmpGuestSummary.guests[index_outer].children;
      reservDetails.arrivalDate = CommonUtility.formateDate(
        tmpGuestSummary.checkindate
      );
      reservDetails.departureDate = CommonUtility.formateDate(
        tmpGuestSummary.checkoutdate
      );
      reservDetails.roomCode = tmpData.UniqueCode;
      reservDetails.rateCode = tmpData.RatePlan.code;
      reservDetails.bedTypeCode = tmpData.BedTypeCode;
      reservDetails.originalRoomCode = tmpData.OrignalRatePlan
        ? tmpData.OrignalRatePlan.UniqueCode
        : null;
      reservDetails.totalUpgradePrice = tmpData.OrignalRatePlan
        ? tmpData.OrignalRatePlan.UpgradedByPrice
        : null;
      reservDetails.dprCode = tmpData.RatePlan.dprCode;
      reservDetails.searchTransactionId = tmpData.RatePlan.searchTransactionId;
      reservDetails.marketingConsent = this.getBasketState().marketingConsent;
      const ipdetails = _.get(
        this.getUserSettingsState(),
        "propertyInfo.clientIp"
      );
      reservDetails.clientIP = ipdetails;
      const iataNumber = _.get(this.getUserSettingsState(), "iata.iataNumber");
      if (iataNumber) {
        reservDetails.iataNumber = iataNumber;
      }
      if (this.getManageBookingFlowStatus()) {
        reservDetails.confirmationCode = this.getReservationID();
      }
      if (!!this.getBasketState().promoData.accessCode) {
        reservDetails.accessCode = this.getBasketState().promoData.accessCode;
      }
      reservDetails.nightlyPrices = [];
      const isGuestPaymentCurrencyExists = this.getBasketState()
        .isPaymentCurrencyExists;
      const guestPaymentCurrencyCode = this.getBasketState()
        .paymentCurrencyCode;

      let guestCurrencyCheck = false;
      if (isGuestPaymentCurrencyExists && guestPaymentCurrencyCode !== "") {
        guestCurrencyCheck = true;
      }

      if (environment.is_rt4_be) {
        reservDetails.paymentCurrencyType =
          this.getBasketState().paymentCurrencyCode && environment.isMCPEnabled
            ? this.getBasketState().paymentCurrencyCode
            : "";
      } else {
        reservDetails.paymentCurrencyType = this.getBasketState()
          .paymentCurrencyCode
          ? this.getBasketState().paymentCurrencyCode
          : guaranteePercentage === 100
            ? currFilterValue
            : paymentInfo.cardType === "AL"
              ? currFilterValue
              : "";
      }

      for (
        let index = 0;
        index < tmpData.RatePlan.nightlyPrices.length;
        index++
      ) {
        const element = tmpData.RatePlan.nightlyPrices[index];
        let packagePrice = 0;
        let guestCurrencyPkgPrice = 0;
        if (
          tmpData.RatePlan.nightlyPrices[index].discountedPriceByCurrencyWithPackageAddOnsTaxes[
          currFilterValue
          ] !== undefined &&
          tmpData.RatePlan.nightlyPrices[index].discountedPriceByCurrencyWithPackageAddOnsTaxes[
          currFilterValue
          ] !== null
        ) {
          packagePrice =
            tmpData.RatePlan.nightlyPrices[index].discountedPriceByCurrencyWithPackageAddOnsTaxes[
            currFilterValue
            ];

          if (guestCurrencyCheck) {
            guestCurrencyPkgPrice =
              tmpData.RatePlan.nightlyPrices[index].discountedPriceByCurrencyWithPackageAddOnsTaxes[
              guestPaymentCurrencyCode
              ];
          }
        } else {
          packagePrice =
            tmpData.RatePlan.nightlyPrices[index].priceByCurrencyWithPackageAddOnsTaxes[
            currFilterValue
            ];
          if (guestCurrencyCheck) {
            guestCurrencyPkgPrice =
              tmpData.RatePlan.nightlyPrices[index].priceByCurrencyWithPackageAddOnsTaxes[
              guestPaymentCurrencyCode
              ];
          }
        }

        if (guestCurrencyCheck) {
          guestCurrencyPkgPrice = guestCurrencyPkgPrice;
        }

        if (environment.is_rt4_be) {
          reservDetails.nightlyPrices.push({
            effectiveDate: element.effectiveDate,
            price: packagePrice,
            guestCurrencyPrice:
              guestCurrencyCheck && environment.isMCPEnabled
                ? guestCurrencyPkgPrice
                : 0,
          });
        } else {
          //MBS logic
          reservDetails.nightlyPrices.push({
            effectiveDate: element.effectiveDate,
            price: packagePrice,
            guestCurrencyPrice: guestCurrencyCheck
              ? guestCurrencyPkgPrice
              : guaranteePercentage === 100
                ? packagePrice
                : paymentInfo.cardType === "AL"
                  ? packagePrice
                  : 0,
          });
        }
      }

      reservDetails.packages = [];
      _.forEach(tmpData.Packages, (addOn) => {
        let addonPrice = addOn.Price;
        if (guestCurrencyCheck) {
          addonPrice = addonPrice;
        }

        if (environment.is_rt4_be) {
          reservDetails.packages.push({
            addOnId: addOn.AddonId,
            count: addOn.NoOfSeats,
            dateTime: addOn.ShowTime,
            category: addOn.Category,
            unitPrice: addOn.DefPrice,
            guestCurrencyUnitPrice:
              guestCurrencyCheck && environment.isMCPEnabled ? addonPrice : 0,
            addOnConsent: addOn.AddOnConsent,
          });
        } else {
          //MBS logic
          reservDetails.packages.push({
            addOnId: addOn.AddonId,
            count: addOn.NoOfSeats,
            dateTime: addOn.ShowTime,
            category: addOn.Category,
            unitPrice: addOn.DefPrice,
            guestCurrencyUnitPrice: guestCurrencyCheck
              ? addonPrice
              : guaranteePercentage === 100
                ? addOn.DefPrice
                : paymentInfo.cardType === "AL"
                  ? addOn.DefPrice
                  : 0,
            addOnConsent: addOn.AddOnConsent,
          });
        }
      });
      const tmpPriceData = tmpData.Pricing;
      if (_.get(this.getUserSettingsState(), "propertyInfo.propertyType") === "UD") {
        reservDetails.preTaxAmount = tmpPriceData.DefPackagePriceWithPackageAddOnTaxes;
      } else {
        reservDetails.preTaxAmount =
          tmpPriceData.DefPackagePriceWithPackageAddOnTaxes +
          tmpPriceData.DefTotalAddonPrice +
          addonTotalCost;
      }
      reservDetails.taxAndServices = tmpPriceData.DefTax + addonTotalTax;
      // reservDetails.totalPackagePrice = tmpPriceData.TotalPrice;
      reservDetails.guaranteePercentage = tmpData.RatePlan.guaranteePercentage;
      reservDetails.policyCode = tmpData.RatePlan.policyCode;
      reservDetails.policyGuaranteeType = tmpData.RatePlan.policyGuaranteeType;

      if (this.isDirectBillPolicySelected()) {
        reservDetails.paymentDetailsCollected = false;
      } else {
        reservDetails.paymentDetailsCollected = true;
      }

      if (
        _.get(this.getUserSettingsState(), "propertyInfo.propertyType") === "UD"
      ) {
        reservDetails.policyType = tmpData.RatePlan.policyInfo
          ? tmpData.RatePlan.policyInfo.policyType
          : "";
        reservDetails.udCancelHistoryId = tmpData.RatePlan
          .udCancellationPolicyId
          ? tmpData.RatePlan.udCancellationPolicyId
          : null;
      }
      reservDetails.prePaymentType = tmpData.RatePlan.prePaymentType;
      if (environment.is_rt4_be) {
        reservDetails.guestCurrencyPreTaxAmount =
          guestCurrencyCheck && environment.isMCPEnabled
            ? tmpPriceData.PackagePrice + tmpPriceData.TotalAddonPrice
            : 0;
        reservDetails.guestCurrencyTaxAndServices =
          guestCurrencyCheck && environment.isMCPEnabled ? tmpPriceData.Tax : 0;

        reservDetails.guestCurrencyPreTaxAmount =
          reservDetails.guestCurrencyPreTaxAmount !== 0
            ? reservDetails.guestCurrencyPreTaxAmount
            : 0;
        reservDetails.guestCurrencyTaxAndServices =
          reservDetails.guestCurrencyTaxAndServices !== 0
            ? reservDetails.guestCurrencyTaxAndServices
            : 0;
        // guestCurrencyTotalPackagePrice = tmpPriceData.TotalPrice;
      } else {
        //MBS logic
        reservDetails.guestCurrencyPreTaxAmount = guestCurrencyCheck
          ? tmpPriceData.PackagePrice + tmpPriceData.TotalAddonPrice
          : 0;
        reservDetails.guestCurrencyTaxAndServices = guestCurrencyCheck
          ? tmpPriceData.Tax
          : 0;
        if (
          guestCurrencyCheck ||
          guaranteePercentage === 100 ||
          paymentInfo.cardType === "AL"
        ) {
          reservDetails.guestCurrencyPreTaxAmount =
            reservDetails.guestCurrencyPreTaxAmount !== 0
              ? reservDetails.guestCurrencyPreTaxAmount
              : guaranteePercentage === 100
                ? reservDetails.preTaxAmount
                : paymentInfo.cardType === "AL"
                  ? reservDetails.preTaxAmount
                  : 0;
          reservDetails.guestCurrencyTaxAndServices =
            reservDetails.guestCurrencyTaxAndServices !== 0
              ? reservDetails.guestCurrencyTaxAndServices
              : guaranteePercentage === 100
                ? reservDetails.taxAndServices
                : paymentInfo.cardType === "AL"
                  ? reservDetails.taxAndServices
                  : 0;
        }
        // guestCurrencyTotalPackagePrice = tmpPriceData.TotalPrice;
      }

      reservDetails.guestInfo = new GuestInfoDetails();
      if (guestInfo !== undefined) {
        reservDetails.guestInfo.salutation = guestInfo.salutation;
        reservDetails.guestInfo.firstName = guestInfo.firstName;
        reservDetails.guestInfo.lastName = guestInfo.lastName;
        reservDetails.guestInfo.countryCode = guestInfo.countryCode;
        reservDetails.guestInfo.phoneNumber =
          _.replace(guestInfo.callingCode, "+", "") + guestInfo.phoneNumber;
        reservDetails.guestInfo.emailAddress = guestInfo.emailAddress;
        reservDetails.guestInfo.countryName = guestInfo.countryName;
        reservDetails.guestInfo.state = guestInfo.state;
        reservDetails.guestInfo.city = guestInfo.city;
        reservDetails.guestInfo.streetAddress1 = guestInfo.streetAddress1;
        reservDetails.guestInfo.streetAddress2 = guestInfo.streetAddress2;
        reservDetails.guestInfo.postalCode = guestInfo.postalCode;
      }
      if (additionalGuests !== undefined) {
        reservDetails.additionalGuests = additionalGuests;
      }

      let arrivalTimeOptionValue = "";
      if (showPreferences) {
        reservDetails.guestRoomPreferences = [];
        const guestPrefObject = [];
        let prefIndex = 0;
        guestPreference.forEach((element) => {
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
            obj["preQuestionOptionIds"] = _.get(
              element,
              "preQuestionOptionIds"
            );
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
        reservDetails.guestRoomPreferences = guestPrefObject;
        reservDetails.arrivalTimeInfo = arrivalTimeOptionValue;
      }
      if (
        paymentInfo !== undefined &&
        paymentInfo.cardType !== PAYMENT_CARD_TYPE.ALI
      ) {
        reservDetails.creditCardDetails = new CreditCardDetails();
        reservDetails.creditCardDetails.cardHolderName =
          paymentInfo.cardHolderName;
        reservDetails.creditCardDetails.cardNumber = paymentInfo.cardNumber;
        reservDetails.creditCardDetails.cardType = paymentInfo.cardType;
        reservDetails.creditCardDetails.expMonth = paymentInfo.expMonth; // next month
        reservDetails.creditCardDetails.expYear = paymentInfo.expYear;
        reservDetails.creditCardDetails.securityCode = paymentInfo.securityCode;
      }
      reservDetails.successCallbackUrl =
        window.location.origin + PAYMENT_SUCCESS_CALLBACK;
      reservDetails.errorCallbackUrl =
        window.location.origin + PAYMENT_FAILURE_CALLBACK;
      reservDetails.baseBookingURL = window.location.origin;
      reservationDetailsData[index_outer] = reservDetails;
    }
    return reservationDetailsData;
  }

  clearBasketValues() {
    this.updateEmptyRooms();
    this.upsertMultiRoomBookingOrder([]);
    const reservationRespObj = this.getBasketState().ReservationResp;
    reservationRespObj["ResvConfCodes"] = [];
    this.updateReservationResponse(reservationRespObj);
  }

  setPaymentFailureFlagAndCode(flag: boolean, errCode: any) {
    this.store.dispatch({
      type: STORE_ACTIONS.ACTION_PAYMENT_FAILURE,
      payload: flag,
    });
    this.store.dispatch({
      type: STORE_ACTIONS.ACTION_PAYMENT_ERROR_CODE,
      payload: errCode,
    });
  }

  updateLangObj(code: string) {
    this.store.dispatch({
      type: STORE_ACTIONS.ACTION_UPDATE_RESET_FILTERS_FLAG,
      payload: true,
    });
    const propertyInfo = _.get(this.getUserSettingsState(), "propertyInfo");
    const langObj = CommonUtility.getLangObjfromPropertyInfo(
      propertyInfo,
      code
    );
    this.store.dispatch({
      type: STORE_ACTIONS.ACTION_UPDATE_LANG_OBJ,
      payload: langObj,
    });
  }

  updateLocaleObj(localeObj: any) {
    this.store.dispatch({
      type: STORE_ACTIONS.ACTION_UPDATE_RESET_FILTERS_FLAG,
      payload: true,
    });
    this.store.dispatch({
      type: STORE_ACTIONS.ACTION_UPDATE_LOCALE_OBJ,
      payload: localeObj,
    });
  }

  updateIntialCurrencyCodeObj(currencyCode: any) {
    this.store.dispatch({
      type: STORE_ACTIONS.ACTION_UPDATE_INTIAL_CURRENCY_CODE_OBJ,
      payload: currencyCode,
    });
  }

  updateCurrencyCodeObj(currencyCodeObj: any) {
    this.store.dispatch({
      type: STORE_ACTIONS.ACTION_UPDATE_CURRENCY_CODE_OBJ,
      payload: currencyCodeObj.code,
    });
  }

  updatePaymentCurrencyCodeObj(isPaymentCurrencyExists, paymentCurrencyCode) {
    this.store.dispatch({
      type: STORE_ACTIONS.ACTION_UPDATE_PAYMENT_CURRENCY_CODE_OBJ,
      payload: {
        isPaymentCurrencyExists,
        paymentCurrencyCode,
      },
    });
  }

  updatePropertyInfoObj(propertyInfoObj: any) {
    this.store.dispatch({
      type: STORE_ACTIONS.ACTION_UPDATE_PROPERTY_INFO_OBJ,
      payload: propertyInfoObj,
    });
  }

  updateMarketingConsent(consent: string) {
    this.store.dispatch({
      type: STORE_ACTIONS.ACTION_SET_MARKETING_CONSENT,
      payload: consent,
    });
  }

  updateUserIp(userIpDetails: any) {
    this.store.dispatch({
      type: STORE_ACTIONS.ACTION_GUEST_IP,
      payload: userIpDetails,
    });
  }

  updateIsErrorPageFlag(flag: boolean) {
    this.store.dispatch({
      type: STORE_ACTIONS.ACTION_IS_ERROR_PAGE,
      payload: flag,
    });
  }

  updateIsManageBookingFlag(flag: boolean) {
    this.store.dispatch({
      type: STORE_ACTIONS.ACTION_IS_MANAGEBOOKING_PAGE,
      payload: flag,
    });
  }

  updateErrorHandler(type: string, payload: any) {
    this.store.dispatch({
      type,
      payload,
    });
  }

  updateReservationID(resID: string) {
    this.store.dispatch({
      type: STORE_ACTIONS.ACTION_RESERVATION_ID_SET,
      payload: resID,
    });
  }

  updateExternalConfID(ID: any) {
    this.store.dispatch({
      type: STORE_ACTIONS.ACTION_EXTERNAL_RESERVATION_ID_SET,
      payload: ID,
    });
  }

  removeErrors(statusCodesList: any) {
    if (statusCodesList !== null && statusCodesList !== undefined) {
      statusCodesList.forEach((statusCode) => {
        this.removeError(statusCode);
      });
    }
  }

  removeError(statusCode: number) {
    this.updateError(statusCode, false);
  }

  setError(statusCode: number) {
    this.updateError(statusCode, true);
    return true;
  }

  updateError(statusCode: number, updateTypeFlag: boolean) {
    let localeObj;
    this.getUserSettings().subscribe((sharedData) => {
      localeObj = sharedData.localeObj;
    });
    const errorHandlerState: IErrorHandlerState = this.getErrorHandlerState();
    const errorObj = errorHandlerState.error;
    if (updateTypeFlag) {
      errorObj["" + statusCode] = true;
      CommonUtility.logToRollbar(localeObj, this.rollbar, statusCode);
    } else {
      if (errorObj["" + statusCode] !== undefined) {
        delete errorObj["" + statusCode];
      }
    }
    this.updateErrorHandler(STORE_ACTIONS.ACTION_SET_ERROR, errorObj);
  }

  isDirectBillPolicySelected() {
    const isDirectBillRatePlan = _.get(
      this.getBasketState().Rooms[0],
      "RatePlan.directbill"
    );

    return isDirectBillRatePlan;
  }

  updateIs3DSCrediCardFlag(is3DSCreditCard) {
    this.store.dispatch({
      type: STORE_ACTIONS.ACTION_UPDATE_IS_3DS_CREDIT_CARD,
      payload: is3DSCreditCard,
    });
  }

  setDummyCreditCardDetails() {
    const creditCardInfo = new CreditCardDetails();
    creditCardInfo.cardHolderName = DUMMY_CC_DETAILS.CARD_HOLDER_NAME;
    const monthNumber = this.getBasketState().GuestSummary.checkoutdate.getMonth();
    creditCardInfo.expMonth = (monthNumber === 0) ? 1 : monthNumber; // AS JAN month count = 0 then should be 1
    creditCardInfo.expYear = this.getBasketState().GuestSummary.checkoutdate.getFullYear() + 1;
    creditCardInfo.cardType = DUMMY_CC_DETAILS.CARD_TYPE;
    creditCardInfo.cardNumber = DUMMY_CC_DETAILS.CARD_NUMBER;
    const displayCvv = _.get(this.getUserSettingsState(), "propertyInfo.displayCVV");
    if (displayCvv) {
      creditCardInfo.securityCode = DUMMY_CC_DETAILS.SECURITY_CODE;
    } else {
      creditCardInfo.securityCode = null;
    }

    return creditCardInfo;
  }

  updateGuestPreferenceDisclaimer(disclaimer: string) {
    this.store.dispatch({
      type: STORE_ACTIONS.ACTION_GUEST_PREFERENCES_DISCLAIMER_SET,
      payload: disclaimer,
    });
  }

  updateIATADetails(iataObject: any) {
    if (this.getBasketState().isSearchPageVisited) {
      // if its not a direct landing on rooms page from multiproperty
      this.store.dispatch({
        type: STORE_ACTIONS.ACTION_UPDATE_RESET_FILTERS_FLAG,
        payload: false,
      });
    }

    this.store.dispatch({
      type: STORE_ACTIONS.ACTION_IATA_NUMBER_SET,
      payload: iataObject,
    });
  }

  updateIsSearchPageVisitedFlag(isSearchPageVisited: boolean) {
    this.store.dispatch({
      type: STORE_ACTIONS.ACTION_UPDATE_IS_SEARCHPAGE_VISITED_FLAG,
      payload: isSearchPageVisited,
    });
  }

  updateIsDirectBillRate(isDBPolicyRateSelect: boolean) {
    this.store.dispatch({
      type: STORE_ACTIONS.ACTION_UPDATE_IS_DIRECT_BILL_RATE,
      payload: isDBPolicyRateSelect,
    });
  }

  updateMultiPropFilters(flag: boolean) {
    this.store.dispatch({
      type: STORE_ACTIONS.ACTION_RESET_MULTI_PROP_FILTERS,
      payload: flag,
    });
  }

  updateOldData(oldData: any) {
    this.store.dispatch({
      type: STORE_ACTIONS.ACTION_UPDATE_OLD_RESER_DETAILS,
      payload: oldData,
    });
  }

  updateRvngModifyFlag(isRvngModifyFlow) {
    this.store.dispatch({
      type: STORE_ACTIONS.ACTION_IS_RVNG_MODIFY_FLOW,
      payload: isRvngModifyFlow,
    });
  }

  updateReservationResponse(payload: any) {
    this.store.dispatch({
      type: STORE_ACTIONS.ACTION_RESERVATION_RESPONSE_SET,
      payload,
    });
  }

  updateResvCancellationCode(resrvCancelCode: any) {
    this.store.dispatch({
      type: STORE_ACTIONS.ACTION_UPDATE_CANCELLATION_CODE,
      payload: resrvCancelCode,
    });
  }

  updateIsPromoFlowFlag(isPromoFlow: boolean) {
    this.store.dispatch({
      type: STORE_ACTIONS.ACTION_UPDATE_IS_PROMO_FLOW,
      payload: isPromoFlow,
    });
  }

  updateIsSpecialsFlowFlag(isSpecialsFlow: boolean) {
    this.store.dispatch({
      type: STORE_ACTIONS.ACTION_UPDATE_IS_SPECIALS_FLOW,
      payload: isSpecialsFlow,
    });
  }

  updateIsCompoundAccessCode(isCompoundAccessCode: boolean) {
    this.store.dispatch({
      type: STORE_ACTIONS.ACTION_SET_IS_COMPOUND_ACCESSCODE,
      payload: isCompoundAccessCode,
    });
  }

  updateIsSelectedRatePlanAvailable(isRatePlanAvailable: boolean) {
    this.store.dispatch({
      type: STORE_ACTIONS.ACTION_SET_SELECTED_RATEPLAN_AVAILABLE,
      payload: isRatePlanAvailable,
    });
  }

  updateOtherCompoundOffersAvailable(isOtherCompoundOffersAvailable: boolean) {
    this.store.dispatch({
      type: STORE_ACTIONS.ACTION_SET_OTHER_COMPOUND_OFFERS_AVAILABLE,
      payload: isOtherCompoundOffersAvailable,
    });
  }

  updatePromoData(promoData: object) {
    this.store.dispatch({
      type: STORE_ACTIONS.ACTION_UPDATE_PROMO_DATA,
      payload: promoData,
    });
  }

  setAvailableRatePlans(availRatePlans: any) {
    this.store.dispatch({
      type: STORE_ACTIONS.ACTION_SET_AVAILABLE_RATEPLANS,
      payload: availRatePlans,
    });
  }

  setSpecialsOfferCode(offerCode: any) {
    this.store.dispatch({
      type: STORE_ACTIONS.ACTION_SET_SPECIALS_OFFERCODE,
      payload: offerCode,
    });
  }

  updatePromoBummer(bummerObj: any) {
    this.store.dispatch({
      type: STORE_ACTIONS.ACTION_UPDATE_PROMO_BUMMER,
      payload: bummerObj,
    });
  }

  setAlaCarteAddonsTotal(addonTotalCost: any) {
    this.store.dispatch({
      type: STORE_ACTIONS.ACTION_SET_ADDONS_TOTAL,
      payload: addonTotalCost,
    });
  }

  fetchAlaCarteAddonsTotal(reservedAddons: any) {
    this.store.dispatch({
      type: STORE_ACTIONS.ACTION_FETCH_RESERVED_ADDONS,
      payload: reservedAddons,
    });
  }

  updateAlaCarteAddons(updatedAddons: any) {
    this.store.dispatch({
      type: STORE_ACTIONS.ACTION_UPDATE_ALACARTE_ADDONS,
      payload: updatedAddons,
    });
  }

  setActiveModalElem(focusableModalElem: any) {
    this.store.dispatch({
      type: STORE_ACTIONS.ACTION_SET_ACTIVEMODAL_ELEM,
      payload: focusableModalElem,
    });
  }

  updateMultiPropertyInfo(multipropertyInfo: any) {
    this.store.dispatch({
      type: STORE_ACTIONS.ACTION_UPDATE_MULTIPROPERTY_INFO,
      payload: multipropertyInfo,
    });
  }

  updatedHotelList(hotelList: any) {
    this.store.dispatch({
      type: STORE_ACTIONS.ACTION_UPDATE_HOTEL_LIST,
      payload: hotelList,
    });
  }

  updateHotelLocAvail(locations: any) {
    this.store.dispatch({
      type: STORE_ACTIONS.ACTION_UPDATE_HOTEL_LOC_AVAIL,
      payload: locations,
    });
  }

  setPGDepositAmount(pgAmount: any) {
    this.store.dispatch({
      type: STORE_ACTIONS.ACTION_SET_PG_DEPOSIT_AMT,
      payload: pgAmount,
    });
  }

  setPGTransactionID(pgTransactionId: string) {
    this.store.dispatch({
      type: STORE_ACTIONS.ACTION_SET_PG_TRANSACTION_ID,
      payload: pgTransactionId,
    });
  }
  
  getAvgRoomPrice(room: any, currencyType: string) {
    return !this.getShowAvgNightlyRateConfig() ? room.totalPriceByCurrency[currencyType] :
    room.averagePriceByCurrency[currencyType];
  }

  getDiscountedRoomPrice(room: any, currencyType: string) {
    return !this.getShowAvgNightlyRateConfig() ? room.totalDiscountedPriceByCurrency[currencyType] :
    room.discountedAveragePriceByCurrency[currencyType];
  }

  getAvgRatePlanPrice(ratePlan: any, currFilterValue: string) {
    return !this.getShowAvgNightlyRateConfig() ? ratePlan.totalPriceByCurrency[currFilterValue] :
    ratePlan.averagePriceByCurrency[currFilterValue];
  }

  getDiscountedRatePlanPrice(ratePlan: any, currFilterValue: string) {
    return !this.getShowAvgNightlyRateConfig() ? ratePlan.totalDiscountedPriceByCurrency[currFilterValue] :
    ratePlan.discountedAveragePriceByCurrency[currFilterValue];
  }

  getShowAvgNightlyRateConfig() {
    return _.get(this.getUserSettingsState(), "propertyInfo.showAverageNightlyRate");
  }

  setSystemError(error: boolean) {
    this.store.dispatch({
      type: STORE_ACTIONS.ACTION_SET_SYSTEM_ERROR,
      payload: error,
    });
  }

  setRoomAttributes(roomAttributes: any) {
    this.store.dispatch ({
      type: STORE_ACTIONS.ACTION_SET_ROOM_ATTRIBUTES,
      payload: roomAttributes,
    });
  }

  changeCurrency(elem: boolean) {
    this.userModifiedCurr.next(elem);
  }

  setLocationForFilters(location: any) {
    this.store.dispatch ({
      type: STORE_ACTIONS.ACTION_SET_LOCATION_FOR_FILTERS,
      payload: location,
    });
  }

  setPriceSliderRange(range: any) {
    this.store.dispatch ({
      type: STORE_ACTIONS.ACTION_SET_PRICE_SLIDER_RANGE,
      payload: range,
    });
  }
}
