import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { CreditGuestWidgetComponent } from "./credit-guest-widget.component";

describe("CreditGuestWidgetComponent", () => {
  let component: CreditGuestWidgetComponent;
  let fixture: ComponentFixture<CreditGuestWidgetComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [CreditGuestWidgetComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreditGuestWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
