module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2021: true,
  },
  extends: ['airbnb-base'],
  parserOptions: {
    ecmaVersion: 12,
  },
  rules: {
    'no-console': [0],
    'arrow-body-style': [0],
    'object-curly-newline': [0],
    'operator-linebreak': [0],
    'no-await-in-loop': [0],
  },
};
