import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { ManageBookingVerificationComponent } from "./manage-booking-verification.component";

describe("ManageBookingVerificationComponent", () => {
  let component: ManageBookingVerificationComponent;
  let fixture: ComponentFixture<ManageBookingVerificationComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ManageBookingVerificationComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ManageBookingVerificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
