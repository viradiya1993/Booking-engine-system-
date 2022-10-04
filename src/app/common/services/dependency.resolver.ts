import { Injectable } from "@angular/core";
import { Resolve } from "@angular/router";
import { Observable } from "rxjs";

@Injectable()
export class DependencyResolver implements Resolve<Observable<string>> {
  constructor() {}

  resolve() {
    return Promise.resolve() as any;
  }
}
