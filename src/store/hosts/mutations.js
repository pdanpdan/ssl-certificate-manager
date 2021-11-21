import { defaultFilters } from './state.js';

export function SET_HOSTS(state, hosts) {
  state.hosts = Array.isArray(hosts) ? hosts : [];
}

export function SET_FILTERS(state, filters) {
  state.filters = {
    ...defaultFilters,
    ...state.filters,
    ...filters,
  };
}
