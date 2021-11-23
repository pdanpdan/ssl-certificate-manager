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
  const configClone = JSON.parse(JSON.stringify(config));

  return window.sslCertAPI
    .writeConfig(configClone)
    .then(() => {
      commit('SET_CONFIG', configClone);
    })
    .catch((error) => {
      console.error(error);
    });
}
