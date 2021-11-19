<template>
  <q-card
    square
    flat
  >
    <q-card-section class="column no-wrap q-gutter-y-sm">
      <q-input v-model="hostname" label="hostname" dense />
      <q-input v-model="servername" label="servername" dense />
      <q-input v-model="port" label="port" dense />
      <q-input v-model="description" label="description" dense />
      <q-input v-model="category" label="category" dense />
    </q-card-section>

    <q-card-actions align="right">
      <q-btn color="primary" label="Verify Host" @click="addHost" />
    </q-card-actions>
  </q-card>
</template>

<script>
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'HostAddComponent',

  props: {
    host: Object,
  },

  data() {
    return {
      hostname: 'revoked.badssl.com',
      servername: 'revoked.badssl.com',
      port: 443,
      description: '',
      category: '',
      active: 1,
    };
  },

  methods: {
    addHost() {
      const host = {
        id: this.host.id,
        hostname: this.hostname,
        servername: this.servername,
        port: this.port,
        description: this.description,
        category: this.category,
        active: this.active,
      };

      window.sslCertAPI
        .writeHost(host)
        .then(() => {
          this.$emit('host:add', host);
        })
        .catch((error) => {
          console.error(error);
        });
    },
  },
});
</script>
