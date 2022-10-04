import { Injectable } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import * as _ from "lodash";
import { NgxUiLoaderService } from "ngx-ui-loader";
import { Observable, Subject, Subscription } from "rxjs";
import { NgxSpinnerService } from "ngx-spinner";
import { environment } from "../../../../environments/environment";
import {
  META_SEARCH_PARAMS,
  PAYMENT_CARD_TYPE,
  QUERY_PARAM_ATTRIBUTES,
  STEP_MAP,
  TRADITIONAL_FLOW,
  URL_PATHS,
} from "../../../common/common.constants";
import { ReservationDetails } from "../../../common/models/reservation-details.model";
import { SESSION_URL_CONST } from "../../../common/urls.constants";
import { CommonUtility } from "../../common.utility";
import { CreditCardDetails } from "../../models/credit-card-details.model";
import { PaymentUtils } from "../../utils/payment.utils";
import { HttpWrapperService } from "../http-wrapper.service";
import { StoreService } from "../store.service";
import { AlipayPayment } from "./alipay-payment.service";
import { MpgsPaymentService } from "./mpgs-payment.service";

@Injectable({
  providedIn: "root",
})
export class PaymentService {
  private _sharedDataSubscription: Subscription;
  private countAmex: number;
  private countMaster: number;
  disableProceedButton = false;
  public paymentMethodsAPIResponse = new Subject<any>();
  paymentMethodsData = this.paymentMethodsAPIResponse.asObservable();
  constructor(
    private _authHttp: HttpWrapperService,
    private mpgsPaymentService: MpgsPaymentService,
    private storeService: StoreService,
    private _router: Router,
    private spinner: NgxUiLoaderService,
    private alipayPaymentService: AlipayPayment,
    private route: ActivatedRoute,
    private ngxSpinner: NgxSpinnerService,
    private router: ActivatedRoute
  ) {}

  createReservation(resDetails: ReservationDetails[]): Observable<any> {
    let pathObj = "?";
    const routeParams = this.route.snapshot.queryParams;
    META_SEARCH_PARAMS.filter((item) => {
      if (routeParams.hasOwnProperty(item) && !!routeParams[item]) {
        pathObj = pathObj + (item + "=" + routeParams[item] + "&");
      }
    });
    pathObj = pathObj.slice(0, pathObj.length - 1);
    if (!!pathObj) {
      SESSION_URL_CONST.CREATE_RESERVATION.path =
        SESSION_URL_CONST.CREATE_RESERVATION.path + pathObj;
    }
    return this._authHttp.post(
      SESSION_URL_CONST.CREATE_RESERVATION,
      resDetails
    );
  }

  updateReservation(resDetails: ReservationDetails): Observable<any> {
    return this._authHttp.post(SESSION_URL_CONST.MODIFY_BOOKING, resDetails);
  }

  tokenizeCard(cardDetails: CreditCardDetails, guestInfo): Observable<any> {
    cardDetails["propertyCode"]= this.storeService.getUserSettingsState().propertyInfo.propertyCode;
    cardDetails["emailId"] = guestInfo.emailAddress || null;
    cardDetails["zipCode"] = guestInfo.postalCode || null;
    return this._authHttp.post(SESSION_URL_CONST.TOKENIZE_CARD, cardDetails);
  }

  public getPaymentMethods(rateCode: String) {
    const params = {};
    const routeParams = this.router.snapshot.queryParams;
    params[QUERY_PARAM_ATTRIBUTES.PROPETY_CODE] = routeParams.propertyCode;
    params[QUERY_PARAM_ATTRIBUTES.PAYMENT_METHOD_RATECODE] = rateCode;
    // return this._authHttp.get(SESSION_URL_CONST.PAYMENT_METHODS, params);
    const promise = this._authHttp.get(
      SESSION_URL_CONST.PAYMENT_METHODS,
      params
    );

    promise.subscribe((data) => {
      this.paymentMethodsAPIResponse.next(data);
    });
    return promise;
  }

  public retrieveReservationByConfCode(confCode: String): any {
    const params = {
      master_confirmationCode: confCode,
      hotel_id: environment.property_code,
    };
    return this._authHttp.get(SESSION_URL_CONST.RETRIEVE_RESERVATION, params);
  }

  public proceedReservationForOtherCardPayments(
    rs: ReservationDetails[],
    isManageBookingFlow: boolean,
    isPopupProceed: boolean
  ) {
    let error_code;
    this.spinner.start("reservation");
    if (
      isManageBookingFlow &&
      _.get(
        this.storeService.getUserSettingsState(),
        "propertyInfo.propertyType"
      ) === "RVNG" &&
      !isPopupProceed
    ) {
      this.storeService.updateRvngModifyFlag(true);
      this.spinner.stop("reservation");
    } else {
      this.tokenizeCard(rs[0].creditCardDetails, rs[0].guestInfo).subscribe((data) => {
        if (_.get(data, "status.statusCode") !== 1000) {
          this.storeService.setError(data.status.statusCode);
          error_code = _.get(data, "status.statusCode");
          this.spinner.stop("reservation");
          this.ngxSpinner.hide("reservationLoader");
          this.navigateError(error_code);
        } else {
          for (let index = 0; index < rs.length; index++) {
            rs[index].uuid = _.get(data, "data.uuid");
            _.unset(rs[index], "creditCardDetails");
          }
          if (isManageBookingFlow) {
            this.updateReservation(rs[0]).subscribe((resResp) => {
              this.spinner.stop("reservation");
              const resData = _.get(resResp, "data");
              const status = _.get(resResp, "status.statusCode");
              if (_.size(resData) > 0 && resData && status === 1000) {
                const confCodeList = new Array<string>();
                confCodeList[0] = resData[0].confirmationCode;
                const reservationRespObj = {
                  ResvConfCodes: new Array<string>(),
                  ConfirmationPageText: "",
                  CanModify: false,
                  canModifyByConfCodes: [],
                  failureStatusByConfCodes: [],
                  guestuid: "",
                  stayuid: "",
                  payuid: "",
                };
                for (let index = 0; index < resData.length; index++) {
                  reservationRespObj.canModifyByConfCodes[confCodeList[index]] =
                    resData[index].canModify;
                  reservationRespObj.failureStatusByConfCodes[
                    confCodeList[index]
                  ] = resData[index].reservationDetails.failureStatus;
                }
                reservationRespObj["ResvConfCodes"] = confCodeList;
                reservationRespObj["CanModify"] = resData[0].canModify;
                if (
                  _.get(
                    this.storeService.getUserSettingsState(),
                    "propertyInfo.propertyType"
                  ) === "RVNG"
                ) {
                  reservationRespObj.guestuid =
                    resData[0].reservationDetails.guestuid;
                  reservationRespObj.stayuid =
                    resData[0].reservationDetails.stayuid;
                  reservationRespObj.payuid =
                    resData[0].reservationDetails.payuid;
                }
                if (
                  _.get(resData[0], "reservationDetails.confirmationPageText")
                ) {
                  reservationRespObj["ConfirmationPageText"] = _.get(
                    resData,
                    "reservationDetails.confirmationPageText"
                  );
                }
                this.storeService.updateReservationResponse(reservationRespObj);
                const resConfData = _.get(resData[0], "confirmationCode");
                if (resConfData !== undefined) {
                  this.storeService.setError(0);
                  this.storeService.setPaymentFailureFlagAndCode(
                    false,
                    undefined
                  );
                  const rooms = this.storeService.getBasketState().Rooms;
                  const userSettingsState = this.storeService.getUserSettingsState();
                  const langObj = _.get(userSettingsState, "langObj");
                  const params = CommonUtility.getConfirmationQueryParams(
                    resConfData,
                    rooms,
                    langObj
                  );
                  const navigationExtras = {
                    queryParams: params,
                  };
                  this._router.navigate(
                    ["/" + URL_PATHS.CONFIRMATION_PAGE],
                    navigationExtras
                  );
                } else {
                  error_code = status.toString();
                  this.navigateError(error_code);
                }
              } else {
                if (status === 3013 || status === 9000 || status === 6003) {
                  error_code = status.toString();
                  this.navigateError(error_code);
                } else if (
                  status === 3012 ||
                  status === 9001 ||
                  status === 6004
                ) {
                  error_code = status.toString();
                  this.navigateError(error_code, resResp);
                } else {
                  error_code = "3005";
                  this.navigateError(error_code);
                }
              }
            });
          } else {
            rs[0].stayuid = "";
            rs[0].guestuid = "";
            rs[0].payuid = "";
            this.createReservation(rs).subscribe((resResp) => {
              this.spinner.stop("reservation");
              const resData = _.get(resResp, "data");
              const status = _.get(resResp, "status.statusCode");
              if (_.size(resData) > 0 && resData[0] && status === 1000) {
                const confCodeList = new Array<string>();
                const reservationRespObj = {
                  ResvConfCodes: new Array<string>(),
                  ConfirmationPageText: "",
                  CanModify: false,
                  canModifyByConfCodes: [],
                  failureStatusByConfCodes: [],
                  guestuid: "",
                  stayuid: "",
                  payuid: "",
                };

                 // Till payment flow
                 if (!!resData[0].pgRedirect && !!resData[0].pgRedirect.url) {
                  window.location.replace(resData[0].pgRedirect.url);
                  this.storeService.updateIs3DSCrediCardFlag(true);
                } else {
                  this.storeService.updateIs3DSCrediCardFlag(false);
                }

                const oldData = _.get(
                  this.storeService.getBasketState(),
                  "oldData"
                );
                if (oldData) {
                  oldData.prevRoom = resData[0].reservationDetails.roomType;
                  oldData.prevArrivalDate =
                    resData[0].reservationDetails.arrivalDate;
                  oldData.prevDepartureDate =
                    resData[0].reservationDetails.departureDate;
                  this.storeService.updateOldData(oldData);
                }
                for (let index = 0; index < resData.length; index++) {
                  confCodeList[index] = resData[index].confirmationCode;
                  reservationRespObj.canModifyByConfCodes[confCodeList[index]] =
                    resData[index].canModify;
                  reservationRespObj.failureStatusByConfCodes[
                    confCodeList[index]
                  ] = resData[index].reservationDetails.failureStatus;
                }
                reservationRespObj["ResvConfCodes"] = confCodeList;
                reservationRespObj.CanModify = resData[0].canModify;
                if (
                  _.get(
                    this.storeService.getUserSettingsState(),
                    "propertyInfo.propertyType"
                  ) === "RVNG"
                ) {
                  reservationRespObj.guestuid =
                    resData[0].reservationDetails.guestuid;
                  reservationRespObj.stayuid =
                    resData[0].reservationDetails.stayuid;
                  reservationRespObj.payuid =
                    resData[0].reservationDetails.payuid;
                }

                if (
                  _.get(resData[0], "reservationDetails.confirmationPageText")
                ) {
                  reservationRespObj["ConfirmationPageText"] = _.get(
                    resData[0],
                    "reservationDetails.confirmationPageText"
                  );
                }

                this.storeService.updateReservationResponse(reservationRespObj);
                if(!!resData[0].reservationDetails.pgTransactionId) {
                  this.storeService.setPGTransactionID(resData[0].reservationDetails.pgTransactionId);
                  } else {
                    this.storeService.setPGTransactionID('');
                }

                const resConfData = _.get(resData[0], "confirmationCode");
                if (resConfData !== undefined) {
                  this.storeService.setError(0);
                  this.storeService.setPaymentFailureFlagAndCode(
                    false,
                    undefined
                  );
                  const rooms = this.storeService.getBasketState().Rooms;
                  const userSettingsState = this.storeService.getUserSettingsState();
                  const langObj = _.get(userSettingsState, "langObj");
                  const params = CommonUtility.getConfirmationQueryParams(
                    resConfData,
                    rooms,
                    langObj
                  );
                  const navigationExtras = {
                    queryParams: params,
                  };
                  this._router.navigate(
                    ["/" + URL_PATHS.CONFIRMATION_PAGE],
                    navigationExtras
                  );
                } else {
                  error_code = status.toString();
                  this.navigateError(error_code);
                }
              } else {
                if (status === 3013 || status === 9000 || status === 6003) {
                  error_code = status.toString();
                  this.navigateError(error_code);
                } else if (
                  status === 3012 ||
                  status === 9001 ||
                  status === 6004
                ) {
                  error_code = status.toString();
                  this.navigateError(error_code, resResp);
                } else if (
                  status === 3401 ||
                  status === 3402 ||
                  status === 3403) {
                  this.storeService.updateIs3DSCrediCardFlag(false);
                  error_code = status.toString();
                  this.navigateError(error_code);
                } else {
                  error_code = "3005";
                  this.navigateError(error_code);
                }
              }
            });
          }
        }
      });
    }
  }

  public proceedReservationForManualCardPayments(
    rs: ReservationDetails[],
    isManageBookingFlow: boolean,
    isPopupProceed: boolean
  ) {
    if(!rs[0].propertyCode){
    const routeParams = this.route.snapshot.queryParams;
    rs[0].propertyCode = routeParams.propertyCode;
    }
    this.disableProceedButton = true;
    let error_code, mOrderId;
    this.spinner.start("reservation");
    const sharedData = this.storeService.getBasketState();
    if (_.get(sharedData, "MPGSSesResp.orderId")) {
      mOrderId = _.get(sharedData, "MPGSSesResp.orderId");
    }
    if (
      isManageBookingFlow &&
      _.get(
        this.storeService.getUserSettingsState(),
        "propertyInfo.propertyType"
      ) === "RVNG" &&
      !isPopupProceed
    ) {
      this.disableProceedButton = false;
      this.storeService.updateRvngModifyFlag(true);
      this.spinner.stop("reservation");
    } else {
      this.tokenizeCard(rs[0].creditCardDetails, rs[0].guestInfo).subscribe((data) => {
        if (_.get(data, "status.statusCode") !== 1000) {
          this.disableProceedButton = false;
          this.spinner.stop("reservation");
          this.ngxSpinner.hide("reservationLoader");
          this.storeService.setError(data.status.statusCode);
          error_code = _.get(data, "status.statusCode");
          this.navigateError(error_code);
        } else {
          this.disableProceedButton = true;
          for (let index = 0; index < rs.length; index++) {
            rs[index].uuid = _.get(data, "data.uuid");
            _.unset(rs[index], "creditCardDetails");
            if (window["iframeFailure"]) {
              _.set(rs[index], "mpgsiframeLaunchFailure", true);
            } else if (window["sessionFailure"]) {
              _.set(rs[index], "mpgssessionFailure", true);
            }
            _.set(rs[index], "mpgsOrderId", mOrderId);
          }

          if (isManageBookingFlow) {
            this.storeService.updateRvngModifyFlag(false);
            this.updateReservation(rs[0]).subscribe((resResp) => {
              this.disableProceedButton = false;
              this.spinner.stop("reservation");
              const resData = _.get(resResp, "data");
              const status = _.get(resResp, "status.statusCode");
              if (_.size(resData) > 0 && resData && status === 1000) {
                const confCodeList = new Array<string>();
                confCodeList[0] = resData[0].confirmationCode;
                const reservationRespObj = {
                  ResvConfCodes: new Array<string>(),
                  ConfirmationPageText: "",
                  CanModify: false,
                  canModifyByConfCodes: [],
                  failureStatusByConfCodes: [],
                  guestuid: "",
                  stayuid: "",
                  payuid: "",
                };
                reservationRespObj["ResvConfCodes"] = confCodeList;
                reservationRespObj["CanModify"] = resData[0].canModify;
                if (
                  _.get(
                    this.storeService.getUserSettingsState(),
                    "propertyInfo.propertyType"
                  ) === "RVNG"
                ) {
                  reservationRespObj.guestuid =
                    resData[0].reservationDetails.guestuid;
                  reservationRespObj.stayuid =
                    resData[0].reservationDetails.stayuid;
                  reservationRespObj.payuid =
                    resData[0].reservationDetails.payuid;
                }
                reservationRespObj.canModifyByConfCodes[confCodeList[0]] =
                  resData[0].canModify;
                reservationRespObj.failureStatusByConfCodes[confCodeList[0]] =
                  resData[0].reservationDetails.failureStatus;
                if (_.get(resData, "reservationDetails.confirmationPageText")) {
                  reservationRespObj["ConfirmationPageText"] = _.get(
                    resData,
                    "reservationDetails.confirmationPageText"
                  );
                }
                this.storeService.updateReservationResponse(reservationRespObj);
                const resConfData = _.get(resData[0], "confirmationCode");
                if (resConfData !== undefined) {
                  this.storeService.setError(0);
                  this.storeService.setPaymentFailureFlagAndCode(
                    false,
                    undefined
                  );
                  const rooms = this.storeService.getBasketState().Rooms;
                  const userSettingsState = this.storeService.getUserSettingsState();
                  const langObj = _.get(userSettingsState, "langObj");
                  const params = CommonUtility.getConfirmationQueryParams(
                    resConfData,
                    rooms,
                    langObj
                  );
                  const navigationExtras = {
                    queryParams: params,
                  };
                  this._router.navigate(
                    ["/" + URL_PATHS.CONFIRMATION_PAGE],
                    navigationExtras
                  );
                } else {
                  error_code = "3005";
                  this.navigateError(error_code);
                }
              } else {
                if (status === 3013 || status === 9000 || status === 6003) {
                  error_code = status.toString();
                  this.navigateError(error_code);
                } else if (
                  status === 3012 ||
                  status === 9001 ||
                  status === 6004
                ) {
                  error_code = status.toString();
                  this.navigateError(error_code, resResp);
                } else {
                  error_code = "3005";
                  this.navigateError(error_code);
                }
              }
            });
          } else {
            rs[0].stayuid = "";
            rs[0].guestuid = "";
            rs[0].payuid = "";
            this.createReservation(rs).subscribe((resResp) => {
              this.disableProceedButton = false;
              this.spinner.stop("reservation");
              const resData = _.get(resResp, "data");
              const status = _.get(resResp, "status.statusCode");
              // const status = Number('3403');
              if (_.size(resData) > 0 && resData[0] && status === 1000) {
                const confCodeList = new Array<string>();
                const reservationRespObj = {
                  ResvConfCodes: new Array<string>(),
                  ConfirmationPageText: "",
                  CanModify: false,
                  canModifyByConfCodes: [],
                  failureStatusByConfCodes: [],
                  guestuid: "",
                  stayuid: "",
                  payuid: "",
                };

                // Till payment flow
                if (!!resData[0].pgRedirect && !!resData[0].pgRedirect.url) {
                  window.location.replace(resData[0].pgRedirect.url);
                  this.storeService.updateIs3DSCrediCardFlag(true);
                } else {
                  this.storeService.updateIs3DSCrediCardFlag(false);
                }

                if(!!resData[0].reservationDetails.pgTransactionId) {
                  this.storeService.setPGTransactionID(resData[0].reservationDetails.pgTransactionId);
                  } else {
                    this.storeService.setPGTransactionID('');
                }
                
                const oldData = _.get(
                  this.storeService.getBasketState(),
                  "oldData"
                );
                if (oldData) {
                  oldData.prevRoom = resData[0].reservationDetails.roomType;
                  oldData.prevArrivalDate =
                    resData[0].reservationDetails.arrivalDate;
                  oldData.prevDepartureDate =
                    resData[0].reservationDetails.departureDate;
                  this.storeService.updateOldData(oldData);
                }
                for (let index = 0; index < resData.length; index++) {
                  confCodeList[index] = resData[index].confirmationCode;
                  reservationRespObj.canModifyByConfCodes[confCodeList[index]] =
                    resData[index].canModify;
                  reservationRespObj.failureStatusByConfCodes[
                    confCodeList[index]
                  ] = resData[index].reservationDetails.failureStatus;
                }

                reservationRespObj["ResvConfCodes"] = confCodeList;
                reservationRespObj["CanModify"] = resData[0].canModify;
                if (
                  _.get(
                    this.storeService.getUserSettingsState(),
                    "propertyInfo.propertyType"
                  ) === "RVNG"
                ) {
                  reservationRespObj.guestuid =
                    resData[0].reservationDetails.guestuid;
                  reservationRespObj.stayuid =
                    resData[0].reservationDetails.stayuid;
                  reservationRespObj.payuid =
                    resData[0].reservationDetails.payuid;
                }
                if (
                  _.get(resData[0], "reservationDetails.confirmationPageText")
                ) {
                  reservationRespObj["ConfirmationPageText"] = _.get(
                    resData[0],
                    "reservationDetails.confirmationPageText"
                  );
                }
                this.storeService.updateReservationResponse(reservationRespObj);
                const resConfData = _.get(resData[0], "confirmationCode");
                if (resConfData !== undefined) {
                  this.storeService.setError(0);
                  this.storeService.setPaymentFailureFlagAndCode(
                    false,
                    undefined
                  );
                  const rooms = this.storeService.getBasketState().Rooms;
                  const userSettingsState = this.storeService.getUserSettingsState();
                  const langObj = _.get(userSettingsState, "langObj");
                  const params = CommonUtility.getConfirmationQueryParams(
                    resConfData,
                    rooms,
                    langObj
                  );
                  const navigationExtras = {
                    queryParams: params,
                  };
                  this._router.navigate(
                    ["/" + URL_PATHS.CONFIRMATION_PAGE],
                    navigationExtras
                  );
                } else {
                  error_code = "3005";
                  this.navigateError(error_code);
                }
              } else {
                if (status === 3013 || status === 9000 || status === 6003) {
                  error_code = status.toString();
                  this.navigateError(error_code);
                } else if (
                  status === 3012 ||
                  status === 9001 ||
                  status === 6004
                ) {
                  error_code = status.toString();
                  this.navigateError(error_code, resResp);
                } else if (
                  status === 3401 ||
                  status === 3402 ||
                  status === 3403) {
                  this.storeService.updateIs3DSCrediCardFlag(false);
                  error_code = status.toString();
                  this.navigateError(error_code);
                } else {
                  error_code = "3005";
                  this.navigateError(error_code);
                }
              }
            });
          }
        }
      });
    }
  }

  public getSimplePayReservationLookup(masterConfCode: string, hotelID: string): Observable<any> {
    const options = [];
    options['master_confirmationCode'] = masterConfCode;
    options['hotel_id'] = hotelID;
    return this._authHttp.get(
      SESSION_URL_CONST.GET_SIMPLEPAY_RESERVATION_LOOKUP,
      options
    );
  }

  public proceedReservationForMPGSCardPayments(successId: string) {
    let error_code;
    this.mpgsPaymentService
      .MPGSBookingRequestURL(successId)
      .subscribe((resResp) => {
        const resData = _.get(resResp, "data");
        const status = _.get(resResp, "status.statusCode");
        const confCodeList = new Array<string>();
        for (let index = 0; index < resData.length; index++) {
          confCodeList[index] = resData[index].confirmationCode;
        }
        if (
          _.size(confCodeList) &&
          confCodeList[0] &&
          _.size(resData) > 0 &&
          resData[0]
        ) {
          const reservationRespObj = {
            ResvConfCodes: new Array<string>(),
            ConfirmationPageText: "",
          };
          reservationRespObj["ResvConfCodes"] = confCodeList;
          if (_.get(resData[0], "reservationDetails.confirmationPageText")) {
            reservationRespObj["ConfirmationPageText"] = _.get(
              resData[0],
              "reservationDetails.confirmationPageText"
            );
          }
          this.storeService.updateReservationResponse(reservationRespObj);
          const rsvRespObj = {};
          const resConfData = _.get(resData[0], "confirmationCode");
          if (resConfData !== undefined) {
            this.storeService.setError(0);
            this.storeService.setPaymentFailureFlagAndCode(false, undefined);
            this._router.navigate(
              ["/" + URL_PATHS.CONFIRMATION_PAGE],
              this.getNavigationParamsForConfirmationPage(resConfData)
            );
          } else {
            error_code = "3005";
            this.navigateError(error_code);
          }
        } else {
          if (status === 3013 || status === 9000 || status === 6003) {
            error_code = status.toString();
            this.navigateError(error_code);
          } else if (
            status === 3012 ||
            status === 9001 ||
            status === 6004 ||
            status === 9003 ||
            status === 9002
          ) {
            error_code = status.toString();
            this.navigateError(error_code, resResp);
          } else {
            this.navigateError(status);
          }
        }
      });
  }

  AlipayResponseForStayAndPay(rs: ReservationDetails[]) {
    let error_code;
    this.alipayPaymentService
      .alipayChargeRequestURL(rs)
      .subscribe((resResp) => {
        const resData = _.get(resResp, "data.reservationResponseDetails");
        const status = _.get(resResp, "status.statusCode");
        const confCodeList = new Array<string>();
        for (let index = 0; index < resData.length; index++) {
          confCodeList[index] = resData[index].confirmationCode;
        }
        if (
          _.size(confCodeList) &&
          confCodeList[0] &&
          _.size(resData) > 0 &&
          resData[0]
        ) {
          const reservationRespObj = {
            ResvConfCodes: new Array<string>(),
            ConfirmationPageText: "",
          };
          reservationRespObj["ResvConfCodes"] = confCodeList;
          if (_.get(resData[0], "reservationDetails.confirmationPageText")) {
            reservationRespObj["ConfirmationPageText"] = _.get(
              resData[0],
              "reservationDetails.confirmationPageText"
            );
          }
          this.storeService.updateReservationResponse(reservationRespObj);
          const resConfData = _.get(resData[0], "confirmationCode");
          if (resConfData !== undefined) {
            this.storeService.setError(0);
            this.storeService.setPaymentFailureFlagAndCode(false, undefined);
            const rooms = this.storeService.getBasketState().Rooms;
            const userSettingsState = this.storeService.getUserSettingsState();
            const langObj = _.get(userSettingsState, "langObj");
            const params = CommonUtility.getConfirmationQueryParams(
              resConfData,
              rooms,
              langObj
            );
            const navigationExtras = {
              queryParams: params,
            };
            this._router.navigate(
              ["/" + URL_PATHS.CONFIRMATION_PAGE],
              navigationExtras
            );
          } else {
            error_code = "3005";
            this.navigateError(error_code);
          }
        } else {
          if (status === 3013 || status === 9000 || status === 6003) {
            error_code = status.toString();
            this.navigateError(error_code);
          } else if (
            status === 3012 ||
            status === 9001 ||
            status === 6004 ||
            status === 9003 ||
            status === 9002
          ) {
            error_code = status.toString();
            this.navigateError(error_code, resResp);
          } else {
            this.navigateError(status);
          }
        }
      });
  }

  MPGSSessionResponseForMBStayAndPay(rs: ReservationDetails[]) {
    let error_code;
    this.mpgsPaymentService.MPGSSessionRequestURL(rs).subscribe((resResp) => {
      const resData = _.get(resResp, "data.reservationResponseDetails");
      const status = _.get(resResp, "status.statusCode");
      const confCodeList = new Array<string>();
      for (let index = 0; index < resData.length; index++) {
        confCodeList[index] = resData[index].confirmationCode;
      }
      if (
        _.size(confCodeList) &&
        confCodeList[0] &&
        _.size(resData) > 0 &&
        resData[0]
      ) {
        const reservationRespObj = {
          ResvConfCodes: new Array<string>(),
          ConfirmationPageText: "",
        };
        reservationRespObj["ResvConfCodes"] = confCodeList;
        if (_.get(resData[0], "reservationDetails.confirmationPageText")) {
          reservationRespObj["ConfirmationPageText"] = _.get(
            resData[0],
            "reservationDetails.confirmationPageText"
          );
        }
        this.storeService.updateReservationResponse(reservationRespObj);
        const resConfData = _.get(resData[0], "confirmationCode");
        if (resConfData !== undefined) {
          this.storeService.setError(0);
          this.storeService.setPaymentFailureFlagAndCode(false, undefined);
          const rooms = this.storeService.getBasketState().Rooms;
          const userSettingsState = this.storeService.getUserSettingsState();
          const langObj = _.get(userSettingsState, "langObj");
          const params = CommonUtility.getConfirmationQueryParams(
            resConfData,
            rooms,
            langObj
          );
          const navigationExtras = {
            queryParams: params,
          };
          this._router.navigate(
            ["/" + URL_PATHS.CONFIRMATION_PAGE],
            navigationExtras
          );
        } else {
          error_code = "3005";
          this.navigateError(error_code);
        }
      } else {
        if (status === 3013 || status === 9000 || status === 6003) {
          error_code = status.toString();
          this.navigateError(error_code);
        } else if (
          status === 3012 ||
          status === 9001 ||
          status === 6004 ||
          status === 9003 ||
          status === 9002
        ) {
          error_code = status.toString();
          this.navigateError(error_code, resResp);
        } else {
          this.navigateError(status);
        }
      }
    });
  }

  public proceedForManageBookingStayandPay(
    rs: ReservationDetails,
    isManageBookingFlow
  ) {
    let error_code;
    _.unset(rs, "creditCardDetails");
    this.updateReservation(rs).subscribe((resResp) => {
      this.spinner.stop("reservation");
      const resData = _.get(resResp, "data");
      const status = _.get(resResp, "status.statusCode");
      if (_.size(resData) > 0 && resData && status === 1000) {
        const confCodeList = new Array<string>();
        confCodeList[0] = resData.confirmationCode;
        const reservationRespObj = {
          ResvConfCodes: new Array<string>(),
          ConfirmationPageText: "",
        };
        reservationRespObj["ResvConfCodes"] = confCodeList;
        if (_.get(resData, "reservationDetails.confirmationPageText")) {
          reservationRespObj["ConfirmationPageText"] = _.get(
            resData,
            "reservationDetails.confirmationPageText"
          );
        }
        this.storeService.updateReservationResponse(reservationRespObj);
        const resConfData = _.get(resData[0], "confirmationCode");
        if (resConfData !== undefined) {
          this.storeService.setError(0);
          this.storeService.setPaymentFailureFlagAndCode(false, undefined);
          const rooms = this.storeService.getBasketState().Rooms;
          const userSettingsState = this.storeService.getUserSettingsState();
          const langObj = _.get(userSettingsState, "langObj");
          const params = CommonUtility.getConfirmationQueryParams(
            resConfData,
            rooms,
            langObj
          );
          const navigationExtras = {
            queryParams: params,
          };
          this._router.navigate(
            ["/" + URL_PATHS.CONFIRMATION_PAGE],
            navigationExtras
          );
        } else {
          error_code = status.toString();
          this.navigateError(error_code);
        }
      } else {
        if (status === 3013 || status === 9000 || status === 6003) {
          error_code = status.toString();
          this.navigateError(error_code);
        } else if (
          status === 3012 ||
          status === 9001 ||
          status === 6004 ||
          status === 9003 ||
          status === 9002
        ) {
          error_code = status.toString();
          this.navigateError(error_code, resResp);
        } else {
          error_code = "3005";
          this.navigateError(error_code);
        }
      }
    });
  }

  navigateError(error_code: number, data?: any) {
    error_code = Number(error_code);
    this.storeService.setError(error_code);
    if (error_code === 3013 || error_code === 9000 || error_code === 6003) {
      const guestSummary = this.storeService.getBasketState().GuestSummary;
      const offerCode = this.storeService.getBasketState().offerCode;
      const params = CommonUtility.getQueryParamObjGuestSummary(
        guestSummary,
        this.storeService,
        offerCode
      );
      const navigationExtras = {
        queryParams: params,
      };
      const rooms = this.storeService.getBasketState().Rooms;
      if (rooms.length > 1) {
        this.storeService.updateEmptyRooms();
        this.storeService.upsertMultiRoomBookingOrder([]);
        sessionStorage.removeItem("savedRooms");
      }
      this._router
        .navigate(["/" + URL_PATHS.ROOMS_PAGE], navigationExtras)
        .then((d) => CommonUtility.highlightStep("select-room"));
    } else if (
      error_code === 3012 ||
      error_code === 9001 ||
      error_code === 6004 ||
      error_code === 9003 ||
      error_code === 9002
    ) {
      const curr = this.storeService.getBasketState().CurrencyCode;
      const defCurr =
        _.get(
          this.storeService.getUserSettingsState(),
          "propertyInfo.defaultCurrency"
        ) || "SGD";
      const basketRooms = PaymentUtils.updateLatestPricesInBasekt(
        data,
        this.storeService.getBasketState(),
        curr,
        defCurr,
        error_code
      );
      let is_jcb_cup = false;
      const card_type = _.get(basketRooms[0].PaymentInfo, "cardType");
      if (error_code === 9002) {
        const updatedAddons = [];
        data.data.forEach((element) => {
          updatedAddons.push(
            element.reservationDetails.latestAlaCarteAddOnPriceInfo
          );
        });
        this.storeService.updateAlaCarteAddons(updatedAddons);
      }
      if (
        card_type &&
        (card_type === PAYMENT_CARD_TYPE.JAPAN_CREDIT_BUREAU ||
          card_type === PAYMENT_CARD_TYPE.CHINA_UNION_PAY)
      ) {
        is_jcb_cup = true;
      }
      if (is_jcb_cup || error_code === 3012 || error_code === 6004) {
        const latestResvDetailsForOtherCards = _.get(
          data,
          "data[0].reservationDetails"
        );
        if (
          latestResvDetailsForOtherCards.latestPolicyCode &&
          latestResvDetailsForOtherCards.latestGuaranteePercentage !==
            undefined &&
          latestResvDetailsForOtherCards.latestAlipayAlertText !== undefined &&
          latestResvDetailsForOtherCards.latestIsPastCancellationDate !==
            undefined &&
          latestResvDetailsForOtherCards.latestMpgsAlertText !== undefined &&
          latestResvDetailsForOtherCards.latestPolicyText !== undefined &&
          latestResvDetailsForOtherCards.latestPolicyGuaranteeType !== undefined &&
          latestResvDetailsForOtherCards.latestPrePaymentType !== undefined &&
          latestResvDetailsForOtherCards.latestCancellationPolicy !== undefined
        ) {
          this.storeService.updatePolicyCodeAndGuaranteePercentage(
            latestResvDetailsForOtherCards.latestPolicyCode,
            latestResvDetailsForOtherCards.latestGuaranteePercentage,
            latestResvDetailsForOtherCards.latestAlipayAlertText,
            latestResvDetailsForOtherCards.latestIsPastCancellationDate,
            latestResvDetailsForOtherCards.latestMpgsAlertText,
            latestResvDetailsForOtherCards.latestPolicyText,
            latestResvDetailsForOtherCards.latestPolicyGuaranteeType,
            latestResvDetailsForOtherCards.latestPrePaymentType,
            latestResvDetailsForOtherCards.latestCancellationPolicy,
          );
        }
      } else {
        const latestResvDetails = _.get(data, "data.reservationDetails");
        if (
          latestResvDetails[0].latestPolicyCode &&
          latestResvDetails[0].latestGuaranteePercentage !== undefined &&
          latestResvDetails[0].latestAlipayAlertText !== undefined &&
          latestResvDetails[0].latestIsPastCancellationDate !== undefined &&
          latestResvDetails[0].latestMpgsAlertText !== undefined &&
          latestResvDetails[0].latestPolicyText !== undefined &&
          latestResvDetails[0].latestPolicyGuaranteeType !== undefined &&
          latestResvDetails[0].latestPrePaymentType !== undefined &&
          latestResvDetails[0].latestCancellationPolicy !== undefined
        ) {
          this.storeService.updatePolicyCodeAndGuaranteePercentage(
            latestResvDetails[0].latestPolicyCode,
            latestResvDetails[0].latestGuaranteePercentage,
            latestResvDetails[0].latestAlipayAlertText,
            latestResvDetails[0].latestIsPastCancellationDate,
            latestResvDetails[0].latestMpgsAlertText,
            latestResvDetails[0].latestPolicyText,
            latestResvDetails[0].latestPolicyGuaranteeType,
            latestResvDetails[0].latestPrePaymentType,
            latestResvDetails[0].latestCancellationPolicy
          );
        }
      }
      this.storeService.updateMultipleRoomsWithPricing(basketRooms);
      const rooms = this.storeService.getBasketState().Rooms;
      const errorCode = _.get(data, "status.statusCode");
      const userSettingsState = this.storeService.getUserSettingsState();
      const langObj = _.get(userSettingsState, "langObj");
      const params = CommonUtility.getGuestInfoQueryParams(
        rooms,
        langObj,
        errorCode
      );
      const navigationExtras = {
        queryParams: params,
      };
      this._router
        .navigate(["/" + URL_PATHS.GUEST_INFO_PAGE], navigationExtras)
        .then((d) => CommonUtility.highlightStep("guest-info"));
    } else {
      const rooms = this.storeService.getBasketState().Rooms;
      let errorCode;
      if (
        error_code === 3401 ||
        error_code === 3402 ||
        error_code === 3403) {
          errorCode = error_code;
      } else {
        errorCode = _.get(data, "status.statusCode");
      }

      const userSettingsState = this.storeService.getUserSettingsState();
      const langObj = _.get(userSettingsState, "langObj");
      const params = CommonUtility.getGuestInfoQueryParams(
        rooms,
        langObj,
        errorCode
      );
      const navigationExtras = {
        queryParams: params,
      };
      this.storeService.updateCurrentStep(STEP_MAP[URL_PATHS.GUEST_INFO_PAGE]);
      this._router
        .navigate(["/" + URL_PATHS.GUEST_INFO_PAGE], navigationExtras)
        .then((d) => CommonUtility.highlightStep("guest-info"));
    }
  }

  getNavigationParamsForConfirmationPage(resConfData: string) {
    const rooms = this.storeService.getBasketState().Rooms;
    const userSettingsState = this.storeService.getUserSettingsState();
    const langObj = _.get(userSettingsState, "langObj");
    const params = CommonUtility.getConfirmationQueryParams(
      resConfData,
      rooms,
      langObj
    );
    return {
      queryParams: params,
    };
  }
}
