# SSL Certificate Manager (ssl-certificate-manager) <img alt="Version" src="https://img.shields.io/badge/version-1.1.0-blue.svg?cacheSeconds=2592000" />

## Project description

Cross platform electron application to manage your fleet of SSL certificates.

For the moment it:

- allows importing a list of domain names (or individually add domains) to be processed
- checks the validity of the certificates for the domains
- can validate the certificates using public and local (installed on the computer) trusted certificates
- displays details about the certificates for each domain
  - validity status
  - fingerprint, issuer, subject, additional subjects for quick view (and all details in expanded view)
  - valability start and end time
  - errors encountered while validating
- keeps a history (and allow inspection) of previous different validation results
- allows exporting of the domains with the validation details

[Dashboard in dense mode / overview](media/screenshot_overview_dense.png)
[Dashboard in detailed view](media/screenshot_overview_detailed.png)

## Project future

It will soon be able to:

- create a CSR (and key) from an existing certificate
- create certificate bundles
- show details about used TLS configuration and check against known bad practices

## Author

* Name: Dan Popescu (PDan)
* Email: <pdan.popescu@gmail.com>
* Website: https://github.com/pdanpdan/
* Github: [@pdanpdan](https://github.com/pdanpdan)

## License

Copyright © 2021 [Dan Popescu](https://github.com/pdanpdan).

This application is distributed under the [Creative Commons Attribution--NonCommercial--NoDerivatives 4.0 International](https://creativecommons.org/licenses/by-nc-nd/4.0/), see LICENSE.md for more information.

For commercial licensing please contact me at <pdan.popescu@gmail.com>.

## Install the dependencies

```bash
yarn
```

### Start the app in development mode (hot-code reloading, error reporting, etc.)

```bash
yarn dev
```

### Lint the files

```bash
yarn lint
```

### Build the app for production

```bash
yarn build
```

## Source code, issues, bug reports, feature requests

[SSL Certificate Manager (ssl-certificate-manager)](https://github.com/pdanpdan/ssl-certificate-manager)
