const { merge } = require('webpack-merge');
const path = require('path');
const webpack = require('webpack');
const fse = require('fs-extra');
const CopyPlugin = require('copy-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const { alias, output, entrys, entry, publicPath = 'auto' } = require('./config');
const WeappPlugin = require('./weapp-plugin');

module.exports = (options, { analyzer } = {}) => {
  const patterns = [];
  const weappAssetsName = (resourcePath, resourceQuery) => {
    if (/\/node_modules\//g.test(resourcePath)) {
      return path.relative(path.resolve(process.cwd(), 'node_modules'), resourcePath);
    }
    return '[path][name].[ext]';
  };
  const plugins = [
    new MiniCssExtractPlugin({
      filename: '[name].wxss',
    }),
    new webpack.ProgressPlugin({
      activeModules: false,
      entries: true,
      // handler(percentage, message, ...args) {
      //   // custom logic
      // },
      modules: true,
      modulesCount: 5000,
      profile: false,
      dependencies: true,
      dependenciesCount: 10000,
      percentBy: null,
    }),
    new WeappPlugin(),
  ];

  if (fse.existsSync(path.resolve(entry, 'project.config.json'))) {
    patterns.push({
      from: path.resolve(entry, 'project.config.json'),
      to: path.resolve(output, 'project.config.json'),
    });
  }
  if (fse.existsSync(path.resolve(entry, 'sitemap.json'))) {
    patterns.push({
      from: path.resolve(entry, 'sitemap.json'),
      to: path.resolve(output, 'sitemap.json'),
    });
  }

  plugins.push(
    new CopyPlugin({
      patterns,
      options: {
        concurrency: 100,
      },
    }),
  );

  if (analyzer) {
    plugins.push(new BundleAnalyzerPlugin());
  }
  return merge(
    {
      mode: 'production',
      entry: entrys,
      context: entry,
      stats: {
        errorDetails: true,
      },
      output: {
        path: output,
        publicPath,
      },
      plugins,
      resolve: {
        alias,
        preferRelative: true,
      },
      module: {
        rules: [
          {
            test: /\.(png|jpg|gif|jpeg|svg|ttf|woff|eot|woff2|otf)$/i,
            use: [
              {
                loader: 'url-loader',
                options: {
                  limit: 0,
                  fallback: {
                    loader: 'file-loader',
                    options: {
                      name: 'assets/[name].[hash].[ext]',
                    },
                  },
                },
              },
            ],
          },
          {
            test: /\.(wxss|css|less)$/i,
            use: [
              MiniCssExtractPlugin.loader,
              {
                loader: 'css-loader',
              },
              {
                loader: 'postcss-loader',
                options: {
                  postcssOptions: {
                    plugins: [
                      [
                        'postcss-preset-env',
                        {
                          // Options
                        },
                      ],
                    ],
                  },
                },
              },
            ],
          },
          {
            test: /\.less$/i,
            loader: 'less-loader', // compiles Less to CSS
            options: {
              lessOptions() {
                return {
                  paths: [entry],
                };
              },
            },
          },
          {
            test: /\.(json|wxs)$/i,
            type: 'javascript/auto',
            use: [
              {
                loader: 'file-loader',
                options: {
                  name: weappAssetsName,
                },
              },
              {
                loader: path.resolve(__dirname, 'weapp-loader'),
              },
            ],
          },
          {
            test: /\.(wxml)$/i,
            use: [
              {
                loader: 'file-loader',
                options: {
                  name: weappAssetsName,
                },
              },
              {
                loader: path.resolve(__dirname, 'weapp-loader'),
              },
            ],
          },
          {
            test: /\.m?js$/,
            // exclude: /node_modules/,
            use: {
              loader: 'babel-loader',
              options: {
                presets: [
                  [
                    '@babel/preset-env',
                    {
                      targets: 'defaults',
                      modules: 'commonjs',
                    },
                  ],
                ],
                plugins: [
                  '@babel/plugin-transform-runtime',
                ],
              },
            },
          },
          {
            test: /\.(js)$/i,
            use: [
              {
                loader: path.resolve(__dirname, 'weapp-loader'),
              },
            ],
          },
        ],
      },
      optimization: {
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendors: {
              minChunks: 1,
              test: /\/node_modules\//,
              name: 'vendors',
              reuseExistingChunk: true,
            },
            commons: {
              minChunks: 2,
              test: /^((?!.*(\/node_modules\/)).)*$/,
              name: 'commons',
              reuseExistingChunk: true,
            },
          },
        },
      },
    },
    options,
  );
};
