<template>
  <div class="q-gutter-y-sm">
    <div class="row items-center q-gutter-x-sm">
      <q-badge
        v-if="history.fingerprint"
        class="q-py-none"
        :color="history.fingerprintChanged === 1 ? 'warning' : 'dark'"
        outline
      >
        <q-icon class="q-mr-xs" size="20px" name="fingerprint" />

        {{ history.fingerprint }}
      </q-badge>

      <q-badge
        v-if="certificateData"
        class="q-py-none"
        :color="certificateData.bitsColor"
        outline
      >
        <q-icon class="q-mr-xs" size="20px" name="straighten" />

        {{ $tc('certificate.bits', certificateData.bits) }}
      </q-badge>

      <q-icon
        v-if="hideAuthorized !== true"
        class="q-mr-xs"
        size="sm"
        v-bind="authorizedIconProps"
      />

      <q-space />

      <q-badge
        v-if="hideTs !== true"
        class="q-py-none"
        color="dark"
        outline
      >
        <q-icon class="q-mr-xs" size="20px" name="schedule" />

        {{ history.ts }}
      </q-badge>
    </div>

    <div v-if="history.errors.length > 0">
      <div class="row items-center q-gutter-sm">
        <q-badge
          v-for="(error, i) in history.errors"
          :key="i"
          class="q-py-xs q-px-sm"
          color="negative"
          outline
        >
          {{ error.code }}

          <q-tooltip class="q-py-sm q-px-md text-caption">{{ error.type }}: {{ error.code }}</q-tooltip>
        </q-badge>
      </div>
    </div>

    <q-list
      v-if="certificateData"
      class="rounded-borders"
      bordered
      separator
      dense
    >
      <q-item>
        <q-item-section side style="min-width: 12em">
          <q-item-label class="text-italic">{{ $t('certificate.issuer') }}</q-item-label>
        </q-item-section>
        <q-item-section>
          <q-item-label class="text-weight-bold">{{ certificateData.issuer }}</q-item-label>
        </q-item-section>
      </q-item>

      <q-item>
        <q-item-section side style="min-width: 12em">
          <q-item-label class="text-italic">{{ $t('certificate.subject') }}</q-item-label>
        </q-item-section>
        <q-item-section>
          <q-item-label class="text-weight-bold">{{ certificateData.subject }}</q-item-label>
        </q-item-section>
      </q-item>

      <q-item v-if="certificateData.subjectAlt">
        <q-item-section side style="min-width: 12em">
          <q-item-label class="text-italic">{{ $t('certificate.subject_alt') }}</q-item-label>
        </q-item-section>
        <q-item-section>
          <q-item-label class="text-weight-bold">{{ certificateData.subjectAlt }}</q-item-label>
        </q-item-section>
      </q-item>

      <q-item>
        <q-item-section side style="min-width: 12em">
          <q-item-label class="text-italic">{{ $t('certificate.valid_from') }}</q-item-label>
        </q-item-section>
        <q-item-section>
          <q-item-label class="text-weight-bold">{{ certificateData.validFromText }}</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-badge
            class="q-py-xs q-px-sm"
            :color="certificateData.validFromExpired ? 'negative' : 'positive'"
            outline
            :label="certificateData.validFromExpireLabel"
          />
        </q-item-section>
      </q-item>

      <q-item>
        <q-item-section side style="min-width: 12em">
          <q-item-label class="text-italic">{{ $t('certificate.valid_to') }}</q-item-label>
        </q-item-section>
        <q-item-section>
          <q-item-label class="text-weight-bold">{{ certificateData.validToText }}</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-badge
            class="q-py-xs q-px-sm"
            :color="certificateData.validToExpired ? 'negative' : (certificateData.validToAboutToExpire ? 'warning' : 'positive')"
            outline
            :label="certificateData.validToExpireLabel"
          />
        </q-item-section>
      </q-item>
    </q-list>

    <q-list class="rounded-borders overflow-hidden" dense bordered>
      <q-expansion-item
        dense
        dark
        header-class="text-italic bg-secondary"
        :label="$t('certificate.details')"
      >
        <template v-for="(certificate, i) in history.certificates" :key="i">
          <q-separator v-if="i > 0" />

          <q-scroll-area class="q-my-xs" style="height: 20em; max-height: 50vh">
            <pre
              class="q-pa-md q-my-none"
              style="font-size: 10px; white-space: pre-wrap; word-break: break-all"
            ><samp>{{ certificate }}</samp></pre>
          </q-scroll-area>
        </template>
      </q-expansion-item>
    </q-list>
  </div>
</template>

<script>
import { date } from 'quasar';

import { certificateBitsError, certificateBitsWarning, certificateAboutToExpireDaysWarning } from '../store/config.js';

const { formatDate, getDateDiff } = date;

export default {
  name: 'HistoryItemComponent',

  props: {
    history: {
      type: Object,
      required: true,
    },

    hideTs: Boolean,
    hideAuthorized: Boolean,
  },

  data() {
    return {
      details: false,
    };
  },

  computed: {
    authorizedIconProps() {
      if (this.history.authorized === null) {
        return {
          name: 'gpp_maybe',
          color: 'grey-6',
        };
      }

      return this.history.authorized === 0
        ? {
          name: 'gpp_bad',
          color: 'negative',
        }
        : {
          name: 'gpp_good',
          color: 'positive',
        };
    },

    certificateData() {
      if (Array.isArray(this.history.certificates) !== true || this.history.certificates.length === 0) {
        return undefined;
      }

      const now = new Date();
      const cert = this.history.certificates[0];
      const data = {
        subject: cert.subject.CN,
        subjectAlt: cert.subjectaltname,
        issuer: cert.issuer.CN,
        bits: cert.bits,
        // eslint-disable-next-line no-nested-ternary
        bitsColor: cert.bits < certificateBitsError ? 'negative' : (cert.bits < certificateBitsWarning ? 'warning' : 'positive'),
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

          if (diff < certificateAboutToExpireDaysWarning) {
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
};
</script>
