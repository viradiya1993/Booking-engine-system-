export const SESSION_URL_CONST: any = {
  PATH_PREFIX: "https://mbsapi-qa1.reztrip.io",
  PROXY_PATH_PREFIX: "https://mbs-staging.accolite.com/mbsp",
  // 'PROXY_PATH_PREFIX': 'http://localhost:3000/mbsp',
  PROPERTY_CODE_PARAM: "propertyCode",
  PORTAL_SUBDOMAIN_PARAM: "portalSubdomain",

  // 'PROPERTY_CODE': 'mbsqa1',
  LOCALE_PARAM: "locale",
  DEVICETYPE_PARAM: "deviceType",
  CLIENT_IP: "ip_address",
  DEFAULT_LOCALE: "en",
  GET_PROMO_LIST: {
    path: "promo",
    cache: false,
    proxy: false,
  },
  GET_AVAILABLE_ROOMS: {
    path: "availableRooms",
    cache: false,
    proxy: false,
  },
  GET_HOTEL_LIST: {
    path: "hotelList",
    cache: false,
    proxy: false,
  },
  GET_ROOMS_DETAILS_BY_ROOM_CODE: {
    path: "rooms",
    cache: false,
    proxy: false,
  },
  GET_AVAILABLE_RATE_PLANS: {
    path: "availableRateplans",
    cache: false,
    proxy: false,
  },
  GET_RATE_PLAN_DETAILS: {
    path: "rateplans",
    cache: false,
    proxy: false,
  },
  RATE_CALANDER: {
    path: "rateCalendar",
    cache: false,
    proxy: false,
  },
  ROOMS_BOOKED: {
    path: "roomsBooked",
    cache: false,
    proxy: false,
  },
  AVAILABLE_ROOM_UPGRADE: {
    path: "availableRoomUpgrade",
    cache: false,
    proxy: false,
  },
  UPGRADE_ROOM: {
    path: "upgradeRoom",
    cache: false,
    proxy: false,
  },
  AVAILABLE_ADDONS: {
    path: "addonPriceAndAvailability",
    cache: false,
    proxy: false,
  },
  CROSS_SELL_ADDONS: {
    path: "crossSellAddons",
    cache: false,
    proxy: false,
  },
  CREATE_RESERVATION: {
    path: "reservation",
    cache: false,
    proxy: false,
  },
  GET_ALIPAY_URL: {
    path: "alipayChargeRedirectUrl",
    cache: false,
    proxy: false,
  },
  GET_MPGS_URL: {
    path: "mpgs/session",
    cache: false,
    proxy: false,
  },
  GET_MPGS_BOOKING_URL: {
    path: "mpgs/booking",
    cache: false,
    proxy: false,
  },
  GET_MPGS_TRANSACTION_STATUS_URL: {
    path: "mpgs/transaction",
    cache: false,
    proxy: false,
  },
  RETRIEVE_RESERVATION: {
    path: "reservations",
    cache: false,
    proxy: false,
  },
  TOKENIZE_CARD: {
    path: "tokenizeCard",
    cache: false,
    proxy: false,
  },
  GET_LANG_JSON: {
    path: "translateUILabels",
    cache: false,
    proxy: false,
  },
  GET_RESERVATION_LOOKUP: {
    path: "reservation",
    cache: false,
    proxy: false,
  },
  GET_SIMPLEPAY_RESERVATION_LOOKUP: {
    path: "pgBookingResponse",
    cache: false,
    proxy: false,
  },
  CANCEL_RESERVATION_REQUEST: {
    path: "cancelRes",
    cache: false,
    proxy: false,
  },
  GET_PROP_INFO: {
    path: "propertyInfo",
    cache: false,
    proxy: false,
  },
  GET_PREFERENCES: {
    path: "guestPreferences",
    cache: false,
    proxy: false,
  },
  CHANGE_PREFERENCES: {
    path: "changePreferences",
    cache: false,
    proxy: false,
  },
  GET_Header_Footer: {
    path: "headerfooter",
    cache: false,
    proxy: false,
  },
  VALIDATE_RESERVATION: {
    path: "reservation/validate",
    cache: false,
    proxy: false,
  },
  MODIFY_BOOKING: {
    path: "modifyRes",
    cache: false,
    proxy: false,
  },
  PAYMENT_METHODS: {
    path: "paymentMethods",
    cache: false,
    proxy: false,
  },
  VALIDATE_IATA_NUMBER: {
    path: "checkIATA",
    cache: false,
    proxy: false,
  },
  VALIDATE_FOR_MODIFY: {
    path: "validateResForModify",
    cache: false,
    proxy: false,
  },
  RESEND_EMAIL_REQUEST: {
    path: "resendResEmail",
    cache: false,
    proxy: false,
  },
  HEADER_MENU_ITEMS: {
    path: "getMenuItems",
    cache: false,
    proxy: false,
  },
  VALIDATE_ACCESS_CODE: {
    path: "validateAccessCode",
    cache: false,
    proxy: false,
  },
  ALACARTE_ADDONS: {
    path: "alaCarteAddons",
    cache: false,
    proxy: false,
  },
  VALIDATE_ROOM_ADDONS: {
    path: "validRoomsForAddOns",
    cache: false,
    proxy: false,
  },
  FILTER_ROOM_ATTRIBUTES: {
    path: "roomAttributes",
    cache: false,
    proxy: false,
  },
  ROOM_VIEW: "room-views",
  ROOM_TYPE: "room-types",
  ROOM_DETAIL: "rooms",
  PACKAGE_DETAIL: "Packages",
  RATES: "Rates",
};

export const CONTENT_URL_CONST: any = {};
export const PAYMENT_SUCCESS_CALLBACK = "/paymentsuccess?";
export const PAYMENT_FAILURE_CALLBACK = "/paymentfailure?";
