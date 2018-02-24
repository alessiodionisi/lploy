# lploy
[![NPMV](https://img.shields.io/npm/v/lploy.svg?style=flat-square)](https://npmjs.org/package/lploy)
[![NPMD](https://img.shields.io/npm/dt/lploy.svg?style=flat-square)](https://npmjs.org/package/lploy)

Deploy your Webpack functions to AWS Lambda

## How to use
- Install lploy as dev dependency of your project
  
  with yarn:
  ```
  yarn add -D lploy
  ```

  with npm:
  ```
  npm i --save-dev lploy
  ```

- Create `lploy.yaml` configuration file:

  ```yaml
  # SourceFolder: src # Custom source folder (default: src)
  Functions:
    - Name: ExampleFunction         # Function name on AWS Lambda
      Source: 'example-function.js' # Source filename
  ```

- Add lploy to your scripts

  ```
  "scripts": {
    "lploy": "lploy"
  }
  ```

- Run lploy on project folder

  with yarn:
  ```
  yarn lploy
  ```

  with npm:
  ```
  npm run lploy
  ```
