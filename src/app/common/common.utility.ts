import * as _ from "lodash";
import * as moment from "moment";
import { environment } from "../../environments/environment";
import {
  CheckinSummary,
  Guests,
  ICheckinSummary,
} from "../search/guestduration/checkinsummary.type";
import {
  DAY_MILLIS,
  derbyTag,
  error_code_prefix,
  GUEST_INFO_FORM,
  MONTHS_MAP,
  PAYMENT_CARD_TYPE,
  QUERY_PARAM_ATTRIBUTES,
  RATE_CALENDAR_SETTINGS,
  TEALIUM_PAGE_NAMES,
  trackingObject,
  TRADITIONAL_FLOW,
  URL_PATHS,
  utag_data_multi_room,
  utag_data_single_room,
  VWO_SCRIPT_ONE,
  VWO_SCRIPT_THREE,
  VWO_SCRIPT_TWO,
  ZERO_TIME_STR,
} from "./common.constants";
import { AvailableRoomRatePlans } from "./models/packagedetails";
import { StoreService } from "./services/store.service";
import {
  Currency,
  LangObj,
  PropertyInfo,
} from "./store/reducers/user-settings.reducer";
declare var Paperboy: any;

export class CommonUtility {
  public static getCurrSymbolForType(
    propertyInfo: PropertyInfo,
    currencyType: string
  ): string {
    let currCode = "";
    _.forEach(propertyInfo.supportedCurrencies, (val: Currency) => {
      if (val.code === currencyType) {
        currCode = val.symbol;
        return;
      }
    });
    return currCode;
  }

  public static packageDynamicString(occupants: number) {
    const dynamicString =
      "The package price covers the cost of " +
      occupants +
      " tickets. You may edit the ticket quantity again before payment confirmation.";
    return dynamicString;
  }

  public static formateDate(dateToFormat: Date): string {
    return moment(dateToFormat).format("YYYY-MM-DD");
  }

  public static formateDateTime(dateToFormat: Date): string {
    dateToFormat = new Date(dateToFormat);
    return (
      dateToFormat.getFullYear() +
      "-" +
      ("00" + (dateToFormat.getMonth() + 1).toString()).slice(-2) +
      "-" +
      ("00" + dateToFormat.getDate().toString()).slice(-2) +
      " " +
      ("00" + (dateToFormat.getHours() + 1).toString()).slice(-2) +
      ":" +
      ("00" + (dateToFormat.getMinutes() + 1).toString()).slice(-2)
    );
  }

  public static getGuestSummaryFromEventData(eventData: any, roomNo?: number) {
    const rno = roomNo || 0;
    const guestSummary = new CheckinSummary();
    guestSummary.checkindate = eventData.checkindate;
    guestSummary.checkoutdate = eventData.checkoutdate;
    guestSummary.guests = eventData.guests;
    guestSummary.los = eventData.los;
    guestSummary.rooms = eventData.rooms;
    guestSummary.restrictionFailed = eventData.restrictionFailed;
    return guestSummary;
  }

  public static loadScript(scriptObj: any) {
    let body = null;
    if (scriptObj.location !== undefined && scriptObj.location === "head") {
      body = document.head as HTMLHeadElement;
    } else {
      body = document.body as HTMLDivElement;
    }
    const script = document.createElement("script");
    if (scriptObj.id !== undefined) {
      script.id = scriptObj.id;
    }
    if (scriptObj.type !== undefined) {
      script.type = scriptObj.type;
    }
    if (scriptObj.src !== undefined) {
      script.src = scriptObj.src;
    }
    if (scriptObj.innerHTML !== undefined) {
      script.innerHTML = scriptObj.innerHTML;
    }
    if (scriptObj.isAsync) {
      script.async = scriptObj.isAsync;
    }
    if (scriptObj.isDefer) {
      script.defer = scriptObj.isDefer;
    }
    body.appendChild(script);
  }

  public static removeScript(id: string) {
    const ele = document.getElementById(id);
    if (ele !== null && ele !== undefined) {
      ele.parentNode.removeChild(ele);
      return true;
    }
    return false;
  }

  public static populateDerbyTagData(
    basketSummary: any,
    tagUrl: string,
    tagAccountCode: string,
    tagHotelCode: string,
    roomIndex: number,
    isRT4be: boolean
  ) {
    let tagString = derbyTag;
    let urlString = tagUrl || "";
    if (!isRT4be) {
      urlString = urlString + "accountCode=" + tagAccountCode;
      if (
        _.get(basketSummary, "ReservationResp.ResvConfCodes") !== undefined &&
        _.get(basketSummary, "ReservationResp.ResvConfCodes") !== null &&
        _.get(basketSummary, "ReservationResp.ResvConfCodes").length > roomIndex
      ) {
        urlString =
          urlString +
          "&bookingNo=" +
          basketSummary.ReservationResp.ResvConfCodes[roomIndex];
      }
      urlString = urlString + "&hotelCode=" + tagHotelCode;
      if (
        _.get(basketSummary, "Rooms") !== undefined &&
        _.get(basketSummary, "Rooms") !== null &&
        basketSummary.Rooms.length > roomIndex &&
        basketSummary.Rooms[roomIndex] !== undefined
      ) {
        urlString =
          urlString +
          "&roomTypeCode=" +
          basketSummary.Rooms[roomIndex].UniqueCode;
      }
      if (
        _.get(basketSummary, "Rooms") !== undefined &&
        _.get(basketSummary, "Rooms") !== null &&
        basketSummary.Rooms.length > roomIndex &&
        basketSummary.Rooms[roomIndex] !== undefined
      ) {
        urlString =
          urlString +
          "&ratePlanCode=" +
          _.get(basketSummary.Rooms[roomIndex], "RatePlan.code");
      }
      if (
        _.get(basketSummary, "GuestSummary") !== undefined &&
        _.get(basketSummary, "GuestSummary") !== null &&
        basketSummary.GuestSummary.checkindate !== undefined
      ) {
        const checkInDate = _.get(basketSummary, "GuestSummary.checkindate");
        if (checkInDate !== null) {
          const formattedCheckInDate = this.getFormattedDateByHyphen(
            checkInDate
          );
          urlString = urlString + "&checkInDate=" + formattedCheckInDate;
        }
      }
      if (
        _.get(basketSummary, "GuestSummary") !== undefined &&
        _.get(basketSummary, "GuestSummary") !== null &&
        basketSummary.GuestSummary.checkoutdate !== undefined
      ) {
        const checkOutDate = _.get(basketSummary, "GuestSummary.checkoutdate");
        if (checkOutDate !== null) {
          const formattedCheckOutDate = this.getFormattedDateByHyphen(
            checkOutDate
          );
          urlString = urlString + "&checkOutDate=" + formattedCheckOutDate;
        }
      }
      if (
        _.get(basketSummary, "GuestSummary") !== undefined &&
        _.get(basketSummary, "GuestSummary") !== null &&
        basketSummary.GuestSummary.guests !== undefined &&
        basketSummary.GuestSummary.guests.length > roomIndex
      ) {
        // const guestsCnt = basketSummary.GuestSummary.guests[roomIndex].adults + basketSummary.GuestSummary.guests[roomIndex].children;
        const guestsCnt = basketSummary.GuestSummary.guests[roomIndex].adults;
        urlString = urlString + "&guests=" + guestsCnt;
      }
      urlString = urlString + "&rooms=1";
      if (
        _.get(basketSummary, "Rooms") !== undefined &&
        _.get(basketSummary, "Rooms") !== null &&
        basketSummary.Rooms.length > roomIndex &&
        _.get(basketSummary.Rooms[roomIndex], "Pricing") !== undefined
      ) {
        const netAmount = (
          _.get(basketSummary.Rooms[roomIndex], "Pricing.TotalPrice") -
          _.get(basketSummary.Rooms[roomIndex], "Pricing.Tax")
        ).toFixed(2);
        urlString = urlString + "&netAmount=" + netAmount;
      }
      if (
        _.get(basketSummary, "Rooms") !== undefined &&
        _.get(basketSummary, "Rooms") !== null &&
        basketSummary.Rooms.length > roomIndex &&
        _.get(basketSummary.Rooms[roomIndex], "Pricing") !== undefined
      ) {
        urlString =
          urlString +
          "&totalAmount=" +
          _.get(basketSummary.Rooms[roomIndex], "Pricing.TotalPrice").toFixed(
            2
          );
      }
      if (
        _.get(basketSummary, "Rooms") !== undefined &&
        _.get(basketSummary, "Rooms") !== null &&
        basketSummary.Rooms.length > roomIndex &&
        _.get(basketSummary.Rooms[roomIndex], "Pricing") !== undefined
      ) {
        urlString =
          urlString +
          "&currency=" +
          _.get(basketSummary.Rooms[roomIndex], "Pricing.CurrencyCode");
      }
    } else {
      const derbyTagParam = {
        pu: window.location.href.replace(":", "%3A").replace("/", "%2F") || "",
        pixel_id: tagAccountCode || "",
        account_id: tagHotelCode || "",
        event_type: window["rt4Datalayer"].rtPAGENAME || "Confirmation",
        is_landing_page: "false",
        hotel_id: window["rt4Datalayer"].rtPROPERTYCODE,
        total_guests:
          basketSummary.GuestSummary.guests[roomIndex].adults +
            basketSummary.GuestSummary.guests[roomIndex].children || 1,
        rooms: roomIndex + 1 || 1,
        adults: basketSummary.GuestSummary.guests[roomIndex].adults || 1,
        children: basketSummary.GuestSummary.guests[roomIndex].children || 0,
        check_in_date: CommonUtility.formateDate(
          _.get(basketSummary, "GuestSummary.checkindate")
        ),
        check_out_date: CommonUtility.formateDate(
          _.get(basketSummary, "GuestSummary.checkindate")
        ),
        "Suite&rate_plan_id": basketSummary.Rooms[roomIndex].RatePlan.code,
        rate_plan_name: basketSummary.Rooms[roomIndex].RatePlan.name.replace(
          / /g,
          "%20"
        ),
        "Rate&price_base": basketSummary.Rooms[roomIndex].Pricing.PackagePrice,
        price_tax_fees: basketSummary.Rooms[roomIndex].Pricing.Tax || 0,
        price_total: basketSummary.Rooms[roomIndex].Pricing.TotalPrice,
        dsclid: "", // Value is absent in RT3 url
      };
      urlString =
        urlString +
        Object.entries(derbyTagParam)
          .map(([key, val]) => `${key}=${val}`)
          .join("&");
      console.log(urlString);

      const derbySoftScript = document.createElement("script");
      derbySoftScript.setAttribute("id", "derbySoftScript_" + roomIndex);
      const elem =
        `
    var _bparams = {
      "pixel_id": '` +
        tagAccountCode +
        `',
      "account_id": '` +
        tagHotelCode +
        `',
      "event_type": '` +
        window["rt4Datalayer"].rtPAGENAME +
        `',
      "is_landing_page": "FALSE",
      "hotel_id": '` +
        window["rt4Datalayer"].rtPROPERTYCODE +
        `',
      "booking_id": '` +
        basketSummary.ReservationResp.ResvConfCodes[roomIndex] +
        `',
      "total_guests": '` +
        basketSummary.GuestSummary.guests[roomIndex].adults +
        basketSummary.GuestSummary.guests[roomIndex].children +
        `',
      "rooms": '` +
        roomIndex +
        1 +
        `',
      "adults": '` +
        basketSummary.GuestSummary.guests[roomIndex].adults +
        `',
      "children": '` +
        basketSummary.GuestSummary.guests[roomIndex].children +
        `',
      "check_in_date": '` +
        CommonUtility.formateDate(
          _.get(basketSummary, "GuestSummary.checkindate")
        ) +
        `',
      "check_out_date": '` +
        CommonUtility.formateDate(
          _.get(basketSummary, "GuestSummary.checkindate")
        ) +
        `',
      "stay_length": '` +
        basketSummary.GuestSummary.los +
        `',
      "price_currency": '` +
        basketSummary.CurrencyCode +
        `',
      "room_type_id": '` +
        basketSummary.Rooms[roomIndex].RoomCode +
        `',
      "room_type": '` +
        basketSummary.Rooms[roomIndex].RoomDetails.name +
        `',
      "rate_plan_id": '` +
        basketSummary.Rooms[roomIndex].RatePlan.code +
        `',
      "rate_plan_name": '` +
        basketSummary.Rooms[roomIndex].RatePlan.name +
        `',
      "price_base": '` +
        basketSummary.Rooms[roomIndex].Pricing.PackagePrice +
        `',
      "price_tax_fees": '` +
        basketSummary.Rooms[roomIndex].Pricing.Tax +
        `',
      "price_total": '` +
        basketSummary.Rooms[roomIndex].Pricing.TotalPrice +
        `',
    };`;
      const lct = document.createElement("script");
      lct.type = "text/javascript";
      lct.async = true;
      lct.src =
        "https://linkcenterus.derbysoftsec.com/pixel/v1/pixel.js?v=" +
        Math.round(new Date().getTime() / 1000);
      const s = document.getElementsByTagName("script")[0];
      s.parentNode.insertBefore(lct, s);
      const obj = document.createTextNode(elem);
      derbySoftScript.appendChild(obj);
      $("body").append(derbySoftScript);
    }
    tagString = this.fillMessage(tagString, [urlString]);
    return tagString;
  }

  public static populate_utag_data(
    basketSummary: any,
    languageObj: any,
    defCurrencyCode: string,
    pageName: string,
    pageType: string
  ) {
    let checkInDate = null;
    let checkOutDate = null;
    let currentDate = null;
    let formattedCheckInDate = null;
    let formattedCheckOutDate = null;
    let guests = null;
    const rooms = _.get(basketSummary, "Rooms");
    if (
      _.get(basketSummary, "GuestSummary") !== undefined &&
      _.get(basketSummary, "GuestSummary") !== null
    ) {
      checkInDate = _.get(basketSummary, "GuestSummary.checkindate");
      checkOutDate = _.get(basketSummary, "GuestSummary.checkoutdate");
      const dummyDate = new Date();
      currentDate = new Date(
        dummyDate.getFullYear(),
        dummyDate.getMonth(),
        dummyDate.getDate(),
        0,
        0,
        0
      );
      if (checkInDate !== null) {
        formattedCheckInDate = this.getFormattedDate(checkInDate);
      }
      if (checkOutDate !== null) {
        formattedCheckOutDate = this.getFormattedDate(checkOutDate);
      }
      guests = _.get(basketSummary, "GuestSummary.guests");
    }
    let scriptJSONObj;
    if (
      _.get(basketSummary, "GuestSummary.rooms") !== undefined &&
      Number(_.get(basketSummary, "GuestSummary.rooms")) > 1
    ) {
      scriptJSONObj = _.cloneDeep(utag_data_multi_room);
      scriptJSONObj.currency = "SGD";
      scriptJSONObj.foreign_currency = "";
      if (
        _.get(basketSummary, "ReservationResp.ResvConfCodes") !== undefined &&
        _.get(basketSummary, "ReservationResp.ResvConfCodes") !== null &&
        _.get(basketSummary, "ReservationResp.ResvConfCodes") !== ""
      ) {
        for (
          let index = 0;
          index < _.get(basketSummary, "ReservationResp.ResvConfCodes").length;
          index++
        ) {
          scriptJSONObj.order_id[index] =
            basketSummary.ReservationResp.ResvConfCodes[index];
        }
      }
      if (rooms !== undefined && rooms.length > 0) {
        scriptJSONObj.order_cancellation_policy = _.get(
          rooms[0],
          "RatePlan.cancellationPolicy"
        );
        scriptJSONObj.currency = _.get(rooms[0], "Pricing.CurrencyCode");
        if (scriptJSONObj.currency !== defCurrencyCode) {
          scriptJSONObj.foreign_currency = _.get(
            rooms[0],
            "Pricing.CurrencyCode"
          );
          scriptJSONObj.currency = defCurrencyCode;
        }
        if (_.get(rooms[0], "GuestInfo") !== undefined) {
          scriptJSONObj.customer_first_name = _.get(
            rooms[0],
            "GuestInfo.firstName"
          );
          scriptJSONObj.customer_last_name = _.get(
            rooms[0],
            "GuestInfo.lastName"
          );
          scriptJSONObj.customer_country = _.get(
            rooms[0],
            "GuestInfo.countryName"
          );
          scriptJSONObj.customer_email = _.get(
            rooms[0],
            "GuestInfo.emailAddress"
          );
        }
        if (_.get(rooms[0], "PaymentInfo") !== undefined) {
          scriptJSONObj.order_payment_method = _.get(
            rooms[0],
            "PaymentInfo.cardType"
          );
        }
      }
      let diffDays = null;
      if (checkInDate !== null && currentDate !== null) {
        diffDays = this.getUTCDiffDays(currentDate, checkInDate);
      }
      scriptJSONObj.language_code = _.get(languageObj, "code");
      scriptJSONObj.num_of_rooms =
        "" + _.get(basketSummary, "GuestSummary.rooms");
      scriptJSONObj.page_name = pageName;
      scriptJSONObj.page_type = pageType;
      scriptJSONObj.foreign_avg_room_rate = [];
      let orderSubTotal = 0;
      let orderTax = 0;
      let orderTotal = 0;
      for (let index = 0; index < rooms.length; index++) {
        if (_.get(rooms[index], "Pricing") !== undefined) {
          scriptJSONObj.avg_room_rate[index] =
            "" +
            Math.abs(
              Number(_.get(rooms[index], "Pricing.TotalPrice")) -
                Number(_.get(rooms[index], "Pricing.Tax"))
            ).toFixed(2);
          orderSubTotal =
            orderSubTotal +
            Math.abs(
              Number(_.get(rooms[index], "Pricing.DefTotalPrice")) -
                Number(_.get(rooms[index], "Pricing.DefTax"))
            );
          orderTax = orderTax + Number(_.get(rooms[index], "Pricing.DefTax"));
          orderTotal =
            orderTotal + Number(_.get(rooms[index], "Pricing.DefTotalPrice"));
          if (
            scriptJSONObj.currency !== scriptJSONObj.foreign_currency &&
            scriptJSONObj.foreign_currency !== ""
          ) {
            scriptJSONObj.foreign_avg_room_rate[index] =
              "" +
              Math.abs(
                Number(_.get(rooms[index], "Pricing.TotalPrice")) -
                  Number(_.get(rooms[index], "Pricing.Tax"))
              ).toFixed(2);
            scriptJSONObj.avg_room_rate[index] =
              "" +
              Math.abs(
                Number(_.get(rooms[index], "Pricing.DefTotalPrice")) -
                  Number(_.get(rooms[index], "Pricing.DefTax"))
              ).toFixed(2);
          }
        }
        scriptJSONObj.rate_code[index] = _.get(rooms[index], "RatePlan.code");
        scriptJSONObj.bed_type[index] = _.get(rooms[index], "BedTypeName");
        scriptJSONObj.room_sub_types[index] = _.get(
          rooms[index],
          "RoomDetails.name"
        );
        scriptJSONObj.room_types[index] = _.get(
          rooms[index],
          "RoomDetails.roomType"
        );
        scriptJSONObj.order_room_type[index] = _.get(
          rooms[index],
          "UniqueCode"
        );
      }
      scriptJSONObj.order_subtotal = "" + orderSubTotal.toFixed(2);
      scriptJSONObj.order_tax_amount = "" + orderTax.toFixed(2);
      scriptJSONObj.order_total = "" + orderTotal.toFixed(2);
      let totalGuests = 0;
      for (let index = 0; index < guests.length; index++) {
        scriptJSONObj.check_in[index] = formattedCheckInDate;
        scriptJSONObj.check_out[index] = formattedCheckOutDate;
        scriptJSONObj.days_till_checkin[index] = "" + diffDays;
        scriptJSONObj.num_of_adults[index] =
          "" + _.get(guests[index], "adults");
        scriptJSONObj.num_of_children[index] =
          "" + _.get(guests[index], "children");
        scriptJSONObj.num_of_nights[index] =
          "" + _.get(basketSummary, "GuestSummary.los");
        const totalGuestsPerRoom =
          Number(_.get(guests[index], "adults")) +
          Number(_.get(guests[index], "children"));
        scriptJSONObj.occupancy_detail[index] = "" + totalGuestsPerRoom;
        scriptJSONObj.order_room_occupancy[index] = "" + totalGuestsPerRoom;
        if (!isNaN(totalGuestsPerRoom)) {
          totalGuests = totalGuests + Number(totalGuestsPerRoom);
        }
      }
      scriptJSONObj.order_total_occupancy = "" + totalGuests;
    } else {
      scriptJSONObj = _.cloneDeep(utag_data_single_room);
      scriptJSONObj.check_in = formattedCheckInDate;
      scriptJSONObj.check_out = formattedCheckOutDate;
      scriptJSONObj.page_name = pageName;
      scriptJSONObj.page_type = pageType;
      scriptJSONObj.currency = "SGD";
      scriptJSONObj.foreign_currency = "";
      if (
        _.get(basketSummary, "ReservationResp.ResvConfCodes") !== undefined &&
        _.get(basketSummary, "ReservationResp.ResvConfCodes") !== null &&
        _.get(basketSummary, "ReservationResp.ResvConfCodes") !== "" &&
        _.get(basketSummary, "ReservationResp.ResvConfCodes").length > 0
      ) {
        scriptJSONObj.order_id = basketSummary.ReservationResp.ResvConfCodes[0];
      }
      if (rooms.length > 0) {
        scriptJSONObj.bed_type[0] = rooms[0].BedTypeName;
        if (_.get(rooms[0], "Pricing") !== undefined) {
          scriptJSONObj.avg_room_rate[0] =
            "" +
            Math.abs(
              Number(_.get(rooms[0], "Pricing.TotalPrice")) -
                Number(_.get(rooms[0], "Pricing.Tax"))
            ).toFixed(2);
          scriptJSONObj.foreign_avg_room_rate = [];
          scriptJSONObj.order_subtotal =
            "" +
            Math.abs(
              Number(_.get(rooms[0], "Pricing.DefTotalPrice")) -
                Number(_.get(rooms[0], "Pricing.DefTax"))
            ).toFixed(2);
          scriptJSONObj.order_tax_amount =
            "" + Number(_.get(rooms[0], "Pricing.DefTax")).toFixed(2);
          scriptJSONObj.order_total =
            "" + Number(_.get(rooms[0], "Pricing.DefTotalPrice")).toFixed(2);
          scriptJSONObj.currency = _.get(rooms[0], "Pricing.CurrencyCode");
          if (defCurrencyCode !== scriptJSONObj.currency) {
            scriptJSONObj.foreign_avg_room_rate[0] =
              "" +
              Math.abs(
                Number(_.get(rooms[0], "Pricing.TotalPrice")) -
                  Number(_.get(rooms[0], "Pricing.Tax"))
              ).toFixed(2);
            scriptJSONObj.avg_room_rate[0] =
              "" +
              Math.abs(
                Number(_.get(rooms[0], "Pricing.DefTotalPrice")) -
                  Number(_.get(rooms[0], "Pricing.DefTax"))
              ).toFixed(2);
            scriptJSONObj.currency = defCurrencyCode;
            scriptJSONObj.foreign_currency = _.get(
              rooms[0],
              "Pricing.CurrencyCode"
            );
          }
        }
        scriptJSONObj.rate_code = _.get(rooms[0], "RatePlan.code");
        scriptJSONObj.order_cancellation_policy = _.get(
          rooms[0],
          "RatePlan.cancellationPolicy"
        );
        scriptJSONObj.order_room_type[0] = _.get(rooms[0], "UniqueCode");
        scriptJSONObj.room_sub_types[0] = _.get(rooms[0], "RoomDetails.name");
        scriptJSONObj.room_types[0] = _.get(rooms[0], "RoomDetails.roomType");
        if (_.get(rooms[0], "GuestInfo") !== undefined) {
          scriptJSONObj.customer_first_name = _.get(
            rooms[0],
            "GuestInfo.firstName"
          );
          scriptJSONObj.customer_last_name = _.get(
            rooms[0],
            "GuestInfo.lastName"
          );
          scriptJSONObj.customer_country = _.get(
            rooms[0],
            "GuestInfo.countryName"
          );
          scriptJSONObj.customer_email = _.get(
            rooms[0],
            "GuestInfo.emailAddress"
          );
        }
        if (_.get(rooms[0], "PaymentInfo") !== undefined) {
          scriptJSONObj.order_payment_method = _.get(
            rooms[0],
            "PaymentInfo.cardType"
          );
        }
      }
      if (scriptJSONObj.currency !== defCurrencyCode) {
        scriptJSONObj.foreign_currency = defCurrencyCode;
      }
      let diffDays = null;
      if (checkInDate !== null && currentDate !== null) {
        diffDays = this.getUTCDiffDays(currentDate, checkInDate);
      }
      scriptJSONObj.days_till_checkin = "" + diffDays;
      scriptJSONObj.language_code = _.get(languageObj, "code");
      scriptJSONObj.num_of_adults[0] = "" + _.get(guests[0], "adults");
      scriptJSONObj.num_of_children[0] = "" + _.get(guests[0], "children");
      scriptJSONObj.num_of_nights[0] =
        "" + _.get(basketSummary, "GuestSummary.los");
      scriptJSONObj.num_of_rooms =
        "" + _.get(basketSummary, "GuestSummary.rooms");
      const totalGuests =
        Number(_.get(guests[0], "adults")) +
        Number(_.get(guests[0], "children"));
      scriptJSONObj.occupancy_detail[0] = "" + totalGuests;
      scriptJSONObj.order_room_occupancy[0] = "" + totalGuests;
      scriptJSONObj.order_total_occupancy = "" + totalGuests;
    }
    const scriptText = "var utag_data = " + JSON.stringify(scriptJSONObj) + ";";
    return scriptText;
  }

  // public static populateTripTeaseConfirmationAttributes(basketSummary: any, index: number) {
  //   const returnObj = [];
  //   returnObj[0] = environment.trip_tease_hotel_key;
  //   let totalPrice = 0;
  //   if (basketSummary.Rooms !== undefined && basketSummary.Rooms.length > 0 && basketSummary.Rooms.length > index) {
  //     totalPrice = Number(Number(_.get(basketSummary.Rooms[index], 'Pricing.TotalPrice')).toFixed(2));
  //   }
  //   returnObj[1] = totalPrice;
  //   returnObj[2] = basketSummary.CurrencyCode;
  //   let reservationCode = '';
  //   if (_.get(basketSummary, 'ReservationResp.ResvConfCodes') !== undefined
  //     && _.get(basketSummary, 'ReservationResp.ResvConfCodes') !== null
  //     && _.get(basketSummary, 'ReservationResp.ResvConfCodes').length > 0
  //     && _.get(basketSummary, 'ReservationResp.ResvConfCodes').length > index) {
  //     reservationCode = basketSummary.ReservationResp.ResvConfCodes[index];
  //   }
  //   returnObj[3] = reservationCode;
  //   return returnObj;
  // }

  public static populateTrackingObject(
    basketSummary: any,
    languageObj: any,
    pageName: string
  ) {
    let checkInDate = null;
    let checkOutDate = null;
    // let currentDate = null;
    let formattedCheckInDate = null;
    let formattedCheckOutDate = null;
    let guests = null;
    let pageId = 0;
    switch (pageName) {
      case TEALIUM_PAGE_NAMES.booking_search:
        pageId = 1;
        break;
      case TEALIUM_PAGE_NAMES.booking_select_room:
        pageId = 2;
        break;
      case TEALIUM_PAGE_NAMES.booking_payment:
        pageId = 3;
        break;
      case TEALIUM_PAGE_NAMES.booking_confirmation:
        pageId = 4;
        break;
      default:
        pageId = 0;
    }
    const rooms = _.get(basketSummary, "Rooms");
    if (
      _.get(basketSummary, "GuestSummary") !== undefined &&
      _.get(basketSummary, "GuestSummary") !== null
    ) {
      checkInDate = _.get(basketSummary, "GuestSummary.checkindate");
      checkOutDate = _.get(basketSummary, "GuestSummary.checkoutdate");
      // currentDate = new Date();
      if (checkInDate !== null) {
        formattedCheckInDate = this.getFormattedDate(checkInDate);
      }
      if (checkOutDate !== null) {
        formattedCheckOutDate = this.getFormattedDate(checkOutDate);
      }
      guests = _.get(basketSummary, "GuestSummary.guests");
    }
    let scriptText = "";
    if (
      _.get(basketSummary, "GuestSummary.rooms") !== undefined &&
      Number(_.get(basketSummary, "GuestSummary.rooms")) > 1
    ) {
      for (let index = 0; index < guests.length; index++) {
        const scriptJSONObj = _.cloneDeep(trackingObject);
        if (
          _.get(basketSummary, "ReservationResp.ResvConfCodes") !== undefined &&
          _.get(basketSummary, "ReservationResp.ResvConfCodes") !== null &&
          _.get(basketSummary, "ReservationResp.ResvConfCodes") !== "" &&
          _.get(basketSummary, "ReservationResp.ResvConfCodes").length > 0
        ) {
          scriptJSONObj.orderId =
            basketSummary.ReservationResp.ResvConfCodes[index];
        }
        scriptJSONObj.pageID = pageId;
        scriptJSONObj.arriveDate = formattedCheckInDate;
        scriptJSONObj.departDate = formattedCheckOutDate;
        scriptJSONObj.numAdults = Number(_.get(guests[index], "adults"));
        scriptJSONObj.numChildren = Number(_.get(guests[index], "children"));
        scriptJSONObj.numRooms = Number(
          _.get(basketSummary, "GuestSummary.rooms")
        );
        scriptJSONObj.pageName = pageName;
        if (index < rooms.length) {
          scriptJSONObj.productName = _.get(rooms[index], "RatePlan.code");
          scriptJSONObj.offerCode = _.get(rooms[index], "RatePlan.code");
          scriptJSONObj.sku =
            _.get(rooms[index], "RoomDetails.roomType") +
            "-" +
            _.get(rooms[index], "RoomDetails.name");
          scriptJSONObj.tax =
            "" + Number(_.get(rooms[index], "Pricing.Tax")).toFixed(2);
          scriptJSONObj.total =
            "" + Number(_.get(rooms[index], "Pricing.TotalPrice")).toFixed(2);
          const unitPrice = (
            Number(_.get(rooms[index], "Pricing.TotalPrice")) -
            Number(_.get(rooms[index], "Pricing.Tax"))
          ).toFixed(2);
          scriptJSONObj.unitPrice = "" + unitPrice;
        }
        scriptText =
          scriptText +
          "trackingObject" +
          (index + 1) +
          " = " +
          JSON.stringify(scriptJSONObj) +
          ";";
      }
    } else {
      const scriptJSONObj = _.cloneDeep(trackingObject);
      if (
        _.get(basketSummary, "ReservationResp.ResvConfCodes") !== undefined &&
        _.get(basketSummary, "ReservationResp.ResvConfCodes") !== null &&
        _.get(basketSummary, "ReservationResp.ResvConfCodes") !== "" &&
        _.get(basketSummary, "ReservationResp.ResvConfCodes").length > 0
      ) {
        scriptJSONObj.orderId = basketSummary.ReservationResp.ResvConfCodes[0];
      }
      scriptJSONObj.pageID = pageId;
      scriptJSONObj.arriveDate = formattedCheckInDate;
      scriptJSONObj.departDate = formattedCheckOutDate;
      scriptJSONObj.numAdults = Number(_.get(guests[0], "adults"));
      scriptJSONObj.numChildren = Number(_.get(guests[0], "children"));
      scriptJSONObj.numRooms = Number(
        _.get(basketSummary, "GuestSummary.rooms")
      );
      scriptJSONObj.pageName = pageName;
      if (rooms.length > 0) {
        scriptJSONObj.productName = _.get(rooms[0], "RatePlan.code");
        scriptJSONObj.offerCode = _.get(rooms[0], "RatePlan.code");
        scriptJSONObj.sku =
          _.get(rooms[0], "RoomDetails.roomType") +
          "-" +
          _.get(rooms[0], "RoomDetails.name");
        scriptJSONObj.tax =
          "" + Number(_.get(rooms[0], "Pricing.Tax")).toFixed(2);
        scriptJSONObj.total =
          "" + Number(_.get(rooms[0], "Pricing.TotalPrice")).toFixed(2);
        const unitPrice = (
          Number(_.get(rooms[0], "Pricing.TotalPrice")) -
          Number(_.get(rooms[0], "Pricing.Tax"))
        ).toFixed(2);
        scriptJSONObj.unitPrice = "" + unitPrice;
      }
      scriptText = "trackingObject = " + JSON.stringify(scriptJSONObj) + ";";
    }
    return scriptText;
  }

  public static getFormattedDate(dateVal: any) {
    dateVal = new Date(dateVal);
    let returnVal = "";
    let month = "" + (dateVal.getMonth() + 1);
    if (month.length === 1) {
      month = "0" + month;
    }
    let day = "" + dateVal.getDate();
    if (day.length === 1) {
      day = "0" + day;
    }
    const year = "" + dateVal.getFullYear();
    returnVal = month + "/" + day + "/" + year;
    return returnVal;
  }

  public static getFormattedDateByHyphen(dateVal: any) {
    let returnVal = "";
    let month = "" + (dateVal.getMonth() + 1);
    if (month.length === 1) {
      month = "0" + month;
    }
    let day = "" + dateVal.getDate();
    if (day.length === 1) {
      day = "0" + day;
    }
    const year = "" + dateVal.getFullYear();
    returnVal = year + "-" + month + "-" + day;
    return returnVal;
  }

  static getCurrentParams() {
    return location.search
      .slice(1)
      .split("&")
      .map((p) => p.split("="))
      .reduce((obj, pair) => {
        const [key, value] = pair.map(decodeURIComponent);
        return { ...obj, [key]: value };
      }, {});
  }

  public static getSearchPageQueryParams(
    rateCode: string,
    languageObject: any,
    guestSummary?: ICheckinSummary,
    _storeSvc?: StoreService
  ) {
    const params = { ...this.getCurrentParams() };
    params[QUERY_PARAM_ATTRIBUTES.LOCALE] = "en";
    params[QUERY_PARAM_ATTRIBUTES.OFFERCODE] = "";
    params[QUERY_PARAM_ATTRIBUTES.FLOW] = TRADITIONAL_FLOW;
    if (rateCode !== undefined && rateCode !== null && rateCode.length > 0) {
      params[QUERY_PARAM_ATTRIBUTES.OFFERCODE] = rateCode;
    }
    const langCode = _.get(languageObject, "code");
    if (langCode) {
      params[QUERY_PARAM_ATTRIBUTES.LOCALE] = langCode;
    }
    if (guestSummary !== undefined) {
      _storeSvc.updateGuestDuration(guestSummary);
      params[QUERY_PARAM_ATTRIBUTES.ROOMS] = guestSummary.rooms || 1;
      params[QUERY_PARAM_ATTRIBUTES.CHECKINDATE] = moment(
        guestSummary.checkindate
      ).format("YYYY-MM-DD");
      params[QUERY_PARAM_ATTRIBUTES.LOS] = guestSummary.los;
      let index = 1;
      guestSummary.guests.forEach((element) => {
        params[[QUERY_PARAM_ATTRIBUTES.ADULTS, index].join("_")] =
          element.adults;
        params[[QUERY_PARAM_ATTRIBUTES.CHILDREN, index].join("_")] =
          element.children;
        index++;
      });
      params[QUERY_PARAM_ATTRIBUTES.MULTIROOM] = this.isMultiRoom(
        guestSummary.rooms
      );
    }
    return params;
  }

  public static getGuestInfoQueryParams(
    rooms: any,
    languageObject: any,
    errorCode?: any
  ) {
    const params = { ...this.getCurrentParams() };
    let rateCode = "";
    if (rooms !== undefined && rooms !== null && rooms.length > 0) {
      rateCode = _.get(rooms[0], "RatePlan.code");
    }
    if (rateCode !== undefined) {
      params[QUERY_PARAM_ATTRIBUTES.RATECODE] = rateCode;
    }
    if (errorCode !== undefined && errorCode !== null) {
      params["ErrorCode"] = errorCode;
    }
    if (JSON.parse(sessionStorage.getItem("storeState"))) {
      const iataObject = JSON.parse(sessionStorage.getItem("storeState"))
        .userSettingsReducer.iata;
      const iataNumber = iataObject.iataNumber;
      if (iataNumber !== "") {
        params[QUERY_PARAM_ATTRIBUTES.IATA] = iataNumber;
      }
    }
    params[QUERY_PARAM_ATTRIBUTES.FLOW] = TRADITIONAL_FLOW;
    params[QUERY_PARAM_ATTRIBUTES.MULTIROOM] = CommonUtility.isMultiRoom(
      rooms.length
    );
    params[QUERY_PARAM_ATTRIBUTES.LOCALE] = languageObject.code;
    return params;
  }

  public static getConfirmationQueryParams(
    confirmationCode: string,
    rooms: any,
    languageObject: any
  ) {
    const params = { ...this.getCurrentParams() };
    let rateCode = "";
    if (
      confirmationCode !== null &&
      confirmationCode !== undefined &&
      confirmationCode.length > 0
    ) {
      params["confirmation_code"] = confirmationCode;
    }
    if (rooms !== undefined && rooms !== null && rooms.length > 0) {
      rateCode = _.get(rooms[0], "RatePlan.code");
    }
    if (rateCode !== undefined) {
      params[QUERY_PARAM_ATTRIBUTES.RATECODE] = rateCode;
    }
    params[QUERY_PARAM_ATTRIBUTES.LOCALE] = languageObject.code;
    params[QUERY_PARAM_ATTRIBUTES.MULTIROOM] = CommonUtility.isMultiRoom(
      rooms.length
    );
    params[QUERY_PARAM_ATTRIBUTES.FLOW] = TRADITIONAL_FLOW;
    return params;
  }

  public static getMultiRoomRateplanQueryParams(
    offerCode: string,
    langObj: any,
    currency: any
  ) {
    const params = { ...this.getCurrentParams() };
    params[QUERY_PARAM_ATTRIBUTES.OFFERCODE] = "";
    if (offerCode !== undefined && offerCode !== null && offerCode.length > 0) {
      params[QUERY_PARAM_ATTRIBUTES.OFFERCODE] = offerCode;
    }
    const langCode = _.get(langObj, "code");
    if (langCode) {
      params[QUERY_PARAM_ATTRIBUTES.LOCALE] = langCode;
    }
    if (currency) {
      params[QUERY_PARAM_ATTRIBUTES.CURRENCY] = currency;
    }

    if (JSON.parse(sessionStorage.getItem("storeState"))) {
      const iataObject = JSON.parse(sessionStorage.getItem("storeState"))
        .userSettingsReducer.iata;
      const iataNumber = iataObject.iataNumber;
      if (iataNumber !== "") {
        params[QUERY_PARAM_ATTRIBUTES.IATA] = iataNumber;
      }
    }

    params[QUERY_PARAM_ATTRIBUTES.FLOW] = TRADITIONAL_FLOW;
    params[QUERY_PARAM_ATTRIBUTES.MULTIROOM] = true;
    return params;
  }

  public static getQueryParamObjGuestSummary(
    guestSummary: ICheckinSummary,
    _storeSvc: StoreService,
    offerCode: string,
    errCode?: number,
    accessCode?: string
  ) {
    const queryParams = {
      ...this.getCurrentParams(),
      Rooms: guestSummary.rooms || 1,
      CheckinDate: moment(guestSummary.checkindate).format("YYYY-MM-DD"),
      LOS: guestSummary.los,
    };
    if (errCode) {
      queryParams["ErrorCode"] = errCode;
    }
    let index = 1;
    guestSummary.guests.forEach((element) => {
      queryParams[[QUERY_PARAM_ATTRIBUTES.ADULTS, index].join("_")] =
        element.adults;
      queryParams[[QUERY_PARAM_ATTRIBUTES.CHILDREN, index].join("_")] =
        element.children;
      index++;
    });
    const langCode = _storeSvc.getUserSettingsState().langObj;
    const currency = _storeSvc.getBasketState().CurrencyCode;
    const iataNumber = _.get(
      _storeSvc.getUserSettingsState(),
      "iata.iataNumber"
    );
    queryParams[QUERY_PARAM_ATTRIBUTES.IATA] = "";
    if (iataNumber) {
      queryParams[QUERY_PARAM_ATTRIBUTES.IATA] = iataNumber;
    }
    queryParams[QUERY_PARAM_ATTRIBUTES.LOCALE] = langCode.code;
    queryParams[QUERY_PARAM_ATTRIBUTES.CURRENCY] = currency;
    queryParams[QUERY_PARAM_ATTRIBUTES.FLOW] = TRADITIONAL_FLOW;
    queryParams[QUERY_PARAM_ATTRIBUTES.MULTIROOM] = this.isMultiRoom(
      guestSummary.rooms
    );
    queryParams[QUERY_PARAM_ATTRIBUTES.OFFERCODE] = "";
    if (offerCode !== undefined && offerCode !== null && offerCode.length > 0) {
      queryParams[QUERY_PARAM_ATTRIBUTES.OFFERCODE] = offerCode;
    }
    queryParams[QUERY_PARAM_ATTRIBUTES.ACCESS_CODE] = "";
    if (
      accessCode !== undefined &&
      accessCode !== null &&
      accessCode.length > 0
    ) {
      queryParams[QUERY_PARAM_ATTRIBUTES.ACCESS_CODE] = accessCode;
    }

    const isPromoFlow = _storeSvc.getBasketState().isPromoFlow;
    const isSpecialsFlow = _storeSvc.getBasketState().isSpecialsFlow;
    const promoData = _.get(_storeSvc.getBasketState(), "promoData");

    if (
      promoData.accessCode === "" &&
      promoData.priorAccessCode !== undefined &&
      promoData.priorAccessCode !== "" &&
      promoData.validationState
    ) {
      queryParams[QUERY_PARAM_ATTRIBUTES.OFFERCODE] = "";
      _storeSvc.updateOfferCode("");
    }

    if (
      isPromoFlow ||
      isSpecialsFlow ||
      (promoData.accessCode !== "" && promoData.accessCode !== undefined)
    ) {
      queryParams[QUERY_PARAM_ATTRIBUTES.ACCESS_CODE] =
        promoData.accessCode || "";
      queryParams[QUERY_PARAM_ATTRIBUTES.IS_SPECIAL_RATE] =
        promoData.isSpecialRate || false;
      if (promoData.accessCode !== "" && promoData.accessCode !== undefined) {
        queryParams[QUERY_PARAM_ATTRIBUTES.OFFERCODE] =
          promoData.offerCode ||
          (offerCode !== undefined && offerCode !== null && offerCode.length > 0
            ? offerCode
            : "");
      } else {
        if (
          _storeSvc.getBasketState().splOfferCode !== "" &&
          _storeSvc.getBasketState().splOfferCode !== undefined &&
          offerCode !== undefined &&
          offerCode.length > 0
        ) {
          // if user lands with only offer code on promo / specials
          queryParams[QUERY_PARAM_ATTRIBUTES.OFFERCODE] = offerCode;
        } else {
          queryParams[QUERY_PARAM_ATTRIBUTES.OFFERCODE] =
            promoData.offerCode || "";
        }

        if (
          _storeSvc.getBasketState().isSpecialsFlow &&
          _storeSvc.getBasketState().isSelectedRatePlanAvailable !== "" &&
          !_storeSvc.getBasketState().isSelectedRatePlanAvailable &&
          (location.pathname === "/" + URL_PATHS.GUEST_INFO_PAGE ||
            location.pathname === "/" + URL_PATHS.ROOMS_PAGE)
        ) {
          queryParams[QUERY_PARAM_ATTRIBUTES.OFFERCODE] = "";
          delete queryParams[QUERY_PARAM_ATTRIBUTES.IS_SPECIAL_RATE];
        }
      }
    }
    return queryParams;
  }

  public static highlightStep(step: string) {
    const elSelectRoom = document.querySelector(".step-" + step);
    if (elSelectRoom !== null && elSelectRoom !== undefined) {
      elSelectRoom.classList.add("bold-text-and-cursor-pointer");
      elSelectRoom.classList.add("enable-pointer-events");
      elSelectRoom.classList.remove("disable-pointer-events");
      elSelectRoom.setAttribute("tabindex", "0");
    }

    const elInnerSearchRoom = document.querySelector(".inner-circle-" + step);
    if (elInnerSearchRoom !== null && elInnerSearchRoom !== undefined) {
      elInnerSearchRoom.classList.add("inner");
      elInnerSearchRoom.classList.add("circle");
      elInnerSearchRoom.classList.add("shapeborder-selected");
      elInnerSearchRoom.classList.add("circle-text");
    }

    const elOuterSearchRoom = document.querySelector(".outer-circle-" + step);
    if (elOuterSearchRoom !== null && elOuterSearchRoom !== undefined) {
      elOuterSearchRoom.classList.remove("shapeborder");
      elOuterSearchRoom.classList.remove("circle-text");
      elOuterSearchRoom.classList.add("shapeborder-selected");
    }

    if (step === "search") {
      CommonUtility.scrollIntoViewId("h_link_search");
      CommonUtility.unhighlightStep("select-room");
      CommonUtility.unhighlightStep("guest-info");
      CommonUtility.unhighlightStep("confirmation");
    }
    if (step === "select-room") {
      CommonUtility.subhighlightStep("search");
      CommonUtility.unhighlightStep("guest-info");
      CommonUtility.unhighlightStep("confirmation");
    }
    if (step === "guest-info") {
      CommonUtility.subhighlightStep("select-room");
      CommonUtility.unhighlightStep("confirmation");
    }
    if (step === "confirmation") {
      CommonUtility.subhighlightStep("guest-info");
    }
    this.hideShowLabelforMobile(step);
  }

  public static hideShowLabelforMobile(step: string) {
    if (step === "search") {
      CommonUtility.hideOrShowLabel("search", true);
      CommonUtility.hideOrShowLabel("select-room", false);
      CommonUtility.hideOrShowLabel("guest-info", false);
      CommonUtility.hideOrShowLabel("confirmation", false);
    }
    if (step === "select-room") {
      CommonUtility.hideOrShowLabel("search", false);
      CommonUtility.hideOrShowLabel("select-room", true);
      CommonUtility.hideOrShowLabel("guest-info", false);
      CommonUtility.hideOrShowLabel("confirmation", false);
    }
    if (step === "guest-info") {
      CommonUtility.hideOrShowLabel("search", false);
      CommonUtility.hideOrShowLabel("select-room", false);
      CommonUtility.hideOrShowLabel("guest-info", true);
      CommonUtility.hideOrShowLabel("confirmation", false);
    }
    if (step === "confirmation") {
      CommonUtility.hideOrShowLabel("search", false);
      CommonUtility.hideOrShowLabel("select-room", false);
      CommonUtility.hideOrShowLabel("guest-info", false);
      CommonUtility.hideOrShowLabel("confirmation", true);
    }
  }

  public static hideOrShowLabel(step: string, show: boolean) {
    const elLabel = document.querySelector(".step-" + step + "-label");
    if (elLabel !== null && elLabel !== undefined) {
      if (show) {
        elLabel.classList.add("show-on-higlight-mobile");
        elLabel.classList.remove("hide-on-unhiglight-mobile");
      } else {
        elLabel.classList.remove("show-on-higlight-mobile");
        elLabel.classList.add("hide-on-unhiglight-mobile");
      }
    }
  }

  public static subhighlightStep(step: string) {
    const elSelectRoom = document.querySelector(".step-" + step);
    if (elSelectRoom !== undefined && elSelectRoom !== null) {
      elSelectRoom.classList.add("bold-text-and-cursor-pointer");
      elSelectRoom.classList.add("enable-pointer-events");
      elSelectRoom.classList.remove("disable-pointer-events");
      elSelectRoom.setAttribute("tabindex", "0");
    }

    const elLabel = document.querySelector(".step-" + step + "-label");
    if (elLabel !== null && elLabel !== undefined) {
      elSelectRoom.classList.remove("show-on-higlight-mobile");
      elSelectRoom.classList.add("hide-on-unhiglight-mobile");
    }

    const elInnerSearchRoom = document.querySelector(".inner-circle-" + step);
    if (elInnerSearchRoom !== undefined && elInnerSearchRoom !== null) {
      elInnerSearchRoom.classList.add("inner");
      elInnerSearchRoom.classList.add("circle");
      elInnerSearchRoom.classList.add("shapeborder-selected");
      elInnerSearchRoom.classList.add("circle-text");
    }

    const elOuterSearchRoom = document.querySelector(".outer-circle-" + step);
    if (elOuterSearchRoom !== undefined && elOuterSearchRoom !== null) {
      elOuterSearchRoom.classList.remove("shapeborder");
      elOuterSearchRoom.classList.remove("circle-text");
      elOuterSearchRoom.classList.add("shapeborder-selected");
    }

    if (step === "select-room") {
      CommonUtility.subhighlightStep("search");
    }
    if (step === "guest-info") {
      CommonUtility.subhighlightStep("select-room");
    }
    if (step === "confirmation") {
      CommonUtility.subhighlightStep("guest-info");
    }
  }

  private static unhighlightStep(step: string) {
    const elSelectRoom = document.querySelector(".step-" + step);
    if (elSelectRoom !== undefined && elSelectRoom !== null) {
      elSelectRoom.classList.remove("bold-text-and-cursor-pointer");
      elSelectRoom.classList.add("disable-pointer-events");
      elSelectRoom.classList.remove("enable-pointer-events");
      elSelectRoom.removeAttribute("tabindex");
    }

    const elInnerSearchRoom = document.querySelector(".inner-circle-" + step);
    if (elInnerSearchRoom !== undefined && elInnerSearchRoom !== null) {
      elInnerSearchRoom.classList.remove("inner");
      elInnerSearchRoom.classList.remove("circle");
      elInnerSearchRoom.classList.remove("shapeborder-selected");
      elInnerSearchRoom.classList.remove("circle-text");
    }

    const elOuterSearchRoom = document.querySelector(".outer-circle-" + step);
    if (elOuterSearchRoom !== undefined && elOuterSearchRoom !== null) {
      elOuterSearchRoom.classList.add("shapeborder");
      elOuterSearchRoom.classList.add("circle-text");
      elOuterSearchRoom.classList.remove("shapeborder-selected");
    }
  }

  public static getSearchUrlFromGuestSummary(
    guestSummary: CheckinSummary,
    roomNo?: number
  ) {
    const rno = roomNo || 0;
    const checkindate = guestSummary.checkindate;
    const queryParams = {
      Room: guestSummary.rooms,
      CheckinDate: [
        checkindate.getDate(),
        checkindate.getMonth() + 1,
        checkindate.getFullYear(),
      ].join("/"),
      LOS: guestSummary.los,
      Adults: guestSummary.guests[rno].adults,
      Children: guestSummary.guests[rno].children,
    };
    return queryParams;
  }

  public static scrollIntoViewId(divId: string, behaviorObj?: any) {
    this.scrollIntoView("#" + divId);
  }

  public static scrollIntoViewName(divName: string, behaviorObj?: any) {
    this.scrollIntoView("." + divName, behaviorObj);
  }

  public static scrollIntoView(divName: string, behaviorObj?: any) {
    const el1 = document.querySelector(divName);
    if (el1 !== undefined && el1 !== null) {
      el1.scrollIntoView({
        behavior: _.get(behaviorObj, "behavior") || "smooth",
        block: _.get(behaviorObj, "block") || "center",
        inline: _.get(behaviorObj, "inline") || "nearest",
      });
    }
  }

  public static getCheckInSummaryFromQueryParams(
    params: any,
    adultsCnt?: number,
    childrenCnt?: number,
    los?: number
  ) {
    const rateCalendarConfigs = this.getRateCalendarConfigs();
    adultsCnt = rateCalendarConfigs.maxAdults;
    childrenCnt = rateCalendarConfigs.maxChildren;
    // los = rateCalendarConfigs.maxLOS;
    let isvalidParam = true;
    const guestSummary: CheckinSummary = new CheckinSummary();
    const queryParams = _.cloneDeep(params);
    const checkindateStr = queryParams[QUERY_PARAM_ATTRIBUTES.CHECKINDATE];
    let isCheckInDateExists = true;

    // Create current date w.r.t property timezone
    let propertyInfo = {};
    let propertyTimeZoneOffset = null;
    if (JSON.parse(sessionStorage.getItem("storeState"))) {
      propertyInfo = JSON.parse(sessionStorage.getItem("storeState"))
        .userSettingsReducer.propertyInfo;
      propertyTimeZoneOffset = _.get(
        propertyInfo,
        "propertyTimezone.timezoneOffset"
      );
    }

    const tmpDate = new Date();
    if (
      propertyTimeZoneOffset !== undefined &&
      propertyTimeZoneOffset !== null
    ) {
      tmpDate.setTime(
        tmpDate.getTime() +
          (propertyTimeZoneOffset * 60000 + tmpDate.getTimezoneOffset() * 60000)
      );
    }
    const cDate = new Date(
      tmpDate.getFullYear(),
      tmpDate.getMonth(),
      tmpDate.getDate()
    );
    const eDate = new Date(
      tmpDate.getFullYear(),
      tmpDate.getMonth(),
      tmpDate.getDate()
    );

    // Fetch LOS
    let losVal = queryParams[QUERY_PARAM_ATTRIBUTES.LOS];
    if (losVal !== undefined && losVal !== null && losVal !== "") {
      // Set Default LOS if PARAMS los is invalid
      if (!/^-?\d+(\.\d+)?$/.test(losVal)) {
        losVal = rateCalendarConfigs.defaultLOS;
        isvalidParam = false;
      } else {
        losVal = Math.floor(Number(losVal));
      }
    } else {
      isvalidParam = false;
      losVal = rateCalendarConfigs.defaultLOS;
    }

    if (losVal > rateCalendarConfigs.maxLOS) {
      isvalidParam = false;
      losVal = rateCalendarConfigs.defaultLOS;
    }
    if (losVal < rateCalendarConfigs.minLOS) {
      isvalidParam = false;
      losVal = rateCalendarConfigs.defaultLOS;
    }

    if (checkindateStr !== undefined) {
      guestSummary.los = losVal;
      queryParams[QUERY_PARAM_ATTRIBUTES.LOS] = losVal;
      // Check if Params CHECKING DATE is Valid or Not
      if (
        !/^(20|21)\d{2}-([1-9]|0[1-9]|1[0-2])-([0-2]\d{1}|3[0-1]|\d{1})$/.test(
          checkindateStr
        )
      ) {
        // set the checkingdate to current date
        isvalidParam = false;
        // If Not valid set the CHECKING DATE to Current Date
        cDate.setDate(cDate.getDate());
        eDate.setDate(eDate.getDate() + guestSummary.los);
        guestSummary.checkindate = cDate;
        guestSummary.checkoutdate = eDate;
        queryParams[QUERY_PARAM_ATTRIBUTES.CHECKINDATE] = this.formateDate(
          cDate
        );
      } else {
        // IF its a valid CHECKING DATE
        const dateTokens = this.getCalYearMonthDatefromString(checkindateStr);
        const checkInDateParam = new Date(
          dateTokens[0],
          dateTokens[1],
          dateTokens[2],
          0,
          0,
          0
        );
        const isPastDateFlag = CommonUtility.compareDates(
          checkInDateParam,
          cDate
        );

        // Check if it's a Past Date
        if (isPastDateFlag < 0) {
          cDate.setDate(cDate.getDate());
          eDate.setDate(eDate.getDate() + guestSummary.los);
          guestSummary.checkindate = cDate;
          guestSummary.checkoutdate = eDate;
          // Here set the query param checking date also
          queryParams[QUERY_PARAM_ATTRIBUTES.CHECKINDATE] = this.formateDate(
            cDate
          );
          isvalidParam = false;
        } else {
          guestSummary.checkindate = new Date(
            dateTokens[0],
            dateTokens[1],
            dateTokens[2],
            0,
            0,
            0
          );
          guestSummary.checkoutdate = new Date(
            dateTokens[0],
            dateTokens[1],
            dateTokens[2],
            0,
            0,
            0
          );
          guestSummary.checkoutdate.setDate(
            guestSummary.checkindate.getDate() + guestSummary.los
          );
          queryParams[QUERY_PARAM_ATTRIBUTES.CHECKINDATE] = this.formateDate(
            guestSummary.checkindate
          );
        }
      }

      if (
        queryParams[QUERY_PARAM_ATTRIBUTES.ROOMS] !== undefined &&
        !/^\d+$/.test(queryParams[QUERY_PARAM_ATTRIBUTES.ROOMS])
      ) {
        queryParams[QUERY_PARAM_ATTRIBUTES.ROOMS] =
          RATE_CALENDAR_SETTINGS.MIN_ROOMS_ALLOWED;
        isvalidParam = false;
      } else {
        if (
          Number(queryParams[QUERY_PARAM_ATTRIBUTES.ROOMS]) <
            RATE_CALENDAR_SETTINGS.MIN_ROOMS_ALLOWED ||
          Number(queryParams[QUERY_PARAM_ATTRIBUTES.ROOMS]) >
          rateCalendarConfigs.maxNoOfRoomsAllowed
        ) {
          queryParams[QUERY_PARAM_ATTRIBUTES.ROOMS] =
            RATE_CALENDAR_SETTINGS.MIN_ROOMS_ALLOWED;
          isvalidParam = false;
        }
      }

      //      SET - DEFAULT ADULTS/ CHILDREN IF PARAMS Adults/children are invalid
      if (Number(queryParams[QUERY_PARAM_ATTRIBUTES.ROOMS]) > 1) {
        // MultiRoom Booking
        for (let i = 0; i < Number(guestSummary.rooms); i++) {
          const adultsCountParam =
            queryParams[[QUERY_PARAM_ATTRIBUTES.ADULTS, i + 1].join("_")] ||
            rateCalendarConfigs.defualtAdults;
          const childrenCountParam =
            queryParams[[QUERY_PARAM_ATTRIBUTES.CHILDREN, i + 1].join("_")] ||
            rateCalendarConfigs.defaultChildren;
          if (!/^-?\d+(\.\d+)?$/.test(adultsCountParam)) {
            queryParams[[QUERY_PARAM_ATTRIBUTES.ADULTS, i + 1].join("_")] =
              rateCalendarConfigs.defualtAdults;
            isvalidParam = false;
          } else {
            const totalOccupancyPerRoom =
              Number(adultsCountParam) + Number(childrenCountParam);
            if (
              Number(adultsCountParam) < rateCalendarConfigs.minAdults ||
              Number(adultsCountParam) > rateCalendarConfigs.maxAdults ||
              totalOccupancyPerRoom > rateCalendarConfigs.maxOccupancy
            ) {
              queryParams[[QUERY_PARAM_ATTRIBUTES.ADULTS, i + 1].join("_")] =
                rateCalendarConfigs.defualtAdults;
              isvalidParam = false;
            }
          }

          if (!/^-?\d+(\.\d+)?$/.test(childrenCountParam)) {
            queryParams[[QUERY_PARAM_ATTRIBUTES.CHILDREN, i + 1].join("_")] =
              rateCalendarConfigs.defaultChildren;
            isvalidParam = false;
          } else {
            const totalOccupancyPerRoom =
              Number(adultsCountParam) + Number(childrenCountParam);
            if (
              Number(childrenCountParam) < rateCalendarConfigs.minChildren ||
              Number(childrenCountParam) > rateCalendarConfigs.maxChildren ||
              totalOccupancyPerRoom > rateCalendarConfigs.maxOccupancy
            ) {
              queryParams[[QUERY_PARAM_ATTRIBUTES.CHILDREN, i + 1].join("_")] =
                rateCalendarConfigs.defaultChildren;
              isvalidParam = false;
            }
          }
        }
        // End of MultiRoom
      } else if (Number(queryParams[QUERY_PARAM_ATTRIBUTES.ROOMS]) === 1) {
        // Single Room Booking
        const adultsCountParam =
          queryParams[QUERY_PARAM_ATTRIBUTES.ADULTS] ||
          rateCalendarConfigs.defualtAdults;
        const childrenCountParam =
          queryParams[QUERY_PARAM_ATTRIBUTES.CHILDREN] ||
          rateCalendarConfigs.defaultChildren;
        const adultsCountParam_index =
          queryParams[[QUERY_PARAM_ATTRIBUTES.ADULTS, 1].join("_")] ||
          rateCalendarConfigs.defualtAdults;
        const childrenCountParam_index =
          queryParams[[QUERY_PARAM_ATTRIBUTES.CHILDREN, 1].join("_")] ||
          rateCalendarConfigs.defaultChildren;

        if (
          adultsCountParam !== undefined &&
          !/^-?\d+(\.\d+)?$/.test(adultsCountParam)
        ) {
          queryParams[QUERY_PARAM_ATTRIBUTES.ADULTS] =
            rateCalendarConfigs.defualtAdults;
          isvalidParam = false;
        } else {
          const totalOccupancyPerRoom =
            Number(adultsCountParam) + Number(childrenCountParam);
          if (
            Number(adultsCountParam) < rateCalendarConfigs.minAdults ||
            Number(adultsCountParam) > rateCalendarConfigs.maxAdults ||
            totalOccupancyPerRoom > rateCalendarConfigs.maxOccupancy
          ) {
            queryParams[QUERY_PARAM_ATTRIBUTES.ADULTS] =
              rateCalendarConfigs.defualtAdults;
            isvalidParam = false;
          }
        }

        if (
          childrenCountParam !== undefined &&
          !/^-?\d+(\.\d+)?$/.test(childrenCountParam)
        ) {
          queryParams[QUERY_PARAM_ATTRIBUTES.CHILDREN] =
            rateCalendarConfigs.defaultChildren;
          isvalidParam = false;
        } else {
          const totalOccupancyPerRoom =
            Number(adultsCountParam) + Number(childrenCountParam);
          if (
            Number(childrenCountParam) < rateCalendarConfigs.minChildren ||
            Number(childrenCountParam) > rateCalendarConfigs.maxChildren ||
            totalOccupancyPerRoom > rateCalendarConfigs.maxOccupancy
          ) {
            queryParams[QUERY_PARAM_ATTRIBUTES.CHILDREN] =
              rateCalendarConfigs.defaultChildren;
            isvalidParam = false;
          }
        }
        if (
          adultsCountParam_index !== undefined &&
          !/^-?\d+(\.\d+)?$/.test(
            queryParams[[QUERY_PARAM_ATTRIBUTES.ADULTS, 1].join("_")]
          )
        ) {
          queryParams[[QUERY_PARAM_ATTRIBUTES.ADULTS, 1].join("_")] =
            rateCalendarConfigs.defualtAdults;
          isvalidParam = false;
        } else {
          const totalOccupancyPerRoom_Index =
            Number(adultsCountParam_index) + Number(childrenCountParam_index);
          if (
            Number(adultsCountParam_index) < rateCalendarConfigs.minAdults ||
            Number(adultsCountParam_index) > rateCalendarConfigs.maxAdults ||
            totalOccupancyPerRoom_Index > rateCalendarConfigs.maxOccupancy
          ) {
            queryParams[[QUERY_PARAM_ATTRIBUTES.ADULTS, 1].join("_")] =
              rateCalendarConfigs.defualtAdults;
            isvalidParam = false;
          }
        }

        if (
          childrenCountParam_index !== undefined &&
          !/^-?\d+(\.\d+)?$/.test(childrenCountParam_index)
        ) {
          queryParams[[QUERY_PARAM_ATTRIBUTES.CHILDREN, 1].join("_")] =
            rateCalendarConfigs.defaultChildren;
          isvalidParam = false;
        } else {
          const totalOccupancyPerRoom_Index =
            Number(adultsCountParam_index) + Number(childrenCountParam_index);
          if (
            Number(childrenCountParam_index) <
              rateCalendarConfigs.minChildren ||
            Number(childrenCountParam_index) >
              rateCalendarConfigs.maxChildren ||
            totalOccupancyPerRoom_Index > rateCalendarConfigs.maxOccupancy
          ) {
            queryParams[[QUERY_PARAM_ATTRIBUTES.CHILDREN, 1].join("_")] =
              rateCalendarConfigs.defaultChildren;
            isvalidParam = false;
          }
        }
      }
      if (queryParams[QUERY_PARAM_ATTRIBUTES.CURRENCY]) {
        guestSummary.currency = queryParams[QUERY_PARAM_ATTRIBUTES.CURRENCY];
      }
      if (queryParams[QUERY_PARAM_ATTRIBUTES.LOCALE]) {
        guestSummary.locale = queryParams[QUERY_PARAM_ATTRIBUTES.LOCALE];
      }

      guestSummary.rooms = queryParams[QUERY_PARAM_ATTRIBUTES.ROOMS];
      if (guestSummary.rooms > 1) {
        for (let i = 0; i < Number(guestSummary.rooms); i++) {
          const adults = Number(
            queryParams[[QUERY_PARAM_ATTRIBUTES.ADULTS, i + 1].join("_")] ||
              rateCalendarConfigs.defualtAdults
          );
          const children = Number(
            queryParams[[QUERY_PARAM_ATTRIBUTES.CHILDREN, i + 1].join("_")] ||
              rateCalendarConfigs.defaultChildren
          );
          guestSummary.guests[i] = new Guests(adults, children);
        }
      } else {
        const adults = Number(
          queryParams[QUERY_PARAM_ATTRIBUTES.ADULTS] ||
            queryParams[QUERY_PARAM_ATTRIBUTES.ADULTS + "_1"] ||
            rateCalendarConfigs.defualtAdults
        );
        const children = Number(
          queryParams[QUERY_PARAM_ATTRIBUTES.CHILDREN] ||
            queryParams[QUERY_PARAM_ATTRIBUTES.CHILDREN + "_1"] ||
            rateCalendarConfigs.defaultChildren
        );
        guestSummary.guests[0].adults = adults;
        guestSummary.guests[0].children = children;
      }
    } else {
      isCheckInDateExists = false;
      isvalidParam = false;
      // If Not valid set the CHECKING DATE to Current Date
      cDate.setDate(cDate.getDate());
      eDate.setDate(eDate.getDate() + guestSummary.los);
      guestSummary.checkindate = cDate;
      guestSummary.checkoutdate = eDate;
      queryParams[QUERY_PARAM_ATTRIBUTES.CHECKINDATE] = this.formateDate(cDate);
      // return false;
    }
    return {
      checkinSummary: guestSummary,
      isvalidParam,
      queryParams,
      isCheckInDateExists,
    };
  }

  public static consolidateRatePlansforMultiRoom(
    availRatePlans: AvailableRoomRatePlans,
    roomsCount: number,
    guestSummary: ICheckinSummary,
    _storeSvc: StoreService
  ): Map<string, any> {
    const result = {};
    const data = _.get(availRatePlans, "data");
    const rateplanVsRoomDetailsMap = new Map<any, any>();
    if (roomsCount !== _.size(data)) {
      return rateplanVsRoomDetailsMap;
    }
    const ratePlanCodes = {};
    if (_.size(data) > 0 && _.size(data[0]["availableRatePlans"]) > 0) {
      const availableRatePlans = data[0]["availableRatePlans"];
      _.forEach(availableRatePlans, (ratePlan) => {
        result[ratePlan.code] = { rooms: [] };
        for (let ind = 0; ind < roomsCount; ind++) {
          result[ratePlan.code]["rooms"][ind] = [];
        }
        const totalPrice = {};
        const totalAddOnPrice = {};
        let i = 1;
        _.forEach(data, (roomRatePlan) => {
          const roomDetails = Object.create(null);
          roomDetails.bedTypeName = roomRatePlan.bedTypeName;
          roomDetails.bedTypeCode = roomRatePlan.bedTypeCode;
          roomDetails.bedTypeImageUrl = roomRatePlan.bedTypeImageUrl;
          roomDetails.roomCode = roomRatePlan.roomCode;
          roomDetails.roomName = roomRatePlan.roomName;
          roomDetails.roomSeqNo = roomRatePlan.roomSeqNo || i;
          roomDetails.guests = guestSummary.guests[roomDetails.roomSeqNo - 1];
          const currency = _storeSvc.getBasketState().CurrencyCode;
          _.forEach(roomRatePlan.availableRatePlans, (rp) => {
            if (rp.code === ratePlan.code) {
              const RateplanDetails = Object.create(null);
              RateplanDetails.name = rp.name;
              RateplanDetails.code = rp.code;
              RateplanDetails.cancellationPolicy = rp.cancellationPolicy;
              RateplanDetails.rateplanComments = rp.rateplanComments;
              RateplanDetails.noCancellationDate = rp.noCancellationDate;
              RateplanDetails.description = rp.description;
              if (rp.directbill !== undefined) {
                RateplanDetails.directbill = rp.directbill;
              }

              roomDetails.ratePlan = rp;
              roomDetails.ratePlan.searchTransactionId =
                roomRatePlan["searchTransactionId"];
              roomDetails.ratePlan.marketingConsent =
                roomRatePlan["marketingConsent"];
              RateplanDetails.averagePriceByCurrency =
                rp.averagePriceByCurrency;
              RateplanDetails.averagePriceByCurrency[currency] = Number(
                this.formattedPrice(
                  RateplanDetails.averagePriceByCurrency[currency],
                  currency,
                  _storeSvc
                )
              );
// start -- stay rates
              RateplanDetails.totalPriceByCurrency =
                rp.totalPriceByCurrency;
                RateplanDetails.totalPriceByCurrency[currency] = Number(
                  this.formattedPrice(
                    RateplanDetails.totalPriceByCurrency[currency],
                    currency,
                    _storeSvc
                  )
                );
              RateplanDetails.totalDiscountedPriceByCurrency =
                rp.totalDiscountedPriceByCurrency;
// end -- stay rates
              RateplanDetails.discountedAveragePriceByCurrency =
                rp.discountedAveragePriceByCurrency;
              RateplanDetails.taxesAndServiceChargesByCurrency =
                rp.taxesAndServiceChargesByCurrency;
              RateplanDetails.nightlyPrices = rp.nightlyPrices;
              RateplanDetails.addOnInfo = rp.addOnInfo;
              ratePlanCodes[ratePlan.code] = ratePlanCodes[ratePlan.code]
                ? ratePlanCodes[ratePlan.code] + 1
                : 1;
// showAverageNightlyRate - portal setting based price selection
              const showAverageNightlyRate = _storeSvc.getShowAvgNightlyRateConfig();
              const ratePlanPrice = showAverageNightlyRate ? rp.averagePriceByCurrency : rp.totalPriceByCurrency;

              _.forEach(ratePlanPrice, (v, k) => {
                if (showAverageNightlyRate) {
                  totalPrice[k] = totalPrice[k]
                  ? totalPrice[k] +
                    (rp.discountedAveragePriceByCurrency[k] || v)
                  : rp.discountedAveragePriceByCurrency[k] || v;
                } else {
                  totalPrice[k] = totalPrice[k]
                  ? totalPrice[k] +
                    (rp.totalDiscountedPriceByCurrency[k] || v)
                  : rp.totalDiscountedPriceByCurrency[k] || v;
                }

                totalPrice[k] = Number(
                  this.formattedPrice(totalPrice[k], currency, _storeSvc)
                );
                const lowestUnitAddonPrice = Number(
                  this.formattedPrice(
                    rp.lowestUnitAddOnPrice[k] || 0,
                    currency,
                    _storeSvc
                  )
                );
                const unitAddonPrice =
                  lowestUnitAddonPrice *
                  ((roomDetails.guests.adults + roomDetails.guests.children) /
                    guestSummary.los);
                const formattedUnitPrice = Number(
                  this.formattedPrice(unitAddonPrice, currency, _storeSvc)
                );
                totalAddOnPrice[k] =
                  (totalAddOnPrice[k] || 0) + formattedUnitPrice;
                totalAddOnPrice[k] = Number(
                  this.formattedPrice(totalAddOnPrice[k], currency, _storeSvc)
                );
              });
              RateplanDetails.totalPrice = totalPrice;
              RateplanDetails.totalAddOnPrice = totalAddOnPrice;
              result[ratePlan.code]["ratePlan"] = RateplanDetails;
            }
          });
          result[ratePlan.code]["rooms"][
            roomDetails.roomSeqNo - 1
          ] = roomDetails;
          i++;
        });
      });
    }
    _.forEach(ratePlanCodes, (val, key) => {
      if (val === _.size(data)) {
        rateplanVsRoomDetailsMap.set(key, result[key]);
      }
    });
    return rateplanVsRoomDetailsMap;
  }

  public static getLangObjfromPropertyInfo(
    propertyInfo: PropertyInfo,
    locale: string
  ) {
    let lang = new LangObj("en", "English");
    _.forEach(propertyInfo.supportedLanguages, (val: LangObj) => {
      if (val.code === locale) {
        lang = val;
        return;
      }
    });
    return lang;
  }

  public static getCurrencyObjfromPropertyInfo(
    propertyInfo: PropertyInfo,
    currCode: string
  ) {
    let cur = new Currency("S$", "Singapore Dollar", "SGD");
    _.forEach(propertyInfo.supportedCurrencies, (val: Currency) => {
      if (val.code === currCode) {
        cur = val;
        return;
      }
    });
    return cur;
  }

  public static getGuestDetailsString(objCheckin: CheckinSummary, localeObj) {
    const res = new Array<string>();
    let index = 0;
    let adults = 0,
      child = 0;
    let str = "",
      str1 = "";
    objCheckin.guests.forEach((element) => {
      adults = element.adults;
      child = element.children;
      str = "";
      str1 = "";
      if (adults > 1) {
        str =
          adults +
            " " +
            _.get(localeObj, "tf_4_Checkout_checkoutSummery_adults") ||
          "Adults";
      } else {
        str =
          adults + " " + _.get(localeObj, "tf_1_Calendar_rateCalender_adult") ||
          "Adult";
      }
      if (child > 1) {
        str1 =
          (_.get(localeObj, "tf_3_MultiRoom_packageListing_comma") || ",") +
            " " +
            child +
            " " +
            _.get(localeObj, "tf_1_Calendar_rateCalender_children") ||
          "Children";
      } else if (Number(child) === 1) {
        str1 =
          (_.get(localeObj, "tf_3_MultiRoom_packageListing_comma") || ",") +
            " " +
            child +
            " " +
            _.get(localeObj, "tf_1_Calendar_rateCalender_child") || "Child";
      }
      res[index++] = str + str1;
    });
    return res;
  }

  /* returns error message to be displayed when email id is null or of incorrect format.
    returns null if email ID is not null and of correct format
  */
  public static isEmailValid(emailID: string) {
    if (emailID === "" || emailID === null || emailID === undefined) {
      // this.isMailValid = false;
      return "email_empty_error";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailID)) {
      return "email_wrong_error";
      // this.isMailValid = false;
    } else {
      // this.isMailValid = true;
      // this.isSubmitButtonVisible= true;
      return null;
    }
  }
  
  public static getTranlatedDateLabels(dateStr: any, localeObj: any){
    let month = "";
    let day = "";
    let formattedStr = "";
    let monthFound = false;
    let dayFound = false;
    for (let index = 0; index < dateStr.length; index++) {
      if (dateStr[index] === "-" && !monthFound) {
        month = dateStr.substring(
          dateStr.indexOf("-") + 1, 
          dateStr.lastIndexOf("-")
      );
        if(month.length === 1){
          month = 0+month;
        }
        monthFound = true;
      }
    else if (dateStr[index] === "-" && monthFound && !dayFound) {
      day = "" + dateStr[index + 1] + (dateStr[index + 2] || '');
      dayFound = true;
    }  
  }
    switch (month) {
      case "01":
        formattedStr = localeObj.tf_1_Calendar_Month_Jan + " " + day;
        break;
      case "02":
        formattedStr = localeObj.tf_1_Calendar_Month_Feb + " " + day;
        break;
      case "03":
        formattedStr = localeObj.tf_1_Calendar_Month_Mar + " " + day;
        break;
      case "04":
        formattedStr = localeObj.tf_1_Calendar_Month_Apr + " " + day;
        break;
      case "05":
        formattedStr = localeObj.tf_1_Calendar_Month_May + " " + day;
        break;
      case "06":
        formattedStr = localeObj.tf_1_Calendar_Month_Jun + " " + day;
        break;
      case "07":
        formattedStr = localeObj.tf_1_Calendar_Month_Jul + " " + day;
        break;
      case "08":
        formattedStr = localeObj.tf_1_Calendar_Month_Aug + " " + day;
        break;
      case "09":
        formattedStr = localeObj.tf_1_Calendar_Month_Sep + " " + day;
        break;
      case "10":
        formattedStr = localeObj.tf_1_Calendar_Month_Oct + " " + day;
        break;
      case "11":
        formattedStr = localeObj.tf_1_Calendar_Month_Nov + " " + day;
        break;
      case "12":
        formattedStr = localeObj.tf_1_Calendar_Month_Dec + " " + day;
        break;
    }
    return formattedStr;
  }
  public static getTranslatedDate(dateStr: string, localeObj: any) {
    if (dateStr && _.size(dateStr) >= 6) {
      const MONTH = dateStr.substr(3, 3);
      dateStr = _.replace(dateStr, MONTH, localeObj[MONTH]);
      return dateStr;
    } else {
      return dateStr;
    }
  }

  public static getTransformedDate(dateStr: string, localeObj: any) {
    if (dateStr === undefined || dateStr === null || dateStr === "") {
      return "";
    }
    let monthFound = false;
    let dayFound = false;
    let hoursFound = false;
    let minutesFound = false;
    let year = "";
    let month = "";
    let day = "";
    let hours = "";
    let minutes = "";
    let formattedStr = "";
    for (let index = 0; index < dateStr.length; index++) {
      if (index < 4) {
        year = year + dateStr[index];
      } else if (dateStr[index] === "-" && !monthFound) {
        month = "" + dateStr[index + 1] + dateStr[index + 2];
        monthFound = true;
      } else if (dateStr[index] === "-" && monthFound && !dayFound) {
        day = "" + dateStr[index + 1] + dateStr[index + 2];
        dayFound = true;
      } else if (dateStr[index] === " " && !hoursFound) {
        hours = "" + dateStr[index + 1] + dateStr[index + 2];
        hoursFound = true;
      } else if (dateStr[index] === ":" && !minutesFound) {
        minutes = "" + dateStr[index + 1] + dateStr[index + 2];
        minutesFound = true;
      }
    }
    if (monthFound && dayFound && hoursFound && minutesFound) {
      formattedStr = "" + day + " ";
      switch (month) {
        case "01":
          formattedStr = formattedStr + "Jan ";
          break;
        case "02":
          formattedStr = formattedStr + "Feb ";
          break;
        case "03":
          formattedStr = formattedStr + "Mar ";
          break;
        case "04":
          formattedStr = formattedStr + "Apr ";
          break;
        case "05":
          formattedStr = formattedStr + "May ";
          break;
        case "06":
          formattedStr = formattedStr + "Jun ";
          break;
        case "07":
          formattedStr = formattedStr + "Jul ";
          break;
        case "08":
          formattedStr = formattedStr + "Aug ";
          break;
        case "09":
          formattedStr = formattedStr + "Sep ";
          break;
        case "10":
          formattedStr = formattedStr + "Oct ";
          break;
        case "11":
          formattedStr = formattedStr + "Nov ";
          break;
        case "12":
          formattedStr = formattedStr + "Dec ";
          break;
      }
      formattedStr = formattedStr + year + ", ";
      let am_pm = "AM";
      if (Number(hours) > 12) {
        am_pm = "PM";
        hours = (Number(hours) - 12).toString();
      }
      formattedStr = formattedStr + hours + ":" + minutes + " " + am_pm;
      formattedStr = this.getTranslatedDate(formattedStr, localeObj);
      return formattedStr;
    } else {
      return dateStr;
    }
  }

  public static getTranslatedDateForLangCode(dateStr: string, localeObj: any) {
    let date = dateStr.substr(0, 2);
    let year = dateStr.substr(8, 4);
    let month = dateStr.substr(3, 3);
    year = localeObj[year] ? localeObj[year] : year;
    month = localeObj[month] ? localeObj[month] : month;
    date = localeObj[date] ? localeObj[date] : date;

    const dateResult = year.concat(" ", month, " ", date);
    return dateResult;
  }

  public static fillMessage(str: string, params: string[]) {
    let index = 1;
    _.forEach(params, (param) => {
      const paramID = ["{{\\$", index, "}}"].join("");
      str = _.replace(str, new RegExp(paramID, "g"), param);
      index++;
    });
    return str;
  }

  public static toggleTooltip(event, popover, target_id) {
    if (event.target.id === target_id) {
      popover.toggle();
    } else {
      popover.hide();
    }
  }

  public static ifPayAndStay(guaranteePercentage: number) {
    if (guaranteePercentage === 100) {
      return true;
    }
    return false;
  }

  public static getStringForCount(
    count: number,
    singularstr: string,
    pluralstr: string
  ) {
    return count > 1 ? pluralstr : singularstr;
  }

  public static getTranslatedDateStr(date: Date, localeObj: any) {
    return CommonUtility.fillMessage(
      localeObj.tf_5_Confirmation_bookingInfo_dateStr,
      [
        localeObj[MONTHS_MAP[date.getMonth() + 1]],
        date.getDate(),
        date.getFullYear(),
      ]
    );
  }

  public static getTransformedDateFromDateStr(dateStr: string, localeObj: any) {
    const tokens = dateStr.split(" ");
    let date, time, date_tokens, time_tokens;
    if (tokens.length === 1) {
      date = tokens[0];
    }
    if (tokens.length > 1) {
      date = tokens[0];
      time = tokens[1];
    }
    if (date) {
      date_tokens = date.split("-");
    }
    if (time) {
      time_tokens = time.split(":");
    }
    if (date_tokens.length === 3 && time_tokens.length === 2) {
      return CommonUtility.fillMessage(localeObj.tf_date_time_str, [
        localeObj[MONTHS_MAP[Number(date_tokens[1])]],
        date_tokens[2],
        date_tokens[0],
        Number(time_tokens[0]) % 12,
        time_tokens[1],
        Number(time_tokens[0]) < 12
          ? localeObj.tf_Generic_AM
          : localeObj.tf_Generic_PM,
      ]);
    } else {
      return dateStr;
    }
  }

  public static checkForMPGSCardType(card: string) {
    if (
      card === PAYMENT_CARD_TYPE.AMEX ||
      card === PAYMENT_CARD_TYPE.AMEX_MANUAL ||
      card === PAYMENT_CARD_TYPE.AMEX_ONLINE ||
      card === PAYMENT_CARD_TYPE.MASTER_CARD ||
      card === PAYMENT_CARD_TYPE.MASTER_MANUAL ||
      card === PAYMENT_CARD_TYPE.MASTER_ONLINE ||
      card === PAYMENT_CARD_TYPE.VISA ||
      card === PAYMENT_CARD_TYPE.VISA_MANUAL ||
      card === PAYMENT_CARD_TYPE.VISA_ONLINE
    ) {
      return true;
    }
    return false;
  }

  public static getCalYearMonthDatefromString(dateStr: string) {
    const tokens = dateStr.split("-");
    return [Number(tokens[0]), Number(tokens[1]) - 1, Number(tokens[2])];
  }

  public static compareDates(firstDate: Date, secondDate: Date) {
    if (firstDate.getFullYear() < secondDate.getFullYear()) {
      return -1;
    } else if (firstDate.getFullYear() === secondDate.getFullYear()) {
      if (firstDate.getMonth() < secondDate.getMonth()) {
        return -1;
      } else if (
        firstDate.getMonth() === secondDate.getMonth() &&
        firstDate.getDate() < secondDate.getDate()
      ) {
        return -1;
      } else if (
        firstDate.getMonth() === secondDate.getMonth() &&
        firstDate.getDate() === secondDate.getDate()
      ) {
        return 0;
      }
    }
    return 1;
  }

  public static setDateValue(year: number, month: number, date: number) {
    const dateToSet = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      new Date().getDate(),
      0,
      0,
      0,
      0
    );
    dateToSet.setDate(1);
    dateToSet.setFullYear(year);
    dateToSet.setMonth(month);
    dateToSet.setDate(date);
    return dateToSet;
  }

  public static getUTCFromDate(date: Date) {
    date = new Date(date);
    return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  }

  public static getUTCDiffDays(startDate: Date, endDate: Date) {
    const endDateUTC = this.getUTCFromDate(endDate);
    const startDateUTC = this.getUTCFromDate(startDate);
    const timeDiff = Math.abs(endDateUTC - startDateUTC);
    return Math.round(timeDiff / DAY_MILLIS);
  }

  public static getCurrentDateFromPropertyTimeZone(
    propertyTimeZoneOffset?: number
  ) {
    const returnDate = new Date();
    if (
      propertyTimeZoneOffset === undefined ||
      propertyTimeZoneOffset === null
    ) {
      return returnDate;
    }
    returnDate.setTime(
      returnDate.getTime() +
        (propertyTimeZoneOffset * 60000 +
          returnDate.getTimezoneOffset() * 60000)
    );
    return returnDate;
  }

  public static removeClassFromElement(className: string) {
    const elementsList = document.querySelectorAll("." + className);
    for (let index = 0; index < elementsList.length; index++) {
      elementsList[index].classList.remove(className);
    }
  }

  public static isMultiRoom(roomLength: number) {
    if (roomLength > 1) {
      return true;
    } else {
      return false;
    }
  }

  public static removeSubscriptions(subscriptionsList: any) {
    if (
      subscriptionsList !== undefined &&
      subscriptionsList !== null &&
      subscriptionsList.length > 0
    ) {
      subscriptionsList.forEach((subscription) => {
        if (subscription !== undefined && subscription !== null) {
          subscription.unsubscribe();
        }
      });
    }
  }

  // public static setDecimalToFixed(priceValue) {
  //     return priceValue.toFixed(2);
  // }

  // method to return rounded value
  public static roundedValue(value, decimals) {
    return Number(
      Math.round(Number(value + "e+" + decimals)) + "e-" + decimals
    );
  }

  /**
   * Returns the current page name
   */

  public static getPageName() {
    const currentPath = location.pathname.replace(/[^\w\s]/gi, "");
    if (currentPath === "search" || currentPath === "") {
      return "home";
    } else if (currentPath === "guestCreditCardInfo") {
      return "guestInfo";
    } else {
      return currentPath;
    }
  }

  /**
   * Set/update global datalayer = window["rt4Datalayer"];.
   * @param data: Contains an object with key value pairs
   * The data is appended to rt4Datalayer.rt4Datalayer
   * Any existing keys' data will be updated
   * New keys will be inserted
   */

  public static setDatalayer(data: any, storeSvc?: StoreService) {
    try {
      let datalayer = window["rt4Datalayer"];
      if (!datalayer) {
        datalayer = {};
      }

      if (storeSvc) {
        const settings = storeSvc.getUserSettingsState();
        const numRooms = storeSvc.getBasketState().Rooms.length || 1;
        const storeData = {
          rtPROPERTYCODE: settings.propertyInfo.propertyCode,
          rtPROPERTYNAME: settings.propertyInfo.propertyName,
          rtLOCALE: settings.langObj.name,
          rtPAGENAME: this.getPageName(),
          rtNUMROOMS: numRooms,
          currency: storeSvc.getBasketState().CurrencyCode,
          rt4ACCESSCODE: storeSvc.getBasketState().promoData.accessCode || null,
          rt4OFFERCODE: storeSvc.getBasketState().offerCode || null,
          rt4IATACODE: storeSvc.getUserSettingsState().iata.iataNumber || null,
        };
        datalayer = { ...datalayer, ...storeData };
      }

      datalayer = { ...datalayer, ...data };
      window["rt4Datalayer"] = datalayer;
    } catch (e) {
      console.log("Error in setDataLayer", e);
    }
  }

  /**
   * Returns if an expected array from API is empty
   * @param list: the list/array to be checked.
   * @returns Boolean true if the array is empty or it is an empty object or ""
   */

  public static isAPIListEmpty(list: any) {
    return (
      !Array.isArray(list) ||
      !list.length ||
      list.length === 0 ||
      JSON.stringify(list) === JSON.stringify([{}])
    );
  }

  /**
   * TODO: Rename to portalname
   * Returns the subdomain/domain.
   * @returns return subdomain from environment if available otherwise return hostname removes www from the beginning of the hostname
   */

  public static getSubdomain() {
    return (
      environment.portal_subdomain || window.location.host.replace(/^www\./, "")
    );
  }

  public static getRateCalendarConfigs() {
    // const propertyInfo = JSON.parse(sessionStorage.getItem('propertyInfo'));
    let propertyInfo = {};
    if (JSON.parse(sessionStorage.getItem("storeState"))) {
      propertyInfo = JSON.parse(sessionStorage.getItem("storeState"))
        .userSettingsReducer.propertyInfo;
    }

    let defaultLOS = _.get(propertyInfo, "defaultLOS");
    let minLOS = _.get(propertyInfo, "minLOS");
    let maxLOS = _.get(propertyInfo, "maxLOS");
    let defualtAdults = _.get(propertyInfo, "defaultNoOfAdultsPerRoom");
    let defaultChildren = _.get(propertyInfo, "defaultNoOfChildrenPerRoom");
    let minAdults = _.get(propertyInfo, "minNoOfAdultsPerRoom");
    let minChildren = _.get(propertyInfo, "minNoOfChildrenPerRoom");
    let maxAdults = _.get(propertyInfo, "maxNoOfAdultsPerRoom");
    let maxChildren = _.get(propertyInfo, "maxNoOfChildrenPerRoom");
    let maxNoOfRoomsAllowed = _.get(propertyInfo, "maxNoOfRoomsBookable");
    let maxOccupancy = _.get(propertyInfo, "maximumOccupancyPerRoom");
    let maxCalendarRange = _.get(propertyInfo, "maxNoOfMonths");
    let minCalendarRange = _.get(propertyInfo, "minNoOfMonths");
    let maxLeadTime = _.get(propertyInfo, "maxLeadTime");

    if (maxLeadTime === undefined || maxLeadTime === null) {
      maxLeadTime = RATE_CALENDAR_SETTINGS.MAX_LEAD_TIME;
    }
    // SET - Max number of months to load on calendar
    if (maxCalendarRange === undefined || maxCalendarRange === null) {
      maxCalendarRange = RATE_CALENDAR_SETTINGS.MAX_CALENDAR_MONTHS_LOADED;
    }

    if (minCalendarRange === undefined || minCalendarRange === null) {
      minCalendarRange = RATE_CALENDAR_SETTINGS.MIN_CALENDAR_MONTHS_LOADED;
    }

    if (maxCalendarRange < minCalendarRange) {
      maxCalendarRange = minCalendarRange;
    }

    // SET - MIN / MAX / DEFAULT    LOS
    // MIN LOS
    if (minLOS === undefined || minLOS === null) {
      minLOS = RATE_CALENDAR_SETTINGS.MIN_LOS;
    }

    // MAX LOS
    if (maxLOS === undefined || maxLOS === null) {
      maxLOS = RATE_CALENDAR_SETTINGS.MAX_LOS;
    }

    // Default LOS
    if (defaultLOS === undefined || defaultLOS === null) {
      defaultLOS = RATE_CALENDAR_SETTINGS.DEFAULT_LOS;
    }

    // DEFUALT LOS should be inclusive of MIN LOS & MAX LOS
    if (defaultLOS < minLOS || defaultLOS > maxLOS) {
      defaultLOS = minLOS;
    }

    // MIN - Adults, Children
    if (minAdults === undefined || minAdults === null) {
      minAdults = RATE_CALENDAR_SETTINGS.MIN_ADULTS;
    }

    if (minChildren === undefined || minChildren === null) {
      minChildren = RATE_CALENDAR_SETTINGS.MIN_CHILDREN;
    }

    // Default - Adults, Children
    if (defualtAdults === undefined || defualtAdults === null) {
      defualtAdults = RATE_CALENDAR_SETTINGS.DEFAULT_ADULTS;
    }

    if (defaultChildren === undefined || defaultChildren === null) {
      defaultChildren = RATE_CALENDAR_SETTINGS.DEFAULT_CHILDREN;
    }

    // MAX ROOMS BOOKABLE
    if (maxNoOfRoomsAllowed === undefined || maxNoOfRoomsAllowed === null) {
      maxNoOfRoomsAllowed = RATE_CALENDAR_SETTINGS.MAX_ROOMS_ALLOWED;
    }

    // MAX -   Adults , MAX Children
    if (maxAdults === undefined || maxAdults === null) {
      maxAdults = RATE_CALENDAR_SETTINGS.MAX_ADULTS;
    }

    if (maxChildren === undefined || maxChildren === null) {
      maxChildren = RATE_CALENDAR_SETTINGS.MAX_CHILDREN;
    }

    // DEFUAL Adults, Child  condition
    if (defualtAdults < minAdults || defualtAdults > maxAdults) {
      defualtAdults = minAdults;
    }
    if (defaultChildren < minChildren || defaultChildren > maxChildren) {
      defaultChildren = minChildren;
    }

    // Max Occupency
    if (
      maxOccupancy === undefined ||
      maxOccupancy === null ||
      maxOccupancy < 0
    ) {
      maxOccupancy = RATE_CALENDAR_SETTINGS.MAX_OCCUPENCY_PER_ROOM;
    }

    const rateCalendarConfigs = {
      defaultLOS,
      minLOS,
      maxLOS,
      defualtAdults,
      defaultChildren,
      minAdults,
      minChildren,
      maxAdults,
      maxChildren,
      maxNoOfRoomsAllowed,
      maxOccupancy,
      maxCalendarRange,
      minCalendarRange,
      maxLeadTime,
    };

    return rateCalendarConfigs;
  }
  // method to return rounded value in offer listing page
  public static formattedPrice(value, currency, _storeSvc) {
    const formattedPrice = this.roundedValue(value, 2);
    return _storeSvc.applyPriceFormatPipe(formattedPrice, currency, true);
  }

  public static getGuestDetailsValidationSettings(propertyInfo?: any) {
    if (propertyInfo === undefined) {
      if (JSON.parse(sessionStorage.getItem("storeState"))) {
        propertyInfo = JSON.parse(sessionStorage.getItem("storeState"))
          .userSettingsReducer.propertyInfo;
      }
    }
    let displayTitle = _.get(propertyInfo, "displayTitle");
    let firstNameMaxLength = _.get(propertyInfo, "firstNameMaxLength");
    let lastNameMaxLength = _.get(propertyInfo, "lastNameMaxLength");
    let displayAddressLine1 = _.get(propertyInfo, "displayAddressLine1");
    let addressLine1MaxLength = _.get(propertyInfo, "addressLine1MaxLength");
    let displayAddressLine2 = _.get(propertyInfo, "displayAddressLine2");
    let addressLine2MaxLength = _.get(propertyInfo, "addressLine2MaxLength");
    let addressLine2Required = _.get(propertyInfo, "addressLine2Required");
    let displayState = _.get(propertyInfo, "displayState");
    let stateMaxLength = _.get(propertyInfo, "stateMaxLength");
    let stateRequired = _.get(propertyInfo, "stateRequired");
    let displayCity = _.get(propertyInfo, "displayCity");
    let cityMaxLength = _.get(propertyInfo, "cityMaxLength");
    let cityRequired = _.get(propertyInfo, "cityRequired");
    let displayZipcode = _.get(propertyInfo, "displayZipcode");
    let zipCodeMaxLength = _.get(propertyInfo, "zipCodeMaxLength");
    let zipCodeRequired = _.get(propertyInfo, "zipCodeRequired");
    let displayPhoneNumber = _.get(propertyInfo, "displayPhoneNumber");
    let phoneNumberMaxLength = _.get(propertyInfo, "phoneNumberMaxLength");
    let phoneNumberRequired = _.get(propertyInfo, "phoneNumberRequired");
    let emailMaxLength = _.get(propertyInfo, "emailMaxLength");

    if (displayTitle === null || displayTitle === undefined) {
      displayTitle = GUEST_INFO_FORM.DISPLAY_TITLE;
    }

    if (
      firstNameMaxLength === null ||
      firstNameMaxLength === 0 ||
      firstNameMaxLength === undefined
    ) {
      firstNameMaxLength = GUEST_INFO_FORM.FIRST_NAME_MAX_LENGTH;
    }

    if (
      lastNameMaxLength === null ||
      lastNameMaxLength === 0 ||
      lastNameMaxLength === undefined
    ) {
      lastNameMaxLength = GUEST_INFO_FORM.LAST_NAME_MAX_LENGTH;
    }

    if (displayAddressLine1 === null || displayAddressLine1 === undefined) {
      displayAddressLine1 = GUEST_INFO_FORM.DISPLAY_ADDRESS_LINE_1;
    }

    if (
      addressLine1MaxLength === null ||
      addressLine1MaxLength === 0 ||
      addressLine1MaxLength === undefined
    ) {
      addressLine1MaxLength = GUEST_INFO_FORM.ADDRESS_LINE_1_MAX_LENGTH;
    }

    if (displayAddressLine2 === null || displayAddressLine2 === undefined) {
      displayAddressLine2 = GUEST_INFO_FORM.DISPLAY_ADDRESS_LINE_2;
    }

    if (
      addressLine2MaxLength === null ||
      addressLine2MaxLength === 0 ||
      addressLine2MaxLength === undefined
    ) {
      addressLine2MaxLength = GUEST_INFO_FORM.ADDRESS_LINE_2_MAX_LENGTH;
    }

    if (addressLine2Required === null || addressLine2Required === undefined) {
      addressLine2Required = GUEST_INFO_FORM.ADDRESS_LINE_2_REQUIRED;
    }

    if (displayState === null || displayState === undefined) {
      displayState = GUEST_INFO_FORM.DISPLAY_STATE;
    }

    if (
      stateMaxLength === null ||
      stateMaxLength === 0 ||
      stateMaxLength === undefined
    ) {
      stateMaxLength = GUEST_INFO_FORM.STATE_MAX_LENGTH;
    }

    if (stateRequired === null || stateRequired === undefined) {
      stateRequired = GUEST_INFO_FORM.STATE_REQUIRED;
    }

    if (displayCity === null || displayCity === undefined) {
      displayCity = GUEST_INFO_FORM.DISPLAY_CITY;
    }

    if (
      cityMaxLength === null ||
      cityMaxLength === 0 ||
      cityMaxLength === undefined
    ) {
      cityMaxLength = GUEST_INFO_FORM.CITY_MAX_LENGTH;
    }

    if (cityRequired === null || cityRequired === undefined) {
      cityRequired = GUEST_INFO_FORM.CITY_REQUIRED;
    }

    if (displayZipcode === null || displayZipcode === undefined) {
      displayZipcode = GUEST_INFO_FORM.DISPLAY_ZIPCODE;
    }

    if (
      zipCodeMaxLength === null ||
      zipCodeMaxLength === 0 ||
      zipCodeMaxLength === undefined
    ) {
      zipCodeMaxLength = GUEST_INFO_FORM.ZIPCODE_MAX_LENGTH;
    }

    if (zipCodeRequired === null || zipCodeRequired === undefined) {
      zipCodeRequired = GUEST_INFO_FORM.ZIPCODE_REQUIRED;
    }

    if (displayPhoneNumber === null || displayPhoneNumber === undefined) {
      displayPhoneNumber = GUEST_INFO_FORM.DISPLAY_PHONE_NUMBER;
    }

    if (
      phoneNumberMaxLength === null ||
      phoneNumberMaxLength === 0 ||
      phoneNumberMaxLength === undefined
    ) {
      phoneNumberMaxLength = GUEST_INFO_FORM.PHONE_NUMBER_MAXLENGTH;
    }

    if (phoneNumberRequired === null || phoneNumberRequired === undefined) {
      phoneNumberRequired = GUEST_INFO_FORM.PHONE_NUMBER_REQUIRED;
    }

    if (
      emailMaxLength === null ||
      emailMaxLength === 0 ||
      emailMaxLength === undefined
    ) {
      emailMaxLength = GUEST_INFO_FORM.EMAIL_MAX_LENGTH;
    }

    return {
      displayTitle,
      firstNameMaxLength,
      lastNameMaxLength,
      displayAddressLine1,
      addressLine1MaxLength,
      displayAddressLine2,
      addressLine2MaxLength,
      addressLine2Required,
      displayState,
      stateMaxLength,
      stateRequired,
      displayCity,
      cityMaxLength,
      cityRequired,
      displayZipcode,
      zipCodeMaxLength,
      zipCodeRequired,
      displayPhoneNumber,
      phoneNumberMaxLength,
      phoneNumberRequired,
      emailMaxLength,
    };
  }

  // method to close pop-up header
  public static collapseMobileMenu() {
    const el = document.getElementById("innerMobileMenuButton");
    el.classList.add("collapsed");
    el.setAttribute("aria-expanded", "false");
    const grandParent = el.parentElement["parentElement"];
    grandParent["classList"].remove("collapse");
    grandParent["classList"].remove("show");
    grandParent["classList"].add("collapsing");
    setTimeout(() => {
      grandParent["classList"].remove("collapsing");
      grandParent["classList"].add("collapse");
    }, 300);
    const outerButton = document.getElementById("outerMobileMenuButton");
    outerButton["classList"].add("collapsed");
    outerButton.setAttribute("aria-expanded", "false");
  }

  // rtl lang check
  public static langAlignCheck(currentLang, FeatureFlags) {
    const RTL_LANG = ["he", "ar"];
    if (
      FeatureFlags.isFeatureEnabled("rtl") &&
      RTL_LANG.indexOf(currentLang) !== -1
    ) {
      return true;
    } else {
      return false;
    }
  }

  public static logToRollbar(localeObj, rollbar, errorCode) {
    // Do not proceed if rollbar is disabled for environment
    // if (!environment.enableRollbar) {
    //   return false;
    // }
    rollbar.configure({
      enabled: environment.enableRollbar,
      logLevel: "info",
      payload: {
        environment: environment.envType,
        context: environment.envName,
      },
    });
    rollbar.error(
      _.get(localeObj, error_code_prefix + errorCode) + " : " + errorCode
    );
  }

  //DropDown Navigation through keys
  public static navigateDropDown(e) {
    const dropDownId = e.currentTarget.parentElement.id;
    const dropDownList = document.querySelectorAll(`#${dropDownId} li`);
    const optionsList = Array.from(dropDownList);
    let currentLI = optionsList.indexOf(document.activeElement);
    let nextIndex = 0;
    const keyName = e.key;
    switch (keyName) {
      case "ArrowUp":
        nextIndex = currentLI > 0 ? --currentLI : 0;
        (optionsList[nextIndex] as HTMLElement)?.focus();
        break;
      case "ArrowDown":
        nextIndex =
          currentLI < optionsList.length - 1
            ? ++currentLI
            : optionsList.length - 1;
        (optionsList[nextIndex] as HTMLElement)?.focus();
        this.hideLangDropdown(currentLI, optionsList, e);
        break;
      case "Tab":
        this.hideLangDropdown(currentLI, optionsList, e);
        break;
    }
  }

  // To Do need to refractor
  public static hideLangDropdown(currentLI, optionsList, element) {
    if (currentLI === optionsList.length - 1) {
      document.getElementById("language-dropdown-id").classList.remove("show");
    }
  }

  public static focusOnModal(val) {
    document.addEventListener("keydown", function (e) {
      if (e.key === "Tab" && !!document.getElementById(val)) {
        const value = document
          .getElementById(val)
          .querySelectorAll('[tabindex]:not([tabindex="-1"])');
        const lastIndex = value[value.length - 1].id;
        if (document.activeElement.id === lastIndex) {
          document.getElementById(value[0].id).focus({ preventScroll: true });
        }
      }
    });
  }

  public static attributeFilter(roomList: any, filters: any, passVal: any) {
    const initialArray =[], roomsArr = [], filteredArr = [];
  
    if (!roomList) {
      return [];
    }

    if(!filters) {
      return roomList;
    }

    roomList.forEach((elem) => {
      filteredArr.push({"rooms": elem.name, "bedtype": elem.bedTypes.length});
    });

    filters.forEach((filter, filterIndex) => {
      roomList.forEach((room, roomIndex) => {
        room.bedTypes.forEach((bedType, BedTypeIndex) => {
          if(filter.selectionType === 'single') {
            if(!bedType.roomAttributes[filter.selectFilterName] && filter.selectedFilterValues !== passVal) {
              filteredArr[roomIndex].bedtype = filteredArr[roomIndex].bedtype - 1;
              if(filteredArr[roomIndex].bedtype === 0 && !roomsArr.includes(roomList[roomIndex].name)) {
                roomsArr.push(roomList[roomIndex].name);
              }
            } else if (bedType.roomAttributes[filter.selectFilterName] && filter.selectedFilterValues !== passVal) {
              const id = Object.values(filter.options).indexOf(filter.selectedFilterValues);
              if(id > -1) {
                const filterId = isNaN(+(Object.keys(filter.options)[id])) ? Object.keys(filter.options)[id] : +(Object.keys(filter.options)[id]);
                if(!bedType.roomAttributes[filter.selectFilterName].options.includes(filterId) && roomList[roomIndex].bedTypes.length > 0) {
                  filteredArr[roomIndex].bedtype = filteredArr[roomIndex].bedtype - 1;
                }
                if(filteredArr[roomIndex].bedtype === 0 && !roomsArr.includes(roomList[roomIndex].name)) {
                  roomsArr.push(roomList[roomIndex].name);
                }
              }
            }
          } else {
            if(!bedType.roomAttributes[filter.selectFilterName] && filter.selectedFilterValues !== passVal && filter.selectedFilterValues.length > 0) {
              filteredArr[roomIndex].bedtype = filteredArr[roomIndex].bedtype - 1;
              if(filteredArr[roomIndex].bedtype === 0 && !roomsArr.includes(roomList[roomIndex].name)) {
                roomsArr.push(roomList[roomIndex].name);
              }
            } else if (bedType.roomAttributes[filter.selectFilterName] && filter.selectedFilterValues !== passVal && filter.selectedFilterValues.length > 0) {
              const arr = [];
              filter.selectedFilterValues.forEach((elem) => {
                const id = Object.values(filter.options).indexOf(elem);
                if(id > -1) {
                  const filterId = isNaN(+(Object.keys(filter.options)[id])) ? Object.keys(filter.options)[id] : +(Object.keys(filter.options)[id]); 
                  arr.push(filterId);
                  // if(!bedType.roomAttributes[filter.selectFilterName].options.includes(filterId) && roomList[roomIndex].bedTypes.length > 0) {
                  //   filteredArr[roomIndex].bedtype = filteredArr[roomIndex].bedtype - 1;
                  // }
                  // if(filteredArr[roomIndex].bedtype === 0  && !roomsArr.includes(roomList[roomIndex].name)) {
                  //   roomsArr.push(roomList[roomIndex].name);
                  // }
                }
              });
              if(!arr.some(item => bedType.roomAttributes[filter.selectFilterName].options.includes(item))){
                filteredArr[roomIndex].bedtype = filteredArr[roomIndex].bedtype - 1;
              }
              if(filteredArr[roomIndex].bedtype === 0  && !roomsArr.includes(roomList[roomIndex].name)) {
                roomsArr.push(roomList[roomIndex].name);
              }
            }
          }
        });
      });
    });

    roomList.forEach((room, index) => {
      if(filteredArr[index].bedtype > 0) {
        initialArray.push(room);
      }
    });

    return initialArray;
  }
}
