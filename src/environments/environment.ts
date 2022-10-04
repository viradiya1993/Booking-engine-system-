export const environment = {
  production: false,
  is_rt4_be: true, // deprecated
  rt4_modify_flow: true, // deprecated
  portal_subdomain: "adacompliance.book.pegsbe.com",
  property_code: "", // deprecated
  path_prefix: "https://rt4api-us.reztrip.io", // should rename to api_endpoint_url
  ui_logging_endpoint: "https://rt4api-us.reztrip.io/clientLogs",
  proxy_path_prefix: "",
  custom_scripts_path: "https://d1jsz0jxk20jl9.cloudfront.net",
  isMCPEnabled: false, // deprecated
  optimizelySDKKey: "HmNpwnWS1KjxXMkQmcP1R",
  // Rollbar related
  enableRollbar: false,
  envType: "dev", // can be dev, qa, uat, staging, prod
  envName: "dev-local",
  rollbarToken: "ba25ed795d5f4c7b872843e4021cbdaf",
};

// export const environment = {
//   production: false,
//   is_rt4_be: true, // deprecated
//   rt4_modify_flow: true, // deprecated
//   portal_subdomain: "carltonhotelsingapore.qa.pegsbe.com",
//   portal_subdomain: "capehotels.dev.pegsbe.com",
//   property_code: "", // deprecated
//   path_prefix: "https://rt4qa.reztrip.io", // should rename to api_endpoint_url
//   ui_logging_endpoint: "https://rt4dev.reztrip.io/clientLogs",
//   proxy_path_prefix: "http://localhost:3000", // Check and remove
//   custom_scripts_path: "https://dkbg7t9x5nwac.cloudfront.net", // URL for stylesheets added through admin
//   isMCPEnabled: false, // deprecated
//   optimizelySDKKey: "HmNpwnWS1KjxXMkQmcP1R",
//   // Rollbar related
//   enableRollbar: false,
//   envType: "dev", // can be dev, qa, uat, staging, prod
//   envName: "dev-local",
//   rollbarToken: "ba25ed795d5f4c7b872843e4021cbdaf",
// };