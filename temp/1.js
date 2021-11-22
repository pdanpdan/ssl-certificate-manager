const tls = require('tls');
// var rootCas = require('ssl-root-cas/latest').create();
// const fs = require('fs');

// fs.readdirSync('./keys/intermediate_certs').forEach(file => {
//     rootCas.addFile('./keys/intermediate_certs/' + file)
// });

// var secureContext = tls.createSecureContext({
//     ca: rootCas
// });

const options = {
  host: 'expired.badssl.com',
  port: 443,
  servername: 'expired.badssl.com',

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

  // TLS context object created with tls.createSecureContext()
  // If a secureContext is not provided, one will be created by passing the entire options object to tls.createSecureContext()
  // secureContext: secureContext,
};

const logCertificate = (name, oCert) => {
  const cert = { ...oCert };

  if (cert.pubkey) {
    cert.pubkey = cert.pubkey.toString('base64');
  }
  if (cert.raw) {
    cert.raw = cert.raw.toString('base64');
  }
  cert.issuerCertificate = undefined;

  console.log(name, JSON.stringify(cert, undefined, 2));
};

const tlsSocket = tls.connect(options, () => {
  console.log(tlsSocket.authorized ? 'AUTHORIZED' : 'UNAUTHORIZED', tlsSocket.authorizationError);

  const certs = new Set();
  let peerCert = tlsSocket.getPeerCertificate(true);

  while (peerCert && certs.has(peerCert) !== true) {
    certs.add(peerCert);

    logCertificate('PeerCertificate:', peerCert);

    peerCert = peerCert.issuerCertificate;
  }

  // const x509Cert = tlsSocket.getPeerX509Certificate(true);
  // logCertificate('PeerX509Certificate:', x509Cert);

  tlsSocket.end();
});

tlsSocket.on('timeout', () => {
  console.error(new Error('Handshake timeout'));

  tlsSocket.destroy();
});

tlsSocket.on('error', (error) => {
  console.error(error);

  tlsSocket.end();
});

tlsSocket.on('end', () => {
  tlsSocket.destroy();
});

tlsSocket.setTimeout(1000);
