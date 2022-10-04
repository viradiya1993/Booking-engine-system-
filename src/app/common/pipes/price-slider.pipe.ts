import { Pipe, PipeTransform } from '@angular/core';
import * as _ from 'lodash';

@Pipe({
  name: 'priceSlider'
})
export class PriceSliderPipe implements PipeTransform {

  transform(value: any, currencyType: string, range:any[]): unknown {
    if (!value || value.length === 0 || !range || range.length === 0) {
      return value;
    }
    const roomList = _.cloneDeep(value);
    return roomList.filter(list => _.inRange(
      (list.discountedAveragePriceByCurrency[currencyType]  ||
      list.averagePriceByCurrency[currencyType] || 
      list.totalPriceByCurrency[currencyType]), (range[0]-1 || 0) , range[1]+1));
  }
}
