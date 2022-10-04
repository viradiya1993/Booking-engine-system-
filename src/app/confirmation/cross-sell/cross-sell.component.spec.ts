import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { CrossSellComponent } from "./cross-sell.component";

describe("CrossSellComponent", () => {
  let component: CrossSellComponent;
  let fixture: ComponentFixture<CrossSellComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [CrossSellComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CrossSellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
