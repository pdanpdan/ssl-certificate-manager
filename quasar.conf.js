/*
 * This file runs in a Node context (it's NOT transpiled by Babel), so use only
 * the ES6 features that are supported by your Node version. https://node.green/
 */

// Configuration for your app
// https://v2.quasar.dev/quasar-cli/quasar-conf-js

/* eslint-env node */
const ESLintPlugin = require('eslint-webpack-plugin');
/* eslint func-names: 0 */
/* eslint global-require: 0 */
const { configure } = require('quasar/wrappers');

const packageJson = require('./package.json');

module.exports = configure((/* ctx */) => ({
  // https://v2.quasar.dev/quasar-cli/supporting-ts
  supportTS: false,

  // https://v2.quasar.dev/quasar-cli/prefetch-feature
  // preFetch: true,

  // app boot file (/src/boot)
  // --> boot files are part of "main.js"
  // https://v2.quasar.dev/quasar-cli/boot-files
  boot: [
    'i18n',
  ],

  // https://v2.quasar.dev/quasar-cli/quasar-conf-js#Property%3A-css
  css: [
    'app.sass',
  ],

  // https://github.com/quasarframework/quasar/tree/dev/extras
  extras: [
    'roboto-font', // optional, you are not bound to it
    'material-icons', // optional, you are not bound to it
  ],

  // Full list of options: https://v2.quasar.dev/quasar-cli/quasar-conf-js#Property%3A-build
  build: {
    env: {
      appVersion: packageJson.version,
      appName: packageJson.productName,
      appAuthor: packageJson.author,
    },

    vueRouterMode: 'history', // available values: 'hash', 'history'

    // transpile: false,

    // Add dependencies for transpiling with Babel (Array of string/regex)
    // (from node_modules, which are by default not transpiled).
    // Applies only if "transpile" is set to true.
    // transpileDependencies: [],

    // rtl: true, // https://v2.quasar.dev/options/rtl-support
    // preloadChunks: true,
    // showProgress: false,
    // gzip: true,
    // analyze: true,

    // Options below are automatically set depending on the env, set them if you want to override
    // extractCSS: false,

    // https://v2.quasar.dev/quasar-cli/handling-webpack
    // "chain" is a webpack-chain object https://github.com/neutrinojs/webpack-chain
    chainWebpack(chain) {
      const nodePolyfillWebpackPlugin = require('node-polyfill-webpack-plugin');

      chain.plugin('eslint-webpack-plugin')
        .use(ESLintPlugin, [{ extensions: ['js', 'vue'] }]);

      chain.plugin('node-polyfill')
        .use(nodePolyfillWebpackPlugin);
    },
  },

  // Full list of options: https://v2.quasar.dev/quasar-cli/quasar-conf-js#Property%3A-devServer
  devServer: {
    https: false,
    port: 8080,
    open: true, // opens browser window automatically
  },

  // https://v2.quasar.dev/quasar-cli/quasar-conf-js#Property%3A-framework
  framework: {
    config: {},

    iconSet: 'material-icons', // Quasar icon set
    lang: 'en-US', // Quasar language pack

    // For special cases outside of where the auto-import strategy can have an impact
    // (like functional components as one of the examples),
    // you can manually specify Quasar components/directives to be available everywhere:
    //
    // components: [],
    // directives: [],

    // Quasar plugins
    plugins: [
      'Dialog',
      'Loading',
      'Notify',
    ],
  },

  // animations: 'all', // --- includes all animations
  // https://v2.quasar.dev/options/animations
  animations: [],

  // Full list of options: https://v2.quasar.dev/quasar-cli/developing-electron-apps/configuring-electron
  electron: {
    bundler: 'packager', // 'packager' or 'builder'

    packager: {
      // https://github.com/electron-userland/electron-packager/blob/master/docs/api.md#options

      // OS X / Mac App Store
      // appBundleId: 'org.pdanpdan.ssl.certificate-manager',
      // appCategoryType: '',
      // osxSign: '',
      // protocol: 'myapp://path',

      // Windows only
      // win32metadata: { ... }
      // asar: {
      //   unpack: '**/node_modules/{ffmpeg,ffprobe}-static/**',
      // },
    },

    // "chain" is a webpack-chain object https://github.com/neutrinojs/webpack-chain
    chainWebpackMain(chain) {
      chain.plugin('eslint-webpack-plugin')
        .use(ESLintPlugin, [{ extensions: ['js'] }]);
    },

    // "chain" is a webpack-chain object https://github.com/neutrinojs/webpack-chain
    chainWebpackPreload(chain) {
      chain.plugin('eslint-webpack-plugin')
        .use(ESLintPlugin, [{ extensions: ['js'] }]);
    },
  },
}));
