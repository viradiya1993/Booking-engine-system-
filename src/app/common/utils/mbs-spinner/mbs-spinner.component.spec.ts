import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { MbsSpinnerComponent } from "./mbs-spinner.component";

describe("MbsSpinnerComponent", () => {
  let component: MbsSpinnerComponent;
  let fixture: ComponentFixture<MbsSpinnerComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [MbsSpinnerComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MbsSpinnerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
