import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { RatePlansComponent } from "./rate-plans.component";

describe("RatePlansComponent", () => {
  let component: RatePlansComponent;
  let fixture: ComponentFixture<RatePlansComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [RatePlansComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RatePlansComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
