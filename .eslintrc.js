module.exports = {
  extends: [
    '@antfu/eslint-config-ts',
  ],
  rules: {
    'no-console': 'off',
    'promise/param-names': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/no-use-before-define': 'off',
    'curly': 'off',
    // 希望打开的
    'prefer-promise-reject-errors': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
  },
}

