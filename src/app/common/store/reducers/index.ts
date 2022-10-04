import { ActionReducerMap } from "@ngrx/store";
import { basketServiceReducer, IBasketState } from "./basket.reducer";
import {
  errorHandlerReducer,
  IErrorHandlerState,
} from "./error-handler.reducer";
import {
  IUserSettingsState,
  userSettingsReducer,
} from "./user-settings.reducer";

export interface AppState {
  basketServiceReducer: IBasketState;
  userSettingsReducer: IUserSettingsState;
  errorHandlerReducer: IErrorHandlerState;
}

export const reducers: ActionReducerMap<AppState> = {
  basketServiceReducer,
  userSettingsReducer,
  errorHandlerReducer,
};
