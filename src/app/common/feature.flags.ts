import * as optimizelySDK from "@optimizely/optimizely-sdk";
import { environment } from "src/environments/environment";
import { CommonUtility } from "./common.utility";

export class FeatureFlags {
  static getUserName() {
    let username = localStorage.getItem("currentUser");

    if (!username) {
      const chars =
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      username = [...Array(6)]
        .map((_) => chars[~~(Math.random() * chars.length)])
        .join("");
      localStorage.setItem("currentUser", username);
    }
    return username;
  }

  static getAttributes() {
    return {
      portal: CommonUtility.getSubdomain(),
    };
  }

  static setEnabledFeatures() {
    const optimizelyClientInstance = optimizelySDK.createInstance({
      sdkKey: environment.optimizelySDKKey,
    });

    optimizelyClientInstance.onReady().then(() => {
      sessionStorage.setItem(
        "enabledFeatures",
        JSON.stringify(
          optimizelyClientInstance.getEnabledFeatures(
            this.getUserName(),
            this.getAttributes()
          )
        )
      );
    });
  }
  static getEnabledFeatures() {
    const enabledFeatures = sessionStorage.getItem("enabledFeatures");

    if (enabledFeatures) {
      return JSON.parse(enabledFeatures);
    } else {
      return [];
    }
  }
  static isFeatureEnabled(feature) {
    const enabledFeatures = this.getEnabledFeatures();
    return enabledFeatures.indexOf(feature) !== -1;
  }
}
