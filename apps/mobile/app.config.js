const base = require('./app.json');

const googleUrlScheme = process.env.GOOGLE_IOS_URL_SCHEME;
const plugins = [
  ...base.expo.plugins,
  'expo-apple-authentication',
  'expo-secure-store',
];

if (googleUrlScheme) {
  plugins.push([
    '@react-native-google-signin/google-signin',
    { iosUrlScheme: googleUrlScheme },
  ]);
}

module.exports = {
  ...base,
  expo: {
    ...base.expo,
    plugins,
    scheme: 'receiptly',
    ios: {
      ...base.expo.ios,
      usesAppleSignIn: true,
    },
  },
};
