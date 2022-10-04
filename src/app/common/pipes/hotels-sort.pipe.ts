import { Pipe, PipeTransform } from "@angular/core";
import { StoreService } from "../services/store.service";

@Pipe({
  name: "hotelsSort",
})
export class HotelsSortPipe implements PipeTransform {
  constructor(private _storeSvc: StoreService) {}

  transform(value: any, currencyType: string, isAsc: boolean): any {
    if (!value || value.length === 0) {
      return value;
    }
    const availableHotels = value.filter((hotel) => hotel.available);
    const unavailableHotels = value.filter((hotel) => !hotel.available);
    const result = availableHotels.sort((r1: any, r2: any) => {
      if (isAsc) {
        return (
          r1.lead_off_price[currencyType] - r2.lead_off_price[currencyType]
        );
      } else {
        return (
          r2.lead_off_price[currencyType] - r1.lead_off_price[currencyType]
        );
      }
    });
    this._storeSvc.updatedHotelList([...result, ...unavailableHotels]);
    return [...result, ...unavailableHotels];
  }
}
