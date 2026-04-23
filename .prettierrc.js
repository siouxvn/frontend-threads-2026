module.exports = {
  pluginSearchDirs: false,
  plugins: [require.resolve('prettier-plugin-packagejson')],
  printWidth: 80,
  proseWrap: 'never',
  singleQuote: true,
  trailingComma: 'all',
  endOfLine: 'lf',
  overrides: [
    {
      files: '*.md',
      options: {
        proseWrap: 'preserve',
      },
    },
  ],
};
