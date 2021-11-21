<template>
  <q-page class="column no-wrap q-gutter-y-sm" padding :style-fn="pageStyleFn">
    <q-card class="q-mx-sm">
      <q-card-section horizontal>
        <q-card-actions class="justify-center" vertical>
          <q-btn
            flat
            size="md"
            padding="sm"
            color="primary"
            icon="check_box_outline_blank"
            :disable="filteredSelectedHosts.length === 0 || processing"
            @click="selectFilteredHosts(false)"
          />

          <q-separator spaced />

          <q-btn
            flat
            size="md"
            padding="sm"
            color="primary"
            icon="check_box"
            :disable="filteredSelectedHosts.length === filteredSelectableHosts.length || processing"
            @click="selectFilteredHosts(true)"
          />
        </q-card-actions>

        <q-separator vertical inset />

        <q-card-actions class="justify-center" vertical>
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

        <q-card-actions class="justify-center" vertical>
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
      />
    </q-scroll-area>
  </q-page>
</template>

<script>
import { defineComponent } from 'vue';
import { mapState, mapActions, mapGetters } from 'vuex';

import HostEditDialog from 'components/HostEditDialog.vue';
import HostItem from 'components/HostItem.vue';

export default defineComponent({
  name: 'HomePage',

  components: {
    HostItem,
  },

  data() {
    return {
      processing: false,
    };
  },

  computed: {
    ...mapState('hosts', [
      'hosts',
    ]),

    ...mapGetters('hosts', [
      'filteredHosts',
      'filteredSelectableHosts',
      'filteredSelectedHosts',
    ]),

    filters() {
      const { filters } = this.$store.state.hosts;

      return Object.keys(filters)
        .reduce((acc, key) => {
          Object.defineProperty(acc, key, {
            get: () => filters[key],
            set: (value) => {
              this.setFilters({ [key]: value });
            },
            enumerable: true,
          });

          return acc;
        }, {});
    },
  },

  watch: {
    // eslint-disable-next-line object-shorthand
    'filters.active'() {
      this.readHosts();
    },
  },

  methods: {
    ...mapActions('hosts', [
      'readHosts',
      'selectFilteredHosts',
      'setFilters',
    ]),

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

    verifySelectedHosts() {
      this.processing = true;

      const hosts = this.filteredSelectedHosts.map((h) => JSON.parse(JSON.stringify(h)));

      return hosts
        .reduce(
          (acc, host) => acc.then(
            () => window.sslCertAPI
              .verifyHost(host)
              .then((history) => window.sslCertAPI.writeHostHistory(host, history))
              .catch(() => {}),
          ),
          Promise.resolve(),
        ).then(() => {
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
