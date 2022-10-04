export class AlaCarteAddon {
  addOnCode: string;
  addOnId: any;
  addOnName: string;
  averageAdultPrices: object;
  averageChildPrices: object;
  base_perAdult?: string;
  base_perChild?: string;
  basis?: string;
  basePrice: object;
  baseAdultPrices: object;
  baseChildPrices: object;
  btn_selector: string;
  description: string;
  frequency?: string;
  imageInfo: any[];
  leadPhoto: object;
  maxQuantityBookable: number;
  photos: any[];
  priceBasis: string;
  priceFrequency: string;
  shortDescription: string;
  taxAndFees: object;
  totalPrice: object;
  totalPriceWithoutTax: object;
  unitPrice: object;
  validDaysOfWeek: string;
  validRoomCodes: any[];
}

export interface IValidRoomCodesObj {
  addOnCode: string;
  validRoomCodes: any[];
}
