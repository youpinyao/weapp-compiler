module.exports = {
  env: {
    browser: true,
    es2020: true,
  },
  extends: ['standard'],
  parserOptions: {
    ecmaVersion: 11,
    sourceType: 'module',
  },
  globals: {
    requirePlugin: true,
    App: true,
    wx: true,
    getApp: true,
    Page: true,
  },
  rules: {
    semi: ['error', 'always', { omitLastInOneLineBlock: true }],
    'comma-dangle': ['error', 'always-multiline'],
    eqeqeq: 0,
    'spaced-comment': 0,
    camelcase: 0,
    'space-before-function-paren': [
      'error',
      { anonymous: 'always', named: 'never', asyncArrow: 'always' },
    ],
  },
};
