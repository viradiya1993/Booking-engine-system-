import { Pipe, PipeTransform } from "@angular/core";
@Pipe({
  name: "filterRoomsByView",
})
export class RoomsFilters implements PipeTransform {
  transform(value: any[], filterView: any, filterType: any): any[] {
    if (!value) {
      return [];
    }

    if (
      filterView !== undefined &&
      !(filterView.currVal === filterView.defVal)
    ) {
      filterView.currVal = filterView.currVal.toLowerCase();
      value = value.filter((room) =>
        room.roomView.toLowerCase().includes(filterView.currVal)
      );
    }
    return this.filterByRoomType(value, filterType);
  }

  filterByRoomType(value: any[], filterRoomType: any): any[] {
    if (
      filterRoomType !== undefined &&
      !(filterRoomType.currVal === filterRoomType.defVal)
    ) {
      filterRoomType.currVal = filterRoomType.currVal.toLowerCase();
      value = value.filter((room) =>
        room.roomType
          ? room.roomType.toLowerCase().includes(filterRoomType.currVal)
          : ""
      );
    }
    return value;
  }
}
