// eslint-disable-next-line eqeqeq
const IS_TURBO = process.env.TURBOPACK != null;

const next = (options = {}) => {
  // https://nextjs.org/docs/app/api-reference/next-config-js
  return (nextConfig = {}) => {
    if (Array.isArray(nextConfig)) {
      nextConfig.push(next(options));
      return nextConfig;
    } else if (typeof nextConfig === 'function') {
      return async (phase, config) => {
        const baseConfig = await nextConfig(phase, config);
        // handle () => plugins.reduce((acc, next) => next(acc), nextConfig); case:
        if (Array.isArray(baseConfig)) {
          baseConfig.push(next(options));
          return baseConfig;
        }
        return {
          ...baseConfig,
          ...next(options)(baseConfig),
        };
      };
    }

    // Next.js bug: https://github.com/vercel/next.js/issues/68077
    const injectLoader = (glob, as) => {
      nextConfig.experimental ??= {};
      nextConfig.experimental.turbo ??= {};
      nextConfig.experimental.turbo.rules ??= {};

      const rules = nextConfig.experimental.turbo.rules;

      rules[glob] ??= {};
      const rule = rules[glob];
      rule.as = as;
      rule.loaders ??= [];
      rule.loaders.unshift({
        loader: require.resolve('./loader.js'),
        options: {},
      });
    };

    if (IS_TURBO) {
      injectLoader('**/*.tsx', '*.tsx');
      injectLoader('**/*.jsx', '*.jsx');
    }
    return nextConfig;
  };
};

module.exports = next;
