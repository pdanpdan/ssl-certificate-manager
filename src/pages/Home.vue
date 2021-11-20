<template>
  <q-page class="column no-wrap q-gutter-y-sm" padding :style-fn="pageStyleFn">
    <q-card class="q-mx-sm">
      <q-card-section horizontal>
        <q-card-actions vertical class="justify-around">
          <q-btn
            flat
            size="md"
            padding="sm"
            color="primary"
            icon="check_box_outline_blank"
            @click="selectAllHosts(false)"
          />

          <q-btn
            flat
            size="md"
            padding="sm"
            color="primary"
            icon="check_box"
            @click="selectAllHosts(true)"
          />
        </q-card-actions>

        <q-separator vertical inset />

        <q-card-section class="col">
          <q-checkbox
            v-model="filters.active"
            color="primary"
            :label="$t('host.filter_active')"
          />

          <q-checkbox
            v-model="filters.authorized"
            color="primary"
            :true-value="1"
            :false-value="0"
            toggle-indeterminate
            :label="$t(`host.filter_authorized_${ filters.authorized }`)"
          />

          <q-input
            v-model="filters.search"
            outlined
            dense
            color="primary"
            clearable
            :label="$t('host.filter_search')"
          />
        </q-card-section>

        <q-separator vertical inset />

        <q-card-actions>
          <q-btn
            flat
            size="lg"
            padding="xs"
            color="accent"
            icon="add_box"
            @click="addHost"
          />
        </q-card-actions>
      </q-card-section>
    </q-card>

    <q-scroll-area class="col">
      <host-item
        v-for="(host, i) in filteredHosts"
        :key="i"
        class="q-ma-sm"
        :host="host"
        @update="readHosts"
        @select="selectHost"
      />
    </q-scroll-area>
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
        active: false,
        authorized: null,
        search: '',
      },

      hosts: [],
    };
  },

  computed: {
    filteredHosts() {
      const needle = typeof this.filters.search !== 'string' ? '' : this.filters.search.toLocaleLowerCase();
      const searchFn = typeof this.filters.search !== 'string' || this.filters.search.trim().length === 0
        ? (h) => h
        : (h) => h.search.indexOf(needle) > -1;

      const authorizedFn = this.filters.authorized === null
        ? (h) => h
        : (h) => h.authorized > this.filters.authorized;

      return this.hosts.filter(searchFn).filter(authorizedFn);
    },
  },

  watch: {
    // eslint-disable-next-line object-shorthand
    'filters.active'() {
      this.readHosts();
    },
  },

  methods: {
    readHosts() {
      const searchKeys = [
        'hostname',
        'servername',
        'port',
        'description',
        'category',
      ];

      window.sslCertAPI
        .readHosts(this.filters.active)
        .then((hosts) => {
          this.hosts = hosts.map((host) => ({
            ...host,
            selected: (this.hosts.find((h) => h.id === host.id) || {}).selected === true,
            search: searchKeys.map((k) => host[k]).join('#').toLocaleLowerCase(),
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

    selectAllHosts(selected) {
      this.filteredHosts.forEach((h) => {
        h.selected = selected === true;
      });
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
