<template>
  <q-page class="column no-wrap" :style-fn="pageStyleFn">
    <div class="q-px-md bg-secondary shadow-14" style="z-index: 1">
      <q-card
        class="bg-transparent"
        flat
        dark
        square
      >
        <q-card-section horizontal>
          <q-card-actions class="justify-center" vertical>
            <div>
              <q-btn
                unelevated
                size="md"
                padding="sm"
                color="primary"
                icon="check_box_outline_blank"
                :disable="filteredSelectedHosts.length === 0 || processing.length > 0"
                @click="selectFilteredHosts(false)"
              />
              <q-tooltip>{{ $t('host.tooltip_unselect_all') }}</q-tooltip>
            </div>

            <q-separator dark spaced />

            <div>
              <q-btn
                unelevated
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

          <q-separator dark vertical />

          <q-card-actions class="justify-center" vertical>
            <div>
              <q-btn
                unelevated
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

          <q-separator dark vertical />

          <q-card-section class="col">
            <div class="q-gutter-y-xs">
              <div class="row items-center">
                <q-checkbox
                  v-model="filters.active"
                  dark
                  color="primary"
                  :label="$t('host.filter_active')"
                />

                <q-separator
                  class="q-ml-md q-mr-sm"
                  dark
                  vertical
                  inset
                />

                <q-checkbox
                  v-model="filters.authorizedValid"
                  dark
                  color="primary"
                  :label="$t('host.filter_authorized_valid')"
                />

                <q-checkbox
                  v-model="filters.authorizedInvalid"
                  dark
                  color="primary"
                  :label="$t('host.filter_authorized_invalid')"
                />

                <q-checkbox
                  v-model="filters.authorizedNotChecked"
                  dark
                  color="primary"
                  :label="$t('host.filter_authorized_not_checked')"
                />

                <q-separator
                  class="q-ml-md q-mr-sm"
                  dark
                  vertical
                  inset
                />

                <q-checkbox
                  v-model="filters.authorizedExpire"
                  dark
                  color="primary"
                  :label="$t('host.filter_authorized_expire')"
                />

                <q-space />

                <q-badge
                  class="q-badge--home"
                  color="info"
                  :label="filterStats"
                />
              </div>

              <div class="row items-center q-gutter-x-sm">
                <q-input
                  ref="filterField"
                  class="col"
                  v-model="filters.search"
                  standout
                  dense
                  square
                  dark
                  color="primary"
                  clearable
                  :label="$t('host.filter_search')"
                />

                <q-space />

                <q-btn-toggle
                  v-model="filters.viewDetailed"
                  unelevated
                  padding="sm"
                  color="primary"
                  toggle-color="accent"
                  :options="viewDetailedOptions"
                >
                  <template
                    v-for="option in viewDetailedOptions"
                    :key="option.slot"
                    v-slot:[option.slot]
                  >
                    <q-tooltip>{{ $t(option.tooltip) }}</q-tooltip>
                  </template>
                </q-btn-toggle>
              </div>
            </div>
          </q-card-section>

          <q-separator dark vertical />

          <q-card-actions class="justify-center" vertical>
            <div class="self-center">
              <q-btn
                unelevated
                size="lg"
                padding="xs"
                :color="hosts.length > 0 ? 'primary' : 'accent'"
                icon="add_box"
                @click="addHost"
              />
              <q-tooltip>{{ $t('host.tooltip_add') }}</q-tooltip>
            </div>

            <q-separator dark spaced />

            <div class="row no-wrap items-center">
              <div>
                <q-btn
                  unelevated
                  size="lg"
                  padding="xs"
                  color="primary"
                  icon="file_upload"
                  @click="importHosts"
                />
                <q-tooltip>{{ $t('host.tooltip_import') }}</q-tooltip>
              </div>

              <q-separator dark vertical spaced />

              <div>
                <q-btn
                  unelevated
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
      </q-card>
    </div>

    <q-scroll-area id="hosts-scroll-area" class="col">
      <q-virtual-scroll
         :class="{ 'q-mt-lg': filters.viewDetailed !== true }"
        :items="filteredHosts"
        scroll-target="#hosts-scroll-area > q-scrollarea__container"
        :virtual-scroll-item-size="filters.viewDetailed ? 400 : 56"
      >
        <template v-slot="{ item: host, index }">
          <host-item
            :key="index"
            class="q-mx-md"
            :class="filters.viewDetailed ? 'q-my-lg' : 'q-my-xs q-card--dense'"
            :host="host"
            :locked="processing.includes(host.id)"
            :detailed="filters.viewDetailed"
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
import HostsImportDialog from 'components/HostsImportDialog.vue';
import HostsExportDialog from 'components/HostsExportDialog.vue';
import HostItem from 'components/HostItem.vue';

export default defineComponent({
  name: 'HomePage',

  components: {
    HostItem,
  },

  data() {
    return {
      processing: [],

      viewDetailedOptions: [
        {
          icon: 'view_headline',
          value: false,
          slot: 's1',
          tooltip: 'host.tooltip_view_dense',
        },
        {
          icon: 'view_agenda',
          value: true,
          slot: 's2',
          tooltip: 'host.tooltip_view_detailed',
        },
      ],
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

    filterStats() {
      return this.$t('host.filter_stats', {
        selected: this.filteredSelectedHosts.length,
        filtered: this.filteredHosts.length,
        total: this.hosts.length,
      });
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
          component: HostsImportDialog,
        })
        .onOk(() => {
          this.readHosts();
        });
    },

    exportHosts() {
      this.$q
        .dialog({
          component: HostsExportDialog,
        });
    },

    verifySelectedHosts() {
      this.processing = this.filteredSelectedHosts.map((h) => h.id);

      const hostsClones = this.filteredSelectedHosts.map((h) => JSON.parse(JSON.stringify(h)));

      return hostsClones
        .reduce(
          (acc, host) => acc.then(() => window.sslCertAPI
            .verifyHost(host)
            .then((history) => window.sslCertAPI.writeHostHistory(host, history))
            .catch(() => {})
            .then(() => {
              const srcHost = this.hosts.find((h) => h.id === host.id);

              if (srcHost) {
                this.$store.dispatch('hosts/selectHost', { host: srcHost, selected: false });
              }

              this.readHosts();
              this.processing = this.processing.filter((hId) => hId !== host.id);
            })),
          Promise.resolve(),
        ).then(() => {
          this.processing = [];
        });
    },

    pageStyleFn(offset, height) {
      return {
        height: `${ height - offset }px`,
      };
    },

    onKeyDown(evt) {
      if ((evt.metaKey === true || evt.ctrlKey === true) && evt.code === 'KeyF' && this.$refs.filterField) {
        this.$refs.filterField.focus();
        evt.preventDefault();
      }
    },
  },

  mounted() {
    this.readHosts();
    window.addEventListener('keydown', this.onKeyDown, true);
  },

  beforeUnmount() {
    window.removeEventListener('keydown', this.onKeyDown, true);
  },
});
</script>
