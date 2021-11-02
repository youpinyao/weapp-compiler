const { merge } = require('webpack-merge');
const path = require('path');
const webpack = require('webpack');
const fse = require('fs-extra');
const CopyPlugin = require('copy-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const autoprefixer = require('autoprefixer');

const WeappPlugin = require('./plugin');
const getResourceAccept = require('./config/getResourceAccept');
const { getBuildEnv } = require('./utils/buildEnv');
const getContext = require('./config/getContext');
const getConfig = require('./config/getConfig');
const getOutput = require('./config/getOutput');
const getEntrys = require('./config/getEntrys');
const getAssets = require('./config/getAssets');
const getAppConfig = require('./config/getAppConfig');

const isSubpackage = require('./utils/isSubpackage');
const compatiblePath = require('./utils/compatiblePath');
const getEnv = require('./config/getEnv');

const ENV = getEnv();
const appConfig = getAppConfig();
const assets = getAssets();
const context = getContext();
const { alias, publicPath = 'auto', copyFiles = [] } = getConfig();
const output = getOutput();
const entrys = getEntrys();

const defaultCopyFiles = ['project.config.json', 'sitemap.json'];

// 删除output目录文件
if (fse.existsSync(output)) {
  const files = fse.readdirSync(output);

  files.forEach((item) => {
    if (!/project\.config\.json/g.test(item)) {
      fse.removeSync(path.resolve(output, item));
    }
  });
}

module.exports = (options, { analyzer } = {}) => {
  const patterns = [];
  // eslint-disable-next-line
  const assetsName = (resourcePath, resourceQuery) => {
    if (/node_modules/g.test(resourcePath)) {
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
    new webpack.DefinePlugin({
      'process.env.BUILD_ENV': JSON.stringify(getBuildEnv()),
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

  const getResource = (module) => {
    // eslint-disable-next-line
    let resource = module.resource || module._identifier;

    if (!resource) {
      return false;
    }

    resource = resource.split('!');
    resource = resource[resource.length - 1];

    return resource;
  };

  // chunk
  const cacheGroups = {
    vendors: {
      minChunks: 1,
      // test: /\/node_modules\//,
      test(module) {
        const resource = getResource(module);

        if (resource === false) {
          return true;
        }
        if (/\.wxss/g.test(resource)) {
          return false;
        }

        if (/node_modules/.test(resource)) {
          return true;
        }

        return false;
      },
      name: 'vendors',
      reuseExistingChunk: true,
    },
    vendors_wxss: {
      minChunks: 2,
      test: /node_modules/,
      name: 'vendors_wxss',
      reuseExistingChunk: true,
    },
    commons: {
      minChunks: 2,
      // test: /^((?!.*(\/node_modules\/)).)*$/,
      test(module) {
        const resource = getResource(module);

        if (resource === false) {
          return false;
        }
        if (/node_modules/.test(resource)) {
          return false;
        }

        if (isSubpackage(path.relative(context, resource))) {
          return false;
        }
        return true;
      },
      name: 'commons',
      reuseExistingChunk: true,
    },
  };
  (appConfig.subpackages || []).forEach((pkg) => {
    let { root } = pkg;
    const name = path.join(root, 'subpackage_common');
    cacheGroups[name] = {
      name,
      test(module) {
        const resource = getResource(module);

        if (resource === false) {
          return false;
        }
        if (!/\/$/g.test(root)) {
          root = `${root}/`;
        }

        if (/node_modules/.test(resource)) {
          return false;
        }
        return compatiblePath(path.relative(context, resource)).indexOf(root) === 0;
      },
      minChunks: 2,
      reuseExistingChunk: true,
    };
  });

  defaultCopyFiles.forEach((file) => {
    if (fse.existsSync(path.resolve(context, file))) {
      patterns.push({
        from: path.resolve(context, file),
        to: path.resolve(output, file),
      });
    }
  });
  copyFiles.forEach((file) => {
    patterns.push({
      from: path.resolve(context, file.from),
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
              autoprefixer,
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
      mode: ENV.PROD,
      entry: entrys,
      context,
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
            test: getResourceAccept(),
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
                    loader: 'less-loader', // compiles Less to CSS
                    options: {
                      lessOptions() {
                        return {
                          paths: [context],
                        };
                      },
                    },
                  },
                ],
              }),
            ],
          },
          {
            test: /\.(json)$/i,
            type: 'javascript/auto',
            use: [
              {
                loader: 'file-loader',
                options: {
                  name: assetsName,
                },
              },
            ],
          },
          {
            test: /\.(wxs)$/i,
            type: 'javascript/auto',
            use: [
              {
                loader: 'file-loader',
                options: {
                  name: assetsName,
                },
              },
              {
                loader: path.resolve(__dirname, 'loader/wxs-loader'),
              },
            ],
          },
          {
            test: /\.(wxml)$/i,
            use: [
              {
                loader: 'file-loader',
                options: {
                  name: assetsName,
                },
              },
              {
                loader: path.resolve(__dirname, 'loader/wxml-loader'),
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
                loader: path.resolve(__dirname, 'loader/js-loader'),
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
