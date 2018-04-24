#!/usr/bin/env node

require('any-observable/register')('rxjs')

import yaml from 'js-yaml'
import fs from 'fs'
import path from 'path'
import execa from 'execa'
import Listr from 'listr'

if (!process.env.PWD) throw new Error('undefined PWD env')
const pwdFolder = process.env.PWD

const tasks = []

const config = yaml.safeLoad(fs.readFileSync(path.resolve(pwdFolder, 'lploy.yaml'), 'utf8')) as {
  SourceFolder: string
  NamePrefix: string
  Functions: {
    Name: string
    Source: string
  }[]
}

const sourceFolder = path.resolve(pwdFolder, config.SourceFolder || 'src')
const functionsFolder = path.resolve(pwdFolder, '.lploy-functions')

for (const functionConfig of config.Functions) {
  const functionTasks: any[] = []

  functionTasks.push({
    title: 'webpack',
    task: () => execa(path.resolve(pwdFolder, 'node_modules/webpack/bin/webpack.js'), [
      '--config',
      path.resolve(pwdFolder, 'webpack.config.ts'),
      '--entry',
      path.resolve(sourceFolder, functionConfig.Source),
      '--output-path',
      path.resolve(functionsFolder, functionConfig.Name),
      '--output-filename',
      'index.js'
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
      `${config.NamePrefix}${functionConfig.Name}`,
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
