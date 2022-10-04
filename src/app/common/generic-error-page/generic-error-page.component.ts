import { AfterViewInit, Component, OnInit, TemplateRef, ViewChild } from "@angular/core";
import { Router } from "@angular/router";
import * as _ from "lodash";
import { ICheckinSummary } from "../../search/guestduration/checkinsummary.type";
import { QUERY_PARAM_ATTRIBUTES, URL_PATHS } from "../common.constants";
import { CommonUtility } from "../common.utility";
import { FeatureFlags } from "../feature.flags";
import { StoreService } from "../services/store.service";
import { IBasketState } from "../store/reducers/basket.reducer";
import { BsModalService } from "ngx-bootstrap";
import { Subscription } from "rxjs";

@Component({
  selector: "app-generic-error-page",
  templateUrl: "./generic-error-page.component.html",
  styleUrls: ["./generic-error-page.component.scss"],
})
export class GenericErrorPageComponent implements OnInit {
  guestSummary: ICheckinSummary;
  localeObj: any;
  _userSettingsSubscriptions: any;
  RTL_Flag: boolean;
  modalRef: any;
  _basketSubscription: Subscription;
  @ViewChild("genericError") genericError: TemplateRef<any>;

  constructor(
    private _storeSvc: StoreService,
    private router: Router,
    private modalService: BsModalService,
    ) {}

  ngOnInit() {
    const basketState = this._storeSvc.getBasketState() as IBasketState;
    this.guestSummary = basketState.GuestSummary;
    this._userSettingsSubscriptions = this._storeSvc
      .getUserSettings()
      .subscribe((sharedData) => {
        this.localeObj = sharedData.localeObj;
        this.RTL_Flag = CommonUtility.langAlignCheck(
          this._storeSvc.getUserSettingsState().langObj.code,
          FeatureFlags
        );
      });
    this._basketSubscription = this._storeSvc.getBasket().subscribe((basket) => {
      if(basket.systemError) {
        this.openModal();
      }
    });
    this._storeSvc.updateIsErrorPageFlag(true);
    $('#genericError').on('hide.bs.modal', function (e) {
      e.preventDefault();
      e.stopPropagation();
      return false;
  });
  }

  redirectPage() {
    this._storeSvc.updateIsErrorPageFlag(false);
    // const rateCode = _.get(this._storeSvc.getBasketState(), "offerCode");
    // const params = CommonUtility.getQueryParamObjGuestSummary(
    //   this.guestSummary,
    //   this._storeSvc,
    //   rateCode
    // );
    // const navigationExtras = {
    //   queryParams: params,
    // };
    // this.router
    //   .navigate(["/" + URL_PATHS.ROOMS_PAGE], navigationExtras)
    //   .then((d) => CommonUtility.highlightStep("select-room"));
    window.location.reload();
    return true;
  }

  openModal() {
    this.modalRef = this.modalService.show(this.genericError, { class: "modal-md", backdrop: 'static', keyboard: false});
    document.getElementById("main-body").style.filter = "blur(8px)";
    CommonUtility.focusOnModal('genericError-modal');
    this._storeSvc.setSystemError(false);
    this._storeSvc.updateIsErrorPageFlag(false);
  }
}
