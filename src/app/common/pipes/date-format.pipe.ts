import { DatePipe } from "@angular/common";
import { Pipe, PipeTransform } from "@angular/core";
import { PIPE_COSTANTS } from "../common.constants";

@Pipe({
  name: "dateFormat",
})
export class DateFormatPipe extends DatePipe implements PipeTransform {
  transform(value: any, fomrat?: string, args?: any): any {
    return super.transform(value, fomrat || PIPE_COSTANTS["YYYY-MM-DD"]);
  }
}
