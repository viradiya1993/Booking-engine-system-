import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  Renderer2,
  ViewEncapsulation,
  ElementRef,
  QueryList,
  ViewChildren,
  TemplateRef,
} from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import * as _ from "lodash";
import { Subscription } from "rxjs";
import { CommonUtility } from "src/app/common/common.utility";
import {
  DEFAULT_PRIMARY_ROOM_ATTRIBUTE_FILTER,
  DEFAULT_SECONDARY_ROOM_ATTRIBUTE_FILTER,
} from "../../common/common.constants";
import { StoreService } from "../../common/services/store.service";
import { FeatureFlags } from 'src/app/common/feature.flags';
import { URL_PATHS, DEFAULT_FILTERS_ICONS } from "../../common/common.constants";
import { RoomListingService } from "src/app/common/services/roomListing.Service";
import { NgSelectComponent } from "@ng-select/ng-select";
import { Options } from "@angular-slider/ngx-slider";
import { BsModalService } from "ngx-bootstrap/modal";
import { BsModalRef } from "ngx-bootstrap/modal/bs-modal-ref.service";
import { BreakpointObserver, BreakpointState } from "@angular/cdk/layout";

@Component({
  selector: "app-filters",
  templateUrl: "./filters.component.html",
  styleUrls: ["./filters.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class FiltersComponent implements OnInit, OnDestroy {
  private _subscription: Subscription;
  private _errorHandlerSubscription: Subscription;
  @Input("roomViews") roomViews: string[];
  @Input("roomTypes") roomTypes: string[];
  @Input("roomsList") roomsList: any[];
  @Input() isPromoSpecialsFlow: boolean;
  @Input() rateCalenderFilter: boolean;
  @Input("entireRoomsList") entireRoomsList : any[];
  @Output() filterVal: EventEmitter<any> = new EventEmitter<any>();
  @Output() roomFilters: EventEmitter<any> = new EventEmitter<any>();
  @ViewChildren("divs", { read: ElementRef }) divs: QueryList<NgSelectComponent>;
  public manualRefreshEnabled: boolean = true;
  public manualRefresh: EventEmitter<void> = new EventEmitter<void>();
  public expanded =[];
  currencySelection: any = { code: "SGD" };
  clickVar = false;
  isSortOrderAsc: boolean;
  currencies: any[];
  roomTypeFilter = DEFAULT_PRIMARY_ROOM_ATTRIBUTE_FILTER;
  roomViewFilter = DEFAULT_SECONDARY_ROOM_ATTRIBUTE_FILTER;
  localeObj: any;
  RTL_Flag: boolean = false;
  private _userSettingsSubscriptions: Subscription;
  private observer: Subscription;
  public calendarFilters: Array<any> = [];
  public filtersArray = {};
  public propertyInfo: any;
  public roomAttrFilters: any[];
  public sidePanelFilters: any[];
  public trigger: boolean = false; 
  public updatedSortOrder: boolean;
  public minVal: number = 0;
  public highValue: number = 0;
  options: Options = {
    floor: 0,
    ceil: 100,
    translate: (value: number): string => {
      return "$" + value;
    }
  };
  public modalRef: BsModalRef;
  public expandedDropdown: any[] = [];
  public filterSlicedVal: number;
  public currSymbol: string;
  public locationPath: string;
  public noFiltersSelected: number = 0;
  public maxRangeVal: number = 0;
  public triggerClose: boolean =true;
  public propertyType: any;
  public hideRoomsFilters: boolean = false;


  constructor(
    private _storeSvc: StoreService,
    private router: Router,
    private renderer: Renderer2,
    private _route: ActivatedRoute,
    private roomsSvc: RoomListingService,
    private modalService: BsModalService,
    private breakpointObserver: BreakpointObserver,
  ) {}

  ngOnDestroy(): void {
    if (this.modalRef !== undefined) {
      this.modalRef.hide();
    }
    const subscriptionsList = [
      this._subscription,
      this._userSettingsSubscriptions,
      this.observer,
      this._errorHandlerSubscription
    ];
    CommonUtility.removeSubscriptions(subscriptionsList);
  }

  ngOnInit() :void {
    this._userSettingsSubscriptions = this._storeSvc
      .getUserSettings()
      .subscribe((sharedData) => {
        this.RTL_Flag = CommonUtility.langAlignCheck(this._storeSvc.getUserSettingsState().langObj.code, FeatureFlags);
        this.localeObj = sharedData.localeObj;
        this.currencies = sharedData.propertyInfo.supportedCurrencies;
        const basketData = this._storeSvc.getBasketState();
        this.propertyType = sharedData.propertyInfo.propertyType || '';
        if (basketData.ResetFilters) {
          this.roomTypeFilter = this.localeObj.tf_2_RoomList_rooms_primaryRoomAttribute;
          this.roomViewFilter = this.localeObj.tf_2_RoomList_roomListFilters_secondaryRoomAttribute;
          this._storeSvc.updateRoomView(this.roomViewFilter);
          this._storeSvc.updateRoomType(this.roomTypeFilter);
        }
        this.propertyInfo = sharedData.propertyInfo;
      });
    // this.currency = RoomFilters.currency;
    this.isSortOrderAsc = true;
    this.updatedSortOrder = true;
    this._subscription = this._storeSvc.getBasket().subscribe((basket) => {
      if (basket.RoomView !== undefined) {
        this.roomViewFilter = basket.RoomView;
      }
      if (basket.RoomType !== undefined) {
        this.roomTypeFilter = basket.RoomType;
      }
      if (basket.CurrencyCode !== undefined) {
        this.currencySelection.code = basket.CurrencyCode;
        this.currSymbol = CommonUtility.getCurrSymbolForType(
          this._storeSvc.getUserSettingsState().propertyInfo,
          this.currencySelection.code);
      }
      if (basket.SortOrder !== undefined) {
        this.isSortOrderAsc = basket.SortOrder;
        this.updatedSortOrder = basket.SortOrder;
      }
    });
    // if(this._storeSvc.getBasketState().roomAttributes.length === 0) {
    this.roomsSvc.getRoomFilterAttribute().subscribe((data) => {
      this.roomAttrFilters = [];
      this.sidePanelFilters = [];
      Object.keys(data.data.roomAttributes).forEach((filter) => {
        data.data.roomAttributes[filter]["selectFilterName"] = filter;
        data.data.roomAttributes[filter]["selectedFilterValues"] = this.localeObj.tf_1_Calendar_rateCalender_selectDropdown;
        data.data.roomAttributes[filter]["prevfilterVal"] = this.localeObj.tf_1_Calendar_rateCalender_selectDropdown;
        data.data.roomAttributes[filter]["filterClass"] = data.data.roomAttributes[filter]["attributeName"].replace(/\s/g, "");
        data.data.roomAttributes[filter]["isOpen"] = false;
        data.data.roomAttributes[filter]["staticIcon"] = false;
        DEFAULT_FILTERS_ICONS.forEach((elem) => {
          if(data.data.roomAttributes[filter]["defaultAttribute"] && !data.data.roomAttributes[filter]["roomAttributeIconImageURL"]) {
            if(data.data.roomAttributes[filter]["attributeName"] === elem.attributeName) {
              data.data.roomAttributes[filter]["roomAttributeIconImageURL"] = elem.roomAttributeIconImageURL;
              data.data.roomAttributes[filter]["staticIcon"] = true;
            }
          }
        });
        let list = [];
        Object.values(data.data.roomAttributes[filter].options).forEach((listItem)=> {
          list.push(listItem);
        });
        list.push(this.localeObj.tf_2_RoomList_filters_clearBtn);
        if(filter === 'Amenities') {
          let listImages = [];
          Object.values(data.data.roomAttributes[filter].optionImages).forEach((optionImage)=> {
            listImages.push(optionImage);
          });
          data.data.roomAttributes[filter]["listImages"] = listImages;
        }
        data.data.roomAttributes[filter]["list"] = list;
        if(data.data.roomAttributes[filter].list.length > 1) {
          this.roomAttrFilters.push(data.data.roomAttributes[filter]);
          this.sidePanelFilters.push(data.data.roomAttributes[filter]);
        }
      });
      if(this.propertyInfo.isCalendarAttributesEnabled && this.propertyInfo.calendarAttributeCodes.length > 0) {
        this.calendarFilters = [];
        this.propertyInfo.calendarAttributeCodes.forEach(filter => {
          this.calendarFilters.push(data.data.roomAttributes[filter]); 
        });
      }
      if(!this._storeSvc.getBasketState().roomAttributes.currCode) {
        this._storeSvc.getBasketState().roomAttributes.forEach((elem)=> {
          this.roomAttrFilters.forEach((calFilter, index) => {
            if(elem["attributeName"] === calFilter["attributeName"] && elem["selectedFilterValues"] !== this.localeObj.tf_1_Calendar_rateCalender_selectDropdown) {
              this.roomAttrFilters[index]["prevfilterVal"] = elem["selectedFilterValues"];
              this.roomAttrFilters[index]["selectedFilterValues"] = elem["selectedFilterValues"];
              this.filtersArray[elem.attributeName] = elem["selectedFilterValues"];
            }
          }); 
        });
      }
      this._storeSvc.setRoomAttributes(this.roomAttrFilters);
      this.noFiltersSelected = 0;
      this.roomAttrFilters.forEach((elem)=> {
        if (elem.selectedFilterValues !== this.localeObj.tf_1_Calendar_rateCalender_selectDropdown) {
          this.noFiltersSelected +=1; 
        }
      });
    });
    this.observer = this.breakpointObserver
      .observe(["(max-width: 820px)", "(max-width: 768px)"]).subscribe((state: BreakpointState) => {
        if (state.breakpoints["(max-width: 768px)"]) {
          this.filterSlicedVal = this.isPromoSpecialsFlow ? 4 : 3;
        } else if (state.breakpoints["(max-width: 820px)"]) {
          this.filterSlicedVal = this.isPromoSpecialsFlow ? 4 : 3;        
        } else {
          this.filterSlicedVal = this.isPromoSpecialsFlow ? 6 : 5; 
        }
    });
    const paramFilterAttributes= _.cloneDeep(this._route.snapshot.queryParams).attributes;
    this._storeSvc.setPriceSliderRange([]);
    this.manualRefreshEnabled = true;
    this.locationPath = location.pathname;

    this._errorHandlerSubscription = this._storeSvc
      .getErrorHandler()
      .subscribe((errorHandler) => {
        if(!!errorHandler.error) {
          if(!!errorHandler.error[4000]) {
            this.hideRoomsFilters = errorHandler.error[4000];
          } else {
            this.hideRoomsFilters = false;
          }
        }
      });
  }

  updateRoomView(name) {
    this._storeSvc.updateRoomView(name);
    this.filterForRateMatch();
  }

  updateRoomType(name) {
    this._storeSvc.updateRoomType(name);
    this.filterForRateMatch();
  }

  toggleSortOrder() {
    this.isSortOrderAsc = !this.isSortOrderAsc;
    this.updatedSortOrder = !this.isSortOrderAsc;
    this._storeSvc.updateSortOrder(this.isSortOrderAsc);
    // this._dataShareSvc.trigger('SortOrder', this.isSortOrderAsc);
  }

  // method for ratematch dom manipulation
  public filterForRateMatch() {
    if (
      this.roomViewFilter === DEFAULT_SECONDARY_ROOM_ATTRIBUTE_FILTER &&
      this.roomTypeFilter === DEFAULT_PRIMARY_ROOM_ATTRIBUTE_FILTER
    ) {
      this.renderer.setAttribute(document.body, "data-filterApplied", "false");
    } else {
      this.renderer.setAttribute(document.body, "data-filterApplied", "true");
    }
  }

  public setCalendarAttributeFilter(elem, value, index) {
    if(!value.isTrusted) {
      if(value === elem.list[elem.list.length - 1]) {
        this.calendarFilters[index]["selectedFilterValues"]= this.localeObj.tf_1_Calendar_rateCalender_selectDropdown;
        this.filtersArray[elem.attributeName] = this.localeObj.tf_1_Calendar_rateCalender_selectDropdown;
      } else if(value.includes(this.localeObj.tf_2_RoomList_filters_clearBtn)){
        this.calendarFilters[index]["selectedFilterValues"]= this.localeObj.tf_1_Calendar_rateCalender_selectDropdown;
        this.filtersArray[elem.attributeName] = this.localeObj.tf_1_Calendar_rateCalender_selectDropdown;
      } else {
        this.calendarFilters[index]["selectedFilterValues"]= value;
      }
    }
    this.filterVal.emit(this.calendarFilters);
  }

  public openDropdown(id,elem,event){
  if(!this.trigger) {
    document.querySelector('.' + elem + ' .ng-select-container').dispatchEvent(new MouseEvent("mousedown"));
    this.expandedDropdown[id] = true;
    }
    this.trigger= false;
  }

  // public setRoomAttrFilter(elem, value, index, view?) {
  //  if(value === elem.list[elem.list.length - 1]) {
  //     this.roomAttrFilters[index]["selectedFilterValues"]= this.localeObj.tf_1_Calendar_rateCalender_selectDropdown;
  //     this.sidePanelFilters[index]["selectedFilterValues"]= this.localeObj.tf_1_Calendar_rateCalender_selectDropdown;
  //     this.filtersArray[elem.attributeName] = this.localeObj.tf_1_Calendar_rateCalender_selectDropdown;
  //   } else if(value.includes(this.localeObj.tf_2_RoomList_filters_clearBtn)){
  //     this.roomAttrFilters[index]["selectedFilterValues"]= this.localeObj.tf_1_Calendar_rateCalender_selectDropdown;
  //     this.sidePanelFilters[index]["selectedFilterValues"]= this.localeObj.tf_1_Calendar_rateCalender_selectDropdown;
  //     this.filtersArray[elem.attributeName] = this.localeObj.tf_1_Calendar_rateCalender_selectDropdown;
  //   } 
  //   else {
  //     this.roomAttrFilters[index]["selectedFilterValues"]= value;
  //     this.sidePanelFilters[index]["selectedFilterValues"]= value;
  //   }
  //   this.expandedDropdown[index] = false;
  //   this.trigger = true;
  //   this.roomFilters.emit(this.roomAttrFilters);
  //   this._storeSvc.setRoomAttributes(this.roomAttrFilters);
  // }

  public triggerSidePanel(action) {
    if(action === 'open') {
      const elem = document.getElementById("side-panel");
      setTimeout(()=> {
        document.getElementById("side-panel").style.transition ='0.5s';
        document.getElementById("side-panel").style.width = '100%';
        document.getElementById("main-panel-body").style.width = '350px';
      }, 50);
    } else {
      document.getElementById("main-panel-body").style.width ='0px';
      document.getElementById("side-panel").style.width = 0+'px';
      this.manualRefresh.emit();
      if(this.sidePanelFilters !== this.roomAttrFilters) {
        const val = _.cloneDeep(this.roomAttrFilters);
        this.sidePanelFilters = val;
      }
      if(this._storeSvc.getBasketState().range.length > 0) {
        this.minVal = this._storeSvc.getBasketState().range[0];
        this.highValue = this._storeSvc.getBasketState().range[1];
      } else  {
        this.minVal = 0;
        this.highValue = this.maxRangeVal;
      }
    }
  }

  public updateSortOrder(updatedOrder) {
    this.updatedSortOrder = updatedOrder === 'asc' ? true: false;
  }

  // Clears the filter selection and store values; 
  public clearFilterSelection() {
    this.roomAttrFilters.forEach((filter) => {
      filter["prevfilterVal"] = this.localeObj.tf_1_Calendar_rateCalender_selectDropdown;
      filter["selectedFilterValues"] = this.localeObj.tf_1_Calendar_rateCalender_selectDropdown;
    });
    this.sidePanelFilters.forEach((filter) => {
      filter["prevfilterVal"] = this.localeObj.tf_1_Calendar_rateCalender_selectDropdown;
      filter["selectedFilterValues"] = this.localeObj.tf_1_Calendar_rateCalender_selectDropdown;
    });
    this.filtersArray = {};
    this.isSortOrderAsc = true;
    this.roomFilters.emit(this.roomAttrFilters);
    this._storeSvc.setRoomAttributes(this.roomAttrFilters);
    this.updatedSortOrder = true;
    this._storeSvc.updateSortOrder(this.isSortOrderAsc);
    this._storeSvc.setRoomAttributes(this.roomAttrFilters);
    this.minVal = 0
    this.highValue = this.entireRoomsList[this.entireRoomsList.length - 1].averagePriceByCurrency[this.currencySelection.code];
    this._storeSvc.setPriceSliderRange([this.minVal, this.highValue]);
  }

  public showResults() {
    if(this.isSortOrderAsc !== this.updatedSortOrder) {
      this.toggleSortOrder();
    }
    if(this.sidePanelFilters !== this.roomAttrFilters) {
      const val = _.cloneDeep(this.sidePanelFilters);
      this.roomAttrFilters = val;
      this.roomFilters.emit(this.roomAttrFilters);
      this._storeSvc.setRoomAttributes(this.roomAttrFilters);
    }
    document.getElementById("main-panel-body").style.width ='0px';
    document.getElementById("side-panel").style.width = 0+'px';
    this.roomAttrFilters.forEach((elem) => {
      this.filtersArray[elem.attributeName] = elem.selectedFilterValues;
    })
    this._storeSvc.setPriceSliderRange([this.minVal, this.highValue]);
  }

  public filterSidePanel(filter, option, action, id?) {
    if(!!filter.selectedFilterValues) {
      if(action === 'check') {
        if(filter.selectedFilterValues.includes(option)) {
          return true;
        } else {
          return false;
        }
      } else {
        if(filter.selectionType === "single") {
          if(filter.selectedFilterValues !== option) {
            this.sidePanelFilters[id]["selectedFilterValues"] = option;
          } else {
            this.sidePanelFilters[id]["selectedFilterValues"] = this.localeObj.tf_1_Calendar_rateCalender_selectDropdown;
          }
        } else if(filter.selectionType === "multiple" && !filter.selectedFilterValues.includes(option)) {
          if(filter["selectedFilterValues"] === this.localeObj.tf_1_Calendar_rateCalender_selectDropdown) {
            this.sidePanelFilters[id]["selectedFilterValues"] = [option];
          } else {
            this.sidePanelFilters[id]["selectedFilterValues"].push(option);
          }
        }
      }
    } 
  }

  public openFiltersModal(template: TemplateRef<any>) {
    this._storeSvc.setActiveModalElem("mobile_filters");
    this.modalRef = this.modalService.show(
      template,
      Object.assign({}, { class: "modal-md" })
    );
    return false;
  }

  public updateCurrencySelection(currency) {
    this.currencySelection = currency;
  }

  public applyFilters() {
    this._storeSvc.updateCurrencyCodeObj(this.currencySelection);
    this._storeSvc.updateSortOrder(this.isSortOrderAsc);
    const rooms = this._storeSvc.getBasketState().Rooms;
    this._storeSvc.updateMultipleRoomsWithPricing(rooms);
    if(this.sidePanelFilters !== this.roomAttrFilters) {
      const val = _.cloneDeep(this.sidePanelFilters);
      this.roomAttrFilters = val;
      this.roomFilters.emit(this.roomAttrFilters);
      this._storeSvc.setRoomAttributes(this.roomAttrFilters);
    }
    this.modalRef.hide();
    if(this.highValue !== 0) {
      this._storeSvc.setPriceSliderRange([this.minVal, this.highValue]);
    }
    this.noFiltersSelected = 0;
    this.roomAttrFilters.forEach((elem)=> {
      if (elem.selectedFilterValues !== this.localeObj.tf_1_Calendar_rateCalender_selectDropdown) {
        this.noFiltersSelected +=1; 
      }
    });
  }
    
  public setMobileAttrFilter(elem, value, index, view) {
    if(value === elem.list[elem.list.length - 1]) {
      this.sidePanelFilters[index]["selectedFilterValues"]= this.localeObj.tf_1_Calendar_rateCalender_selectDropdown;
    } else if(value.includes(this.localeObj.tf_2_RoomList_filters_clearBtn)){
      this.sidePanelFilters[index]["selectedFilterValues"]= this.localeObj.tf_1_Calendar_rateCalender_selectDropdown;
    } 
    else {
      this.sidePanelFilters[index]["selectedFilterValues"]= value;
    }
  }

  public priceFilterValue() {
    this.maxRangeVal =  CommonUtility.roundedValue(this.entireRoomsList[this.entireRoomsList.length - 1].discountedAveragePriceByCurrency[this.currencySelection.code] ||
    this.entireRoomsList[this.entireRoomsList.length - 1].averagePriceByCurrency[this.currencySelection.code] ||
    this.entireRoomsList[this.entireRoomsList.length - 1].totalPriceByCurrency[this.currencySelection.code],2);
    this.minVal = this.minVal !== 0 ? this.minVal : 0;
    this.highValue = (this.highValue !== 0 && this.highValue !== this.maxRangeVal)
       ? this.highValue : this.maxRangeVal;

      const newOptions: Options = {
        floor: 0,
        ceil: Math.floor(this.maxRangeVal),
        translate: (value: number): string => {
          if(Math.floor(this.maxRangeVal) - value === 0){
            return this.currSymbol+ this.maxRangeVal;
          }
          return this.currSymbol+ value;
        }
      };
      newOptions.ceil = this.maxRangeVal;
      this.options = newOptions;
      this.manualRefresh.emit();
  }

  public closeDropdown() {
    this.noFiltersSelected = 0;
    this.roomAttrFilters.forEach((elem)=> {
      if (elem.selectedFilterValues !== this.localeObj.tf_1_Calendar_rateCalender_selectDropdown) {
        this.noFiltersSelected +=1; 
      }
    });
  }

  public setRoomAttrFilter(filter, event, index) {
    if(!!event.target.value) {
      const eventValue = event.target.value === 0 ? event.target.id : event.target.value;
      if(filter.selectionType === 'single') {
        this.filtersArray[filter.attributeName] = !this.filtersArray[filter.attributeName] ? eventValue :
        (this.filtersArray[filter.attributeName] === eventValue) ? this.localeObj.tf_1_Calendar_rateCalender_selectDropdown: eventValue;
        if(eventValue === filter.list[filter.list.length - 1]) {
          this.roomAttrFilters[index]["selectedFilterValues"]= this.localeObj.tf_1_Calendar_rateCalender_selectDropdown;
          this.sidePanelFilters[index]["selectedFilterValues"]= this.localeObj.tf_1_Calendar_rateCalender_selectDropdown;
          this.filtersArray[filter.attributeName] = this.localeObj.tf_1_Calendar_rateCalender_selectDropdown;
        }
      } else {
        let arr :any[] = [];
        if(eventValue !== this.localeObj.tf_2_RoomList_filters_clearBtn) {
          if(!!this.filtersArray[filter.attributeName] && this.filtersArray[filter.attributeName] !== this.localeObj.tf_1_Calendar_rateCalender_selectDropdown) {
            if(this.filtersArray[filter.attributeName].includes(eventValue)) {
              const id = this.filtersArray[filter.attributeName].indexOf(eventValue);
              this.filtersArray[filter.attributeName].splice(id, 1);
            } else {
              this.filtersArray[filter.attributeName].push(eventValue);
            }
          }
          this.filtersArray[filter.attributeName] = (!this.filtersArray[filter.attributeName] || this.filtersArray[filter.attributeName] === this.localeObj.tf_1_Calendar_rateCalender_selectDropdown) ? [eventValue]: this.filtersArray[filter.attributeName];
        } else {
          this.filtersArray[filter.attributeName] = this.localeObj.tf_1_Calendar_rateCalender_selectDropdown;
        }
        if(eventValue.includes(this.localeObj.tf_2_RoomList_filters_clearBtn) || (Array.isArray(this.filtersArray[filter.attributeName]) && this.filtersArray[filter.attributeName].length === 0) ){
          this.roomAttrFilters[index]["selectedFilterValues"]= this.localeObj.tf_1_Calendar_rateCalender_selectDropdown;
          this.sidePanelFilters[index]["selectedFilterValues"]= this.localeObj.tf_1_Calendar_rateCalender_selectDropdown;
          this.filtersArray[filter.attributeName] = this.localeObj.tf_1_Calendar_rateCalender_selectDropdown;
        } 
      }
      this.roomAttrFilters[index]["selectedFilterValues"]= this.filtersArray[filter.attributeName];
      this.sidePanelFilters[index]["selectedFilterValues"]= this.filtersArray[filter.attributeName];
      this.roomFilters.emit(this.roomAttrFilters);
      this._storeSvc.setRoomAttributes(this.roomAttrFilters);
      if(this.triggerClose) {
        this.retainDropdown(event);
        this.triggerClose = true;
      }  
    }  
  }

  public closeDesktopFilter(id) {
    (<any>$("#"+id)).dropdown("toggle");
    this.triggerClose = false;
  }

  public retainDropdown(event) {
    event.stopPropagation();
  }

  public updateCurrencySelectionForUD(currency) {
    this.currencySelection.code = currency.code;
    // this.currencySelection = currency;
    this._storeSvc.updateCurrencyCodeObj(currency);
    this._storeSvc.updateIntialCurrencyCodeObj(this.currencySelection.code);
    CommonUtility.setDatalayer({
      currency: currency.code,
    });
    const isManagebooking = this._storeSvc.getManageBookingFlowStatus();
    if (!isManagebooking) {
      const rooms = this._storeSvc.getBasketState().Rooms;
      this._storeSvc.updateMultipleRoomsWithPricing(rooms);
    }
    const guestSummary = this._storeSvc.getBasketState().GuestSummary;
    let errorStatusCode;
    if (guestSummary.restrictionFailed) {
      this._storeSvc.setError(4000);
      errorStatusCode = 4000;
    }
    const urlParams = this._route.snapshot.queryParams;
    const params = CommonUtility.getQueryParamObjGuestSummary(
      guestSummary,
      this._storeSvc,
      undefined,
      errorStatusCode
    );
    params["offerCode"] = urlParams["offerCode"] ? urlParams["offerCode"] : "";
    params["accessCode"] = urlParams["accessCode"]
      ? urlParams["accessCode"]
      : "";
    params["propertyCode"] = urlParams["propertyCode"]
      ? urlParams["propertyCode"]
      : "";
    const navigationExtras = {
      queryParams: params
    };
    if (this.router.url.includes("/specials")) {
      this.router.navigate(["/" + URL_PATHS.SPECIALS_PAGE], navigationExtras);
    } else if (this.router.url.includes("/promo")) {
      this.router.navigate(["/" + URL_PATHS.PROMO_PAGE], navigationExtras);
    } else {
      this.router
        .navigate([], navigationExtras)
        .then((d) => CommonUtility.highlightStep("select-room"));
    }
  }
}
