import { Directive, HostListener } from "@angular/core";

@Directive({
  selector: "[appSkipKeyStrokes]",
})
export class SkipKeyStrokesDirective {
  constructor() {}

  @HostListener("keydown", ["$event"])
  skipKeyStroke(event) {
    if (event.keyCode !== 9) {
      event.preventDefault();
    }
  }
}
