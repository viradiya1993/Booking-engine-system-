import { SESSION_URL_CONST } from "./urls.constants";

export const RATE_CALENDAR_SETTINGS = {
  MIN_LOS: 1,
  MAX_LOS: 8, // 8 days = 7 nights
  DEFAULT_LOS: 1,
  MIN_ADULTS: 1,
  MAX_ADULTS: 10,
  DEFAULT_ADULTS: 1,
  MIN_CHILDREN: 0,
  MAX_CHILDREN: 10,
  DEFAULT_CHILDREN: 0,
  MAX_OCCUPENCY_PER_ROOM: 10,
  MIN_CALENDAR_MONTHS_LOADED: 2, // NOT USED YET
  MAX_CALENDAR_MONTHS_LOADED: 13,
  MAX_ROOMS_ALLOWED: 5,
  MIN_ROOMS_ALLOWED: 1,
  MAX_LEAD_TIME: 365, // days
};

export const MAX_AMENITIES_SHOWN = 5;

export const SHOW_RESEND_EMAIL_BUTTON = false;

export const SHOW_COOKIE_POPUP = true;

export const DAY_MILLIS = 86400000;
export const ZERO_TIME_STR = "00:00:00";
/**common constants */
export const CACHE_IGNORE_LIST: any = [SESSION_URL_CONST.AVAILABLE_ADDONS];
export const CACHE_API_LIST: any = [];
export const PIPE_COSTANTS = {
  "DD-MM-YYYY": "dd-MM-yyyy",
  "YYYY-MM-DD": "yyyy-MM-dd",
};
export const TEALIUM_PAGE_NAMES = {
  booking_search: "booking_search",
  booking_select_room: "booking_select_room",
  booking_payment: "booking_payment",
  booking_confirmation: "booking_confirmation",
};
export const derbyTag =
  '<img height="1" width="1" style="border-style:none;display: none" alt="" src="{{$1}}"/>';
export const MAX_ROOM_SELECTION = 5;
// export const TripTease_ID = 'TripTease_ID';
export const URL_PATHS = {
  HOME_PAGE: "",
  SEARCH_PAGE: "search",
  ROOMS_PAGE: "rooms",
  GUEST_INFO_PAGE: "guestCreditCardInfo",
  CONFIRMATION_PAGE: "confirmation",
  SYSTEM_ERROR: "systemError",
  MANAGE_BOOKING: "managebooking",
  BOOKING_DETAILS: "bookingdetails",
  CANCEL_BOOKING: "cancelbooking",
  MAINTENANCE_ERROR: "maintenanceError",
  MULTIROOMPLANLISTING: "multiroomRatePlanListing",
  PROMO_PAGE: "promo",
  SPECIALS_PAGE: "specials",
  // PAYMENT_SUCCESS: 'paymentsuccess',
  // PAYMENT_FAILURE: 'paymentfailure',
  // ALIPAY: 'aliPay'
};
export const MANAGE_BOOKING_FLAG = true;
export const MAINTENANCE_STATUS_CODE = 3014;
export const CUSTOM_CURRENCY_FORMAT = {
  KRW: {
    DECIMAL_FORMAT: "1.0-0",
  },
  IDR: {
    DECIMAL_FORMAT: "1.0-0",
    SEPERATOR: ".",
  },
  JPY: {
    DECIMAL_FORMAT: "1.0-0",
  },
};
export const NON_DECIMAL_CURRENCIES = ["JPY", "IDR", "KRW"];

export const STEP_MAP = {
  search: 0,
  rooms: 1,
  guestCreditCardInfo: 2,
  confirmation: 3,
  promo: 4,
};
export const PREFERENCES_TYPES = {
  SINGLE: "single",
  MULTIPLE: "multiple",
  FREETEXT: "freeText",
  TIME_BASED: "arrivalTime",
};
export const QUERY_PARAM_ATTRIBUTES = {
  CHECKINDATE: "CheckinDate",
  LOS: "LOS",
  ADULTS: "Adults",
  CHILDREN: "Children",
  ROOMS: "Rooms",
  CURRENCY: "Currency",
  LOCALE: "locale",
  IATA: "iataNumber",
  RATECODE: "offerCode",
  OFFERCODE: "offerCode",
  CONFIRMATIONCODE: "confirmation_code",
  FLOW: "flow",
  MULTIROOM: "multi",
  PAYMENT_METHOD_RATECODE: "rateCode",
  VALIDATE_IATA_API_PARAM: "iataCode",
  IS_SPECIAL_RATE: "isSpecialRate",
  ACCESS_CODE: "accessCode",
  PROPETY_CODE: "propertyCode",
  VALIDATE_ACCESS_CODE: "accessCode",
};

export const Languages = [
  {
    name: "English",
    symbol: "en",
  },
];
export const EXPECTED_TIMES = ["03:00", "06:00", "09:00", "12:00"];

export const MONTH_NAMES = [
  "tf_1_Calendar_Month_January",
  "tf_1_Calendar_Month_February",
  "tf_1_Calendar_Month_March",
  "tf_1_Calendar_Month_April",
  "tf_1_Calendar_Month_May",
  "tf_1_Calendar_Month_June",
  "tf_1_Calendar_Month_July",
  "tf_1_Calendar_Month_August",
  "tf_1_Calendar_Month_September",
  "tf_1_Calendar_Month_October",
  "tf_1_Calendar_Month_November",
  "tf_1_Calendar_Month_December",
];
export const SALUTATIONS = ["Mr.", "Ms.", "Mrs.", "Miss", "Dr."];

export const MONTHS_MAP = {
  1: "tf_1_Calendar_Month_Jan",
  2: "tf_1_Calendar_Month_Feb",
  3: "tf_1_Calendar_Month_Mar",
  4: "tf_1_Calendar_Month_Apr",
  5: "tf_1_Calendar_Month_May",
  6: "tf_1_Calendar_Month_Jun",
  7: "tf_1_Calendar_Month_Jul",
  8: "tf_1_Calendar_Month_Aug",
  9: "tf_1_Calendar_Month_Sep",
  10: "tf_1_Calendar_Month_Oct",
  11: "tf_1_Calendar_Month_Nov",
  12: "tf_1_Calendar_Month_Dec",
};

export const checkErrorCodesList = {
  PriceChangeErrorCodes: [3012, 9001],
  PaymentErrorCodes: [
    3004,
    30001,
    3005,
    3006,
    1001,
    3002,
    3003,
    30002,
    3200,
    3201,
    3202,
    3203,
    3204,
    3205,
    3206,
    3207,
    3208,
    3209,
    3210,
    3211,
    3212,
    3213,
    3214,
    3215,
    3216,
    3217,
    3218,
    3219,
    3220,
    3221,
    3222,
    3223,
    3224,
    3225,
    3226,
    3227,
    3228,
    3300,
    1005,
    5004,
  ],
  RoomListingErrorCodes: [6001, 1001],
  InventoryUnavailableErrorCodes: [3000, 3001, 8000, 9000, 3013, 6003],
  PolicyChangeErrorCodes: [6004],
  AlacarteAddonsErrorCodes: [9002, 9003],
};

export const error_code_prefix = "tf_99_errorCode_";
export const calendar_month_prefix = "tf_1_Calendar_Month_";

export const ErrorCodesListInComponents = {
  Search: [
    4000,
    3000,
    3001,
    3002,
    3003,
    3004,
    3005,
    3006,
    30001,
    1001,
    6001,
    3012,
    9001,
    8000,
    9000,
    3013,
  ],
  RateCalander: [
    4000,
    3000,
    3001,
    3002,
    3003,
    3004,
    3005,
    3006,
    30001,
    1001,
    6001,
    3012,
    9001,
    8000,
    9000,
    3013,
  ],
  RoomListingPage: [3002, 3003, 3004, 3005, 3006, 30001, 3012, 9001, 1001],
  MultiRoomBanner: [4000, 3000, 3001, 1001, 6001, 8000, 9000, 3013],
  SelectRoom: [4000, 3000, 3001, 6001, 8000, 9000, 1001, 3013],
  GuestCreditCardPage: [
    4000,
    3000,
    3001,
    1001,
    6001,
    8000,
    9000,
    30002,
    3012,
    3004,
    6004,
  ],
  Confirmation: [
    3002,
    3003,
    3004,
    3005,
    3006,
    30001,
    3012,
    9001,
    1001,
    8000,
    9000,
    3013,
  ],
  PaymentMethodComponent: [
    3004,
    30001,
    3005,
    3006,
    1001,
    3002,
    3201,
    3200,
    3003,
    3202,
    3203,
    3204,
    3205,
    3206,
    3207,
    32083209,
    3210,
    3211,
    3212,
    3213,
    3214,
    3215,
    3216,
    3217,
    3218,
    3219,
    3220,
    3221,
    3222,
    3223,
    3224,
    3225,
    3226,
    3227,
    3228,
    3300,
    1005,
    5004,
    6004,
  ],
};

export const MANAGE_BOOKING_VERIFICATION = {
  2201: "tf_99_errorCode_2201",
  2100: "tf_99_errorCode_2100",
  2202: "tf_99_errorCode_2202",
  6003: "tf_99_errorCode_6003",
  6000: "tf_99_errorCode_6000",
  6002: "tf_99_errorCode_6002",
  2204: "tf_99_errorCode_2204",
};

// export const TRIPTEASE_ATTRIBUTES = {
//   HOTEL_KEY: 'data-pf-hotelkey',
//   CHECK_IN_DATE: 'data-pf-checkin',
//   CHECK_OUT_DATE: 'data-pf-checkout',
//   DIRECT_PRICE: 'data-pf-direct-price',
//   ROOM_RATE: 'data-pf-room-rate',
//   ROOMS: 'data-pf-rooms',
//   ADULTS: 'data-pf-adults',
//   CHILDREN: 'data-pf-children',
//   CHILDREN_AGES: 'data-pf-children-ages',
//   CURRENCY: 'data-pf-currency',
//   LANGUAGE: 'data-pf-language',
//   ROOM_RATE_SAMPLE: 'Book Direct and Save S$20',
//   MANUAL_ACTIAVTION: 'data-pf-activation'
// };

// export const TRIPTEASE_LOCALE_MAP = {
//   'zh-CN': 'zh_Hans',
//   'zh-TW': 'zh-Hant'
// };

export const VWO_SCRIPT_ONE =
  "var _vwo_clicks = 100;\
    var _vwo_code=(function(){\
    var account_id=320407,\
    settings_tolerance=2000,\
    library_tolerance=2500,\
    use_existing_jquery=false,\
    is_spa = 1,\
    /* DO NOT EDIT BELOW THIS LINE */\
    f = false, d = document; return { use_existing_jquery: function () { return use_existing_jquery; }, \
    library_tolerance: function () { return library_tolerance; }, finish: function () { if (!f) { f = true; \
    var a = d.getElementById('_vis_opt_path_hides'); if (a) a.parentNode.removeChild(a); } }, \
    finished: function () { return f; }, load: function (a) { var b = d.createElement('script'); \
    b.src = a; b.type = 'text/javascript'; b.innerText; b.onerror = function () { _vwo_code.finish(); }; \
    d.getElementsByTagName('head')[0].appendChild(b); }, \
    init: function () { settings_timer = setTimeout('_vwo_code.finish()', settings_tolerance); \
    var a = d.createElement('style'), \
    b = 'body{opacity: 0 !important;filter:alpha(opacity=0) !important;background:none !important;}', \
    h = d.getElementsByTagName('head')[0]; a.setAttribute('id', '_vis_opt_path_hides'); \
    a.setAttribute('type', 'text/css'); if (a.styleSheet) a.styleSheet.cssText = b; \
    else a.appendChild(d.createTextNode(b)); h.appendChild(a); \
    this.load('{{$1}}/j.php?a=' + account_id + '&u=' + \
    encodeURIComponent(d.URL) + '&f=' + (+is_spa) + '&r=' + Math.random()); return settings_timer;}};}());\
    _vwo_settings_timer=_vwo_code.init();";

export const VWO_SCRIPT_TWO =
  "window.VWO = window.VWO || [];" +
  "window._vis_opt_queue = window._vis_opt_queue || [];" +
  "window._vis_opt_queue.push(function() {_vis_opt_revenue_conversion(utag_data.order_total);});" +
  "window.VWO.push(['track.revenueConversion', utag_data.order_total]);";

export const VWO_SCRIPT_THREE = "_vis_opt_domain='{{$1}}';";

// export const TRIPTEASE_CONFIRMATION_SCRIPT = 'https://static.triptease.io/paperboy/confirm?'
//   + 'hotelkey={{$1}}&bookingValue={{$2}}&bookingCurrency={{$3}}&bookingReference={{$4}}';

export const utag_data_single_room = {
  foreign_avg_room_rate: [],
  avg_room_rate: [],
  check_in: "",
  check_out: "",
  foreign_currency: "",
  currency: "",
  days_till_checkin: "",
  bed_type: [],
  room_sub_types: [],
  room_types: [],
  error_message: "",
  language_code: "",
  num_of_adults: [],
  num_of_children: [],
  num_of_nights: [],
  num_of_rooms: "",
  occupancy_detail: [],
  order_total_occupancy: "",
  page_name: "confirmation",
  page_type: "booking_payment",
  property_id: ["49010"],
  property_name: ["Marina Bay Sands"],
  site_section: "booking",
  rate_code: "",
  customer_city: "",
  customer_country: "",
  customer_email: "",
  customer_first_name: "",
  customer_last_name: "",
  customer_postal_code: "",
  customer_state: "",
  order_cancellation_policy: "",
  order_discount_amount: "",
  order_id: "",
  order_payment_method: "",
  order_promo_code: "",
  order_room_occupancy: [],
  order_room_type: [],
  order_subtotal: "",
  order_tax_amount: "",
  order_total: "",
};

export const utag_data_multi_room = {
  foreign_avg_room_rate: [],
  avg_room_rate: [],
  check_in: [],
  check_out: [],
  foreign_currency: "",
  currency: "",
  days_till_checkin: [],
  bed_type: [],
  room_sub_types: [],
  room_types: [],
  error_message: "",
  language_code: "",
  num_of_adults: [],
  num_of_children: [],
  num_of_nights: [],
  num_of_rooms: "",
  occupancy_detail: [],
  order_total_occupancy: "",
  page_name: "confirmation",
  page_type: "booking_payment",
  property_id: ["49010"],
  property_name: ["Marina Bay Sands"],
  site_section: "booking",
  rate_code: [],
  customer_city: "",
  customer_country: "",
  customer_email: "",
  customer_first_name: "",
  customer_last_name: "",
  customer_postal_code: "",
  customer_state: "",
  order_cancellation_policy: "",
  order_discount_amount: "",
  order_id: [],
  order_payment_method: "",
  order_promo_code: "",
  order_room_occupancy: [],
  order_room_type: [],
  order_subtotal: [],
  order_tax_amount: [],
  order_total: [],
};

export const trackingObject = {
  affiliation: "74224",
  category: "NonPackage",
  arriveDate: "",
  departDate: "",
  numAdults: 0,
  numChildren: 0,
  quantity: 1,
  numRooms: 0,
  pageID: 1,
  pageName: "confirmation",
  referrer: "booking.marinabaysands.com",
  productName: "",
  sku: "",
  offerCode: "",
  orderId: "",
  tax: "",
  total: "",
  unitPrice: "",
  itineraryNo: "",
  langID: "1033",
  loyalty_booking: "N",
};

export const tealiumScript3 =
  "(function(a,b,c,d){" +
  "a='{{$1}}';" +
  "b=document;c='script';d=b.createElement(c);d.src=a;d.type='text/java'+c;d.async=true;" +
  "a=b.getElementsByTagName(c)[0];a.parentNode.insertBefore(d,a);" +
  "})();";

/**Room Listing related constants */
export const noOfAmenitiesToDisplay = 4;
export const noOfCalendarMonthsToLoad = 2;

export const DEFAULT_SECONDARY_ROOM_ATTRIBUTE_FILTER = "All room views";
export const DEFAULT_PRIMARY_ROOM_ATTRIBUTE_FILTER = "All room types";
export const DEFAULT_LOCATION_FILTER = "All locations";
export const DEFAULT_RATING_FILTER = "All ratings";
// export const DEFAULT_HOTEL_LIST_CURRENCY_CODE = "SGD"
export const RATE_CAL_CURRENCY_CODE = "SGD";

/** Terms and Conditions Tooltip Content */
export const CONTENT_TOOLTIP =
  "Cancellation or amendment of reservation must be made 5 days prior to arrival date by 4 pm local time.";

/** Terms and Conditions Popup Content */
export const CONTENT_URL_CONST =
  "For room reservations, please call 65 6688 8897(8 am - 10 pm)." +
  "For general enquiries, please call 65 6688 8868 (24 hours). " +
  "Please note that as an affiliate of a US company, MBS is unable to allow access to the MBS casino or " +
  "to conduct foreign currency transactions for individuals who are solely nationals of Cuba, Iran , " +
  " North Korea, Syria or the Crimea Region of Ukraine.." +
  "However all our guests are welcome to experience our non-gaming attractions(e.g.our hotel and restaurants.).";
export const TERMS =
  "By proceeding with the reservation, you accept and agree with Marina Bay Sands Pte Ltd (the Hotel)" +
  " that the reservation(details of which are set out above ), if accepted by us shall be on the terms and conditions as follows: ";
export const CONTENT_ONE =
  "1. The rates quoted are based on your period of stay. " +
  "Rates are subject to change as the result of changes in your arrival and/or departure dates.";
export const CONTENT_TWO = "2. Rates quoted are in singapore dollars. ";
export const HEADING_ONE = "TERMS & CONDITIONS -'FLEXIBLE RATE' HOTEL OFFER";
export const HEADING_TWO = "Rates and deposits";
export const CONTENT_THREE = "3. Rate is for one or two adults only.";
export const CONTENT_FOUR =
  "4. Rates donot include any applicable prevailing government taxes at the time of occupancy." +
  "The Rates are subject to 10% Service Charge and prevailing Goods and Services Tax.";
export const TANDC_TITLE = "TERMS & CONDITIONS";
/**guest information fields list */
export const GUEST_INFO_FORM_FIELDS = [
  "firstName",
  "salutation",
  "firstName",
  "lastName",
  "state",
  "city",
  "phoneNumber",
  "countryCode",
  "countryName",
];
/** guest information form related*/
export const GUEST_INFO_FORM = {
  DISPLAY_TITLE: true,
  FIRST_NAME_MAX_LENGTH: 100,
  LAST_NAME_MAX_LENGTH: 100,
  DISPLAY_ADDRESS_LINE_1: false,
  ADDRESS_LINE_1_MAX_LENGTH: 100,
  DISPLAY_ADDRESS_LINE_2: false,
  ADDRESS_LINE_2_MAX_LENGTH: 100,
  ADDRESS_LINE_2_REQUIRED: false,
  DISPLAY_CITY: false,
  CITY_MAX_LENGTH: 100,
  CITY_REQUIRED: false,
  DISPLAY_STATE: false,
  STATE_MAX_LENGTH: 100,
  STATE_REQUIRED: false,
  DISPLAY_ZIPCODE: false,
  ZIPCODE_MAX_LENGTH: 100,
  ZIPCODE_REQUIRED: false,
  DISPLAY_PHONE_NUMBER: true,
  PHONE_NUMBER_MAXLENGTH: 30,
  PHONE_NUMBER_REQUIRED: true,
  EMAIL_MAX_LENGTH: 100,
};
/** guest info field error message */
export const GUEST_INFO_FORM_ERRORS = {
  FIRST_NAME_REQUIRED: "Please enter your first name",
  FIRST_NAME_INVALID: "Please enter a valid first name",
  LAST_NAME_REQUIRED: "Please enter your last name",
  LAST_NAME_INVALID: "Please enter a valid last Name",
  ZIP_CODE_REQUIRED: "Please enter your zip code",
  ZIP_CODE_INVALID: "Please enter a valid zip code",
  STATE_REQUIRED: "Please enter your State/Province",
  STATE_INVALID: "Please enter valid State/Province",
  CITY_REQUIRED: "Please enter your City",
  CITY_INVALID: "Please enter valid City",
  ADDRESS_LINE1_REQUIRED: "Please enter your address",
  ADDRESS_LINE1_INVALID: "Please enter valid address",
  ADDRESS_LINE2_REQUIRED: "Please enter your street address",
  ADDRESS_LINE2_INVALID: "Please enter valid street address",
  EMAIL_REQUIRED: "Please enter your email address",
  EMAIL_VAILDATE: "​Please enter only english characters",
  EMAIL_INVALID: "Please enter a valid email",
  PHONE_NUMBER_REQUIRED: "Please enter your mobile number",
  PHONE_INVALID: "Please enter a valid phone number",
};

/** payment related */
export const PAYMENT_CARD_TYPE = {
  VISA: "VS",
  MASTER_CARD: "MC",
  AMEX: "AX",
  DISCOVER: "DS",
  DINERS_CLUB: "DC",
  JAPAN_CREDIT_BUREAU: "JCB",
  CHINA_UNION_PAY: "CUP",
  ALI: "AL",
  UPAY: "UPAY",
  MAESTRO: "maestro",
  VISA_MANUAL: "VS-MANUAL",
  AMEX_MANUAL: "AX-MANUAL",
  MASTER_MANUAL: "MC-MANUAL",
  VISA_ONLINE: "VS-ONLINE",
  AMEX_ONLINE: "AX-ONLINE",
  MASTER_ONLINE: "MC-ONLINE",
  CARTE_BLANCHE: "CB",
};
export const PAYMENT_METHOD_API_RESPONSE = [
  {
    name: "Visa",
    code: "VS",
    thumbnailImageURL: "/assets/Payment/visa-logo.svg",
  },
  {
    name: "Master Card",
    code: "MC",
    thumbnailImageURL: "/assets/Payment/mc-logo.svg",
  },
  {
    name: "American Express",
    code: "AX",
    thumbnailImageURL: "/assets/Payment/American_Express_logo_(2018).svg",
  },
  {
    name: "Alipay",
    code: "AL",
    thumbnailImageURL: "/assets/Payment/Alipay_logo.svg",
  },
  {
    name: "Japan Credit Bureau",
    code: "JCB",
    thumbnailImageURL: "/assets/Payment/jcb-logo.svg",
  },
  {
    name: "Chinese Union Pay",
    code: "CUP",
    thumbnailImageURL: "/assets/Payment/unionpay-logo.svg",
  },
  {
    name: "Discover",
    code: "DS",
    thumbnailImageURL: "/assets/Payment/Discover-card_logo.svg",
  },
  {
    name: "Diners Club",
    code: "DC",
    thumbnailImageURL: "/assets/Payment/Diners-club_logo.svg",
  },
  {
    name: "Carte Blanche",
    code: "CB",
    thumbnailImageURL: "/assets/Payment/Clarte-Blanche.svg",
  },
];

export const DUMMY_CC_DETAILS = {
  CARD_HOLDER_NAME: "John Smith",
  CARD_TYPE: PAYMENT_CARD_TYPE.VISA,
  CARD_NUMBER: "4111111111111111",
  SECURITY_CODE: 100
};

export const CVV_MAX_LENGTH = 3;
export const DISPLAY_CVV = false;
export const showPreferences = true;
export const MPGS_SCRIPT_ID = "MPGSScript";
export const TRADITIONAL_FLOW = "tf";
export const TIME_PREFERENCE = "time";
export const ADD_ON_START_TIME = "00:00";
export const ADD_ON_END_TIME = "23:59";
export const DEFAULT_IP_DETAILS = {
  ip: "0.0.0.0",
  country: "Singapore",
  countryCode: "SG",
};

/** ManageBooking Related */
export const BOOKING_NUMBER_MAX_LENGTH = 100;

/** Regex */
export const emailCharactersRegex = /^[\u0000-\u007F]+$/;
export const CVV_REGEX = /^([0-9]*)$/;
export const STRING_REGEX = /^([A-za-z][A-Za-z ]*)$/;
export const ADDRESS_REGEX = /^([#.0-9a-zA-Z\s,-]*)$/;
export const ZIP_CODE_REGEX = /^([A-Za-z0-9'\-]*)$/;

/** Windows Inner width */
export const SMALL_LAPTOP_WIDTH = 992;

/** Frequency & Basis for Ala-carte-Addons */
export const frequencyAndBasis = {
  PER_UNIT: "tf_04_Checkout_alaCarteAddons_basis_per_unit",
  PER_NIGHT: "tf_04_Checkout_alaCarteAddons_frequency_per_night",
  PER_STAY: "tf_04_Checkout_alaCarteAddons_frequency_per_stay",
  PER_PERSON: "tf_04_Checkout_alaCarteAddons_basis_per_person",
  PER_ROOM: "tf_04_Checkout_alaCarteAddons_basis_per_room",
  PER_CHILD: "tf_04_Checkout_alaCarteAddons_basis_per_child",
  PER_ADULT: "tf_04_Checkout_alaCarteAddons_basis_per_adult",
  DAY_OF_WEEK: "tf_04_Checkout_alaCarteAddons_frequency_per_dayofweek",
  PERCENTAGE_OF_TOTAL: "tf_04_Checkout_alaCarteAddons_basis_percentageOf_total",
};
/** Meta Search Params */
export const META_SEARCH_PARAMS = [
  "disable_geo_dpr",
  "traffic_source",
  "dpr_override",
  "channel",
  "sub_channel",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
];

export const DEFAULT_FILTERS_ICONS = [
  {"attributeName" : "Amenities", "roomAttributeIconImageURL" : '<span class="material-icons-outlined filter-icons mr-2">night_shelter</span>'},
  {"attributeName" : "Bed Type", "roomAttributeIconImageURL" : '<span class="material-icons-outlined filter-icons mr-2">bed</span>'},
  {"attributeName" : "Offer", "roomAttributeIconImageURL" : '<span class="material-icons-outlined filter-icons mr-2">sell</span>'},
  {"attributeName" : "Room Category", "roomAttributeIconImageURL" : '<span class="material-icons-outlined filter-icons mr-2">room_preferences</span>'}
];

export const FILTERS_SELECT_LABEL = "Select";
export const FILTERS_CLEAR_LABEL = "Clear";
