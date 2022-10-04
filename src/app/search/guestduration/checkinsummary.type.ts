import * as _ from "lodash";
import { environment } from "../../../environments/environment";
import { RATE_CALENDAR_SETTINGS } from "../../common/common.constants";
import { CommonUtility } from "../../common/common.utility";

export interface ICheckinSummary {
  rooms: number;
  checkindate: Date;
  checkoutdate: Date;
  los: number;
  guests: Guests[];
}

export class Guests {
  adults: number;
  children: number;

  constructor(adults: number, children: number) {
    this.children = children;
    this.adults = adults;
  }
}

export class CheckinSummary implements ICheckinSummary {
  rooms: number;
  guests: Guests[];
  checkindate: any;
  checkoutdate: any;
  los: number;
  currency: string;
  locale: string;
  restrictionFailed: boolean;

  constructor(propertyTimeZoneOffset?: number) {
    const storeState = JSON.parse(sessionStorage.getItem("storeState"));
    let propertyInfo = {};
    if (!!storeState) {
      propertyInfo = JSON.parse(sessionStorage.getItem("storeState"))
        .userSettingsReducer.propertyInfo;
    }

    let defaultLos = _.get(propertyInfo, "defaultLOS");
    let defaultAdults = _.get(propertyInfo, "defaultNoOfAdultsPerRoom");
    let defaultChildren = _.get(propertyInfo, "defaultNoOfChildrenPerRoom");
    let minLos = _.get(propertyInfo, "minLOS");
    let maxLos = _.get(propertyInfo, "maxLOS");
    let minAdults = _.get(propertyInfo, "minNoOfAdultsPerRoom");
    let minChildren = _.get(propertyInfo, "minNoOfChildrenPerRoom");
    let maxAdults = _.get(propertyInfo, "maxNoOfAdultsPerRoom");
    let maxChildren = _.get(propertyInfo, "maxNoOfChildrenPerRoom");

    // MIN LOS
    if (minLos === undefined || minLos === null) {
      minLos = RATE_CALENDAR_SETTINGS.MIN_LOS;
    }

    // MAX LOS
    if (maxLos === undefined || maxLos === null) {
      maxLos = RATE_CALENDAR_SETTINGS.MAX_LOS;
    }

    // Default LOS
    if (defaultLos === undefined || defaultLos === null) {
      defaultLos = RATE_CALENDAR_SETTINGS.DEFAULT_LOS;
    }

    // DEFUALT LOS should be inclusive of MIN LOS & MAX LOS
    if (defaultLos < minLos || defaultLos > maxLos) {
      defaultLos = minLos;
    }

    if (defaultAdults === undefined || defaultAdults === null) {
      defaultAdults = RATE_CALENDAR_SETTINGS.DEFAULT_ADULTS;
    }

    if (defaultChildren === undefined || defaultChildren === null) {
      defaultChildren = RATE_CALENDAR_SETTINGS.DEFAULT_CHILDREN;
    }

    if (minAdults === undefined || minAdults === null) {
      minAdults = RATE_CALENDAR_SETTINGS.MIN_ADULTS;
    }

    if (minChildren === undefined || minChildren === null) {
      minChildren = RATE_CALENDAR_SETTINGS.MIN_CHILDREN;
    }

    if (maxAdults === undefined || maxAdults === null) {
      maxAdults = RATE_CALENDAR_SETTINGS.MAX_ADULTS;
    }

    if (maxChildren === undefined || maxChildren === null) {
      maxChildren = RATE_CALENDAR_SETTINGS.MAX_CHILDREN;
    }

    if (defaultAdults < minAdults || defaultAdults > maxAdults) {
      defaultAdults = minAdults;
    }

    if (defaultChildren < minChildren || defaultChildren > maxChildren) {
      defaultChildren = minChildren;
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
    cDate.setDate(cDate.getDate());
    eDate.setDate(eDate.getDate() + defaultLos);
    this.checkindate = cDate;
    this.checkoutdate = eDate;
    this.los = defaultLos;
    this.guests = new Array<Guests>();
    this.guests[0] = new Guests(defaultAdults, defaultChildren);
    this.locale = "en";
    this.currency = "SGD";
    this.restrictionFailed = false;
  }
}
