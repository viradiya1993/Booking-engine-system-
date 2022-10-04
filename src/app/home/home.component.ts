import { Location } from "@angular/common";
import { Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import * as _ from "lodash";
import { CommonUtility } from "../common/common.utility";
import { StoreService } from "../common/services/store.service";
import { MultiPropertyComponent } from "../multi-property/multi-property.component";
import { SearchComponent } from "../search/search.component";

@Component({
  selector: "app-home",
  templateUrl: "./home.component.html",
})
export class HomeComponent implements OnInit, OnDestroy {
  private _userSettingsSubscriptions: any;
  isSinglePropertyPortal: boolean;
  showMultiProperty: boolean;
  @ViewChild("SearchComponent", { static: true })
  searchComponentObj: SearchComponent;

  @ViewChild("MultiPropertyComponent", { static: true })
  MultiPropertyComponentObj: MultiPropertyComponent;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private _storeSvc: StoreService,
    private location: Location
  ) {}

  ngOnInit() {
    this.isSinglePropertyPortal = false;
    this._userSettingsSubscriptions = this._storeSvc
      .getUserSettings()
      .subscribe((sharedData) => {
        if (sharedData.propertyInfo.singlePropertyPortal) {
          this.isSinglePropertyPortal =
            sharedData.propertyInfo.singlePropertyPortal;
          // this.isSinglePropertyPortal = false; // COMMENT THIS LINE

          if (this.isSinglePropertyPortal) {
            this.showMultiProperty = false;
          }
        }
      });

    this.activatedRoute.queryParams.subscribe((params) => {
      if (params["hotel"]) {
        if (!this.isSinglePropertyPortal) {
          // Multiproperty portal url with ?hotel=<hotel-id>param
          this.showMultiProperty = false;
        }
      } else {
        if (!this.isSinglePropertyPortal) {
          this.showMultiProperty = true;
          this._storeSvc.updateMultiPropertyInfo({
            isHotelSelected: false,
            hotelCode: "",
            hotelPortalSubdomain: "",
            hotelName: "",
          });
        }
      }
    });
  } // end of ngOnInit()

  ngOnDestroy() {
    const subscriptionsList = [];
    CommonUtility.removeSubscriptions(subscriptionsList);
  }
}
