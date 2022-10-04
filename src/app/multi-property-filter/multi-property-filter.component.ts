import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from "@angular/core";
import { Subscription } from "rxjs";
import "select2";
import { CommonUtility } from "../common/common.utility";
import { StoreService } from "../common/services/store.service";
import { FeatureFlags } from "../common/feature.flags";
@Component({
  selector: "app-multi-property-filter",
  templateUrl: "./multi-property-filter.component.html",
  styleUrls: ["./multi-property-filter.component.scss"],
})
export class MultiPropertyFilterComponent implements OnInit, OnDestroy {
  private _userSettingsSubscriptions: Subscription;
  private _subscription: Subscription;
  public localeObj: any;
  public currencies: any[];
  public currencySelection: any = { code: "" };
  public rating: any;
  @Input() locationsAvail;
  @Input() hotelData;
  @Input() displayFilters;
  @Input() ratingAvail;
  public loc = true;
  locationViewFilter: any;
  ratingViewFilter: any;
  locationSelected: any;
  ratingSelected: any;
  public selectedCurrency: string = "";
  public isSortOrderAsc: boolean;
  public enableMap;
  public displayFiltesrView: { displayLocationFilter, displayStarRating };
  RTL_Flag: boolean = false;
  @Output() showMapChange = new EventEmitter();
  @Output() updateCurrency = new EventEmitter<any>();
  @Output() updateLocationFilterValue = new EventEmitter<any>();
  @Output() updateRatingFilterValue = new EventEmitter<any>();
  @Output() updateSortOrder = new EventEmitter<any>();
  @Input() showMap;

  constructor(private _storeSvc: StoreService) {}

  ngOnDestroy(): void {
    const subscriptionsList = [
      this._subscription,
      this._userSettingsSubscriptions,
    ];
    CommonUtility.removeSubscriptions(subscriptionsList);
  }

  ngOnInit(): void {
    this.displayFiltesrView = this.displayFilters;
    this._userSettingsSubscriptions = this._storeSvc
      .getUserSettings()
      .subscribe((sharedData) => {
        this.localeObj = sharedData.localeObj;
        this.currencies = sharedData.propertyInfo.supportedCurrencies;
        this.RTL_Flag = CommonUtility.langAlignCheck(this._storeSvc.getUserSettingsState().langObj.code, FeatureFlags);


        const basketData = this._storeSvc.getBasketState();
        if (basketData.ResetMultiPropFilters) {
          this.ratingSelected = this.localeObj.tf_8_MultiProperty_allRatingsFilter;
          this.ratingViewFilter = this.ratingSelected;
          this.locationViewFilter =  this.localeObj.tf_8_MultiProperty_allLocationFilter;
          this.locationSelected = this.locationViewFilter;
        }
      });

    this._subscription = this._storeSvc.getBasket().subscribe((basket) => {
      // updating the locations array as the child doesn't re-render on parent component update

      // Location Filter
      this.locationsAvail = basket.hotelLocAvail;
      if (basket.locationFilter !== undefined) {
          this.locationViewFilter = this.locationsAvail.filter(
            (location) => location.text == basket.locationFilter.trim()
          );
        if (this.locationViewFilter.length !== 0) {
          this.locationSelected = this.locationViewFilter[0].text;
          $(".location").trigger("change.select2");
        }
      }

      // Rating Filter
      if (basket.ratingFilter !== undefined) {
        this.ratingViewFilter = this.ratingAvail.filter(
          (rating) => rating == basket.ratingFilter
        );
        this.ratingSelected = this.ratingViewFilter[0];
        $(".ratings").trigger("change.select2");
      }

      // Currency Filter
      if (basket.CurrencyCode !== undefined) {
        this.selectedCurrency = basket.CurrencyCode;
      }

      // Price Sorting
      if (
        basket.hotelListSortOrder !== undefined &&
        basket.hotelListSortOrder !== this.isSortOrderAsc
      ) {
        this.isSortOrderAsc = basket.hotelListSortOrder;
      }
    }); // end of Basket subscription

    // Location filter select
    ($(".location") as any).select2({
      tags: false,
    });

    $(".location").one("select2:open", (e) => {
      $("input.select2-search__field").prop("placeholder", "Search Location");
      $(".select2-dropdown--above").attr("id", "fix");
      $("#fix").removeClass("select2-dropdown--above");
      $("#fix").addClass("select2-dropdown--below");
    });
    $(".location").on("select2:select", (e: any) => {
      const data = e.params.data;
      this._storeSvc.updateLocationView(data.text.trim());
      this.updateLocationFilterValue.emit(data.text.trim());
    });

    const formatCurrencySelection = (currency) => {
      return currency.text.split("-")[0].trim();
    };

    // Currency filter Select
    ($(".currency") as any).select2({
      tags: true,
      templateSelection: formatCurrencySelection,
    });
    $(".currency").one("select2:open", (e) => {
      $("input.select2-search__field").prop("placeholder", "Search Currency");
      $(".select2-dropdown--above").attr("id", "fix");
      $("#fix").removeClass("select2-dropdown--above");
      $("#fix").addClass("select2-dropdown--below");
    });
    $(".currency").on("select2:select", (e: any) => {
      const data = e.params.data;
      this.updateCurrency.emit(data.id.split("-")[0].trim());
      this._storeSvc.updateCurrencyCodeObj({
        code: data.id.split("-")[0].trim(),
      });
    });

    this.ratingViewFilter = this.ratingAvail.filter(
      (rating) => rating == this.ratingViewFilter
    );
    this.ratingSelected = this.ratingViewFilter[0];

    // Ratings filter select
    const formatRating = (icon) => {
      const originalOption = icon.element;
      if ($(originalOption).data("icon")) {
        const stars = [];
        const count = parseInt(icon.text.replace(/[^0-9]/g, ""));
        if (!isNaN(count)) {
          for (const star of [].constructor(count)) {
            stars.push(
              '<i class="fa ' +
                $(originalOption).data("icon") +
                ' ml-2 rating-color"></i>'
            );
          }
          return $(
            "<span>" + icon.text + " Rating " + stars.join("") + "</span>"
          );
        } else {
          return $("<span>" + icon.text + "</span>");
        }
      } else {
        return $("<span>" + icon.text + "</span>");
      }
    };
    const formatRatingSelection = (icon) => {
      const originalOption = icon.element;
      if ($(originalOption).data("icon")) {
        const stars = [];
        const count = parseInt(icon.text.replace(/[^0-9]/g, ""));
        if (!isNaN(count)) {
          for (const star of [].constructor(count)) {
            stars.push(
              '<i class="fa ' +
                $(originalOption).data("icon") +
                ' ml-2 rating-color"></i>'
            );
          }
          return $("<span>" + stars.join("") + "</span>");
        } else {
          return $("<span>" + icon.text + "</span>");
        }
      } else {
        return $("<span>" + icon.text + "</span>");
      }
    };
    ($(".ratings") as any).select2({
      tags: true,
      // minimumResultsForSearch: -1,
      templateSelection: formatRatingSelection,
      templateResult: formatRating,
    });

    $(".ratings").one("select2:open", (e) => {
      $(".select2-dropdown--above").attr("id", "fix");
      $("#fix").removeClass("select2-dropdown--above");
      $("#fix").addClass("select2-dropdown--below");
    });
    $(".ratings").on("select2:select", (e: any) => {
      const data = e.params.data;
      this._storeSvc.updateRatingView(data.id);
      this.updateRatingFilterValue.emit(data.id);
    });
  }

  public toggleSortOrder(val: any) {
    this.isSortOrderAsc = !val;
    this._storeSvc.updateHotelListSortOrder(this.isSortOrderAsc);
    this.updateSortOrder.emit(this.isSortOrderAsc); // desktopview sort issue fix
  }

  public disableMap() {
    this.showMapChange.emit(true);
  }

  public openSelect2(param) {
    ($(param) as any).select2("open");
  }
}
