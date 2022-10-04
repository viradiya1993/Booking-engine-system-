export class PricingDetail {
  PackagePrice: number; // Room Price before Tax
  DefPackagePrice: number; // Room Price before Tax
  Tax: number;
  DefTax: number; // Tax
  TotalPrice: number; // Tax
  DefTotalPrice: number; // Price After Tax (Room Price + Total Addon PRice + Tax)
  CurrencyCode: string;
  CurrencySymbol: string;
  TotalAddonPrice: number; // Total of all Addons applied
  DefTotalAddonPrice: number; // Total of all Addons applied
  RoomRateAddonPrice: number;
  DefRoomRateAddonPrice: number;
  FormattedTax: number;
  FormattedTotalPrice: number;
  TotalPriceByCurrency: any;
  PackagePriceWithPackageAddons?: number;
  DefPackagePriceWithPackageAddOnTaxes?: number;
  TotalPriceWithPackageAddOnTaxesByCurrency?: number;
  DefnTotalPriceWithPackageAddOnTaxesByCurrency?: number;
}
