import {
  AfterViewChecked,
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  QueryList,
  TemplateRef,
  ViewChild,
  ViewChildren,
} from "@angular/core";
import { Router } from "@angular/router";
import { ActivatedRoute } from "@angular/router";
import * as _ from "lodash";
import { BsModalService } from "ngx-bootstrap";
import { BsModalRef } from "ngx-bootstrap/modal/bs-modal-ref.service";
import { Observable, Subscription } from "rxjs";
import { FeatureFlags } from "src/app/common/feature.flags";
import {
  checkErrorCodesList,
  error_code_prefix,
  QUERY_PARAM_ATTRIBUTES,
  URL_PATHS,
} from "../../common/common.constants";
import { CommonUtility } from "../../common/common.utility";
import { RoomListingService } from "../../common/services/roomListing.Service";
import { StoreService } from "../../common/services/store.service";
import { NO_ROOMS_FOUND } from "../../common/Validation.Msg";
import { NO_ROOMS_FILTERS_FOUND } from "../../common/Validation.Msg";
import { Room } from "../../room";
import { CheckinSummary } from "../../search/guestduration/checkinsummary.type";
import { RatePlansComponent } from "../rate-plans/rate-plans.component";
import { RoomsBooked } from "./rooms-booked-updates";

@Component({
  selector: "app-rooms",
  templateUrl: "./rooms.component.html",
  styleUrls: ["./rooms.component.scss"],
})
export class RoomsComponent
  implements OnInit, OnDestroy, AfterViewInit, AfterViewChecked {
  unselectedroom: boolean;
  roomcode: string;
  rooms: Observable<Room>;
  roomViewFilterValue: any;
  roomTypeFilterValue: any;
  sortOrder: boolean;
  range: any[];
  currencyType: string;
  showRoomDetails = false;
  selectedRoomUniqueCode: string;
  selectedRoomCode: string;
  noRoomFoundErrMsg = NO_ROOMS_FOUND;
  noRoomFitlersFoundErrMsg = NO_ROOMS_FILTERS_FOUND;
  roomupdates: RoomsBooked;
  avgPrice: number;
  filteredChanged: boolean;
  discountedPrice: number;
  currCode: string;
  roomSpecifications: string;
  isMultiRooms: boolean;
  @Input("roomBookingOrder") roomBookingOrder: any[];
  showClose = false;
  lastExpandedRoomDetail: RatePlansComponent;
  roomsNotAvailable = false;
  roomCodesList: any;
  roomExpanded: boolean;
  roomExpandedCode: string;
  roomExpandedUniqueCode: string;
  roomExpandedRateCode: string;
  scrollRoom: boolean;
  allMultiRoomsSelected: boolean;
  localeObj: any;
  popUpErrorFound: boolean;
  popUpErrorMsg: string;
  popUpErrorCode: number;
  errorFound: boolean;
  errorMsg: string;
  errorCode: number;
  highlightSearch: boolean;
  noOfMaxAmenities: number;
  showRoomDescriptionOnListing: boolean;
  RTL_Flag: boolean;
  isDpr4 = false;
  isDpr5 = false;
  isDpr6 = false;
  propertyType: string;
  showAverageNightlyRate = true;
  @Input("isParamsValid") isParamsValid: boolean;
  @Input("roomsList") roomsList: Room[];
  @Input("checkinsummary") checkinsummary: CheckinSummary;
  @Input("rateCode") rateCode: string;
  @Output() checkInSummaryChanged = new EventEmitter<CheckinSummary>();
  @Output() roomSelected = new EventEmitter<Room>();
  @Output() roomUnSelected = new EventEmitter<Room>();
  @Output() multiRoomBook = new EventEmitter();
  @ViewChildren("roomDetail") roomDetailDivs: QueryList<RatePlansComponent>;
  private modalRef: BsModalRef;
  private _userSettingsSubscriptions: Subscription;
  private errorHandlerSubscription: Subscription;
  private roomsListSubscription: Subscription;
  private basketSubscription: Subscription;
  private routerSubscription: Subscription;
  @ViewChild("template", { static: true }) errorTemplate: TemplateRef<any>;
  selectedRoomArray: any[] = [];

  constructor(
    private roomListingService: RoomListingService,
    private _storeSvc: StoreService,
    private _router: Router,
    private modalService: BsModalService,
    private _route: ActivatedRoute
  ) {}

  private _roomSubscription: Subscription;

  ngOnDestroy() {
    if (this.modalRef !== undefined) {
      this.modalRef.hide();
      this.modalRef = undefined;
    }
    const subscriptionsList = [
      this._roomSubscription,
      this._userSettingsSubscriptions,
      this.errorHandlerSubscription,
      this.roomsListSubscription,
      this.routerSubscription,
    ];
    CommonUtility.removeSubscriptions(subscriptionsList);
  }

  ngOnInit() {
    this.allMultiRoomsSelected = false;
    this.selectedRoomUniqueCode = "";
    this.selectedRoomCode = "";
    this.filteredChanged = false;
    this.roomExpanded = false;
    this.roomExpandedCode = "";
    this.roomExpandedUniqueCode = "";
    this.roomExpandedRateCode = "";
    this.scrollRoom = false;
    this.modalRef = undefined;
    this.popUpErrorFound = false;
    this.popUpErrorMsg = "";
    this.popUpErrorCode = 0;
    this.errorFound = false;
    this.errorMsg = "";
    this.errorCode = 0;
    this.highlightSearch = false;
    this.noOfMaxAmenities = 0;

    CommonUtility.setDatalayer({
      // Empty error state in data layer, in case of pre existing error
      error_type: "",
      error_code: "",
      error_description: "",
    });

    this._userSettingsSubscriptions = this._storeSvc
      .getUserSettings()
      .subscribe((sharedData) => {
        this.propertyType = _.get(sharedData.propertyInfo, "propertyType") || '';
        this.noOfMaxAmenities = _.get(
          sharedData.propertyInfo,
          "noOfMaxAmenities"
        );
        this.showRoomDescriptionOnListing = _.get(
          sharedData.propertyInfo,
          "showRoomDescriptionOnListing"
        );
        this.localeObj = sharedData.localeObj;
        this.noRoomFitlersFoundErrMsg = _.get(
          this.localeObj,
          "tf_99_errorCode_4000"
        );
        if (this.errorFound) {
          switch (this.errorCode) {
            case 4000:
              this.errorMsg = _.get(
                this.localeObj,
                error_code_prefix + this.errorCode
              );
              break;
            case 6001:
              this.errorMsg = _.get(
                this.localeObj,
                error_code_prefix + this.errorCode
              );
              break;
            case 1001:
              this.errorMsg = _.get(
                this.localeObj,
                error_code_prefix + this.errorCode
              );
              break;
            default:
              break;
          }
          CommonUtility.setDatalayer({
            error_type: "red-error",
            error_code: this.errorCode,
            error_description: this.errorMsg,
          });
        }
        if (this.popUpErrorFound) {
          switch (this.popUpErrorCode) {
            case 3000:
              this.errorMsg = _.get(
                this.localeObj,
                error_code_prefix + this.popUpErrorCode
              );
              break;
            case 3001:
              this.errorMsg = _.get(
                this.localeObj,
                error_code_prefix + this.popUpErrorCode
              );
              break;
            case 8000:
              this.errorMsg = _.get(
                this.localeObj,
                error_code_prefix + this.popUpErrorCode
              );
              break;
            case 9000:
              this.errorMsg = _.get(
                this.localeObj,
                error_code_prefix + this.popUpErrorCode
              );
              break;
            case 3013:
              this.errorMsg = _.get(
                this.localeObj,
                error_code_prefix + this.popUpErrorCode
              );
              break;
            default:
              break;
          }
          CommonUtility.setDatalayer({
            error_type: "bummer",
            error_code: this.popUpErrorCode,
            error_description: this.errorMsg,
          });
        }
        this.showAverageNightlyRate = _.get(
          sharedData.propertyInfo,
          "showAverageNightlyRate"
        );
        
        this.RTL_Flag = CommonUtility.langAlignCheck(this._storeSvc.getUserSettingsState().langObj.code, FeatureFlags);
      });

    this.errorHandlerSubscription = this._storeSvc
      .getErrorHandler()
      .subscribe((errorHandler) => {
        this.errorFound = false;
        this.roomsNotAvailable = false;
        this.errorMsg = "";
        this.popUpErrorCode = 0;
        this.popUpErrorFound = false;
        // this.popUpErrorMsg = '';
        if (
          errorHandler.error["4000"] !== undefined &&
          errorHandler.error["4000"] === true
        ) {
          this.errorCode = 4000;
          this.errorFound = true;
          this.roomsNotAvailable = true;
          CommonUtility.highlightStep("search");
          this.highlightSearch = true;
          if (this.localeObj) {
            this.errorMsg = _.get(
              this.localeObj,
              error_code_prefix + this.errorCode
            );
          }
          this.roomsList = [];
          CommonUtility.setDatalayer({
            error_type: "red-error",
            error_code: this.errorCode,
            error_description: this.errorMsg,
          });
        } else {
          for (
            let index = 0;
            index < checkErrorCodesList.RoomListingErrorCodes.length;
            index++
          ) {
            const code = checkErrorCodesList.RoomListingErrorCodes[index];
            if (_.get(errorHandler.error, code) === true) {
              this.errorCode = code;
              this.errorFound = true;
              if (this.localeObj) {
                this.errorMsg = _.get(this.localeObj, error_code_prefix + code);
              }
              CommonUtility.setDatalayer({
                error_type: "bummer",
                error_code: this.popUpErrorCode,
                error_description: this.errorMsg,
              });
              break;
            }
          }
          if (!this.errorFound) {
            for (
              let index = 0;
              index < checkErrorCodesList.InventoryUnavailableErrorCodes.length;
              index++
            ) {
              const code =
                checkErrorCodesList.InventoryUnavailableErrorCodes[index];
              if (_.get(errorHandler.error, code) === true) {
                this.popUpErrorCode = code;
                // this.errorFound = true;
                if (this.localeObj) {
                  this.popUpErrorMsg = _.get(
                    this.localeObj,
                    error_code_prefix + code
                  );
                }
                this.openModal(this.errorTemplate);
                CommonUtility.focusOnModal('room-availability-error-modal');
                CommonUtility.setDatalayer({
                  error_type: "bummer",
                  error_code: this.popUpErrorCode,
                  error_description: this.popUpErrorMsg,
                });
                break;
              }
            }
          }
        }
        // Bummer modal for access code in promo flow
        const promoBummer = this._storeSvc.getBasketState().bummerObj;
        if (
          !!promoBummer.accessCodeBummer &&
          promoBummer.prevRoute === "/" + URL_PATHS.GUEST_INFO_PAGE &&
          promoBummer.displayBummer === true
        ) {
          this.popUpErrorMsg = this._storeSvc.getBasketState().bummerObj.accessCodeBummer;
          this.openModal(this.errorTemplate);
          CommonUtility.focusOnModal('room-availability-error-modal');
          CommonUtility.setDatalayer({
            error_type: "bummer",
            error_code: "",
            error_description: this.popUpErrorMsg,
          });
        }

        if (this.errorFound === true) {
          const ele = document.getElementsByName("ErrDiv");
          if (ele !== undefined && ele !== null && ele.length > 0) {
            ele[0].scrollIntoView({
              behavior: "smooth",
              block: "start",
              inline: "nearest",
            });
          }
        }
      });

    if (!this.isParamsValid) {
      this._storeSvc.setError(4000);
      this.roomsNotAvailable = true;
      setTimeout(() => {
        let ele = document.getElementsByName("RoomsNotAvailableDiv");
        if (ele === null) {
          ele = document.getElementsByName("ErrDiv");
        }
        if (ele !== undefined && ele !== null && ele.length > 0) {
          ele[0].scrollIntoView({
            behavior: "smooth",
            block: "start",
            inline: "nearest",
          });
        }
        if(this.errorMsg !=='') {
          setTimeout(()=> {
            document.getElementById("red-error").focus();
          },100);
        }
        CommonUtility.setDatalayer({
          error_type: "bummer",
          error_code: 4000,
          error_description: _.get(this.localeObj, "tf_99_errorCode_4000"),
        });
      });
    } else {
      this.roomsNotAvailable = false;
    }
    this.roomsListSubscription = this._roomSubscription = this.roomListingService.rooms.subscribe(
      (data) => {
        if (data && _.get(data, "status.statusCode") !== 1000) {
          this._storeSvc.setError(data.status.statusCode);
        }
        if (!data.status.success) {
          this.roomsNotAvailable = true;
          this.closeErrorPopUp();
          this._storeSvc.removeError(3013);
          setTimeout(() => {
            let ele = document.getElementsByName("RoomsNotAvailableDiv");
            if (ele === null) {
              ele = document.getElementsByName("ErrDiv");
            }
            if (ele !== undefined && ele !== null && ele.length > 0) {
              ele[0].scrollIntoView({
                behavior: "smooth",
                block: "start",
                inline: "nearest",
              });
            }
            if(this.errorMsg !=='') {
              setTimeout(()=> {
                document.getElementById("red-error").focus();
              },100);
            }
          });
        }
        if (data.status.success) {
          this._storeSvc.removeError(4000);
          if (this.highlightSearch) {
            CommonUtility.highlightStep("select-room");
            this.highlightSearch = false;
          }
          if (_.size(_.get(data, "data.availableRooms")) > 0) {
            this.roomsNotAvailable = false;
            if (this.selectedRoomUniqueCode !== "" && this.showClose) {
              this.roomExpanded = true;
              this.roomExpandedUniqueCode = this.selectedRoomUniqueCode;
              this.roomExpandedCode = "";
              this.roomExpandedRateCode = "";
            } else if (this.scrollRoom) {
              this.roomExpanded = true;
            } else {
              this.roomExpandedCode = "";
              this.roomExpandedUniqueCode = "";
              this.roomExpandedRateCode = "";
              this.roomExpanded = false;
            }
            if (this.isMultiRooms && !this.scrollRoom) {
              this.roomExpanded = false;
            } else if (
              this.isMultiRooms &&
              this.scrollRoom &&
              !this.allMultiRoomsSelected
            ) {
              this.roomExpanded = true;
            } else if (this.isMultiRooms && this.allMultiRoomsSelected) {
              this.roomExpanded = false;
            }
            CommonUtility.highlightStep("select-room");
          } else {
            this._storeSvc.setError(4000);
            this.closeErrorPopUp();
            this.roomsNotAvailable = true;
            setTimeout(() => {
              let ele = document.getElementsByName("RoomsNotAvailableDiv");
              if (ele === null) {
                ele = document.getElementsByName("ErrDiv");
              }
              if (ele !== undefined && ele !== null && ele.length > 0) {
                ele[0].scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                  inline: "nearest",
                });
              }
              if(this.errorMsg !=='') {
                setTimeout(()=> {
                  document.getElementById("red-error").focus();
                },100);
              }
            });
            const userSettingsState = this._storeSvc.getUserSettingsState();
            const languageObject = _.get(userSettingsState, "langObj");
            const rateCode = "";
            this._storeSvc.updateOfferCode(rateCode);
            const params = CommonUtility.getSearchPageQueryParams(
              rateCode,
              languageObject
            );
            const newParams = {};
            _.forEach(params, (v, k) => {
              newParams[k] = v;
            });
            newParams["errorCode"] = 4000;
            const navigationExtras = {
              queryParams: newParams,
            };
            this._router.navigate(
              ["/" + URL_PATHS.SEARCH_PAGE],
              navigationExtras
            );
          }
          if (!(this.isMultiRooms && this.allMultiRoomsSelected)) {
            this.hideAll();
          }
          CommonUtility.scrollIntoViewName("Container", { block: "start" });
        }
      }
    );

    this.basketSubscription = this._storeSvc.getBasket().subscribe((basket) => {
      if (basket.RoomView !== this.roomViewFilterValue) {
        this.roomViewFilterValue = basket.RoomView;
        this.showClose = false;
        this.filteredChanged = true;
      }
      if (
        basket.RoomType !== undefined &&
        this.roomTypeFilterValue !== basket.RoomType
      ) {
        this.roomTypeFilterValue = basket.RoomType;
        this.showClose = false;
        this.filteredChanged = true;
      }
      if (
        basket.SortOrder !== undefined &&
        this.sortOrder !== basket.SortOrder
      ) {
        this.showClose = false;
        this.filteredChanged = true;
      }
      // if (basket.CurrencyCode !== undefined && this.currencyType !== basket.CurrencyCode) {
      //   this.showClose = false;
      //   this.filteredChanged = true;
      // }
      this.sortOrder =
        basket.SortOrder === undefined || basket.SortOrder ? true : false;
      this.range = !basket.range || basket.range.length === 0 ? [] : basket.range;
      if (this.filteredChanged) {
        this.hideAll();
        this.filteredChanged = false;
      }
      if (Number(basket.GuestSummary.rooms) > 1) {
        this.isMultiRooms = true;
        if (basket.RoomBookingOrder.length === 0 && basket.Rooms.length !== 0) {
          this.allMultiRoomsSelected = true;
          this.hideAll();
          this.unselectedroom = true;
          this.roomcode = "";
        } else {
          this.allMultiRoomsSelected = false;
          this.unselectedroom = false;
        }
      } else {
        this.isMultiRooms = false;
      }
      if (this.isMultiRooms && !this.scrollRoom) {
        this.roomExpanded = false;
      } else if (
        this.isMultiRooms &&
        this.scrollRoom &&
        !this.allMultiRoomsSelected
      ) {
        this.roomExpanded = true;
      } else if (this.isMultiRooms && this.allMultiRoomsSelected) {
        this.roomExpanded = false;
      }
      this.currencyType =
        basket.CurrencyCode === undefined ? "SGD" : basket.CurrencyCode;
      this.currCode = CommonUtility.getCurrSymbolForType(
        this._storeSvc.getUserSettingsState().propertyInfo,
        this.currencyType
      );
    });
    this.roomListingService.getRoomBookedUpdates();

    // DPR based on feature flag
    if (FeatureFlags.isFeatureEnabled("dpr4")) {
      this.isDpr4 = true;
    } else if (FeatureFlags.isFeatureEnabled("dpr5")) {
      this.isDpr5 = true;
    } else if (FeatureFlags.isFeatureEnabled("dpr5")) {
      this.isDpr6 = true;
    }
  }

  ngAfterViewInit(): void {
    this.routerSubscription = this._route.fragment.subscribe((value) => {
      if (value !== undefined && value !== null && value !== "") {
        this.scrollRoom = true;
        const roomCodes = value.split(",");
        this.roomExpandedRateCode = roomCodes[roomCodes.length - 1];
        this.roomExpandedUniqueCode = roomCodes[0];
        let index = 0;
        roomCodes.forEach((code) => {
          if (index !== 0 && index !== roomCodes.length - 1) {
            this.roomExpandedUniqueCode =
              this.roomExpandedUniqueCode + "," + code;
          }
          index++;
        });
      }
    });

    this.routerSubscription = this._route.queryParams.subscribe((params) => {
      if (!!params["room_selections"] && params["room_selections"] !== "") {
        const roomCodes = params["room_selections"].split(",");
        if (roomCodes && roomCodes.length === 1) {
          this.roomExpandedUniqueCode = roomCodes[0];
          this.scrollRoom = true;
        }
      }
    });
  }

  ngAfterViewChecked() {
    if (this.roomExpanded) {
      let roomAvailable = false;
      _.forEach(this.roomsList, (rooms) => {
        const roomCodesList = _.split(rooms.code, ",");
        roomCodesList.forEach((code) => {
          if (code === this.roomExpandedUniqueCode) {
            this.roomExpandedCode = rooms.code;
            roomAvailable = true;
          }
        });
      });
      if (this.roomsList !== undefined) {
        if (roomAvailable) {
          this.scrollAndExpand(
            this.roomExpandedCode,
            this.roomExpandedUniqueCode
          );
        } else {
          this._storeSvc.setError(3000);
        }
      }
      this.roomExpanded = false;
      this.scrollRoom = false;
    }
  }

  openModal(template: TemplateRef<any>) {
    if (this.modalRef === undefined) {
      this.modalRef = this.modalService.show(template, { class: "modal-md" });
    } else {
      return;
    }
    // if (this.modalRef !== undefined) {
    //   this.modalRef.hide();
    //   this.modalRef = undefined;
    // }
    // this.modalRef = this.modalService.show(template, { class: 'modal-md' });
  }

  closeErrorPopUp() {
    if (this.modalRef !== undefined) {
      this.modalRef.hide();
    }
    // this.modalRef = undefined;
    // const bummerObj = {
    //   accessCodeBummer: "",
    //   prevRoute: location.pathname,
    //   displayBummer: false,
    // };
    // this._storeSvc.updatePromoBummer(bummerObj);
    this._storeSvc.removeError(this.popUpErrorCode);
    this.popUpErrorMsg = "";
  }

  scrollAndExpand(roomCode: string, uniqueRoomCode: string) {
    const el1 = document.getElementsByName(roomCode);
    if (el1 !== undefined && el1 !== null && el1.length > 0) {
      el1[0].scrollIntoView({
        behavior: "smooth",
        block: "start",
        inline: "nearest",
      });
      let room: Room;
      let el2: any;
      this.roomsList.forEach((child) => {
        if (child.code === roomCode) {
          room = child;
        }
      });
      if (this.roomDetailDivs !== undefined) {
        this.roomDetailDivs.forEach((child) => {
          if (room.code === child.selectedRoom.code) {
            el2 = child;
          }
        });
      }
      if (
        room !== undefined &&
        room !== null &&
        el2 !== undefined &&
        el2 !== null
      ) {
        if (
          this.roomExpandedRateCode ||
          (!this.roomExpandedRateCode && uniqueRoomCode)
        ) {
          this.selectedRoomArray = [room, el2, this.roomExpandedRateCode, uniqueRoomCode];
          this.selectRoom(room, el2, this.roomExpandedRateCode, uniqueRoomCode);
        } else {
          this.selectRoom(room, el2);
        }
        this.roomExpandedRateCode = "";
      } else {
        this._storeSvc.setError(3000);
      }
    } else {
      this._storeSvc.setError(3000);
    }
  }

  onCheckInSummaryChanged(eventData: any) {
    const guestSummary = CommonUtility.getGuestSummaryFromEventData(eventData);
    let errorStatusCode;
    if (!guestSummary.restrictionFailed) {
      this._storeSvc.updateGuestDuration(guestSummary);
      // this.roomListingService.getAvailableRoomsDataWithParams(guestSummary);
    } else {
      this._storeSvc.setError(4000);
      errorStatusCode = 4000;
    }
    const offerCode = this._storeSvc.getBasketState().offerCode;
    const params = CommonUtility.getQueryParamObjGuestSummary(
      guestSummary,
      this._storeSvc,
      offerCode,
      errorStatusCode
    );
    const navigationExtras = {
      queryParams: params,
    };
    this._router
      .navigate(["/" + URL_PATHS.ROOMS_PAGE], navigationExtras)
      .then((d) => CommonUtility.highlightStep("select-room"));
  }

  getAvgRoomPrice(room: any) {
    return this._storeSvc.getAvgRoomPrice(room, this.currencyType);
  }

  getDiscountedRoomPrice(room: any) {
    return this._storeSvc.getDiscountedRoomPrice(room, this.currencyType);
  }

  getRoomData(room: Room) {
    this.roomupdates = this.roomListingService.getRoomBookedUpdatesForRoomCode(
      room.code
    );
    this.roomSpecifications = this.roomListingService.getRoomSpec(
      room,
      this.localeObj
    );

    this.avgPrice = this.getAvgRoomPrice(room);
    this.discountedPrice = this.getDiscountedRoomPrice(room);
    const lowestAddOnPrice = _.get(room, [
      "lowestUnitAddOnPrice",
      this.currencyType,
    ]);
    const guestSummary = this._storeSvc.getBasketState().GuestSummary;
    let guests = 1;
    if (Number(guestSummary.rooms) > 1 && this.roomBookingOrder.length > 0) {
      guests =
        Number(guestSummary.guests[this.roomBookingOrder[0]].adults) +
        Number(guestSummary.guests[this.roomBookingOrder[0]].children);
    } else if (
      Number(guestSummary.rooms) > 1 &&
      this.roomBookingOrder.length === 0
    ) {
      const roomNo = Number(guestSummary.rooms) - 1;
      guests =
        Number(guestSummary.guests[roomNo].adults) +
        Number(guestSummary.guests[roomNo].children);
    } else {
      guests =
        Number(guestSummary.guests[0].adults) +
        Number(guestSummary.guests[0].children);
    }
    // if (lowestAddOnPrice) {
    //   this.avgPrice = (this.avgPrice) + (lowestAddOnPrice * guests / (Number(guestSummary.los)));
    //   if (this.discountedPrice && !isNaN(this.discountedPrice) && this.discountedPrice > 0) {
    //     this.discountedPrice = (this.discountedPrice) + (lowestAddOnPrice * guests / (Number(guestSummary.los)));
    //   }
    // }
    room.avgPriceWithAddOn = this.avgPrice;
    room.discountedAvgPriceWithAddOn = this.discountedPrice;
    if (this.roomupdates !== undefined && this.roomupdates !== null) {
      return true;
    }
    return false;
  }

  multiRoomBooked() {
    this.multiRoomBook.emit();
    if (this.roomBookingOrder.length === 0) {
      this.hideAll();
      this.unselectedroom = true;
      this.roomcode = "";
    }
  }

  replaceFunc(roomCode: string) {
    return roomCode;
  }

  selectRoom(
    room: Room,
    roomDetailDiv: any,
    ratePlanCode?: string,
    uniqueRoomCode?: string
  ) {
    this.selectedRoomArray = [room,roomDetailDiv];
    if (this.lastExpandedRoomDetail !== undefined) {
      this.lastExpandedRoomDetail.hide();
    }
    this.lastExpandedRoomDetail = roomDetailDiv as RatePlansComponent;

    this.selectedRoomCode = room.code;
    this.unselectedroom = true;
    // this.hideAllFirst(room, room.code);
    // this.hideAll();
    this.roomcode = room.code;
    if (uniqueRoomCode) {
      roomDetailDiv.show(room, ratePlanCode, uniqueRoomCode);
    } else {
      roomDetailDiv.show(room);
    }
    // this.hide();
    this.showClose = true;
    this.roomSelected.emit(room);
    // const el1 = document.querySelector('.' + room.code);
    // if (el1 !== undefined && el1 !== null) {
    //   el1.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest'});
    // }

    // const attrName = this.scrollByRoomCode(room.code);
    // CommonUtility.scrollIntoViewName(attrName);
    CommonUtility.scrollIntoViewName('Room'+room.code.replace(/[\W_]/g, "T"));
    return false;
  }

  unselectRoom(room: Room, roomDetailDiv: any) {
    this.selectedRoomArray = [];
    this.roomcode = "";
    this.selectedRoomUniqueCode = "";
    this.selectedRoomCode = "";
    this.unselectedroom = false;
    this.showClose = false;

    roomDetailDiv.hide();
    this.lastExpandedRoomDetail = undefined;
    
    this.roomUnSelected.emit(room);
    return false;
  }

  hideAllFirst(selectedRoom: Room, roomcode: string) {
    this.roomcode = roomcode;
    this.unselectedroom = true;
  }

  hideAll() {
    this.selectedRoomUniqueCode = "";
    this.selectedRoomCode = "";
    this.roomcode = undefined;
    if (this.roomDetailDivs !== undefined) {
      this.roomDetailDivs.forEach((child) => {
        child.hide();
      });
    }
    this.unselectedroom = false;
  }

  show(room: Room, roomDetailDiv: any) {
    this.selectedRoomCode = "";
    this.selectedRoomUniqueCode = "";
    roomDetailDiv.hide();
    this.unselectedroom = false;
    this.showClose = false;
    this.roomUnSelected.emit(room);
    return false;
  }

  reset() {
    this.showClose = false;
  }

  hide() {
    this.showClose = true;
    return false;
  }

  getMessage(message: string, params: string[]) {
    return CommonUtility.fillMessage(message, params);
  }

  setSelectedRoomUniqueCode(eventData: any) {
    const selectedRoomBedTypes = _.get(eventData, "selectedRoom.bedTypes");
    const selectedBedTypeCode = _.get(eventData, "bedTypeCode");
    if (selectedRoomBedTypes && selectedRoomBedTypes.length > 0) {
      selectedRoomBedTypes.forEach((bedType) => {
        if (bedType.bedTypeCode === selectedBedTypeCode) {
          this.selectedRoomUniqueCode = _.get(bedType, "roomCode");
        }
      });
    }
  }

  scrollByRoomCode(code) {
    return 'Room'+code.replace(/[\W_]/g, "T");
  }
}
