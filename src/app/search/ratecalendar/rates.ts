export interface Rates {
  rateCode: string;
  ratePlanName: string;
  currencyIndex: number;
  currencyCode: string;
  currencyCodes: string[];
  rates: RateDetail[];
}

export interface RateDetail {
  date: string;
  dayRate: string;
  dayRates: number[];
  available: boolean;
  isClosedToArrival: boolean;
  isClosedToDeparture: boolean;
  minLos: number;
  maxLos: number;
  numRoomsAvailable: number;
}
