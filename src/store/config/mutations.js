import { defaultConfig } from './state.js';

export function SET_CONFIG(state, config) {
  state.config = {
    ...defaultConfig,
    ...state.config,
    ...config,
  };
}
