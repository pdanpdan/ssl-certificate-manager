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
        <div class="row no-wrap items-center">
          <div class="text-subtitle1">
            <q-badge
              v-if="host.category"
              class="q-py-none q-px-sm text-subtitle1"
              color="secondary"
              :label="host.category"
            />

            {{ host.description }}
          </div>

          <div class="text-subtitle2">
            {{ host.hostname }}:{{ host.port }}

            <strong v-if="host.servername && host.servername !== host.hostname">
              / {{ host.servername }}
            </strong>
          </div>
        </div>

        <div v-if="authorizedMarkerProps || certificateData" class="row items-center justify-between">
          <q-badge
            v-if="authorizedMarkerProps"
            outline
            v-bind="authorizedMarkerProps.badge"
          >
            <q-icon size="20px" v-bind="authorizedMarkerProps.icon" />

            {{ authorizedMarkerProps.badgeLabel }}

            <q-tooltip class="q-py-sm q-px-md text-caption">{{ authorizedMarkerProps.tooltipLabel }}</q-tooltip>
          </q-badge>

          <q-space v-else />

          <q-badge
            v-if="certificateData"
            :color="certificateData.bitsColor"
            outline
          >
            <q-icon size="20px" name="straighten" />

            {{ $tc('certificate.bits', certificateData.bits) }}
          </q-badge>
        </div>

        <div>
          <q-badge
            v-if="host.fingerprint"
            :color="host.fingerprintChanged === 1 ? 'warning' : 'grey-8'"
            outline
          >
            <q-icon size="20px" name="fingerprint" />

            {{ host.fingerprint }}
          </q-badge>
        </div>
      </q-card-section>

      <q-separator vertical inset />

      <q-card-section class="col q-gutter-y-sm">
        <div v-if="certificateData">
          <div class="text-subtitle1">
            {{ $t('certificate.issuer') }}:
            <strong>{{ certificateData.issuer }}</strong>
          </div>

          <div class="text-subtitle1">
            {{ $t('certificate.subject') }}:
            <strong>{{ certificateData.subject }}</strong>
          </div>

          <div v-if="certificateData.subjectAlt" class="text-subtitle1">
            {{ $t('certificate.subject_alt') }}:
            <strong>{{ certificateData.subjectAlt }}</strong>
          </div>

          <div class="row items-center justify-between">
            <div class="text-subtitle1">
              {{ $t('certificate.valid_from') }}:
              <strong>{{ certificateData.validFromText }}</strong>
            </div>

            <q-badge
              class="q-py-xs q-px-sm"
              :color="certificateData.validFromExpired ? 'negative' : 'positive'"
              outline
              :label="certificateData.validFromExpireLabel"
            />
          </div>

          <div class="row items-center justify-between">
            <div class="text-subtitle1">
              {{ $t('certificate.valid_to') }}:
              <strong>{{ certificateData.validToText }}</strong>
            </div>

            <q-badge
              class="q-py-xs q-px-sm"
              :color="certificateData.validToExpired ? 'negative' : (certificateData.validToAboutToExpire ? 'warning' : 'positive')"
              outline
              :label="certificateData.validToExpireLabel"
            />
          </div>
        </div>

        <div v-if="host.errors.length > 0" class="row items-center q-gutter-sm">
          <q-badge
            v-for="(error, i) in host.errors"
            :key="i"
            class="q-py-xs q-px-sm"
            color="negative"
            outline
          >
            {{ error.code }}

            <q-tooltip class="q-py-sm q-px-md text-caption">{{ error.type }}: {{ error.code }}</q-tooltip>
          </q-badge>
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
import { date } from 'quasar';

import HostEditDialog from 'components/HostEditDialog.vue';

const { formatDate, getDateDiff } = date;

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

  computed: {
    authorizedMarkerProps() {
      if (!this.host) {
        return undefined;
      }

      if (this.host.authorized === null) {
        return {
          icon: {
            name: 'gpp_maybe',
            color: 'grey-6',
          },
          badge: {
            color: 'grey-6',
          },
          badgeLabel: this.$t('certificate.not_checked'),
          tooltipLabel: this.$t('certificate.not_checked'),
        };
      }

      return this.host.authorized === 0
        ? {
          icon: {
            name: 'gpp_bad',
            color: 'negative',
          },
          badge: {
            color: 'negative',
          },
          badgeLabel: this.host.ts,
          tooltipLabel: `${ this.$t('certificate.invalid') } @ ${ this.host.ts }`,
        }
        : {
          icon: {
            name: 'gpp_good',
            color: 'positive',
          },
          badge: {
            color: 'positive',
          },
          badgeLabel: this.host.ts,
          tooltipLabel: `${ this.$t('certificate.valid') } @ ${ this.host.ts }`,
        };
    },

    certificateData() {
      if (!this.host || Array.isArray(this.host.certificates) !== true || this.host.certificates.length === 0) {
        return undefined;
      }

      const now = new Date();
      const cert = this.host.certificates[0];
      const data = {
        subject: cert.subject.CN,
        subjectAlt: cert.subjectaltname,
        issuer: cert.issuer.CN,
        bits: cert.bits,
        // eslint-disable-next-line no-nested-ternary
        bitsColor: cert.bits < 2048 ? 'negative' : (cert.bits < 4096 ? 'warning' : 'positive'),
        validFrom: new Date(cert.valid_from),
        validTo: new Date(cert.valid_to),
      };

      if (Number.isNaN(data.validFrom.valueOf())) {
        data.validFromText = 'N/A';
        data.validFromExpired = false;
        data.validFromExpireLabel = 'N/A';
      } else {
        data.validFromText = formatDate(data.validFrom, 'YYYY-MM-DD HH:mm:ss Z');
        data.validFromExpired = data.validFrom > now;
        data.validFromExpireLabel = data.validFromExpired ? this.$t('certificate.expire_not_yet_valid') : this.$t('certificate.valid');
      }

      if (Number.isNaN(data.validTo.valueOf())) {
        data.validToText = 'N/A';
        data.validToExpired = false;
        data.validToAboutToExpire = false;
        data.validToExpireLabel = 'N/A';
      } else {
        data.validToText = formatDate(data.validTo, 'YYYY-MM-DD HH:mm:ss Z');
        data.validToExpired = data.validTo < now;
        data.validToAboutToExpire = false;

        if (data.validToExpired) {
          data.validToExpireLabel = this.$t('certificate.expire_expired');
        } else {
          let diff = getDateDiff(data.validTo, now, 'days');

          if (diff < 45) {
            data.validToAboutToExpire = true;
          }

          diff = getDateDiff(data.validTo, now, 'years');
          if (diff > 0) {
            data.validToExpireLabel = `${ this.$t('certificate.expire_after') } ${ this.$tc('certificate.expire_years', diff) }`;
          } else {
            diff = getDateDiff(data.validTo, now, 'months');
            if (diff > 0) {
              data.validToExpireLabel = `${ this.$t('certificate.expire_after') } ${ this.$tc('certificate.expire_months', diff) }`;
            } else {
              diff = getDateDiff(data.validTo, now, 'days');
              if (diff > 0) {
                data.validToExpireLabel = `${ this.$t('certificate.expire_after') } ${ this.$tc('certificate.expire_days', diff) }`;
              } else {
                data.validToExpireLabel = this.$t('certificate.expire_today');
              }
            }
          }
        }
      }

      return data;
    },
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
