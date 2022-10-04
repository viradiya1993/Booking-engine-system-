import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from "@angular/core";
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from "@angular/forms";
import * as _ from "lodash";
import { Subscription } from "rxjs";
import { FeatureFlags } from "src/app/common/feature.flags";
import { ActivatedRoute } from "../../../../node_modules/@angular/router";
import { environment } from "../../../environments/environment";
import {
  checkErrorCodesList,
  CVV_MAX_LENGTH,
  CVV_REGEX,
  DISPLAY_CVV,
  error_code_prefix,
  NON_DECIMAL_CURRENCIES,
  PAYMENT_CARD_TYPE,
  PAYMENT_METHOD_API_RESPONSE,
} from "../../common/common.constants";
import { CommonUtility } from "../../common/common.utility";
import { CreditCardDetails } from "../../common/models/credit-card-details.model";
import { PaymentService } from "../../common/services/payment/payment.service";
import { StoreService } from "../../common/services/store.service";
import { IBasketState } from "../../common/store/reducers/basket.reducer";
import { MAX_CARD_EXPIRY_YERS } from "../../common/utils/card.utils";
declare var $: any;

@Component({
  selector: "app-payment-method",
  templateUrl: "./payment-method.component.html",
  styleUrls: ["./payment-method.component.scss"],
})
export class PaymentMethodComponent implements OnInit, OnDestroy {
  str1 = "";
  credtiCards: any;
  totalamount = 0;
  paymentType: string;
  currFilterValue = "";
  currCode = "";
  currentDate = new Date();
  checkOutMonth: any;
  checkOutYear: any;
  yearsToPopulate = new Array<number>();
  monthsToPopulate = new Array<number>();
  currentMonth: number;
  currentYear: number;
  selectedMonth: any;
  selectedMonthDefault = "MM";
  selectedYearDefault = "YYYY";
  selectedYear: any;
  nameFieldError: string;
  isNameValid: boolean;
  localeObj: any;
  validCardFail: boolean;
  monthOpened: boolean;
  yearOpened: boolean;
  isExpMonthValid: boolean;
  isExpYearValid: boolean;
  isCardNumberValid: boolean;
  isCardSelected: boolean;
  isCvvNumberValid: boolean;
  cardTypeError: string;
  cvvNumberError: string;
  isPaymentMethodSelected: boolean;
  cardNumberError: string;
  prevSiblingFocused: boolean;
  errorFound: boolean;
  showDefaultPrice: boolean;
  defTotalPrice: number;
  defCurrCode: string;
  errorMsg: string;
  errorCode: number;
  defCurrFilterValue: string;
  cardNumberPlaceHolderString: string;
  alipay_rate_change_warning: string;
  mpgs_charge_msg: string;
  private _userSettingsSubscriptions: Subscription;
  creditCardForm = new FormGroup({
    name: new FormControl(),
    months: new FormControl(),
    years: new FormControl(),
    pin1: new FormControl(),
    pin2: new FormControl(),
    pin3: new FormControl(),
    pin4: new FormControl(),
    cvv: new FormControl(),
  });
  private _sharedDataSubscription: Subscription;
  private errorHandlerSubscription: Subscription;
  private routerSubscription: Subscription;
  paymentError: boolean;
  paymentErrorMsg: string;
  CARD_TYPE: any;
  SelectedRoomList: any;
  showStayandPay = false;
  ManualCreditCard = false;
  policyText: string;
  PreviouspaymentMethod: string;
  PreviouspaymentInfo: any;
  isManageBookingFlow: boolean;
  PreviousCardNumber: string;
  NameOnCard: string;
  CardPin1: number;
  CardPin2: number;
  CardPin3: number;
  CardPin4: number;
  CardPinPlaceholder1: string;
  CardPinPlaceholder2: string;
  CardPinPlaceholder3: string;
  CardPinPlaceholder4: string;
  temp: boolean;
  MaskedCreditCardNumber: string;
  NewPaymentMethod: string;
  IsNewCardSelected: boolean;
  PreviousGuaranteePercentage: number;
  CurrentGuaranteePercentage: number;
  ManageRoomBooking: any;
  ifCurrentPayAndStay: boolean;
  ifPreviousPayAndStay: boolean;
  paymentMethods: any;
  @Output() ManualCardStatus = new EventEmitter<any>();
  defaultFormat: any;
  amexFormat: any;
  paymentMethodsFlagList: any;
  supportedCurrenciesList: any = [];
  initialSupportedCurrenciesList: any = [];
  preferredCurrency: string;
  showPreferredCurrency = false;
  isInitialCurrencyCodeUpdated = false;
  isPrefCurrSetToPropDefaultCurr = false;
  isLinkToPaymentGateway = true;
  displayCvv: boolean;
  cvvMaxLength: any = [];
  cvvValue: number;
  isRT4ModifyFlowEnabled: any;
  isMcpEnabled = false;
  prevFormattedNumber = 0;
  maxCvvLength: any;
  cvvPlaceHolderString: any;
  addonTotalCost: any;
  addonsList: any;
  addonTotalTax: number;
  defCurrAddonCost: number;
  defCurrAddonTax: number;
  RTL_Flag: boolean;
  payNow: boolean;
  payLater: boolean;
  showPaymentOptions: boolean;
  paymentOption: string;
  policyGuaranteeType: string;
  payNowRadioLabel: string;
  payLaterRadioLabel: string;
  // selectPayNow: boolean;
  currentPaymentMethod: any;

  constructor(
    private _storeSvc: StoreService,
    private fb: FormBuilder,
    private _activatedRoute: ActivatedRoute,
    private paymentService: PaymentService
  ) {}

  ngOnInit() {
    this.defCurrFilterValue = "SGD";
    this.isRT4ModifyFlowEnabled = environment.rt4_modify_flow;
    this.isManageBookingFlow = this._storeSvc.getManageBookingFlowStatus();
    if (this.isManageBookingFlow) {
      this.ManageRoomBooking = this._storeSvc.getBasketState().ManageRoomBooking;
      this.CurrentGuaranteePercentage = _.get(
        this._storeSvc.getBasketState().Rooms[0],
        "RatePlan.guaranteePercentage"
      );
      this.PreviousGuaranteePercentage = _.get(
        this._storeSvc.getBasketState().ManageRoomBooking,
        "RatePlan.guaranteePercentage"
      );
      if (this.PreviousGuaranteePercentage === null) {
        this.PreviousGuaranteePercentage = 0;
      }
      this.ifCurrentPayAndStay = CommonUtility.ifPayAndStay(
        this.CurrentGuaranteePercentage
      );
      this.ifPreviousPayAndStay = CommonUtility.ifPayAndStay(
        this.PreviousGuaranteePercentage
      );
      this.PreviouspaymentInfo = this._storeSvc.getSingleRoomCreditCardInfo();
      this.PreviouspaymentMethod = this.PreviouspaymentInfo.cardType;
      // this.PreviouspaymentMethod ='ALI';
      /*this.PreviouspaymentMethod = this.PreviouspaymentInfo.cardType;
      this.paymentType = this.PreviouspaymentInfo.cardType;
      this.NameOnCard = this.PreviouspaymentInfo.cardHolderName;
      this.PreviousCardNumber = this.PreviouspaymentInfo.cardNumber;
      this.selectedYear = this.PreviouspaymentInfo.expYear;
      this.selectedMonth = this.PreviouspaymentInfo.expMonth;
      this.CardPin1 = +this.PreviousCardNumber.substr(0, 4);
      this.CardPin2 = +this.PreviousCardNumber.substr(4, 4);
      this.CardPin3 = +this.PreviousCardNumber.substr(9, 4);
      this.CardPin4 = +this.PreviousCardNumber.substr(12, 4);
      this.MaskedCreditCardNumber = 'xxxxx';
      this.MaskedCreditCardNumber.concat(this.PreviousCardNumber.substr(12, 4));
      this.temp = this.ifCardTypeJCB();
      this.NewPaymentMethod = this.paymentType;
      this.CardPinPlaceholder1 = 'xxxx';
      this.CardPinPlaceholder2 = 'xxxx';
      this.CardPinPlaceholder3 = 'xxxx';
      this.CardPinPlaceholder4 = this.PreviousCardNumber.substr(12, 4);
      // this.selectbyvalue(this.PreviouspaymentInfo.expMonth);*/
    }
    this.paymentMethodsFlagList = {};
    for (const paymentMethod in PAYMENT_CARD_TYPE) {
      if (paymentMethod) {
        this.paymentMethodsFlagList[paymentMethod] = false;
      }
    }
    this.currentPaymentMethod = _.get(
      this._storeSvc.getUserSettingsState().propertyInfo,
      "creditCardCodes"
    );
    if (this.currentPaymentMethod) {
      this.updatePaymentMethodsFlagList();       
    }
    this.defaultFormat = /(\d{1,4})/g;
    this.amexFormat = /(\d{1,4})(\d{1,6})?(\d{1,5})?/;
    this.credtiCards = {
      maestro: {
        patterns: [5018, 502, 503, 506, 56, 58, 639, 6220, 67],
        format: this.defaultFormat,
        length: [12, 13, 14, 15, 16, 17, 18, 19],
        cvcLength: [3],
      },
      forbrugsforeningen: {
        patterns: [600],
        format: this.defaultFormat,
        length: [16],
        cvcLength: [3],
      },
      dankort: {
        patterns: [5019],
        format: this.defaultFormat,
        length: [16],
        cvcLength: [3],
      },
      VS: {
        patterns: [4],
        format: this.defaultFormat,
        length: [16],
        cvcLength: [3],
      },
      MC: {
        patterns: [5, 2],
        format: this.defaultFormat,
        length: [16],
        cvcLength: [3],
      },
      AX: {
        patterns: [34, 37],
        format: this.amexFormat,
        length: [15],
        cvcLength: [3, 4],
      },
      CB: {
        patterns: [300],
        format: this.defaultFormat,
        length: [14],
        cvcLength: [3],
      },
      DC: {
        patterns: [30, 36, 38, 39],
        format: /(\d{1,4})(\d{1,6})?(\d{1,4})?/,
        length: [14],
        cvcLength: [3],
      },
      DS: {
        patterns: [60, 64, 65, 622],
        format: this.defaultFormat,
        length: [16],
        cvcLength: [3],
      },
      JCB: {
        patterns: [35],
        format: this.defaultFormat,
        length: [16],
        cvcLength: [3],
      },
      CUP: {
        patterns: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        format: this.defaultFormat,
        length: [13, 16, 17, 18, 19],
        cvcLength: [3],
      },
    };
    this.validCardFail = false;
    this.errorFound = false;
    this.showDefaultPrice = false;
    this.defTotalPrice = 0;
    this.errorMsg = "";
    this.errorCode = 0;
    this.defCurrFilterValue =
      _.get(
        this._storeSvc.getUserSettingsState(),
        "propertyInfo.defaultCurrency"
      ) || "SGD";
    this.defCurrCode = CommonUtility.getCurrSymbolForType(
      this._storeSvc.getUserSettingsState().propertyInfo,
      this.defCurrFilterValue
    );
    this.CARD_TYPE = PAYMENT_CARD_TYPE;
    this.prevSiblingFocused = false;
    this.getErrorMessage();
    this._sharedDataSubscription = this._storeSvc
      .getBasket()
      .subscribe((sharedData) => {
        if (sharedData.Rooms !== undefined) {
          this.addonsList = sharedData.addonTotalCost;
          this.addonTotalCost = 0;
          this.addonTotalTax = 0;
          this.defCurrAddonCost = 0;
          this.defCurrAddonTax = 0;
          if (!CommonUtility.isAPIListEmpty(this.addonsList)) {
            this.addonsList.forEach((element) => {
              element.NOT_SPECIFIED.forEach((value) => {
                this.addonTotalCost += value.preTaxAmount;
                this.addonTotalTax += value.taxAndServices;
                this.defCurrAddonCost += value.guestCurrencyPreTaxAmount;
                this.defCurrAddonTax += value.guestCurrencyTaxAndServices;
              });
            });
          }
          this.SelectedRoomList = sharedData.Rooms;
          this.currFilterValue = sharedData.CurrencyCode;
          this.currCode = CommonUtility.getCurrSymbolForType(
            this._storeSvc.getUserSettingsState().propertyInfo,
            this.currFilterValue
          );
          if (this.defCurrCode !== this.currCode) {
            this.showDefaultPrice = true;
          } else {
            this.showDefaultPrice = false;
          }
          if (sharedData.GuestSummary !== undefined) {
            this.checkOutMonth = sharedData.GuestSummary.checkoutdate.getMonth();
            this.checkOutYear = sharedData.GuestSummary.checkoutdate.getFullYear();
          }

          if (
            this.SelectedRoomList[0] &&
            this.SelectedRoomList[0].RatePlan !== undefined &&
            this.SelectedRoomList[0].Pricing === undefined
          ) {
            this._storeSvc.updateMultipleRoomsWithPricing(
              this.SelectedRoomList
            );
            return;
          }

          this.totalamount = 0;
          this.defTotalPrice = 0;
          this.SelectedRoomList.forEach((element) => {
            if (this.showDefaultPrice) {
              this.totalamount =
                this.totalamount +
                  _.get(element, "Pricing.TotalPriceWithPackageAddOnTaxesByCurrency") || 0;
              this.defTotalPrice =
                this.defTotalPrice + _.get(element, "Pricing.DefnTotalPriceWithPackageAddOnTaxesByCurrency") ||
                0;
            } else {
              this.totalamount =
                this.totalamount + _.get(element, "Pricing.DefnTotalPriceWithPackageAddOnTaxesByCurrency") || 0;
            }
          });
          if (this.showDefaultPrice) {
            this.totalamount +=
              this.defCurrAddonCost + this.defCurrAddonTax || 0;
            this.defTotalPrice += this.addonTotalCost + this.addonTotalTax || 0;
          } else {
            this.totalamount +=
              this.defCurrAddonCost + this.defCurrAddonTax || 0;
          }
        }
      });

    this.routerSubscription = this._activatedRoute.queryParams.subscribe(
      (params) => {
        if (_.get(params, "error_code") !== 1000) {
          this._storeSvc.setError(Number(params.error_code));
        }
      }
    );

    this.paymentMethodInfo();
    this.preferredCurrency = this.currFilterValue;
    this.showPaymentOptions = false;
    // this.selectPayNow = false;
    this.getPaymentOptions();
  }

  getPaymentOptions() {
    const basket = this._storeSvc.getBasketState() as IBasketState;
    this.payNow = _.get(basket.Rooms[0], "RatePlan.payNow");
    this.payLater = _.get(basket.Rooms[0], "RatePlan.payLater");
    this.policyGuaranteeType = _.get(basket.Rooms[0], "RatePlan.policyGuaranteeType");

    if (!this.isManageBookingFlow && (this.payNow !== undefined || this.payLater !== undefined) &&
        this.policyGuaranteeType === 'Credit Card Guarantee') {
          this.showPaymentOptions = true;
          if (this.payLater !== undefined && this.payLater) {
            this.payNow = true; // default to payNow is not happening ... need to check this issue
            this.paymentOption = 'payLater';
          }
        } else {
          this.showPaymentOptions = false;
    }
  }

  isPayLaterSet() {
    return (!!this.payLater && this.payLater);
  }

  isPayNowSet() {
    return (!!this.payNow && this.payNow);
  }

  updateSelectedPaymentCurrency(selectedCurrencyObj) {
    this.modifyPrefferedCurrencyList();
    const basketSummary = this._storeSvc.getBasketState();
    const prevCurrencyCode = _.get(basketSummary, "CurrencyCode");

    if (!this.isInitialCurrencyCodeUpdated) {
      this._storeSvc.updateIntialCurrencyCodeObj(prevCurrencyCode);
      this.isInitialCurrencyCodeUpdated = true;
    }
    this.updateCurrencyCodePricing(selectedCurrencyObj);
    this.setBasketPaymentCurrencyInfo(
      this.showPreferredCurrency,
      selectedCurrencyObj.code
    );
  }

  updateCurrencyCodePricing(selectedCurrencyObj) {
    this._storeSvc.updateCurrencyCodeObj(selectedCurrencyObj);
    const rooms = this._storeSvc.getBasketState().Rooms;
    this._storeSvc.updateMultipleRoomsWithPricing(rooms);
  }

  filterPaymentMethods(paymentMethods) {
    return paymentMethods.filter((paymentMethod) => {
      return paymentMethod && this.paymentMethodsFlagList[paymentMethod.code];
    });
  }

  createForm() {
    this.creditCardForm = this.fb.group({
      name: ["", Validators.required],
      months: ["MM", Validators.required],
      years: ["YYYY", Validators.required],
      pin1: ["", Validators.required],
      pin2: ["", Validators.required],
      pin3: ["", Validators.required],
      pin4: ["", Validators.required],
      cvv: ["", Validators.required],
    });
  }

  ngOnDestroy() {
    const subscriptionsList = [
      this._sharedDataSubscription,
      this._userSettingsSubscriptions,
      this.errorHandlerSubscription,
      this.routerSubscription,
    ];
    CommonUtility.removeSubscriptions(subscriptionsList);
  }

  checkExpiryDate(month: any, year: any) {
    if (
      year === "YYYY" ||
      month === "MM" ||
      Number(year) < this.checkOutYear ||
      (Number(year) === this.checkOutYear &&
        Number(month) < this.checkOutMonth + 1)
    ) {
      return false;
    } else {
      return true;
    }
  }

  onCreditCardKeyUp(event: any) {
    const num = event.target.value;
    const cursorPos = $("#cc-number").prop("selectionStart");
    const creditCardElement = document.getElementById("cc-number");
    if (num !== this.prevFormattedNumber) {
      const prevNumberFormatted = this.formatCardNumber(num);
      $("#cc-number").val(prevNumberFormatted);
      const prevCursorPos = $("#cc-number").prop("selectionStart");
      if (prevCursorPos - cursorPos <= 1) {
        this.setCaretPosition(creditCardElement, prevCursorPos);
      } else {
        this.setCaretPosition(creditCardElement, cursorPos);
      }
      this.prevFormattedNumber = num;
    }
  }

  setCaretPosition(ctrl, pos) {
    // Modern browsers
    if (ctrl.setSelectionRange) {
      ctrl.focus();
      ctrl.setSelectionRange(pos, pos);

      // IE8 and below
    } else if (ctrl.createTextRange) {
      const range = ctrl.createTextRange();
      range.collapse(true);
      range.moveEnd("character", pos);
      range.moveStart("character", pos);
      range.select();
    }
  }

  onKeyPress(event: any) {
    if (this.isCardNumberValid === false) {
      const errorObj = this._storeSvc.getErrorHandlerState().error;
      // const cardValidation = this._storeSvc.getErrorHandlerState().invalidCreditCardNumber;
      if (_.get(errorObj, "1005") === true) {
        this._storeSvc.removeError(1005);
      }
    }
    const keyStrokeFlag = this.restrictKeys(event);
    if (!keyStrokeFlag) {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
    const creditCardNumberFlag = this.restrictCardNumbers(event);
    if (!creditCardNumberFlag) {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
    if (this.paymentType === PAYMENT_CARD_TYPE.CHINA_UNION_PAY) {
      this.isCardNumberValid = true;
      this.cardNumberError = "";
      return;
    }
    const cardType = $["payment"].cardType($(".cc-number").val());
    if (cardType !== null && cardType !== this.paymentType) {
      this.isCardNumberValid = false;
      if (this.localeObj) {
        this.cardNumberError = _.get(
          this.localeObj,
          "tf_4_Checkout_paymentMethod_invalidCreditCardError"
        );
      } else {
        this.cardNumberError = "Please enter a valid card number";
      }
    } else {
      this.isCardNumberValid = true;
      this.cardNumberError = "";
    }
  }

  onCvvKeyPress(event: any) {
    const keyStrokeFlag = this.restrictKeys(event);
    if (!keyStrokeFlag) {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
  }

  restrictKeys(event: any) {
    let input;
    if (event.metaKey || event.ctrlKey) {
      return true;
    }
    if (event.which === 32) {
      return false;
    }
    if (event.which === 0) {
      return true;
    }
    if (event.which < 33) {
      return true;
    }
    input = String.fromCharCode(event.which);
    return !!/[\d\s]/.test(input);
  }

  restrictCardNumbers(event: any) {
    const target = event.currentTarget;
    const digit = String.fromCharCode(event.which);
    if (!/^\d+$/.test(digit)) {
      return;
    }
    const value = ($("#cc-number").val() + digit).replace(/\D/g, "");
    let len = 16;
    if (this.paymentType) {
      if (this.credtiCards[this.paymentType] !== undefined) {
        const card = this.credtiCards[this.paymentType];
        len = card.length[card.length.length - 1];
      }
    }
    return value.length <= len;
  }

  restrictCvvNumbers(event: any) {
    const value = event.target.value;
    this.maxCvvLength = 0;
    this.cvvMaxLength.forEach((cvvLength) => {
      if (this.maxCvvLength < cvvLength) {
        this.maxCvvLength = cvvLength;
      }
    });
    if (
      this.cvvMaxLength.includes(value.length) ||
      value.length <= CVV_MAX_LENGTH
    ) {
      return true;
    }
    event.preventDefault();
    event.stopPropagation();
    return false;
  }

  formatCardNumber(num: string) {
    let groups, upperLength, _ref;
    num = num.replace(/\D/g, "");
    if (!this.paymentType) {
      return num;
    }
    const card = this.credtiCards[this.paymentType];
    upperLength = card.length[card.length.length - 1];
    num = num.slice(0, upperLength);
    if (card.format.global) {
      return (_ref = num.match(card.format)) != null ? _ref.join(" ") : void 0;
    } else {
      groups = card.format.exec(num);
      if (groups === null) {
        return;
      }
      groups.shift();
      groups = $.grep(groups, function (n) {
        return n;
      });
      return groups.join(" ");
    }
  }

  onCardNumberChange() {
    const cardVal = ($("#cc-number").val() + "").replace(/\D/g, "");
    const cardType = $["payment"].cardType($(".cc-number").val());
    const cardNumFlag = $["payment"].validateCardNumber($(".cc-number").val());
    if (this.paymentType === PAYMENT_CARD_TYPE.CHINA_UNION_PAY) {
      if (
        cardVal.length !== 13 &&
        !(cardVal.length >= 16 && cardVal.length <= 19)
      ) {
        this.isCardNumberValid = false;
        if (this.localeObj) {
          this.cardNumberError = _.get(
            this.localeObj,
            "tf_4_Checkout_paymentMethod_invalidCreditCardError"
          );
        } else {
          this.cardNumberError = "Please enter a valid card number";
        }
        return;
      } else {
        this.isCardNumberValid = true;
        this.cardNumberError = "";
        return;
      }
    }
    if (this.paymentType !== cardType) {
      this.isCardNumberValid = false;
      if (this.localeObj) {
        this.cardNumberError = _.get(
          this.localeObj,
          "tf_4_Checkout_paymentMethod_invalidCreditCardError"
        );
      } else {
        this.cardNumberError = "Please enter a valid card number";
      }
    } else if (!cardNumFlag) {
      this.isCardNumberValid = false;
      if (this.localeObj) {
        this.cardNumberError = _.get(
          this.localeObj,
          "tf_4_Checkout_paymentMethod_invalidCreditCardError"
        );
      } else {
        this.cardNumberError = "Please enter a valid card number";
      }
    } else {
      this.isCardNumberValid = true;
      this.cardNumberError = "";
    }
  }

  onCvvNumberChange(event: any) {
    const cvvVal = event.srcElement.value;
    if (cvvVal === "" || cvvVal === null || cvvVal === undefined) {
      this.isCvvNumberValid = false;
      if (this.localeObj) {
        this.cvvNumberError = _.get(
          this.localeObj,
          "tf_4_Checkout_paymentMethod_cvvReqError"
        );
      } else {
        this.cvvNumberError = "Please enter your cvv number";
      }
      return false;
    }
    if (!CVV_REGEX.test(cvvVal)) {
      if (this.localeObj) {
        this.cvvNumberError = _.get(
          this.localeObj,
          "tf_4_Checkout_paymentMethod_invalidCVVError"
        );
      } else {
        this.cvvNumberError = "Please enter a valid cvv number";
      }
      this.isCvvNumberValid = false;
      return false;
    }
    if (cvvVal.length < 3 || cvvVal.length < this.cvvMaxLength) {
      if (this.localeObj) {
        this.cvvNumberError = _.get(
          this.localeObj,
          "tf_4_Checkout_paymentMethod_invalidCVVError"
        );
      } else {
        this.cvvNumberError = "Please enter a valid cvv number";
      }
      this.isCvvNumberValid = false;
      return false;
    }
    this.isCvvNumberValid = true;
    this.cvvValue = event.srcElement.value;
    return true;
  }

  selectMonthChangeHandler(month: any) {
    this.selectedMonth = month;
    if (this.selectedMonth === "MM" || this.selectedMonth === undefined) {
      this.isExpMonthValid = false;
    } else {
      this.isExpMonthValid = true;
    }
  }

  selectYearChangeHandler(year: any) {
    this.selectedYear = year;
    if (this.selectedYear === undefined || this.selectedYear === "YYYY") {
      this.isExpYearValid = false;
    } else {
      this.isExpYearValid = true;
    }
  }

  dropdownToggle(event: Event) {
    const el = event.target as HTMLInputElement;
    if (el.id === "months") {
      if (this.monthOpened) {
        if (el.value === "" || el.value === undefined) {
          this.isExpMonthValid = false;
        } else {
          this.isExpMonthValid = true;
        }
      }
      this.monthOpened = !this.monthOpened;
    } else if (el.id === "years") {
      if (this.yearOpened) {
        if (el.value === "" || el.value === undefined) {
          this.isExpYearValid = false;
        } else {
          this.isExpYearValid = true;
        }
      }
      this.yearOpened = !this.yearOpened;
    }
  }

  isCardNameValid(field: string) {
    const text = this.creditCardForm.get(field).value;
    if (!(!!text)) {
      this.isNameValid = false;
      if (this.localeObj) {
        this.nameFieldError = _.get(
          this.localeObj,
          "tf_4_Checkout_paymentMethod_cardNameReqError"
        );
      } else {
        this.nameFieldError = "Please enter your Name on Card";
      }
      return false;
    } else {
    this.isNameValid = true;
    return true;
    }
  }

  onKeyUpCommon(field: string) {
    const text = this.creditCardForm.get(field).value;
    if (text === "" || text === undefined || text === null) {
      this.isNameValid = false;
      if (this.localeObj) {
        this.nameFieldError = _.get(
          this.localeObj,
          "tf_4_Checkout_paymentMethod_cardNameReqError"
        );
      } else {
        this.nameFieldError = "Please enter your Name on Card";
      }
    }
  }

  isFieldValid(field: string) {
    return (
      !this.creditCardForm.get(field).valid &&
      this.creditCardForm.get(field).touched
    );
  }
  get formControl() {
    return this.creditCardForm.controls;
  }

  pad(num, size) {
    let tempStr = num.toString();
    while (tempStr.length < size) {
      tempStr = "0" + tempStr;
    }
    return tempStr;
  }

  showValidationErrors(paymentData: any) {
    if (
      paymentData.cardHolderName === undefined ||
      paymentData.cardHolderName === "" ||
      paymentData.cardHolderName === null
    ) {
      this.isNameValid = false;
      if (this.localeObj) {
        this.nameFieldError = _.get(
          this.localeObj,
          "tf_4_Checkout_paymentMethod_cardNameReqError"
        );
      } else {
        this.nameFieldError = "Please enter your Name on Card";
      }
    }
    if (
      paymentData.cardNumber === undefined ||
      paymentData.cardNumber === "" ||
      paymentData.cardNumber === 0 ||
      paymentData.cardNumber.length === null
    ) {
      this.isCardNumberValid = false;
      if (this.localeObj) {
        this.cardNumberError = _.get(
          this.localeObj,
          "tf_4_Checkout_paymentMethod_cardNumberReqError"
        );
      } else {
        this.cardNumberError = "Please enter your Card Number";
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
      if (cardType !== paymentData.cardType || !cardNumFlag) {
        this.isCardNumberValid = false;
        if (this.localeObj) {
          this.cardNumberError = _.get(
            this.localeObj,
            "tf_4_Checkout_paymentMethod_invalidCreditCardError"
          );
        } else {
          this.cardNumberError = "Please enter a valid card number";
        }
      }
    }
    if (paymentData.cardType === PAYMENT_CARD_TYPE.CHINA_UNION_PAY) {
      const cardVal = (paymentData.cardNumber + "").replace(/\D/g, "");
      if (
        cardVal.length !== 13 &&
        !(cardVal.length >= 16 && cardVal.length <= 19)
      ) {
        this.isCardNumberValid = false;
        if (this.localeObj) {
          this.cardNumberError = _.get(
            this.localeObj,
            "tf_4_Checkout_paymentMethod_invalidCreditCardError"
          );
        } else {
          this.cardNumberError = "Please enter a valid card number";
        }
      }
    }
    if (paymentData.expMonth === undefined || paymentData.expMonth === "") {
      this.isExpMonthValid = false;
    }
    if (paymentData.expYear === undefined || paymentData.expYear === "") {
      this.isExpYearValid = false;
    }
    if (
      paymentData.cardType === "" ||
      paymentData.cardType === null ||
      paymentData.cardType === undefined
    ) {
      this.isCardSelected = false;
      if (this.localeObj) {
        this.cardTypeError = _.get(
          this.localeObj,
          "tf_4_Checkout_paymentMethod_selectPaymentMethodError"
        );
      } else {
        this.cardTypeError = "Please select a payment method";
      }
    }
    if (
      paymentData.securityCode === undefined ||
      paymentData.securityCode === "" ||
      paymentData.securityCode === 0 ||
      paymentData.securityCode === null
    ) {
      this.isCvvNumberValid = false;
      if (this.localeObj) {
        this.cvvNumberError = _.get(
          this.localeObj,
          "tf_4_Checkout_paymentMethod_invalidCVVError"
        );
      } else {
        this.cvvNumberError = "Please enter a valid cvv number";
      }
    }
  }

  cardTypeValidationOnEnter(e) {
    e.target.previousElementSibling.click();
    if (e.keyCode === 32) {
      e.preventDefault();
    }
  }

  cardTypeValidation() {

    if (
      this.paymentType === PAYMENT_CARD_TYPE.MAESTRO ||
      this.paymentType === PAYMENT_CARD_TYPE.CHINA_UNION_PAY
    ) {
      this.cardNumberPlaceHolderString = _.get(
        this.localeObj,
        "tf_4_Checkout_paymentMethod_maestroCardTypeHelpText"
      );
    } else if (this.paymentType === PAYMENT_CARD_TYPE.AMEX) {
      this.cardNumberPlaceHolderString = _.get(
        this.localeObj,
        "tf_4_Checkout_paymentMethod_AXCardTypeHelpText"
      );
    } else if (this.paymentType === PAYMENT_CARD_TYPE.DINERS_CLUB) {
      this.cardNumberPlaceHolderString = _.get(
        this.localeObj,
        "tf_4_Checkout_paymentMethod_DCCardTypeHelpText"
      );
    } else {
      this.cardNumberPlaceHolderString = _.get(
        this.localeObj,
        "tf_4_Checkout_paymentMethod_creditCardNumberHelpText"
      );
    }
    if (this.credtiCards[this.paymentType] === "AX") {
      this.cvvPlaceHolderString = _.get(
        this.localeObj,
        "tf_4_Checkout_paymentMethod_AXCvvHelpText"
      );
    } else {
      this.cvvPlaceHolderString = _.get(
        this.localeObj,
        "tf_4_Checkout_paymentMethod_cvvDefaultHelpText"
      );
    }
    this.cvvMaxLength = this.credtiCards[this.paymentType].cvcLength;
    if (
      this.cvvMaxLength === null ||
      !this.cvvMaxLength ||
      this.cvvMaxLength === undefined
    ) {
      this.cvvMaxLength = CVV_MAX_LENGTH;
    }
    // this.paymentMethods.forEach((resp) => { });
    const gatewayLink = _.find(this.paymentMethods, { code: this.paymentType });
    this.isLinkToPaymentGateway = gatewayLink.isLinkToPaymentGateway;
    this.creditCardForm.reset();
    this.ManualCreditCard = false;
    this.ManualCardStatus.emit(this.ManualCreditCard);
    if (
      this.paymentType !== PAYMENT_CARD_TYPE.AMEX &&
      this.paymentType !== PAYMENT_CARD_TYPE.MASTER_CARD
    ) {
      this.ifOtherOptionSelected();
    }
    $("#cc-number").val("");
    this.cvvValue = 0;
    this.createForm();
    this.cardTypeError = "";
    this.selectedMonth = undefined;
    this.selectedYear = undefined;
    this.validCardFail = false;
    this.isCardSelected = true;
    this.isCvvNumberValid = true;
    this.isPaymentMethodSelected = true;
    this.isNameValid = true;
    this.cardNumberError = "";
    this.isCardNumberValid = true;
    this.isExpMonthValid = true;
    this.isExpYearValid = true;

    this.isMcpEnabled = environment.isMCPEnabled;
    if (this.isMcpEnabled) {
      if (this.isPayAndStayBooking()) {
        this.getSupportedCurrenciesByPaymentType();
      } else {
        this.resetPaymentCurrency();
      }
    }
    setTimeout(() => {
      $('.mbs-dropdown-primary .dropdown input').each(function() { this.setAttribute('tabindex', '-1');
    // Start - PayNow, PayLater ---  default selection
      if ($("#pay_later").length) {
        $("#pay_later").prop("checked", true);
        this.paymentOption = 'payLater';
      } else {
        if ($("#pay_later").length) {
          $("#pay_now").prop("checked", true);
          this.paymentOption = 'payNow';
        }
      }
    // End - PayNow, PayLater ---  default selection
     });
    }, 100);

  }

  isPayAndStayBooking() {
    const guaranteePercentage = _.get(
      this._storeSvc.getBasketState().Rooms[0],
      "RatePlan.guaranteePercentage"
    );
    const payAndStay = CommonUtility.ifPayAndStay(guaranteePercentage);
    return payAndStay;
  }

  getSupportedCurrenciesByPaymentType() {
    let selectedPaymentMethod: any;
    this.resetPaymentCurrency();
    this.initialSupportedCurrenciesList = [];
    selectedPaymentMethod = _.find(this.paymentMethods, {
      code: this.paymentType,
    });

    if (
      !!selectedPaymentMethod &&
      !!selectedPaymentMethod.supportedCurrencies
    ) {
      this.supportedCurrenciesList = selectedPaymentMethod.supportedCurrencies;
      this.initialSupportedCurrenciesList = _.cloneDeep(
        this.supportedCurrenciesList
      );
    }

    const defPropCode = this.defCurrFilterValue;
    const checkForNonSGDCurrency = _.find(
      this.supportedCurrenciesList,
      function (o) {
        return o.code !== defPropCode;
      }
    );
    // if (this.supportedCurrenciesList.length > 0) {
    if (checkForNonSGDCurrency) {
      const displayCurrencyExists = this.checkForDisplayCurrency();
      this.showPreferredCurrency = true;
      if (displayCurrencyExists) {
        // check to find the display currency exists in the supported currencies list
        this.preferredCurrency = this.currFilterValue;
        this.isPrefCurrSetToPropDefaultCurr = false;
        this.setBasketPaymentCurrencyInfo(
          this.showPreferredCurrency,
          this.preferredCurrency
        );
      } else {
        // set the propertyDefault 'SGD' as the defualt payment currency
        this.preferredCurrency = this.defCurrFilterValue;
        this.isPrefCurrSetToPropDefaultCurr = true;
        this.updateSelectedPaymentCurrency({ code: this.preferredCurrency });
      }
      this.modifyPrefferedCurrencyList();
    } else {
      this.preferredCurrency = "";
      this.showPreferredCurrency = false;
      this.isPrefCurrSetToPropDefaultCurr = false;
      this.setBasketPaymentCurrencyInfo(
        this.showPreferredCurrency,
        this.preferredCurrency
      );
    }
  }

  modifyPrefferedCurrencyList() {
    this.supportedCurrenciesList = this.initialSupportedCurrenciesList.filter(
      (item) => item.code !== this.preferredCurrency
    );
  }

  setBasketPaymentCurrencyInfo(isPaymentCurrencyExists, paymentCurrencyCode) {
    this._storeSvc.updatePaymentCurrencyCodeObj(
      isPaymentCurrencyExists,
      paymentCurrencyCode
    );
  }

  checkForDisplayCurrency() {
    if (this.supportedCurrenciesList.length > 0) {
      // set the display currency as defualt payment currency initially
      const defaultPreferredCurrency = this.supportedCurrenciesList.find(
        (item) => item.code === this.currFilterValue
      );
      return defaultPreferredCurrency;
    } else {
      return false;
    }
  }

  resetPaymentCurrency() {
    this.preferredCurrency = "";
    this.supportedCurrenciesList = [];
    this.showPreferredCurrency = false;
    this.setBasketPaymentCurrencyInfo(
      this.showPreferredCurrency,
      this.preferredCurrency
    );
  }

  revertToPrevCurrency() {
    const basketSummary = this._storeSvc.getBasketState();
    const initialCurrencyCodeObj = {
      code: _.get(basketSummary, "initialCurrencyCode"),
    };
    this._storeSvc.updateCurrencyCodeObj(initialCurrencyCodeObj);
    this.updateCurrencyCodePricing(initialCurrencyCodeObj);
  }

  getErrorMessage() {
    this.errorHandlerSubscription = this._storeSvc
      .getErrorHandler()
      .subscribe((errorHandler) => {
        this.errorCode = 0;
        this.errorFound = false;
        this.errorMsg = "";
        for (
          let index = 0;
          index < checkErrorCodesList.PaymentErrorCodes.length;
          index++
        ) {
          const code = checkErrorCodesList.PaymentErrorCodes[index];
          if (_.get(errorHandler.error, code) === true) {
            this.errorCode = code;
            this.errorFound = true;
            if (this.localeObj) {
              this.errorMsg = _.get(this.localeObj, error_code_prefix + code);
            }
            CommonUtility.setDatalayer({
              error_type: "red-error",
              error_code: this.errorCode || "",
              error_description: _.get(
                this.localeObj,
                error_code_prefix + code
              ),
            });
            break;
          }
        }
      });

    this._userSettingsSubscriptions = this._storeSvc
      .getUserSettings()
      .subscribe((sharedData) => {
        this.localeObj = sharedData.localeObj;
        this.payNowRadioLabel =  _.get(
          this.localeObj,
          "tf_4_Checkout_paymentMethod_radioLable_payNow"
        ) || 'PAY NOW';

        this.payLaterRadioLabel =  _.get(
          this.localeObj,
          "tf_4_Checkout_paymentMethod_radioLable_payLater"
        ) || 'PAY LATER(at the hotel)';

        if (this.errorFound) {
          this.errorMsg = _.get(this.localeObj, "error_code_" + this.errorCode);
        }
        CommonUtility.setDatalayer({
          error_type: "red-error",
          error_code: this.errorCode || "",
          error_description: this.errorMsg,
        });
        this.RTL_Flag = CommonUtility.langAlignCheck(
          this._storeSvc.getUserSettingsState().langObj.code,
          FeatureFlags
        );
      });
  }

  getPaymentData() {
    const creditCardInfo = new CreditCardDetails();
    creditCardInfo.cardHolderName = this.creditCardForm.get("name").value;
    creditCardInfo.expMonth = this.selectedMonth;
    creditCardInfo.expYear = this.selectedYear;
    creditCardInfo.cardType = this.paymentType;
    if (this.cvvValue) {
      creditCardInfo.securityCode = this.cvvValue;
    } else if (!this.cvvValue) {
      creditCardInfo.securityCode = null;
    }
    creditCardInfo.cardNumber = "";
    if (
      this.paymentType !== undefined &&
      this.paymentType !== "" &&
      (creditCardInfo.cardType === PAYMENT_CARD_TYPE.CHINA_UNION_PAY ||
        creditCardInfo.cardType === PAYMENT_CARD_TYPE.JAPAN_CREDIT_BUREAU ||
        (this.ManualCreditCard &&
          (creditCardInfo.cardType === PAYMENT_CARD_TYPE.VISA ||
            creditCardInfo.cardType === PAYMENT_CARD_TYPE.MASTER_CARD ||
            creditCardInfo.cardType === PAYMENT_CARD_TYPE.AMEX)))
    ) {
      creditCardInfo.cardNumber = $("#cc-number").val().toString();
    } else if (!!this.paymentType && !this.isLinkToPaymentGateway) {
      creditCardInfo.cardNumber = $("#cc-number").val().toString();
    }
    return creditCardInfo;
  }

  ifCardTypepayment() {
    this.showStayandPay = false;
    const policyFlag = CommonUtility.ifPayAndStay(
      _.get(
        this._storeSvc.getBasketState().Rooms[0],
        "RatePlan.guaranteePercentage"
      )
    );
    const basket = this._storeSvc.getBasketState() as IBasketState;
    this.policyText = _.get(basket.Rooms[0], "RatePlan.policyText");
    if (this.paymentType === PAYMENT_CARD_TYPE.ALI) {
      this.alipay_rate_change_warning = _.get(
        basket.Rooms[0],
        "RatePlan.alipayAlertText"
      );
      this.showStayandPay = false;
    }

    if (
      this.paymentType === PAYMENT_CARD_TYPE.VISA ||
      this.paymentType === PAYMENT_CARD_TYPE.MASTER_CARD ||
      this.paymentType === PAYMENT_CARD_TYPE.AMEX
    ) {
      this.mpgs_charge_msg = _.get(basket.Rooms[0], "RatePlan.mpgsAlertText");
      if (!policyFlag && this.policyText) {
        this.showStayandPay = true;
      }
      if (!this.showStayandPay) {
        let selectedPaymentMethod: any;
        selectedPaymentMethod = _.find(this.paymentMethods, {
          code: this.paymentType,
        });
        if (
          !!selectedPaymentMethod &&
          !!selectedPaymentMethod.supportedCurrencies
        ) {
          this.supportedCurrenciesList =
            selectedPaymentMethod.supportedCurrencies;
          this.initialSupportedCurrenciesList = _.cloneDeep(
            this.supportedCurrenciesList
          );
        }
      }
      const defPropCode = this.defCurrFilterValue;
      const checkForNonSGDCurrency = _.find(
        this.supportedCurrenciesList,
        function (o) {
          return o.code !== defPropCode;
        }
      );
      this.isMcpEnabled = environment.isMCPEnabled;
      this.showPreferredCurrency =
        checkForNonSGDCurrency && !this.showStayandPay && !this.ManualCreditCard
          ? true
          : false;
      if (this.showPreferredCurrency && this.isMcpEnabled) {
        this.getSupportedCurrenciesByPaymentType();
      }
      return false;
    }

    if (
      this.paymentType === PAYMENT_CARD_TYPE.JAPAN_CREDIT_BUREAU ||
      this.paymentType === PAYMENT_CARD_TYPE.CHINA_UNION_PAY
    ) {
      if (!policyFlag) {
        this.showStayandPay = true;
      }
      return true;
    }
    return false;
  }

  ifManualCreditCard() {
    this.ManualCreditCard = true;
    return true;
  }

  ifOtherOptionSelected() {
    this.ManualCreditCard = false;
    return false;
  }

  ifCardTypeVisa() {
    if (this.PreviouspaymentMethod === PAYMENT_CARD_TYPE.VISA) {
      return true;
    }
    return false;
  }

  ifCardTypeMaster() {
    if (this.PreviouspaymentMethod === PAYMENT_CARD_TYPE.MASTER_CARD) {
      return true;
    }
    return false;
  }

  ifCardTypeAmEx() {
    if (this.PreviouspaymentMethod === PAYMENT_CARD_TYPE.AMEX) {
      return true;
    }
    return false;
  }

  ifCardTypeUP() {
    if (this.PreviouspaymentMethod === PAYMENT_CARD_TYPE.CHINA_UNION_PAY) {
      return true;
    }
    return false;
  }

  ifCardTypeJCB() {
    if (this.PreviouspaymentMethod === PAYMENT_CARD_TYPE.JAPAN_CREDIT_BUREAU) {
      return true;
    }
    return false;
  }

  ifCardTypeAlipay() {
    if (this.PreviouspaymentMethod === PAYMENT_CARD_TYPE.ALI) {
      this.paymentType = PAYMENT_CARD_TYPE.ALI;
      const currentRoomPrice = this._storeSvc.getBasketState().Rooms[0].Pricing
        .DefTotalPrice;
      const previousRoomPrice = this.ManageRoomBooking.Pricing.DefTotalPrice;
      this.alipay_rate_change_warning =
        currentRoomPrice > previousRoomPrice
          ? _.get(
              this._storeSvc.getBasketState().Rooms[0],
              "RatePlan.alipayAlertText"
            )
          : "";
      return currentRoomPrice > previousRoomPrice ? true : false;
    }
    return false;
  }

  checkPayment() {
    this.CurrentGuaranteePercentage = _.get(
      this._storeSvc.getBasketState().Rooms[0],
      "RatePlan.guaranteePercentage"
    );
    this.PreviousGuaranteePercentage = _.get(
      this._storeSvc.getBasketState().ManageRoomBooking,
      "RatePlan.guaranteePercentage"
    );
    if (this.PreviousGuaranteePercentage === null) {
      this.PreviousGuaranteePercentage = 0;
    }
    this.ifCurrentPayAndStay = CommonUtility.ifPayAndStay(
      this.CurrentGuaranteePercentage
    );
    this.ifPreviousPayAndStay = CommonUtility.ifPayAndStay(
      this.PreviousGuaranteePercentage
    );
    if (this.PreviouspaymentMethod === PAYMENT_CARD_TYPE.ALI) {
      return false;
    } else if (this.ifCurrentPayAndStay === this.ifPreviousPayAndStay) {
      return false;
    } else if (this.ifCurrentPayAndStay !== this.ifPreviousPayAndStay) {
      return true;
    }
  }

  isNewCardUsed() {
    if (this.NewPaymentMethod === "NewCard") {
      return true;
    }
    return false;
  }

  checkForMPGSALertText() {
    const isMPGSCardType = CommonUtility.checkForMPGSCardType(this.paymentType);
    const guaranteePercentage = _.get(
      this._storeSvc.getBasketState().Rooms[0],
      "RatePlan.guaranteePercentage"
    );
    const payAndStay = CommonUtility.ifPayAndStay(guaranteePercentage);
    return isMPGSCardType && !payAndStay;
  }

  CheckforManageBookingPayment() {
    if (
      this.isManageBookingFlow &&
      (!this.ifCurrentPayAndStay &&
        this.ifPreviousPayAndStay &&
        this.ifCardTypeAlipay())
    ) {
      return true;
    } else {
      return false;
    }
  }

  getLabelClassesForCard(cardCode: string) {
    let classes =
      "mbs-radio-primary form-check d-inline-flex cursor-pointer mb-0";
    if (cardCode === PAYMENT_CARD_TYPE.ALI) {
      classes += " ali-label";
    }
    if (this.paymentMethods.length <= 3) {
      classes += " payment-label-spacing-on-flex-start";
    }
    return classes;
  }

  getSpanClassesForCard(cardCode: string) {
    let classes = "radio mr-1 ";
    if (cardCode === PAYMENT_CARD_TYPE.AMEX) {
      classes += " amex-style";
    }
    return classes;
  }

  getImgClassesForCard(cardCode: string) {
    let classes = "form-check-label payment-option";
    if (
      cardCode !== PAYMENT_CARD_TYPE.ALI &&
      cardCode !== PAYMENT_CARD_TYPE.VISA
    ) {
      classes += " payment-icon-center";
    }
    return classes;
  }

  paymentMethodInfo() {
    const userSettingsState = this._storeSvc.getUserSettingsState();
    const propertyTimeZoneOffset = _.get(
      userSettingsState,
      "propertyInfo.propertyTimezone.timezoneOffset"
    );
    this.currentDate = CommonUtility.getCurrentDateFromPropertyTimeZone(
      propertyTimeZoneOffset
    );
    this.currentMonth = this.currentDate.getMonth();
    this.currentYear = this.currentDate.getFullYear();
    this.nameFieldError = "";
    for (
      let index = this.currentYear;
      index < this.currentYear + MAX_CARD_EXPIRY_YERS;
      index++
    ) {
      this.yearsToPopulate.push(index);
    }
    for (let index = 1; index <= 12; index++) {
      this.monthsToPopulate.push(index);
    }
    this.isNameValid = true;
    this.isCardNumberValid = true;
    this.isCvvNumberValid = true;
    this.displayCvv = _.get(userSettingsState, "propertyInfo.displayCVV");
    if (this.displayCvv === undefined || this.displayCvv === null) {
      this.displayCvv = DISPLAY_CVV;
    }
    this.isExpMonthValid = true;
    this.isExpYearValid = true;
    this.isCardSelected = true;
    this.isCvvNumberValid = true;
    this.cardTypeError = "";
    this.isPaymentMethodSelected = false;
    this.cardNumberError = "";
    this.monthOpened = false;
    this.yearOpened = false;
    this.paymentError = false;
    this.ManualCreditCard = false;
    const rateCode = _.get(
      this._storeSvc.getBasketState().Rooms[0],
      "RatePlan.code"
    );
    this.paymentMethods = [];

    this.paymentService.getPaymentMethods(rateCode);
    this.paymentService.paymentMethodsData.subscribe((jsonData) => {
      if (
        !!jsonData &&
        jsonData.status &&
        jsonData.status.statusCode === 1000 &&
        _.get(jsonData, "data")
      ) {
        const arr = []; 
        jsonData.data.forEach(element => {
          arr.push(element.code);
        });
        if(!this.currentPaymentMethod) {
          this.currentPaymentMethod = arr;
          if (this.currentPaymentMethod) {
            this.updatePaymentMethodsFlagList();
          }
        }
        this.paymentMethods = this.filterPaymentMethods(jsonData.data);
      } else {
        this.paymentMethods = this.filterPaymentMethods(
          PAYMENT_METHOD_API_RESPONSE
        );
      }
    });
  }

  getMessage(message: string, params: string[]) {
    return CommonUtility.fillMessage(message, params);
  }

  updatePaymentMethodsFlagList() {
    this.currentPaymentMethod.forEach((element) => {
      Object.values(PAYMENT_CARD_TYPE).forEach((cardCode)=> {
        if (cardCode === element) {
          this.paymentMethodsFlagList[element] = true;
        }
      });
    });
  }
}
