<template>
  <q-dialog
    ref="dialog"
    maximized
    persistent
    @hide="onDialogHide"
  >
    <div class="q-dialog-plugin column no-wrap" style="max-width: 80vw; max-height: 80vh">
      <q-form class="col column no-wrap" @submit="onOkClick">
        <q-card class="col column no-wrap" square>
          <q-card-section class="bg-primary text-white q-mb-md" horizontal>
            <q-card-section class="col">
              <div class="text-subtitle1">
                {{ $t('export.title_export') }}
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

          <q-card-section class="col column relative-position">
            <q-field
              class="col"
              outlined
              square
              readonly
              color="primary"
              :label="$t('export.label_hosts')"
              stack-label
            >
              <q-scroll-area class="col q-mb-xs">
                <q-markup-table
                  class="q-pr-md"
                  flat
                  square
                  dense
                >
                  <thead>
                    <tr>
                      <th v-for="(colName, i) in columnNames" :key="i">
                        <q-checkbox
                          v-model="columns[colName].export"
                          dense
                          color="primary"
                          :label="colName"
                          left-label
                        />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(row, j) in source" :key="j">
                      <td
                        v-for="(colName, i) in columnNames"
                        :key="i"
                        class="export__column-content"
                        :class="{ 'text-grey-5': columns[colName].export !== true }"
                      >{{ row[colName] }}</td>
                    </tr>
                  </tbody>
                </q-markup-table>
              </q-scroll-area>
            </q-field>

            <q-btn
              class="absolute-bottom-right q-ma-md"
              flat
              square
              color="primary"
              size="md"
              padding="sm"
              icon="content_copy"
              @click="onCopyClick"
            />
          </q-card-section>

          <q-card-actions align="between">
            <q-btn
              flat
              color="secondary"
              padding="sm md"
              :label="$t('export.btn_cancel')"
              :disable="processing"
              @click="onCancelClick"
            />
            <q-btn
              type="submit"
              unelevated
              color="primary"
              padding="sm md"
              :label="$t('export.btn_export')"
              :disable="rows.length === 0"
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
import { copyToClipboard, exportFile } from 'quasar';
import { stringify as csvStringify } from 'csv-stringify/browser/esm/sync.js';
import { mapGetters } from 'vuex';

export default defineComponent({
  name: 'HostsExportDialog',

  emits: ['ok', 'hide'],

  data() {
    return {
      processing: false,

      columns: {
        category: {
          export: true,
          extract: (row) => row.category,
        },
        hostname: {
          export: true,
          extract: (row) => row.hostname,
        },
        port: {
          export: true,
          extract: (row) => row.port,
        },
        servername: {
          export: true,
          extract: (row) => row.servername,
        },
        description: {
          export: true,
          extract: (row) => row.description,
        },
        archived: {
          export: true,
          extract: (row) => (row.active !== 1 ? 'TRUE' : 'FALSE'),
        },
        certificateValidationDate: {
          export: true,
          extract: (row) => (row.ts ? (new Date(row.ts)).toISOString() : null),
        },
        certificateValid: {
          export: true,
          extract: (row) => (row.authorized === 1 ? 'TRUE' : 'FALSE'),
        },
        certificateFingerprint: {
          export: true,
          extract: (row) => row.fingerprint,
        },
        certificatePreviousFingerprint: {
          export: false,
          extract: (row) => row.prevFingerprint,
        },
        certificateFingerprintChanged: {
          export: true,
          extract: (row) => (row.fingerprintChanged === 1 ? 'TRUE' : 'FALSE'),
        },
        certificateValidationErrors: {
          export: true,
          extract: (row) => row.errors.map((err) => `[${ err.type }] ${ err.code }`).join(' | '),
        },
        certificateSubject: {
          export: true,
          extract: (row) => (row.certificates.length === 0 ? null : (row.certificates[0].subject || {}).CN),
        },
        certificateSubjectAltName: {
          export: true,
          extract: (row) => (row.certificates.length === 0 ? null : row.certificates[0].subjectaltname),
        },
        certificateIssuer: {
          export: true,
          extract: (row) => (row.certificates.length === 0 ? null : (row.certificates[0].issuer || {}).CN),
        },
        certificateBits: {
          export: true,
          extract: (row) => (row.certificates.length === 0 ? null : row.certificates[0].bits),
        },
        certificateValidFrom: {
          export: true,
          // eslint-disable-next-line no-nested-ternary
          extract: (row) => (row.certificates.length === 0 ? null : (row.certificates[0].valid_from ? (new Date(row.certificates[0].valid_from)).toISOString() : null)),
        },
        certificateValidTo: {
          export: true,
          // eslint-disable-next-line no-nested-ternary
          extract: (row) => (row.certificates.length === 0 ? null : (row.certificates[0].valid_to ? (new Date(row.certificates[0].valid_to)).toISOString() : null)),
        },
        certificateSerialNumber: {
          export: true,
          extract: (row) => (row.certificates.length === 0 ? null : row.certificates[0].serialNumber),
        },
        certificateIssuersChain: {
          export: true,
          extract: (row) => row.certificates.map((cert, i) => `[${ i + 1 }] ${ (cert.issuer || {}).CN }`).join(' | '),
        },
        certificateValidationHistoryLength: {
          export: false,
          extract: (row) => row.historyLength,
        },
        certificatePubKey: {
          export: false,
          extract: (row) => (row.certificates.length === 0 ? null : row.certificates[0].pubkey),
        },
      },
    };
  },

  computed: {
    ...mapGetters('hosts', [
      'filteredHosts',
      'filteredSelectedHosts',
    ]),

    source() {
      return (this.filteredSelectedHosts.length > 0 ? this.filteredSelectedHosts : this.filteredHosts)
        .map((row) => this.columnNames.reduce((acc, colName) => ({
          ...acc,
          [colName]: this.columns[colName].extract(row),
        }), {}));
    },

    rows() {
      const columnNames = this.columnNames.filter((colName) => this.columns[colName].export);

      return this.source
        .map((row) => columnNames.reduce((acc, colName) => ({
          ...acc,
          [colName]: row[colName],
        }), {}));
    },

    columnNames() {
      return Object.keys(this.columns);
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
      if (this.processing === true || this.rows.length === 0) {
        return;
      }

      this.processing = true;

      const csv = csvStringify(this.rows, {
        // columns: {},
        delimiter: ';',
        header: true,
      });

      const status = exportFile(`ssl_cert_manager_hosts_${ Date.now() }.csv`, csv, {
        encoding: 'utf-8',
        mimeType: 'text/csv;charset=utf-8;',
      });

      if (status === true) {
        this.$q.notify({
          type: 'positive',
          message: this.$t('export.msg_save'),
        });
      } else {
        console.error(status);

        this.$q.notify({
          type: 'negative',
          message: this.$t('export.msg_save_error', { error: status }),
        });
      }

      this.processing = false;

      this.$emit('ok');
      this.hide();
    },

    onCopyClick() {
      const csv = csvStringify(this.rows, {
        delimiter: ';',
        header: true,
      });

      copyToClipboard(csv)
        .then(() => {
          this.$q.notify({
            type: 'positive',
            message: this.$t('export.msg_copy'),
          });
        })
        .catch((error) => {
          console.error(error);

          this.$q.notify({
            type: 'negative',
            message: this.$t('export.msg_copy_error', { error }),
          });
        });
    },

    onCancelClick() {
      this.hide();
    },
  },
});
</script>
