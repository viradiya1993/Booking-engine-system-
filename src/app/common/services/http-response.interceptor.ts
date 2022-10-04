import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpResponse,
} from "@angular/common/http";
import { Injectable } from "@angular/core";
import * as _ from "lodash";
import { NGXLogger } from "ngx-logger";
import { NgxSpinnerService } from "ngx-spinner";
import { NgxUiLoaderService } from "ngx-ui-loader";
import { Observable, throwError } from "rxjs";
import { tap } from "rxjs/operators";
import { environment } from "src/environments/environment";
import { Router } from "../../../../node_modules/@angular/router";
import { MAINTENANCE_STATUS_CODE, URL_PATHS } from "../common.constants";
import { StoreService } from "../services/store.service";
@Injectable()
export class HttpResponseInterceptor implements HttpInterceptor {
  static reqCounter = 0;
  actualReq: HttpRequest<any>;
  constructor(
    private spinner: NgxUiLoaderService,
    private router: Router,
    private logger: NGXLogger,
    private ngxSpinner: NgxSpinnerService,
    private storeSvc: StoreService
  ) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    HttpResponseInterceptor.reqCounter++;
    this.spinner.start();
    // Fetch customTimeout from the request
    const customTimeout = req.params.get("customTimeout");

    // Create a clone of the request and delete customTimeout
    this.actualReq = req.clone({ params: req.params.delete("customTimeout") });

    // console.log("this.actualReq", this.actualReq);
    // console.log("pathname", window.location.pathname.includes("/confirmation"))
    // if(window.location.pathname.includes("/confirmation") && this.actualReq && this.actualReq.url.includes("/reservation")) {
    //   console.log("Coming inside my condition");
    //   this.ngxSpinner.show("reservationLoader");
    // }
    if (customTimeout) {
      // If we have a customTimeout param, we will stop the timer after the specified time
      setTimeout(() => {
        this.spinner.stop();
      }, +customTimeout);
    }

    return next.handle(this.actualReq).pipe(
      tap(
        (succ) => {
          if (succ instanceof HttpResponse) {
            HttpResponseInterceptor.reqCounter--;
            if (HttpResponseInterceptor.reqCounter <= 0) {
              this.spinner.stop();
              this.ngxSpinner.hide();
            }
            // if (succ.status !== 200 && succ.url.indexOf(environment.path_prefix) !== -1) {
            //   const navigationExtras = {};
            //   this.router.navigate([URL_PATHS.SYSTEM_ERROR], navigationExtras);
            // }
            if (
              _.get(succ, "url").includes("/reservation") ||
              _.get(succ, "url").includes("/modifyRes")
            ) {
              setTimeout(() => {
                this.ngxSpinner.hide("reservationLoader");
              }, 2000);
            }
            if (
              _.get(succ, "body.status.statusCode") === MAINTENANCE_STATUS_CODE
            ) {
              const navigationExtras = {};
              this.router.navigate(
                [URL_PATHS.MAINTENANCE_ERROR],
                navigationExtras
              );
            }
          }
        },
        (error) => {
          // Loggers can be written to log exact error
          this.handleError(error, this.actualReq, next);
          HttpResponseInterceptor.reqCounter--;
          if (HttpResponseInterceptor.reqCounter === 0) {
            this.spinner.stop();
            this.ngxSpinner.hide();
            this.ngxSpinner.hide("reservationLoader");
          }
          const URLFromErrorObject =
            _.get(error, "error.currentTarget.__zone_symbol__xhrURL") ||
            _.get(error, "url");
          if (
            URLFromErrorObject &&
            URLFromErrorObject !== environment.ui_logging_endpoint &&
            URLFromErrorObject.indexOf(environment.path_prefix) !== -1
          ) {
            this.logger.error("Http Error occured :: ", JSON.stringify(error));
            // const navigationExtras = {};
            // this.router.navigate([URL_PATHS.SYSTEM_ERROR], navigationExtras);
            this.storeSvc.setSystemError(true);
          }
        }
      )
    ) as any;
  }

  private handleError(
    error: any,
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<any> {
    if (error instanceof HttpErrorResponse) {
      // Handle Errors
    }

    return throwError(error || "Getting Error From Server");
  }
}
