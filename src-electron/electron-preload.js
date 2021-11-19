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

  readHosts() {
    if (sqlite.db === undefined) {
      return Promise.reject(new Error('Cannot open db'));
    }

    return new Promise((resolve, reject) => {
      sqlite.db.all(`
        SELECT
          h.*,
          hh.ts,
          hh.authorized,
          hh.fingerprint,
          hh.certificates,
          hh.errors,
          CASE WHEN hh.id IS NOT NULL AND (SELECT hh2.fingerprint FROM hosts_history hh2 WHERE hh2.idHost = hh.idHost AND hh2.id != hh.id ORDER BY ts DESC LIMIT 1) != hh.fingerprint
            THEN 1
            ELSE 0
          END CASE AS fingerprintChanged
          (SELECT count(*) FROM hosts_history hh2 WHERE hh2.idHost = hh.idHost) AS historyLength
        FROM hosts h
          LEFT JOIN hosts_history hh ON hh.id = h.idHistory
        ORDER BY
          h.active DESC,
          h.category NULLS LAST,
          h.description,
          h.hostname,
          h.port,
          h.servername
      `, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows.map((row) => {
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
          }));
        }
      });
    });
  },

  readHostHistory(host) {
    if (sqlite.db === undefined) {
      return Promise.reject(new Error('Cannot open db'));
    }

    if (host !== Object(host) || Number.isNaN(host.id) === true) {
      return Promise.reject(new Error('Invalid host definition'));
    }

    return new Promise((resolve, reject) => {
      sqlite.db.all(`
        SELECT
          hh.*
        FROM hosts_history hh
        WHERE idHost = ?
        ORDER BY
          hh.ts DESC
      `, [
        host.id,
      ], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows.map((row) => {
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
          }));
        }
      });
    });
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
            active = COALESCE(?, active),
            idHistory = COALESCE(?, idHistory)
          WHERE id=?
        `, [
          host.hostname,
          host.servername,
          host.port,
          host.description,
          host.category,
          host.active ? 1 : 0,
          host.idHistory,
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

    return new Promise((resolve, reject) => {
      sqlite.db.get(`
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
        host.id,
        host.authorized,
        host.fingerprint,
        JSON.stringify(host.certificates || []),
        JSON.stringify(host.errors || []),
      ], (err, row) => {
        if (err) {
          reject(err);
        } else {
          sqlite.db.get(`
            UPDATE hosts
            SET idHistory = ?
            WHERE id = ?
            RETURNING id
          `, [
            row.id,
            host.id,
          ], (err2) => {
            if (err2) {
              reject(err2);
            } else {
              writeFileSync(sqlite.filePath, Buffer.from(sqlite.db.export()));

              resolve();
            }
          });
        }
      });
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

        tlsSocket.end();
      });

      tlsSocket.on('end', () => {
        tlsSocket.destroy();

        resolve(history);
      });

      tlsSocket.setTimeout(3000);
    });
  },
});
