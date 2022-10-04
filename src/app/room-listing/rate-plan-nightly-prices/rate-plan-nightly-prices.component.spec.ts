import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { RatePlanNightlyPricesComponent } from "./rate-plan-nightly-prices.component";

describe("RatePlanNightlyPricesComponent", () => {
  let component: RatePlanNightlyPricesComponent;
  let fixture: ComponentFixture<RatePlanNightlyPricesComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [RatePlanNightlyPricesComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RatePlanNightlyPricesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
