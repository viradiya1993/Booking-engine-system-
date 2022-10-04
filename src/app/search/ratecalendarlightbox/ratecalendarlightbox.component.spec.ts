import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { RatecalendarlightboxComponent } from "./ratecalendarlightbox.component";

describe("RatecalendarlightboxComponent", () => {
  let component: RatecalendarlightboxComponent;
  let fixture: ComponentFixture<RatecalendarlightboxComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [RatecalendarlightboxComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RatecalendarlightboxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
