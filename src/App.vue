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
      <div class="row no-wrap items-center q-px-md q-py-xs">
        <div class="text-caption">
          {{ appAuthor }}
        </div>

        <q-space />

        <div class="text-caption">
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

  created() {
    window.sslCertAPI
      .openDb()
      .then(() => this.$store.dispatch('config/readConfig'))
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
