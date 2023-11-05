module.exports = {
  extends: [
    'next/core-web-vitals',
    'plugin:@next/next/recommended',
  ],
  parserOptions: {
    project: './tsconfig.json',
  },
  rules: {
    'react/react-in-jsx-scope': 'off',
  },
};
