# Angular Library Schematics

Create Angular libraries in no time using [Schematics](https://github.com/angular/devkit). Think of `ng generate component`, but for libraries.

### Features
* Easily generate libraries from scratch or within your existing Angular project. 
* Release a build that follows Angular standards: UMD, ES5 and ES2015 bundles + typings.
* Seemless integration with Angular CLI. Your library playground will just be your well known Angular app.
* Test your library using karma + jasmine as you normally do in your Angular apps
* Support for dry run
* SASS and [autoprefixer](https://github.com/postcss/autoprefixer) support.

### Installation
1. It's recommended to install the schematics globally because you'll likely use it to create projects from scratch where no `node_modules` is yet available.
```
npm i -g ng-lib-schematics
```

2. Make sure you have the Angular DevKit dependencies to run the schematics:
```
npm i -g @angular-devkit/core @angular-devkit/schematics-cli
```
 
### Basic Usage

This schematic will generate the library inside of an existing Angular project. If you already have a project in which you want to include your library then you can skip step 1.

1. Create an Angular project using the CLI. It's recommendable to skip install now to run `npm i` only once at step 3.
```
ng new <library-name> --skip-install
```

2. `cd` into your new project and run the schematics inside:
```
schematics ng-lib-schematics:lib-standalone --name <library-name>
```

3. Install dependencies
```
npm i
```

4. Import your library module inside `app.module.ts`. Your library is now just another module of your app:
```typescript
import { SampleModule } from '../lib';
...
imports: [ BrowserModule, SampleModule ]
```

5. Start using it! Go to your `app.component.html` and add the sample component:`<sample-component></sample-component>`. It should render this:
> <img src="https://image.ibb.co/ccwCXc/screenshot_localhost_4200_2018_02_26_10_59_58.png" alt="sample component rendering" width="20%">

**Note:** Make sure you run the schematics in dry run mode first to know upfront what this thing will do to your project. Once you get comfortable with all the changes you can run the schematics again without dry run. To dry run the schematic simply append the `--dry-run` flag to the command in step 2.

### Building and publishing your library

1. `npm run build:lib` 
2. `cd dist`
3. `npm publish`

**Important:** 
1. If you already have an npm script named `build:lib` in your project, then you'll have to manually run `gulp --gulpfile gulpfile.lib.js` to build the library.
2. TODO sync version

### Generated files

It's important that you know what this schematic will do and how your project will look like after applying it:

1. The library will live inside `src/lib`.
2. All your components, services, directives, etc will live inside the folder `src/lib/src`. You can safely change the names of the existing files inside this folder and go nuts building your library.
3. The build script will live inside `src/lib/build-tools` along with all the build utils.
4. A file `gulpfile.lib.js` will be created at the root of the project. It will simple import the main gulpfile located at `src/lib/src/build-tools/gulpfile.js`.
5. New dependencies will be added to your `devDependencies`. These are needed to build your library at the release stage.
6. Two npm scripts will be added to thet `scripts` object inside your main `package.json` file:
  a. `"build:lib": "gulp --gulpfile gulpfile.lib.js"`: Script to build the release artifacts of your library.
  b. `"version": "sync-json -v --property version --source package.json src/lib/package.json"`: Version hook to sync versions between your root `package.json` and `src/lib/package.json`. This will allow you to run `npm version <type>` at the root of your project and still have your library version up to date.

### Contributing

Thanks for even thinking about contributing. Open up issues or PRs and we'll discuss about it.

#### Testing your schematics build

1. Fork the project
2. Install dependencies `npm i`
3. Run `npm run watch`. This will output the schematic package to dist and watch for changes.
4. `cd` into `dist` and run `npm link`. At this point, `ng-lib-schematics` is symlinked to your global `node_modules.`
5. Create a dummy Angular project `ng new lib-test`
6. You can now run `schematics ng-lib-schematics:lib-standalone --name <library-name>`

### Hall of fame

Find below some of the libraries built on top of these schematics:

- [ngx-date-fns](https://github.com/joanllenas/ngx-date-fns): date-fns pipes for Angular 2.0 and above.

### Credits

I took a bunch of ideas from the [Yeoman's Angular library generator](https://github.com/jvandemo/generator-angular2-library) by [Jurgen Van de Moere](https://twitter.com/jvandemo). Feel free to use whatever works best for you, both Schematics and Yeoman will get you to the same exact point.

### Licence

MIT
