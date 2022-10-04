import { CreditCardDetails } from "./credit-card-details.model";
import { GuestInfoDetails } from "./guest-info-details.model";

export class ReservationDetails {
  langCode: string;
  deviceType: string;
  roomIndex: number;
  propertyCode: string;
  numberOfAdults: number;
  numberOfChildren: number;
  arrivalDate: string;
  departureDate: string;
  roomCode: string;
  bedTypeCode:String;
  rateCode: string;
  nightlyPrices: NightlyPrices[];
  arrivalTimeInfo: string;
  packages: AddonPackage[];
  guaranteePercentage: any;
  policyCode: any;
  policyGuaranteeType: any;
  policyType: any;
  udCancelHistoryId: any;
  prePaymentType: any;
  preTaxAmount: number;
  taxAndServices: number;
  totalPackagePrice: number;
  paymentCurrencyType: string;
  guestCurrencyPreTaxAmount: number;
  guestCurrencyTotalPackagePrice: number;
  guestCurrencyTaxAndServices: number;
  guestInfo: GuestInfoDetails;
  creditCardDetails: CreditCardDetails;
  guestRoomPreferences: any[];
  successCallbackUrl: string;
  errorCallbackUrl: string;
  baseBookingURL: string;
  uuid: string;
  marketingConsent: string;
  iataNumber: string;
  searchTransactionId: string;
  cardType: string;
  mpgssessionFailure: boolean;
  mpgsiframeLaunchFailure: boolean;
  mpgsOrderId: string;
  dprCode: string;
  confirmationCode: string;
  originalRoomCode: string;
  totalUpgradePrice: number;
  clientIP: any;
  accessCode: any;
  portalSubdomain: any;
  guestuid: any;
  stayuid: any;
  payuid: any;
  alaCarteAddOns: any;
  suppressRateOnLookup: boolean;
  additionalGuests: any;
  paymentDetailsCollected: boolean;
  pretaxPriceByCurrency: any;
  payNow: boolean;
  payLater: boolean;
}

export class NightlyPrices {
  effectiveDate: string;
  price: number;
  guestCurrencyPrice: number;
}
export class AddonPackage {
  addOnId: number;
  count: number;
  dateTime: string;
  category: string;
  unitPrice: number;
  guestCurrencyUnitPrice: number;
  addOnConsent: boolean;
}
