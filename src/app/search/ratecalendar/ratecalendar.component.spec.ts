import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { RatecalendarComponent } from "./ratecalendar.component";

describe("RatecalendarComponent", () => {
  let component: RatecalendarComponent;
  let fixture: ComponentFixture<RatecalendarComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [RatecalendarComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RatecalendarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
