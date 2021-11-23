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
                {{ $t('import.title_import') }}
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

          <q-card-section class="col column scroll">
            <q-input
              class="col"
              v-model="source"
              autogrow
              outlined
              square
              color="primary"
              autofocus
              :label="$t('import.label_source')"
              :hint="$t('import.hint_source')"
            />
          </q-card-section>

          <q-card-section v-if="rows.length > 0" class="col column q-gutter-y-sm">
            <div class="row no-wrap items-center q-col-gutter-x-sm">
              <q-input
                v-for="(column, i) in columnNames"
                :key="i"
                class="col"
                v-model.number="columns[column]"
                type="number"
                dense
                outlined
                square
                color="primary"
                input-class="text-right"
                :min="0"
                :max="columnNames.length - 1"
                :step="1"
                :label="$t('import.label_column_nr_for', { column })"
                stack-label
              />
            </div>

            <q-field
              class="col"
              outlined
              square
              readonly
              color="primary"
              :label="$t('import.label_processed')"
              stack-label
            >
              <q-scroll-area class="col q-mb-xs">
                <q-markup-table class="q-pr-md" flat square>
                  <thead>
                    <tr>
                      <th v-for="(column, i) in columnNames" :key="i" class="text-uppercase">{{ column }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(row, j) in rows" :key="j">
                      <td v-for="(column, i) in columnNames" :key="i">{{ row[column] }}</td>
                    </tr>
                  </tbody>
                </q-markup-table>
              </q-scroll-area>
            </q-field>
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
import { parse as csvParse } from 'csv-parse/sync';

import { getFullHostName } from '../store/hosts/state.js';

export default {
  name: 'HostsImportDialog',

  emits: ['ok', 'hide'],

  data() {
    return {
      processing: false,

      source: '',
      parsed: [],

      columns: {
        hostname: 0,
        port: 1,
        servername: 2,
        description: 3,
        category: 4,
      },
    };
  },

  computed: {
    labelBtnOk() {
      return this.rows.length > 0 ? this.$t('import.btn_import') : this.$t('import.btn_process');
    },

    columnNames() {
      return Object.keys(this.columns);
    },

    importedKeys() {
      return this.$store.state.hosts.hosts.map((host) => this.columnNames.map((column) => host[column]).join('#'));
    },

    rows() {
      const rows = this.parsed
        .map((row) => this.columnNames
          .reduce((acc, column) => ({
            ...acc,
            [column]: row[this.columns[column]],
          }), {}))
        .filter((row) => typeof row.hostname === 'string' && row.hostname.trim().length > 0)
        .map((row) => ({
          ...row,
          port: row.port || 443,
          servername: row.servername || row.hostname,
          description: row.description || row.hostname,
        }))
        .map((row) => ({
          ...row,
          key: this.columnNames.map((column) => row[column]).join('#'),
        }));

      return rows.filter((row, i) => rows.slice(i + 1).findIndex((r) => r.key === row.key) === -1);
    },
  },

  watch: {
    source() {
      if (this.parsed.length > 0) {
        this.parsed = [];
      }
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
      if (this.rows.length > 0) {
        this.importRows();
      } else {
        this.processRows();
      }
    },

    processRows() {
      this.parsed = csvParse(this.source, {
        delimiter: [';', ','],
        relax: true,
        relax_column_count: true,
        skip_empty_lines: true,
        skip_lines_with_empty_values: true,
        trim: true,
      });
    },

    importRows() {
      if (this.processing === true || this.rows.length === 0) {
        return;
      }

      this.processing = true;

      const q = this.rows
        .filter((row) => this.importedKeys.includes(row.key) !== true)
        .reduce((acc, row) => acc
          .then(() => {
            const host = {
              ...row,
              active: 1,
            };

            const hostname = getFullHostName(row);

            return window.sslCertAPI
              .writeHost(host)
              .then(() => {
                this.$q.notify({
                  type: 'positive',
                  message: this.$t('host.msg_add', { hostname }),
                });
              })
              .catch((error) => {
                console.error(error);

                this.$q.notify({
                  type: 'negative',
                  message: this.$t('host.msg_add_error', { hostname, error }),
                });
              });
          })
          .catch(() => {}), Promise.resolve());

      q
        .then(() => {
          this.processing = false;

          this.$emit('ok');
          this.hide();
        })
        .catch(() => {
          this.processing = false;
        });
    },

    onCancelClick() {
      this.hide();
    },
  },
};
</script>
