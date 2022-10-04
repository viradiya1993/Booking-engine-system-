import * as Rollbar from "rollbar"; // When using Typescript < 3.6.0.
// `import Rollbar from 'rollbar';` is the required syntax for Typescript 3.6.x.
// However, it will only work when setting either `allowSyntheticDefaultImports`
// or `esModuleInterop` in your Typescript options.
import { environment } from "src/environments/environment";

import {
  ErrorHandler,
  Inject,
  Injectable,
  InjectionToken,
} from "@angular/core";

const rollbarConfig = {
  accessToken: environment.rollbarToken,
  captureUncaught: true,
  captureUnhandledRejections: true,
};

export const RollbarService = new InjectionToken<Rollbar>("rollbar");

@Injectable()
export class RollbarErrorHandler implements ErrorHandler {
  constructor(@Inject(RollbarService) private rollbar: Rollbar) {}

  handleError(err: any): void {
    if (environment.enableRollbar) {
      const metadata = { dataLayer: window["rt4Datalayer"] };
      this.rollbar.configure({
        enabled: environment.enableRollbar,
        logLevel: "info",
        payload: {
          environment: environment.envType,
          context: environment.envName,
        },
      });
      this.rollbar.info("dataLayer", metadata);
      this.rollbar.error(err.originalError || err);
    }
    // So that the error shows in the console, let's throw it back
    try {
    throw err;
    } catch(error){
      console.error("HandleError: ", error)
    }
  }
}

export function rollbarFactory() {
  return new Rollbar(rollbarConfig);
}
