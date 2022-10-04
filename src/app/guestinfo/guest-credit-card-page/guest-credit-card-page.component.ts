import {
  AfterViewInit,
  Component,
  HostListener,
  NgZone,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
} from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import * as _ from "lodash";
import { BsModalService } from "ngx-bootstrap";
import { BsModalRef } from "ngx-bootstrap/modal/bs-modal-ref.service";
import { NGXLogger } from "ngx-logger";
import { NgxSpinnerService } from "ngx-spinner";
import { NgxUiLoaderService } from "ngx-ui-loader";
import { Observable } from "rxjs";
import { Subscription } from "rxjs";
import { FeatureFlags } from "src/app/common/feature.flags";
import {
  checkErrorCodesList,
  DISPLAY_CVV,
  emailCharactersRegex,
  error_code_prefix,
  ErrorCodesListInComponents,
  MPGS_SCRIPT_ID,
  PAYMENT_CARD_TYPE,
  QUERY_PARAM_ATTRIBUTES,
  showPreferences,
  STEP_MAP,
  URL_PATHS,
} from "../../common/common.constants";
import { CommonUtility } from "../../common/common.utility";
import { CreditCardDetails } from "../../common/models/credit-card-details.model";
import { MPGSgetSession } from "../../common/models/mpgs-getSession.model";
import { ReservationDetails } from "../../common/models/reservation-details.model";
import { CustomPriceFormatPipe } from "../../common/pipes/decimal-format.pipe";
import { GuestCreditCardPageService } from "../../common/services/guest-credit-card-page.service";
import { HttpWrapperService } from "../../common/services/http-wrapper.service";
import { AlipayPayment } from "../../common/services/payment/alipay-payment.service";
import { MpgsPaymentService } from "../../common/services/payment/mpgs-payment.service";
import { PaymentService } from "../../common/services/payment/payment.service";
import { StoreService } from "../../common/services/store.service";
import { IBasketState } from "../../common/store/reducers/basket.reducer";
import { SESSION_URL_CONST } from "../../common/urls.constants";
import { AmexComponent } from "../amex/amex.component";
import { AvailableUpgradesAddonsComponent } from "../available-upgrades-addons/available-upgrades-addons.component";
import { GuestInfoFooterComponent } from "../guest-info-footer/guest-info-footer.component";
import { GuestInfoFormComponent } from "../guest-info-form/guest-info-form.component";
import { PackagelistingComponent } from "../packagelisting/packagelisting.component";
import { PaymentMethodComponent } from "../payment-method/payment-method.component";
import { BreakpointObserver, BreakpointState } from "@angular/cdk/layout";
import { browserBack } from "../../app.component";
declare var $: any;

@Component({
  selector: "app-guest-credit-card-page",
  templateUrl: "./guest-credit-card-page.component.html",
  styleUrls: ["./guest-credit-card-page.component.scss"],
  providers: [CustomPriceFormatPipe],
})
export class GuestCreditCardPageComponent
  implements OnInit, AfterViewInit, OnDestroy {
  static callbackCounter = 0;
  manualCreditCard = false;
  checkCount: number;
  iFrameCount: number;
  transactionaApiCount: number;
  payAndStay: boolean;
  currentPayMethod = "";
  currentCard = "";
  modalRef: BsModalRef;
  localeObj: any;
  errorCode: number;
  errorFound: boolean;
  errorMsg: string;
  scrollClass = "static";
  isManageBookingFlow: boolean;
  showPref = showPreferences;
  prevPaymentMethod: string;
  isErrorOrSuccessCallback = false;
  phoneNumberRequired: boolean;
  stateRequired: boolean;
  cityRequired: boolean;
  zipCodeRequired: boolean;
  addressLine1Required: boolean;
  addressLine2Required: boolean;
  cardPaymentMethods: any;
  userPreference: any;
  confirmModifyMsg: any;
  private _userSettingsSubscriptions: Subscription;
  private _errorHandlerSubscription: Subscription;
  private _basketSubscription: Subscription;
  private mpgsSessionSubscription: Subscription;
  private mpgsTransactionSubscription: Subscription;
  private routerSubscription: Subscription;
  private observer: Subscription;
  @ViewChild("GuestInfoForm", { static: true })
  guestInfoForm: GuestInfoFormComponent;
  @ViewChild("PaymentMethod", { static: false })
  paymentMethod: PaymentMethodComponent;
  @ViewChild("PackageListing", { static: true })
  packageListing: PackagelistingComponent;
  @ViewChild("GuestInfoFooter", { static: true })
  guestInfoFooter: GuestInfoFooterComponent;
  @ViewChild("AvailableUpgrades", { static: true })
  availableUpgrades: AvailableUpgradesAddonsComponent;
  @ViewChild("template", { static: true }) errorTemplate: TemplateRef<any>;
  @ViewChild("AmexPopUp", { static: true }) MpgsPopup: AmexComponent;
  @ViewChild("confirmationbummer") bummer: TemplateRef<any>;
  displayCvv: boolean;
  isLinkedToPaymentGateway: boolean;
  displayAddons: any = false;
  validatedAddons: any;
  public paymentMethodsAPIResp: any;
  public displayAdditionalGuestsConfig = false;
  public displayUpgrades: any = false;
  public displayPaymentMethods = true;
  ErrorPopup_heading : string = ""
  ErrorPopup_subTitle : string = ""
  ErrorPopup_message : string = ""
  ErrorButton: string ="";
  isShowPaymentErrorModel: boolean = false;
  propertyInfo: any = {}
  public mobileScreen: boolean = false;

  constructor(
    private _activatedRoute: ActivatedRoute,
    private storeService: StoreService,
    private router: Router,
    private alipayService: AlipayPayment,
    private mpgsPaymentService: MpgsPaymentService,
    private paymentservice: PaymentService,
    private _authHttp: HttpWrapperService,
    private _zone: NgZone,
    private modalService: BsModalService,
    private spinner: NgxUiLoaderService,
    private ngxSpinner: NgxSpinnerService,
    private pricePipe: CustomPriceFormatPipe,
    private logger: NGXLogger,
    private guestinfoservice: GuestCreditCardPageService,
    private breakpointObserver: BreakpointObserver,
  ) {
    const basket = this.storeService.getBasketState() as IBasketState;
    if (
      basket.CurrentStep === STEP_MAP[URL_PATHS.SEARCH_PAGE] ||
      basket.CurrentStep === STEP_MAP[URL_PATHS.CONFIRMATION_PAGE]
    ) {
      this.router
        .navigateByUrl(URL_PATHS.SEARCH_PAGE)
        .then((d) => CommonUtility.highlightStep("search"));
    } else if (
      basket.CurrentStep !== STEP_MAP[URL_PATHS.GUEST_INFO_PAGE] ||
      basket.CurrentStep === STEP_MAP[URL_PATHS.PROMO_PAGE]
    ) {
      this.storeService.updateCurrentStep(STEP_MAP[URL_PATHS.GUEST_INFO_PAGE]);
      this.storeService.updateIsGuestInfoVisitedFlag(true);
    }
  }

  @HostListener("window:scroll", ["$event"])
  onScroll($event: Event): void {
    const mySticky = document.getElementById("mySticky");
    const outletContainer = document.getElementById("outletContainer");
    const widgetHeight =
      mySticky.getBoundingClientRect().bottom -
      mySticky.getBoundingClientRect().top;

    if (mySticky.getBoundingClientRect().top <= 0) {
      this.scrollClass = "fixed";
    }

    if (outletContainer.getBoundingClientRect().bottom < widgetHeight) {
      this.scrollClass = "absolute";
    }

    if (outletContainer.getBoundingClientRect().top > 0) {
      this.scrollClass = "static";
    }
  }

  ngOnInit() {
    const basket = this.storeService.getBasketState() as IBasketState;
    this.displayUpgrades =
      _.get(
        this.storeService.getUserSettingsState(),
        "propertyInfo.displayUpgrade"
      ) || false;
    this.storeService.removeErrors(
      ErrorCodesListInComponents.GuestCreditCardPage
    );
    this.displayAdditionalGuestsConfig =
    _.get(
      this.storeService.getUserSettingsState(),
      "propertyInfo.displayAdditionalGuestNames"
    );
    this.storeService.updateRvngModifyFlag(false);
    const statusCodeList = ErrorCodesListInComponents.PaymentMethodComponent;
    this.storeService.removeErrors(statusCodeList);

    if (this.storeService.isDirectBillPolicySelected()) {
      this.displayPaymentMethods = false;
    } else  {
      this.displayPaymentMethods = true;
    }

    this.routerSubscription = this._activatedRoute.queryParams.subscribe(
      (params) => {
        const userSettingsData = this.storeService.getUserSettingsState();
        const basketData = this.storeService.getBasketState();
        this.localeObj = this.storeService.getUserSettings()
        .subscribe((sharedData) => {
          this.localeObj = sharedData.localeObj;
          this.propertyInfo = sharedData.propertyInfo;
          if (basketData.is3DSCreditCard === undefined) {
            this.isShowPaymentErrorModel = false;
          }
        if (basketData.is3DSCreditCard !== undefined && basketData.is3DSCreditCard) {
          this.isShowPaymentErrorModel = true;
          this.ErrorPopup_heading = this.localeObj.tf_4_Checkout_Popup_3DSCreditCard_PaymentError_heading;
          this.ErrorPopup_subTitle = this.localeObj.tf_4_Checkout_Popup_3DSCreditCard_PaymentError_subTitle;
          this.ErrorPopup_message  = this.localeObj.tf_4_Checkout_Popup_3DSCreditCard_PaymentError_message;
          this.ErrorButton = this.localeObj.tf_4_Checkout_Popup_3DSCreditCard_PaymentError_button;
        } else {
          if (basketData.is3DSCreditCard !== undefined && !basketData.is3DSCreditCard) {
            if (params.ErrorCode === '3401') {
              this.isShowPaymentErrorModel = true;
              this.ErrorPopup_heading = this.localeObj.tf_99_errorCode_3401_PaymentErrorPopup_heading;
              this.ErrorPopup_subTitle = this.localeObj.tf_99_errorCode_3401_PaymentErrorPopup_subTitle;
              this.ErrorPopup_message  = this.localeObj.tf_99_errorCode_3401_PaymentErrorPopup_message;
              this.ErrorButton = this.localeObj.tf_99_errorCode_3401_PaymentErrorPopup_button;
            } else if (params.ErrorCode === '3402') {
              this.isShowPaymentErrorModel = true;
              this.ErrorPopup_heading = this.localeObj.tf_99_errorCode_3402_ValidationErrorPopup_heading;
              this.ErrorPopup_subTitle = this.localeObj.tf_99_errorCode_3402_ValidationErrorPopup_subTitle;
              this.ErrorPopup_message = this.localeObj.tf_99_errorCode_3402_ValidationErrorPopup_message;
              this.ErrorButton = this.localeObj.tf_99_errorCode_3402_ValidationErrorPopup_button;
            } else if (params.ErrorCode === '3403') {
              this.isShowPaymentErrorModel = true;
              this.ErrorPopup_heading =  this.localeObj.tf_99_errorCode_3403_NetworkErrorPopup_heading;
              this.ErrorPopup_subTitle = this.localeObj.tf_99_errorCode_3403_NetworkErrorPopup_subTitle;
              this.ErrorPopup_message  = this.localeObj.tf_99_errorCode_3403_NetworkErrorPopup_message;
              this.ErrorButton = this.localeObj.tf_99_errorCode_3403_NetworkErrorPopup_button;
            }
          }
        }
        if(params.ErrorCode == "408"){
          this.isShowPaymentErrorModel = true;
          this.ErrorPopup_heading =  this.localeObj.tf_4_Checkout_Popup_pgTimeoutError_heading;
              this.ErrorPopup_subTitle = this.localeObj.tf_4_Checkout_Popup_pgTimeoutError_subTitle;
              this.ErrorPopup_message  = this.localeObj.tf_4_Checkout_Popup_pgTimeoutError_message;
              this.ErrorButton = this.localeObj.tf_4_Checkout_Popup_pgTimeoutError_button;
        }
       });
        if (
          basketData.isRoomEdited &&
          basketData.unselectedRooms &&
          basketData.unselectedRooms.length > 0
        ) {
          _.forEach(basketData.unselectedRooms, (value, key) => {
            if (basketData.unselectedRooms[key] !== undefined) {
              basketData.Rooms[key] = value;
            }
          });
        }

        const iataObject = userSettingsData.iata;
        let isIataUpdated = false;
        let isOfferCodeUpdated = false;
        if (
          params[QUERY_PARAM_ATTRIBUTES.IATA] !== undefined &&
          params[QUERY_PARAM_ATTRIBUTES.IATA] !== "" &&
          ((iataObject.iataNumber === undefined &&
            iataObject.iataAgencyName === "" &&
            iataObject.prevIataNumber === "") ||
            (iataObject.iataNumber === "" &&
              iataObject.iataAgencyName === "" &&
              iataObject.prevIataNumber !== "") ||
            (iataObject.iataNumber !== "" &&
              iataObject.iataAgencyName !== "" &&
              params[QUERY_PARAM_ATTRIBUTES.IATA] !== iataObject.iataNumber))
        ) {
          isIataUpdated = true;
        }

        if (
          params[QUERY_PARAM_ATTRIBUTES.OFFERCODE] !== undefined &&
          params[QUERY_PARAM_ATTRIBUTES.OFFERCODE] !== "" &&
          basketData.Rooms.length > 0 &&
          basketData.Rooms[0].RatePlan.code &&
          params[QUERY_PARAM_ATTRIBUTES.OFFERCODE] !==
            basketData.Rooms[0].RatePlan.code
        ) {
          isOfferCodeUpdated = true;
        }
        // If (iata Number or OfferCode) -- added / modified from the url then redirect to Rooms listing page
        if (isIataUpdated || isOfferCodeUpdated) {
          let offerCode: string;
          if (isIataUpdated) {
            offerCode = "";
          } else {
            offerCode = params[QUERY_PARAM_ATTRIBUTES.OFFERCODE];
          }

          const guestSummary = this.storeService.getGuestSummary();
          const newParams = CommonUtility.getQueryParamObjGuestSummary(
            guestSummary,
            this.storeService,
            offerCode
          );

          if (isIataUpdated) {
            newParams[QUERY_PARAM_ATTRIBUTES.IATA] =
              params[QUERY_PARAM_ATTRIBUTES.IATA];
          }
          const navigationExtras = {
            queryParams: newParams,
          };
          this.router
            .navigate(["/" + URL_PATHS.ROOMS_PAGE], navigationExtras)
            .then((data) => CommonUtility.highlightStep("select-room"));
        } // end of if (isIataUpdated || isOfferCodeUpdated)
      }
    ); // end of router subscription

    this.errorCode = 0;
    this.errorFound = false;
    this.errorMsg = "";
    this._userSettingsSubscriptions = this.storeService
      .getUserSettings()
      .subscribe((sharedData) => {
        this.localeObj = sharedData.localeObj;
        this.displayCvv = _.get(sharedData, "propertyInfo.displayCVV");
        if (this.displayCvv === undefined || this.displayCvv === null) {
          this.displayCvv = DISPLAY_CVV;
        }

        if (this.errorFound) {
          const errorStringParams = this.getErrorStringParams();
          const formattedParams = this.applyPriceFormatPipe(
            errorStringParams["prevTotal"],
            errorStringParams["currTotal"],
            errorStringParams["differencePrice"],
            errorStringParams["currencyCode"]
          );
          switch (this.errorCode) {
            case 3012:
              this.errorMsg = CommonUtility.fillMessage(
                this.localeObj.tf_99_errorCode_3012,
                [
                  errorStringParams["currencySymbol"],
                  // formattedParams["differencePrice"],
                  formattedParams["prevTotal"],
                  formattedParams["currTotal"],
                ]
              );
              break;
            case 9001:
              this.errorMsg = CommonUtility.fillMessage(
                this.localeObj.tf_99_errorCode_9001,
                [
                  errorStringParams["currencySymbol"],
                  formattedParams["differencePrice"],
                  formattedParams["prevTotal"],
                  formattedParams["currTotal"],
                ]
              );
              break;
            default:
              break;
          }
        }
      });
    this._errorHandlerSubscription = this.storeService
      .getErrorHandler()
      .subscribe((errorHandler) => {
        this._userSettingsSubscriptions = this.storeService
       .getUserSettings()
       .subscribe((sharedData) => {
        this.localeObj = sharedData.localeObj;      
        this.errorCode = 0;
        this.errorFound = false;
        this.errorMsg = "";
        for (
          let index = 0;
          index < checkErrorCodesList.PriceChangeErrorCodes.length;
          index++
        ) {
          const code = checkErrorCodesList.PriceChangeErrorCodes[index];
          if (_.get(errorHandler.error, code) === true) {
            this.errorCode = code;
            this.errorFound = true;
            const errorStringParams = this.getErrorStringParams();
            const formattedParams = this.applyPriceFormatPipe(
              errorStringParams["prevTotal"],
              errorStringParams["currTotal"],
              errorStringParams["differencePrice"],
              errorStringParams["currencyCode"]
            );
            if (this.localeObj) {
              if (code === 3012) {
                this.errorMsg = CommonUtility.fillMessage(
                  _.get(this.localeObj, error_code_prefix + code),
                  [
                    errorStringParams["currencySymbol"],
                    // formattedParams["differencePrice"],
                    formattedParams["prevTotal"],
                    formattedParams["currTotal"],
                  ]
                );
              } else {
                this.errorMsg = CommonUtility.fillMessage(
                  _.get(this.localeObj, error_code_prefix + code),
                  [
                    errorStringParams["currencySymbol"],
                    formattedParams["differencePrice"],
                    formattedParams["prevTotal"],
                    formattedParams["currTotal"],
                  ]
                );
              }
            }
            this.openModal(this.errorTemplate);
            CommonUtility.focusOnModal('payment-confirmation-error-modal');
            break;
          }
        }
        for (
          let index = 0;
          index < checkErrorCodesList.PolicyChangeErrorCodes.length;
          index++
        ) {
          const code = checkErrorCodesList.PolicyChangeErrorCodes[index];
          if (_.get(errorHandler.error, code) === true) {
            this.errorCode = code;
            this.errorFound = true;
            const errorStringParams = this.getErrorStringParams();
            const formattedParams = this.applyPriceFormatPipe(
              errorStringParams["prevTotal"],
              errorStringParams["currTotal"],
              errorStringParams["differencePrice"],
              errorStringParams["currencyCode"]
            );
            if (this.localeObj) {
              this.errorMsg = CommonUtility.fillMessage(
                _.get(this.localeObj, error_code_prefix + code),
                [
                  errorStringParams["currencySymbol"],
                  formattedParams["differencePrice"],
                  formattedParams["prevTotal"],
                  formattedParams["currTotal"],
                ]
              );
            }
            this.openModal(this.errorTemplate);
            CommonUtility.focusOnModal('payment-confirmation-error-modal');
            break;
          }
        }
      });
    });
    this._basketSubscription = this.storeService
      .getBasket()
      .subscribe((sharedData) => {
        this.prevPaymentMethod = _.get(
          sharedData.ManageRoomBooking,
          "PaymentInfo.cardType"
        );

        if (sharedData.Rooms.length > 0 ) {
            if (sharedData.Rooms[0].RatePlan.directbill) {
              this.displayPaymentMethods = false;
            } else {
              this.displayPaymentMethods = true;
            }
        }
        if (
          this.storeService.getBasketState().isRvngModifyFlow &&
          _.get(
            this.storeService.getUserSettingsState(),
            "propertyInfo.propertyType"
          ) === "RVNG" &&
          !this.storeService.getBasketState().isRateCalModify
        ) {
          this.openModal(this.bummer);
          CommonUtility.focusOnModal('rvng-bummer-modal');
          setTimeout(() => {
            this.ngxSpinner.hide();
          }, 100);
          const errorStringParams = this.getErrorStringParams();
          const currencyCode = errorStringParams["currencyCode"];
          const totalPriceByCurrency = _.get(
            sharedData.ManageRoomBooking.Pricing,
            "TotalPriceByCurrency"
          )[currencyCode];
          const formattedParams = this.applyPriceFormatPipe(
            totalPriceByCurrency
              ? totalPriceByCurrency
              : _.get(
                  sharedData.ManageRoomBooking.Pricing,
                  "TotalPriceByCurrency"
                ),
            errorStringParams["currTotal"],
            errorStringParams["differencePrice"],
            errorStringParams["currencyCode"]
          );
          const newArrivalDate = CommonUtility.getTranslatedDateStr(
            _.get(sharedData.GuestSummary, "checkindate"),
            this.localeObj
          );
          const newDepartureDate = CommonUtility.getTranslatedDateStr(
            _.get(sharedData.GuestSummary, "checkoutdate"),
            this.localeObj
          );
          const formatedArrivalDate = new Date(
            _.get(sharedData.oldData, "prevArrivalDate").replace(/-/g, "/")
          );
          const prevArrivalDate = CommonUtility.getTranslatedDateStr(
            formatedArrivalDate,
            this.localeObj
          );
          const formatedDepDate = new Date(
            _.get(sharedData.oldData, "prevDepartureDate").replace(/-/g, "/")
          );
          const prevDepartureDate = CommonUtility.getTranslatedDateStr(
            formatedDepDate,
            this.localeObj
          );
          this.confirmModifyMsg = CommonUtility.fillMessage(
            this.localeObj.tf_99_RVNG_Confirm_Modify_Reser,
            [
              errorStringParams["currencySymbol"],
              formattedParams["differencePrice"],
              formattedParams["prevTotal"],
              formattedParams["currTotal"],
              _.get(sharedData.Rooms[0], "RoomDetails.roomType"),
              _.get(sharedData.oldData, "prevRoom"),
              prevArrivalDate,
              prevDepartureDate,
              _.get(sharedData, "ReservationID"),
              newArrivalDate,
              newDepartureDate,
            ]
          );
        }
        if (this.errorFound) {
          const errorStringParams = this.getErrorStringParams();
          const formattedParams = this.applyPriceFormatPipe(
            errorStringParams["prevTotal"],
            errorStringParams["currTotal"],
            errorStringParams["differencePrice"],
            errorStringParams["currencyCode"]
          );
          switch (this.errorCode) {
            case 3012:
              this.errorMsg = CommonUtility.fillMessage(
                this.localeObj.tf_99_errorCode_3012,
                [
                  errorStringParams["currencySymbol"],
                  // formattedParams["differencePrice"],
                  formattedParams["prevTotal"],
                  formattedParams["currTotal"],
                ]
              );
              break;
            case 9001:
              // this.errorMsg = _.get(this.localeObj, 'tf_99_errorCode_9001');
              this.errorMsg = CommonUtility.fillMessage(
                this.localeObj.tf_99_errorCode_9001,
                [
                  errorStringParams["currencySymbol"],
                  formattedParams["differencePrice"],
                  formattedParams["prevTotal"],
                  formattedParams["currTotal"],
                ]
              );
              break;
            default:
              break;
          }
        }
      });
    CommonUtility.highlightStep("guest-info");
    this.manualCreditCard = false; // for amex manual credit card
    this.isManageBookingFlow = this.storeService.getManageBookingFlowStatus();
    this.transactionaApiCount = 0;
    const rateCode = _.get(
      this.storeService.getBasketState().Rooms[0],
      "RatePlan.code"
    );
    this.paymentservice.getPaymentMethods(rateCode);
    this.paymentservice.paymentMethodsData.subscribe((jsonData) => {
      this.cardPaymentMethods = jsonData.data;
    });

    // Data-Layer Payment
    // For each room booked an entry will be generated in the quoteList array
    // Each entry in the quoteList array will have quoteObj attributes
    this.storeService.getBasket().subscribe((data) => {
      const roomsData = this.storeService.getBasketState().Rooms;
      this.userPreference = data.GuestSummary;

      const quotelist = [];
      for (const room of roomsData) {
        if (room.length !== 0) {
          const listItems = {
            r: room.Pricing ? room.Pricing.PackagePrice : "", // Room Rate without tax & fees
            taxesAndFees: room.Pricing ? room.Pricing.Tax : "", // Tax & fees
            grandTotal: room.Pricing ? room.Pricing.TotalPrice : "", // Room Rate with tax & fees
            rc: room.RatePlan ? room.RatePlan.code : "", // Rate Plan code
            ratePlanName: room.RatePlan ? room.RatePlan.name : "", // Rate Plan name
            rt: room.RoomDetails ? room.RoomDetails.code : "", // Room type code
            roomTypeName: room.RoomDetails ? room.RoomDetails.name : "", // Room Type name
            cc: room.CurrencyCode, // Currency Code
            sd: CommonUtility.formateDate(this.userPreference.checkindate), // Check-in date
            ed: CommonUtility.formateDate(this.userPreference.checkoutdate), // Check-out date
            na: this.userPreference.guests[room.roomIndex].adults, // Number of Adults
            nc: this.userPreference.guests[room.roomIndex].children, // Number of Children
            numRooms: this.userPreference.rooms, // Number of rooms booked
            nn: this.userPreference.los, // Number of nights
            bedType: room.BedTypeName, // Bed Type
          };
          quotelist.push(listItems);
        }
      }

      /* Data-Layer Details
     detailsObj object gets created for all the rate plans available w.r.t. to the room selected
     Each room details are added to roomList array
     */
      const detailsList = [];
      for (const room of roomsData) {
        const roomsList = [];
        if (data.availRatePlans.length > 0) {
          for (const ratePlans of data.availRatePlans.availableRatePlans) {
            const detailsObj = {
              r: _.get(
                ratePlans,
                "averagePriceByCurrency." + room.CurrencyCode
              ), // Room Rate without tax & fees
              taxesAndFees: _.get(
                ratePlans,
                "taxesAndServiceChargesByCurrency." + room.CurrencyCode
              ), // Tax & fees
              rc: ratePlans.code, // Rateplan code
              rt: room.RoomDetails.code, // Room type code
              roomTypeName: room.RoomDetails.name, // Room Type name
              cc: room.CurrencyCode, // Currency Code
              sd: CommonUtility.formateDate(this.userPreference.checkindate), // Check-in date
              ed: CommonUtility.formateDate(this.userPreference.checkoutdate), // Check-out date
              na: this.userPreference.guests[room.roomIndex].adults, // Number of Adults
              nc: this.userPreference.guests[room.roomIndex].children, // Number of Children
              numRooms: this.userPreference.rooms, // Number of rooms booked
              nn: this.userPreference.los, // Number of nights
              bedType: room.BedTypeName, // Bed Type
            };
            roomsList.push(detailsObj);
          }
          detailsList.push(roomsList);
        } else {
          /** This case will only be applicable for promo/specials details
           *  In this scenario the rateplan is selected before the room,
           *  Hence only one rateplan and room will be available
           */

          const roomList = quotelist[0];
          if (roomList) {
            delete roomList["grandTotal"];
          }
          detailsList.push([roomList]);
        }
      }

      CommonUtility.setDatalayer({
        rt4OFFERCODE: this._activatedRoute.snapshot.queryParams.offerCode, // Offer-code from the route Params
        quoteList: quotelist, // Data-Layer Payment's quote list
        quoteList2: detailsList, // Data-Layer Detail's quote list
        // Empty error state in data layer, in case of pre existing error
        error_type: "",
        error_code: "",
        error_description: "",
      });

      // Data-Layer Reservation-Modification
      if (this.storeService.getManageBookingFlowStatus()) {
        CommonUtility.setDatalayer({
          rtPAGENAME: "ChangeRes_" + CommonUtility.getPageName(),
          // Empty error state in data layer, in case of pre existing error
          error_type: "",
          error_code: "",
          error_description: "",
        });
      }
    });

    // checkoutPageFunc() - Checkout Page scripts from admin
    if (window["checkoutPageFunc"]) {
      window["checkoutPageFunc"]();
    }

    // Access Code Bummer in promo flow - updates initial store values
    if (
      this.storeService.getBasketState().isPromoFlow ||
      !!this.storeService.getBasketState().promoData.accessCode
    ) {
      const accessCode = "";
      const bummerObj = {
        accessCodeBummer: accessCode,
        prevRoute: location.pathname,
        displayBummer: false,
      };
      this.storeService.updatePromoBummer(bummerObj);
    }
    this.validateAvailAddons();

    this.observer = this.breakpointObserver
      .observe(["(max-width: 767px)"]).subscribe((state: BreakpointState) => {
        if (state.matches) {
          this.mobileScreen = true;
        } else {
          this.mobileScreen = false;
        }
      });
    this.storeService.setLocationForFilters(location.pathname);
  }

  ngAfterViewInit(): void {
    const error_code = this._activatedRoute.snapshot.queryParamMap.get(
      "error_code"
    );
    if (error_code) {
      this.storeService.setError(Number(error_code));
      CommonUtility.scrollIntoViewName("PaymentMethod", { block: "start" });
    } else {
      this.storeService.setError(0);
      CommonUtility.scrollIntoViewName("Container", { block: "start" });
    }
  }

  ngOnDestroy() {
    if (window["unloadCheckoutPageFunc"]) {
      window["unloadCheckoutPageFunc"]();
    }
    if (this.modalRef !== undefined) {
      this.modalRef.hide();
    }
    const subscriptionsList = [
      this._userSettingsSubscriptions,
      this._errorHandlerSubscription,
      this._basketSubscription,
      this.mpgsSessionSubscription,
      this.mpgsTransactionSubscription,
      this.observer,
    ];
    CommonUtility.removeSubscriptions(subscriptionsList);
    window["MPGScancel"] = undefined;
    window["MPGSsuccess"] = undefined;
    window["MPGSerror"] = undefined;
  }

  checkAvailableUpgradesEvent() {
    this.availableUpgrades
      ? this.availableUpgrades.checkAvailableUpgradesEvent()
      : false;
  }

  getErrorStringParams() {
    const rooms = this.storeService.getBasketState().Rooms;
    const currencySymbol = rooms[0].Pricing.CurrencySymbol;
    const currencyCode = rooms[0].Pricing.CurrencyCode;
    let prevTotal = 0;
    let currTotal = 0;
    let differenceTotal = 0;
    rooms.forEach((element) => {
      if (
        _.get(element, "oldPricing") !== undefined &&
        _.get(element, "oldPricing.TotalPrice") !== undefined
      ) {
        prevTotal = prevTotal + _.get(element, "oldPricing.TotalPrice");
      } else {
        prevTotal = prevTotal + 0;
      }
      currTotal = currTotal + _.get(element, "Pricing.TotalPrice");
    });
    differenceTotal = Math.abs(prevTotal - currTotal);
    const returnObj = {
      currencyCode,
      currencySymbol,
      prevTotal,
      currTotal,
      differencePrice: differenceTotal,
    };
    return returnObj;
  }

  applyPriceFormatPipe(prevTotal, currTotal, differenceTotal, currencySymbol) {
    let prevPrice = "";
    let currPrice = "";
    let differencePrice = "";
    if (
      prevTotal !== undefined &&
      currTotal !== undefined &&
      differenceTotal !== undefined &&
      prevTotal !== null &&
      currTotal !== null &&
      differenceTotal !== null &&
      !isNaN(prevTotal) &&
      !isNaN(currTotal) &&
      !isNaN(differenceTotal)
    ) {
      prevPrice = this.pricePipe.transform(prevTotal, "", currencySymbol);
      currPrice = this.pricePipe.transform(currTotal, "", currencySymbol);
      differencePrice = this.pricePipe.transform(
        differenceTotal,
        "",
        currencySymbol
      );
    }
    const returnObj = {
      currencySymbol,
      prevTotal: prevPrice,
      currTotal: currPrice,
      differencePrice,
    };
    return returnObj;
  }

  openModal(template: TemplateRef<any>) {
    if (this.modalRef === undefined) {
      this.modalRef = this.modalService.show(template, { class: "modal-md" });
    } else {
      return;
    }
  }

  validateGuestInfo(guestInfoData: any) {
    const guestDetailsValidationSettings = CommonUtility.getGuestDetailsValidationSettings();
    if (
      guestInfoData.firstName === "" ||
      guestInfoData.firstName === null ||
      guestInfoData.firstName === undefined
    ) {
      return false;
    }
    if (
      guestInfoData.lastName === "" ||
      guestInfoData.lastName === null ||
      guestInfoData.lastName === undefined
    ) {
      return false;
    }
    if (
      guestDetailsValidationSettings.displayPhoneNumber &&
      guestDetailsValidationSettings.phoneNumberRequired
    ) {
      if (
        guestInfoData.phoneNumber === "" ||
        guestInfoData.phoneNumber === null ||
        guestInfoData.phoneNumber === undefined
      ) {
        return false;
      }
    }
    if (
      guestInfoData.emailAddress === "" ||
      guestInfoData.emailAddress === null ||
      guestInfoData.emailAddress === undefined
    ) {
      return false;
    }
    if (
      guestDetailsValidationSettings.displayCity &&
      guestDetailsValidationSettings.cityRequired
    ) {
      if (
        guestInfoData.city === "" ||
        guestInfoData.city === null ||
        guestInfoData.city === undefined
      ) {
        return false;
      }
    }
    if (
      guestDetailsValidationSettings.displayState &&
      guestDetailsValidationSettings.stateRequired
    ) {
      if (
        guestInfoData.state === "" ||
        guestInfoData.state === null ||
        guestInfoData.state === undefined
      ) {
        return false;
      }
    }
    if (guestDetailsValidationSettings.displayAddressLine1) {
      if (
        guestInfoData.streetAddress1 === "" ||
        guestInfoData.streetAddress1 === null ||
        guestInfoData.streetAddress1 === undefined
      ) {
        return false;
      }
    }
    if (
      guestDetailsValidationSettings.displayAddressLine2 &&
      guestDetailsValidationSettings.addressLine2Required
    ) {
      if (
        guestInfoData.streetAddress2 === "" ||
        guestInfoData.streetAddress2 === null ||
        guestInfoData.streetAddress2 === undefined
      ) {
        return false;
      }
    }
    if (
      guestDetailsValidationSettings.displayZipcode &&
      guestDetailsValidationSettings.zipCodeRequired
    ) {
      if (
        guestInfoData.postalCode === "" ||
        guestInfoData.postalCode === null ||
        guestInfoData.postalCode === undefined
      ) {
        return false;
      }
    }

    // tslint:disable-next-line:max-line-length
    const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (
      (!/^([0-9]+)$/.test(guestInfoData.phoneNumber) &&
        guestDetailsValidationSettings.phoneNumberRequired) ||
      !emailCharactersRegex.test(guestInfoData.emailAddress) ||
      !emailRegex.test(guestInfoData.emailAddress)
    ) {
      return false;
    }
    return true;
  }

  validatePaymentInfo(paymentData: any) {
    const paymentCardType = _.find(this.cardPaymentMethods, {
      code: paymentData.cardType,
    });
    if (!!paymentCardType) {
      this.isLinkedToPaymentGateway = paymentCardType.isLinkToPaymentGateway;
    }
    paymentData.validCard = true;
    if (paymentData.cardType === PAYMENT_CARD_TYPE.ALI) {
      return true;
    }
    if (this.isManageBookingFlow && this.paymentMethod !== undefined) {
      if (  this.paymentMethod.CheckforManageBookingPayment()) {
        return true;
      }
    }
    if (
      this.manualCreditCard === false &&
      this.isLinkedToPaymentGateway &&
      (paymentData.cardType === PAYMENT_CARD_TYPE.AMEX ||
        paymentData.cardType === PAYMENT_CARD_TYPE.VISA ||
        paymentData.cardType === PAYMENT_CARD_TYPE.MASTER_CARD)
    ) {
      return true;
    }
    if (paymentData.cardType === PAYMENT_CARD_TYPE.CHINA_UNION_PAY) {
      const cardVal = (paymentData.cardNumber + "").replace(/\D/g, "");
      if (
        cardVal.length !== 13 &&
        !(cardVal.length >= 16 && cardVal.length <= 19)
      ) {
        return false;
      }
    }
    if (
      paymentData.cardType !== PAYMENT_CARD_TYPE.ALI &&
      paymentData.cardType !== PAYMENT_CARD_TYPE.CHINA_UNION_PAY
    ) {
      const cardType = $["payment"].cardType(paymentData.cardNumber);
      const cardNumFlag = $["payment"].validateCardNumber(
        paymentData.cardNumber
      );
      if (cardType !== paymentData.cardType) {
        return false;
      }
      if (!cardNumFlag) {
        return false;
      }
    }
    if (
      paymentData.cardHolderName === "" ||
      paymentData.cardHolderName === null ||
      paymentData.cardHolderName === undefined
    ) {
      return false;
    }
    if (
      paymentData.expMonth === "" ||
      paymentData.expMonth === null ||
      paymentData.expMonth === undefined
    ) {
      return false;
    }
    if (
      paymentData.expYear === "" ||
      paymentData.expYear === null ||
      paymentData.expYear === undefined
    ) {
      return false;
    }
    if (
      paymentData.cardNumber === "" ||
      paymentData.cardNumber === null ||
      paymentData.cardNumber === undefined
    ) {
      return false;
    }
    if (this.displayCvv) {
      if (
        paymentData.securityCode === "" ||
        paymentData.securityCode === null ||
        paymentData.securityCode === undefined
      ) {
        return false;
      }
    } else {
      return true;
    }
    // if (!/^([A-Za-z ]+)$/.test(paymentData.cardHolderName)) {
    //   return false;
    // }
    /*if (paymentData.cardType === PAYMENT_CARD_TYPE.AMEX) {
      if (!/^([0-9]{15})$/.test(paymentData.cardNumber)) {
        return false;
      }
    } else {
      if (!/^([0-9]{16})$/.test(paymentData.cardNumber)) {
        return false;
      }
    }*/
    const userSettingsState = this.storeService.getUserSettingsState();
    const propertyTimeZoneOffset = _.get(
      userSettingsState,
      "propertyInfo.propertyTimezone.timezoneOffset"
    );
    const currDate = CommonUtility.getCurrentDateFromPropertyTimeZone(
      propertyTimeZoneOffset
    );
    if (
      +paymentData.expYear === currDate.getFullYear() &&
      +paymentData.expMonth < currDate.getMonth() + 1
    ) {
      return false;
    }

    if (this.paymentMethod !== undefined) {
      const checkExpiry = this.paymentMethod.checkExpiryDate(
        paymentData.expMonth,
        paymentData.expYear
      );
      if (!checkExpiry) {
        return false;
      }
    }

    return true;
  }

  tokenizeCard(cardDetails: CreditCardDetails): Observable<any> {
    const guestInfoData = this.guestInfoForm.getGuestFormData();
    cardDetails["propertyCode"]= this.storeService.getUserSettingsState().propertyInfo.propertyCode;
    cardDetails["emailId"] = guestInfoData.emailAddress || null;
    cardDetails["zipCode"] = guestInfoData.postalCode || null;
    return this._authHttp.post(SESSION_URL_CONST.TOKENIZE_CARD, cardDetails);
  }

  resetPreferences(event: any) {
    this.guestInfoForm.resetPreferences(event);
  }

  navigateError(error_code: string) {
    this.storeService.setError(Number(error_code));
    const rooms = this.storeService.getBasketState().rooms;
    const errorCode = error_code;
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
    this.router.navigate(["/" + URL_PATHS.GUEST_INFO_PAGE], navigationExtras);
  }

  processPaymentFromBummer() {
    this.closeBummerPopUp();
    // this.processPayment();
  }

  closeBummerPopUp() {
    if (this.modalRef !== undefined) {
      this.modalRef.hide();
    }
    this.modalRef = undefined;
    this.storeService.removeError(this.errorCode);
    // if (this.errorCode === 9003) {
    //   this.scrollToAlacarteAddons();
    // }
    this.errorCode = 0;
    this.errorFound = false;
    this.errorMsg = "";
  }

  // validateAddtionalGuests(addionalGuestInfo: any) {
  //   let count = 0;
  //   const roomCnt = this.storeService.getBasketState().Rooms.length;
  //   if (roomCnt === 1) {
  //     addionalGuestInfo.forEach(element => {
  //       if (!this.validateNameField(element.first_name) ||
  //       !this.validateNameField(element.last_name)) {
  //         count++;
  //       }
  //     });
  //   } else {
  //       if (addionalGuestInfo.length > 0) {
  //         addionalGuestInfo.forEach(guestByRoom => {
  //           guestByRoom.forEach(element => {
  //             if (!this.validateNameField(element.first_name) ||
  //             !this.validateNameField(element.last_name)) {
  //               count++;
  //             }
  //           });
  //         });
  //       }
  //   }
  //   return (count > 0) ? false : true;
  // }

  // validateNameField(additionalGuestName?: string) {
  //   if (
  //     additionalGuestName === null ||
  //     additionalGuestName === undefined ||
  //     additionalGuestName === ""
  //     ) {
  //       return true;
  //     } else {
  //       return false;
  //     }
  // }

  processPayment(isPopupProceed) {
    if (this.modalRef !== undefined) {
      this.closeBummerPopUp();
      this.storeService.updateRvngModifyFlag(false);
    }
    this.storeService.updateRateCalModifyFlag(false);
    const guestInfoData = this.guestInfoForm.getGuestFormData();
    let paymentData;

  // If Direct Bill Policy Rateplan  - then hide payment section and send Dummy CC details -- Else Normal flow
    if (this.storeService.isDirectBillPolicySelected()) {
      paymentData = this.storeService.setDummyCreditCardDetails();
    } else {
      paymentData = this.paymentMethod.getPaymentData();
      const ISnewcardused = this.paymentMethod.isNewCardUsed();
    }
    const packageAvailableError = this.packageListing.getPackageAvailableFlag();
    const guestInfoValidation = this.validateGuestInfo(guestInfoData);
    const paymentMetodValidation = this.validatePaymentInfo(paymentData);
    const preferencesValidation = this.guestInfoForm.validatePreferences();
    const termsFlag = this.guestInfoFooter.getTermsConditionsFlag();

// Start - Validation check for AdditionalGuests
    const roomCnt = this.storeService.getBasketState().Rooms.length;
    let additionalGuestsInfoValidation = false;
    // if (this.displayAdditionalGuestsConfig) {
    //   if (roomCnt === 1) {
    //     additionalGuestsInfoValidation = this.validateAddtionalGuests(this.guestInfoForm.addtionalGuestInfoByRoom);
    //   } else {
    //     const multiRoomAddtionalGuests = this.guestInfoForm.getMultiRoomAdditionalGuests();
    //     additionalGuestsInfoValidation = this.validateAddtionalGuests(multiRoomAddtionalGuests);
    //   }
    // }
// End - Validation check for AdditionalGuests

    if (
      packageAvailableError ||
      !guestInfoValidation ||
      !paymentMetodValidation ||
      preferencesValidation !== -1 ||
      termsFlag === undefined ||
      termsFlag ||
      (!paymentMetodValidation && !this.isLinkedToPaymentGateway)
    ) {
      let ele;
      this.guestInfoForm.showValidationErrors(guestInfoData);
      // this.paymentMethod.showValidationErrors(paymentData);

// Start -- Show Addtional guest validation errors (singleroom/multiroom)
      // if (
      //   this.displayAdditionalGuestsConfig &&
      //   !additionalGuestsInfoValidation) {
      //   if (roomCnt === 1) {
      //     this.guestInfoForm.showAddGuestsInfoErrors();
      //   } else {
      //     this.guestInfoForm.showMutiRoomGuestsValidationErrors();
      //   }
      // }

      if (!this.storeService.isDirectBillPolicySelected()) {
        this.paymentMethod.showValidationErrors(paymentData);
      }
      // if (packageAvailableError) {
      //   ele = document.querySelector('.PackageListing');
      // } else if (!guestInfoValidation) {
      //   ele = document.querySelector('.GuestInfoForm');
      // } else if (!paymentMetodValidation) {
      //   ele = document.querySelector('.PaymentMethod');
      // } else if (termsFlag === undefined || termsFlag) {
      //   ele = document.querySelector('.TermsAndConditions');
      // }
      if (!guestInfoValidation) {
        this.setTimerOutScrollIntoView();
        $("div.error input").first().focus();
      // } else if (this.displayAdditionalGuestsConfig && !additionalGuestsInfoValidation) {
      //   this.setTimerOutScrollIntoView();
      //   $("div.error input").first().focus();
      } else if (preferencesValidation !== -1) {
        ele = document.querySelector(".RoomPreference" + preferencesValidation);
        if (ele !== undefined && ele !== null) {
          ele.scrollIntoView({ behavior: "smooth" });
          setTimeout(() => {
            this.ngxSpinner.hide();
            this.ngxSpinner.hide("reservationLoader");
          }, 100);
        }
      } else if (!paymentMetodValidation) {
        ele = document.querySelector('.PaymentMethod');
        this.setTimerOutScrollIntoView();
        $("#payment-method").focus();
      } else if (termsFlag === undefined || termsFlag) {
        ele = document.querySelector('.TermsAndConditions');
        this.setTimerOutScrollIntoView();
        $("#tc_error").focus();
      }
      return;
    }
    const prefPresent = [];
    if (this.showPref) {
      this.storeService.getBasketState().Rooms.forEach((element) => {
        if (element.GuestPreference) {
          prefPresent.push(false);
        } else {
          prefPresent.push(true);
        }
      });
    }

// Start -- update guest info to store
    for (let j = 0; j < roomCnt; j++) {
      const guestInfo = this.guestInfoForm.getGuestFormData();
      localStorage.setItem("guestDetails", JSON.stringify(guestInfo));
      this.storeService.upsertSingleRoomGuestInfo(guestInfo, j);
    }
    this.storeService.updateGuestInfo(this.guestInfoForm.getGuestFormData());
// End -- update guest info to store

// Start - Update Additional Guests info to the store
    if (roomCnt === 1) {
      // Single room
      const additionalGuestsInfo = this.guestInfoForm.getAddtionalGuests();
      localStorage.setItem("additionalGuestInfo", JSON.stringify(additionalGuestsInfo));
      if (additionalGuestsInfo.length > 0) {
        this.storeService.updateRoomAddionalGuests(additionalGuestsInfo, 0);
      }
     } else {
    // Multi room
      // start - Data retain on refresh
      let currLocalStorageGuests: any;
      currLocalStorageGuests = JSON.parse(localStorage.getItem("additionalGuestInfo"));
      for (let j = 0; j < roomCnt; j++) {
        const additionGuestsByRoom = this.guestInfoForm.setAdditionalGuests(j) || [];
        if (currLocalStorageGuests === undefined || currLocalStorageGuests === null) {
          currLocalStorageGuests = [];
          currLocalStorageGuests[j] = [];
        }
        currLocalStorageGuests[j] = additionGuestsByRoom;
        localStorage.setItem("additionalGuestInfo", JSON.stringify(currLocalStorageGuests));
      // end - Data retain on refresh
        if (additionGuestsByRoom.length > 0) {
          this.storeService.updateRoomAddionalGuests(additionGuestsByRoom, j);
        }
      }
    }
// End - Update Additional Guests info to the store

    if (this.showPref) {
      for (let j = 0; j < roomCnt; j++) {
        const guestPref = this.guestInfoForm.getGuestPreferences(j);
        this.storeService.upsertSingleRoomGuestPreference(guestPref, j);
      }
    }
    paymentData.cardNumber = (paymentData.cardNumber + "").replace(/\D/g, "");
    this.storeService.upsertSingleRoomPaymentInfo(paymentData);
    this.storeService.updateMarketingConsent(
      this.guestInfoFooter.consentAccepted
    );
    let resDetails = new Array<ReservationDetails>();
    resDetails = this.storeService.getReservationDetails();
    this.storeService.removeErrors(
      ErrorCodesListInComponents.PaymentMethodComponent
    );

    if (resDetails) {
      const payNow = _.get(
        this.storeService.getBasketState().Rooms[0],
        "RatePlan.payNow"
      );
      const payLater = _.get(
        this.storeService.getBasketState().Rooms[0],
        "RatePlan.payLater"
      );

    // set payNow/Later payment options to the  payload
        if (
          this.displayPaymentMethods &&
          this.paymentMethod &&
          this.paymentMethod.showPaymentOptions
          ) {
          for (let index = 0; index < resDetails.length; index++) {
            if (this.paymentMethod.paymentOption === 'payNow') {
              resDetails[index].payNow = true;
              resDetails[index].payLater = false;
            }
            if (this.paymentMethod.paymentOption === 'payLater') {
              resDetails[index].payNow = false;
              resDetails[index].payLater = true;
            }
          }
        }

      if (paymentData.cardType === PAYMENT_CARD_TYPE.ALI) {
        for (let index = 0; index < resDetails.length; index++) {
          resDetails[index].cardType = paymentData.cardType;
        }
        this.alipayService.proceedReservationForAlipay(resDetails);
      } else if (
        paymentData.cardType === PAYMENT_CARD_TYPE.AMEX ||
        paymentData.cardType === PAYMENT_CARD_TYPE.MASTER_CARD ||
        paymentData.cardType === PAYMENT_CARD_TYPE.VISA ||
        paymentData.cardType === PAYMENT_CARD_TYPE.CARTE_BLANCHE
      ) {
        if (this.currentPayMethod !== paymentData.cardType) {
          this.currentPayMethod = paymentData.cardType;
          this.MpgsPopup.scriptsForMpgs(paymentData.cardType);
        }
        const guaranteePercentage = _.get(
          this.storeService.getBasketState().Rooms[0],
          "RatePlan.guaranteePercentage"
        );
        this.payAndStay = CommonUtility.ifPayAndStay(guaranteePercentage);
        for (let index = 0; index < resDetails.length; index++) {
          resDetails[index].cardType = paymentData.cardType;
        }
        if (this.manualCreditCard || !this.isLinkedToPaymentGateway) {
          this.paymentservice.proceedReservationForManualCardPayments(
            resDetails,
            this.isManageBookingFlow,
            isPopupProceed
          );
        } else {
          if (this.payAndStay) {
            this.checkCount = 3;
          } else {
            this.checkCount = 1;
          }
          this.MPGSSessionRequestSubscribe(resDetails);
        }
      } else if (
        paymentData.cardType === PAYMENT_CARD_TYPE.JAPAN_CREDIT_BUREAU ||
        paymentData.cardType === PAYMENT_CARD_TYPE.CHINA_UNION_PAY ||
        paymentData.cardType === PAYMENT_CARD_TYPE.DISCOVER ||
        paymentData.cardType === PAYMENT_CARD_TYPE.DINERS_CLUB
      ) {
        if (this.isManageBookingFlow) {
          for (let index = 0; index < resDetails.length; index++) {
            resDetails[index].creditCardDetails.cardHolderName =
              paymentData.cardHolderName;
            resDetails[index].creditCardDetails.cardNumber =
              paymentData.cardNumber;
            resDetails[index].creditCardDetails.cardType = paymentData.cardType;
            resDetails[index].creditCardDetails.expMonth = paymentData.expMonth;
            resDetails[index].creditCardDetails.expYear = paymentData.expYear;
            resDetails[index].creditCardDetails.securityCode =
              paymentData.securityCode;
          }
        }
        this.paymentservice.proceedReservationForOtherCardPayments(
          resDetails,
          this.isManageBookingFlow,
          isPopupProceed
        );
      } else if (this.isManageBookingFlow) {
        const rs = resDetails[0];
        if (this.prevPaymentMethod === PAYMENT_CARD_TYPE.ALI) {
          if (
            !this.guestInfoFooter.compareBookingAmount() ||
            this.guestInfoFooter.sameAmountFlag
          ) {
            this.paymentservice.AlipayResponseForStayAndPay(resDetails);
          } else {
            this.alipayService.proceedReservationForAlipay(resDetails);
          }
        } else if (CommonUtility.checkForMPGSCardType(this.prevPaymentMethod)) {
          this.paymentservice.MPGSSessionResponseForMBStayAndPay(resDetails);
        } else {
          this.paymentservice.proceedForManageBookingStayandPay(
            rs,
            this.isManageBookingFlow
          );
        }
      }
    }
  }

  setTimerOutScrollIntoView() {
    setTimeout(() => {
      this.ngxSpinner.hide();
      this.ngxSpinner.hide("reservationLoader");
      const errorElements = document.querySelectorAll(".ScrollToElement");
      if (
        errorElements !== undefined &&
        errorElements !== null &&
        errorElements.length > 0
      ) {
        errorElements[0].scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "nearest",
        });
      }
    }, 100);
  }

  MPGSSessionRequestSubscribe(resDetails: ReservationDetails[]) {
    let error_code;
    this.mpgsSessionSubscription = this.mpgsPaymentService
      .MPGSSessionRequestURL(resDetails)
      .subscribe((result) => {
        const statusCode = _.get(result, "status.statusCode");
        let status;
        status = this.storeService.setError(statusCode);
        const mpgsSessionResponse: MPGSgetSession = _.get(result, "data");
        this.storeService.updateMPGSSesResp(mpgsSessionResponse);
        if (status && statusCode === 1000) {
          this.spinner.start(MPGS_SCRIPT_ID);
          this.iFrameCount = 3;
          setTimeout(() => {
            const paymantInfo = this.paymentMethod.getPaymentData();
            const isGuestPaymentCurrencyExists = this.storeService.getBasketState()
              .isPaymentCurrencyExists;
            const guestPaymentCurrencyCode = this.storeService.getBasketState()
              .paymentCurrencyCode;
            if (
              this.payAndStay &&
              CommonUtility.checkForMPGSCardType(paymantInfo.cardType) &&
              isGuestPaymentCurrencyExists &&
              guestPaymentCurrencyCode !== ""
            ) {
              // set a flag here to popup for currency update in payload
              this.MpgsPopup.isPaymentCurrencyExists = true;
              this.MpgsPopup.isPaymentCurrSetToPropDefCurrCode = this.paymentMethod.isPrefCurrSetToPropDefaultCurr;
              this.MpgsPopup.setPaymentCurrencyCode();
              this.MpgsPopup.setTotalPrice();
            } else {
              this.MpgsPopup.isPaymentCurrencyExists = false;
              this.MpgsPopup.isPaymentCurrSetToPropDefCurrCode = this.paymentMethod.isPrefCurrSetToPropDefaultCurr;
              this.MpgsPopup.setPaymentCurrencyCode();
              this.MpgsPopup.setTotalPrice();
            }
            this.MpgsPopup.onPayWithMPGSLightBox(!this.payAndStay, 30);
          }, 2000);
          const paymentData = this.paymentMethod.getPaymentData();
          if (
            this.currentCard !== paymentData.cardType ||
            this.isErrorOrSuccessCallback
          ) {
            GuestCreditCardPageComponent.callbackCounter++;
            this.currentCard = paymentData.cardType;
            this.isErrorOrSuccessCallback = false;
          }
          this.transactionaApiCount =
            GuestCreditCardPageComponent.callbackCounter;
          window["GuestCreditCardPageComponent"] = this;
          window["MPGSsuccess"] = function () {
            GuestCreditCardPageComponent.callbackCounter--;
            if (GuestCreditCardPageComponent.callbackCounter === 0) {
              const self = window[
                "GuestCreditCardPageComponent"
              ] as GuestCreditCardPageComponent;
              self.isErrorOrSuccessCallback = true;
              GuestCreditCardPageComponent.callbackCounter++;
              const successID = arguments[0];
              self.logger.debug(
                [
                  mpgsSessionResponse.orderId,
                  "MPGS Success callback called for ORN",
                  mpgsSessionResponse.orderId,
                  "successID",
                  successID,
                ].join(" :: ")
              );
              self._zone.run(() => {
                self.paymentservice.proceedReservationForMPGSCardPayments(
                  successID
                );
              });
              // self.paymentservice.proceedReservationForAmexCardPayments(resDetails, arguments[0]);
            }
          };
          window["MPGSerror"] = function (error) {
            GuestCreditCardPageComponent.callbackCounter--;
            if (GuestCreditCardPageComponent.callbackCounter === 0) {
              const self = window[
                "GuestCreditCardPageComponent"
              ] as GuestCreditCardPageComponent;
              self.isErrorOrSuccessCallback = true;
              if (self.iFrameCount > 1) {
                self.iFrameCount--;
                GuestCreditCardPageComponent.callbackCounter++;
                setTimeout(() => {
                  self._zone.run(() => {
                    self.openLightBox();
                  });
                }, 3000);
              } else {
                self._zone.run(() => {
                  self.logger.debug(
                    [
                      mpgsSessionResponse.orderId,
                      "MPGS error callback called for ORN",
                      mpgsSessionResponse.orderId,
                      "error",
                      JSON.stringify(error),
                    ].join(" :: "),
                    error
                  );
                  window["iframeFailure"] = true;
                  window["sessionFailure"] = false;
                  GuestCreditCardPageComponent.callbackCounter++;
                  // Hide preferred currency and revert back to display currency
                  self.openManualCreditCardDiv();
                  self.spinner.stop(MPGS_SCRIPT_ID);
                  self.enableHiddenScroll();
                });
              }
            }
          };
          window["MPGScancel"] = function () {
            const self = window[
              "GuestCreditCardPageComponent"
            ] as GuestCreditCardPageComponent;
            self.transactionaApiCount--;
            if (self.transactionaApiCount === 0) {
              self.logger.debug(
                [
                  mpgsSessionResponse.orderId,
                  "MPGS cancel callback called for ORN",
                ].join(" :: "),
                JSON.stringify(mpgsSessionResponse)
              );
              self._zone.run(() => {
                self.checkMPGSTransactionStatus(
                  resDetails,
                  mpgsSessionResponse.orderId
                );
              });
            }
          };
        } else {
          if (
            statusCode === 3013 ||
            statusCode === 9000 ||
            statusCode === 6003
          ) {
            error_code = statusCode.toString();
            this.paymentservice.navigateError(error_code);
          } else if (
            statusCode === 3012 ||
            statusCode === 9001 ||
            statusCode === 6004
          ) {
            error_code = statusCode.toString();
            this.paymentservice.navigateError(error_code, result);
            // } else if (statusCode === 3004) {
            // if (this.checkCount > 1) {
            //   this.checkCount -= 1;
            //   this.MPGSSessionRequestSubscribe(resDetails);
            // } else {
            //   // error_code = '30002';
            //   // this.navigateError('30002');
            //   window['iframeFailure'] = false;
            //   window['sessionFailure'] = true;
            //   this.openManualCreditCardDiv();
            // }
            // error_code = statusCode.toString();
            // this.paymentservice.navigateError(error_code, result);
          } else {
            this.paymentservice.navigateError(statusCode);
          }
        }
      });
  }

  creditGuestWidgetRefresh() {
    this.guestInfoForm.guestPreferences.preferencesAPI();
    this.guestInfoFooter.checkBookingAmount();
    this.paymentMethod.paymentMethodInfo();
    if(this.paymentMethod.isCardSelected){
      this.paymentMethod.isPaymentMethodSelected = true
    }
    this.paymentMethod.resetPaymentCurrency();
  }

  openManualCreditCardDiv() {
    this.paymentMethod.resetPaymentCurrency();
    this.paymentMethod.revertToPrevCurrency();
    this.manualCreditCard = true;
    this.paymentMethod.ifManualCreditCard();
    CommonUtility.scrollIntoViewId("PaymentMethodDiv", { block: "start" });
  }

  openLightBox() {
    this.MpgsPopup.onPayWithMPGSLightBox(!this.payAndStay, 1);
  }

  ResetManualCardStatus(event: any) {
    this.manualCreditCard = false;
  }

  checkMPGSTransactionStatus(
    resDetails: ReservationDetails[],
    orderId?: string
  ) {
    this.mpgsTransactionSubscription = this.mpgsPaymentService
      .MPGSTransactionStatusURL()
      .subscribe((status) => {
        const statusCode = Number(_.get(status, "status.statusCode"));
        if (statusCode) {
          const errorCodeList =
            ErrorCodesListInComponents.PaymentMethodComponent;
          this.storeService.removeErrors(errorCodeList);
        }
        if (statusCode === 1000) {
          const mpgsStatusCode = Number(_.get(status, "data.statusCode"));
          this.logger.debug(
            [orderId, "Transaction status of ORN" + mpgsStatusCode].join(
              " :: "
            ),
            JSON.stringify(status)
          );
          if (
            mpgsStatusCode &&
            mpgsStatusCode !== 3210 &&
            mpgsStatusCode !== 3212
          ) {
            this.storeService.setError(Number(mpgsStatusCode));
          }
        } else if (statusCode === 5004) {
          this.logger.debug(
            [orderId, "No Transaction Found"].join(" :: "),
            JSON.stringify(status)
          );
          this.storeService.setError(5004);
        } else {
          this.logger.debug(
            [orderId, "Couldnt retrieve the transaction details"].join(" :: "),
            JSON.stringify(status)
          );
          this.storeService.setError(3004);
        }

        this.paymentMethod.getErrorMessage();
        CommonUtility.scrollIntoViewId("PaymentMethodDiv", { block: "start" });
      });
  }

  reloadAlipayMBVerbiage() {
    this.guestInfoFooter.checkBookingAmount();
  }

  enableHiddenScroll() {
    const htmlEle = document.getElementsByTagName("html");
    const bodyEle = document.getElementsByTagName("body");
    if (htmlEle[0].style.overflow === "hidden") {
      htmlEle[0].removeAttribute("style");
    }
    if (bodyEle[0].style.overflow === "hidden") {
      bodyEle[0].removeAttribute("style");
    }
  }

  public saveGuestInfo() {
    const roomCnt = this.storeService.getBasketState().Rooms.length;
    for (let j = 0; j < roomCnt; j++) {
      const guestInfo = this.guestInfoForm.getGuestFormData();
      this.storeService.upsertSingleRoomGuestInfo(guestInfo, j);
    }
    this.storeService.updateGuestInfo(this.guestInfoForm.getGuestFormData());
    if (this.showPref) {
      for (let j = 0; j < roomCnt; j++) {
        const guestPref = this.guestInfoForm.getGuestPreferences(j);
        this.storeService.upsertSingleRoomGuestPreference(guestPref, j);
      }
    }
  }

  // public scrollToAlacarteAddons() {
  //   CommonUtility.scrollIntoViewId("alaCarteAddOnsDiv");
  // }

  public validateAvailAddons() {
    const roomCodes = [];
    const basket = this.storeService.getBasketState() as IBasketState;
    for (const roomCode of basket.Rooms) {
      roomCodes.push(basket.Rooms[roomCode.roomIndex]?.UniqueCode);
    }
    const params = {
      propertyCode: this.storeService.getUserSettingsState().propertyInfo
        .propertyCode,
      rateCode: this._activatedRoute.snapshot.queryParams.offerCode,
      roomCode: roomCodes.toString(),
      arrivalDate: CommonUtility.formateDate(basket.GuestSummary.checkindate),
      departureDate: CommonUtility.formateDate(
        basket.GuestSummary.checkoutdate
      ),
    };
    if (
      _.get(
        this.storeService.getUserSettingsState(),
        "propertyInfo.displayAddOns"
      ) &&
      FeatureFlags.isFeatureEnabled("addons")
    ) {
      this.guestinfoservice.validateRoomCodes(params).subscribe((data) => {
        if (data.status.statusCode === 1000) {
          this.displayAddons =
            (_.get(
              this.storeService.getUserSettingsState(),
              "propertyInfo.displayAddOns"
            ) &&
              FeatureFlags.isFeatureEnabled("addons")) ||
            false;
          data["intialLoad"] = true;
          this.validatedAddons = data;
        }
      });
    } else {
      this.displayAddons = false;
    }
  }  

  getMessage(message: string, params: string[]) {
    return CommonUtility.fillMessage(message, params);
  }

  closepopup(){
    this.ErrorPopup_heading = ""
    this.ErrorPopup_subTitle =""
    this.ErrorPopup_message = ""
    this.isShowPaymentErrorModel = false;
  }

  formatMsg() {
    if(!this.mobileScreen) {
      return this.getMessage(this.ErrorPopup_message, [this.propertyInfo.phone ,this.propertyInfo.primaryEmail]);
    } else {  
      const msg = this.getMessage(this.ErrorPopup_message, [this.propertyInfo.phone ,this.propertyInfo.primaryEmail]) + " *";
      let updatedCounter = 0, incCounter = 43, str='';
      for(let initialVal = 0; initialVal <= msg.length; initialVal += (updatedCounter - initialVal)) {
        let val = msg.substring(initialVal,incCounter).split(/\s/g);
        if(msg.includes(val[val.length-1]+" ") || (val[val.length-1]+" " === ' ')) {
          str += val.join(" ")+"</br>";
          updatedCounter= incCounter;
          incCounter = updatedCounter + msg.substring(updatedCounter, updatedCounter+43).length;
          if(updatedCounter === msg.length){
            return str;
          } 
        } else if(!(msg.includes(val[val.length-1]+" ") || (msg.includes(val[val.length-1]+". ") || val.join(" ").includes("*")))){
          const croppedVal = val[val.length-1].length;
          val.pop();
          str += val.join(" ")+"</br>";
          updatedCounter= incCounter-croppedVal;
          incCounter = updatedCounter + msg.substring(updatedCounter, updatedCounter+43).length;
          if(updatedCounter === msg.length){
            return str;
          }
        } else if(val.join(" ").includes("*")) {
          val.pop();
          str += val.join(" ");
          return str;
        }
      }
    }
  }

}
