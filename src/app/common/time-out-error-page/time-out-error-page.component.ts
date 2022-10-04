import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from "@angular/router";
import { URL_PATHS, STEP_MAP } from "../common.constants";
import { CommonUtility } from "../common.utility";
import * as _ from "lodash";
import { StoreService } from "../services/store.service";
@Component({
  selector: 'app-time-out-error-page',
  templateUrl: './time-out-error-page.component.html',
  styleUrls: ['./time-out-error-page.component.scss']
})
export class TimeOutErrorPageComponent implements OnInit {

  localeObj: any;
  public mobileScreen: boolean = false;
  private _userSettingsSubscriptions: any;

  constructor(private router: Router,
    private storeService: StoreService)
    { }

  ngOnInit(): void {
    this._userSettingsSubscriptions = this.storeService
    .getUserSettings()
    .subscribe((sharedData) => {
      this.localeObj = sharedData.localeObj;
    });
   let error_code = 408;

    const rooms = this.storeService.getBasketState().Rooms;
    const errorCode = error_code;
    const userSettingsState = this.storeService.getUserSettingsState();
    const langObj = _.get(userSettingsState, "langObj");

    const params = CommonUtility.getGuestInfoQueryParams(
      rooms,
      langObj,
      errorCode
    );
    const navigationExtras = {
      queryParams: params,
    };
    this.storeService.updateCurrentStep(STEP_MAP[URL_PATHS.GUEST_INFO_PAGE]);
    this.router.navigate(["/" + URL_PATHS.GUEST_INFO_PAGE], navigationExtras);
  }
}
