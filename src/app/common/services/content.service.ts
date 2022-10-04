import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { HttpWrapperService } from "./http-wrapper.service";

@Injectable()
export class ContentService {
  private static CacheFactory: any[] = [];

  public static SetCache(key, value) {
    this.CacheFactory[key] = value;
  }

  public static GetCache(key): any {
    return this.CacheFactory[key];
  }

  public static ClearCacheKey(key) {
    delete this.CacheFactory[key];
  }
  constructor(private _authHttp: HttpWrapperService) {}

  public GetContentData(url: string): Observable<any> {
    return this._authHttp.get(url);
  }
}
