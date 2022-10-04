import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpResponse,
} from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, throwError } from "rxjs";
import { tap } from "rxjs/operators";

@Injectable()
export class AuthHttpInterceptor implements HttpInterceptor {
  authReq: HttpRequest<any>;
  constructor() {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    this.authReq = req.clone();
    return next.handle(this.authReq).pipe(
      tap(
        (succ) => {
          if (succ instanceof HttpResponse) {
          }
        },
        (error) => {
          // Loggers can be written to log exact error
          this.handleError(error, this.authReq, next);
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
