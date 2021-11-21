export const defaultFilters = {
  active: false,

  authorizedValid: true,
  authorizedInvalid: true,
  authorizedNotChecked: true,

  authorizedExpire: false,

  search: '',
};

export default {
  hosts: [],

  filters: {
    ...defaultFilters,
  },
};
