<template>
  <router-view />

  <div class="fixed-bottom-right q-pa-sm text-grey-8 z-top no-pointer-events">ver. {{ appVersion }}</div>
</template>

<script>
import { defineComponent } from 'vue';

const appVersion = require('../package.json').version;

export default defineComponent({
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
});
</script>
