import { Status } from "../../room";
export class RoomsBooked {
  status: Status;
  data: RoomBookingData[];
}

export class RoomBookingData {
  roomCode: string;
  totalBooked: number;
  timeSpan: string;
}
