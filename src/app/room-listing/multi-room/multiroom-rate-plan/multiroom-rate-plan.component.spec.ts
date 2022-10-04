import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";
import { MultiroomRatePlanComponent } from "./multiroom-rate-plan.component";

describe("MultiroomRatePlanComponent", () => {
  let component: MultiroomRatePlanComponent;
  let fixture: ComponentFixture<MultiroomRatePlanComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [MultiroomRatePlanComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MultiroomRatePlanComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
