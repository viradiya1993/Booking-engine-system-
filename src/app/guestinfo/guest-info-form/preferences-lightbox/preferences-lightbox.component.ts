import {
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
import { BsModalService } from "ngx-bootstrap/modal";
import { BsModalRef } from "ngx-bootstrap/modal/bs-modal-ref.service";
import { CommonUtility } from "src/app/common/common.utility";
import { StoreService } from "../../../common/services/store.service";
import { CheckinSummary } from "../../../search/guestduration/checkinsummary.type";
import { PreferencesComponent } from "../preferences/preferences.component";

@Component({
  selector: "app-preferences-lightbox",
  templateUrl: "./preferences-lightbox.component.html",
  styleUrls: ["./preferences-lightbox.component.scss"],
})
export class PreferencesLightboxComponent implements OnInit, OnDestroy {
  modalRef: BsModalRef;
  localeObj: any;
  private _userSettingsSubscriptions: any;
  @Input("source") source: string;
  @Input("roomIndex") roomIndex: number;
  @Input("bookingRef") bookingRef: string;
  @ViewChild("modifyPreferences", { static: true }) dialogBox: ElementRef;
  @Input("guestdetailsString") guestdetailsString: any;
  @ViewChild("Preferences") guestPreferences: PreferencesComponent;
  @Output() checkInSummaryChanged = new EventEmitter<CheckinSummary>();

  constructor(
    private modalService: BsModalService,
    private _storeSvc: StoreService
  ) {}

  ngOnInit() {
    this._userSettingsSubscriptions = this._storeSvc
      .getUserSettings()
      .subscribe((sharedData) => {
        this.localeObj = sharedData.localeObj;
      });
  }

  ngOnDestroy() {
    const subscriptionsList = [this._userSettingsSubscriptions];
    CommonUtility.removeSubscriptions(subscriptionsList);
    if (this.modalRef !== undefined) {
      this.modalRef.hide();
    }
  }

  openModal(sizeClass?: string) {
    try {
      this.modalRef = this.modalService.show(
        this.dialogBox,
        Object.assign({}, { class: sizeClass })
      );
    } catch (err) {
      console.log(err);
    }
  }

  closeModal() {
    if (this.modalRef !== undefined) {
      this.modalRef.hide();
    }
  }
}
