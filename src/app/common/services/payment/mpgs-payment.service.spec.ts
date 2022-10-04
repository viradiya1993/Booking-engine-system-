import { inject, TestBed } from "@angular/core/testing";

import { MpgsPaymentService } from "./mpgs-payment.service";

describe("MpgsPaymentService", () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MpgsPaymentService],
    });
  });

  it("should be created", inject(
    [MpgsPaymentService],
    (service: MpgsPaymentService) => {
      expect(service).toBeTruthy();
    }
  ));
});
