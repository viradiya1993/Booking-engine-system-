import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { PreferencesLightboxComponent } from "./preferences-lightbox.component";

describe("PreferencesLightboxComponent", () => {
  let component: PreferencesLightboxComponent;
  let fixture: ComponentFixture<PreferencesLightboxComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [PreferencesLightboxComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PreferencesLightboxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
