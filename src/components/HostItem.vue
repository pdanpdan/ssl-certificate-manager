<template>
  <q-item>
    <q-item-section side>
      <q-checkbox
        :model-value="host.selected"
        dense
        color="primary"
        @update:model-value="selectHost"
      />
    </q-item-section>

    <q-item-section>
      <q-item-label>
        <strong v-if="host.category">
          {{ host.category }} /
        </strong>

        {{ host.description }}
      </q-item-label>

      <q-item-label caption>
        {{ host.hostname }}:{{ host.port }}

        <strong v-if="host.servername && host.servername !== host.hostname">
          / {{ host.servername }}
        </strong>
      </q-item-label>

      <q-item-label caption>
        {{ host.fingerprint }}
        {{ host }}
      </q-item-label>
    </q-item-section>

    <q-item-section side>
      <div class="row no-wrap items-center">
        <q-btn
          flat
          dense
          padding="xs"
          color="negative"
          icon="delete"
          :disable="host.active !== 1"
          @click="deleteHost"
        />

        <q-btn
          flat
          dense
          padding="xs"
          color="primary"
          icon="edit"
          @click="editHost"
        />
      </div>
    </q-item-section>
  </q-item>
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

    deleteHost() {
      this.$q
        .dialog({
          title: this.$t('host.title_delete'),
          ok: {
            label: this.$t('host.btn_delete'),
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
  },
};
</script>
