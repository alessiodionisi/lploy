#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var yaml = require("js-yaml");
var fs = require("fs");
var path = require("path");
var execa = require("execa");
var Listr = require("listr");
if (!process.env.PWD)
    throw new Error('undefined PWD env');
var pwdFolder = process.env.PWD;
var tasks = [];
var config = yaml.safeLoad(fs.readFileSync(path.resolve(pwdFolder, 'lploy.yaml'), 'utf8'));
var sourceFolder = path.resolve(pwdFolder, config.SourceFolder || 'src');
var functionsFolder = path.resolve(pwdFolder, '.functions');
var _loop_1 = function (functionConfig) {
    var functionTasks = [];
    functionTasks.push({
        title: 'webpack',
        task: function () { return execa(path.resolve(pwdFolder, 'node_modules/webpack/bin/webpack.js'), [
            '--config',
            path.resolve(pwdFolder, 'webpack.config.js'),
            '--entry',
            path.resolve(sourceFolder, functionConfig.Source),
            '--output-path',
            path.resolve(functionsFolder, functionConfig.Name),
            '--output-filename',
            'main.js',
            '--output-library',
            functionConfig.Name
        ]); }
    });
    functionTasks.push({
        title: 'archive',
        task: function () { return execa('zip', [
            path.resolve(functionsFolder, functionConfig.Name + ".zip"),
            '-r',
            '.'
        ], {
            cwd: path.resolve(functionsFolder, functionConfig.Name)
        }); }
    });
    functionTasks.push({
        title: 'deploy',
        task: function () { return execa('aws', [
            'lambda',
            'update-function-code',
            '--function-name',
            functionConfig.Name,
            '--zip-file',
            "fileb://" + path.resolve(functionsFolder, functionConfig.Name + ".zip")
        ]); }
    });
    tasks.push({
        title: functionConfig.Name,
        task: function () { return new Listr(functionTasks); }
    });
};
for (var _i = 0, _a = config.Functions; _i < _a.length; _i++) {
    var functionConfig = _a[_i];
    _loop_1(functionConfig);
}
new Listr(tasks).run().catch(function (error) { return console.error(error); });
//# sourceMappingURL=lploy.js.map