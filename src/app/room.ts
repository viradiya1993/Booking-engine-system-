export class AvailableRooms {
  status: Status;
  data: RoomsData;
}

export class Status {
  success: boolean;
  statusCode: number;
  resultMessage: string;
}

export class RoomsData {
  roomtypes: string[];
  roomviews: string[];
  availableRooms: Room[];
  lowestRoomPriceByCurrency: object;
}
export class Room {
  code: string;
  name: string;
  shortDescription: string;
  maxAdultOccupancy: number;
  maxChildOccupancy: number;
  maxTotalOccupancy: number;
  roomType: string;
  roomView: string;
  bedTypes: any[];
  averagePriceByCurrency: object;
  discountedAveragePriceByCurrency: object;
  thumbnailImageUrl: string;
  largeImageUrl: string;
  amenities?: RoomAmenitiesEntity[] | null;
  avgPriceWithAddOn: number;
  discountedAvgPriceWithAddOn: number;
  totalPriceByCurrency: object;
  totalDiscountedPriceByCurrency: object;
}

export class RoomAmenitiesEntity {
  // code: number;
  name: string;
  // desc: string;
  thumbnailImageUrl: string;
  // icon: string;
}
