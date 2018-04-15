'use strict';
const _path = require('path');

const webpack = require('webpack');
const chalk = require('chalk');

let npmPackage = require('./package.json');
let projectName = npmPackage.name;

function resolve(){
    let result = _path.resolve.apply(_path, arguments);
    return result;
}

let paths = {
    context: resolve(__dirname, `src`),
    output: resolve(__dirname, `build`),
};


module.exports = (env) => {
    env = env || {};
    let NODE_ENV = env.production ? 'production' : 'dev';
    
    console.log(`${chalk.cyan('Webpack')}: NODE_ENV="${chalk.magenta(NODE_ENV)}", env=${JSON.stringify(env)}`);
    
    return {
        context: paths.context,
        entry: {
            'jsonform': './jsonform.ts', 
            // 'jsonform-compat': './jsonform-compat.ts', 
        },
        output: {
            path: paths.output,
            filename: '[name].js',
        },
        externals: {
            /*
            List any external libraries here that should be excluded from the bundle.
            
            `import {xyz} from "external"`
            
            {
                // when importing "externalPath" it will take the `internalProp` global
                'externalPath': 'internalProp'
            }
            */
            
            // import 'jquery' => will return global jQuery variable
            'jquery': 'jQuery',
            'lodash': '_',
        },
        resolve: {
            extensions: ['.js', '.ts'],
            modules: [
                "node_modules"
            ],
            alias: {
                // Use the full build of vue including template compiler
                // 'vue$': 'vue/dist/vue.common.js'
            },
        },
        stats: {
            env: true,
            assets: false,
            modules: false,
        },
        devtool: env.production ? 'source-map' : 'inline-source-map',
        plugins: [
            new webpack.DefinePlugin({
                'process.env.NODE_ENV': JSON.stringify(NODE_ENV),
            })
        ],
        module: {
            rules: [
                {
                    test: /\.ts$/,
                    loader: 'ts-loader',
                    query: {
                        configFile: resolve(__dirname, 'src/tsconfig.json'),
                    }
                }
            ]
        },
    };
}

