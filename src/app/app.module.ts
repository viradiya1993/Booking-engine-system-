import { AgmCoreModule } from "@agm/core";
import { HTTP_INTERCEPTORS, HttpClientModule } from "@angular/common/http";
import { ErrorHandler, NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { NgSelectModule } from "@ng-select/ng-select";
import { StoreModule } from "@ngrx/store";
import { NgMultiSelectDropDownModule } from "ng-multiselect-dropdown";
import { AccordionModule } from "ngx-bootstrap/accordion";
import { CarouselModule } from "ngx-bootstrap/carousel";
import { BsDropdownModule } from "ngx-bootstrap/dropdown";
import { ModalModule } from "ngx-bootstrap/modal";
import { PopoverModule } from "ngx-bootstrap/popover";
import {
  NgcCookieConsentConfig,
  NgcCookieConsentModule,
} from "ngx-cookieconsent";
import { LoggerModule, NgxLoggerLevel } from "ngx-logger";
import { SlickCarouselModule } from "ngx-slick-carousel";
import { NgxSpinnerModule } from "ngx-spinner";
import { NgxUiLoaderModule } from "ngx-ui-loader";
import "select2";
import { environment } from "src/environments/environment";
import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { SkipKeyStrokesDirective } from "./common/directives/skip-key-strokes.directive";
import { TooltipDirective } from "./common/directives/tooltip.directive";
import { FooterComponent } from "./common/footer/footer.component";
import { GenericErrorPageComponent } from "./common/generic-error-page/generic-error-page.component";
import { HeaderComponent } from "./common/header/header.component";
import { MaintenanceErrorPageComponent } from "./common/maintenance-error-page/maintenance-error-page.component";
import { AddonFilterPipe } from "./common/pipes/addon-filter.pipe";
import { DateFormatPipe } from "./common/pipes/date-format.pipe";
import { CustomPriceFormatPipe } from "./common/pipes/decimal-format.pipe";
import { HotelsSortPipe } from "./common/pipes/hotels-sort.pipe";
import { LocationFilterPipe } from "./common/pipes/location-filter.pipe";
import { RoomAmenitiesFilterPipe } from "./common/pipes/room-amenities-filter.pipe";
import { RoomsSortByPipe } from "./common/pipes/rooms-sort-by.pipe";
import { RoomsFilters } from "./common/pipes/RoomsFilters.pipe";
import { SafeHtml } from "./common/pipes/SafeHtml.pipe";
import { AppService } from "./common/services/app.service";
import { ContentService } from "./common/services/content.service";
import { CrossSellServiceService } from "./common/services/cross-sell/cross-sell-service.service";
import { DependencyResolver } from "./common/services/dependency.resolver";
import { DeviceDetectorService } from "./common/services/device-detector.service";
import { GuestCreditCardPageService } from "./common/services/guest-credit-card-page.service";
import { HeaderService } from "./common/services/header.service";
import { HttpCacheInterceptor } from "./common/services/http-cache.interceptor";
import { HttpCacheService } from "./common/services/http-cache.service";
import { HttpResponseInterceptor } from "./common/services/http-response.interceptor";
import { HttpWrapperService } from "./common/services/http-wrapper.service";
import { ManageBookingService } from "./common/services/manage-booking.service";
import { AlipayPayment } from "./common/services/payment/alipay-payment.service";
import { MpgsPaymentService } from "./common/services/payment/mpgs-payment.service";
import { PaymentService } from "./common/services/payment/payment.service";
import { PromoService } from "./common/services/promo/promo.service";
import { RatePlanDetailsService } from "./common/services/ratePlanDetails.Service";
import { RatePlanListingService } from "./common/services/ratePlanListing.Service";
import { RoomListingService } from "./common/services/roomListing.Service";
import { StoreService } from "./common/services/store.service";
import { reducers } from "./common/store/reducers";
import { MbsSpinnerComponent } from "./common/utils/mbs-spinner/mbs-spinner.component";
import { BookingInfoComponent } from "./confirmation/booking-info/booking-info.component";
import { CancelBookingConfirmationComponent } from "./confirmation/cancel-booking-confirmation/cancel-booking-confirmation.component";
import { CancelBookingComponent } from "./confirmation/cancel-booking/cancel-booking.component";
import { ConfirmationPageComponent } from "./confirmation/confirmation-page/confirmation-page.component";
import { CrossSellComponent } from "./confirmation/cross-sell/cross-sell.component";
import { ManageBookingVerificationComponent } from "./confirmation/manage-booking-verification/manage-booking-verification.component";
import { ManageBookingComponent } from "./confirmation/manage-booking/manage-booking.component";
import { PaymentFailureComponent } from "./confirmation/payment-failure/payment-failure.component";
import { PaymentSuccessComponent } from "./confirmation/payment-success/payment-success.component";
import { AlaCarteAddonsComponent } from "./guestinfo/addons-upgrade/ala-carte-addons.component";
import { AlipayRedirectComponent } from "./guestinfo/alipay-redirect/alipay-redirect.component";
import { AmexComponent } from "./guestinfo/amex/amex.component";
import { AvailableUpgradesAddonsComponent } from "./guestinfo/available-upgrades-addons/available-upgrades-addons.component";
import { CreditGuestWidgetComponent } from "./guestinfo/credit-guest-widget/credit-guest-widget.component";
import { GuestCreditCardPageComponent } from "./guestinfo/guest-credit-card-page/guest-credit-card-page.component";
import { GuestInfoFooterComponent } from "./guestinfo/guest-info-footer/guest-info-footer.component";
import { GuestInfoFormComponent } from "./guestinfo/guest-info-form/guest-info-form.component";
import { PreferencesLightboxComponent } from "./guestinfo/guest-info-form/preferences-lightbox/preferences-lightbox.component";
import { PreferencesComponent } from "./guestinfo/guest-info-form/preferences/preferences.component";
import { PackagelistingComponent } from "./guestinfo/packagelisting/packagelisting.component";
import { PaymentMethodComponent } from "./guestinfo/payment-method/payment-method.component";
import { HomeComponent } from "./home/home.component";
import { ManageBookingLightboxComponent } from "./manage-booking-lightbox/manage-booking-lightbox.component";
import { MultiPropertyFilterComponent } from "./multi-property-filter/multi-property-filter.component";
import { AlternatePropertyComponent } from "./multi-property/alternate-property/alternate-property.component";
import { MultiPropertyComponent } from "./multi-property/multi-property.component";
import { MultiPropertyService } from "./multi-property/multi-property.service";
import { MultipropertyViewRoomsDetailComponent } from "./multiproperty-view-rooms-detail/multiproperty-view-rooms-detail.component";
import { PromoComponent } from "./promo/promo.component";
import { PromoDetailsComponent } from "./promo/promoDetails/promo-details.component";
import { PromoListComponent } from "./promo/promoList/promo-list.component";
import { RollbarErrorHandler, rollbarFactory, RollbarService } from "./rollbar";
import { FiltersComponent } from "./room-listing/filters/filters.component";
import { MultiRoomBannerComponent } from "./room-listing/multi-room/multi-room-banner/multi-room-banner.component";
import { MultiroomRatePlanComponent } from "./room-listing/multi-room/multiroom-rate-plan/multiroom-rate-plan.component";
import { RatePlanDetailsComponent } from "./room-listing/rate-plan-details/rate-plan-details.component";
import { RatePlanNightlyPricesComponent } from "./room-listing/rate-plan-nightly-prices/rate-plan-nightly-prices.component";
import { AddOnsComponent } from "./room-listing/rate-plans/add-ons/add-ons.component";
import { RatePlansComponent } from "./room-listing/rate-plans/rate-plans.component";
import { RoomDetailsComponent } from "./room-listing/room-details/room-details.component";
import { RoomListingComponent } from "./room-listing/room-listing-page/room-listing-page.component";
import { RoomsComponent } from "./room-listing/rooms/rooms.component";
import { GuestdurationComponent } from "./search/guestduration/guestduration.component";
import { RatecalendarComponent } from "./search/ratecalendar/ratecalendar.component";
import { RatecalendarlightboxComponent } from "./search/ratecalendarlightbox/ratecalendarlightbox.component";
import { SearchComponent } from "./search/search.component";
import { TimeOutErrorPageComponent } from './common/time-out-error-page/time-out-error-page.component';
import { NgxSliderModule } from '@angular-slider/ngx-slider';
import { PriceSliderPipe } from './common/pipes/price-slider.pipe';

export const cookieConfig: NgcCookieConsentConfig = {
  autoOpen: false,
  cookie: {
    domain: "tinesoft.github.io",
  },
  position: "top",
  theme: "classic",
  palette: {
    popup: {
      background: "#ffffff",
      text: "#000000",
      link: "#000000",
      border: "#f8e71c",
    },
    button: { background: "transparent", border: "grey", text: "#000000" },
    // highlight: { background: '#f8e71c', border: '#f8e71c', text: '#000000' },
  },
  type: "info",
  content: {
    message:
      "This site uses cookies to provide with best possible experience. \
    You may choose to enable or disable cookies in your browser policy settings",
    dismiss: "Got it!",
    deny: "Refuse cookies",
    link: "Learn more",
    href: "https://cookiesandyou.com",
  },
};
@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    FooterComponent,
    FiltersComponent,
    RoomsComponent,
    RoomDetailsComponent,
    AddOnsComponent,
    PreferencesLightboxComponent,
    CancelBookingComponent,
    CancelBookingConfirmationComponent,
    GuestdurationComponent,
    RatePlansComponent,
    RoomsFilters,
    RatecalendarComponent,
    MultiRoomBannerComponent,
    RatecalendarlightboxComponent,
    RatePlanDetailsComponent,
    RoomListingComponent,
    RoomsSortByPipe,
    CustomPriceFormatPipe,
    TooltipDirective,
    RatePlanNightlyPricesComponent,
    RoomAmenitiesFilterPipe,
    GuestInfoFormComponent,
    GuestCreditCardPageComponent,
    AvailableUpgradesAddonsComponent,
    RoomAmenitiesFilterPipe,
    DateFormatPipe,
    CreditGuestWidgetComponent,
    PaymentMethodComponent,
    SearchComponent,
    ConfirmationPageComponent,
    CrossSellComponent,
    GuestInfoFooterComponent,
    BookingInfoComponent,
    PaymentSuccessComponent,
    PackagelistingComponent,
    MbsSpinnerComponent,
    AlipayRedirectComponent,
    PaymentFailureComponent,
    MultiroomRatePlanComponent,
    GenericErrorPageComponent,
    SkipKeyStrokesDirective,
    AmexComponent,
    MaintenanceErrorPageComponent,
    ManageBookingComponent,
    PreferencesComponent,
    ManageBookingVerificationComponent,
    SafeHtml,
    MultiPropertyComponent,
    PromoComponent,
    PromoListComponent,
    PromoDetailsComponent,
    MultipropertyViewRoomsDetailComponent,
    ManageBookingLightboxComponent,
    AlaCarteAddonsComponent,
    AddonFilterPipe,
    AlternatePropertyComponent,
    MultiPropertyFilterComponent,
    LocationFilterPipe,
    HomeComponent,
    HotelsSortPipe,
    TimeOutErrorPageComponent,
    PriceSliderPipe,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    ModalModule.forRoot(),
    AccordionModule.forRoot(),
    StoreModule.forRoot(reducers, {
      initialState: loadInitialStoreState,
      runtimeChecks: {
        strictStateImmutability: false,
        strictActionImmutability: false,
      },
    }),
    FormsModule,
    NgxUiLoaderModule,
    ReactiveFormsModule,
    HttpClientModule,
    CarouselModule.forRoot(),
    // NgxIntlTelInputModule,
    BsDropdownModule.forRoot(),
    NgSelectModule,
    PopoverModule.forRoot(),
    NgcCookieConsentModule.forRoot(cookieConfig),
    SlickCarouselModule,
    NgMultiSelectDropDownModule.forRoot(),
    LoggerModule.forRoot({
      serverLoggingUrl: environment.ui_logging_endpoint,
      level: NgxLoggerLevel.DEBUG,
      serverLogLevel: NgxLoggerLevel.DEBUG,
    }),
    AgmCoreModule.forRoot({
      apiKey: "AIzaSyASzkvZSquDfZi1VXa3q74Ez7ZiepzGeTI",
    }),
    NgxSpinnerModule,
    NgxSliderModule,
  ],

  providers: [
    DependencyResolver,
    HttpCacheService,
    HttpWrapperService,
    RoomListingService,
    ContentService,
    RatePlanDetailsService,
    RatePlanListingService,
    ManageBookingService,
    GuestCreditCardPageService,
    CrossSellServiceService,
    PaymentService,
    MpgsPaymentService,
    AlipayPayment,
    StoreService,
    AppService,
    HeaderService,
    PromoService,
    CustomPriceFormatPipe,
    DeviceDetectorService,
    MultiPropertyService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpResponseInterceptor,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpCacheInterceptor,
      multi: true,
    },
    {
      provide: ErrorHandler,
      useClass: RollbarErrorHandler,
    },
    {
      provide: RollbarService,
      useFactory: rollbarFactory,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}

export function loadInitialStoreState() {
  if (window.sessionStorage["storeState"] !== undefined) {
    const state = JSON.parse(window.sessionStorage["storeState"]);
    if (state !== undefined) {
      if (
        state.basketServiceReducer !== undefined &&
        state.basketServiceReducer.GuestSummary !== undefined
      ) {
        state.basketServiceReducer.GuestSummary.checkindate = new Date(
          state.basketServiceReducer.GuestSummary.checkindate
        );
        state.basketServiceReducer.GuestSummary.checkoutdate = new Date(
          state.basketServiceReducer.GuestSummary.checkoutdate
        );
      }
    }
    return state;
  }
  return {};
}
