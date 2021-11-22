<template>
  <q-page class="column no-wrap" :style-fn="pageStyleFn">
    <q-card flat>
      <q-card-section horizontal>
        <q-card-actions class="justify-center" vertical>
          <div>
            <q-btn
              flat
              size="md"
              padding="sm"
              color="primary"
              icon="check_box_outline_blank"
              :disable="filteredSelectedHosts.length === 0 || processing.length > 0"
              @click="selectFilteredHosts(false)"
            />
            <q-tooltip>{{ $t('host.tooltip_unselect_all') }}</q-tooltip>
          </div>

          <q-separator spaced />

          <div>
            <q-btn
              flat
              size="md"
              padding="sm"
              color="primary"
              icon="check_box"
              :disable="filteredSelectedHosts.length === filteredSelectableHosts.length || processing.length > 0"
              @click="selectFilteredHosts(true)"
            />
            <q-tooltip>{{ $t('host.tooltip_select_all') }}</q-tooltip>
          </div>
        </q-card-actions>

        <q-separator vertical />

        <q-card-actions class="justify-center" vertical>
          <div>
            <q-btn
              flat
              size="lg"
              padding="xs"
              :color="hosts.length > 0 ? 'accent' : 'primary'"
              icon="policy"
              :disable="filteredSelectedHosts.length === 0 || processing.length > 0"
              @click="verifySelectedHosts"
            />
            <q-tooltip>{{ $t('host.tooltip_validate_selected') }}</q-tooltip>
          </div>
        </q-card-actions>

        <q-separator vertical />

        <q-card-section class="col q-gutter-y-xs">
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
            square
            color="primary"
            clearable
            :label="$t('host.filter_search')"
          />
        </q-card-section>

        <q-separator vertical />

        <q-card-actions class="justify-center" vertical>
          <div class="self-center">
            <q-btn
              flat
              size="lg"
              padding="xs"
              :color="hosts.length > 0 ? 'primary' : 'accent'"
              icon="add_box"
              @click="addHost"
            />
            <q-tooltip>{{ $t('host.tooltip_add') }}</q-tooltip>
          </div>

          <q-separator spaced />

          <div class="row no-wrap items-center">
            <div>
              <q-btn
                flat
                size="lg"
                padding="xs"
                color="primary"
                icon="file_upload"
                @click="importHosts"
              />
              <q-tooltip>{{ $t('host.tooltip_import') }}</q-tooltip>
            </div>

            <q-separator vertical spaced />

            <div>
              <q-btn
                flat
                size="lg"
                padding="xs"
                color="primary"
                icon="file_download"
                @click="exportHosts"
              />
              <q-tooltip>{{ $t('host.tooltip_export') }}</q-tooltip>
            </div>
          </div>
        </q-card-actions>
      </q-card-section>

      <q-separator />
    </q-card>

    <q-scroll-area id="hosts-scroll-area" class="col">
      <q-virtual-scroll
        :items="filteredHosts"
        scroll-target="#hosts-scroll-area > q-scrollarea__container"
        virtual-scroll-item-size="380"
      >
        <template v-slot="{ item: host, index }">
          <host-item
            :key="index"
            class="q-ma-md"
            :host="host"
            :locked="processing.includes(host)"
          />
        </template>
      </q-virtual-scroll>
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
      processing: [],
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
        })
        .onOk(() => {
          this.readHosts();
        });
    },

    importHosts() {
      this.$q
        .dialog({
          component: HostEditDialog,
        })
        .onOk(() => {
          this.readHosts();
        });
    },

    exportHosts() {
      this.$q
        .dialog({
          component: HostEditDialog,
        });
    },

    verifySelectedHosts() {
      this.processing = this.filteredSelectedHosts.slice();

      const hostsClones = this.filteredSelectedHosts.map((h) => JSON.parse(JSON.stringify(h)));

      return hostsClones
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

          this.processing = [];
        });
    },

    pageStyleFn(offset, height) {
      return {
        height: `${ height - offset }px`,
      };
    },
  },

  mounted() {
    this.readHosts();
  },
});
</script>
