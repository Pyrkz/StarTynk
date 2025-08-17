// Shim for punycode to work with React Native
// This exports an empty object as punycode is not needed in React Native context
module.exports = {
  encode: (str) => str,
  decode: (str) => str,
  toASCII: (str) => str,
  toUnicode: (str) => str,
  ucs2: {
    decode: (str) => str.split(''),
    encode: (arr) => arr.join('')
  },
  version: '2.3.1'
};