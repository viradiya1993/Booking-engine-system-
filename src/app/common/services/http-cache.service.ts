import { HttpRequest, HttpResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";

@Injectable()
export class HttpCacheService {
  private cache: {};

  getFromLocalStorage(key, defaultValue?): any {
    return localStorage.getItem(key) || defaultValue || null;
  }

  putInLocalStoarage(key, value) {
    localStorage.setItem(key, value);
  }

  getFromSessionStorage(key, defaultValue?): any {
    return sessionStorage.getItem(key) || defaultValue || null;
  }

  putInSessionStoarage(key, value) {
    sessionStorage.setItem(key, value);
    // this.cache[req.urlWithParams] = resp;
  }
}
