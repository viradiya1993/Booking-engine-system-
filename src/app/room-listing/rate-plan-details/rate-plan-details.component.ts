import {
  Component,
  Input,
  OnDestroy,
  OnInit,
  TemplateRef,
} from "@angular/core";
import * as _ from "lodash";
import { BsModalService } from "ngx-bootstrap";
import { BsModalRef } from "ngx-bootstrap/modal/bs-modal-ref.service";
import { Subscription } from "rxjs";
import { CommonUtility } from "src/app/common/common.utility";
import { RatePlan } from "../../common/models/packagedetails";
import { RatePlanDetailsService } from "../../common/services/ratePlanDetails.Service";
import { StoreService } from "../../common/services/store.service";
import { RatePlanDetails } from "./RatePlanDetails";
import { FeatureFlags } from "src/app/common/feature.flags";

@Component({
  selector: "app-rate-plan-details",
  templateUrl: "./rate-plan-details.component.html",
  styleUrls: ["./rate-plan-details.component.scss"],
})
export class RatePlanDetailsComponent implements OnInit, OnDestroy {
  private modalRef: BsModalRef;
  ratePlanDetails: RatePlanDetails;
  localeObj: any;
  private roomlength: number;
  private _userSettingsSubscriptions: any;
  private reatePlanDetailsSubscription: Subscription;
  additionalPrivileges: {};
  privilegeFeatures: any;
  selectedPrivilegeIndex: number;
  ratePlanDescription: boolean;
  RTL_Flag: boolean = false;
  @Input() ratePlan: RatePlan;

  constructor(
    private modalService: BsModalService,
    private ratePlanDetailsService: RatePlanDetailsService,
    private _storeSvc: StoreService
  ) {}

  openModal(template: TemplateRef<any>) {
    this.reatePlanDetailsSubscription = this.ratePlanDetailsService
      .getPackageDetails(this.ratePlan.code)
      .subscribe((resp) => {
        if (resp && _.get(resp, "status.statusCode") !== 1000) {
          this._storeSvc.setError(resp.status.statusCode);
        }
        this.ratePlanDetails = resp.data;
        this.selectedPrivilegeIndex = 0;
        this.additionalPrivileges = null;
        if (
          _.get(resp, "data.privileges") &&
          _.get(resp, "data.privileges").length > 0
        ) {
          this.additionalPrivileges = {};
          resp.data.privileges.forEach((privilegeObj) => {
            this.additionalPrivileges[privilegeObj.category] =
              privilegeObj.description;
          });
          const privilegeKeys = this.objectKeys(this.additionalPrivileges);
          this.privilegeFeatures = this.additionalPrivileges[
            privilegeKeys[this.selectedPrivilegeIndex]
          ];
        }
        this.modalRef = this.modalService.show(template, { class: "modal-md" });
        CommonUtility.focusOnModal("rate-plan-details-modal");
      });
  }

  ngOnInit() {
    this.privilegeFeatures = [];
    this.additionalPrivileges = {};
    this.selectedPrivilegeIndex = 0;
    this._userSettingsSubscriptions = this._storeSvc
      .getUserSettings()
      .subscribe((sharedData) => {
        this.localeObj = sharedData.localeObj;
        this.RTL_Flag = CommonUtility.langAlignCheck(this._storeSvc.getUserSettingsState().langObj.code, FeatureFlags);
      });
    const basket = this._storeSvc.getBasketState().GuestSummary;
    this.roomlength = basket.rooms;
    this.reatePlanDetailsSubscription = this.ratePlanDetailsService
      .getPackageDetails(this.ratePlan.code)
      .subscribe((resp) => {
        if (
          resp.data.description ||
          (resp.data.privileges && resp.data.privileges.length > 0)
        ) {
          this.ratePlanDescription = true;
        } else {
          this.ratePlanDescription = false;
        }
      });
  }

  ngOnDestroy() {
    const subscriptionsList = [
      this._userSettingsSubscriptions,
      this.reatePlanDetailsSubscription,
    ];
    CommonUtility.removeSubscriptions(subscriptionsList);
    if (this.modalRef !== undefined) {
      this.modalRef.hide();
    }
  }

  objectKeys(obj: object) {
    const keys = Object.keys(obj),
      features = [];
    keys.forEach((element) => {
      features.push(element);
    });
    return features;
  }

  generateIDForViewDetails(ratePlanDetails) {
    if (this.roomlength > 1) {
      return (
        "m_link_view_offer_details_" + ratePlanDetails.name.replace(/\s/g, "")
      );
    } else {
      return (
        "r_link_view_offer_details_" + ratePlanDetails.name.replace(/\s/g, "")
      );
    }
  }

  populatePrivileges(featureItem: any, featureIndex: number, currTarget: any) {
    const prevHighlightedElementList = document.querySelectorAll(
      ".selected-privilege-highlight"
    );
    if (prevHighlightedElementList) {
      for (let index = 0; index < prevHighlightedElementList.length; index++) {
        prevHighlightedElementList[index].classList.remove(
          "selected-privilege-highlight"
        );
      }
    }
    this.selectedPrivilegeIndex = featureIndex;
    this.privilegeFeatures = this.additionalPrivileges[featureItem];
    currTarget.classList.add("selected-privilege-highlight");
  }
}
