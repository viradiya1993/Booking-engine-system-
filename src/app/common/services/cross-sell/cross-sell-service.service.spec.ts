import { inject, TestBed } from "@angular/core/testing";

import { CrossSellServiceService } from "./cross-sell-service.service";

describe("CrossSellServiceService", () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CrossSellServiceService],
    });
  });

  it("should be created", inject(
    [CrossSellServiceService],
    (service: CrossSellServiceService) => {
      expect(service).toBeTruthy();
    }
  ));
});
