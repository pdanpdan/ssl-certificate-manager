<template>
  <q-page class="column no-wrap" padding :style-fn="pageStyleFn">
    <q-list class="col column no-wrap">
      <q-item>
        <q-item-section>
        </q-item-section>

        <q-item-section side>
          <q-btn
            dense
            padding="xs"
            color="accent"
            icon="add"
            @click="addHost"
          />
        </q-item-section>
      </q-item>

      <div class="col scroll">
        <host-item
          v-for="(host, i) in filteredHosts"
          :key="i"
          :host="host"
          @update="readHosts"
          @select="selectHost"
        />
      </div>
    </q-list>
  </q-page>
</template>

<script>
import { defineComponent } from 'vue';

import HostEditDialog from 'components/HostEditDialog.vue';
import HostItem from 'components/HostItem.vue';

export default defineComponent({
  name: 'HomePage',

  components: {
    HostItem,
  },

  data() {
    return {
      filters: {
        category: '',
        host: '',
      },

      hosts: [],
    };
  },

  computed: {
    filteredHosts() {
      return this.hosts;
    },
  },

  methods: {
    readHosts() {
      window.sslCertAPI
        .readHosts()
        .then((hosts) => {
          this.hosts = hosts.map((host) => ({
            ...host,
            selected: (this.hosts.find((h) => h.id === host.id) || {}).selected === true,
          }));
        })
        .catch((error) => {
          console.error(error);

          this.hosts = [];
        });
    },

    addHost() {
      this.$q
        .dialog({
          component: HostEditDialog,

          componentProps: {
            host: undefined,
          },
        })
        .onOk(() => {
          this.readHosts();
        });
    },

    selectHost(host, selected) {
      if (host === Object(host)) {
        const found = this.hosts.find((h) => h.id === host.id);

        if (found !== undefined) {
          host.selected = selected === true;
        }
      }
    },

    pageStyleFn(offset, height) {
      return {
        height: `${ height - offset }px`,
      };
    },
  },

  mounted() {
    setTimeout(() => {
      this.readHosts();
    }, 1000);
  },
});
</script>
