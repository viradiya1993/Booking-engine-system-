import { Injectable } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import * as _ from "lodash";
import { Subject } from "rxjs";
import { AnyFn } from "../../../../node_modules/@ngrx/store/src/selector";
import { URL_PATHS } from "../../common/common.constants";
import {
  META_SEARCH_PARAMS,
  QUERY_PARAM_ATTRIBUTES,
} from "../../common/common.constants";
import { CommonUtility } from "../../common/common.utility";
import { SESSION_URL_CONST } from "../../common/urls.constants";
import { AvailableRooms, Room } from "../../room";
import {
  RoomBookingData,
  RoomsBooked,
} from "../../room-listing/rooms/rooms-booked-updates";
import { CheckinSummary } from "../../search/guestduration/checkinsummary.type";
import { StoreService } from "../services/store.service";
import { HttpWrapperService } from "./http-wrapper.service";

@Injectable()
export class RoomListingService {
  private availableRooms = new Subject<AvailableRooms>();
  rooms = this.availableRooms.asObservable();

  private roomsBooked = new Subject<RoomsBooked>();
  private roomBookingUpdates = this.roomsBooked.asObservable();
  private roomCodeVsBookedDataMap = new Map();

  private roomViews: string[];
  private roomTypes: string[];
  private lowestPriceSubj = new Subject<AvailableRooms>();
  lowestPriceObj = this.lowestPriceSubj.asObservable();

  constructor(
    private _authHttp: HttpWrapperService,
    private router: ActivatedRoute,
    private storeSrv: StoreService
  ) {}

  public getAvailableRoomsData(): any {
    return this._authHttp.get(SESSION_URL_CONST.GET_AVAILABLE_ROOMS);
  }

  public getAvailableRoomsDataWithParams(
    guestSummary: CheckinSummary,
    offerCode: string,
    roomNo?: number,
    isMultiRoom?: boolean
  ): any {
    // Make use of values coming in guest Summary
    const rno = roomNo || 0;
    const params = {
      arrivalDate: CommonUtility.formateDate(guestSummary.checkindate),
      departureDate: CommonUtility.formateDate(guestSummary.checkoutdate),
      numberOfAdults: guestSummary.guests[rno].adults,
      numberOfChildren: guestSummary.guests[rno].children,
      currency: this.storeSrv.getBasketState().CurrencyCode
    };
    const iataNumber = _.get(
      this.storeSrv.getUserSettingsState(),
      "iata.iataNumber"
    );
    if (iataNumber) {
      params["iataNumber"] = iataNumber;
    }
    if (offerCode !== "" && offerCode !== undefined) {
      params[QUERY_PARAM_ATTRIBUTES.OFFERCODE] = offerCode;
    }
    const accessCode =
      !this.router.snapshot.queryParams.accessCode &&
      this.storeSrv.getBasketState().promoData.priorAccessCode
        ? this.router.snapshot.queryParams.accessCode
        : this.storeSrv.getBasketState().promoData.accessCode;
    if (accessCode && !iataNumber) {
      params[QUERY_PARAM_ATTRIBUTES.ACCESS_CODE] = accessCode;
    }

    const isPromoFlow = this.storeSrv.getBasketState().isPromoFlow;
    const isSpecialsFlow = this.storeSrv.getBasketState().isSpecialsFlow;
    const promoData = _.get(this.storeSrv.getBasketState(), "promoData");
    if (isPromoFlow || (isSpecialsFlow && !iataNumber && iataNumber !== "")) {
      params[QUERY_PARAM_ATTRIBUTES.ACCESS_CODE] = promoData.accessCode;
      params[QUERY_PARAM_ATTRIBUTES.OFFERCODE] = promoData.offerCode;
    }

    if (
      isSpecialsFlow &&
      this.storeSrv.getBasketState().isSelectedRatePlanAvailable !== "" &&
      !this.storeSrv.getBasketState().isSelectedRatePlanAvailable &&
      location.pathname === "/" + URL_PATHS.ROOMS_PAGE
    ) {
      params[QUERY_PARAM_ATTRIBUTES.OFFERCODE] = "";
      delete params[QUERY_PARAM_ATTRIBUTES.IS_SPECIAL_RATE];
    }

    if (
      location.pathname === "/" + URL_PATHS.ROOMS_PAGE &&
      accessCode &&
      this.storeSrv.getBasketState().isCompoundAccessCode
    ) {
      // Don't pass the offerCode to availability api in accesscode edit flow on stepper click
      params[QUERY_PARAM_ATTRIBUTES.OFFERCODE] = "";
    }

    const routeParams = this.router.snapshot.queryParams;
    META_SEARCH_PARAMS.filter((item) => {
      if (routeParams.hasOwnProperty(item) && !!routeParams[item]) {
        params[item] = routeParams[item];
      }
    });
    params[QUERY_PARAM_ATTRIBUTES.PROPETY_CODE] = routeParams.propertyCode;
    const promise = this._authHttp.get(
      SESSION_URL_CONST.GET_AVAILABLE_ROOMS,
      params
    );
    const propertyType =
      _.get(
        this.storeSrv.getUserSettingsState(),
        "propertyInfo.propertyType"
      ) === "UD";
    promise.subscribe((data) => {
      if (!isMultiRoom || propertyType) {
        this.availableRooms.next(data);
      } else if (isMultiRoom && !propertyType) {
        this.overBookCheck(data);
      }
    });
    return promise;
  }

  public getRoomSpec(room: Room, localObj?: any): string {
    let spec = "";
    if (!room.bedTypes) {
      return "";
    }
    if (room.bedTypes.length === 1) {
      if (localObj !== undefined) {
        spec = CommonUtility.fillMessage(
          localObj.tf_2_RoomList_rooms_availableBedType,
          [room.bedTypes[0].bedTypeName]
        );
      } else {
        spec = "Only available with " + room.bedTypes[0].bedTypeName;
      }
    } else {
      for (let index = 0; index < room.bedTypes.length; index++) {
        if (index === 0) {
          spec = room.bedTypes[index].bedTypeName;
        } else if (index !== room.bedTypes.length - 1) {
          spec = spec + ", " + room.bedTypes[index].bedTypeName;
        } else {
          if (localObj !== undefined) {
            spec =
              spec +
              " & " +
              room.bedTypes[index].bedTypeName +
              " " +
              localObj.tf_2_RoomList_roomSummery_available;
          } else {
            spec =
              spec + " & " + room.bedTypes[index].bedTypeName + " available";
          }
        }
      }
    }
    return spec;
  }

  public getRoomBookedUpdates(): any {
    const routeParams = this.router.snapshot.queryParams;
    const params = {
      propertyCode : routeParams.propertyCode
    }
    const promise = this._authHttp.get(SESSION_URL_CONST.ROOMS_BOOKED, params);
    promise.subscribe((data) => {
      this.roomsBooked.next(data);
      const roomsList = data.data.roomBooked;
      this.updateRoomsBookedMap(roomsList);
    });
    return promise;
  }

  private updateRoomsBookedMap(roomsList: RoomBookingData[]): void {
    roomsList.forEach((element) => {
      this.roomCodeVsBookedDataMap.set(element.roomCode, element);
    });
  }

  getRoomBookedUpdatesForRoomCode(roomCode: string): any {
    if (this.roomCodeVsBookedDataMap.size !== 0) {
      const codes = roomCode.split(",");
      // const res = {};
      let resFound = false;
      let totalCount = 0;
      let timeSpan = "";
      _.forEach(codes, (code) => {
        const obj = this.roomCodeVsBookedDataMap.get(code);
        if (!_.isEmpty(obj)) {
          totalCount += obj["totalBooked"];
          timeSpan = obj["timeSpan"];
          resFound = true;
        }
      });
      if (resFound) {
        const res = {};
        res["roomCode"] = roomCode;
        res["timeSpan"] = timeSpan;
        res["totalBooked"] = totalCount;
        return res;
      }
      return undefined;
    }
  }

  isUpgradeAvailable(selectedRoomDetails: any): any {
    return null;
    // if (this.roomCodeVsBookedDataMap.size !== 0) {
    //     return this.roomCodeVsBookedDataMap.get(roomCode);
    // }
  }

  upgradeRoom(selectedRoomDetails: any, upgradeToRoom: string): any {
    return null;
    // if (this.roomCodeVsBookedDataMap.size !== 0) {
    //     return this.roomCodeVsBookedDataMap.get(roomCode);
    // }
  }

  // method to check inventory in the multi room booking
  // overBookingCheck(rooms, roomType, BedType, operation) {
  //   if (sessionStorage.getItem('savedMultiRooms') !== null) {
  //     rooms.data.availableRooms = JSON.parse(sessionStorage.getItem('savedMultiRooms'));
  //   }
  //   rooms.data.availableRooms.forEach( room => {
  //     if (room.name === roomType) {
  //       room.bedTypes.forEach( bedType => {
  //         if (bedType.bedTypeCode === BedType) {
  //           if (operation === 'add') {
  //             bedType.availableRooms --;
  //           } else {
  //             bedType.availableRooms ++;
  //           }
  //         }
  //       });
  //   }
  //   });
  //   sessionStorage.setItem('savedMultiRooms', JSON.stringify(rooms.data.availableRooms));
  //   rooms.data.availableRooms.forEach( room => {
  //     room.bedTypes = room.bedTypes.filter(bedtype => bedtype.availableRooms > 0);
  //   });
  //   rooms.data.availableRooms = rooms.data.availableRooms.filter(x => x.bedTypes.find(y => y.availableRooms > 0));
  //   rooms.data.availableRooms.forEach( room => {
  //     if (room.bedTypes.length === 1) {
  //       room.defaultBedType = room.bedTypes[0].bedTypeCode;
  //     }
  //   });
  //   sessionStorage.setItem('availableMultiRooms', JSON.stringify(rooms.data.availableRooms));
  //   this.availableRooms.next(rooms);
  // }

  // method to check inventory in the multi room booking
  public overBookCheck(rooms) {
    const selectedRooms = JSON.parse(sessionStorage.getItem("savedRooms"));
    if (
      rooms.data &&
      rooms.data.availableRooms &&
      rooms.data.availableRooms.length > 0 &&
      selectedRooms &&
      selectedRooms.length > 0
    ) {
      selectedRooms.forEach((selectedRoom) => {
        rooms.data.availableRooms.forEach((room) => {
          if (room.name === selectedRoom.roomType) {
            room.bedTypes.forEach((bedType) => {
              if (bedType.bedTypeCode === selectedRoom.bedType) {
                bedType.availableRooms--;
              }
            });
          }
        });
      });
      rooms.data.availableRooms.forEach((room) => {
        room.bedTypes = room.bedTypes.filter(
          (bedtype) => bedtype.availableRooms > 0
        );
      });
      rooms.data.availableRooms = rooms.data.availableRooms.filter((x) =>
        x.bedTypes.find((y) => y.availableRooms > 0)
      );
      rooms.data.availableRooms.forEach((room) => {
        if (room.bedTypes.length === 1) {
          room.defaultBedType = room.bedTypes[0].bedTypeCode;
        }
      });
    }
    this.availableRooms.next(rooms);
  }
  getRoomFilterAttribute() {
    const routeParams = this.router.snapshot.queryParams;
    const params = {
      portalSubdomain: CommonUtility.getSubdomain(),
      propertyCode: routeParams.propertyCode,
      rand: Math.floor(Math.random() * 1000000),
    };
    return this._authHttp.get(SESSION_URL_CONST.FILTER_ROOM_ATTRIBUTES, params);
  }
}
