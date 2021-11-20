<template>
  <q-card>
    <q-card-section horizontal>
      <q-card-actions>
        <q-checkbox
          :model-value="host.selected"
          color="primary"
          @update:model-value="selectHost"
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
          @click="archiveHost"
        />

        <q-btn
          v-else
          flat
          size="lg"
          padding="xs"
          color="positive"
          icon="unarchive"
          @click="unarchiveHost"
        />

        <q-btn
          flat
          size="lg"
          padding="xs"
          color="primary"
          icon="edit"
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
  },

  emits: ['update', 'select'],

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
  },
};
</script>
