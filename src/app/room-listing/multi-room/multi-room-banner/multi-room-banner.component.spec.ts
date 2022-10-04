import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { MultiRoomBannerComponent } from "./multi-room-banner.component";

describe("RoomListingComponent", () => {
  let component: MultiRoomBannerComponent;
  let fixture: ComponentFixture<MultiRoomBannerComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [MultiRoomBannerComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MultiRoomBannerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
