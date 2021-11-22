export function readConfig({ commit }) {
  return window.sslCertAPI
    .readConfig()
    .then((config) => {
      commit('SET_CONFIG', config);

      return config;
    })
    .catch((error) => {
      console.error(error);
    });
}

export function setConfig({ commit }, config) {
  return window.sslCertAPI
    .writeConfig(config)
    .then(() => {
      commit('SET_CONFIG', config);
    })
    .catch((error) => {
      console.error(error);
    });
}
