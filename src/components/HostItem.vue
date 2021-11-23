<template>
  <q-card class="shadow-12" square>
    <q-card-section horizontal>
      <q-card-actions vertical>
        <q-checkbox
          :model-value="host.selected"
          color="primary"
          :disable="processing || locked || host.active !== 1"
          @update:model-value="selectHost"
        />
      </q-card-actions>

      <q-separator vertical />

      <q-card-actions vertical>
        <div>
          <q-btn
            flat
            size="lg"
            padding="xs"
            :color="host.active === 1 ? 'accent' : 'primary'"
            icon="policy"
            :loading="processing || locked"
            :disable="host.active !== 1"
            @click="verifyHost"
          />
          <q-tooltip>{{ $t('host.tooltip_validate') }}</q-tooltip>
        </div>

        <template v-if="host.historyLength > 1">
          <q-separator spaced />

          <div>
            <q-btn
              flat
              size="lg"
              padding="xs"
              color="primary"
              :icon="showHistory ? 'history' : 'history_toggle_off'"
              @click="showHistory = showHistory !== true"
            >
              <q-badge
                style="margin: 3px"
                floating
                color="info"
                transparent
                :label="host.historyLength"
              />
            </q-btn>
            <q-tooltip>{{ $t(`host.tooltip_history_${ showHistory ? 'hide' : 'show' }`) }}</q-tooltip>
          </div>
        </template>
      </q-card-actions>

      <q-separator vertical />

      <q-card-section class="col q-gutter-y-sm">
        <div class="row items-center q-gutter-x-sm">
          <div class="text-subtitle1 text-weight-bold">
            {{ host.description }}
          </div>

          <q-badge
            v-if="host.category"
            class="q-badge--host"
            color="dark"
            outline
          >
            <q-icon class="q-mr-xs" size="20px" name="tag" />

            {{ host.category }}
          </q-badge>

          <q-space />

          <q-badge
            class="q-badge--host"
            color="dark"
            outline
          >
            <q-icon class="q-mr-xs" size="20px" name="cable" />

            {{ host.hostname }}:{{ host.port }}

            <strong v-if="host.servername && host.servername !== host.hostname">
              / {{ host.servername }}
            </strong>
          </q-badge>
        </div>

        <div class="q-mt-none row no-wrap items-center" style="margin-left: -16px; margin-right: -16px">
          <q-separator class="col q-my-lg" />

          <q-chip
            square
            size="md"
            color="grey-3"
          >
            <q-avatar
              font-size="24px"
              text-color="white"
              v-bind="authorizedStateProps.avatar"
            >
              <q-tooltip>{{ authorizedStateProps.tooltip }}</q-tooltip>
            </q-avatar>

            <div class="q-pl-sm" :class="authorizedTimeProps.class">
              {{ host.ts || 'N/A' }}
              <q-tooltip v-if="authorizedTimeProps.tooltip">{{ authorizedTimeProps.tooltip }}</q-tooltip>
            </div>
          </q-chip>

          <q-separator class="col q-my-lg" />
        </div>

        <history-item v-if="host.ts" :history="host" />

        <template v-if="showHistory && history.length > 0">
          <history-item
            v-for="(hist, i) in history"
            :key="i"
            :history="hist"
            is-history
          />
        </template>
      </q-card-section>

      <q-separator vertical />

      <q-card-actions vertical>
        <template v-if="host.active === 1">
          <div>
            <q-btn
              flat
              size="lg"
              padding="xs"
              color="primary"
              icon="settings"
              :disable="processing || locked"
              @click="editHost"
            />
            <q-tooltip>{{ $t('host.tooltip_edit') }}</q-tooltip>
          </div>

          <q-separator spaced />

          <div v-if="host.historyLength > 0">
            <q-btn
              flat
              size="lg"
              padding="xs"
              color="warning"
              icon="archive"
              :disable="processing || locked"
              @click="archiveHost"
            />
            <q-tooltip>{{ $t('host.tooltip_archive') }}</q-tooltip>
          </div>

          <div v-else>
            <q-btn
              flat
              size="lg"
              padding="xs"
              color="negative"
              icon="delete_outline"
              :disable="processing || locked"
              @click="deleteHost"
            />
            <q-tooltip>{{ $t('host.tooltip_delete') }}</q-tooltip>
          </div>
        </template>

        <template v-else>
          <div>
            <q-btn
              flat
              size="lg"
              padding="xs"
              color="positive"
              icon="unarchive"
              :disable="processing || locked"
              @click="unarchiveHost"
            />
            <q-tooltip>{{ $t('host.tooltip_unarchive') }}</q-tooltip>
          </div>

          <template v-if="host.historyLength === 0">
            <q-separator spaced />

            <div>
              <q-btn
                flat
                size="lg"
                padding="xs"
                color="negative"
                icon="delete"
                :disable="processing || locked"
                @click="deleteHost"
              />
              <q-tooltip>{{ $t('host.tooltip_delete') }}</q-tooltip>
            </div>
          </template>
        </template>
      </q-card-actions>
    </q-card-section>
  </q-card>
</template>

<script>
import { mapState, mapActions } from 'vuex';

import HostEdit from 'components/HostEditDialog.vue';
import HistoryItem from 'components/HistoryItem.vue';
import { getFullHostName } from '../store/hosts/state.js';

export default {
  name: 'HostItemComponent',

  components: {
    HistoryItem,
  },

  props: {
    host: {
      type: Object,
      required: true,
    },

    locked: Boolean,
  },

  data() {
    return {
      processing: false,

      showHistory: false,
      history: [],
    };
  },

  computed: {
    ...mapState('config', [
      'config',
    ]),

    authorizedStateProps() {
      if (this.host.authorized === null) {
        return {
          avatar: {
            icon: 'gpp_maybe',
            color: 'grey-6',
          },
          tooltip: this.$t('certificate.not_checked'),
        };
      }

      return this.host.authorized === 0
        ? {
          avatar: {
            icon: 'gpp_bad',
            color: 'negative',
          },
          tooltip: this.$t('certificate.invalid'),
        }
        : {
          avatar: {
            icon: 'gpp_good',
            color: 'positive',
          },
          tooltip: this.$t('certificate.valid'),
        };
    },

    authorizedTimeProps() {
      if (!this.host.ts || Number.isNaN((new Date(this.host.ts)).valueOf())) {
        return {
          class: 'text-grey-6',
          tooltip: this.$t('certificate.not_checked'),
        };
      }

      const now = Date.now();
      const ts = (new Date(this.host.ts)).valueOf();
      const daysOld = (now - ts) / this.config.durationDay;

      // eslint-disable-next-line no-nested-ternary
      return daysOld > this.config.verificationDaysError
        ? {
          class: 'text-negative',
          tooltip: this.$t('certificate.tooltip_checked_long_ago'),
        }
        : (
          daysOld > this.config.verificationDaysWarning
            ? {
              class: 'text-warning',
              tooltip: this.$t('certificate.tooltip_checked_not_recently'),
            }
            : {
              class: 'text-positive',
              tooltip: this.$t('certificate.tooltip_checked_recently'),
            }
        );
    },

    computedHostName() {
      return getFullHostName(this.host);
    },
  },

  watch: {
    showHistory(val) {
      if (val === true) {
        window.sslCertAPI
          .readHostHistory({ id: this.host.id })
          .then((history) => {
            this.history = history.slice(1);
          })
          .catch(() => {
            this.history = [];
          });
      }
    },
  },

  methods: {
    ...mapActions('hosts', [
      'readHosts',
    ]),

    selectHost(selected) {
      this.$store.dispatch('hosts/selectHost', { host: this.host, selected });
    },

    editHost() {
      this.$q
        .dialog({
          component: HostEdit,

          componentProps: {
            host: this.host,
          },
        })
        .onOk(() => {
          this.readHosts();
        });
    },

    deleteHost() {
      this.$q
        .dialog({
          title: `${ this.$t('host.title_delete') }?`,
          message: this.computedHostName,
          ok: {
            label: this.$t('host.btn_delete'),
            color: 'negative',
            unelevated: true,
          },
          cancel: {
            label: this.$t('host.btn_cancel'),
            color: 'secondary',
            flat: true,
          },
          focus: 'cancel',
        })
        .onOk(() => window.sslCertAPI
          .deleteHost({
            id: this.host.id,
          })
          .then(() => {
            this.readHosts();
          }));
    },

    archiveHost() {
      this.$q
        .dialog({
          title: `${ this.$t('host.title_archive') }?`,
          message: this.computedHostName,
          ok: {
            label: this.$t('host.btn_archive'),
            color: 'warning',
            unelevated: true,
          },
          cancel: {
            label: this.$t('host.btn_cancel'),
            color: 'secondary',
            flat: true,
          },
          focus: 'cancel',
        })
        .onOk(() => window.sslCertAPI
          .writeHost({
            id: this.host.id,
            active: 0,
          })
          .then(() => {
            this.readHosts();
          }));
    },

    unarchiveHost() {
      window.sslCertAPI
        .writeHost({
          id: this.host.id,
          active: 1,
        })
        .then(() => {
          this.readHosts();
        });
    },

    verifyHost() {
      this.processing = true;

      const hostClone = JSON.parse(JSON.stringify(this.host));

      window.sslCertAPI
        .verifyHost(hostClone)
        .then((history) => window.sslCertAPI.writeHostHistory(hostClone, history))
        .then(() => {
          this.readHosts();

          this.processing = false;
        })
        .catch(() => {
          this.processing = false;
        });
    },
  },
};
</script>
