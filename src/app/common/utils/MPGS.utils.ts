// import * as _ from 'lodash';
// import { StoreService } from '../services/store.service';
// import { ErrorCodesListInComponents } from '../common.constants';

// export class MPGSUtils {
//   public static clearMPGSErrorMessages(storeService: StoreService) {
//     ErrorCodesListInComponents.PaymentMethodComponent.forEach(statusCode => {
//       storeService.removeError()
//     }); ;
//   }
// }

export const MPGS_Data = {
  description: "Ordered goods",
  transactionId: "1884",
  AmexCheckOutApi:
    "https://gateway-japa.americanexpress.com/checkout/version/49/checkout.js",
  // MasterVisaCheckoutApi: 'https://ap-gateway.mastercard.com/checkout/version/48/checkout.js'
};
