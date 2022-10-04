import { AgmMap } from "@agm/core";
import { ActivatedRoute, Router } from "@angular/router";
import { BreakpointObserver, BreakpointState } from "@angular/cdk/layout";
import {
  Component,
  EventEmitter,
  HostListener,
  OnDestroy,
  OnInit,
  Output,
  TemplateRef,
  ViewChild,
} from "@angular/core";
import * as _ from "lodash";
import { BsModalService } from "ngx-bootstrap/modal";
import { BsModalRef } from "ngx-bootstrap/modal/bs-modal-ref.service";
import { Subscription } from "rxjs";
import "select2";
import { HttpWrapperService } from "src/app/common/services/http-wrapper.service";
import {
  DEFAULT_RATING_FILTER,
} from "../common/common.constants";
import { CommonUtility } from "../common/common.utility";
import { FeatureFlags } from "../common/feature.flags";
import { StoreService } from "../common/services/store.service";
import {
  QUERY_PARAM_ATTRIBUTES,
  URL_PATHS,
} from "./../common/common.constants";
import { MultiPropertyService } from "./multi-property.service";
import { environment } from "src/environments/environment";
@Component({
  selector: "app-multi-property",
  templateUrl: "./multi-property.component.html",
  styleUrls: ["./multi-property.component.scss"],
})
export class MultiPropertyComponent implements OnInit, OnDestroy {
  @Output() locationsAvail = new EventEmitter<any>();

  public localeObj: any = {};
  private hotelSelected: String = "";
  public hotelLoc: any[] = [];
  selectedLocation: any;
  selectedLocPropNum: any;
  public selectedImageIndex: any;
  prevSlide: any;
  activeSlide: number;
  firstSlide: any;
  public hotelRating: any;
  public showMap = true;
  public listView = true;
  public isSortOrderAsc: boolean;
  public sortOrder: boolean;
  public currencyType: string;
  public currencySelection: any;
  public hotelData: any = [];
  public mapCoord: any = [];
  public locationSelection: any;
  public ratingSelection: any = {
    view: DEFAULT_RATING_FILTER,
    store: DEFAULT_RATING_FILTER,
  };
  public luxurySelection: any = "All";
  private selectedHotel: any;
  public filters: boolean;
  public modalRef: BsModalRef;
  private latitude = 0;
  private longitude = 0;
  private scrollClass = "static";
  public zoom = 3;
  public ratingAvail: any;
  mobileView = false;
  @ViewChild(AgmMap)
  public agmMap: AgmMap;
  public viewSelected = "Map View";
  private userSettingSubscription: Subscription;
  private routerSubscription: Subscription;
  public isCheckinSummaryAvailable: boolean;
  public currencies: any = [];
  public basketSubscription: Subscription;
  public locationFilterView: any ;
  public ratingFilterView: any = DEFAULT_RATING_FILTER;
  public hotelInfo: any;
  public selectedImage: any;
  public currCode: any;
  public selectedLangCode: string;
  public ratingStore: any = DEFAULT_RATING_FILTER;
  public isDpr7 = false;
  public isDpr8 = false;
  public isDpr11 = false;
  public initialLoad = false;
  iataPresent: any;
  displayFilters: { displayLocationFilter; displayStarRating } = {
    displayLocationFilter: true,
    displayStarRating: true,
  };
  GuestSummary: any;
  isMultiProp: boolean;
  currencyCode: any;
  hideUnavailableProperties: any;
  mapEvent: any;
  RTL_Flag: boolean = false;
  expanded = [];
  maxAmenitiesShown: any;
  public displayUrgencyMessage: boolean = false;
  showAverageNightlyRate = true;
  public expandMapwindow = true;
  @HostListener("window:scroll", ["$event"])
  onScroll($event: Event): void {
    if (this.showMap) {
      const mySticky = document.getElementById("mySticky");
      const outletContainer = document.getElementById("outletContainer");
      const widgetHeight =
        mySticky.getBoundingClientRect().bottom -
        mySticky.getBoundingClientRect().top;

      if (mySticky.getBoundingClientRect().top <= 0) {
        this.scrollClass = "fixed";
      }

      if (outletContainer.getBoundingClientRect().bottom < widgetHeight) {
        this.scrollClass = "absolute";
      }

      if (outletContainer.getBoundingClientRect().top > 0) {
        this.scrollClass = "static";
      }
    }
  }

  slideConfig = {
    autoplay: false,
    dots: false,
    enabled: true,
    focusOnSelect: true,
    infinite: true,
    nextArrow: "<div id='next-arrow' class='nav-btn next-slide'></div>",
    prevArrow: "<div id='prev-arrow' class='nav-btn prev-slide'></div>",
    initialSlide: 0,
    slidesToShow: 4,
    slidesToScroll: 1,
    method: {},
    // arrows: false
  };

  slideConfig1 = {
    slidesToShow: 1,
    slidesToScroll: 1,
    dots: false,
  };

  constructor(
    private modalService: BsModalService,
    private _authHttp: HttpWrapperService,
    private breakpointObserver: BreakpointObserver,
    private _storeSvc: StoreService,
    private _route: ActivatedRoute,
    private _router: Router,
    private _multiPropServ: MultiPropertyService
  ) {}

  ngOnInit() {
    this.routerSubscription = this._route.queryParams.subscribe((urlparams) => {
      const basketCheckinSummary = this._storeSvc.getBasketState().GuestSummary;
      // Start - Check for checkinDate presence
      const checkInSummaryObject = CommonUtility.getCheckInSummaryFromQueryParams(
        urlparams
      );
      const checkInSummary = checkInSummaryObject.checkinSummary;
      if (checkInSummaryObject.isCheckInDateExists) {
        this.isCheckinSummaryAvailable = true;
        this._storeSvc.updateGuestDuration(checkInSummary);
      } else {
        this.isCheckinSummaryAvailable = false;
      }
      // End - Check for checkinDate presence
      const iataObject = _.get(this._storeSvc.getUserSettingsState(), "iata");
      if (!!this._route.snapshot.queryParams.iataNumber) {
        iataObject["prevIataNumber"] = iataObject["iataNumber"];
        iataObject["iataNumber"] =
          _.get(urlparams, QUERY_PARAM_ATTRIBUTES.IATA) ||
          iataObject["iataNumber"];
        // iataObject["iataAgencyName"] = "";
        // iataObject["isValidIata"] = false;
        iataObject["isIataFromQueryParam"] = true;
        this._storeSvc.updateIATADetails(iataObject);
      } else {
        iataObject["prevIataNumber"] = iataObject["iataNumber"];
        iataObject["iataNumber"] = "";
        iataObject["iataAgencyName"] = "";
        iataObject["isValidIata"] = false;
        iataObject["isIataFromQueryParam"] = true;
        this._storeSvc.updateIATADetails(iataObject);
      }

      let currentAccessCode = "";
      if (!!urlparams[QUERY_PARAM_ATTRIBUTES.ACCESS_CODE]) {
        currentAccessCode = urlparams[QUERY_PARAM_ATTRIBUTES.ACCESS_CODE];
      }
      const promoObj = _.get(this._storeSvc.getBasketState(), "promoData");
      const promoData = {
        priorAccessCode: promoObj["priorAccessCode"],
        accessCode: currentAccessCode || promoObj["accessCode"],
        validationState: false,
        offerCode: "",
        isSpecialRate: false,
      };
      this._storeSvc.updatePromoData(promoData);

      // Hotel list Api call
      this._multiPropServ.getHotelList(true);
    });

    this.userSettingSubscription = this._storeSvc
      .getUserSettings()
      .subscribe((sharedData) => {
        this.localeObj = sharedData.localeObj;
        this.locationFilterView = this.localeObj.tf_8_MultiProperty_allLocationFilter;
        this.locationSelection = this.localeObj.tf_8_MultiProperty_allLocationFilter;
        this.selectedLangCode = sharedData.langObj.code;
        this.currencies = sharedData.propertyInfo.supportedCurrencies;
        this.iataPresent = sharedData.iata.iataNumber;
        this.maxAmenitiesShown = sharedData.propertyInfo.maxAmenitiesShown;
        this.hideUnavailableProperties =
          sharedData.propertyInfo.hideUnavailableProperty;
        this.currencySelection = {
          code: sharedData.propertyInfo.defaultCurrency,
        };
        this.displayFilters = {
          displayLocationFilter: sharedData.propertyInfo.displayLocationFilter,
          displayStarRating: sharedData.propertyInfo.displayStarRating,
        };
        this.RTL_Flag = CommonUtility.langAlignCheck(this._storeSvc.getUserSettingsState().langObj.code, FeatureFlags);
        this.displayUrgencyMessage =
          sharedData.propertyInfo.displayUrgencyMessage || false;

        this.showAverageNightlyRate = _.get(
          sharedData.propertyInfo,
          "showAverageNightlyRate"
        );
        const basketData = this._storeSvc.getBasketState();

        if (basketData.ResetMultiPropFilters) {
          this.selectedLocation = this.localeObj.tf_8_MultiProperty_allLocationFilter;
          this.locationSelection = this.localeObj.tf_8_MultiProperty_allLocationFilter;
          this.ratingFilterView = this.localeObj.tf_8_MultiProperty_allRatingsFilter;
          this.locationFilterView =  this.localeObj.tf_8_MultiProperty_allLocationFilter;
          this._storeSvc.updateLocationView(this.localeObj.tf_8_MultiProperty_allLocationFilter);
          this._storeSvc.updateRatingView(this.localeObj.tf_8_MultiProperty_allRatingsFilter);
        }
      });

    if (!FeatureFlags.isFeatureEnabled("multiproperty")) {
      this._storeSvc.setSystemError(true);
    }

    // Start - subscribe hotelList
    this._multiPropServ.hotelList.subscribe((dataAPI: any) => {
      dataAPI.data.hotels.map((el) => {
        // const mapIcon = Object.assign({}, el);
        // mapIcon.icon = "./assets/images/map-marker.svg";
        const hotelRating = Math.trunc(el.rating);
        el["hotelRating"] = hotelRating;
        el["splitStar"] =
          Number((el.rating - hotelRating).toFixed(1)) * 100 + "%";
        // return mapIcon;
      });
      this.hotelData = dataAPI.data.hotels;
      console.log(this.hotelData);

      // calculate star rating values
      const uniqueItem = [
        ...new Set(this.hotelData.map((location) => location.hotelRating)),
      ];
      const stars = [];
      uniqueItem.forEach((item, i) => {
        stars.push(this.getStarCount(item));
      });
      this.hotelRating = [
        this.localeObj.tf_8_MultiProperty_allRatingsFilter,
        ...stars,
      ];

      // passing rating filter array to child component
      this.ratingAvail = [
        this.localeObj.tf_8_MultiProperty_allRatingsFilter,
        ...uniqueItem,
      ];

      this.ratingSelection = this.filterRatings(this.ratingFilterView);
      this.ratingSelection = {
        view: this.ratingSelection[0],
        store: this.ratingFilterView,
      };

      if (this.hideUnavailableProperties) {
        this.hotelData = this.hotelData.filter((hotel) => hotel.available);
      }
      // this.selectedLocPropNum = this.hotelData.filter(hotel => hotel.address.city === this.selectedLocation);
      // this.mapCoord = this.hotelData.reverse();
      this.hotelSelected = this.hotelData[0].name;
      this.selectedHotel = this.hotelData[0];
      /**
       * Location array is emptied to avoid data duplication
       * On presence of multiple diff location the location array get populated
       * For single location : All locations default will be displayed
       */
      this.hotelLoc = [];
      const locAvail = [
        ...new Set(this.hotelData.map((loc) => loc.areaName)),
      ];
      if (locAvail.length > 1) {
        locAvail.forEach((location, i) => {
          this.hotelLoc.push({ id: i + 1, text: location });
        });
      }
      this.hotelLoc.unshift({
        id: 0,
        text: this.localeObj.tf_8_MultiProperty_allLocationFilter,
      });

      this._storeSvc.updateHotelLocAvail(this.hotelLoc);


      // filtering data based on currently set filters
      this.selectedLocPropNum = this.getFilteredHotelList(this.hotelData, this.selectedLocation, this.ratingFilterView);

      this.zoom = 15;
      setTimeout(() => {
        this.hotelSelected = this.hotelData[0].name;
        this.selectedHotel = this.hotelData[0];
        this.initialLoad = true;
        this.onHotelSelected(this.hotelSelected, this.selectedHotel);
        if (this.mapEvent) {
          this.onMapReady(this.mapEvent);
        }
        $('.multiprop-filters-list span.select2-selection').each(function() { this.setAttribute('tabindex', '-1') });
      }, 1000);
      setTimeout(() => {
        if (!!document.querySelectorAll('[title="Report errors in the road map or imagery to Google"]')[0]) {
          document.querySelectorAll('[title="Report errors in the road map or imagery to Google"]')[0]['title'] = 'Report a map error'
        }
        if (!!document.querySelectorAll('img[role="presentation"]')[0]) {
          document.querySelectorAll('img[role="presentation"]')[0]['alt'] = "Google Map";
        }
      }, 5000);
    });
    // End - subscribe hotelList

    // Start - Handle Breakpoints
    this.breakpointObserver
      .observe(["(max-width: 768px)"])
      .subscribe((state: BreakpointState) => {
        if (state.matches) {
          this.showMap = false;
          this.mobileView = true;
          this.listView = true;
        } else {
          this.showMap = true;
          this.mobileView = false;
          this.listView = false;
        }
        this._storeSvc.updateMapView(this.showMap);
        this._storeSvc.updateViewType(this.mobileView);
        $(".ratings").trigger("change.select2");
        $(".currency").trigger("change.select2");
        $(".location").trigger("change.select2");
      });

    this.breakpointObserver
      .observe(["(min-width: 769px)"])
      .subscribe((state: BreakpointState) => {
        if (state.matches) {
          this.listView = true;
        }
        $(".ratings").trigger("change.select2");
        $(".currency").trigger("change.select2");
        $(".location").trigger("change.select2");
      });
    // End - Handle Breakpoints

    // Store Basket subscription
    this.basketSubscription = this._storeSvc.getBasket().subscribe((basket) => {
      this.updateSearchResultsByFilters(basket);
    });

    // DPR Tagging
    if (FeatureFlags.isFeatureEnabled("dpr7")) {
      this.isDpr7 = true;
    } else if (FeatureFlags.isFeatureEnabled("dpr8")) {
      this.isDpr8 = true;
    } else if (FeatureFlags.isFeatureEnabled("dpr11")) {
      this.isDpr11 = true;
    }
    // confirmationPageFunc() - Confirmation Page scripts from admin
    if (this._router.url === "/") {
      if (window["multiPropertyFunc"]) {
        window["multiPropertyFunc"]();
      }
    }
  } // end of ngOnInit()

  getLeadOffPrice(hotel: any) {
    return !this._storeSvc.getShowAvgNightlyRateConfig() ? hotel.lead_off_total_price[this.currencyCode] :
    hotel.lead_off_price[this.currencyCode];
  }

  getStrikeOffPrice(hotel: any) {
    return !this._storeSvc.getShowAvgNightlyRateConfig() ?
    (hotel.strike_off_total_price ? hotel.strike_off_total_price[this.currencyCode] : '') :
    (hotel.strike_off_price ? hotel.strike_off_price[this.currencyCode] : '');
  }

  public updateSearchResultsByFilters(basket?: any) {

    if (basket === undefined) {
      basket = this._storeSvc.getBasketState();
    }

    // filtering data based on currently set filters
    this.selectedLocation = basket.locationFilter || this.localeObj.tf_8_MultiProperty_allLocationFilter;
    this.selectedLocPropNum = this.getFilteredHotelList(
      this.hotelData,
      this.selectedLocation,
      basket.ratingFilter
    );

    if (
      basket.locationFilter !== undefined &&
      basket.locationFilter !== this.locationFilterView
    ) {
      this.locationFilterView = basket.locationFilter;
      this.locationSelection = basket.locationFilter;
    }
    if (
      basket.ratingFilter !== undefined &&
      basket.ratingFilter !== this.ratingFilterView
    ) {
      this.ratingFilterView = basket.ratingFilter;
      if (this.hotelRating) {
        this.ratingSelection = this.filterRatings(basket.ratingFilter);
        this.ratingSelection = {
          view: this.ratingSelection[0],
          store: basket.ratingFilter,
        };
      }
    }

    if (basket.CurrencyCode !== undefined) {
      this.currencyCode = basket.CurrencyCode;
    }
    this.currCode = CommonUtility.getCurrSymbolForType(
      this._storeSvc.getUserSettingsState().propertyInfo,
      this.currencyCode
    );
    this.currencySelection = { code: this.currencyCode };

    if (
      basket.hotelListSortOrder !== undefined &&
      basket.hotelListSortOrder !== this.isSortOrderAsc
    ) {
      this.isSortOrderAsc = basket.hotelListSortOrder;
      this.sortOrder = basket.hotelListSortOrder;
    }
    if (this.selectedLocPropNum && this.selectedLocPropNum.length !== 0 && basket.hotelList.length >0) {
      this.mapCoord = basket.hotelList;
      this.selectedHotel = basket.hotelList[0];
      this.hotelSelected = basket.hotelList[0].name;
      this.latitude = this.selectedHotel.latitude;
      this.longitude = this.selectedHotel.longitude;
      this.zoom = 15;
    } else {
      this.longitude = 0;
      this.latitude = 0;
      this.mapCoord = this.hotelData.reverse();
    }
  }


  ngOnDestroy() {
    if (window["unloadMultiPropertyFunc"]) {
      window["unloadMultiPropertyFunc"]();
    }
    const subscriptionsList = [
      this.userSettingSubscription,
      this.basketSubscription,
      this.routerSubscription,
    ];
    CommonUtility.removeSubscriptions(subscriptionsList);
  }

  onMultiPropertyCheckInSummaryChanged(eventData: any) {
    const guestSummary = CommonUtility.getGuestSummaryFromEventData(eventData);
    this._storeSvc.updateGuestDuration(guestSummary);
    this.isCheckinSummaryAvailable = true;
    // Reload the page with params
    const params = CommonUtility.getQueryParamObjGuestSummary(
      guestSummary,
      this._storeSvc,
      ""
    );
    const navigationExtras = {
      queryParams: params,
    };
    this._router.navigate([], navigationExtras);
  }

  private onMapReady(map) {
    this.mapEvent = map;
    map.setOptions({
      zoomControl: "true",
      zoomControlOptions: {
        position: google.maps.ControlPosition.RIGHT_TOP,
      },
    });
    this.latitude = 0;
    this.longitude = 0;
    if (this.selectedHotel) {
      google.maps.event.addListenerOnce(map, "tilesloaded", () => {
        this.onHotelSelected(this.hotelSelected, this.selectedHotel);
      });
    }
    const btnPos = document.getElementById("mapDisplay");
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(btnPos);

    // Create the search box and link it to the UI element.
    const input = document.getElementById("pac-input") as HTMLInputElement;
    const searchBox = new google.maps.places.SearchBox(input);
    const textBox = document.getElementById("map-input");
    map.controls[google.maps.ControlPosition.TOP_CENTER].push(textBox);

    // Bias the SearchBox results towards current map's viewport.
    map.addListener("bounds_changed", () => {
      searchBox.setBounds(map.getBounds() as google.maps.LatLngBounds);
    });

    let markers: google.maps.Marker[] = [];
    // Listen for the event fired when the user selects a prediction and retrieve
    // more details for that place.
    searchBox.addListener("places_changed", () => {
      const places = searchBox.getPlaces();

      if (places.length == 0) {
        return;
      }

      // Clear out the old markers.
      markers.forEach((marker) => {
        marker.setMap(null);
      });
      markers = [];

      // For each place, get the icon, name and location.
      const bounds = new google.maps.LatLngBounds();
      places.forEach((place) => {
        if (!place.geometry) {
          console.log("Returned place contains no geometry");
          return;
        }
        const icon = {
          url: place.icon as string,
          size: new google.maps.Size(71, 71),
          origin: new google.maps.Point(0, 0),
          anchor: new google.maps.Point(17, 34),
          scaledSize: new google.maps.Size(25, 25),
        };

        // Create a marker for each place.
        markers.push(
          new google.maps.Marker({
            map,
            icon,
            title: place.name,
            position: place.geometry.location,
          })
        );

        if (place.geometry.viewport) {
          // Only geocodes have viewport.
          bounds.union(place.geometry.viewport);
        } else {
          bounds.extend(place.geometry.location);
        }
      });
      map.fitBounds(bounds);
    });
    const getHotel = document.getElementById("hotel-0").firstElementChild.id;
    this.hotelSelected = _.find(this.hotelData, { hotelCode: getHotel }).name;
    this.selectedHotel = _.find(this.hotelData, { hotelCode: getHotel });
  }

  private onHotelSelected(hotel: any, updatedHotelSelection) {
    this.expandMapwindow = true;
    this.hotelSelected = hotel;
    this.selectedHotel = updatedHotelSelection;
    this.hotelData.map((el, i) => {
      if (el.latitude === updatedHotelSelection.latitude) {
        this.zoom = 15;
        this.latitude = this.hotelData[i].latitude;
        this.longitude = this.hotelData[i].longitude;
      }
    });
  }

  private closeWindow() {
    this.expandMapwindow = this.expandMapwindow === true ? false : true;
  }

  public resetMultiPropertyPageInfo() {
    this._storeSvc.resetMultiPropertyPageInfo();
  }

  public viewHotel(hotelInfo: any) {
    const selPropertySubdomain = hotelInfo.singlePropertyPortalSubdomainLink;
    const userSettingsData = this._storeSvc.getUserSettingsState();
    const propertyInfo = userSettingsData.propertyInfo;
    const openPropertyPageInExistingTab = propertyInfo.openPropertyPageInExistingTab;
      this._storeSvc.updateMultiPropertyInfo({
        isHotelSelected: true,
        hotelCode: hotelInfo.hotelCode,
        hotelPortalSubdomain: selPropertySubdomain,
        hotelName: hotelInfo.name,
      });

    let selectedPropertyLink = "";

    if (propertyInfo.viewHotelInSinglePropertyPortal) {
      // View hotel on the single property portal
      const currentURL = new URL(window.location.href);
      selectedPropertyLink =
        currentURL.protocol + "//" + selPropertySubdomain + "/";
      const urlObject = new URL(selectedPropertyLink);
      urlObject.searchParams.set("hotel", hotelInfo.hotelCode);
      urlObject.searchParams.set("Currency", this.currencyCode);
      urlObject.searchParams.set("locale", this.selectedLangCode);
      selectedPropertyLink = urlObject.href;
      if (this.isCheckinSummaryAvailable) {
        // get the rooms page link with checkin params
        selectedPropertyLink = this.getRoomsPageUrl(selectedPropertyLink);
      }

      if (openPropertyPageInExistingTab) {
        // Open in Existing Tab
        window.location.href = selectedPropertyLink;
      } else {
        // Open in New Tab
        window.open(selectedPropertyLink);
      }
    } else {
      selectedPropertyLink = window.location.href;
      if (this.isCheckinSummaryAvailable) {
        const urlObject = new URL(selectedPropertyLink);
        selectedPropertyLink = urlObject.href;
        selectedPropertyLink = this.getRoomsPageUrl(
          selectedPropertyLink,
          hotelInfo.hotelCode
        );
      } else {
        const urlObject = new URL(selectedPropertyLink);
        urlObject.searchParams.set("hotel", hotelInfo.hotelCode);
        urlObject.searchParams.set("Currency", this.currencyCode);
        urlObject.searchParams.set("locale", this.selectedLangCode);
        selectedPropertyLink = urlObject.href;
      }

      if (openPropertyPageInExistingTab) {
        // Open in Existing Tab
        window.location.replace(selectedPropertyLink);
      } else {
        // Open in New Tab
        window.open(selectedPropertyLink);
      }
    }
  }

  public getRoomsPageUrl(selectedPropertyLink, hotelID?: string) {
    // Set the checkin summary url query params from basket
    const CheckinSummary = this._storeSvc.getBasketState().GuestSummary;
    const params = CommonUtility.getQueryParamObjGuestSummary(
      CheckinSummary,
      this._storeSvc,
      this._route.snapshot.queryParams.offerCode
    );
    const urlObject = new URL(selectedPropertyLink);
    if (this._route.snapshot.queryParams.accessCode) {
      params["accessCode"] = this._route.snapshot.queryParams.accessCode;
    } else {
      params["accessCode"] = "";
    }
    const queryString = Object.keys(params)
      .map((key) => {
        if (key !== "") {
          return key + "=" + params[key];
        } else {
          return "";
        }
      })
      .join("&");

    urlObject.search = queryString;
    urlObject.pathname = URL_PATHS.ROOMS_PAGE;
    if (!!hotelID) {
      urlObject.searchParams.set('hotel', hotelID);
    }

    selectedPropertyLink = urlObject.href;

    return selectedPropertyLink;
  }

  public mobileMapToggle(event: any) {
    this.listView = event;
    this.showMap = !event;
    this._storeSvc.updateMapView(this.showMap);
    this._storeSvc.updateViewType(true);
    if (event) {
      this.viewSelected = "List View";
    } else {
      this.viewSelected = "Map View";
    }
  }

  public dispMap(event: any) {
    this.showMap = !event;
    this.listView = event;
    this._storeSvc.updateMapView(this.showMap);
  }

  public toggleSortOrder() {
    this.sortOrder = !this.sortOrder;
  }

  public updateHotelLocation(location: any) {
    this.locationSelection = location.text;
  }

  public updateRatingSelection(rating: any) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(rating, "text/html");
    const span = doc.querySelector("span");
    if (!span) {
      this.ratingSelection = { view: rating, store: rating };
    } else {
      this.ratingSelection = {
        view: rating,
        store: span.getAttribute("data-rating"),
      };
    }
  }

  public updateCurrencySelection(currency: any) {
    this.currencySelection = currency;
  }

  private onMarkerClick(updatedHotelSelection, id) {
    if (this.hotelSelected !== updatedHotelSelection) {
      this.expandMapwindow = true;
    } else {
      this.expandMapwindow = this.expandMapwindow === true ? false : true;
    }
    if (this.zoom > 15) {
      this.zoom = 15;
    } else {
      this.zoom = this.zoom + 0.5;
    }
    this.latitude = updatedHotelSelection.latitude;
    this.longitude = updatedHotelSelection.longitude;
    this.hotelSelected = updatedHotelSelection.name;
    this.selectedHotel = updatedHotelSelection;
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "start",
      });
    }
  }

  public openFiltersModal(template: TemplateRef<any>) {
    this.modalRef = this.modalService.show(
      template,
      Object.assign({}, { class: "modal-md" })
    );
    return false;
  }

  public applyFilters() {
    this._storeSvc.updateCurrencyCodeObj(this.currencySelection);
    this._storeSvc.updateLocationView(this.locationSelection);
    this._storeSvc.updateRatingView(this.ratingSelection.store);
    this._storeSvc.updateHotelListSortOrder(this.sortOrder);
    this._storeSvc.updateMultiPropFilters(false);
    this.updateSearchResultsByFilters();
    this.modalRef.hide();
  }


  public updateLocationFilterVal($event) {
    this.updateSearchResultsByFilters();
  }

  public updateRatingFilterVal($event) {
    this.updateSearchResultsByFilters();
  }

  public updatePriceSortOrder($event) {
    this.isSortOrderAsc = $event;
    this.updateSearchResultsByFilters();
  }

  public closeFilter() {
    this.modalRef.hide();
  }

  onCheckInSummaryChanged(eventData: any) {
    this.isMultiProp = true;
    this.isCheckinSummaryAvailable = true;
    const guestSummary = CommonUtility.getGuestSummaryFromEventData(eventData);
    this._storeSvc.updateGuestDuration(guestSummary);
  }

  public closeFix(event, popover, target) {
    CommonUtility.toggleTooltip(event, popover, target);
  }

  public openGallery(template: TemplateRef<any>, hotel) {
    setTimeout(() => {
      if(this.hotelInfo.imageInfo.length > 4) {
      const leftArrow  = document.getElementsByClassName("slick-prev slick-arrow")[0];
      leftArrow.className = leftArrow + ' d-none';
      const rightArrow  = document.getElementsByClassName("slick-next slick-arrow")[0];
      rightArrow.className = rightArrow + ' d-none';
      }
    },250);
    this.hotelInfo = hotel;
    this.selectedImage = this.hotelInfo.imageInfo[0];
    this.modalRef = this.modalService.show(
      template,
      Object.assign({}, { class: "expanded-panel-slick" })
    );
    return false;
  }

  imageSelected(clickedImage: any, i) {
    this.appendOpacity(i);
    this.activeSlide = i;
    this.prevSlide = i - 1;
    this.selectedImageIndex = true;
    const selectedItem = this.hotelInfo.imageInfo.find(
      (v, i, o) => v.urls.thumb_jumbo === clickedImage.urls.thumb_jumbo
    );
    this.selectedImage = selectedItem;
  }

  slickInit(e) {
    this.appendOpacity(0);
  }

  beforeChange(e) {
    this.prevSlide = e.currentSlide;
  }

  afterChange(e) {
    //  if(this.selectedImageIndex){
    //   e.currentSlide = this.activeSlide;
    //  }
    if (e.currentSlide != 0) {
      this.prevSlide = e.currentSlide - 1;
    }
    if (e.currentSlide === 0) {
      this.prevSlide = this.hotelInfo.imageInfo.length - 1;
    }

    this.selectedImageIndex = false;
    this.activeSlide = e.currentSlide;
    this.appendOpacity(this.activeSlide);
    const currentSlide = e.slick.$slides.get(e.currentSlide).firstChild
      .currentSrc;
    this.firstSlide = e.first;
    const selectedItem = this.hotelInfo.imageInfo.find(
      (v, i, o) => v.urls.thumb_jumbo === currentSlide
    );
    this.selectedImage = selectedItem;
    this.selectedImage = this.hotelInfo.imageInfo[this.activeSlide];

    // this.hotelInfo.imageInfo[0].imageOpacity = 1;
    // if (this.threeSixtyVideoSrc) {
    //   const ele = document.getElementsByName("threeSixtyDegreeView");
    //   if (ele !== null && ele !== undefined && ele.length > 0) {
    //     ele[0].innerHTML = "";
    //   }
    //   for (let index = 1; index <= this.noOfScripts; index++) {
    //     CommonUtility.removeScript("360DegreeView-" + index);
    //   }
    //   this.noOfScripts = 0;
    // }
  }

  appendOpacity(currentSlide) {
    this.hotelInfo.imageInfo.forEach((img, i) => {
      if (i === currentSlide) {
        img.imageOpacity = 0.4;
      }
      else {
        img.imageOpacity = 1;
      }
    })
  }
  public updateCurr($event) {
    this._storeSvc.updateMultiPropertyInfo({
      hotelPortalSubdomain: environment.portal_subdomain,
    }) 
    this.currencyCode = $event.trim();
    this.currCode = CommonUtility.getCurrSymbolForType(
      this._storeSvc.getUserSettingsState().propertyInfo,
      this.currencyCode
    );
    setTimeout(() => { 
      this._multiPropServ.getHotelList(true);
    }, 100);
  }

  getMessage(message: string, params: string[]) {
    return CommonUtility.fillMessage(message, params);
  }

  getStarCount(count) {
    const stars = [];
    for (const star of [].constructor(count)) {
      stars.push('<i class="fa fa-star ml-2"></i>');
    }
    return `<span data-rating='${count}'>${count} Rating ${stars.join(
      ""
    )}</span>`;
  }

  filterRatings(currentRating) {
    return this.hotelRating.filter((rating) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(rating, "text/html");
      const span = doc.querySelector("span");
      return !span
        ? rating === currentRating
        : span.getAttribute("data-rating") == currentRating;
    });
  }

  getFilteredHotelList(hotelData, currLocation, currRating) {
    if (!hotelData) {
      return [];
    }
    let value = hotelData;
    if (currLocation !== this.localeObj.tf_8_MultiProperty_allLocationFilter) {
      value = hotelData.filter((hotel) =>
        hotel.areaName.includes(currLocation)
      );
    }
    return this.filterByRating(value, currRating);
  }

  filterByRating(value, currRating) {
    if (currRating !== this.localeObj.tf_8_MultiProperty_allRatingsFilter) {
      value = value.filter(
        (hotel) => hotel.hotelRating === parseInt(currRating)
      );
    }
    return value;
  }
}
