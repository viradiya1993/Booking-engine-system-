import { RatePlan } from "../../../common/models/packagedetails";
import { PricingDetail } from "../../../common/models/pricing-detail.model";
import { Room } from "../../../room";
import { CheckinSummary } from "../../../search/guestduration/checkinsummary.type";
import { STEP_MAP } from "../../common.constants";
import {
  DEFAULT_PRIMARY_ROOM_ATTRIBUTE_FILTER,
  DEFAULT_RATING_FILTER,
  DEFAULT_SECONDARY_ROOM_ATTRIBUTE_FILTER,
} from "../../common.constants";
import { STORE_ACTIONS } from "../actions/appActions";

export interface IBasketSateParent {
  roomno: IBasketState;
}

export interface IBasketState {
  GuestSummary: CheckinSummary;
  RoomType: string;
  RoomView: string;
  SortOrder: boolean;
  CurrencyCode: string;
  initialCurrencyCode: string;
  isPaymentCurrencyExists: boolean;
  paymentCurrencyCode: string;
  Rooms: SelectedRoom[];
  ResetFilters: boolean;
  CurrentStep: number;
  IsGuestInfoPageVisited: boolean;
  AlipayResResp: any;
  MPGSSesResp: any;
  PaymentFailure: boolean;
  PaymentFailureErrCode: any;
  LangObj: any;
  RoomBookingOrder: number[];
  LocaleObj: any;
  marketingConsent: string;
  ReservationResp: {};
  GDPRCookieSet: boolean;
  GuestIpDetails: undefined;
  isErrorPage: boolean;
  isManageBookingPage: boolean;
  ReservationID: string;
  ExternalConfNumber: any;
  ManageRoomBooking: SelectedRoom;
  rateCode: string;
  offerCode: string;
  guestPreferenceDisclaimer: string;
  cancellationCode: string;
  guestInfo: any;
  isPromoFlow: boolean;
  isSpecialsFlow: boolean;
  isCompoundAccessCode: boolean;
  isSelectedRatePlanAvailable: any;
  isOtherCompoundAccessCodeOfferAvailable: any;
  promoData: any;
  unselectedRooms: SelectedRoom[];
  isRoomEdited: boolean;
  availRatePlans: any;
  splOfferCode: string;
  bummerObj: any;
  addonTotalCost: any;
  updatedAddons: any;
  locationFilter: any;
  ratingFilter: any;
  hotelListSortOrder: boolean;
  hotelList: any;
  mapView: boolean;
  mobileView: boolean;
  isRvngModifyFlow: string;
  oldData: any;
  isRateCalModify: boolean;
  focusableModalElem: any;
  ResetMultiPropFilters: boolean;
  hotelLocAvail: [];
  isSearchPageVisited: boolean;
  is3DSCreditCard: any;
  pgAmount: number;
  pgTransactionId: string;
  systemError:boolean;
  reservedAddons: any;
  isDirectBillPolicyRate: boolean;
  roomAttributes: [];
  location: any;
  range: [];
}

export class SelectedRoom {
  SerialNo: number; // For single room
  roomIndex: number;
  UniqueCode: string;
  RoomCode: string;
  RoomDetails: Room;
  RatePlan: RatePlan;
  Pricing: PricingDetail;
  GuestInfo: any;
  additionalGuests: any;
  GuestPreference: any;
  OrignalRatePlan: any;
  PaymentInfo: any;
  OtherGuestInfo: any;
  BedType: string;
  BedTypeName: string;
  CurrencyCode: string;
  CurrencyCodeSymbol: string;
  showTaxDetails: any;
  multiRoomTaxBreakDown: any;
  availRatePlans: any;

  Packages: any[];
  applyUpgrade() {}
  undoUpgrade() {}
}

const initialState: IBasketState = {
  GuestSummary: new CheckinSummary(),
  CurrencyCode: "",
  initialCurrencyCode: "",
  isPaymentCurrencyExists: false,
  ResetFilters: false,
  paymentCurrencyCode: "",
  RoomType: DEFAULT_PRIMARY_ROOM_ATTRIBUTE_FILTER,
  RoomView: DEFAULT_SECONDARY_ROOM_ATTRIBUTE_FILTER,
  SortOrder: true,
  GDPRCookieSet: false,
  Rooms: new Array<SelectedRoom>(),
  ManageRoomBooking: new SelectedRoom(),
  CurrentStep: STEP_MAP["search"],
  IsGuestInfoPageVisited: false,
  AlipayResResp: {},
  MPGSSesResp: {},

  PaymentFailure: false,
  PaymentFailureErrCode: "",
  RoomBookingOrder: new Array<number>(),
  LangObj: { code: "en", name: "English" },
  LocaleObj: {},
  marketingConsent: "NO",
  ReservationResp: {
    ResvConfCodes: new Array<string>(),
    ConfirmationPageText: "",
    CanModify: false,
    canModifyByConfCodes: [],
    failureStatusByConfCodes: [],
    showModify: false,
    showCancel: false,
  },
  GuestIpDetails: undefined,
  isErrorPage: false,
  isManageBookingPage: false,
  ReservationID: "",
  ExternalConfNumber: "",
  rateCode: "",
  offerCode: "",
  guestPreferenceDisclaimer: "",
  cancellationCode: "",
  guestInfo: "",
  isPromoFlow: false,
  isSpecialsFlow: false,
  isCompoundAccessCode: false,
  isSelectedRatePlanAvailable: "",
  isOtherCompoundAccessCodeOfferAvailable: "",
  promoData: {
    priorAccessCode: "",
    accessCode: "",
    validationState: "",
    offerCode: "",
    isSpecialRate: false,
  },
  unselectedRooms: new Array<SelectedRoom>(),
  isRoomEdited: false,
  availRatePlans: [],
  splOfferCode: "",
  bummerObj: {
    accessCodeBummer: "",
    prevRoute: "",
    displayBummer: false,
  },
  addonTotalCost: [],
  updatedAddons: [],
  locationFilter: "",
  ratingFilter: DEFAULT_RATING_FILTER,
  hotelListSortOrder: true,
  hotelList: [],
  mapView: true,
  mobileView: false,
  isRvngModifyFlow: "",
  oldData: {
    prevRoom: "",
    prevArrivalDate: "",
    prevDepartureDate: "",
  },
  isRateCalModify: false,
  focusableModalElem: "",
  ResetMultiPropFilters: false,
  hotelLocAvail: [],
  isSearchPageVisited: false,
  isDirectBillPolicyRate: false,
  is3DSCreditCard: undefined,
  pgAmount: 0,
  pgTransactionId: "",
  systemError: false,
  reservedAddons: [],
  roomAttributes: [],
  location: "",
  range:[],
};

export function basketServiceReducer(
  state = initialState,
  action
): IBasketState {
  // const newState = Object.create(state);
  const rooms = state.Rooms;
  const editedRooms = state.unselectedRooms;
  action.roomNo = action.roomNo || 0;
  switch (action.type) {
    case STORE_ACTIONS.ACTION_SORT_ORDER_SET:
      return {
        ...state,
        SortOrder: action.payload,
        // return newState;
      };
    case STORE_ACTIONS.ACTION_ROOM_TYPE_SET:
      return {
        ...state,
        RoomType: action.payload,
        // return newState;
      };
    case STORE_ACTIONS.ACTION_ROOM_VIEW_SET:
      return {
        ...state,
        RoomView: action.payload,
        // return newState;
      };
    case STORE_ACTIONS.ACTION_LOCATION_SET:
      return {
        ...state,
        locationFilter: action.payload,
      };
    case STORE_ACTIONS.ACTION_RATING_SET:
      return {
        ...state,
        ratingFilter: action.payload,
      };
    case STORE_ACTIONS.ACTION_HOTEL_LIST_SORT_ORDER:
      return {
        ...state,
        hotelListSortOrder: action.payload,
      };
    case STORE_ACTIONS.ACTION_UPDATE_RESET_FILTERS_FLAG:
      return {
        ...state,
        ResetFilters: action.payload,
      };
      case STORE_ACTIONS.ACTION_UPDATE_IS_SEARCHPAGE_VISITED_FLAG:
      return {
        ...state,
        isSearchPageVisited: action.payload,
      };
      case STORE_ACTIONS.ACTION_UPDATE_IS_DIRECT_BILL_RATE:
      return {
        ...state,
        isDirectBillPolicyRate: action.payload,
      };
    case STORE_ACTIONS.ACTION_MANAGE_ROOM_SET:
      return {
        ...state,
        ManageRoomBooking: action.payload,
      };
    case STORE_ACTIONS.ACTION_CURRENT_STEP_SET:
      return {
        ...state,
        CurrentStep: action.payload,
        // return newState;
      };
    case STORE_ACTIONS.ACTION_GUEST_DURATION_SET:
      return {
        ...state,
        GuestSummary: action.payload,
        // return newState;
      };
    case STORE_ACTIONS.ACTION_RATE_CAL_MODIFY_FLAG:
      return {
        ...state,
        isRateCalModify: action.payload,
      };
    case STORE_ACTIONS.ACTION_ALIPAY_RESRESP_SET:
      return {
        ...state,
        AlipayResResp: action.payload,
        // return newState;
      };
    case STORE_ACTIONS.ACTION_MPGS_SESRESP_SET:
      return {
        ...state,
        MPGSSesResp: action.payload,
        // return newState;
      };
    case STORE_ACTIONS.ACTION_ROOM_SET:
      rooms[action.roomNo] = action.payload as SelectedRoom;
      return {
        ...state,
        Rooms: rooms,
      };
    case STORE_ACTIONS.ACTION_SET_UNSELECTED_ROOM:
      editedRooms[action.roomNo] = action.payload as SelectedRoom;
      return {
        ...state,
        unselectedRooms: editedRooms,
        isRoomEdited: action.isRoomEdited,
      };
    case STORE_ACTIONS.ACTION_ROOMS_SET:
      return {
        ...state,
        Rooms: action.payload,
      };
    case STORE_ACTIONS.ACTION_RATE_CODE_SET:
      return {
        ...state,
        rateCode: action.payload,
      };
    case STORE_ACTIONS.ACTION_OFFER_CODE_SET:
      return {
        ...state,
        offerCode: action.payload,
      };
    case STORE_ACTIONS.ACTION_ROOM_ORDER_SET:
      return {
        ...state,
        RoomBookingOrder: action.payload,
      };
    case STORE_ACTIONS.ACTION_ROOM_RATEPLAN_SET:
      if (state.Rooms.length > 0) {
        rooms[action.roomNo].RatePlan = action.payload as RatePlan;
        return {
          ...state,
          Rooms: rooms,
        };
      }
      break;
    case STORE_ACTIONS.ACTION_ROOM_PRICING_SET:
      if (state.Rooms.length > 0) {
        rooms[action.roomNo].Pricing = action.payload as PricingDetail;
        return {
          ...state,
          Rooms: rooms,
        };
      }
      break;
    case STORE_ACTIONS.ACTION_ROOM_GUESTINFO_SET:
      if (state.Rooms.length > 0) {
        rooms[action.roomNo].GuestInfo = action.payload;
        return {
          ...state,
          Rooms: rooms,
        };
      }
      break;
    case STORE_ACTIONS.ACTION_ROOM_GUESTPREFERENCE_SET:
      if (state.Rooms.length > 0) {
        rooms[action.roomNo].GuestPreference = [];
        rooms[action.roomNo].GuestPreference = action.payload;
        return {
          ...state,
          Rooms: rooms,
        };
      }
      break;
    case STORE_ACTIONS.ACTION_ROOM_PAYMENT_SET:
      if (state.Rooms.length > 0) {
        rooms[action.roomNo].PaymentInfo = action.payload;
        return {
          ...state,
          Rooms: rooms,
        };
      }
      break;
    case STORE_ACTIONS.ACTION_ROOM_OTHERGUEST_SET:
      if (state.Rooms.length > 0) {
        rooms[action.roomNo].OtherGuestInfo = action.payload;
        return {
          ...state,
          Rooms: rooms,
        };
      }
      break;
    case STORE_ACTIONS.ACTION_PAYMENT_FAILURE:
      return {
        ...state,
        PaymentFailure: action.payload,
        // return newState;
      };
    case STORE_ACTIONS.ACTION_PAYMENT_ERROR_CODE:
      return {
        ...state,
        PaymentFailureErrCode: action.payload,
        // return newState;
      };
    case STORE_ACTIONS.ACTION_UPDATE_CURRENCY_CODE_OBJ:
      return {
        ...state,
        CurrencyCode: action.payload,
      };
    case STORE_ACTIONS.ACTION_UPDATE_INTIAL_CURRENCY_CODE_OBJ:
      return {
        ...state,
        initialCurrencyCode: action.payload,
      };
    case STORE_ACTIONS.ACTION_UPDATE_PAYMENT_CURRENCY_CODE_OBJ:
      return {
        ...state,
        isPaymentCurrencyExists: action.payload.isPaymentCurrencyExists,
        paymentCurrencyCode: action.payload.paymentCurrencyCode,
      };
    case STORE_ACTIONS.ACTION_SET_MARKETING_CONSENT:
      return {
        ...state,
        marketingConsent: action.payload,
      };
    case STORE_ACTIONS.ACTION_GUEST_IP:
      return {
        ...state,
        GuestIpDetails: action.payload,
      };
    case STORE_ACTIONS.ACTION_IS_ERROR_PAGE:
      return {
        ...state,
        isErrorPage: action.payload,
        // return newState;
      };
    case STORE_ACTIONS.ACTION_IS_MANAGEBOOKING_PAGE:
      return {
        ...state,
        isManageBookingPage: action.payload,
        // return newState;
      };
    case STORE_ACTIONS.ACTION_RESERVATION_ID_SET:
      return {
        ...state,
        ReservationID: action.payload,
        // return newState;
      };
    case STORE_ACTIONS.ACTION_EXTERNAL_RESERVATION_ID_SET:
      return {
        ...state,
        ExternalConfNumber: action.payload,
      };
    case STORE_ACTIONS.ACTION_GDPR_SET:
      return {
        ...state,
        GDPRCookieSet: action.payload,
      };

    case STORE_ACTIONS.ACTION_GUEST_PREFERENCES_DISCLAIMER_SET:
      return {
        ...state,
        guestPreferenceDisclaimer: action.payload,
      };
    case STORE_ACTIONS.ACTION_RESERVATION_RESPONSE_SET:
      return {
        ...state,
        ReservationResp: {
          CanModify: action.payload.CanModify,
          ConfirmationPageText: action.payload.ConfirmationPageText,
          ResvConfCodes: action.payload.ResvConfCodes.filter( () => true),
          canModifyByConfCodes: action.payload.canModifyByConfCodes.filter( () => true),
          failureStatus: action.payload.failureStatus,
          failureStatusByConfCodes: action.payload.ResvConfCodes.failureStatusByConfCodes,
          showCancel: action.payload.showCancel,
          showModify: action.payload.showModify,
          suppressRateOnLookup: action.payload.suppressRateOnLookup
        },
      };

    case STORE_ACTIONS.ACTION_IS_GUESTINFO_VISITED:
      return {
        ...state,
        IsGuestInfoPageVisited: action.payload,
      };
    // ACTION_UPDATE_CANCELLATION_CODE
    case STORE_ACTIONS.ACTION_UPDATE_CANCELLATION_CODE:
      return {
        ...state,
        cancellationCode: action.payload,
      };
    case STORE_ACTIONS.ACTION_SAVE_GUEST_INFO:
      return {
        ...state,
        guestInfo: action.payload,
      };
    case STORE_ACTIONS.ACTION_UPDATE_POLICY_CODE_GUARANTEE_PERCENTAGE:
      if (state.Rooms.length > 0) {
        rooms[action.roomNo].RatePlan = action.payload;
        return {
          ...state,
          Rooms: rooms,
        };
      }
    case STORE_ACTIONS.ACTION_UPDATE_IS_PROMO_FLOW:
      return {
        ...state,
        isPromoFlow: action.payload,
      };
    case STORE_ACTIONS.ACTION_UPDATE_IS_SPECIALS_FLOW:
      return {
        ...state,
        isSpecialsFlow: action.payload,
      };
    case STORE_ACTIONS.ACTION_SET_IS_COMPOUND_ACCESSCODE:
      return {
        ...state,
        isCompoundAccessCode: action.payload,
      };
    case STORE_ACTIONS.ACTION_SET_SELECTED_RATEPLAN_AVAILABLE:
      return {
        ...state,
        isSelectedRatePlanAvailable: action.payload,
      };
    case STORE_ACTIONS.ACTION_SET_OTHER_COMPOUND_OFFERS_AVAILABLE:
      return {
        ...state,
        isOtherCompoundAccessCodeOfferAvailable: action.payload,
      };
    case STORE_ACTIONS.ACTION_UPDATE_PROMO_DATA:
      return {
        ...state,
        promoData: action.payload,
      };
    case STORE_ACTIONS.ACTION_SET_AVAILABLE_RATEPLANS:
      return {
        ...state,
        availRatePlans: action.payload,
      };
    case STORE_ACTIONS.ACTION_SET_SPECIALS_OFFERCODE:
      return {
        ...state,
        splOfferCode: action.payload,
      };
    case STORE_ACTIONS.ACTION_UPDATE_PROMO_BUMMER:
      return {
        ...state,
        bummerObj: action.payload,
      };
    case STORE_ACTIONS.ACTION_SET_ADDONS_TOTAL:
      return {
        ...state,
        addonTotalCost: action.payload,
      };
    case STORE_ACTIONS.ACTION_UPDATE_ALACARTE_ADDONS:
      return {
        ...state,
        updatedAddons: action.payload,
      };
    case STORE_ACTIONS.ACTION_UPDATE_HOTEL_LIST:
      return {
        ...state,
        hotelList: action.payload,
      };
    case STORE_ACTIONS.ACTION_MAP_VIEW:
      return {
        ...state,
        mapView: action.payload,
      };
    case STORE_ACTIONS.ACTION_VIEW_TYPE:
      return {
        ...state,
        mobileView: action.payload,
      };
    case STORE_ACTIONS.ACTION_IS_RVNG_MODIFY_FLOW:
      return {
        ...state,
        isRvngModifyFlow: action.payload,
      };
    case STORE_ACTIONS.ACTION_UPDATE_OLD_RESER_DETAILS:
      return {
        ...state,
        oldData: action.payload,
      };
    case STORE_ACTIONS.ACTION_UPDATE_ADDITIONAL_GUESTS:
      if (state.Rooms.length > 0) {
        rooms[action.roomNo].additionalGuests = action.payload;
      }
      return {
        ...state,
        Rooms: rooms,
      };
    case STORE_ACTIONS.ACTION_SET_ACTIVEMODAL_ELEM:
      return {
        ...state,
        focusableModalElem: action.payload,
      };
    case STORE_ACTIONS.ACTION_RESET_MULTI_PROP_FILTERS:
      return {
        ...state,
        ResetMultiPropFilters: action.payload,
      };
    case STORE_ACTIONS.ACTION_UPDATE_HOTEL_LOC_AVAIL:
      return {
        ...state,
        hotelLocAvail: action.payload,
      };
    case STORE_ACTIONS.ACTION_UPDATE_IS_3DS_CREDIT_CARD:
      return {
        ...state,
        is3DSCreditCard: action.payload,
      };
    case STORE_ACTIONS.ACTION_SET_PG_DEPOSIT_AMT:
      return {
        ...state,
        pgAmount: action.payload,
      };
    case STORE_ACTIONS.ACTION_SET_PG_TRANSACTION_ID:
      return {
        ...state,
        pgTransactionId: action.payload,
      };
    case STORE_ACTIONS.ACTION_SET_SYSTEM_ERROR:
      return {
        ...state,
        systemError: action.payload,
      };
    case STORE_ACTIONS.ACTION_FETCH_RESERVED_ADDONS:
      return {
        ...state,
        reservedAddons: action.payload,
      };
    case STORE_ACTIONS.ACTION_SET_ROOM_ATTRIBUTES:
      return {
        ...state,
        roomAttributes: action.payload,
      };
    case STORE_ACTIONS.ACTION_SET_LOCATION_FOR_FILTERS:
      return {
        ...state,
        location: action.payload,
      };      
    case STORE_ACTIONS.ACTION_SET_PRICE_SLIDER_RANGE:
      return {
        ...state,
        range: action.payload,
      };
  }

  return state;
}
