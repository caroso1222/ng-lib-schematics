import {
  Rule,
  SchematicContext,
  Tree,
  apply,
  url,
  filter,
  noop,
  template,
  move,
  chain,
  branchAndMerge,
  mergeWith,
  UpdateRecorder,
} from '@angular-devkit/schematics';
import { Schema as LibraryOptions } from './schema';
import {
  normalize,
  parseJsonAst,
  JsonAstObject,
  JsonValue,
} from "@angular-devkit/core";
import * as stringUtils from "@angular-devkit/core/src/utils/strings";

const DEV_DEPENDENCIES = [
  { name: 'del', version: '^3.0.0' },
  { name: 'fs', version: '0.0.1-security' },
  { name: 'gulp', version: '^3.9.1' },
  { name: 'gulp-clean-css', version: '^3.9.2' },
  { name: 'gulp-htmlmin', version: '^4.0.0' },
  { name: 'gulp-if', version: '^2.0.2' },
  { name: 'gulp-replace', version: '^0.6.1' },
  { name: 'gulp-sass', version: '^3.1.0' },
  { name: 'path', version: '^0.12.7' },
  { name: 'rimraf', version: '^2.6.2' },
  { name: 'rollup', version: '^0.54.0' },
  { name: 'run-sequence', version: '^2.2.1' },
  { name: 'sorcery', version: '^0.10.0' },
  { name: 'sync-json', version: '^1.0.2' },
  { name: 'through2', version: '^2.0.3' },
  { name: 'gulp-autoprefixer', version: '^5.0.0' },
];

const NPM_SCRIPTS = [
  {
    name: 'build:lib',
    version: 'gulp --gulpfile gulpfile.lib.js'
  },
  {
    name: 'version',
    version: 'sync-json -v --property version --source package.json src/lib/package.json'
  }
];

export default function LibStandalone(options: LibraryOptions): Rule {
  options.path = options.path ? normalize(options.path) : options.path;

  const templateSource = apply(url("./files/lib"), [
    template({
      ...stringUtils,
      ...options
    }),
    move(options.sourceDir as string)
  ]);

  const gulpfile = url("./files/gulpfile");

  return chain([
    mergeWith(templateSource),
    mergeWith(gulpfile),
    addScriptsToManifest(),
    addDevDependenciesToManifest()
  ]);
}

/**
 * Adds the build and version scripts to the package.json manifest inside npm scripts:
 * "build:lib": "gulp --gulpfile gulpfile.lib.js"
 * "version": "sync-json -v --property version --source package.json src/lib/package.json"
 */
function addScriptsToManifest(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const packageJsonPath = './package.json';

    let packageJsonContent = tree.read(packageJsonPath);
    if (!verifyPackageJson(tree, context, packageJsonContent)) {
      return;
    }

    const parsedScripts = JSON.parse(packageJsonContent.toString('utf-8')).scripts;

    if (parsedScripts['build:lib']) {
      context.logger.warn('Existing \'build:lib\' npm script found.' +
      '\nYou will need to run the build command as ' +
      '\'gulp --gulpfile gulpfile.lib.js\'`');
    }

    if (parsedScripts.version) {
      context.logger.warn('Existing \'version\' npm script found.' +
      '\nYou will need to manually sync the versions on ./package.json and ' +
      '\'./src/lib/package.json\'`');
    }

    const packageJsonAst = parseJsonAst(packageJsonContent.toString('utf-8'));

    if (packageJsonAst.kind !== 'object') {
      throw new Error('Invalid "package.json" file.');
    }

    const scriptsToken = getJsonToken(packageJsonAst, 'scripts');
    if (scriptsToken) {
      const currentScripts = Object.keys(parsedScripts);
      const recorder = tree.beginUpdate(packageJsonPath);
      const scriptsToInsert = [];

      // analyze the scripts and add only the missing ones
      for (const script of NPM_SCRIPTS) {
        if (currentScripts.indexOf(script.name) === -1) {
          scriptsToInsert.push(script);
        }
      }

      appendPropsToAstObject(recorder, scriptsToken, scriptsToInsert);

      tree.commitUpdate(recorder);
      return tree;
    }
  }
}

/**
 * Adds the dependencies to the package.json needed to build the library
 */
function addDevDependenciesToManifest(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const packageJsonPath = './package.json';

    let packageJsonContent = tree.read(packageJsonPath);
    if (!verifyPackageJson(tree, context, packageJsonContent)) {
      return;
    }

    const parsedDevDependencies = JSON.parse(packageJsonContent.toString('utf-8')).devDependencies;
    if (!parsedDevDependencies) {
      return;
    }

    const packageJsonAst = parseJsonAst(packageJsonContent.toString('utf-8'));

    if (packageJsonAst.kind !== 'object') {
      throw new Error('Invalid "package.json" file.');
    }

    const dependencyToken = getJsonToken(packageJsonAst, 'devDependencies');
    if (dependencyToken) {
      const currentDevDependencies = Object.keys(parsedDevDependencies);
      const recorder = tree.beginUpdate(packageJsonPath);
      const dependenciesToInsert = [];

      // analyze the devDependencies and add only the missing ones
      for (const dep of DEV_DEPENDENCIES) {
        if (currentDevDependencies.indexOf(dep.name) === -1) {
          dependenciesToInsert.push(dep);
        }
      }
      appendPropsToAstObject(recorder, dependencyToken, dependenciesToInsert);
      tree.commitUpdate(recorder);

      context.logger.warn('Please run "npm i" to install new the devDependencies');

      return tree;
    }
  }
}

/**
 * Adds a propertyName: value inside of a json file
 */
function appendPropertyInAstObject(
  recorder: UpdateRecorder,
  node: JsonAstObject,
  propertyName: string,
  value: JsonValue,
  indent = 4,
) {
  const indentStr = '\n' + new Array(indent + 1).join(' ');

  if (node.properties.length > 0) {
    // Insert comma.
    const last = node.properties[node.properties.length - 1];
    recorder.insertRight(last.start.offset + last.text.replace(/\s+$/, '').length, ',');
  }

  recorder.insertLeft(
    node.end.offset - 1,
    '  '
    + `"${propertyName}": ${JSON.stringify(value, null, 2).replace(/\n/g, indentStr)}`
    + indentStr.slice(0, -2),
  );
}

/**
 * Verifies the package.json exists
 */
function verifyPackageJson(
  tree: Tree,
  context: SchematicContext,
  fileContent: Buffer | null
): fileContent is Buffer {
  if (!fileContent) {
    context.logger.warn(`package.json not found. You will need to run
    the build command as 'gulp --gulpfile gulpfile.lib.js'`);
    return false;
  }
  return true;
}

export interface DevDependency {
  name: string;
  version: string;
}

/**
 * Returns the json token of a property inside a json object
 */
function getJsonToken(packageJsonAst: JsonAstObject, key: string): JsonAstObject | null {
  for (const property of packageJsonAst.properties) {
    if (property.key.value == key) {
      if (property.value.kind !== 'object') {
        throw new Error(`Invalid "package.json" file. "${key}" needs to be an object`);
      }
      return property.value;
    }
  }
  return null;
}

/**
 * Adds a several propertyName: value inside of a json file
 */
function appendPropsToAstObject(
  recorder: UpdateRecorder,
  node: JsonAstObject,
  dependencies: DevDependency[],
  indent = 4,
) {
  const indentStr = '\n' + new Array(indent + 1).join(' ');

  if (node.properties.length > 0) {
    // Insert comma.
    const last = node.properties[node.properties.length - 1];
    recorder.insertRight(last.start.offset + last.text.replace(/\s+$/, '').length, ',');
  }

  let textToInsert = '';
  for (let i = 0; i < dependencies.length; i++) {
    const dep = dependencies[i];
    textToInsert +=
    '  '
    + `"${dep.name}": ${JSON.stringify(dep.version, null, 2).replace(/\n/g, indentStr)}`;
    if (i < dependencies.length - 1) {
      textToInsert += ',';
    }
    textToInsert += indentStr.slice(0, -2);
  }

  recorder.insertLeft(
    node.end.offset - 1,
    textToInsert,
  );
}
