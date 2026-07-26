const base = require('./app.json');

const plugins = [
  ...base.expo.plugins,
  'expo-secure-store',
];

module.exports = {
  ...base,
  expo: {
    ...base.expo,
    plugins,
    scheme: 'receiptly',
  },
};
