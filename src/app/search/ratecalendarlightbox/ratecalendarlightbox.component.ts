import {
  AfterContentInit,
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  NgModule,
  OnDestroy,
  OnInit,
  Output,
  TemplateRef,
  ViewChild,
} from "@angular/core";
import * as _ from "lodash";
import { BsModalService } from "ngx-bootstrap/modal";
import { BsModalRef } from "ngx-bootstrap/modal/bs-modal-ref.service";
import { URL_PATHS } from "src/app/common/common.constants";
import { CommonUtility } from "src/app/common/common.utility";
import { StoreService } from "../../common/services/store.service";
import { CheckinSummary } from "../guestduration/checkinsummary.type";
import { RatecalendarComponent } from "../ratecalendar/ratecalendar.component";

@Component({
  selector: "app-ratecalendarlightbox",
  templateUrl: "./ratecalendarlightbox.component.html",
  styleUrls: ["./ratecalendarlightbox.component.scss"],
})
export class RatecalendarlightboxComponent
  implements OnInit, AfterViewInit, OnDestroy {
  modalRef: BsModalRef;
  localeObj: any;
  private _userSettingsSubscriptions: any;
  @ViewChild("lightboxmodel", { static: true }) dialogBox: ElementRef;

  @ViewChild("rate-calander") rateCal: RatecalendarComponent;
  @Input("checkinsummary") checkinsummary: CheckinSummary;
  @Input("isPromoDetailsPage") isPromoDetailsPage = false;
  @Input("selectedPromoCode") selectedPromoCode = "";
  @Input() isMultiProp = false;
  @Output() checkInSummaryChanged = new EventEmitter<CheckinSummary>();
  @Output() checkAvailableUpgrades = new EventEmitter();
  @Output() rateToWidget = new EventEmitter();
  @Output() multiPropertyCheckInSummaryChanged = new EventEmitter<
    CheckinSummary
  >();
  iata: any;
  isIATAValid: boolean = true;

  constructor(
    private modalService: BsModalService,
    private _storeSvc: StoreService
  ) {}

  ngOnInit() {
    this._userSettingsSubscriptions = this._storeSvc
      .getUserSettings()
      .subscribe((sharedData) => {
        this.localeObj = sharedData.localeObj;
        this.iata = sharedData.iata;
        if (window.location.pathname === "/" + URL_PATHS.SEARCH_PAGE) {
          if (this.iata.isValidIata === false) {
            console.log
            this.isIATAValid = false
          }
        }
        if (
          !!sharedData.iata.iataNumber &&
          sharedData.iata.isValidIata === false &&  this.isIATAValid === true
        ) {
          if (this.modalService.getModalsCount() === 0) {
            this.openRateCalendar(
              _.get(this._storeSvc.getBasketState(), "GuestSummary")
            );
          }
        } else {
          if (this.modalRef !== undefined) {
            this.modalRef.hide();
          }
        }
      });
  }

  ngOnDestroy() {
    const subscriptionsList = [this._userSettingsSubscriptions];
    CommonUtility.removeSubscriptions(subscriptionsList);
    if (this.modalRef !== undefined) {
      this.modalRef.hide();
    }
  }

  ngAfterViewInit() {}

  openRateCalendar(checkinsummary: CheckinSummary) {
    try {
      this.modalRef = this.modalService.show(
        this.dialogBox,
        Object.assign({}, { class: "modal-lg" })
      );
    } catch (err) {
      console.log(err);
    }
    CommonUtility.focusOnModal("rc-modal");
    return false;
  }

  onCheckInSummaryChanged(eventData: CheckinSummary) {
    this.checkInSummaryChanged.emit(eventData);
    this.modalRef.hide();
    return false;
  }

  onMultiPropertyCheckInSummaryChanged(eventData: CheckinSummary) {
    this.multiPropertyCheckInSummaryChanged.emit(eventData);
    this.modalRef.hide();
    return false;
  }

  updateCheckingData() {
    this.modalRef.hide();
    return false;
  }

  closeRateCal() {
    this.modalRef.hide();
  }

  checkAvailableUpgradesEvent() {
    this.checkAvailableUpgrades.emit();
  }

  updatePref() {
    this.rateToWidget.emit();
  }
}
