<template>
  <q-layout view="hHh lpR fFf">
    <q-header class="bg-primary">
      <q-toolbar>
        <q-toolbar-title>
          {{ appName }}
        </q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>

    <q-footer class="bg-primary">
      <div class="row no-wrap items-center q-px-md q-py-sm">
        <div
          xmlns:cc="http://creativecommons.org/ns#"
          xmlns:dct="http://purl.org/dc/terms/"
          class="row no-wrap items-center q-gutter-x-xs license text-subtitle1"
        >
          <a
            href="https://github.com/pdanpdan/ssl-certificate-manager"
            rel="cc:attributionURL"
            property="dct:title"
            target="_blank"
          >SSL Certificate Manager</a>
          <span>&copy;2021 by</span>
          <a
            href="https://github.com/pdanpdan/"
            rel="cc:attributionURL dct:creator"
            property="cc:attributionName"
            target="_blank"
          >Dan Popescu</a>
          <span>is licensed under</span>
          <a
            class="row no-wrap items-center q-gutter-x-xs"
            href="http://creativecommons.org/licenses/by-nc-nd/4.0/?ref=chooser-v1"
            rel="license noopener noreferrer"
            target="_blank"
          >
            <span>CC BY-NC-ND 4.0</span>
            <img
              class="license__img"
              src="https://mirrors.creativecommons.org/presskit/icons/cc.svg?ref=chooser-v1"
            />
            <img
              class="license__img"
              src="https://mirrors.creativecommons.org/presskit/icons/by.svg?ref=chooser-v1"
            />
            <img
              class="license__img"
              src="https://mirrors.creativecommons.org/presskit/icons/nc.svg?ref=chooser-v1"
            />
            <img
              class="license__img"
              src="https://mirrors.creativecommons.org/presskit/icons/nd.svg?ref=chooser-v1"
            />
          </a>
        </div>

        <q-space />

        <div class="text-subtitle2">
          ver. {{ appVersion }}
        </div>
      </div>
    </q-footer>
  </q-layout>
</template>

<script>
export default {
  name: 'App',

  data() {
    return {
      appVersion: process.env.appVersion,
      appName: process.env.appName,
      appAuthor: process.env.appAuthor,
    };
  },

  beforeMount() {
    window.sslCertAPI
      .openDb()
      .then(() => this.$store.dispatch('config/readConfig'))
      .catch((err) => {
        console.error('[sqlite] open:', err);
      });
  },

  beforeUnmount() {
    window.sslCertAPI.closeDb();
  },
};
</script>
