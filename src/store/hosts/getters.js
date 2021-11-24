export function filteredHosts(state, _, rootState) {
  const { durationDay, certificateAboutToExpireDaysWarning } = rootState.config.config;

  const needle = typeof state.filters.search !== 'string' ? '' : state.filters.search.trim().toLocaleLowerCase();
  const searchFn = needle.length === 0
    ? () => true
    : (h) => h.search.includes(needle);

  const authorizedValues = [];
  if (state.filters.authorizedValid === true) {
    authorizedValues.push(1);
  }
  if (state.filters.authorizedInvalid === true) {
    authorizedValues.push(0);
  }
  if (state.filters.authorizedNotChecked === true) {
    authorizedValues.push(null);
  }
  const authorizedFn = authorizedValues.length === 3
    ? () => true
    : (h) => authorizedValues.includes(h.authorized);

  const expireFn = state.filters.authorizedExpire !== true
    ? () => true
    : (h) => {
      if (Array.isArray(h.certificates) !== true || h.certificates.length === 0) {
        return false;
      }

      const expireDate = new Date(h.certificates[0].valid_to).valueOf();
      const now = Date.now();

      return Number.isNaN(expireDate) || (expireDate - now) / durationDay < certificateAboutToExpireDaysWarning;
    };

  return state.hosts.filter(searchFn).filter(authorizedFn).filter(expireFn);
}

export function filteredSelectableHosts(_, getters) {
  return getters.filteredHosts.filter((h) => h.active === 1);
}

export function filteredSelectedHosts(_, getters) {
  return getters.filteredSelectableHosts.filter((h) => h.selected);
}
