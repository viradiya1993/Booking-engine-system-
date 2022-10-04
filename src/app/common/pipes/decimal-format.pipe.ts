import { DecimalPipe } from "@angular/common";
import { Pipe, PipeTransform } from "@angular/core";
import * as _ from "lodash";
import { CUSTOM_CURRENCY_FORMAT, PIPE_COSTANTS } from "../common.constants";

@Pipe({
  name: "customPriceFormat",
})
export class CustomPriceFormatPipe extends DecimalPipe
  implements PipeTransform {
  transform(
    value: any,
    format?: string,
    currencyCode?: string,
    locale?: any,
    args?: any
  ): any {
    let currencyFormat = "1.2-2";
    let seperator = ",";
    if (format !== undefined && format !== "") {
      currencyFormat = format;
    }
    if (
      currencyCode !== undefined &&
      CUSTOM_CURRENCY_FORMAT[currencyCode] !== undefined
    ) {
      if (
        _.get(CUSTOM_CURRENCY_FORMAT[currencyCode], "DECIMAL_FORMAT") !==
        undefined
      ) {
        currencyFormat = _.get(
          CUSTOM_CURRENCY_FORMAT[currencyCode],
          "DECIMAL_FORMAT"
        );
      }
      if (
        _.get(CUSTOM_CURRENCY_FORMAT[currencyCode], "SEPERATOR") !== undefined
      ) {
        seperator = _.get(CUSTOM_CURRENCY_FORMAT[currencyCode], "SEPERATOR");
      }
    }
    value = super.transform(value, currencyFormat);
    const tokens = value?.split(".");
    if (tokens !== undefined && tokens !== null && tokens.length > 1) {
      if (tokens[1].length === 1) {
        value = value + "0";
      }
    }
    if (seperator !== ",") {
      value = _.replace(value, new RegExp(",", "g"), seperator);
    }
    return value;
  }
}
