import globals from 'globals';
export default [{ ignores: ['.next/**', 'node_modules/**'] }, {
  files: ['app/**/*.{js,jsx}', 'components/**/*.{js,jsx}', 'hooks/**/*.{js,jsx}', 'lib/**/*.js'],
  languageOptions: { ecmaVersion: 'latest', sourceType: 'module', parserOptions: { ecmaFeatures: { jsx: true } }, globals: { ...globals.browser, ...globals.node } },
  rules: { 'no-undef': 'error', 'no-unreachable': 'error', 'no-dupe-keys': 'error' },
}];
