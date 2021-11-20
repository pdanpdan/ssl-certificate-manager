<template>
  <q-card>
    <q-card-section horizontal>
      <q-card-actions vertical class="justify-center">
        <q-checkbox
          :model-value="host.selected"
          color="primary"
          :disable="processing || locked"
          @update:model-value="selectHost"
        />

        <q-btn
          flat
          size="lg"
          padding="xs"
          color="accent"
          icon="policy"
          :loading="processing || locked"
          @click="verifyHost"
        />
      </q-card-actions>

      <q-separator vertical inset />

      <q-card-section class="col">
        <div class="text-subtitle1">
          <strong v-if="host.category">
            {{ host.category }} /
          </strong>

          {{ host.description }}
        </div>

        <div class="text-subtitle2">
          {{ host.hostname }}:{{ host.port }}

          <strong v-if="host.servername && host.servername !== host.hostname">
            / {{ host.servername }}
          </strong>
        </div>

        <div class="text-body2">
          {{ host.fingerprint }}
          {{ host }}
        </div>
      </q-card-section>

      <q-separator vertical inset />

      <q-card-section class="col">
        <div class="text-subtitle1">
          <strong v-if="host.category">
            {{ host.category }} /
          </strong>

          {{ host.description }}
        </div>

        <div class="text-subtitle2">
          {{ host.hostname }}:{{ host.port }}

          <strong v-if="host.servername && host.servername !== host.hostname">
            / {{ host.servername }}
          </strong>
        </div>

        <div class="text-body2">
          {{ host.fingerprint }}
          {{ host }}
        </div>
      </q-card-section>

      <q-separator vertical inset />

      <q-card-actions vertical class="justify-center">
        <q-btn
          v-if="host.active === 1"
          flat
          size="lg"
          padding="xs"
          color="negative"
          icon="archive"
          :disable="processing || locked"
          @click="archiveHost"
        />

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

        <q-btn
          flat
          size="lg"
          padding="xs"
          color="primary"
          icon="edit"
          :disable="processing || locked"
          @click="editHost"
        />
      </q-card-actions>
    </q-card-section>
  </q-card>
</template>

<script>
import HostEditDialog from 'components/HostEditDialog.vue';

export default {
  name: 'HostItemComponent',

  props: {
    host: {
      type: Object,
      required: true,
    },

    locked: Boolean,
  },

  emits: ['update', 'select'],

  data() {
    return {
      processing: false,
    };
  },

  methods: {
    selectHost(status) {
      this.$emit('select', this.host, status);
    },

    editHost() {
      this.$q
        .dialog({
          component: HostEditDialog,

          componentProps: {
            host: this.host,
          },
        })
        .onOk(() => {
          this.$emit('update');
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
            this.$emit('update');
          }));
    },

    unarchiveHost() {
      window.sslCertAPI
        .writeHost({
          id: this.host.id,
          active: 1,
        })
        .then(() => {
          this.$emit('update');
        });
    },

    verifyHost() {
      this.processing = true;

      const hostClone = JSON.parse(JSON.stringify(this.host));

      window.sslCertAPI
        .verifyHost(hostClone)
        .then((history) => window.sslCertAPI.writeHostHistory(hostClone, history))
        .then(() => {
          this.$emit('update');

          this.processing = false;
        })
        .catch(() => {
          this.processing = false;
        });
    },
  },
};
</script>
