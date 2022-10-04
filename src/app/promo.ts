export class Promos {
  status: Status;
  data: PromosData;
}

export class Status {
  success: boolean;
  statusCode: number;
  statusText: string;
}

export class PromosData {
  searchTransactionId: string;
  ratePlanDetails: PromoDetails[];
  isCompoundAccessCode: boolean;
}

export class PromoDetails {
  name: string;
  code: string;
  description: string;
  longDescription: string;
  shortDescription: string;
  privileges: any[];
  imageInfo: ImageInfo[];
  maxAdultOccupancy: number;
  maxChildOccupancy: number;
  maxTotalOccupancy: number;
  roomtypes: any[];
  roomviews: any[];
  bedTypes: any[];
  averagePriceByCurrency: object;
  discountedAveragePriceByCurrency: object;
  totalPriceByCurrency: object;
  totalDiscountedPriceByCurrency: object;
  lowestRoomTypeCode: string;
  lowestUnitAddOnPrice: object;
  guaranteePercentage: number;
  taxesAndServiceChargesByCurrency: TaxesAndServiceChargesByCurrency[];
  nightlyPrices: NightlyPrices[];
  rateplanComments: string[];
  cancellationPolicy: string;
  noCancellationDate: string;
  marketingConsent: string;
  searchTransactionId: string;
  availableRooms: Room[];
  isBookable: boolean;
}

export class Room {
  code: string;
  name: string;
  shortDescription: string;
  maxAdultOccupancy: number;
  maxChildOccupancy: number;
  maxTotalOccupancy: number;
  occupancyDescription: string;
  roomType: string;
  roomView: string;
  bedTypes: any[];
  valueOrder: number;
  defaultBedType: string;
  averagePriceByCurrency: object;
  discountedAveragePriceByCurrency: object;
  totalPriceByCurrency: object;
  totalDiscountedPriceByCurrency: object;
  lowestUnitAddOnPrice: object;
  termsAndConditions: string;
  thumbnailImageUrl: string;
  thumbnailJumboImageUrl: string;
  largeImageUrl: string;
  amenities?: RoomAmenitiesEntity[] | null;
  priceByDefaultCurrency: number;
  roomViewDescription: string;
  // avgPriceWithAddOn: number;
  // discountedAvgPriceWithAddOn: number;
}
export interface NightlyPrices {
  effectiveDate: string;
  priceByCurrency: PriceByCurrency[];
  discountedPriceByCurrency: PriceByCurrency[];
}

export interface PriceByCurrency {
  currencyCode: string;
  price: number;
}

export interface TaxesAndServiceChargesByCurrency {
  currencyCode: string;
  taxesAnsServiceCharges: number;
}
export class RoomAmenitiesEntity {
  // code: number;
  name: string;
  // desc: string;
  thumbnailImageUrl: string;
  // icon: string;
}

export class ImageInfo {
  caption: string;
  description: string;
  urls: object;
  alt_text: string;
}
