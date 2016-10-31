var webpack = require('webpack');

var PROD = JSON.parse(process.env.PROD_ENV || '0');

module.exports = {
    entry: [
        "./main.js"
    ],
    output: {
        path: __dirname,
        filename: PROD ? 'all.min.js' : 'all.js'
    },
    plugins: PROD ? [
        new webpack.optimize.UglifyJsPlugin({minimize: true})
    ] : [],
    module: {
        loaders: [
            { test: /\.css$/,                                     loader: "style!css" }
        ],
        noParse: [/libs\/jquery/]
    }
};
