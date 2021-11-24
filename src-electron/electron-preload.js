import { contextBridge } from 'electron';
import { app } from '@electron/remote';
import { resolve as pathResolve } from 'path';
import { readFileSync, writeFileSync } from 'fs';
import * as initSqlJs from 'sql.js';
import * as tls from 'tls';

import isDeepEqual from '../src/utils/isDeepEqual.js';

const DB_VERSION = 1;

const sqlite = {};

const sqliteRes2Rows = (res, mapFn) => {
  if (res.length === 0) {
    return [];
  }

  const [{ columns, values }] = res;

  return (values || []).map((value, valueIndex) => {
    const row = {};

    columns.forEach((column, columnIndex) => {
      row[column] = value[columnIndex];
    });

    return typeof mapFn === 'function'
      ? mapFn({ ...row }, valueIndex)
      : row;
  });
};

const parseErrorsAndCertificates = (row) => {
  try {
    row.certificates = JSON.parse(row.certificates) || [];
  } catch (e) {
    row.certificates = [];
  }

  try {
    row.errors = JSON.parse(row.errors) || [];
  } catch (e) {
    row.errors = [];
  }

  row.fingerprintChanged = row.prevFingerprint && row.prevFingerprint !== row.fingerprint
    ? 1
    : 0;

  return row;
};

const sqlEscape = (value) => (value === undefined ? null : value);

const certificateChangedKeys = [
  'authorized',
  'fingerprint',
  'certificates',
  'errors',
];

const reExtractError = /^(?:\s*error\s*:)?\s*(.+)/i;

contextBridge.exposeInMainWorld('sslCertAPI', {
  openDb() {
    sqlite.basePath = app.getPath('userData');
    sqlite.fileName = 'ssl_certs.sqlite';
    // sqlite.fileName = 'ssl_certs_v1.sqlite';
    sqlite.filePath = pathResolve(sqlite.basePath, sqlite.fileName);
    sqlite.initSqlJs = initSqlJs;

    sqlite.dbPromise = new Promise((resolve, reject) => {
      sqlite
        .initSqlJs({
          // Required to load the wasm binary asynchronously. Of course, you can host it wherever you want
          // You can omit locateFile completely when running in node
          locateFile: (file) => `sql.js/${ file }`,
        })
        .then((SQL) => {
          sqlite.SQL = SQL;

          try {
            const dbFile = readFileSync(sqlite.filePath);
            sqlite.db = new SQL.Database(dbFile);
          } catch (err) {
            sqlite.db = new SQL.Database();
          }

          sqlite.db.run(`
            CREATE TABLE IF NOT EXISTS config (
              id INTEGER PRIMARY KEY,
              version INTEGER NOT NULL DEFAULT ${ DB_VERSION },
              verificationDaysError INTEGER NOT NULL DEFAULT 30,
              verificationDaysWarning INTEGER NOT NULL DEFAULT 7,
              certificateBitsError INTEGER NOT NULL DEFAULT 2048,
              certificateBitsWarning INTEGER NOT NULL DEFAULT 4096,
              certificateAboutToExpireDaysWarning INTEGER NOT NULL DEFAULT 90
            )
          `);

          const config = sqliteRes2Rows(sqlite.db.exec('SELECT * FROM config WHERE id = 1'));

          if (config.length === 0 || config[0].version !== 1) {
            sqlite.db.run(`
              CREATE TABLE IF NOT EXISTS hosts (
                id INTEGER PRIMARY KEY,
                hostname TEXT NOT NULL,
                servername TEXT NOT NULL DEFAULT '',
                port INTEGER NOT NULL DEFAULT 443,
                description TEXT NOT NULL DEFAULT '',
                category TEXT NOT NULL DEFAULT '',
                active INTEGER NOT NULL DEFAULT 1,
                idHistory INTEGER DEFAULT NULL
              )
            `);

            sqlite.db.run(`
              CREATE TABLE IF NOT EXISTS hosts_history (
                id INTEGER PRIMARY KEY,
                idHost INTEGER NOT NULL,
                ts DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                authorized INTEGER NOT NULL DEFAULT 0,
                fingerprint TEXT DEFAULT NULL,
                certificates TEXT DEFAULT NULL,
                errors TEXT DEFAULT NULL
              )
            `);

            sqlite.db.run(`
              CREATE INDEX IF NOT EXISTS idx_hosts_history_idHost
              ON hosts_history (idHost, ts DESC)
            `);

            sqlite.db.run('REPLACE INTO config (id, version) VALUES (1, ?)', [DB_VERSION]);
          }

          writeFileSync(sqlite.filePath, Buffer.from(sqlite.db.export()));

          resolve(sqlite.db);
        })
        .catch((err) => {
          reject(err);
        });
    });

    return sqlite.dbPromise;
  },

  closeDb() {
    if (sqlite.db !== undefined) {
      writeFileSync(sqlite.filePath, Buffer.from(sqlite.db.export()));
      sqlite.db.close();
      sqlite.db = undefined;
      sqlite.dbPromise = undefined;
    }
  },

  getDbLocation() {
    return sqlite.filePath;
  },

  readConfig() {
    if (sqlite.dbPromise === undefined) {
      return Promise.reject(new Error('Cannot open db'));
    }

    return sqlite.dbPromise.then((db) => {
      const rows = sqliteRes2Rows(db.exec('SELECT * FROM config WHERE id = 1'));

      return {
        verificationDaysError: 30,
        verificationDaysWarning: 7,
        certificateBitsError: 2048,
        certificateBitsWarning: 4096,
        certificateAboutToExpireDaysWarning: 90,
        ...rows[0],
      };
    });
  },

  writeConfig(config) {
    if (sqlite.dbPromise === undefined) {
      return Promise.reject(new Error('Cannot open db'));
    }

    if (config !== Object(config)) {
      return Promise.reject(new Error('Invalid config definition'));
    }

    return sqlite.dbPromise.then((db) => {
      db.run(`
        UPDATE config
        SET
          verificationDaysError = COALESCE(?, verificationDaysError),
          verificationDaysWarning = COALESCE(?, verificationDaysWarning),
          certificateBitsError = COALESCE(?, certificateBitsError),
          certificateBitsWarning = COALESCE(?, certificateBitsWarning),
          certificateAboutToExpireDaysWarning = COALESCE(?, certificateAboutToExpireDaysWarning)
        WHERE id = 1
      `, [
        sqlEscape(config.verificationDaysError),
        sqlEscape(config.verificationDaysWarning),
        sqlEscape(config.certificateBitsError),
        sqlEscape(config.certificateBitsWarning),
        sqlEscape(config.certificateAboutToExpireDaysWarning),
      ]);

      writeFileSync(sqlite.filePath, Buffer.from(db.export()));
    });
  },

  readHosts(listAll) {
    if (sqlite.dbPromise === undefined) {
      return Promise.reject(new Error('Cannot open db'));
    }

    return sqlite.dbPromise.then((db) => {
      const res = db.exec(`
        SELECT
          h.*,
          hh.ts,
          hh.authorized,
          hh.fingerprint,
          hh.certificates,
          hh.errors,
          CASE
            WHEN hh.id IS NOT NULL
            THEN (
              SELECT hh2.fingerprint
              FROM hosts_history hh2
              WHERE hh2.idHost = hh.idHost
                AND hh2.ts < hh.ts
                AND hh2.fingerprint IS NOT NULL
              ORDER BY ts DESC
              LIMIT 1
            )
            ELSE NULL
          END AS prevFingerprint,
          (SELECT count(*) FROM hosts_history hh2 WHERE hh2.idHost = hh.idHost) AS historyLength
        FROM hosts h
          LEFT JOIN hosts_history hh ON hh.id = h.idHistory
        ${ listAll === true ? '' : 'WHERE h.active = 1' }
        ORDER BY
          h.active DESC,
          h.category NULLS LAST,
          h.description,
          h.hostname,
          h.port,
          h.servername
      `);

      return sqliteRes2Rows(res, parseErrorsAndCertificates);
    });
  },

  readHostHistory(host) {
    if (sqlite.dbPromise === undefined) {
      return Promise.reject(new Error('Cannot open db'));
    }

    if (host !== Object(host) || Number.isNaN(host.id) === true) {
      return Promise.reject(new Error('Invalid host definition'));
    }

    return sqlite.dbPromise.then((db) => {
      const res = db.exec(`
        SELECT
          hh.*,
          (
            SELECT hh2.fingerprint
            FROM hosts_history hh2
            WHERE hh2.idHost = hh.idHost
              AND hh2.ts < hh.ts
              AND hh2.fingerprint IS NOT NULL
            ORDER BY ts DESC
            LIMIT 1
          ) AS prevFingerprint
        FROM hosts_history hh
        WHERE idHost = ?
        ORDER BY
          hh.ts DESC
      `, [host.id]);

      return sqliteRes2Rows(res, parseErrorsAndCertificates);
    });
  },

  writeHost(host) {
    if (sqlite.dbPromise === undefined) {
      return Promise.reject(new Error('Cannot open db'));
    }

    if (host !== Object(host)) {
      return Promise.reject(new Error('Invalid host definition'));
    }

    return sqlite.dbPromise.then((db) => {
      if (host.id === undefined) {
        db.run(`
          INSERT INTO hosts (
            hostname,
            servername,
            port,
            description,
            category,
            active
          )
          VALUES (?, ?, ?, ?, ?, ?)
        `, [
          sqlEscape(host.hostname),
          sqlEscape(host.servername),
          sqlEscape(host.port),
          sqlEscape(host.description),
          sqlEscape(host.category),
          host.active ? 1 : 0,
        ]);
      } else {
        db.run(`
          UPDATE hosts
          SET
            hostname = COALESCE(?, hostname),
            servername = COALESCE(?, servername),
            port = COALESCE(?, port),
            description = COALESCE(?, description),
            category = COALESCE(?, category),
            active = COALESCE(?, active)
          WHERE id = ?
        `, [
          sqlEscape(host.hostname),
          sqlEscape(host.servername),
          sqlEscape(host.port),
          sqlEscape(host.description),
          sqlEscape(host.category),
          // eslint-disable-next-line no-nested-ternary
          host.active === undefined ? null : (host.active ? 1 : 0),
          sqlEscape(host.id),
        ]);
      }

      writeFileSync(sqlite.filePath, Buffer.from(db.export()));
    });
  },

  deleteHost(host) {
    if (sqlite.dbPromise === undefined) {
      return Promise.reject(new Error('Cannot open db'));
    }

    if (host !== Object(host) || host.id === undefined) {
      return Promise.reject(new Error('Invalid host definition'));
    }

    return sqlite.dbPromise.then((db) => {
      db.run(`
        DELETE FROM hosts
        WHERE id = ?
      `, [
        sqlEscape(host.id),
      ]);

      writeFileSync(sqlite.filePath, Buffer.from(db.export()));
    });
  },

  writeHostHistory(host, history) {
    if (sqlite.dbPromise === undefined) {
      return Promise.reject(new Error('Cannot open db'));
    }

    if (host !== Object(host) || Number.isNaN(host.id) === true) {
      return Promise.reject(new Error('Invalid host definition'));
    }

    if (history !== Object(history)) {
      return Promise.reject(new Error('Invalid history definition'));
    }

    const changed = certificateChangedKeys.reduce((acc, key) => acc || isDeepEqual(host[key], history[key]) !== true, !host.idHistory);

    return sqlite.dbPromise.then((db) => {
      if (changed === true) {
        const res = db.exec(`
          INSERT INTO hosts_history (
            idHost,
            authorized,
            fingerprint,
            certificates,
            errors
          )
          VALUES (?, ?, ?, ?, ?)
          RETURNING id
        `, [
          sqlEscape(host.id),
          sqlEscape(history.authorized),
          sqlEscape(history.fingerprint),
          JSON.stringify(history.certificates || []),
          JSON.stringify(history.errors || []),
        ]);

        const rows = sqliteRes2Rows(res);

        if (rows.length > 0 && rows[0].id) {
          db.run(`
            UPDATE hosts
            SET idHistory = ?
            WHERE id = ?
          `, [
            sqlEscape(rows[0].id),
            sqlEscape(host.id),
          ]);
        }
      } else {
        db.run(`
          UPDATE hosts_history
          SET ts = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [
          sqlEscape(host.idHistory),
        ]);
      }

      writeFileSync(sqlite.filePath, Buffer.from(db.export()));
    });
  },

  verifyHost(host) {
    return new Promise((resolve) => {
      const options = {
        host: host.hostname,
        servername: host.servername || host.hostname,
        port: host.port || 443,

        // ca: rootCas,

        // <boolean> If set to false, then the socket will automatically end the writable side when the readable side ends
        // If the socket option is set, this option has no effect. See the allowHalfOpen option of net.Socket for details
        // Default: false
        allowHalfOpen: true,

        // <boolean> If not false, the server certificate is verified against the list of supplied CAs
        // An 'error' event is emitted if verification fails; err.code contains the OpenSSL error code
        // Default: true
        rejectUnauthorized: false,

        // <Function> A callback function to be used (instead of the builtin tls.checkServerIdentity() function) when checking the server's host name (or the provided servername when explicitly set) against the certificate
        // This should return an <Error> if verification fails
        // The method should return undefined if the servername and cert are verified
        // checkServerIdentity: (servername, cert) => {},

        sessionTimeout: 3,
      };

      const history = {
        idHost: host.id,
        authorized: 0,
        fingerprint: null,
        certificates: [],
        errors: [],
      };

      const tlsSocket = tls.connect(options, () => {
        if (tlsSocket.authorized) {
          history.authorized = 1;
        } else {
          history.errors.push({
            type: 'authorization',
            code: tlsSocket.authorizationError,
          });
        }

        const certs = new Set();
        let peerCert = tlsSocket.getPeerCertificate(true);

        while (peerCert && certs.has(peerCert) !== true) {
          certs.add(peerCert);

          const cert = { ...peerCert };

          if (cert.pubkey) {
            cert.pubkey = cert.pubkey.toString('base64');
          }
          if (cert.raw) {
            cert.raw = cert.raw.toString('base64');
          }
          cert.issuerCertificate = undefined;

          if (history.certificates.length === 0) {
            history.fingerprint = cert.fingerprint256 || cert.fingerprint;
          }

          history.certificates.push(cert);

          peerCert = peerCert.issuerCertificate;
        }

        tlsSocket.end();
      });

      tlsSocket.on('timeout', () => {
        if (history.certificates.length === 0) {
          history.errors.push({
            type: 'connection',
            code: 'HANDSHAKE_TIMEOUT',
          });
        }

        tlsSocket.destroy();

        resolve(history);
      });

      tlsSocket.on('error', (error) => {
        const errorText = String(error);
        const errorMatch = reExtractError.exec(errorText);

        history.errors.push({
          type: 'connection',
          code: errorMatch !== null ? errorMatch[1] : errorText,
        });

        tlsSocket.destroy();

        resolve(history);
      });

      tlsSocket.on('end', () => {
        tlsSocket.destroy();

        resolve(history);
      });

      tlsSocket.setTimeout(3000);
    });
  },
});
