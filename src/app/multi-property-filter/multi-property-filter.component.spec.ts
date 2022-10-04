import { ComponentFixture, TestBed } from "@angular/core/testing";

import { MultiPropertyFilterComponent } from "./multi-property-filter.component";

describe("MultiPropertyFilterComponent", () => {
  let component: MultiPropertyFilterComponent;
  let fixture: ComponentFixture<MultiPropertyFilterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MultiPropertyFilterComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MultiPropertyFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
