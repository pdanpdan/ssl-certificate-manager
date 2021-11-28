<template>
  <div v-if="isHistory" class="q-mt-lg row no-wrap items-center q-list__separator--history">
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

      <div class="q-pl-sm">
        {{ history.ts }}
      </div>
    </q-chip>

    <q-separator class="col q-my-lg" />
  </div>

  <div class="q-gutter-y-sm">
    <div class="row items-start q-gutter-x-sm">
      <div class="column items-start q-gutter-y-sm">
        <q-badge
          v-if="history.fingerprint"
          class="q-badge--history"
          :color="history.fingerprintChanged === 1 ? 'warning' : 'dark'"
          outline
        >
          <q-icon class="q-mr-xs" size="20px" name="fingerprint" />

          {{ history.fingerprint }}
          <q-tooltip v-if="history.fingerprintChanged === 1">{{ $t('certificate.tooltip_fingerprint_changed') }}</q-tooltip>
        </q-badge>

        <q-badge
          v-if="history.fingerprintChanged"
          class="q-badge--history"
          color="info"
          outline
        >
          <q-icon class="q-mr-xs" size="20px" name="fingerprint" />

          {{ history.prevFingerprint }}
          <q-tooltip>{{ $t('certificate.tooltip_fingerprint_prev') }}</q-tooltip>
        </q-badge>
      </div>

      <q-badge
        v-if="certificateData"
        class="q-badge--history"
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
          class="q-badge--history"
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
            class="q-badge--history"
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
            class="q-badge--history"
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
            class="absolute-bottom-right q-ma-sm q-px-md text-subtitle2"
            style="z-index: 1"
            color="secondary"
            transparent
            :label="$t('certificate.certificate_pos_of_total', { pos: i + 1, total: history.certificates.length })"
          />

          <q-scroll-area
            class="q-mx-sm"
            style="height: 40em; max-height: 50vh"
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
import { defineComponent } from 'vue';
import { mapState } from 'vuex';

import { getAuthorizedStateProps, getCertificateData } from 'store/hosts/state.js';

export default defineComponent({
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
    ...mapState('config', [
      'config',
    ]),

    authorizedStateProps() {
      return getAuthorizedStateProps(this.history.authorized, this.$t);
    },

    certificateData() {
      return getCertificateData(this.history.certificates, this.config, this.$t, this.$tc);
    },
  },
});
</script>
