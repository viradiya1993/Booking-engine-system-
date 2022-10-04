import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { PackagelistingComponent } from "./packagelisting.component";

describe("PackagelistingComponent", () => {
  let component: PackagelistingComponent;
  let fixture: ComponentFixture<PackagelistingComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [PackagelistingComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PackagelistingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
