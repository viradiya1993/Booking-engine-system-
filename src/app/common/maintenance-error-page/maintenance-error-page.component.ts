import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import * as _ from "lodash";
import { ICheckinSummary } from "../../search/guestduration/checkinsummary.type";
import { URL_PATHS } from "../common.constants";
import { CommonUtility } from "../common.utility";
import { StoreService } from "../services/store.service";
import { IBasketState } from "../store/reducers/basket.reducer";

@Component({
  selector: "app-maintenance-error-page",
  templateUrl: "./maintenance-error-page.component.html",
  styleUrls: ["./maintenance-error-page.component.scss"],
})
export class MaintenanceErrorPageComponent implements OnInit {
  guestSummary: ICheckinSummary;
  localeObj: any;
  _userSettingsSubscriptions: any;
  constructor(private _storeSvc: StoreService, private router: Router) {}

  ngOnInit() {
    const basketState = this._storeSvc.getBasketState() as IBasketState;
    this.guestSummary = basketState.GuestSummary;
    this._userSettingsSubscriptions = this._storeSvc
      .getUserSettings()
      .subscribe((sharedData) => {
        this.localeObj = sharedData.localeObj;
      });
    this._storeSvc.updateIsErrorPageFlag(true);
  }

  redirectPage() {
    this._storeSvc.updateIsErrorPageFlag(false);
    const offerCode = this._storeSvc.getBasketState().offerCode;
    const params = CommonUtility.getQueryParamObjGuestSummary(
      this.guestSummary,
      this._storeSvc,
      offerCode
    );
    const navigationExtras = {
      queryParams: params,
    };
    this.router
      .navigate(["/" + URL_PATHS.ROOMS_PAGE], navigationExtras)
      .then((d) => CommonUtility.highlightStep("select-room"));
  }
}
