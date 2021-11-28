import { LocalStorage, date } from 'quasar';

const { formatDate } = date;

export const defaultFilters = {
  active: false,

  authorizedValid: true,
  authorizedInvalid: true,
  authorizedNotChecked: true,

  authorizedExpire: false,

  search: '',

  viewDetailed: true,
};

const savedFilters = LocalStorage.getItem('hosts_filters');

export function getFullHostName(host) {
  let name = '';

  if (host.description && host.description !== host.hostname) {
    name = `${ host.description } - `;
  }

  name += `${ host.hostname }:${ host.port }`;

  if (host.servername && host.servername !== host.hostname) {
    name += ` / ${ host.servername }`;
  }

  return name;
}

export function getAuthorizedStateProps(authorized, $t) {
  if (authorized === null) {
    return {
      avatar: {
        icon: 'gpp_maybe',
        color: 'grey-6',
      },
      tooltip: $t('certificate.not_checked'),
    };
  }

  return authorized === 0
    ? {
      avatar: {
        icon: 'gpp_bad',
        color: 'negative',
      },
      tooltip: $t('certificate.invalid'),
    }
    : {
      avatar: {
        icon: 'gpp_good',
        color: 'positive',
      },
      tooltip: $t('certificate.valid'),
    };
}

export function getCertificateData(certificates, config, $t, $tc) {
  if (Array.isArray(certificates) !== true || certificates.length === 0) {
    return undefined;
  }

  const now = Date.now();
  const cert = certificates[0];
  const data = {
    subject: (cert.subject || {}).CN,
    subjectAlt: cert.subjectaltname,
    issuer: (cert.issuer || {}).CN,
    bits: cert.bits,
    // eslint-disable-next-line no-nested-ternary
    bitsColor: cert.bits < config.certificateBitsError ? 'negative' : (cert.bits < config.certificateBitsWarning ? 'warning' : 'positive'),
    // eslint-disable-next-line no-nested-ternary
    bitsTooltip: $t(`certificate.tooltip_bits_${ cert.bits < config.certificateBitsError ? 'low' : (cert.bits < config.certificateBitsWarning ? 'medium' : 'high') }`),
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
    data.validFromExpireLabel = data.validFromExpired ? $t('certificate.expire_not_yet_valid') : $t('certificate.valid');
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
      data.validToExpireLabel = $t('certificate.expire_expired');
    } else {
      const diffDays = Math.floor((data.validTo - now) / config.durationDay);

      if (diffDays < config.certificateAboutToExpireDaysWarning) {
        data.validToAboutToExpire = true;
      }

      let diff = Math.floor(diffDays / 365);
      if (diff > 0) {
        data.validToExpireLabel = `${ $t('certificate.expire_after') } ${ $tc('certificate.expire_years', diff) }`;
      } else {
        diff = Math.floor(diffDays / 31);
        if (diff > 0) {
          data.validToExpireLabel = `${ $t('certificate.expire_after') } ${ $tc('certificate.expire_months', diff) }`;
        } else if (diffDays > 0) {
          data.validToExpireLabel = `${ $t('certificate.expire_after') } ${ $tc('certificate.expire_days', diffDays) }`;
        } else {
          data.validToExpireLabel = $t('certificate.expire_today');
        }
      }
    }
  }

  return data;
}

export default {
  hosts: [],

  filters: {
    ...defaultFilters,
    ...savedFilters,
  },
};
