export interface Package {
  id: number;
  packageTitle: string;
  descr: string;
  features: string[];
  price: number;
  packageItems?: PackageItemsEntity[] | null;
}
export interface PackageItemsEntity {
  id: number;
  title: string;
  imageUrl: string;
  type: string;
  minAge?: number | null;
}

export interface AvailableRoomRatePlans {
  id: string;
  status: string;
  data: Data[];
}
export interface Data {
  bedTypeName: string;
  bedTypeCode: string;
  bedTypeImageUrl: string;
  roomCode: string;
  roomName: string;
  roomSeqNo: number;
  availableRatePlans: RatePlan[];
}
export interface RatePlan {
  pretaxPriceByCurrency: any;
  name: string;
  code: string;
  description: Description[];
  averagePriceByCurrency: AveragePriceByCurrency[];
  discountedAveragePriceByCurrency: DiscountedAveragePriceByCurrency[];
  nightlyPrices: NightlyPrices[];
  taxesAndServiceChargesByCurrency: TaxesAndServiceChargesByCurrency[];
  rateplanComments: string[];
  cancellationPolicy: string;
  noCancellationDate: string;
  marketingConsent: string;
  lowestUnitAddOnPrice: any;
  addOnInfo: AddonInfo[];
  guaranteePercentage: number;
  searchTransactionId: string;
  totalDiscountedPriceByCurrency: TotalDiscountedPriceByCurrency[];
  totalPriceByCurrency: TotalPriceByCurrency[];
  directbill: boolean;
  packageAddOnTaxesByCurrency: any;
}
export interface AddonInfo {
  addOnCode: string;
  addOnType: string;
}

export interface Description {
  title: string;
}
export interface AveragePriceByCurrency {
  currencyCode: string;
  averagePrice: number;
}

export interface DiscountedAveragePriceByCurrency {
  currencyCode: string;
  discountedAveragePrice: number;
}

export interface TotalPriceByCurrency {
  currencyCode: string;
  totalPrice: number;
}

export interface TotalDiscountedPriceByCurrency {
  currencyCode: string;
  totalDiscountedPrice: number;
}
export interface NightlyPrices {
  effectiveDate: string;
  priceByCurrency: PriceByCurrency[];
  discountedPriceByCurrency: PriceByCurrency[];
  priceByCurrencyWithPackageAddOnsTaxes: PriceByCurrency[];
  discountedPriceByCurrencyWithPackageAddOnsTaxes: PriceByCurrency[];
}
export interface TaxesAndServiceChargesByCurrency {
  currencyCode: string;
  taxesAnsServiceCharges: number;
}
export interface PriceByCurrency {
  currencyCode: string;
  price: number;
}
export interface SelectedNightPriceFormat {
  effectiveDateFormat: string;
  price: number;
  currCode: string;
}
