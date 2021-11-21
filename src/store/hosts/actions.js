const hostSearchKeys = [
  'hostname',
  'servername',
  'port',
  'description',
  'category',
];

export function readHosts({ state, commit }) {
  return window.sslCertAPI
    .readHosts(state.filters.active)
    .then((hosts) => {
      commit('SET_HOSTS', hosts.map((host) => ({
        ...host,
        selected: (state.hosts.find((h) => h.id === host.id) || {}).selected === true,
        search: hostSearchKeys.map((k) => host[k]).join('#').toLocaleLowerCase(),
      })));
    })
    .catch((error) => {
      console.error(error);

      commit('SET_HOSTS', []);
    });
}

export function selectHost({ state, commit }, { host, selected }) {
  commit('SET_HOSTS', state.hosts.map((h) => (
    h === host && h.active === 1
      ? {
        ...h,
        selected: selected === true,
      }
      : h
  )));
}

export function selectFilteredHosts({ state, getters, commit }, selected) {
  commit('SET_HOSTS', state.hosts.map((h) => (
    getters.filteredHosts.includes(h)
      ? {
        ...h,
        selected: selected === true && h.active === 1,
      }
      : h
  )));
}

export function setFilters({ commit }, filters) {
  commit('SET_FILTERS', filters);
}
