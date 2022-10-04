import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { RoomListingComponent } from "./room-listing-page.component";

describe("RoomListingComponent", () => {
  let component: RoomListingComponent;
  let fixture: ComponentFixture<RoomListingComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [RoomListingComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RoomListingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
