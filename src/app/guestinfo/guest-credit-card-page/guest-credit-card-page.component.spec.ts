import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { GuestCreditCardPageComponent } from "./guest-credit-card-page.component";

describe("GuestCreditCardInfoComponent", () => {
  let component: GuestCreditCardPageComponent;
  let fixture: ComponentFixture<GuestCreditCardPageComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [GuestCreditCardPageComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GuestCreditCardPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
