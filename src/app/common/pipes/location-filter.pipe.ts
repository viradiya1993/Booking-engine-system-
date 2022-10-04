import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: "locationFilter",
})
export class LocationFilterPipe implements PipeTransform {
  transform(value: any[], filterLocation: any, filterRating: any): any[] {
    if (!value) {
      return [];
    }
    if (
      filterLocation !== undefined &&
      !(filterLocation.currVal === filterLocation.defVal)
    ) {
      filterLocation.currVal = filterLocation.currVal;
      value = value.filter((hotel) =>
        hotel.areaName.includes(filterLocation.currVal)
      );
    }
    return this.filterByRating(value, filterRating);
  }

  filterByRating(value: any[], filterRating: any): any[] {
    if (
      filterRating !== undefined &&
      !(filterRating.currVal === filterRating.defVal)
    ) {
      filterRating.currVal = parseInt(filterRating.currVal);
      value = value.filter(
        (hotel) => hotel.hotelRating === filterRating.currVal
      );
    }
    return value;
  }
}
