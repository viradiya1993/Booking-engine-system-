import { Component, OnInit } from "@angular/core";
import { SPINNER_TYPES } from "ngx-ui-loader";

@Component({
  selector: "app-mbs-spinner",
  templateUrl: "./mbs-spinner.component.html",
  styleUrls: ["./mbs-spinner.component.scss"],
})
export class MbsSpinnerComponent implements OnInit {
  spinnerType: any;
  constructor() {}

  ngOnInit() {
    this.spinnerType = SPINNER_TYPES.ballSpinClockwiseFadeRotating;
  }
}
