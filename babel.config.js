module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '~assets': './src/assets',
            '~components': './src/components',
            '~config': './src/config',
            '~constants': './src/constants',
            '~hooks': './src/hooks',
            '~http': './src/http',
            '~redux': './src/redux',
            '~screens': './src/screens',
            '~styles': './src/styles',
            '~translations': './src/translations',
            '~types': './src/types',
            '~UI': './src/UI',
            '~utils': './src/utils',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
