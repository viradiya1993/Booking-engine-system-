import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { CancelBookingConfirmationComponent } from "../app/confirmation/cancel-booking-confirmation/cancel-booking-confirmation.component";
import { ManageBookingComponent } from "../app/confirmation/manage-booking/manage-booking.component";
import { URL_PATHS } from "./common/common.constants";
import { MaintenanceErrorPageComponent } from "./common/maintenance-error-page/maintenance-error-page.component";
import { DependencyResolver } from "./common/services/dependency.resolver";
import { TimeOutErrorPageComponent } from "./common/time-out-error-page/time-out-error-page.component";
import { ConfirmationPageComponent } from "./confirmation/confirmation-page/confirmation-page.component";
import { ManageBookingVerificationComponent } from "./confirmation/manage-booking-verification/manage-booking-verification.component";
import { PaymentFailureComponent } from "./confirmation/payment-failure/payment-failure.component";
import { PaymentSuccessComponent } from "./confirmation/payment-success/payment-success.component";
import { AlipayRedirectComponent } from "./guestinfo/alipay-redirect/alipay-redirect.component";
import { GuestCreditCardPageComponent } from "./guestinfo/guest-credit-card-page/guest-credit-card-page.component";
import { HomeComponent } from "./home/home.component";
import { MultiPropertyComponent } from "./multi-property/multi-property.component";
import { MultipropertyViewRoomsDetailComponent } from "./multiproperty-view-rooms-detail/multiproperty-view-rooms-detail.component";
import { PromoComponent } from "./promo/promo.component";
import { PromoDetailsComponent } from "./promo/promoDetails/promo-details.component";
import { MultiroomRatePlanComponent } from "./room-listing/multi-room/multiroom-rate-plan/multiroom-rate-plan.component";
import { RoomListingComponent } from "./room-listing/room-listing-page/room-listing-page.component";
import { SearchComponent } from "./search/search.component";

const routes: Routes = [
  // {
  //   path: URL_PATHS.HOME_PAGE,
  //   component: MultiPropertyComponent,
  //   resolve: { resolver: DependencyResolver },
  // },
  {
    path: URL_PATHS.HOME_PAGE,
    component: HomeComponent,
    resolve: { resolver: DependencyResolver },
  },
  {
    path: URL_PATHS.ROOMS_PAGE,
    component: RoomListingComponent,
    resolve: { resolver: DependencyResolver },
  },
  {
    path: URL_PATHS.SEARCH_PAGE,
    component: SearchComponent,
    resolve: { resolver: DependencyResolver },
  },
  /* Commented below Manage Booking path for release 2 ,uncomment to restart the Manage Booking flow */
  {
    path: URL_PATHS.MANAGE_BOOKING,
    component: ManageBookingVerificationComponent,
    resolve: { resolver: DependencyResolver },
  },
  {
    path: URL_PATHS.CANCEL_BOOKING,
    component: CancelBookingConfirmationComponent,
    resolve: { resolver: DependencyResolver },
  },
  {
    path: URL_PATHS.BOOKING_DETAILS,
    component: ManageBookingComponent,
    resolve: { resolver: DependencyResolver },
  },
  {
    path: URL_PATHS.GUEST_INFO_PAGE,
    component: GuestCreditCardPageComponent,
    resolve: { resolver: DependencyResolver },
  },
  {
    path: URL_PATHS.CONFIRMATION_PAGE,
    component: ConfirmationPageComponent,
    resolve: { resolver: DependencyResolver },
  },
  {
    path: "aliPay",
    component: AlipayRedirectComponent,
    resolve: { resolver: DependencyResolver },
  },
  // { path: 'paymentresponse', component: PaymentSuccessComponent, resolve: { resolver: DependencyResolver } },
  {
    path: URL_PATHS.MAINTENANCE_ERROR,
    component: MaintenanceErrorPageComponent,
    resolve: { resolver: DependencyResolver },
  },
  {
    path: "paymentsuccess",
    component: PaymentSuccessComponent,
    resolve: { resolver: DependencyResolver },
  },
  {
    path: "paymentfailure",
    component: PaymentFailureComponent,
    resolve: { resolver: DependencyResolver },
  },
  {
    path: URL_PATHS.MULTIROOMPLANLISTING,
    component: MultiroomRatePlanComponent,
    resolve: { resolver: DependencyResolver },
  },
  // { path: "multiproperty", component: MultiPropertyComponent },
  {
    path: URL_PATHS.PROMO_PAGE,
    component: PromoComponent,
    resolve: { resolver: DependencyResolver },
  },
  {
    path: URL_PATHS.SPECIALS_PAGE,
    component: PromoComponent,
    resolve: { resolver: DependencyResolver },
  },
  {
    path: "error",
    component: TimeOutErrorPageComponent,
    resolve: { resolver: DependencyResolver },
  },
  { path: "hoteldetails", component: MultipropertyViewRoomsDetailComponent },
  { path: "**", redirectTo: "", pathMatch: "full" }, // if blank
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' })],
  exports: [RouterModule],
  declarations: [],
})
export class AppRoutingModule {}
