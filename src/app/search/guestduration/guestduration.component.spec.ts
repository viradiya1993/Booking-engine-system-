import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { GuestdurationComponent } from "./guestduration.component";

describe("GuestdurationComponent", () => {
  let component: GuestdurationComponent;
  let fixture: ComponentFixture<GuestdurationComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [GuestdurationComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GuestdurationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
