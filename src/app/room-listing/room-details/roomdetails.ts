export interface RoomDetail {
  id: string;
  name: string;
  description: string;
  maxChildOccupancy: number;
  maxAdultOccupancy: number;
  totalMaxOccupancy: number;
  imageUrls?: ImageUrlsEntity[] | null;
  features?: FeaturesEntity[] | null;
  keyFeatures: KeyFeaturesEntity;
  threeSixtyImageScript: string;
  threeSixtyImages: ThreeSixtImageUrlsEntity[] | null;
}
export interface ImageUrlsEntity {
  imageOrder: number;
  largeImageUrl: string;
  thumbnailImageUrl: string;
  imageOpacity: number;
}

export interface ThreeSixtImageUrlsEntity {
  imageOrder: number;
  script: string;
  thumbnailImageUrl: string;
  largeImageUrl: string;
  imageOpacity: number;
}

export interface FeaturesEntity {
  category: string;
  items?: ItemsEntity[] | null;
}
export interface KeyFeaturesEntity {
  displayName: string;
  displayValue?: string[] | null;
}
export interface ItemsEntity {
  text: string;
}
