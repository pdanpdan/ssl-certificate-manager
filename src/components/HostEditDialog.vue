<template>
  <q-dialog ref="dialog" persistent @hide="onDialogHide">
    <div class="q-dialog-plugin">
      <q-form @submit="onOkClick">
        <q-card square>
          <q-card-section class="bg-primary text-white q-mb-md" horizontal>
            <q-card-section class="col">
              <div class="text-subtitle1">
                {{ titleCard }}
              </div>
            </q-card-section>

            <q-card-actions>
              <q-btn
                flat
                size="lg"
                padding="none"
                color="white"
                icon="close"
                :disable="processing"
                @click="onCancelClick"
              />
            </q-card-actions>
          </q-card-section>

          <q-card-section class="column no-wrap q-gutter-y-sm">
            <q-input
              :model-value="hostname"
              outlined
              square
              color="primary"
              required
              autofocus
              hide-bottom-space
              :rules="requiredRules"
              :label="`${ $t('host.label_hostname') } *`"
              @update:model-value="onHostnameChange"
            />

            <q-input
              v-model="category"
              outlined
              square
              color="primary"
              :label="$t('host.label_category')"
            />

            <q-input
              v-model="port"
              outlined
              square
              color="primary"
              required
              :label="$t('host.label_port')"
            />

            <q-input
              v-model="servername"
              outlined
              square
              color="primary"
              :label="$t('host.label_servername')"
              :readonly="hasHistory"
            />

            <q-input
              v-model="description"
              outlined
              square
              color="primary"
              :label="$t('host.label_description')"
            />
          </q-card-section>

          <q-card-actions align="between">
            <q-btn
              flat
              color="secondary"
              padding="sm md"
              :label="$t('host.btn_cancel')"
              :disable="processing"
              @click="onCancelClick"
            />
            <q-btn
              type="submit"
              unelevated
              color="primary"
              padding="sm md"
              :label="labelBtnOk"
              :loading="processing"
            />
          </q-card-actions>
        </q-card>
      </q-form>
    </div>
  </q-dialog>
</template>

<script>
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'HostEditDialog',

  props: {
    host: Object,
  },

  emits: ['ok', 'hide'],

  data() {
    return {
      processing: false,

      id: undefined,
      hostname: '',
      servername: '',
      port: 443,
      description: '',
      category: '',
      active: 1,

      ...this.host,
    };
  },

  computed: {
    titleCard() {
      return this.id === undefined ? this.$t('host.title_add') : this.$t('host.title_update');
    },

    labelBtnOk() {
      return this.id === undefined ? this.$t('host.btn_add') : this.$t('host.btn_update');
    },

    requiredRules() {
      return [
        (val) => (typeof val === 'string' && val.trim().length > 0) || this.$t('validation.required'),
      ];
    },

    hasHistory() {
      return this.host === Object(this.host) && this.host.historyLength > 0;
    },
  },

  methods: {
    show() {
      this.$refs.dialog.show();
    },

    hide() {
      this.$refs.dialog.hide();
    },

    onDialogHide() {
      this.$emit('hide');
    },

    onOkClick() {
      if (
        this.processing === true
        || typeof this.hostname !== 'string'
        || this.hostname.trim().length === 0
      ) {
        return;
      }

      const host = {
        id: this.id,
        hostname: this.hostname,
        servername: this.servername || this.hostname,
        port: this.port || 443,
        description: this.description || this.hostname,
        category: this.category,
        active: this.active,
      };

      this.processing = true;

      window.sslCertAPI
        .writeHost(host)
        .then(() => {
          this.$q.notify({
            type: 'positive',
            message: this.$t(`host.msg_${ this.id === undefined ? 'add' : 'update' }`, { hostname: this.hostname }),
          });

          this.processing = false;

          this.$emit('ok', { host });
          this.hide();
        })
        .catch((error) => {
          console.error(error);

          this.$q.notify({
            type: 'negative',
            message: this.$t(`host.msg_${ this.id === undefined ? 'add' : 'update' }_error`, { hostname: this.hostname, error }),
          });

          this.processing = false;
        });
    },

    onCancelClick() {
      this.hide();
    },

    onHostnameChange(value) {
      if (
        this.hasHistory !== true
        && (typeof this.servername !== 'string' || this.servername.trim().length === 0 || this.servername === this.hostname)
      ) {
        this.servername = value;
      }

      if (typeof this.description !== 'string' || this.description.trim().length === 0 || this.description === this.hostname) {
        this.description = value;
      }

      this.hostname = value;
    },
  },
});
</script>
