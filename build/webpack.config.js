const { merge } = require('webpack-merge');
const fs = require('fs-extra');
const path = require('path');
const webpack = require('webpack');
const fse = require('fs-extra');
const CopyPlugin = require('copy-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');
const StylelintPlugin = require('stylelint-webpack-plugin');
const autoprefixer = require('autoprefixer');

const WeappPlugin = require('./plugin');
const getResourceAccept = require('./config/getResourceAccept');
const { getBuildEnv } = require('./utils/buildEnv');
const getContext = require('./config/getContext');
const getConfig = require('./config/getConfig');
const getOutput = require('./config/getOutput');
const getEntrys = require('./config/getEntrys');
const getAssets = require('./config/getAssets');
const { getAppConfig } = require('./config/appConfig');

const isSubpackage = require('./utils/isSubpackage');
const compatiblePath = require('./utils/compatiblePath');
const ENV = require('./config/env');
const { setCopyFiles } = require('./utils/isCopyFile');
const isProjectConfig = require('./utils/isProjectConfig');
const isKeepFile = require('./utils/isKeepFile');

const assets = getAssets();
const context = getContext();
const {
  alias,
  publicPath = 'auto',
  copyFiles = [],
  configureWebpack = {},
  vendors = {},
  eslint = true,
  stylelint = true,
} = getConfig();
const output = getOutput();

const defaultCopyFiles = ['project.config.json', 'project.private.config.json', 'sitemap.json'];

// 删除output目录文件
if (fse.existsSync(output)) {
  const files = fse.readdirSync(output);

  files.forEach((item) => {
    if (!isKeepFile(item)) {
      fse.removeSync(path.resolve(output, item));
    }
  });
} else {
  fse.mkdirSync(output);
}

module.exports = (options, { analyzer, quiet } = {}) => {
  const entrys = getEntrys();
  const appConfig = getAppConfig();
  // eslint-disable-next-line
  const assetsName =
    (fix = '') =>
    (resourcePath, resourceQuery) => {
      let name = resourcePath;
      if (/node_modules/g.test(resourcePath)) {
        name = compatiblePath(resourcePath).split('/node_modules/').pop();
      } else {
        name = compatiblePath(path.relative(getContext(), resourcePath));
      }

      const nameParse = path.parse(name);

      return compatiblePath(`${nameParse.dir}/${nameParse.name}${fix ? `-${fix}` : ''}${nameParse.ext}`);
    };
  const plugins = [
    new WeappPlugin(),
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

        // 额外vendor配置
        if (!!Object.values(vendors ?? {}).find((item) => item.test.test(resource))) {
          return false;
        }
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
    vendorsStyle: {
      minChunks: 2,
      test: /node_modules/,
      name: 'vendors',
      reuseExistingChunk: true,
    },
    commons: {
      minChunks: 2,
      // test: /^((?!.*(\/node_modules\/)).)*$/,
      test(module) {
        const resource = getResource(module);

        // 额外vendor配置
        if (!!Object.values(vendors ?? {}).find((item) => item.test.test(resource))) {
          return false;
        }
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

  // 额外vendor配置
  Object.entries(vendors).forEach(([name, config]) => {
    cacheGroups[name] = {
      minChunks: 2,
      reuseExistingChunk: true,
      name,
      ...config,
    };
  });

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
  if (quiet !== true) {
    plugins.push(
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
    );
  }
  if (
    (fs.existsSync(path.resolve(process.cwd(), '.stylelintrc.json')) ||
      fs.existsSync(path.resolve(process.cwd(), '.stylelintrc.js')) ||
      fs.existsSync(path.resolve(process.cwd(), '.stylelintrc.yaml')) ||
      fs.existsSync(path.resolve(process.cwd(), '.stylelintrc.yml'))) &&
    stylelint !== false
  ) {
    plugins.push(
      new StylelintPlugin({
        files: ['**/*.{wxss,css,less}'],
        lintDirtyModulesOnly: false,
        fix: false,
        cache: false,
        emitError: true,
        emitWarning: true,
      }),
    );
  }
  if (fs.existsSync(path.resolve(process.cwd(), 'node_modules', 'eslint')) && eslint !== false) {
    plugins.push(
      new ESLintPlugin({
        extensions: ['js', 'ts'],
        lintDirtyModulesOnly: false,
        fix: false,
        cache: true,
        emitError: true,
        emitWarning: true,
      }),
    );
  }
  // 配置copy plugin
  const patterns = [];
  defaultCopyFiles.forEach((file) => {
    if (fse.existsSync(path.resolve(context, file))) {
      patterns.push({
        from: path.resolve(context, file),
        to: path.resolve(output, file),
        transform(content, absoluteFrom) {
          if (isProjectConfig(absoluteFrom)) {
            const projectConfig = JSON.parse(content);
            const packOptions = projectConfig.packOptions || {};
            const packOptionsIgnore = packOptions.ignore || [];

            return JSON.stringify(
              {
                ...projectConfig,
                packOptions: {
                  ...packOptions,
                  ignore: [
                    {
                      type: 'folder',
                      value: 'assets',
                    },
                    {
                      type: 'regexp',
                      value: '\\.zip$',
                    },
                    ...packOptionsIgnore,
                  ],
                },
              },
              null,
              2,
            );
          }
          return content;
        },
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

  setCopyFiles(patterns);

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
        extensions: ['.ts', '.js'],
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
                  // true 需要 .default, false 不需要 .defualt
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
                          javascriptEnabled: true,
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
                loader: path.resolve(__dirname, 'loader/json-loader'),
                options: {
                  name: assetsName(),
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
                  name: assetsName('build'),
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
                  name: assetsName(),
                },
              },
              {
                loader: path.resolve(__dirname, 'loader/wxml-loader'),
              },
              {
                loader: path.resolve(__dirname, 'loader/wxml-inject-loader'),
              },
            ],
          },
          {
            test: /\.(js|ts)$/i,
            use: [
              {
                loader: 'babel-loader',
                options: {
                  cacheDirectory: true,
                  presets: [
                    [
                      '@babel/preset-env',
                      {
                        modules: 'commonjs',
                      },
                    ],
                  ],
                  plugins: [
                    '@babel/plugin-transform-runtime',
                    '@babel/plugin-proposal-optional-chaining',
                    '@babel/plugin-proposal-nullish-coalescing-operator',
                    '@babel/plugin-transform-class-properties',
                  ],
                },
              },
              {
                loader: path.resolve(__dirname, 'loader/js-loader'),
              },
            ],
          },
          {
            test: /\.(ts)$/i,
            use: [
              {
                loader: require.resolve('ts-loader'),
                options: {
                  allowTsInNodeModules: true,
                },
              },
            ],
          },
        ],
      },
      optimization: {
        minimizer: [
          '...',
          new CssMinimizerPlugin({
            test: /\.wxss(\?.*)?$/i,
          }),
        ],
        runtimeChunk: {
          name: 'runtime',
        },
        splitChunks: {
          minSize: 0,
          chunks: 'all',
          cacheGroups,
        },
      },
    },
    configureWebpack,
    options,
  );
};
