<template>
  <q-card class="shadow-12" square>
    <q-card-section horizontal>
      <q-card-actions vertical :class="actionsAlign">
        <q-checkbox
          :model-value="host.selected"
          v-bind="selectionProps"
          color="primary"
          :disable="processing || locked || host.active !== 1"
          @update:model-value="selectHost"
        />
      </q-card-actions>

      <q-separator vertical />

      <q-card-actions vertical :class="actionsAlign">
        <div>
          <q-btn
            v-bind="actionProps"
            :color="host.active === 1 ? 'accent' : 'primary'"
            icon="policy"
            :loading="processing || locked"
            :disable="host.active !== 1"
            @click="verifyHost"
          />
          <q-tooltip>{{ $t('host.tooltip_validate') }}</q-tooltip>
        </div>

        <template v-if="computedDetailed === true && host.historyLength > 1">
          <q-separator spaced />

          <div>
            <q-btn
              v-bind="actionProps"
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

      <q-card-section class="col">
        <div class="q-gutter-y-sm">
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

            <q-badge
              v-if="computedDetailed !== true"
              class="q-badge--host"
              color="dark"
              outline
            >
              <q-icon
                class="q-mr-sm"
                size="28px"
                :color="authorizedStateProps.avatar.color"
                :name="authorizedStateProps.avatar.icon"
              >
                <q-tooltip>{{ authorizedStateProps.tooltip }}</q-tooltip>
              </q-icon>

              <div class="text-caption" :class="authorizedTimeProps.class">
                {{ host.ts || 'N/A' }}
                <q-tooltip v-if="authorizedTimeProps.tooltip">{{ authorizedTimeProps.tooltip }}</q-tooltip>
              </div>
            </q-badge>
          </div>

          <template v-if="computedDetailed === true">
            <div class="q-mt-none row no-wrap items-center q-list__separator--history">
              <q-separator class="col q-my-lg" />

              <q-chip
                class="q-chip--history-status"
                square
                outline
                size="md"
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
          </template>
        </div>
      </q-card-section>

      <q-separator vertical />

      <q-card-actions vertical :class="actionsAlign">
        <div v-if="detailed !== true">
          <q-btn
            v-bind="actionProps"
            color="primary"
            :icon="localDetailed ? 'view_headline' : 'view_agenda'"
            @click="localDetailed = localDetailed !== true"
          />
          <q-tooltip>{{ $t(`host.tooltip_view_${ localDetailed ? 'dense' : 'detailed' }`) }}</q-tooltip>
        </div>

        <template v-if="computedDetailed">
          <q-separator v-if="detailed !== true" spaced />

          <template v-if="host.active === 1">
            <div>
              <q-btn
                v-bind="actionProps"
                color="primary"
                icon="settings"
                :disable="processing || locked"
                @click="editHost"
              />
              <q-tooltip>{{ $t('host.tooltip_edit') }}</q-tooltip>
            </div>

            <template v-if="computedDetailed === true">
              <q-separator spaced />

              <div v-if="host.historyLength > 0">
                <q-btn
                  v-bind="actionProps"
                  color="negative"
                  icon="archive"
                  :disable="processing || locked"
                  @click="archiveHost"
                />
                <q-tooltip>{{ $t('host.tooltip_archive') }}</q-tooltip>
              </div>

              <div v-else>
                <q-btn
                  v-bind="actionProps"
                  color="negative"
                  icon="delete_outline"
                  :disable="processing || locked"
                  @click="deleteHost"
                />
                <q-tooltip>{{ $t('host.tooltip_delete') }}</q-tooltip>
              </div>
            </template>
          </template>

          <template v-else>
            <div>
              <q-btn
                v-bind="actionProps"
                color="positive"
                icon="unarchive"
                :disable="processing || locked"
                @click="unarchiveHost"
              />
              <q-tooltip>{{ $t('host.tooltip_unarchive') }}</q-tooltip>
            </div>

            <template v-if="computedDetailed === true && host.historyLength === 0">
              <q-separator spaced />

              <div>
                <q-btn
                  v-bind="actionProps"
                  color="negative"
                  icon="delete"
                  :disable="processing || locked"
                  @click="deleteHost"
                />
                <q-tooltip>{{ $t('host.tooltip_delete') }}</q-tooltip>
              </div>
            </template>
          </template>
        </template>
      </q-card-actions>
    </q-card-section>
  </q-card>
</template>

<script>
import { defineComponent } from 'vue';
import { mapState, mapActions } from 'vuex';

import HostEdit from 'components/HostEditDialog.vue';
import HistoryItem from 'components/HistoryItem.vue';
import { getFullHostName } from 'store/hosts/state.js';

export default defineComponent({
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

    detailed: Boolean,
  },

  data() {
    return {
      processing: false,

      localDetailed: false,

      showHistory: false,
      history: [],
    };
  },

  computed: {
    ...mapState('config', [
      'config',
    ]),

    computedDetailed() {
      return this.detailed === true || this.localDetailed === true;
    },

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

    actionsAlign() {
      return this.computedDetailed === true ? 'justify-start' : 'justify-center';
    },

    actionProps() {
      return this.computedDetailed === true
        ? {
          size: 'lg',
          padding: 'xs',
          flat: true,
        }
        : {
          size: 'md',
          padding: 'xs',
          flat: true,
          style: 'margin-left: 5px; margin-right: 5px',
        };
    },

    selectionProps() {
      return this.computedDetailed === true
        ? {}
        : {
          style: {
            paddingLeft: '10px',
            paddingRight: '10px',
          },
          dense: true,
        };
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

    detailed() {
      this.localDetailed = false;
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
});
</script>
