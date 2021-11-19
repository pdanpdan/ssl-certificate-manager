<template>
  <q-layout view="hHh lpR fFf">
    <q-page-container>
      <router-view />
    </q-page-container>

    <div class="fixed-bottom-right q-pa-sm text-grey-8 z-top no-pointer-events">ver. {{ appVersion }}</div>
  </q-layout>
</template>

<script>
const appVersion = require('../package.json').version;

export default {
  name: 'App',

  data() {
    return {
      appVersion,
    };
  },

  mounted() {
    window.sslCertAPI
      .openDb()
      .catch((err) => {
        console.error('[sqlite] open:', err);
      });
  },

  beforeUnmount() {
    window.sslCertAPI
      .closeDb()
      .catch((err) => {
        console.error('[sqlite] close:', err);
      });
  },
};
</script>
