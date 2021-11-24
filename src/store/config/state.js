export const defaultConfig = {
  durationDay: 1000 * 60 * 60 * 24,
  verificationDaysError: 30,
  verificationDaysWarning: 7,
  certificateBitsError: 2048,
  certificateBitsWarning: 4096,
  certificateAboutToExpireDaysWarning: 90,
};

export default {
  config: {
    ...defaultConfig,
  },
};
