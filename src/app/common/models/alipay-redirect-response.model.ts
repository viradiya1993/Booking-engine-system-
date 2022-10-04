export class AlipayRedirectResponse {
  error_info: ErrorInfo;
  request_url: string;
  param_map: Map<string, string>;
}
export class ErrorInfo {
  error_details: string[];
}
