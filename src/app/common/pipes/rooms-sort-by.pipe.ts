import { Pipe, PipeTransform } from "@angular/core";
import { Room } from "../../room";
@Pipe({
  name: "roomsSortBy",
})
export class RoomsSortByPipe implements PipeTransform {
  transform(value: any, currencyType: string, isAsc: boolean): any {
    if (!value || value.length === 0) {
      return value;
    }

    return value.sort((r1: Room, r2: Room) => {
      if (isAsc) {
        return (
          (r1.discountedAveragePriceByCurrency[currencyType] ||
            r1.averagePriceByCurrency[currencyType]) -
          (r2.discountedAveragePriceByCurrency[currencyType] ||
            r2.averagePriceByCurrency[currencyType])
        );
      } else {
        return (
          (r2.discountedAveragePriceByCurrency[currencyType] ||
            r2.averagePriceByCurrency[currencyType]) -
          (r1.discountedAveragePriceByCurrency[currencyType] ||
            r1.averagePriceByCurrency[currencyType])
        );
      }
    });
  }
}
