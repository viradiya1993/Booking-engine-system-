import { Component, Input, OnInit } from "@angular/core";
import { Router, RouterEvent } from "@angular/router";
import { URL_PATHS } from "../common.constants";
import { StoreService } from "../services/store.service";

@Component({
  selector: "app-footer",
  templateUrl: "./footer.component.html",
  styleUrls: ["./footer.component.scss"],
})
export class FooterComponent implements OnInit {
  confirmationPage = false;
  @Input("localeObj") localeObj: any;
  constructor(private router: Router) {}

  ngOnInit() {
    this.router.events.subscribe((event: RouterEvent) => {
      this.confirmationPage = false;
      // if (event.url === '/' + URL_PATHS.CONFIRMATION_PAGE) {
      //   // Hide loading indicator
      //   this.confirmationPage = true;
      // }
    });
  }
}
