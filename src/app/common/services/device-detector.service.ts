import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class DeviceDetectorService {
  constructor() {}

  getDeviceType(): string {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return "t";
    }
    if (
      /Mobile|iP(hone|od|ad)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(
        ua
      )
    ) {
      return "m";
    }
    return "d";
  }
}
