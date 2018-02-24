#!/usr/bin/env node

const yaml = require('js-yaml')
const fs = require('fs')
const path = require('path')
const execa = require('execa')
const Listr = require('listr')

const tasks = []

const config = yaml.safeLoad(fs.readFileSync(path.resolve(process.env.PWD, 'lploy.yaml'), 'utf8'))

const sourceFolder = path.resolve(process.env.PWD, config.SourceFolder || 'src')
const functionsFolder = path.resolve(process.env.PWD, '.functions')

for (const functionName of Object.keys(config.Functions)) {
  const functionConfig = config.Functions[functionName]

  const functionTasks = []

  functionTasks.push({
    title: 'webpack',
    task: () => execa(path.resolve(process.env.PWD, 'node_modules/webpack/bin/webpack.js'), [
      '--config',
      path.resolve(process.env.PWD, 'webpack.config.js'),
      '--entry',
      path.resolve(sourceFolder, functionConfig.Source),
      '--output-path',
      path.resolve(functionsFolder, functionName),
      '--output-filename',
      'main.js',
      '--output-library',
      functionName
    ])
  })

  functionTasks.push({
    title: 'archive',
    task: () => execa('zip', [
      path.resolve(functionsFolder, `${functionName}.zip`),
      '-r',
      '.'
    ], {
      cwd: path.resolve(functionsFolder, functionName)
    })
  })

  functionTasks.push({
    title: 'deploy',
    task: () => execa('aws', [
      'lambda',
      'update-function-code',
      '--function-name',
      functionName,
      '--zip-file',
      `fileb://${path.resolve(functionsFolder, `${functionName}.zip`)}`
    ])
  })

  tasks.push({
    title: functionName,
    task: () => new Listr(functionTasks)
  })
}

new Listr(tasks).run().catch((error) => console.error(error))
