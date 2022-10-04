import * as _ from "lodash";
import { PAYMENT_CARD_TYPE } from "../common.constants";

export const MAX_CARD_EXPIRY_YERS = 10;

export class CardUtils {
  public static validateCard(cardNumber, cardType) {
    const regexs = this.getRegex(cardType);
    let flag = false;
    _.forEach(regexs, (regex) => {
      if (regex.test(cardNumber)) {
        flag = true;
      }
    });
    return flag;
  }

  public static getRegex(cardType) {
    switch (cardType) {
      case PAYMENT_CARD_TYPE.AMEX:
        return [/^(?:3[47][0-9]{13})$/];
      case PAYMENT_CARD_TYPE.VISA:
      case PAYMENT_CARD_TYPE.MASTER_CARD:
        return [/^(?:[0-9]{16})$/];
      // return [/^(?:4[0-9]{12}(?:[0-9]{3})?)$/, /^(?:5[1-5][0-9]{14})$/, /^(?:(:?22[2-9][1-9]|2[3-6][0-9]{2}|27[0-1][1-9]|2720)\d{12})$/];
      case PAYMENT_CARD_TYPE.JAPAN_CREDIT_BUREAU:
        return [/^(?:(?:352[8-9]|35[3-8][0-9])\d{12})$/];
      case PAYMENT_CARD_TYPE.CHINA_UNION_PAY:
        return [/^(?:62[0-9]{14})$/];
    }
    return undefined;
  }
}
