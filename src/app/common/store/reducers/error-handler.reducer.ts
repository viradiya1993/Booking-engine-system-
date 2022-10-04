import { STORE_ACTIONS } from "../actions/appActions";

export interface IErrorHandlerState {
  error: any;
}

const initialState: IErrorHandlerState = {
  error: {},
};

export function errorHandlerReducer(
  state = initialState,
  action
): IErrorHandlerState {
  switch (action.type) {
    case STORE_ACTIONS.ACTION_SET_ERROR:
      return {
        ...state,
        error: action.payload,
      };
  }
  return state;
}
