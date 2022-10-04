import { STORE_ACTIONS } from "../actions/appActions";

export class LangObj {
  code: string;
  name: string;
  constructor(code: string, name: string) {
    this.code = code;
    this.name = name;
  }
}

export class Currency {
  symbol: string;
  name: string;
  code: string;
  constructor(symbol: string, name: string, code: string) {
    this.symbol = symbol;
    this.name = name;
    this.code = code;
  }
}

export class PropertyInfo {
  propertyName: string;
  propertyCode: string;
  defaultLocale: string;
  defaultCurrency: string;
  propertyTimezone: string;
  checkInTime: string;
  checkOutTime: string;
  maxNoOfAdultsPerRoom: number;
  maxNoOfChildrenPerRoom: number;
  supportedLanguages: Object[];
  supportedCurrencies: Object[];
  maxLeadTime: number;
  noOfMaxAmenities: number;
  clientIp: any;
  masterVisaCheckoutApi: any;
  clientCountry: string;
  showIATA: boolean;
  showAccessCode: boolean;
  singlePropertyPortal: boolean;
  viewHotelInSinglePropertyPortal: boolean;
  openPropertyPageInExistingTab: string;
  adultAge: number;
  showAverageNightlyRate: boolean;
  constructor() {}
}

export class IATA {
  prevIataNumber: string;
  iataNumber: string;
  iataAgencyName: string;
  isValidIata: boolean;
  isIataFromQueryParam: boolean;
}

export class MultiPropertyInfo {
  isHotelSelected: boolean;
  hotelCode: string;
  hotelPortalSubdomain: string;
  hotelName: string;
}

export interface IUserSettingsState {
  langObj: LangObj;
  localeObj: any;
  currency: Currency;
  propertyInfo: PropertyInfo;
  deviceType: string;
  iata: IATA;
  multiPropertyInfo: MultiPropertyInfo;
}

const initialState: IUserSettingsState = {
  langObj: { code: "en", name: "English" },
  localeObj: {},
  currency: { symbol: "", name: "Singapore Dollar", code: "SGD" },
  propertyInfo: new PropertyInfo(),
  deviceType: "",
  iata: {
    iataNumber: "",
    iataAgencyName: "",
    isValidIata: false,
    isIataFromQueryParam: true,
    prevIataNumber: "",
  },
  multiPropertyInfo: {
    isHotelSelected: false,
    hotelCode: "",
    hotelPortalSubdomain: "",
    hotelName: "",
  },
};

export function userSettingsReducer(
  state = initialState,
  action
): IUserSettingsState {
  switch (action.type) {
    case STORE_ACTIONS.ACTION_UPDATE_LANG_OBJ:
      return {
        ...state,
        langObj: action.payload,
      };
    case STORE_ACTIONS.ACTION_UPDATE_LOCALE_OBJ:
      return {
        ...state,
        localeObj: action.payload,
      };
    case STORE_ACTIONS.ACTION_UPDATE_DEVICE_TYPE:
      return {
        ...state,
        deviceType: action.payload,
      };
    // case STORE_ACTIONS.ACTION_UPDATE_CURRENCY_CODE_OBJ:
    //   return {
    //     ...state,
    //     currency: action.payload
    //   };
    case STORE_ACTIONS.ACTION_UPDATE_PROPERTY_INFO_OBJ:
      return {
        ...state,
        propertyInfo: action.payload,
      };

    case STORE_ACTIONS.ACTION_IATA_NUMBER_SET:
      return {
        ...state,
        iata: action.payload,
      };

    case STORE_ACTIONS.ACTION_UPDATE_MULTIPROPERTY_INFO:
      return {
        ...state,
        multiPropertyInfo: action.payload,
      };
  }
  return state;
}
