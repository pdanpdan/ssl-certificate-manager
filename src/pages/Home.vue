<template>
  <q-page class="column no-wrap q-gutter-y-sm" padding :style-fn="pageStyleFn">
    <q-card class="q-mx-sm">
      <q-card-section horizontal>
        <q-card-actions vertical class="justify-center">
          <q-btn
            flat
            size="md"
            padding="sm"
            color="primary"
            icon="check_box_outline_blank"
            :disable="filteredSelectedHosts.length === 0 || processing"
            @click="selectAllHosts(false)"
          />

          <q-btn
            flat
            size="md"
            padding="sm"
            color="primary"
            icon="check_box"
            :disable="filteredSelectedHosts.length === filteredHosts.length || processing"
            @click="selectAllHosts(true)"
          />
        </q-card-actions>

        <q-separator vertical inset />

        <q-card-actions vertical class="justify-center">
          <q-btn
            flat
            size="lg"
            padding="xs"
            color="accent"
            icon="policy"
            :disable="filteredSelectedHosts.length === 0 || processing"
            @click="verifySelectedHosts"
          />
        </q-card-actions>

        <q-separator vertical inset />

        <q-card-section class="col">
          <div class="row items-center">
            <q-checkbox
              v-model="filters.active"
              color="primary"
              :label="$t('host.filter_active')"
            />

            <q-separator class="q-ml-md q-mr-sm" vertical inset />

            <q-checkbox
              v-model="filters.authorizedValid"
              color="primary"
              :label="$t('host.filter_authorized_valid')"
            />

            <q-checkbox
              v-model="filters.authorizedInvalid"
              color="primary"
              :label="$t('host.filter_authorized_invalid')"
            />

            <q-checkbox
              v-model="filters.authorizedNotChecked"
              color="primary"
              :label="$t('host.filter_authorized_not_checked')"
            />

            <q-separator class="q-ml-md q-mr-sm" vertical inset />

            <q-checkbox
              v-model="filters.authorizedExpire"
              color="primary"
              :label="$t('host.filter_authorized_expire')"
            />
          </div>

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

        <q-card-actions vertical class="justify-center">
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
        :locked="processing && filteredSelectedHosts.includes(host)"
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
        authorizedValid: true,
        authorizedInvalid: true,
        authorizedNotChecked: true,
        authorizedExpire: false,
        search: '',
      },

      processing: false,

      hosts: [],
    };
  },

  computed: {
    filteredHosts() {
      const needle = typeof this.filters.search !== 'string' ? '' : this.filters.search.toLocaleLowerCase();
      const searchFn = typeof this.filters.search !== 'string' || this.filters.search.trim().length === 0
        ? () => true
        : (h) => h.search.indexOf(needle) > -1;

      const authorizedValues = [];
      if (this.filters.authorizedValid === true) {
        authorizedValues.push(1);
      }
      if (this.filters.authorizedInvalid === true) {
        authorizedValues.push(0);
      }
      if (this.filters.authorizedNotChecked === true) {
        authorizedValues.push(null);
      }
      const authorizedFn = authorizedValues.length === 3
        ? () => true
        : (h) => authorizedValues.includes(h.authorized);

      const expireFn = this.filters.authorizedExpire !== true
        ? () => true
        : (h) => {
          if (Array.isArray(h.certificates) !== true || h.certificates.length === 0) {
            return false;
          }

          const expireDate = new Date(h.certificates[0].valid_to).valueOf();
          const now = Date.now();

          return Number.isNaN(expireDate) || (expireDate - now) / (1000 * 60 * 60 * 24) < 45;
        };

      return this.hosts.filter(searchFn).filter(authorizedFn).filter(expireFn);
    },

    filteredSelectedHosts() {
      return this.filteredHosts.filter((h) => h.selected);
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

    verifySelectedHosts() {
      this.processing = true;

      const hosts = this.filteredSelectedHosts.map((h) => JSON.parse(JSON.stringify(h)));

      const queue = hosts.reduce(
        (acc, host) => acc.then(
          () => window.sslCertAPI
            .verifyHost(host)
            .then((history) => window.sslCertAPI.writeHostHistory(host, history))
            .catch(() => {}),
        ),
        Promise.resolve(),
      );

      return queue.then(() => {
        this.readHosts();

        this.processing = false;
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
