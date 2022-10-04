import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { AlipayRedirectComponent } from "./alipay-redirect.component";

describe("AlipayRedirectComponent", () => {
  let component: AlipayRedirectComponent;
  let fixture: ComponentFixture<AlipayRedirectComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [AlipayRedirectComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AlipayRedirectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
