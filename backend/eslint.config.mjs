import js from "@eslint/js";
import globals from "globals";
import stylisticJs from '@stylistic/eslint-plugin-js'
import { defineConfig } from "eslint/config";

export default defineConfig([
  js.configs.recommended,
  { files: ["**/*.{js,mjs,cjs}"], plugins: { js }, extends: ["js/recommended"], languageOptions: { globals: globals.browser } },
  { files: ["**/*.js"], languageOptions: { sourceType: "commonjs" } },
  {
    // ...
    plugins: {
      '@stylistic/js': stylisticJs,
    },
    rules: {
      '@stylistic/js/indent': ['error', 2],
      '@stylistic/js/linebreak-style': ['error', 'unix'],
      '@stylistic/js/semi': ['error', 'never'],
    },
  },
  {
    ignores: ['dist/**'],
  }
])
