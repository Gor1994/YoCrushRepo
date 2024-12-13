const webpack = require("webpack");

module.exports = {
    webpack: {
        configure: (webpackConfig) => {
            webpackConfig.resolve.fallback = {
                ...webpackConfig.resolve.fallback,
                http: require.resolve("stream-http"),
                https: require.resolve("https-browserify"),
                stream: require.resolve("stream-browserify"),
                os: require.resolve("os-browserify/browser"),
                buffer: require.resolve("buffer/"),
                zlib: require.resolve("browserify-zlib"),
            };

            // Add ProvidePlugin to inject Buffer globally
            webpackConfig.plugins.push(
                new webpack.ProvidePlugin({
                    Buffer: ["buffer", "Buffer"],
                })
            );

            return webpackConfig;
        },
    },
};
