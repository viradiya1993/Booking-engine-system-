import { Injectable } from "@angular/core";
import { environment } from "../../../environments/environment";
import { CommonUtility } from "../common.utility";
import { SESSION_URL_CONST } from "../urls.constants";
import { HttpWrapperService } from "./http-wrapper.service";
import { StoreService } from "./store.service";

@Injectable()
export class AppService {
  constructor(
    private _authHttp: HttpWrapperService,
    private _storeSvc: StoreService
  ) {}

  getLaunageJSON(locale: string, propertyCode?) {
    const params = {
      locale,
      propertyCode,
      portalSubdomain: CommonUtility.getSubdomain(),
      skipDefaultQueryParams: true,
    };
    return this._authHttp.get(SESSION_URL_CONST.GET_LANG_JSON, params);
  }

  getPropertInfo() {
    const params = {
      portalSubdomain: CommonUtility.getSubdomain(),
      propertyCode: this.getIsHotelSelected() ? this.getSelctedHotelID() : "",
      skipDefaultQueryParams: true,
      skipHeaderXAPIKey: true,
      rand: Math.floor(Math.random() * 1000000),
    };
    return this._authHttp.get(SESSION_URL_CONST.GET_PROP_INFO, params);
  }

  getIsHotelSelected() {
    let isHotelSelected = false;
    const userSettingsStateObject = this._storeSvc.getUserSettingsState();
    const multiPropertyInfo = userSettingsStateObject.multiPropertyInfo;
    if (!!userSettingsStateObject) {
      if (
        !userSettingsStateObject.propertyInfo.singlePropertyPortal &&
        multiPropertyInfo.isHotelSelected
      ) {
        isHotelSelected = true;
      } else {
        isHotelSelected = false;
      }
    } else {
      isHotelSelected = false;
    }
    return isHotelSelected;
  }

  getSelctedHotelID() {
    const userSettingsStateObject = this._storeSvc.getUserSettingsState();
    const multiPropertyInfo = userSettingsStateObject.multiPropertyInfo;
    return multiPropertyInfo.hotelCode ? multiPropertyInfo.hotelCode : "";
  }
}
