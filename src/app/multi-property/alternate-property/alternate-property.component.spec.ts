import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { AlternatePropertyComponent } from "./alternate-property.component";

describe("AlternatePropertyComponent", () => {
  let component: AlternatePropertyComponent;
  let fixture: ComponentFixture<AlternatePropertyComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [AlternatePropertyComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AlternatePropertyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
