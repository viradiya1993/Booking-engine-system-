import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  TemplateRef,
  ViewChild,
} from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import * as _ from "lodash";
import { BsModalService } from "ngx-bootstrap";
import { BsModalRef } from "ngx-bootstrap/modal/bs-modal-ref.service";
import { NgxUiLoaderService } from "ngx-ui-loader";
import { CommonUtility } from "src/app/common/common.utility";
import { FeatureFlags } from "src/app/common/feature.flags";
import { IBasketState } from "src/app/common/store/reducers/basket.reducer";
import { CheckinSummary } from "src/app/search/guestduration/checkinsummary.type";
import {
  checkErrorCodesList,
  error_code_prefix,
  frequencyAndBasis,
} from "../../common/common.constants";
import { GuestCreditCardPageService } from "../../common/services/guest-credit-card-page.service";
import { StoreService } from "../../common/services/store.service";
import { CustomPriceFormatPipe } from "../../common/pipes/decimal-format.pipe";

@Component({
  selector: "app-ala-carte-addons",
  templateUrl: "./ala-carte-addons.component.html",
  styleUrls: ["./ala-carte-addons.component.scss"],
  providers: [CustomPriceFormatPipe]
})
export class AlaCarteAddonsComponent implements OnInit, OnDestroy {
  addonInfo = [];
  @ViewChild("addons") addons: TemplateRef<any>;
  @ViewChild("errorTemplate") errorTemplate: TemplateRef<any>;
  @Output() processPayment: EventEmitter<any> = new EventEmitter<any>();
  @Input("validatedAddons") validatedAddons;
  private modalRef: BsModalRef;
  public Response;
  private _basketSubscription: any;
  private modalSubscription: any;
  private RoomsAvail = [];
  public Total = 0;
  public tax = 0;
  public selectedAddons = [];
  currencyType: any;
  currCode: any;
  private _userSettingsSubscriptions: any;
  localeObj: any;
  public addonsCost = [];
  baseAddonCost: any = 0;
  baseAddon: any = "";
  validAddOnsDetails: string;
  multiRoomCard: any;
  counter: number;
  public addonResponse = [];
  private initialLoad = true;
  defCurr: any;
  guestSummary: any;
  validRoomCodes: any;
  commonRoomAddons: any[] = [];
  addonsList: string;
  private _errorHandlerSubscription: any;
  errorFound: boolean;
  errorCode: number;
  errorMsg: any;
  errorModal: BsModalRef;
  public checkInSummary: CheckinSummary;
  public initialRoomArr: any[] = [];
  addonDir: any[] = [];
  errorcheck = 0;
  APIResponse: any[] = [];
  displayAddons = false;
  RTL_Flag: boolean = false;
  addonADAMessage: any;
  addonsText: string = " ";
  reservedAddons: any;
  finArr: any[] = [];
  addonsBasketState: any;
  isaddonAvailable = false;

  constructor(
    private modalService: BsModalService,
    private store: StoreService,
    private guestinfoservice: GuestCreditCardPageService,
    private _route: ActivatedRoute,
    private changeDetector: ChangeDetectorRef,
    private spinner: NgxUiLoaderService,
    private pricePipe: CustomPriceFormatPipe,
  ) {}

  ngOnDestroy(): void {
    const subscriptionsList = [
      this._basketSubscription,
      this._userSettingsSubscriptions,
      this.modalSubscription,
    ];
    CommonUtility.removeSubscriptions(subscriptionsList);
    if (this.modalRef !== undefined) {
      this.modalRef.hide();
    }
  }

  ngOnInit(): void {
    if (FeatureFlags.isFeatureEnabled("addons")) {
      this.displayAddons = true;
    }
    const basket = this.store.getBasketState() as IBasketState;
    this.initialRoomArr = [];
    basket.Rooms.forEach((room) => {
      this.initialRoomArr.push(room.RoomCode);
    });
    let adults = 0;
    let children = 0;
    this.counter = 0;
    this.defCurr =
      _.get(
        this.store.getUserSettingsState(),
        "propertyInfo.defaultCurrency"
      ) || "SGD";
    if (basket.Rooms.length > 1) {
      for (const guest of basket.Rooms) {
        adults += basket.GuestSummary.guests[guest.roomIndex].adults;
        children += basket.GuestSummary.guests[guest.roomIndex].children;
      }
    }
    this.setAvailAddons();

    this._userSettingsSubscriptions = this.store
      .getUserSettings()
      .subscribe((sharedData) => {
        this.localeObj = sharedData.localeObj;
        this.RTL_Flag = CommonUtility.langAlignCheck(this.store.getUserSettingsState().langObj.code, FeatureFlags);
      });

    this.modalSubscription = this.modalService.onHide.subscribe(() => {
      if (this.modalService.config.class.includes("addon-modal")) {
        this.addonResponse = [];
        this.RoomsAvail.forEach((room) => {
          const updatedAddons = { NOT_SPECIFIED: [] };
          updatedAddons.NOT_SPECIFIED = room.alaCarteAddOns.NOT_SPECIFIED.filter(
            (addon) => addon.numberOfUnit > 0
          );
          this.addonResponse.push(updatedAddons);
        });
        const arrRev = [];
        for (const resp of this.addonResponse) {
          arrRev.push(resp);
        }
        this.store.setAlaCarteAddonsTotal(arrRev);

        this.addonsList = this.selectedAddons
          .join(", ")
          .replace(/,(?!.*,)/gim, " and");
        setTimeout(() => {
          if (this.addonsList) {
            document
              .getElementById("remove_alacarte_addons")
              .focus({ preventScroll: true });
          }
        }, 500);
      }
    });

    this._errorHandlerSubscription = this.store
      .getErrorHandler()
      .subscribe((errorHandler) => {
        for (const error of checkErrorCodesList.AlacarteAddonsErrorCodes) {
          const code = error;
          if (_.get(errorHandler.error, code) === true) {
            this.errorcheck = 0;
            this.errorCode = code;
            this.errorFound = true;
            if (code === 9003) {
              if (this.localeObj) {
                this.errorMsg = _.get(this.localeObj, error_code_prefix + code);
              }
              this.errorModal = this.modalService.show(this.errorTemplate, {
                class: "modal-md",
              });
              CommonUtility.focusOnModal('ala-carte-addons-error-modal');
              this.store.setActiveModalElem('addons_modal_popup');
              this.store.removeError(code);
            }
            break;
          }
        }
      });

    this.store.setAlaCarteAddonsTotal({});
  }

  checkAvailAddons(initialLoad) {
    if (initialLoad) {
      const roomCodes = [];
      const basket = this.store.getBasketState() as IBasketState;
      for (const roomCode of basket.Rooms) {
        roomCodes.push(basket.Rooms[roomCode.roomIndex]?.UniqueCode);
      }
      const params = {
        propertyCode: this.store.getUserSettingsState().propertyInfo
          .propertyCode,
        rateCode: this._route.snapshot.queryParams.offerCode,
        roomCode: roomCodes.toString(),
        arrivalDate: CommonUtility.formateDate(basket.GuestSummary.checkindate),
        departureDate: CommonUtility.formateDate(
          basket.GuestSummary.checkoutdate
        ),
      };
      if (!this.validatedAddons.intialLoad) {
        this.guestinfoservice.validateRoomCodes(params).subscribe((data) => {
          this.validRoomCodes = data;
          this.validAddOnsDetails = this.validRoomCodes.data?.validAddOnsDetails;
          this.changeDetector.detectChanges();
        });
      } else {
        this.validRoomCodes = this.validatedAddons;
        this.validAddOnsDetails = this.validRoomCodes.data?.validAddOnsDetails;
        this.validatedAddons.intialLoad = false;
      }
      const basketRoomsIndex = 0;
      this.getAPIData(basketRoomsIndex, params);
      this.initialLoad = false;
    }
  }

  getAPIData(roomIndex, params) {
    const basket = this.store.getBasketState() as IBasketState;
    if (roomIndex <= basket.Rooms.length - 1) {
      params["roomCode"] = basket.Rooms[roomIndex].UniqueCode;
      params["numberOfAdults"] = basket.GuestSummary.guests[roomIndex].adults;
      params["numberOfChildren"] =
        basket.GuestSummary.guests[roomIndex].children;
      params["currency"] = this.store.getBasketState().CurrencyCode;

      this.guestinfoservice.getAlacarteAddons(params).subscribe((data) => {
        this.spinner.start();
        this.Response = data;
        this.isaddonAvailable = !_.isEmpty(this.Response.data);
        let index = 0;
        this.Response.data?.NOT_SPECIFIED?.map((c) => {
          if (
            _.has(frequencyAndBasis, c.priceBasis) ||
            _.has(frequencyAndBasis, c.priceFrequency)
          ) {
            c["basis"] = _.get(frequencyAndBasis, c.priceBasis.toUpperCase());
            c["frequency"] = _.get(
              frequencyAndBasis,
              c.priceFrequency.toUpperCase()
            );
            c["btn_selector"] =
              c.priceBasis.toUpperCase() === "PER_UNIT" ? "toggle" : "select";
            c["index"] = index++;
          }
          if (c.priceBasis.toUpperCase() === "PER_ADULTS_AND_CHILD") {
            delete c["basis"];
            c["base_perAdult"] = frequencyAndBasis.PER_ADULT;
            c["base_perChild"] = frequencyAndBasis.PER_CHILD;
          }
          this.addonsCost.push(c.unitPrice[this.currencyType]);
          this.addonDir.push(c.addOnName);
        });
        basket.Rooms.length - 1 === 0
          ? this.addonInfo.push(this.Response.data?.NOT_SPECIFIED)
          : this.APIResponse.push(this.Response.data?.NOT_SPECIFIED);
        this.changeDetector.detectChanges();
        this.updateAPIRequest(roomIndex);
      });
    }
    if (
      roomIndex === basket.Rooms.length - 1 &&
      basket.Rooms.length - 1 !== 0
    ) {
      this.addonInfo = this.APIResponse;
    }
    setTimeout(() => {
      this.spinner.stop();
      this.setAddonsString();
      if (this.finArr.length > 0) {
        this.store.setAlaCarteAddonsTotal(this.finArr)
      } else {
        this.store.setAlaCarteAddonsTotal({});
      }
    }, 2000);
  }

  updateAPIRequest(val) {
    const basket = this.store.getBasketState() as IBasketState;
    const params = {
      propertyCode: this.store.getUserSettingsState().propertyInfo.propertyCode,
      rateCode: this._route.snapshot.queryParams.offerCode,
      roomCode: "",
      arrivalDate: CommonUtility.formateDate(basket.GuestSummary.checkindate),
      departureDate: CommonUtility.formateDate(
        basket.GuestSummary.checkoutdate
      ),
    };
    this.getAPIData(val + 1, params);
  }

  setAvailAddons() {
    this._basketSubscription = this.store
      .getBasket()
      .subscribe((basketState) => {
        this.reservedAddons = basketState.reservedAddons || undefined;
        this.addonsBasketState = Object.keys(basketState.addonTotalCost).length;
        const basket = this.store.getBasketState() as IBasketState;
        this.currencyType =
          basketState.CurrencyCode === undefined
            ? this.defCurr
            : basketState.CurrencyCode;
        this.currCode = CommonUtility.getCurrSymbolForType(
          this.store.getUserSettingsState().propertyInfo,
          this.currencyType
        );
        let basketStateRooms = false;
        const updatedRoomsArr = [];
        basket.Rooms.forEach((room) => {
          updatedRoomsArr.push(room.RoomCode);
          if (this.initialRoomArr.indexOf(room.RoomCode) === -1) {
            basketStateRooms = true;
          }
        });
        this.guestSummary = basket.GuestSummary;
        if (
          this.checkInSummary === undefined ||
          !this.compareCheckInSummary(
            this.checkInSummary,
            basket.GuestSummary
          ) ||
          basketStateRooms
        ) {
          this.checkInSummary = basketState.GuestSummary;
          this.initialLoad = true;
          this.removeAddons();
          this.commonRoomAddons = [];
          this.addonInfo = [];
          this.RoomsAvail = [];
          this.initialRoomArr = updatedRoomsArr;
          this.checkAvailAddons(this.initialLoad);
        }

        this.checkAvailAddons(this.initialLoad);
        this.addonInfo.forEach((addonList) => {
          const newObj = addonList.filter((val) => {
            return !this.addonInfo[0].find((data) => {
              return val.addOnCode === data.addOnCode;
            });
          });
          this.commonRoomAddons = [...this.addonInfo[0], ...newObj];
        });
        if (!!this.commonRoomAddons && !!this.validAddOnsDetails) {
          this.commonRoomAddons.forEach((roomAddon) => {
            const validCodesObj = [];
            validCodesObj.push(
              _.find(this.validAddOnsDetails, [
                "addOnCode",
                roomAddon.addOnCode,
              ])
            );
            roomAddon.validRoomCodes = validCodesObj[0].validRoomCodes;
            validCodesObj.length = 0;
          });
        }
        if (this.addonInfo.length > 0 && this.commonRoomAddons.length > 0) {
          this.RoomsAvail = [];
          let roomIndex;
          const guests = this.store.getGuestSummary().guests;
          basketState.Rooms.forEach((room) => {
            roomIndex = room.roomIndex;
            const obj = {};
            obj["name"] = room.RoomDetails?.roomType; // Room Name
            obj["code"] = room.RoomCode; // Room Code
            obj["los"] = this.store.getGuestSummary().los; // length of stay/per night
            obj["adult"] = guests[room.roomIndex]?.adults; // No. of Adults
            obj["children"] = guests[room.roomIndex]?.children; // No. of Children
            obj["guests"] =
              guests[room.roomIndex]?.children + guests[room.roomIndex]?.adults;
            obj["alaCarteAddOns"] = { NOT_SPECIFIED: [] };
            this.commonRoomAddons.forEach((elementObj) => {
              if (elementObj.validRoomCodes.includes(room.UniqueCode)) {
                obj["alaCarteAddOns"]["NOT_SPECIFIED"].push({
                  addOnId: elementObj.addOnId,
                  name: elementObj.addOnName,
                  addOnType: "Not Specified", // Not defined in API
                  numberOfUnit: 0, // Initial Value should always be zero
                  preTaxAmount: 0, // Initial Value should always be zero
                  guestCurrencyPreTaxAmount: 0, // Initial Value should always be zero
                  taxAndServices: 0, // Initial Value should always be zero
                  guestCurrencyTaxAndServices: 0, // Initial Value should always be zero
                });
              }
            });
            this.RoomsAvail.push(obj);
            if (this.reservedAddons?.NOT_SPECIFIED !== undefined) {
              this.setReservedAddons(this.RoomsAvail, roomIndex);
            }
          });
        }
        if (
          this.errorFound &&
          this.errorCode === 9002 &&
          this.errorcheck === 0 &&
          basketState.updatedAddons.length > 0
        ) {
          let updatedPrice = 0;
          let updatedTax = 0;
          let i = 0;
          basketState.updatedAddons.forEach((element) => {
            element.forEach((updatedAddon) => {
              const modifiedAddonIndex = _.findIndex(
                this.addonResponse[i].NOT_SPECIFIED,
                { addOnId: updatedAddon.addOnId }
              );
              if (modifiedAddonIndex > -1) {
                this.addonResponse[i].NOT_SPECIFIED[
                  modifiedAddonIndex
                ].guestCurrencyPreTaxAmount =
                  updatedAddon.latestAddOnPrices[this.currencyType] ||
                  updatedAddon.latestAddOnPrices[this.defCurr];
                this.addonResponse[i].NOT_SPECIFIED[
                  modifiedAddonIndex
                ].guestCurrencyTaxAndServices =
                  updatedAddon.latestTaxesAndServices[this.currencyType] ||
                  updatedAddon.latestTaxesAndServices[this.defCurr];
                this.addonResponse[i].NOT_SPECIFIED[
                  modifiedAddonIndex
                ].preTaxAmount = updatedAddon.latestAddOnPrices[this.defCurr];
                this.addonResponse[i].NOT_SPECIFIED[
                  modifiedAddonIndex
                ].taxAndServices =
                  updatedAddon.latestTaxesAndServices[this.defCurr];
              }
            });
            i++;
          });
          this.addonResponse.forEach((elem) => {
            elem.NOT_SPECIFIED.forEach((addon) => {
              updatedPrice +=
                addon.guestCurrencyPreTaxAmount || addon.preTaxAmount || 0;
              updatedTax +=
                addon.guestCurrencyTaxAndServices || addon.taxAndServices || 0;
            });
          });
          this.errorMsg = CommonUtility.fillMessage(
            this.localeObj.tf_99_errorCode_9002,
            [
              this.currCode,
              "",
              this.Total + this.tax,
              updatedPrice + updatedTax,
            ]
          );
          this.errorModal = this.modalService.show(this.errorTemplate, {
            class: "modal-md",
          });
          this.store.removeError(this.errorCode);
          this.store.setAlaCarteAddonsTotal(this.addonResponse);
          this.Total = updatedPrice;
          this.errorcheck++;
        }
      });
  }

  compareCheckInSummary(newSummary: any, oldSummary: any) {
    if (newSummary === undefined) {
      return true;
    }
    if (Number(newSummary.rooms) !== Number(oldSummary.rooms)) {
      return false;
    }
    if (Number(newSummary.guests.length) !== Number(oldSummary.guests.length)) {
      return false;
    }
    if (Number(newSummary.los) !== Number(oldSummary.los)) {
      return false;
    }
    if (+newSummary.checkindate !== +oldSummary.checkindate) {
      return false;
    }
    if (+newSummary.checkoutdate !== +oldSummary.checkoutdate) {
      return false;
    }
    let index = 0;
    let returnVal = true;
    newSummary.guests.forEach((element) => {
      if (
        Number(element.adults) !== Number(oldSummary.guests[index].adults) ||
        Number(element.children) !== Number(oldSummary.guests[index].children)
      ) {
        returnVal = false;
      }
      index++;
    });
    return returnVal;
  }

  openAddonsModal() {
    this.modalRef = this.modalService.show(this.addons, {
      class: "modal-lg addon-modal",
    });
    this.store.setAlaCarteAddonsTotal({});
    setTimeout(() => {
      if (
        !!document.getElementById(
          "Addon-" + this.commonRoomAddons[0].addOnCode
        ) &&
        this.counter === 0
      ) {
        const cardHeight = document.getElementById(
          "Addon-" + this.commonRoomAddons[0].addOnCode
        );
        this.multiRoomCard = cardHeight.offsetHeight + "px";
        if(window.innerWidth < 400) {
          this.multiRoomCard = cardHeight.offsetHeight + 40 + "px";
        }
        this.counter++;
      }
    }, 1000);
    CommonUtility.focusOnModal("ala-carte-addons-modal");
  }

  closeBummerModal() {
    this.modalRef.hide();
  }

  // Func() for Addons with select btn
  selectedAddon(id: number, addon: any, room: any) {
    this.addonADAMessage = this.localeObj.tf_04_Checkout_alaCarteAddons_button_selected + " " + addon.addOnName;
    const elem = document.getElementById(
      "selectedRoom" + id + "-" + addon.addOnCode
    );
    const card = document.getElementById("Addon-" + addon.addOnCode);
    this.RoomsAvail[id].alaCarteAddOns.NOT_SPECIFIED.forEach(
      (selectedAddon) => {
        if (
          addon.addOnId === selectedAddon.addOnId &&
          selectedAddon.numberOfUnit === 0
        ) {
          this.calculateTotal(id, addon, room, "inc");
          elem.innerHTML =
            this.localeObj.tf_04_Checkout_alaCarteAddons_button_selected +
            "| &#10007;";
          elem.className = elem.className + " selected-btn";
          card.className = card.className.includes("selected")
            ? card.className
            : card.className + " selected";
          if (!this.selectedAddons.includes(addon.addOnName)) {
            this.selectedAddons.push(addon.addOnName);
          }
          elem.setAttribute('aria-label', this.addonADAMessage);
        } else if (
          addon.addOnId === selectedAddon.addOnId &&
          selectedAddon.numberOfUnit === 1
        ) {
          this.selectedAddons = this.selectedAddons.filter(
            (item) => item !== addon.addOnName
          );
          this.calculateTotal(id, addon, room, "dec");
          let cardSelected = false;

          this.RoomsAvail.map((data) => {
            data.alaCarteAddOns.NOT_SPECIFIED.forEach((x) => {
              if (addon.addOnId === x.addOnId && x.numberOfUnit === 1) {
                cardSelected = true;
              }
            });
          });

          if (!cardSelected && card.className.includes("selected")) {
            card.className = card.className.trim().replace("selected", "");
          }

          elem.innerHTML = this.localeObj.tf_04_Checkout_alaCarteAddons_button_select;
          elem.className = elem.className.trim().replace("selected-btn", "");
        }
      }
    );
  }

  increment(id: number, value: number, addon: any, room: any) {
    if (addon.maxQuantityBookable > value) {
      this.calculateTotal(id, addon, room, "inc");
      // Adds Addon to the Rooms list and highlights the user selected Addon
      const card = document.getElementById("Addon-" + addon.addOnCode);
      card.className = card.className.includes("selected")
        ? card.className
        : card.className + " selected";
      if (!this.selectedAddons.includes(addon.addOnName)) {
        this.selectedAddons.push(addon.addOnName);
      }
    }
  }

  decrement(id: number, value: number, addon: any, room: any) {
    const card = document.getElementById("Addon-" + addon.addOnCode);
    if (value > 0) {
      this.calculateTotal(id, addon, room, "dec");
      if (value - 1 === 0) {
        this.selectedAddons = this.selectedAddons.filter(
          (item) => item !== addon.addOnName
        );
        let cardSelected = false;
        this.RoomsAvail.map((data) => {
          data.alaCarteAddOns.NOT_SPECIFIED.forEach((x) => {
            if (addon.addOnId === x.addOnId && x.numberOfUnit > 0) {
              cardSelected = true;
            }
          });
        });
        if (!cardSelected) {
          card.className = card.className.trim().replace("selected", "");
        }
      }
    }
  }

  getMessage(message: string, params: string[]) {
    return CommonUtility.fillMessage(message, params);
  }

  /*Addons total & tax calculation*/
  calculateTotal(id, addon: any, room: any, opr: any) {
    const arrIndex = _.findIndex(this.addonInfo[id], {
      addOnId: addon.addOnId,
    });
    const index = _.findIndex(
      this.RoomsAvail[id].alaCarteAddOns.NOT_SPECIFIED,
      { addOnId: addon.addOnId }
    );
    const arr = [
      {
        calcType: "total",
        operand: this.Total,
        unitPrice: this.addonInfo[id][arrIndex].totalPriceWithoutTax[
          this.currencyType
        ],
        perAddonPricing: this.addonInfo[id][arrIndex].totalPriceWithoutTax[
          this.currencyType
        ],
        defCurrUnitPrice: this.addonInfo[id][arrIndex].totalPriceWithoutTax[
          this.defCurr
        ],
        defCurrPAP: this.addonInfo[id][arrIndex].totalPriceWithoutTax[
          this.defCurr
        ],
      },
      {
        calcType: "tax",
        operand: this.tax,
        unitPrice: this.addonInfo[id][arrIndex].taxAndFees[this.currencyType],
        perAddonPricing: this.addonInfo[id][arrIndex].taxAndFees[
          this.currencyType
        ],
        defCurrUnitPrice: this.addonInfo[id][arrIndex].taxAndFees[this.defCurr],
        defCurrPAP: this.addonInfo[id][arrIndex].taxAndFees[this.defCurr],
      },
    ];

    for (const calc of arr) {
      if (opr === "inc") {
        calc.operand += calc.unitPrice;
        if (calc.calcType === "total") {
          this.RoomsAvail[id].alaCarteAddOns.NOT_SPECIFIED[
            index
          ].numberOfUnit += 1;
          this.RoomsAvail[id].alaCarteAddOns.NOT_SPECIFIED[
            index
          ].guestCurrencyPreTaxAmount += calc.unitPrice;
          this.RoomsAvail[id].alaCarteAddOns.NOT_SPECIFIED[
            index
          ].preTaxAmount += calc.defCurrUnitPrice;
        } else {
          this.RoomsAvail[id].alaCarteAddOns.NOT_SPECIFIED[
            index
          ].guestCurrencyTaxAndServices += calc.perAddonPricing;
          this.RoomsAvail[id].alaCarteAddOns.NOT_SPECIFIED[
            index
          ].taxAndServices += calc.defCurrPAP;
        }
      } else {
        calc.operand -= calc.unitPrice;
        if (calc.calcType === "total") {
          this.RoomsAvail[id].alaCarteAddOns.NOT_SPECIFIED[
            index
          ].numberOfUnit -= 1;
          this.RoomsAvail[id].alaCarteAddOns.NOT_SPECIFIED[
            index
          ].guestCurrencyPreTaxAmount -= calc.unitPrice;
          this.RoomsAvail[id].alaCarteAddOns.NOT_SPECIFIED[
            index
          ].preTaxAmount -= calc.defCurrUnitPrice;
        } else {
          this.RoomsAvail[id].alaCarteAddOns.NOT_SPECIFIED[
            index
          ].guestCurrencyTaxAndServices -= calc.perAddonPricing;
          this.RoomsAvail[id].alaCarteAddOns.NOT_SPECIFIED[
            index
          ].taxAndServices -= calc.defCurrPAP;
        }
      }
      calc.calcType === "total"
        ? (this.Total = calc.operand)
        : (this.tax = calc.operand);
    }
    this.changeDetector.detectChanges();
  }

  availabilityCheck(id, code) {
    if (
      !!this.addonInfo[id].find((element) => element.addOnId === code.addOnId)
    ) {
      return true;
    } else {
      return false;
    }
  }

  reselectAddons() {
    this.errorModal.hide();
    this.removeAddons();
    this.commonRoomAddons = [];
    this.addonInfo = [];
    this.RoomsAvail = [];
    this.initialLoad = true;
    this.setAvailAddons();
    CommonUtility.scrollIntoViewId("alaCarteAddOnsDiv");
  }

  proceedWithBummer() {
    if (this.errorCode === 9003) {
      this.reselectAddons();
    } else {
      this.errorModal.hide();
      this.processPayment.emit();
    }
  }

  /* Undo's the user selected addons */
  removeAddons(param?: boolean) {
    if (param) {
      this.store.fetchAlaCarteAddonsTotal(undefined);
    }
    this.Total = 0;
    this.selectedAddons = [];
    this.addonsList = "";
    this.RoomsAvail.forEach((room) => {
      room["alaCarteAddOns"]["NOT_SPECIFIED"].forEach((element) => {
        element.numberOfUnit = 0; // Initial Value should always be zero
        element.preTaxAmount = 0; // Initial Value should always be zero
        element.guestCurrencyPreTaxAmount = 0; // Initial Value should always be zero
        element.taxAndServices = 0; // Initial Value should always be zero
        element.guestCurrencyTaxAndServices = 0; // Initial Value should always be zero
      });
    });
    this.store.setAlaCarteAddonsTotal({});
  }

  /* Formats ala-carte addon msg*/
  setAddonsString() {
    this.baseAddonCost = Math.min(...this.addonsCost);
    this.baseAddon = this.addonDir[
      _.indexOf(this.addonsCost, this.baseAddonCost)
    ];
    this.baseAddonCost = this.pricePipe.transform(this.baseAddonCost, '1.0-2', this.currencyType);
    this.addonsText = this.getMessage(this.localeObj.tf_04_Checkout_alaCarteAddons_description, [this.baseAddon, this.currCode, this.baseAddonCost]);
  }

  setReservedAddons(param, roomIndex) {
    if (this.reservedAddons?.NOT_SPECIFIED.length > 0) {
      this.finArr = [];
      let updatedObj = { NOT_SPECIFIED: [] };
      param[roomIndex].alaCarteAddOns.NOT_SPECIFIED.forEach(element => {
        const reff = _.findIndex(this.reservedAddons.NOT_SPECIFIED, { 'addOnId': element.addOnId });
        const arrReff = _.findIndex(this.addonInfo[roomIndex], { 'addOnId': element.addOnId });
        if (reff > -1) {
          if (!this.selectedAddons.includes(element.name)) {
            this.selectedAddons.push(element.name);
            let noOfUnits = this.reservedAddons.NOT_SPECIFIED[reff].numberOfUnit || 1;
            let elem = {
              numberOfUnit: this.reservedAddons.NOT_SPECIFIED[reff].numberOfUnit,
              preTaxAmount: this.addonInfo[roomIndex][arrReff].totalPriceWithoutTax[this.defCurr] * noOfUnits,
              guestCurrencyPreTaxAmount: (this.addonInfo[roomIndex][arrReff].totalPriceWithoutTax[this.currencyType] || this.addonInfo[roomIndex][arrReff].totalPriceWithoutTax[this.defCurr]) * noOfUnits,
              taxAndServices: this.addonInfo[roomIndex][arrReff].taxAndFees[this.defCurr] * noOfUnits,
              guestCurrencyTaxAndServices: (this.addonInfo[roomIndex][arrReff].taxAndFees[this.currencyType] || this.addonInfo[roomIndex][arrReff].taxAndFees[this.defCurr]) * noOfUnits,
              addOnId: element.addOnId,
              addOnType: "Not Specified",
              name: element.name,
            }
            this.Total += (this.addonInfo[roomIndex][arrReff].totalPriceWithoutTax[this.currencyType]) * noOfUnits;
            updatedObj.NOT_SPECIFIED.push(elem);
          }
        }
      });
      if (Object.keys(updatedObj.NOT_SPECIFIED).length > 0) {
        this.finArr.push(updatedObj);
      }
      this.addonsList = this.selectedAddons.length > 0 ?
        this.selectedAddons.join(", ").replace(/,(?!.*,)/gim, " and") : '';
    }
  }
}
