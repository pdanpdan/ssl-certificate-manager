<template>
  <q-dialog ref="dialog" persistent @hide="onDialogHide">
    <div class="q-dialog-plugin">
      <q-form @submit="onOkClick">
        <q-card square>
          <q-card-section class="bg-primary text-white q-mb-md" horizontal>
            <q-card-section class="col">
              <div class="text-subtitle1">
                {{ $t('config.title_config') }}
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
              v-for="conf in options"
              :key="conf.key"
              v-model.number="config[conf.key]"
              type="number"
              outlined
              square
              color="primary"
              input-class="text-right"
              :min="0"
              :step="1"
              autofocus
              :label="$t(conf.label)"
            />

            <q-input
              :model-value="dbLocation"
              outlined
              square
              color="primary"
              readonly
              :label="$t('config.label_db_location')"
            />
          </q-card-section>

          <q-card-actions align="between">
            <q-btn
              flat
              color="secondary"
              padding="sm md"
              :label="$t('config.btn_cancel')"
              :disable="processing"
              @click="onCancelClick"
            />
            <q-btn
              type="submit"
              unelevated
              color="primary"
              padding="sm md"
              :label="$t('config.btn_save')"
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
import { mapActions } from 'vuex';

export default defineComponent({
  name: 'ConfigDialog',

  emits: ['ok', 'hide'],

  data() {
    const { config } = this.$store.state.config;

    return {
      processing: false,

      dbLocation: null,

      options: [
        {
          key: 'verificationDaysError',
          label: 'config.label_verification_days_error',
        },
        {
          key: 'verificationDaysWarning',
          label: 'config.label_verification_days_warning',
        },
        {
          key: 'certificateBitsError',
          label: 'config.label_certificate_bits_error',
        },
        {
          key: 'certificateBitsWarning',
          label: 'config.label_certificate_bits_warning',
        },
        {
          key: 'certificateAboutToExpireDaysWarning',
          label: 'config.label_certificate_about_to_expire_days_warning',
        },
      ],

      config: {
        ...config,
      },
    };
  },

  methods: {
    ...mapActions('config', [
      'setConfig',
    ]),

    show() {
      this.dbLocation = window.sslCertAPI.getDbLocation();

      this.$refs.dialog.show();
    },

    hide() {
      this.$refs.dialog.hide();
    },

    onDialogHide() {
      this.$emit('hide');
    },

    onOkClick() {
      if (this.processing === true) {
        return;
      }

      this.processing = true;

      this.setConfig(this.config)
        .then(() => {
          this.$q.notify({
            type: 'positive',
            message: this.$t('config.msg_save'),
          });

          this.processing = false;

          this.$emit('ok');
          this.hide();
        })
        .catch((error) => {
          console.error(error);

          this.$q.notify({
            type: 'negative',
            message: this.$t('config.msg_save_error', { error }),
          });

          this.processing = false;
        });
    },

    onCancelClick() {
      this.hide();
    },
  },
});
</script>
