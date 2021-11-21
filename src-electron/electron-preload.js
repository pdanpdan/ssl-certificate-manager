import { contextBridge } from 'electron';
import { app } from '@electron/remote';
import * as tls from 'tls';

const {
  resolve: pathResolve,
} = require('path');
const {
  readFileSync,
  writeFileSync,
} = require('fs');
const initSqlJs = require('sql.js');

const sqlite = {};

const sqliteRes2Rows = (res, mapFn) => {
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

  return row;
};

contextBridge.exposeInMainWorld('sslCertAPI', {
  openDb() {
    sqlite.basePath = app.getPath('userData');
    sqlite.fileName = 'ssl_certs.sqlite';
    sqlite.filePath = pathResolve(sqlite.basePath, sqlite.fileName);
    sqlite.initSqlJs = initSqlJs;

    return sqlite
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
          ON hosts_history (idHost, ts);
        `);

        writeFileSync(sqlite.filePath, Buffer.from(sqlite.db.export()));
      });
  },

  closeDb() {
    try {
      if (sqlite.db !== undefined) {
        writeFileSync(sqlite.filePath, Buffer.from(sqlite.db.export()));
        sqlite.db.close();
        sqlite.db = undefined;
      }

      return Promise.resolve();
    } catch (err) {
      return Promise.reject(err);
    }
  },

  readHosts(listAll) {
    if (sqlite.db === undefined) {
      return Promise.reject(new Error('Cannot open db'));
    }

    try {
      const res = sqlite.db.exec(`
        SELECT
          h.*,
          hh.ts,
          hh.authorized,
          hh.fingerprint,
          hh.certificates,
          hh.errors,
          CASE
            WHEN
              hh.id IS NOT NULL
              AND coalesce((
                SELECT hh2.fingerprint
                FROM hosts_history hh2
                WHERE hh2.idHost = hh.idHost
                  AND hh2.ts < hh.ts
                  AND hh2.fingerprint IS NOT NULL
                ORDER BY ts DESC
                LIMIT 1
              ), hh.fingerprint) != hh.fingerprint
            THEN 1
            ELSE 0
          END AS fingerprintChanged,
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

      return Promise.resolve(sqliteRes2Rows(res, parseErrorsAndCertificates));
    } catch (err) {
      return Promise.reject(err);
    }
  },

  readHostHistory(host) {
    if (sqlite.db === undefined) {
      return Promise.reject(new Error('Cannot open db'));
    }

    if (host !== Object(host) || Number.isNaN(host.id) === true) {
      return Promise.reject(new Error('Invalid host definition'));
    }

    try {
      const res = sqlite.db.exec(`
        SELECT
          hh.*,
          CASE
            WHEN
              coalesce((
                SELECT hh2.fingerprint
                FROM hosts_history hh2
                WHERE hh2.idHost = hh.idHost
                  AND hh2.ts < hh.ts
                  AND hh2.fingerprint IS NOT NULL
                ORDER BY ts DESC
                LIMIT 1
              ), hh.fingerprint) != hh.fingerprint
            THEN 1
            ELSE 0
          END AS fingerprintChanged
        FROM hosts_history hh
        WHERE idHost = ?
        ORDER BY
          hh.ts DESC
      `, [host.id]);

      return Promise.resolve(sqliteRes2Rows(res, parseErrorsAndCertificates));
    } catch (err) {
      return Promise.reject(err);
    }
  },

  writeHost(host) {
    if (sqlite.db === undefined) {
      return Promise.reject(new Error('Cannot open db'));
    }

    if (host !== Object(host)) {
      return Promise.reject(new Error('Invalid host definition'));
    }

    try {
      if (host.id === undefined) {
        sqlite.db.run(`
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
          host.hostname,
          host.servername,
          host.port,
          host.description,
          host.category,
          host.active ? 1 : 0,
        ]);
      } else {
        sqlite.db.run(`
          UPDATE hosts
          SET
            hostname = COALESCE(?, hostname),
            servername = COALESCE(?, servername),
            port = COALESCE(?, port),
            description = COALESCE(?, description),
            category = COALESCE(?, category),
            active = COALESCE(?, active)
          WHERE id=?
        `, [
          host.hostname === undefined ? null : host.hostname,
          host.servername === undefined ? null : host.servername,
          host.port === undefined ? null : host.port,
          host.description === undefined ? null : host.description,
          host.category === undefined ? null : host.category,
          // eslint-disable-next-line no-nested-ternary
          host.active === undefined ? null : (host.active ? 1 : 0),
          host.id,
        ]);
      }

      writeFileSync(sqlite.filePath, Buffer.from(sqlite.db.export()));

      return Promise.resolve();
    } catch (err) {
      return Promise.reject(err);
    }
  },

  writeHostHistory(host, history) {
    if (sqlite.db === undefined) {
      return Promise.reject(new Error('Cannot open db'));
    }

    if (host !== Object(host) || Number.isNaN(host.id) === true) {
      return Promise.reject(new Error('Invalid host definition'));
    }

    if (history !== Object(history)) {
      return Promise.reject(new Error('Invalid history definition'));
    }

    try {
      const res = sqlite.db.exec(`
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
        history.idHost || host.id,
        history.authorized,
        history.fingerprint,
        JSON.stringify(history.certificates || []),
        JSON.stringify(history.errors || []),
      ]);

      const rows = sqliteRes2Rows(res);

      if (rows.length > 0 && rows[0].id) {
        sqlite.db.run(`
          UPDATE hosts
          SET idHistory = ?
          WHERE id = ?

        `, [
          rows[0].id,
          history.idHost || host.id,
        ]);
      }

      writeFileSync(sqlite.filePath, Buffer.from(sqlite.db.export()));

      return Promise.resolve();
    } catch (err) {
      return Promise.reject(err);
    }
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
        history.errors.push({
          type: 'connection',
          code: String(error),
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
