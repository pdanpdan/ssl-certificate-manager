<template>
  <q-card>
    <q-card-section horizontal>
      <q-card-actions class="justify-center" vertical>
        <q-checkbox
          v-if="host.active === 1"
          :model-value="host.selected"
          color="primary"
          :disable="processing || locked"
          @update:model-value="selectHost"
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
          :loading="processing || locked"
          :disable="host.active !== 1"
          @click="verifyHost"
        >
          <q-badge
            v-if="host.historyLength > 0"
            style="margin: 3px"
            floating
            color="secondary"
            transparent
            :label="host.historyLength"
          />
        </q-btn>
      </q-card-actions>

      <q-separator vertical inset />

      <q-card-section class="col q-gutter-y-sm">
        <div class="row items-center q-gutter-x-sm">
          <q-icon size="sm" v-bind="authorizedIconProps" />

          <div class="text-subtitle1 text-weight-bold">
            {{ host.description }}
          </div>

          <q-badge
            v-if="host.category"
            class="q-py-none"
            color="secondary"
            outline
          >
            <q-icon class="q-mr-xs" size="20px" name="tag" />

            {{ host.category }}
          </q-badge>

          <q-space />

          <q-badge
            v-if="authorizedTimeBadgeProps"
            class="q-py-none"
            outline
            v-bind="authorizedTimeBadgeProps"
          >
            <q-icon class="q-mr-xs" size="20px" name="schedule" />

            {{ host.ts }}
          </q-badge>

          <q-badge
            class="q-py-none"
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

        <template v-if="host.ts">
          <q-separator spaced />

          <history-item
            :history="host"
            hide-ts
            hide-authorized
          />
        </template>
      </q-card-section>

      <q-separator vertical inset />

      <q-card-actions class="justify-center" vertical>
        <template v-if="host.active === 1">
          <q-btn
            flat
            size="lg"
            padding="xs"
            color="primary"
            icon="edit"
            :disable="processing || locked"
            @click="editHost"
          />

          <q-separator spaced />

          <q-btn
            flat
            size="lg"
            padding="xs"
            color="negative"
            icon="archive"
            :disable="processing || locked"
            @click="archiveHost"
          />
        </template>

        <q-btn
          v-else
          flat
          size="lg"
          padding="xs"
          color="positive"
          icon="unarchive"
          :disable="processing || locked"
          @click="unarchiveHost"
        />
      </q-card-actions>
    </q-card-section>
  </q-card>
</template>

<script>
import { mapActions } from 'vuex';

import HostEdit from 'components/HostEditDialog.vue';
import HistoryItem from 'components/HistoryItem.vue';
import { durationDay, verificationDaysError, verificationDaysWarning } from '../store/config.js';

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
    };
  },

  computed: {
    authorizedIconProps() {
      if (this.host.authorized === null) {
        return {
          name: 'gpp_maybe',
          color: 'grey-6',
        };
      }

      return this.host.authorized === 0
        ? {
          name: 'gpp_bad',
          color: 'negative',
        }
        : {
          name: 'gpp_good',
          color: 'positive',
        };
    },

    authorizedTimeBadgeProps() {
      if (!this.host.ts || Number.isNaN((new Date(this.host.ts)).valueOf())) {
        return undefined;
      }

      const now = Date.now();
      const ts = (new Date(this.host.ts)).valueOf();
      const daysOld = (now - ts) / durationDay;

      return {
        // eslint-disable-next-line no-nested-ternary
        color: daysOld > verificationDaysError
          ? 'negative'
          : (
            daysOld > verificationDaysWarning
              ? 'warning'
              : 'positive'
          ),
      };
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

    archiveHost() {
      this.$q
        .dialog({
          title: this.$t('host.title_archive'),
          ok: {
            label: this.$t('host.btn_archive'),
            color: 'negative',
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
