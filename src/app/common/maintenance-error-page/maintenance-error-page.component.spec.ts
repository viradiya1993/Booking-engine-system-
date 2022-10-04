import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { MaintenanceErrorPageComponent } from "./maintenance-error-page.component";

describe("GenericErrorPageComponent", () => {
  let component: MaintenanceErrorPageComponent;
  let fixture: ComponentFixture<MaintenanceErrorPageComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [MaintenanceErrorPageComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MaintenanceErrorPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
