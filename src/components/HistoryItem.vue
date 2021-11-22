<template>
  <div v-if="isHistory" class="q-mt-lg row no-wrap items-center" style="margin-left: -16px; margin-right: -16px">
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

      <div class="q-pl-sm">
        {{ history.ts }}
      </div>
    </q-chip>

    <q-separator class="col q-my-lg" />
  </div>

  <div class="q-gutter-y-sm">
    <div class="row items-center q-gutter-x-sm">
      <q-badge
        v-if="history.fingerprint"
        class="q-py-none no-border-radius text-subtitle2"
        :color="history.fingerprintChanged === 1 ? 'warning' : 'dark'"
        outline
      >
        <q-icon class="q-mr-xs" size="20px" name="fingerprint" />

        {{ history.fingerprint }}
        <q-tooltip v-if="history.fingerprintChanged === 1">{{ $t('certificate.tooltip_fingerprint_changed') }}</q-tooltip>
      </q-badge>

      <q-badge
        v-if="certificateData"
        class="q-py-none no-border-radius text-subtitle2"
        :color="certificateData.bitsColor"
        outline
      >
        <q-icon class="q-mr-xs" size="20px" name="straighten" />

        {{ $tc('certificate.bits', certificateData.bits) }}
        <q-tooltip>{{ certificateData.bitsTooltip }}</q-tooltip>
      </q-badge>
    </div>

    <div v-if="history.errors.length > 0">
      <div class="row items-center q-gutter-sm">
        <q-badge
          v-for="(error, i) in history.errors"
          :key="i"
          class="q-py-none q-px-sm no-border-radius text-subtitle2"
          color="negative"
          outline
        >
          {{ error.code }}

          <q-tooltip>{{ error.type }}: {{ error.code }}</q-tooltip>
        </q-badge>
      </div>
    </div>

    <q-list
      v-if="certificateData"
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
            class="q-py-none q-px-sm no-border-radius text-subtitle2"
            style="margin-right: -14px"
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
            class="q-py-none q-px-sm no-border-radius text-subtitle2"
            style="margin-right: -14px"
            :color="certificateData.validToExpired ? 'negative' : (certificateData.validToAboutToExpire ? 'warning' : 'positive')"
            outline
            :label="certificateData.validToExpireLabel"
          />
        </q-item-section>
      </q-item>

      <q-expansion-item
        class="bg-secondary"
        dense
        dark
        header-class="text-italic"
        :label="`${ $tc('certificate.certificate', history.certificates.length) } - ${ $t('certificate.details') }`"
      >
        <div
          v-for="(certificate, i) in history.certificates"
          :key="i"
          class="q-pb-sm relative-position"
        >
          <q-badge
            class="absolute-bottom-right q-ma-sm q-px-md no-border-radius text-subtitle2"
            style="z-index: 1"
            color="secondary"
            transparent
            :label="$t('certificate.certificate_pos_of_total', { pos: i + 1, total: history.certificates.length })"
          />

          <q-scroll-area
            class="q-mx-sm"
            style="height: 20em; max-height: 50vh"
          >
            <pre
              class="q-pa-md q-my-none bg-grey-2"
              style="font-size: 10px; white-space: pre-wrap; word-break: break-all"
            ><samp>{{ certificate }}</samp></pre>
          </q-scroll-area>
        </div>
      </q-expansion-item>
    </q-list>
  </div>
</template>

<script>
import { date } from 'quasar';

import {
  durationDay,
  certificateBitsError,
  certificateBitsWarning,
  certificateAboutToExpireDaysWarning,
} from '../store/config.js';

const { formatDate } = date;

export default {
  name: 'HistoryItemComponent',

  props: {
    history: {
      type: Object,
      required: true,
    },

    isHistory: {
      type: Boolean,
      default: false,
    },
  },

  data() {
    return {
      details: false,
    };
  },

  computed: {
    authorizedStateProps() {
      if (this.history.authorized === null) {
        return {
          avatar: {
            icon: 'gpp_maybe',
            color: 'grey-6',
          },
          tooltip: this.$t('certificate.not_checked'),
        };
      }

      return this.history.authorized === 0
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

    certificateData() {
      if (Array.isArray(this.history.certificates) !== true || this.history.certificates.length === 0) {
        return undefined;
      }

      const now = Date.now();
      const cert = this.history.certificates[0];
      const data = {
        subject: cert.subject.CN,
        subjectAlt: cert.subjectaltname,
        issuer: cert.issuer.CN,
        bits: cert.bits,
        // eslint-disable-next-line no-nested-ternary
        bitsColor: cert.bits < certificateBitsError ? 'negative' : (cert.bits < certificateBitsWarning ? 'warning' : 'positive'),
        // eslint-disable-next-line no-nested-ternary
        bitsTooltip: this.$t(`certificate.tooltip_bits_${ cert.bits < certificateBitsError ? 'low' : (cert.bits < certificateBitsWarning ? 'medium' : 'high') }`),
        validFrom: (new Date(cert.valid_from)).valueOf(),
        validTo: (new Date(cert.valid_to)).valueOf(),
      };

      if (Number.isNaN(data.validFrom)) {
        data.validFromText = 'N/A';
        data.validFromExpired = false;
        data.validFromExpireLabel = 'N/A';
      } else {
        data.validFromText = formatDate(data.validFrom, 'YYYY-MM-DD HH:mm:ss Z');
        data.validFromExpired = data.validFrom > now;
        data.validFromExpireLabel = data.validFromExpired ? this.$t('certificate.expire_not_yet_valid') : this.$t('certificate.valid');
      }

      if (Number.isNaN(data.validTo)) {
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
          const diffDays = Math.floor((data.validTo - now) / durationDay);

          if (diffDays < certificateAboutToExpireDaysWarning) {
            data.validToAboutToExpire = true;
          }

          let diff = Math.floor(diffDays / 365);
          if (diff > 0) {
            data.validToExpireLabel = `${ this.$t('certificate.expire_after') } ${ this.$tc('certificate.expire_years', diff) }`;
          } else {
            diff = Math.floor(diffDays / 31);
            if (diff > 0) {
              data.validToExpireLabel = `${ this.$t('certificate.expire_after') } ${ this.$tc('certificate.expire_months', diff) }`;
            } else if (diffDays > 0) {
              data.validToExpireLabel = `${ this.$t('certificate.expire_after') } ${ this.$tc('certificate.expire_days', diffDays) }`;
            } else {
              data.validToExpireLabel = this.$t('certificate.expire_today');
            }
          }
        }
      }

      return data;
    },
  },
};
</script>
