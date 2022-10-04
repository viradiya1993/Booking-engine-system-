import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { CancelBookingConfirmationComponent } from "./cancel-booking-confirmation.component";

describe("GenericErrorPageComponent", () => {
  let component: CancelBookingConfirmationComponent;
  let fixture: ComponentFixture<CancelBookingConfirmationComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [CancelBookingConfirmationComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CancelBookingConfirmationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
