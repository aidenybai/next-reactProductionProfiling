const { transformAsync } = require('@babel/core');
const hermesParser = require('babel-plugin-syntax-hermes-parser');

module.exports = async function DummyLoader(code, map) {
  if (typeof map === 'string') {
    // could change in the future
    map = JSON.parse(map);
  }
  const callback = this.async();

  // TODO: is it possible to bail out early if the input doesn't contain a react component?
  try {
    const options = this.getOptions();
    const id = this.resourcePath;
    if (id.includes('node_modules')) return callback(null, code);

    const parserPlugins = [
      // import { example } from 'example' with { example: true };
      [
        'importAttributes',
        {
          deprecatedAssertSyntax: false,
        },
      ],
      // () => throw example
      'throwExpressions',
      // You know what this is
      'decorators',
      // const { #example: example } = this;
      'destructuringPrivate',
      // using example = myExample()
      'explicitResourceManagement',
      // import.meta
      'importMeta',
    ];
    const buildPlugins = [];

    // TODO omit optional chain
    const overridePlugins = options.babel?.plugins;
    if (overridePlugins) {
      for (let i = 0, len = overridePlugins.length; i < len; i++) {
        const plugin = overridePlugins[i];
        // this wont work since it shifts the source locations
        buildPlugins.unshift(plugin);
      }
    }

    // buildPlugins.push([captureBabelPlugin, options]);

    const isJSXLike = /\.[mc]?[jt]sx?$/i.test(id);

    if (isJSXLike) {
      parserPlugins.unshift('jsx');
    }

    const isTSX = isJSXLike && /\.[mc]?tsx?$/i.test(id);

    if (isTSX) {
      parserPlugins.push('typescript');
    } else {
      buildPlugins.unshift(hermesParser);
    }

    result = await transformAsync(code, {
      plugins: buildPlugins,
      ignore: [/\/(?<c>build|node_modules)\//],
      parserOpts: { plugins: parserPlugins },
      cloneInputAst: false,
      generatorOpts: {
        // https://github.com/facebook/react/issues/29120
        // TODO: remove once React Compiler has provided their workaround
        jsescOption: {
          minimal: true,
        },
      },
      filename: id,
      ast: false,
      sourceFileName: id,
      sourceMaps: true,
      configFile: false,
      babelrc: false,
      inputSourceMap: map,
    });

    result = result ? { code: result.code || '', map: result.map } : null;
    callback(
      null,
      result?.code || '',
      result ? JSON.stringify(result.map) : undefined
    );
  } catch (e) {
    callback(e);
  }
};