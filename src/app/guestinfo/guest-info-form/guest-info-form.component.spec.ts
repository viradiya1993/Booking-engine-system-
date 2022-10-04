import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { GuestInfoFormComponent } from "./guest-info-form.component";

describe("GuestInfoFormComponent", () => {
  let component: GuestInfoFormComponent;
  let fixture: ComponentFixture<GuestInfoFormComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [GuestInfoFormComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GuestInfoFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
