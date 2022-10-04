import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { AvailableUpgradesAddonsComponent } from "./available-upgrades-addons.component";

describe("AvailableUpgradesAddonsComponent", () => {
  let component: AvailableUpgradesAddonsComponent;
  let fixture: ComponentFixture<AvailableUpgradesAddonsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [AvailableUpgradesAddonsComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AvailableUpgradesAddonsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
