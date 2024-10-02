import {
  compose as reduxCompose,
  Store,
  combineReducers,
} from 'redux';
import { configureStore } from '@reduxjs/toolkit'

import {logsReducer} from './logs/logs_reducers';

/** Window interface with redux devtools compose function. */
export interface WindowWithExtension extends Window {
  __REDUX_DEVTOOLS_EXTENSION_COMPOSE__: typeof reduxCompose;
}

function isReduxExtensionInstalled(
  window: Window | WindowWithExtension
): window is WindowWithExtension {
  return !!(window as WindowWithExtension).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__;
}

let store: Store;
const rootReducer = combineReducers({
  logs: logsReducer,
});

export type AppState = ReturnType<typeof rootReducer>;

export function createStore() {
  store = configureStore({reducer: rootReducer});
  return store;
}

export function getStore() {
  if (!store) {
    throw new Error(
      'store has not been created. Make sure to call `createStore` first'
    );
  }
  return store;
}
