import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

import '@walletconnect/react-native-compat';

if (typeof __dirname === 'undefined') {
  global.__dirname = '/';
}
if (typeof __filename === 'undefined') {
  global.__filename = '';
}
if (typeof process === 'undefined') {
  global.process = require('process');
} else {
  const bProcess = require('process');
  for (var p in bProcess) {
    if (!(p in process)) {
      process[p] = bProcess[p];
    }
  }
}

process.browser = false;
if (typeof Buffer === 'undefined') {
  global.Buffer = require('buffer').Buffer;
}

const isDev = typeof __DEV__ === 'boolean' && __DEV__;
process.env.NODE_ENV = isDev ? 'development' : 'production';
if (typeof localStorage !== 'undefined') {
  localStorage.debug = isDev ? '*' : '';
}

require('crypto');

if (typeof BigInt === 'undefined') global.BigInt = require('big-integer');
