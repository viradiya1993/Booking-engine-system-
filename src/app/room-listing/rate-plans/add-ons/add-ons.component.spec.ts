import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { AddOnsComponent } from "./add-ons.component";

describe("AddOnsComponent", () => {
  let component: AddOnsComponent;
  let fixture: ComponentFixture<AddOnsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [AddOnsComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddOnsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
