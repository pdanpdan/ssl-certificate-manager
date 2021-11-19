<template>
  <div class="q-layout-padding column no-wrap q-gutter-y-sm">
    <q-card
      style="max-width: 400px"
      square
      flat
      bordered
    >
      <q-card-section class="column no-wrap q-gutter-y-sm">
        <q-input v-model="hostname" label="hostname" dense />
        <q-input v-model="servername" label="servername" dense />
        <q-input v-model="port" label="port" dense />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn color="primary" label="Verify Host" @click="verifyHost" />
      </q-card-actions>
    </q-card>

    <template v-if="history">
      <q-banner :class="history.authorized === 1 ? 'bg-positive' : 'bg-negative'" dark>
        <div class="column no-wrap q-gutter-y-xs">
          <div class="text-subtitle1">
            {{ history.authorized === 1 ? 'AUTHORIZED' : 'UNAUTHORIZED' }}
          </div>

          <div class="text-caption">
            {{ history.fingerprint }}
          </div>
        </div>
      </q-banner>

      <q-card
        v-if="history.errors.length > 0"
        class="text-negative"
        square
        flat
        bordered
      >
        <q-card-section v-for="(error, i) in history.errors" :key="i">
          <pre class="scroll q-ma-none"><samp>{{ error }}</samp></pre>
        </q-card-section>
      </q-card>

      <q-card
        v-if="history.certificates.length > 0"
        square
        flat
        bordered
      >
        <q-card-section v-for="(certificate, i) in history.certificates" :key="i">
          <pre class="scroll q-ma-none"><samp>{{ certificate }}</samp></pre>
        </q-card-section>
      </q-card>
    </template>
  </div>
</template>

<script>
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'HomePage',

  data() {
    return {
      hostname: 'revoked.badssl.com',
      servername: 'revoked.badssl.com',
      port: 443,
      history: null,
    };
  },

  methods: {
    verifyHost() {
      window.sslCertAPI
        .verifyHost({
          hostname: this.hostname,
          servername: this.servername,
          port: this.port,
        })
        .then((history) => {
          this.history = history;
        })
        .catch((error) => {
          console.error(error);
        });
    },
  },
});
</script>
