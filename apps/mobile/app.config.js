const base = require('./app.json');

const updateChannel = process.env.EAS_UPDATE_CHANNEL
  ?? (process.env.EAS_BUILD_PROFILE === 'production' ? 'production' : 'preview');
const plugins = [
  ...base.expo.plugins,
  'expo-secure-store',
];

module.exports = {
  ...base,
  expo: {
    ...base.expo,
    extra: {
      ...base.expo.extra,
      eas: {
        ...base.expo.extra?.eas,
        projectId: '86680881-7182-4520-81d9-fcfda2c993d9',
      },
    },
    plugins,
    owner: 'shonelius-team',
    runtimeVersion: {
      policy: 'appVersion',
    },
    scheme: 'receiptly',
    slug: 'shone',
    updates: {
      ...base.expo.updates,
      requestHeaders: {
        ...base.expo.updates?.requestHeaders,
        'expo-channel-name': updateChannel,
      },
      url: 'https://u.expo.dev/86680881-7182-4520-81d9-fcfda2c993d9',
    },
  },
};
