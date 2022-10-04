import { Pipe, PipeTransform } from "@angular/core";
import { AlaCarteAddon } from "../../alacarte-addons";
@Pipe({
  name: "addonFilter",
})
export class AddonFilterPipe implements PipeTransform {
  transform(value: any, currencyType: string, isAsc: boolean): any {
    if (!value || value.length === 0) {
      return value;
    }

    return value.sort((addon1: AlaCarteAddon, addon2: AlaCarteAddon) => {
      if (isAsc) {
        return (
          (addon1.basePrice[currencyType] || addon1.unitPrice[currencyType]) -
          (addon2.basePrice[currencyType] || addon2.unitPrice[currencyType])
        );
      } else {
        return (
          (addon2.basePrice[currencyType] || addon2.unitPrice[currencyType]) -
          (addon1.basePrice[currencyType] || addon1.unitPrice[currencyType])
        );
      }
    });
  }
}
