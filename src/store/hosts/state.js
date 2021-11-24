import { LocalStorage } from 'quasar';

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

export default {
  hosts: [],

  filters: {
    ...defaultFilters,
    ...savedFilters,
  },
};
