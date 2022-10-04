import {
  Component,
  Input,
  OnDestroy,
  OnInit,
  TemplateRef
} from "@angular/core";
import * as _ from "lodash";
import { BsModalService } from "ngx-bootstrap/modal";
import { BsModalRef } from "ngx-bootstrap/modal/bs-modal-ref.service";
import { Subscription } from "rxjs";
import { CommonUtility } from "../../common/common.utility";
import { RoomDetailsService } from "../../common/services/room-details/room-details.service";
import { StoreService } from "../../common/services/store.service";
import { RoomDetail } from "./roomdetails";

@Component({
  selector: "app-room-details",
  templateUrl: "./room-details.component.html",
  styleUrls: ["./room-details.component.scss"],
})
export class RoomDetailsComponent implements OnInit, OnDestroy {
  lightboxData: RoomDetail;
  isThreeSixtyDegreeView: boolean;
  isImageSelected: boolean;
  categoriesToShow: string[];
  selectedImage: any;
  modalRef: BsModalRef;
  localeObj: any;
  noOfScripts: number;
  deviceType: string;
  featuresData: boolean;
  public selectedImageIndex: any;
  prevSlide:any;
  activeSlide : number;
  threeSixtyVideoSrc;

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
  propertyType = "";

  private _userSettingsSubscriptions: any;
  private roomDetailsSubscription: Subscription;
  @Input("isImage") isImage: boolean;
  @Input("roomid") roomid: string;
  @Input("roomname") roomname: string;
  @Input("imgUrl") imgUrl: string;
  @Input("altImageText") altImageText: string;
  @Input("imageUrls") imageUrls: any;
  @Input("threeSixtyDegreeImageUrls") threeSixtyDegreeImageUrls: any;
  @Input("roomLongDesc") roomLongDesc = "";

  constructor(
    private modalService: BsModalService,
    private contentService: RoomDetailsService,
    private _storeSvc: StoreService
  ) {}

  ngOnInit() {
    this.noOfScripts = 0;
    this.isThreeSixtyDegreeView = false;
    this.isImageSelected = true;
    this._userSettingsSubscriptions = this._storeSvc
      .getUserSettings()
      .subscribe((sharedData) => {
        this.localeObj = sharedData.localeObj;
        this.deviceType = sharedData.deviceType;
        this.propertyType = sharedData.propertyInfo.propertyType;
      });

    if (this.propertyType !== "" && this.propertyType !== "RVNG") {
      this.imageUrls = [];
      this.threeSixtyDegreeImageUrls = [];
    }
  }

  ngOnDestroy() {
    const subscriptionsList = [
      this._userSettingsSubscriptions,
      this.roomDetailsSubscription,
    ];
    CommonUtility.removeSubscriptions(subscriptionsList);
    if (this.modalRef !== undefined) {
      this.modalRef.hide();
    }
  }

  // 360 Degree View changes

  imageSelected(img, i) {
    let clickedImage = img.thumbnailImageUrl;
    this.appendOpacity(i);
    this.activeSlide = i;
    this.prevSlide = i - 1;
    this.selectedImageIndex = true;
    this.isImageSelected = true;
    const selectedItem = this.lightboxData.imageUrls.find(
      (v, i, o) => v.thumbnailImageUrl === clickedImage
    );
   this.selectedImage = selectedItem;
    
    if (this.threeSixtyVideoSrc) {
      const ele = document.getElementsByName("threeSixtyDegreeView");
      if (ele !== null && ele !== undefined && ele.length > 0) {
        ele[0].innerHTML = "";
      }
      for (let index = 1; index <= this.noOfScripts; index++) {
        CommonUtility.removeScript("360DegreeView-" + index);
      }
      this.noOfScripts = 0;
    }
  }

  threeSixtyImageSelected(imageObj: any, i) {
    this.selectedImage = imageObj;
    this.selectedImage.largeImageUrl = null;
    this.appendOpacity(i);
    this.selectedImageIndex = true;
    this.isImageSelected = true;
    let eleScript = this.selectedImage.script;
    this.threeSixtyVideoSrc = this.selectedImage.script;
    if (eleScript) {
      this.noOfScripts = (
        this.selectedImage.script.match(/<\/script>/g) || []
      ).length;
      for (let index = 1; index <= this.noOfScripts; index++) {
        const startIndex = eleScript.indexOf("<script");
        const endIndex = eleScript.indexOf("</script>") + 8;
        const scriptStr = eleScript.substr(startIndex, endIndex + 1);
        const srcStr = this.getSrcStr(scriptStr);
        const scriptObj = {
          id: "360DegreeView-" + index,
          src: srcStr,
          isAsync: true,
          isDefer: false,
        };
        CommonUtility.loadScript(scriptObj);
        eleScript =
          eleScript.substr(0, startIndex) + eleScript.substr(endIndex + 1);
      }
    }

    const ele = document.getElementsByName("threeSixtyDegreeView");
    if (ele !== null && ele !== undefined && ele.length > 0) {
      ele[0].innerHTML = eleScript;
    }
    document.getElementsByTagName("IFRAME")[0].setAttribute("width","100%");
    document.getElementsByTagName("IFRAME")[0].setAttribute("height","420");
  }

  getSrcStr(script: string) {
    let srcUrlStart = false;
    let quoteFormat = "";
    let urlStr = "";
    for (
      let index = script.indexOf("src") + 3;
      index < script.length;
      index++
    ) {
      if (!srcUrlStart && (script[index] === "'" || script[index] === '"')) {
        srcUrlStart = true;
        quoteFormat = script[index];
      } else if (srcUrlStart && script[index] !== quoteFormat) {
        urlStr = urlStr + script[index];
      } else if (srcUrlStart && script[index] === quoteFormat) {
        return urlStr;
      }
    }
  }

  loadDataFromServer() {
    this.roomDetailsSubscription = this.contentService
      .getRoomDetails(this.roomid)
      .subscribe((resp) => {
        this.lightboxData = resp.data;
        this.activeSlide = 0;
        this.lightboxData.threeSixtyImages.forEach((img) =>{
          if(img.script){
          this.lightboxData.imageUrls.push(img);
          }
        })
        this.selectedImage = this.lightboxData.imageUrls[this.activeSlide];
        if (
          this.lightboxData.threeSixtyImageScript !== null &&
          this.lightboxData.threeSixtyImageScript !== undefined &&
          this.lightboxData.threeSixtyImageScript.length > 0
        ) {
          this.isThreeSixtyDegreeView = true;
        } else {
          this.isThreeSixtyDegreeView = false;
        }
        this.categoriesToShow = this.objectKeys(this.lightboxData.features);
        if (
          this.lightboxData &&
          this.lightboxData.imageUrls &&
          this.lightboxData.imageUrls.length > 0
        ) {
          this.selectedImage = this.lightboxData.imageUrls[0];
        }
        if (
          !_.isEmpty(this.lightboxData.features) ||
          !_.isEmpty(
            this.lightboxData.keyFeatures.displayName &&
              this.lightboxData.keyFeatures.displayValue
          )
        ) {
          this.featuresData = true;
        } else {
          this.featuresData = false;
          const target = document.getElementsByClassName(
            "modal-dialog modal-lg"
          )[0];
          target.className = "modal-dialog expanded-panel-slick";
        }
      setTimeout(() => {
        if(this.lightboxData.imageUrls.length > 4) {
        const leftArrow  = document.getElementsByClassName("slick-prev slick-arrow")[0];
        leftArrow.className = leftArrow + ' d-none';
        const rightArrow  = document.getElementsByClassName("slick-next slick-arrow")[0];
        rightArrow.className = rightArrow + ' d-none';
        }
      },250);
    });
  }

  /*imageSelected(clickedImage: string) {
    const selectedItem = this.lightboxData.imageUrls.find((v, i, o) => v.thumbnailImageUrl === clickedImage);
    this.selectedImage = selectedItem;
  }

  loadDataFromServer() {
    this.contentService.getRoomDetails(this.roomid)
      .subscribe(resp => {
        this.lightboxData = resp.data;
        this.categoriesToShow = this.objectKeys(this.lightboxData.features);
        if (this.lightboxData && this.lightboxData.imageUrls && this.lightboxData.imageUrls.length > 0) {
          this.selectedImage = this.lightboxData.imageUrls[0];
        }
      });
  }*/
  openRoomDetailsModal(template: TemplateRef<any>) {
    this.modalRef = this.modalService.show(
      template,
      Object.assign({}, { class: "modal-lg" })
    );
    this.loadDataFromServer();
    return false;
  }

  OpenRoomDetailsModalForRVNG(template: TemplateRef<any>) {
    this.modalRef = this.modalService.show(
      template,
      Object.assign({}, { class: "modal-lg" })
    );
    this.setRoomDetailsContent();
    return false;
  }

  setRoomDetailsContent() {
    const roomData: any = {};
    this.lightboxData = roomData;
    // this.roomLongDesc  = "sfjsdjfksldj fklsdjfksjdfks sjdflks jdfklsdjf sdfjskldfjksldjf sdfskdfjsdkfjsd fsdkfj sdfsdff";
    // // this.roomLongDesc  = null;

    this.lightboxData.threeSixtyImages = [];
    this.lightboxData.imageUrls = [];
    if (
      this.threeSixtyDegreeImageUrls !== null &&
      this.threeSixtyDegreeImageUrls !== undefined &&
      this.threeSixtyDegreeImageUrls.length > 0
    ) {
      this.lightboxData.threeSixtyImages = this.threeSixtyDegreeImageUrls;
      this.isThreeSixtyDegreeView = true;
    } else {
      this.isThreeSixtyDegreeView = false;
    }
    if (this.imageUrls && this.imageUrls.length > 0) {
      // this.imageUrls = [{
      // "imageOrder": 1,
      // "largeImageUrl": "http://d2r4g49zv9n1lp.cloudfront.net/3/134_1_mbs_small.jpg",
      // "thumbnailImageUrl": "http://d2r4g49zv9n1lp.cloudfront.net/3/134_1_mbs_thumb_medium.jpg"
      // }, {
      // "imageOrder": 2,
      // "largeImageUrl": "https://d23fd41akeks.cloudfront.net/1210/42361_2_mbs_small.jpg",
      // "thumbnailImageUrl": "https://d23fd41akeks.cloudfront.net/1210/42361_2_mbs_thumb_medium.jpg"
      // }, {
      // "imageOrder": 3,
      // "largeImageUrl": "https://d23fd41akeks.cloudfront.net/1210/42376_1_mbs_small.jpg",
      // "thumbnailImageUrl": "https://d23fd41akeks.cloudfront.net/1210/42376_1_mbs_thumb_medium.jpg",
      // }];
      this.lightboxData.imageUrls = this.imageUrls;
      this.selectedImage = this.imageUrls[0];
    }
    if (this.propertyType !== "RVNG") {
      if (
        !_.isEmpty(this.lightboxData.features) ||
        !_.isEmpty(
          this.lightboxData.keyFeatures.displayName &&
            this.lightboxData.keyFeatures.displayValue
        )
      ) {
        this.featuresData = true;
      } else {
        this.featuresData = false;
        const target = document.getElementsByClassName(
          "modal-dialog modal-lg"
        )[0];
        target.className = "modal-dialog expanded-panel-slick";
      }
    } else {
      if (!!!this.roomLongDesc) {
        const target = document.getElementsByClassName(
          "modal-dialog modal-lg"
        )[0];
        target.className = "modal-dialog expanded-panel-slick";
      }
    }
    setTimeout(() => {
      if(this.lightboxData.imageUrls.length > 4) {
      const leftArrow  = document.getElementsByClassName("slick-prev slick-arrow")[0];
      leftArrow.className = leftArrow + ' d-none';
      const rightArrow  = document.getElementsByClassName("slick-next slick-arrow")[0];
      rightArrow.className = rightArrow + ' d-none';
      }
    },250);
  }

  objectKeys(obj: object) {
    const keys = Object.keys(obj),
      features = [];
    keys.forEach((element) => {
      features.push(element);
    });
    return features;
  }

  mainModalclass(propertyType: any) {
    let className = "";
    if (propertyType !== "RVNG") {
      className = this.featuresData ? "left-panel" : "left-panel-expanded";
    } else if (propertyType === "RVNG") {
      className = "left-panel";
    }
    return className;
  }

  addSlide() {
    // this.slides.push({ img: "http://placehold.it/350x150/777777" })
  }

  removeSlide() {
    // this.slides.length = this.slides.length - 1;
  }
  appendOpacity(currentSlide){
    this.lightboxData.imageUrls.forEach((img, i) => {
      if(i === currentSlide){
        img.imageOpacity = 0.4;
      }
      else
      {
      img.imageOpacity = 1;
      }
    })
  }
  slickInit(e) {
    this.appendOpacity(0);
  }

  breakpoint(e) {
    console.log("breakpoint");
  }

  afterChange(e) {
    // if(this.selectedImageIndex){
    //   e.currentSlide = this.activeSlide;
    //  }
    if(e.currentSlide != 0){
    this.prevSlide =  e.currentSlide - 1;
    }
    if(e.currentSlide === 0){
      this.prevSlide =  this.lightboxData.imageUrls.length - 1;
    }
    this.selectedImageIndex = false;
    this.activeSlide = e.currentSlide;
    this.appendOpacity(this.activeSlide);
    const currentSlide = e.slick.$slides.get(e.currentSlide).firstChild
      .currentSrc;
    // this.isImageSelected = true;
    this.activeSlide = e.currentSlide;
    this.selectedImageIndex = e.currentSlide; 
    const selectedItem = this.lightboxData.imageUrls.find(
      (v, i, o) => v.largeImageUrl == currentSlide
    );
    this.selectedImage = selectedItem;
    this.selectedImage = this.lightboxData.imageUrls[this.activeSlide];
    if (this.threeSixtyVideoSrc) {
      const ele = document.getElementsByName("threeSixtyDegreeView");
      if (ele !== null && ele !== undefined && ele.length > 0) {
        ele[0].innerHTML = "";
      }
      for (let index = 1; index <= this.noOfScripts; index++) {
        CommonUtility.removeScript("360DegreeView-" + index);
      }
      this.noOfScripts = 0;
    }
    if(this.selectedImage.script){
      this.threeSixtyImageSelected(this.selectedImage, this.activeSlide);
    }
  }

  beforeChange(e) {
    this.prevSlide = e.currentSlide;
  }
}
