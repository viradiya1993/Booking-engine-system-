import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { RatePlanDetailsComponent } from "./rate-plan-details.component";

describe("RatePlanDetailsComponent", () => {
  let component: RatePlanDetailsComponent;
  let fixture: ComponentFixture<RatePlanDetailsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [RatePlanDetailsComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RatePlanDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
