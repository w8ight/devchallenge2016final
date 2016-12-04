var webpack = require('webpack');
var path = require('path');
var debug = process.env.NODE_ENV !== "production";
var autoprefixer = require('autoprefixer');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var ExtractTextWebpackPlugin = require('extract-text-webpack-plugin');

var HtmlWebpackPluginConfig = new HtmlWebpackPlugin({
    template: __dirname + '/app/index.html',
    filename: 'index.html',
    inject: 'body'
});

var ExtractTextPlugin = new ExtractTextWebpackPlugin('[name].css', {
    allChunks: true
});

module.exports = {
    context: path.join(__dirname),
    entry: {
        "app": "./app/index.js",
        "style": "./app/styles/main.scss"
    },
    devtool: debug ? "inline-sourcemap" : null,
    devServer: {
        inline: true,
        port: 3333,
        stats: {colors: true}
    },
    node: {
        fs: "empty",
        tls: "empty",
        net: "empty"
    },
    module: {
        loaders: [
            {
                test: /\.jsx?$/,
                include: /app/,
                // exclude: /(node_modules)/,
                loader: 'babel-loader',
                query: {
                    presets: ['react', 'es2015', 'stage-0'],
                    plugins: ['transform-runtime']
                }
            },
            {
                test: /\.scss$/,
                // exclude: /(node_modules)/,
                include: /app/,
                loaders: ['style', 'css', 'postcss-loader', 'sass', ExtractTextWebpackPlugin.extract(['css', 'postcss-loader', 'sass'])]
            },
            {
                test: /\.(gif|jpg|png|mp3|aac|ogg)$/,
                loader: 'file'
            }
        ]
    },
    output: {
        path: __dirname + "/bundles/",
        filename: "[name].bundle.js",
    },
    plugins: debug ? [HtmlWebpackPluginConfig, ExtractTextPlugin] : [
        HtmlWebpackPluginConfig,
        ExtractTextPlugin,
        new webpack.optimize.DedupePlugin(),
        new webpack.optimize.OccurenceOrderPlugin(),
        new webpack.optimize.UglifyJsPlugin({
            mangle: {
                keep_fnames: true
            },
            sourcemap: false,
            compress: {
                warnings: false
            },
            comments: false,
            global_defs: {
                DEBUG: false
            }
        })
    ],
    postcss: function () {
        return [autoprefixer({ browsers: ['> 1%'] })];
    }
};