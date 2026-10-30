import { FlatCompat } from '@eslint/eslintrc';
import prettier from 'eslint-config-prettier';

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

export default [
  ...compat.extends('@react-native'),
  prettier,
  {
    ignores: ['lib/**', 'node_modules/**', 'example/**', '.venv/**', 'android/build/**', 'scripts/.cache/**', 'app.plugin.js', 'plugin/**', 'scripts/**'],
  },
];
