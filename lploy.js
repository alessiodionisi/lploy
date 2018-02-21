#!/usr/bin/env node

const yaml = require('js-yaml')
const fs = require('fs')
const path = require('path')
const execa = require('execa')

try {
  const config = yaml.safeLoad(fs.readFileSync(path.resolve(process.env.PWD, 'lploy.yaml'), 'utf8'))

  const sourceFolder = path.resolve(process.env.PWD, config.SourceFolder || 'src')
  const functionsFolder = path.resolve(process.env.PWD, '.functions')

  for (const functionName of Object.keys(config.Functions)) {
    const functionConfig = config.Functions[functionName]

    execa.sync(path.resolve(process.env.PWD, 'node_modules/webpack/bin/webpack.js'), [
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

    execa.sync('zip', [
      path.resolve(functionsFolder, `${functionName}.zip`),
      '-r',
      '.'
    ], {
      cwd: path.resolve(functionsFolder, functionName)
    })

    execa.sync('aws', [
      'lambda',
      'update-function-code',
      '--function-name',
      functionName,
      '--zip-file',
      `fileb://${path.resolve(functionsFolder, `${functionName}.zip`)}`
    ])
  }
} catch (error) {
  console.error(error)
}
