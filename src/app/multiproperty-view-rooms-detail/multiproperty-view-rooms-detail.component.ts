import {
  Component,
  ElementRef,
  Input,
  OnInit,
  TemplateRef,
  ViewChild,
} from "@angular/core";
import { BsModalService } from "ngx-bootstrap/modal";
import { BsModalRef } from "ngx-bootstrap/modal/bs-modal-ref.service";
import { CommonUtility } from "../common/common.utility";
import { StoreService } from "../common/services/store.service";
import { FeatureFlags } from "src/app/common/feature.flags";

@Component({
  selector: "app-multiproperty-view-rooms-detail",
  templateUrl: "./multiproperty-view-rooms-detail.component.html",
  styleUrls: ["./multiproperty-view-rooms-detail.component.scss"],
})
export class MultipropertyViewRoomsDetailComponent implements OnInit {
  public hotelInfo: boolean;
  public gallery: boolean;
  public isImageSelected: boolean;
  // public slideConfig: any;
  public modalRef: BsModalRef;
  public deviceType: string;
  public selectedImage: any;
  public hotelFeatures = true;
  public selectedImageIndex: any;
  prevSlide:any;
  activeSlide : number;
  public hotel = {
    name: "",
    latitude: 0, // Global Co-ordinate
    longitude: 0, // Global Co-ordinate
    address: "",
    email: "",
    website: "",
    rating: 0, // In absence of rating no stars will be shown
    lead_photo: {
      large: "",
    },
    zip_code: "",
    phone_number: "",
    hotel_amenities: [],
    common_room_amenities: [],
  };
  image_info: any[] = [];
  @ViewChild("lightboxmodel", { static: true }) dialogBox: ElementRef;
  public _userSettingsSubscriptions: any;
  localeObj: any;
  propertyInfo: any;
  splitStar: any;
  RTL_Flag: boolean = false;

  slideConfig = {
    autoplay: false,
    dots: false,
    enabled: true,
    focusOnSelect: true,
    infinite: true,
    nextArrow: "<div id='next-arrow' class='nav-btn next-slide'></div>",
    prevArrow: "<div id='prev-arrow' class='nav-btn prev-slide'></div>",
    initialSlide: 0,
    slidesToShow: 4,
    slidesToScroll: 1,
    method: {},
  };

  slideConfig1 = {
    slidesToShow: 1,
    slidesToScroll: 1,
    dots: false,
  };
  public displayStarRating: boolean = false;

  constructor(
    public modalService: BsModalService,
    public store: StoreService
  ) {}

  ngOnInit() {
    this.hotelInfo = true;
    this.gallery = false;
    // this.slideConfig = { slidesToShow: 4, slidesToScroll: 1 };
    this.isImageSelected = true;
    this._userSettingsSubscriptions = this.store
      .getUserSettings()
      .subscribe((sharedData) => {
        this.RTL_Flag = CommonUtility.langAlignCheck(sharedData.langObj.code, FeatureFlags);
        this.localeObj = sharedData.localeObj;
        this.propertyInfo = sharedData.propertyInfo;
        console.log(this.propertyInfo);
        this.deviceType = sharedData.deviceType;
        this.hotel.name = this.propertyInfo.propertyName;
        this.hotel.latitude = +this.propertyInfo.latitude || 0;
        this.hotel.longitude = +this.propertyInfo.longitude || 0;
        this.hotel.address = [
          this.propertyInfo.address,
          this.propertyInfo.city,
          this.propertyInfo.stateName,
          this.propertyInfo.country,
          this.propertyInfo.zip,
        ].filter(Boolean).join(', ');
        this.hotel.email = this.propertyInfo.primaryEmail;
        this.hotel.website = this.propertyInfo.websiteURL;
        this.hotel.rating = Math.trunc(this.propertyInfo.starRating);
        this.splitStar =
          Number(
            (this.propertyInfo.starRating - this.hotel.rating).toFixed(1)
          ) *
            100 +
          "%";
        this.hotel.zip_code = this.propertyInfo.zip;
        this.hotel.phone_number = this.propertyInfo.phone;
        this.hotel.hotel_amenities = [];
        this.propertyInfo.hotelAmenities?.forEach((element) => {
          this.hotel.hotel_amenities.push(element.name);
        });
        this.hotel.common_room_amenities = [];
        this.propertyInfo.commonRoomAmenities?.forEach((element) => {
          this.hotel.common_room_amenities.push(element.name);
        });
        this.image_info = this.propertyInfo.hotelImagesList;
        this.selectedImage = this.image_info ? this.image_info[0] : "";
        console.log(this.image_info);
        this.hotel.lead_photo = {
          large: this.image_info
            ? this.image_info[0]?.propertyImageURL
            : this.propertyInfo.portalLogoUrl,
        };
        this.displayStarRating =
          sharedData.propertyInfo.displayStarRating || false;
      });
  }

  public openHotelDetailsModal() { 
    this.hotelInfo = false;
    this.gallery = true;
    this.hotelFeatures = false;
    this.modalRef = this.modalService.show(
      this.dialogBox,
      Object.assign({}, { class: "modal-md details-modal" })
    );
    CommonUtility.focusOnModal('hotel-details-modal');
    this.resetInitialValues();
    return false;
  }

  resetInitialValues() {
     setTimeout(() => {
      this.hotelInfo = true;
      this.gallery = false;
      this.hotelFeatures = true;
      }, 250);
  }

  public closeFilter() {
    this.modalRef.hide();
  }

  public viewDetails(viewType) {
    if (viewType === "hotelInfo") {
      this.hotelInfo = true;
      this.gallery = false;
    } else {
      this.hotelInfo = false;
      this.gallery = true;
      setTimeout(() => {
        if(this.image_info.length > 4) {
        const leftArrow  = document.getElementsByClassName("slick-prev slick-arrow")[0];
        leftArrow.className = leftArrow + ' d-none';
        const rightArrow  = document.getElementsByClassName("slick-next slick-arrow")[0];
        rightArrow.className = rightArrow + ' d-none';
        }
      },250);
    }
  }

  imageSelected(img, id) {
    let clickedImage = img.thumbnailImageURL;
    this.appendOpacity(id);
    this.activeSlide = id;
    this.prevSlide = id - 1;
    this.selectedImageIndex = true;
    this.isImageSelected = true;
    const selectedItem = this.image_info.find(
      (v, id, o) => v.thumbnailImageURL === clickedImage
    );
   this.selectedImage = selectedItem;
}

appendOpacity(currentSlide) {
  this.image_info.forEach((img, id) => {
    if (id === currentSlide) {
      img.imageOpacity = 0.4;
    }
    else {
      img.imageOpacity = 1;
    }
  })
}

  public threeSixtyImageSelected(imageObj: any) {
    this.selectedImage = imageObj;
    this.isImageSelected = false;
  }

  slickInit() {
    // this.appendOpacity(0);
    console.log("slick initialized");
    setTimeout(() => {
      if ($(".panel-group .panel:nth-child(2) .panel-collapse")) {
        $(".panel-group .panel:nth-child(2) .panel-collapse").attr(
          "style",
          "display: none!important"
        );
      }
    }, 100);
  }

  afterChange(e) {
    if (e.currentSlide != 0) {
      this.prevSlide = e.currentSlide - 1;
    }
    if (e.currentSlide === 0) {
      this.prevSlide = this.image_info.length - 1;
    }
    this.selectedImageIndex = false;
    this.activeSlide = e.currentSlide;
    this.appendOpacity(this.activeSlide);
    const currentSlide = e.slick.$slides.get(e.currentSlide).firstChild
      .currentSrc;
    this.activeSlide = e.currentSlide;
    const selectedItem = this.image_info.find(
      (v, id, o) => v.thumbnailImageURL === currentSlide
    );
    this.selectedImage = selectedItem;
    this.selectedImage = this.image_info[this.activeSlide];
  }
  
  beforeChange(e) {
    this.prevSlide = e.currentSlide;
  }
}
