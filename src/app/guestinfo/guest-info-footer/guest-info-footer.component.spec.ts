import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { GuestInfoFooterComponent } from "./guest-info-footer.component";

describe("GuestInfoFooterComponent", () => {
  let component: GuestInfoFooterComponent;
  let fixture: ComponentFixture<GuestInfoFooterComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [GuestInfoFooterComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GuestInfoFooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
