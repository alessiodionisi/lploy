#!/usr/bin/env node

import * as yaml from 'js-yaml'
import * as fs from 'fs'
import * as path from 'path'
import * as execa from 'execa'
import * as Listr from 'listr'

if (!process.env.PWD) throw new Error('undefined PWD env')
const pwdFolder = process.env.PWD

const tasks = []

const config = yaml.safeLoad(fs.readFileSync(path.resolve(pwdFolder, 'lploy.yaml'), 'utf8'))

const sourceFolder = path.resolve(pwdFolder, config.SourceFolder || 'src')
const functionsFolder = path.resolve(pwdFolder, '.functions')

for (const functionConfig of config.Functions) {
  const functionTasks: any[] = []

  functionTasks.push({
    title: 'webpack',
    task: () => execa(path.resolve(pwdFolder, 'node_modules/webpack/bin/webpack.js'), [
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
    ])
  })

  functionTasks.push({
    title: 'archive',
    task: () => execa('zip', [
      path.resolve(functionsFolder, `${functionConfig.Name}.zip`),
      '-r',
      '.'
    ], {
      cwd: path.resolve(functionsFolder, functionConfig.Name)
    })
  })

  functionTasks.push({
    title: 'deploy',
    task: () => execa('aws', [
      'lambda',
      'update-function-code',
      '--function-name',
      functionConfig.Name,
      '--zip-file',
      `fileb://${path.resolve(functionsFolder, `${functionConfig.Name}.zip`)}`
    ])
  })

  tasks.push({
    title: functionConfig.Name,
    task: () => new Listr(functionTasks)
  })
}

new Listr(tasks).run().catch((error: Error) => console.error(error))
