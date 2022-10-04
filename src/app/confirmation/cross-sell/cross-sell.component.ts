import {
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
  TemplateRef,
  ViewChild,
} from "@angular/core";
import * as _ from "lodash";
import { BsModalService } from "ngx-bootstrap";
import { BsModalRef } from "ngx-bootstrap/modal/bs-modal-ref.service";
import { Subscription } from "rxjs";
import { FeatureFlags } from "src/app/common/feature.flags";
import { State } from "../../../../node_modules/@ngrx/store";
import { CommonUtility } from "../../common/common.utility";
import { CrossSellAddon } from "../../common/models/cross-sell.model";
import { CrossSellServiceService } from "../../common/services/cross-sell/cross-sell-service.service";
import { StoreService } from "../../common/services/store.service";
import { IBasketState } from "../../common/store/reducers/basket.reducer";
import { CheckinSummary } from "../../search/guestduration/checkinsummary.type";
// import { EventEmitter } from 'protractor';

@Component({
  selector: "app-cross-sell",
  templateUrl: "./cross-sell.component.html",
  styleUrls: ["./cross-sell.component.scss"],
})
export class CrossSellComponent implements OnInit, OnDestroy {
  @Output() crossSellAddonsExists: EventEmitter<any> = new EventEmitter<any>();
  @ViewChild("template") template: TemplateRef<any>;
  private modalRef: BsModalRef;
  _subscription: Subscription;
  crossSellList: any;
  firstTimeLoad: boolean;
  currCrossSell: CrossSellAddon;
  currType = "SGD";
  localeObj: any;
  private _userSettingsSubscriptions: Subscription;
  private _basketState: Subscription;
  currCode: string;
  guestSummary: CheckinSummary;
  public RTL_Flag: boolean;
  constructor(
    private CSServ: CrossSellServiceService,
    private modalService: BsModalService,
    private store: StoreService,
    private state: State<any>
  ) {}

  ngOnInit() {
    this.firstTimeLoad = true;
    this._userSettingsSubscriptions = this.store
      .getUserSettings()
      .subscribe((sharedData) => {
        this.localeObj = sharedData.localeObj;
        this.RTL_Flag = CommonUtility.langAlignCheck(this.store.getUserSettingsState().langObj.code, FeatureFlags);
      });
    this.crossSellList = [];
    this._basketState = this.store.getBasket().subscribe((sharedData) => {
      this.currType = sharedData.CurrencyCode || "SGD";
      this.currCode = CommonUtility.getCurrSymbolForType(
        this.store.getUserSettingsState().propertyInfo,
        this.currType
      );
      this.guestSummary = sharedData.GuestSummary;
      if (
        this.guestSummary !== undefined &&
        this.guestSummary !== null &&
        this.firstTimeLoad
      ) {
        this._subscription = this.CSServ.getCrossSellAddons(
          this.currType,
          this.guestSummary
        ).subscribe((data) => {
          // if (this._subscription !== undefined) {
          //   this._subscription.unsubscribe();
          // }
          this.crossSellList = _.chunk(_.get(data, "data.crossSellAddons"), 3);
          if (this.crossSellList.length > 0) {
            this.crossSellAddonsExists.emit(true);
          }
          this.firstTimeLoad = false;
        });
      }
    });
  }

  ngOnDestroy() {
    const subscriptionsList = [
      this._userSettingsSubscriptions,
      this._subscription,
      this._basketState,
    ];
    CommonUtility.removeSubscriptions(subscriptionsList);
    if (this.modalRef !== undefined) {
      this.modalRef.hide();
    }
  }

  openModal(template: TemplateRef<any>, crossSell: CrossSellAddon) {
    this.currCrossSell = crossSell;
    this.modalRef = this.modalService.show(template, { class: "modal-md" });
    CommonUtility.focusOnModal('cross-sell-modal');
    return false;
  }

  openNewWindow(link: string) {
    window.open(link, "_blank");
  }
}
