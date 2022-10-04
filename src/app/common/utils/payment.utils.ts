import * as _ from "lodash";
import { PAYMENT_CARD_TYPE } from "../common.constants";
import { IBasketState } from "../store/reducers/basket.reducer";

export class PaymentUtils {
  public static updateLatestPricesInBasekt(
    data: any,
    basketState: IBasketState,
    curr: string,
    defCurr: string,
    errorCode: any
  ) {
    const basketRooms = basketState.Rooms;
    let latestData = _.get(data, "data.reservationDetails");
    const card_type = _.get(basketRooms[0].PaymentInfo, "cardType");
    let is_jcb_cup = false;
    if (
      card_type &&
      (card_type === PAYMENT_CARD_TYPE.JAPAN_CREDIT_BUREAU ||
        card_type === PAYMENT_CARD_TYPE.CHINA_UNION_PAY)
    ) {
      is_jcb_cup = true;
    }
    if (card_type === "" && basketState.ReservationID !== "") {
      const previous_card_type =
        basketState.ManageRoomBooking &&
        basketState.ManageRoomBooking.PaymentInfo &&
        basketState.ManageRoomBooking.PaymentInfo.cardType;
      if (
        previous_card_type &&
        (previous_card_type === PAYMENT_CARD_TYPE.JAPAN_CREDIT_BUREAU ||
          previous_card_type === PAYMENT_CARD_TYPE.CHINA_UNION_PAY)
      ) {
        is_jcb_cup = true;
      }
    }
    if (
      is_jcb_cup ||
      errorCode === 3012 ||
      errorCode === 6004 ||
      errorCode === 9002
    ) {
      latestData = _.get(data, "data");
    }
    latestData.forEach((resData) => {
      if (
        is_jcb_cup ||
        errorCode === 3012 ||
        errorCode === 6004 ||
        errorCode === 9002
      ) {
        resData = _.get(resData, "reservationDetails");
      }
      const taxObj = _.get(resData, "latestTaxesAndServiceChargesByCurrency");
      basketRooms[resData.roomIndex]["oldPricing"] = _.cloneDeep(
        basketRooms[resData.roomIndex]["Pricing"]
      );
      let testInd = 0;
      for (const key in taxObj) {
        if (taxObj.hasOwnProperty(key)) {
          testInd++;
        }
      }
      if (taxObj !== undefined && testInd !== 0) {
        basketRooms[
          resData.roomIndex
        ].RatePlan.taxesAndServiceChargesByCurrency = taxObj;
      }
      if(_.get(resData, "latestPretaxPriceByCurrency") &&
          _.get(resData, "latestPretaxPriceByCurrency") !== undefined &&
          _.get(resData, "latestPretaxPriceByCurrency").length !== 0) {
        basketRooms[resData.roomIndex].RatePlan.pretaxPriceByCurrency = _.get(resData, "latestPretaxPriceByCurrency");
      }
      if (
        _.get(resData, "latestNightlyPrices") !== undefined &&
        _.get(resData, "latestNightlyPrices").length !== 0
      ) {
        resData.latestNightlyPrices.forEach((nightlyPriceObj, index) => {
          basketRooms[resData.roomIndex].RatePlan.nightlyPrices[index] = 
            Object.assign(basketRooms[resData.roomIndex].RatePlan.nightlyPrices[
              index
            ], nightlyPriceObj);
        });
      }
      const addOnObj = _.get(resData, "latestAddonPrices");
      testInd = 0;
      let addOnKey;
      for (const key in addOnObj) {
        if (addOnObj.hasOwnProperty(key)) {
          addOnKey = key;
          testInd++;
        }
      }
      if (addOnObj !== undefined && testInd !== 0) {
        basketRooms[resData.roomIndex].Packages[0].Price =
          addOnObj[addOnKey].price[curr];
        basketRooms[resData.roomIndex].Packages[0].DefPrice =
          addOnObj[addOnKey].price[defCurr];
        basketRooms[resData.roomIndex].Packages[0].TotalPrice =
          addOnObj[addOnKey].price[curr] * resData.packages[0].count;
        basketRooms[resData.roomIndex].Packages[0].DefTotalPrice =
          addOnObj[addOnKey].price[defCurr] * resData.packages[0].count;
        basketRooms[resData.roomIndex].Packages[0].AddonPriceByCurrencyObj[
          curr
        ] = addOnObj[addOnKey].price[curr];
      }
    });
    return basketRooms;
  }
}
