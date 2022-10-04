import { Pipe, PipeTransform } from "@angular/core";
import { noOfAmenitiesToDisplay } from "../common.constants";

@Pipe({
  name: "roomAmenitiesFilter",
})
export class RoomAmenitiesFilterPipe implements PipeTransform {
  transform(value: any, args?: any): any {
    if (!value) {
      return [];
    }
    if (args && args > 0) {
      if (value.length <= args) {
        return value;
      } else {
        const filterValue = value.slice(0, args);
        return filterValue;
      }
    } else {
      return value;
    }
  }
}
