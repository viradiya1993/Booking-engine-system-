import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { PaymentFailureComponent } from "./payment-failure.component";

describe("PaymentFailureComponent", () => {
  let component: PaymentFailureComponent;
  let fixture: ComponentFixture<PaymentFailureComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [PaymentFailureComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PaymentFailureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
