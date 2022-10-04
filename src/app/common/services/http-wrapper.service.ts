import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import * as _ from "lodash";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { ActivatedRoute } from "../../../../node_modules/@angular/router";
import { environment } from "../../../environments/environment";
import { SESSION_URL_CONST } from "../../common/urls.constants";
import { CommonUtility } from "../common.utility";
import { StoreService } from "./store.service";

@Injectable()
export class HttpWrapperService {
  isHotelSelected: boolean;

  constructor(
    private _http: HttpClient,
    private _router: ActivatedRoute,
    private _storeSvc: StoreService
  ) {
    this.isHotelSelected = false;
  }

  public get(URL: any, options?: any): Observable<any> {
    return this._http
      .get(this.getUrl(URL), {
        params: this.appendDefaultParams(options, URL.path),
        headers: this.getHeaders(options),
      })
      .pipe(map((response: Response) => response));
  }

  public post(URL: any, body: any, options?: any): Observable<any> {
    return this._http
      .post(this.getUrl(URL), body, {
        params: options,
        headers: this.getPostHeaders(options),
      })
      .pipe(map((response: Response) => response));
  }

  public put(URL: any, body: any, options?: any): Observable<any> {
    return this._http
      .put(this.getUrl(URL), body, {
        params: options,
        headers: this.getPutHeaders(options),
      })
      .pipe(map((response: Response) => response));
  }

  public head(URL: any, options?: HttpParams): Observable<any> {
    return this._http
      .head(this.getUrl(URL), { params: options })
      .pipe(map((response: Response) => response));
  }

  public getUrl(URL: any) {
    let prefix = environment.proxy_path_prefix;
    let path = "";
    if (URL && !URL.path) {
      path = URL;
    } else {
      path = URL.path;
    }
    if (URL && URL.proxy === false) {
      prefix = environment.path_prefix;
    }
    if (URL.path_suffix) {
      return [prefix, path, URL.path_suffix].join("/");
    } else {
      return [prefix, path].join("/");
    }
  }

  public appendDefaultParams(options?: any, apiCalled?: any) {
    options = options ? options : {};
    let selectedHotelCode = "";
    let selectedHotelPortalSubdomain = "";
    let replaceOldPropertyCode = false;
    let propertyCode = _.get(
      this._storeSvc.getUserSettingsState(),
      "propertyInfo.propertyCode"
    );

    propertyCode = !propertyCode? options.propertyCode : propertyCode;

    const ignoreAPIList = [
      SESSION_URL_CONST.GET_LANG_JSON,
      SESSION_URL_CONST.HEADER_MENU_ITEMS,
    ];
    if (!options.skipDefaultQueryParams) {
      const userSettingsStateObject = this._storeSvc.getUserSettingsState();
      const multiPropertyInfo = userSettingsStateObject.multiPropertyInfo;
      if (!!userSettingsStateObject) {
        if (
          !userSettingsStateObject.propertyInfo.singlePropertyPortal &&
          multiPropertyInfo.isHotelSelected
        ) {
          this.isHotelSelected = true;
        } else {
          this.isHotelSelected = false;
        }

        if (this.isHotelSelected) {
          selectedHotelCode = multiPropertyInfo.hotelCode;
          selectedHotelPortalSubdomain =
            multiPropertyInfo.hotelPortalSubdomain != null
              ? multiPropertyInfo.hotelPortalSubdomain
              : "";
          if (ignoreAPIList.includes(apiCalled)) {
            replaceOldPropertyCode = false;
          } else {
            replaceOldPropertyCode = true;
          }
        }
      }
      const paramLangCode = this._router.snapshot.paramMap.get("locale");
      options[SESSION_URL_CONST.LOCALE_PARAM] = "";
      if (
        paramLangCode !== undefined &&
        paramLangCode !== null &&
        paramLangCode.length > 0
      ) {
        options[SESSION_URL_CONST.LOCALE_PARAM] = paramLangCode;
      } else {
        options[SESSION_URL_CONST.LOCALE_PARAM] = _.get(
          this._storeSvc.getUserSettingsState(),
          "langObj.code"
        );
      }

      options[SESSION_URL_CONST.PROPERTY_CODE_PARAM] =
        this.isHotelSelected && replaceOldPropertyCode
          ? selectedHotelCode
          : propertyCode;

      options[SESSION_URL_CONST.PORTAL_SUBDOMAIN_PARAM] =
        this.isHotelSelected && replaceOldPropertyCode
          ? selectedHotelPortalSubdomain
          : CommonUtility.getSubdomain();

      options[SESSION_URL_CONST.DEVICETYPE_PARAM] = _.get(
        this._storeSvc.getUserSettingsState(),
        "deviceType"
      );
      if (
        _.get(
          this._storeSvc.getUserSettingsState(),
          "propertyInfo.clientIp"
        ) !== undefined
      ) {
        options[SESSION_URL_CONST.CLIENT_IP] = _.get(
          this._storeSvc.getUserSettingsState(),
          "propertyInfo.clientIp"
        );
      }
    } else {
      delete options.skipDefaultQueryParams;
    }
    // options[SESSION_URL_CONST.LOCALE_PARAM] = options[SESSION_URL_CONST.LOCALE_PARAM] || SESSION_URL_CONST.DEFAULT_LOCALE;
    options["buster"] = new Date().getTime();
    return options;
  }

  public getHeaders(options?: any) {
    options = options ? options : {};
    let header = {};
    const eventData = _.get(
      this._storeSvc.getUserSettingsState(),
      "propertyInfo.eventData"
    );
    if (!options.skipHeaderXAPIKey && eventData) {
      header = { "x-api-key": eventData };
    }
    delete options.skipHeaderXAPIKey;
    return header;
  }
  public getPostHeaders(options?: any) {
    options = options ? options : {};
    const header = {
      "Content-Type": "application/json",
    };
    const eventData = _.get(
      this._storeSvc.getUserSettingsState(),
      "propertyInfo.eventData"
    );
    if (!options.skipHeaderXAPIKey && eventData) {
      header["x-api-key"] = eventData;
    }
    delete options.skipHeaderXAPIKey;
    return header;
  }
  public getPutHeaders(options?: any) {
    options = options ? options : {};
    const header = {
      "Content-Type": "application/json",
    };
    const eventData = _.get(
      this._storeSvc.getUserSettingsState(),
      "propertyInfo.eventData"
    );
    if (!options.skipHeaderXAPIKey && eventData) {
      header["x-api-key"] = eventData;
    }
    delete options.skipHeaderXAPIKey;
    return header;
  }
}
