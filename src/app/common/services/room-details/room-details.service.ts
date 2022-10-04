import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { SESSION_URL_CONST } from "../../../common/urls.constants";
import { HttpWrapperService } from "../http-wrapper.service";

@Injectable({
  providedIn: "root",
})
export class RoomDetailsService {
  constructor(private _authHttp: HttpWrapperService) {}

  public getRoomDetails(roomCode: any): Observable<any> {
    SESSION_URL_CONST.GET_ROOMS_DETAILS_BY_ROOM_CODE.path_suffix = roomCode
      ? roomCode
      : 1;
    return this._authHttp.get(SESSION_URL_CONST.GET_ROOMS_DETAILS_BY_ROOM_CODE);
  }
}
