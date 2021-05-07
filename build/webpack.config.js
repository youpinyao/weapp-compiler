const { merge } = require('webpack-merge');
const path = require('path');
const webpack = require('webpack');
const fse = require('fs-extra');
const CopyPlugin = require('copy-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const {
  alias,
  output,
  entrys,
  entry,
  publicPath = 'auto',
  copyFiles = [],
  assets,
  app,
  isSubpackage,
} = require('./config');
const WeappPlugin = require('./weapp-plugin');

const defaultCopyFiles = ['project.config.json', 'sitemap.json'];

// 删除output目录文件
if (fse.existsSync(output)) {
  const files = fse.readdirSync(output);

  files.forEach((item) => {
    fse.removeSync(path.resolve(output, item));
  });
}

module.exports = (options, { analyzer } = {}) => {
  const patterns = [];
  // eslint-disable-next-line
  const weappAssetsName = (resourcePath, resourceQuery) => {
    if (/\/node_modules\//g.test(resourcePath)) {
      return path.relative(path.resolve(process.cwd(), 'node_modules'), resourcePath);
    }
    return '[path][name].[ext]';
  };
  const plugins = [
    new MiniCssExtractPlugin({
      filename: '[name].wxss',
      // filename(asset) {
      //   console.log(asset.chunk.name);
      //   return '[name].wxss';
      // },
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

  // chunk
  const cacheGroups = {
    vendors: {
      minChunks: 1,
      test: /\/node_modules\//,
      name: 'vendors',
      reuseExistingChunk: true,
    },
    commons: {
      minChunks: 2,
      // test: /^((?!.*(\/node_modules\/)).)*$/,
      test(module) {
        // eslint-disable-next-line
        let resource = module.resource || module._identifier;

        if (!resource) {
          return false;
        }

        resource = resource.split('!');
        resource = resource[resource.length - 1];

        if (/\/node_modules\//.test(resource)) {
          return false;
        }

        if (isSubpackage(path.relative(entry, resource))) {
          return false;
        }
        return true;
      },
      name: 'commons',
      reuseExistingChunk: true,
    },
  };
  (app.subpackages || []).forEach((pkg) => {
    const name = path.join(pkg.root, 'subpackage_common');
    cacheGroups[name] = {
      name,
      test(module) {
        let { root } = pkg;
        // eslint-disable-next-line
        let resource = module.resource || module._identifier;

        if (!resource) {
          return false;
        }
        resource = resource.split('!');
        resource = resource[resource.length - 1];

        if (!/\/$/g.test(root)) {
          root = `${root}/`;
        }

        if (/\/node_modules\//.test(resource)) {
          return false;
        }
        return (
          path.relative(entry, resource).indexOf(root) === 0 ||
          path.relative(entry, resource).indexOf(root.replace(/\//g, '\\')) === 0
        );
      },
      minChunks: 2,
      reuseExistingChunk: true,
    };
  });

  defaultCopyFiles.forEach((file) => {
    if (fse.existsSync(path.resolve(entry, file))) {
      patterns.push({
        from: path.resolve(entry, file),
        to: path.resolve(output, file),
      });
    }
  });
  copyFiles.forEach((file) => {
    patterns.push({
      from: path.resolve(entry, file.from),
      to: path.resolve(output, file.to),
    });
  });

  plugins.push(
    new CopyPlugin({
      patterns,
      options: {
        concurrency: 100,
      },
    }),
  );

  const getCssLoader = ({ use = [] } = {}) => {
    return [
      {
        loader: MiniCssExtractPlugin.loader,
      },
      {
        loader: 'css-loader',
        options: {
          importLoaders: use.length + 1,
        },
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
      ...use,
    ];
  };

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
                  // true 需要 .default, false 不需要 .defualt
                  esModule: false,
                  fallback: {
                    loader: 'file-loader',
                    options: {
                      name: `${assets}/[name].[hash].[ext]`,
                    },
                  },
                },
              },
            ],
          },
          {
            test: /\.(wxss|css)$/i,
            include: /node_modules/,
            use: [...getCssLoader()],
          },
          {
            // test: /\.less$/i,
            test: /\.(less|wxss|css)$/i,
            exclude: /node_modules/,
            use: [
              ...getCssLoader({
                use: [
                  {
                    loader: path.resolve(__dirname, 'weapp-loader'),
                  },
                  {
                    loader: 'less-loader', // compiles Less to CSS
                    options: {
                      lessOptions() {
                        return {
                          paths: [entry],
                        };
                      },
                    },
                  },
                ],
              }),
            ],
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
                plugins: ['@babel/plugin-transform-runtime'],
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
          minSize: 0,
          chunks: 'all',
          cacheGroups,
        },
      },
    },
    options,
  );
};
