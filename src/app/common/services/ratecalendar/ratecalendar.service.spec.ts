import { inject, TestBed } from "@angular/core/testing";
import { RatecalendarService } from "./ratecalendar.service";

describe("RatecalandarService", () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RatecalendarService],
    });
  });

  it("should be created", inject(
    [RatecalendarService],
    (service: RatecalendarService) => {
      expect(service).toBeTruthy();
    }
  ));
});
