module.exports = {
  root: true,
  env: {
    browser: true,
    es6: true,
    jest: true,
  },
  extends: ['@react-native', 'airbnb', 'plugin:prettier/recommended', 'plugin:react/recommended'],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
    __DEV__: 'readonly',
  },
  parserOptions: {
    ecmaFeatures: {
      tsx: true,
    },
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  plugins: ['react', 'prettier'],
  rules: {
    'no-shadow': 'off',
    'global-require': 0,
    'arrow-parens': ['error'],
    'object-curly-newline': ['error', { consistent: true }],
    'react/jsx-filename-extension': ['error', { extensions: ['.ts', '.tsx'] }],
    'react/require-default-props': 0,
    'react/prop-types': ['error', { ignore: ['navigation'] }],
    'linebreak-style': 0,
    'import/extensions': 0,
    'no-underscore-dangle': 0,
    'consistent-return': 0,
    'no-param-reassign': 0,
    'react-native/no-inline-styles': 0,
    'max-len': ['error', { code: 150 }],
    'no-unused-expressions': ['error', { allowShortCircuit: true }],
    'react/function-component-definition': [2, { namedComponents: 'arrow-function' }],
    'prettier/prettier': [
      'error',
      {
        endOfLine: 'auto',
      },
    ],
  },
  settings: {
    'import/resolver': {
      'babel-module': {},
    },
  },
};
