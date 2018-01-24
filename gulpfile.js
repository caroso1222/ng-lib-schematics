const gulp = require('gulp'),
      tsc = require('gulp-typescript').createProject('tsconfig.json'),
      jeditor  = require('gulp-json-editor'),
      del = require("del"),
      gulpSrc = require('gulp-src-ordered-globs');

/**
 * Source dir where all the schematics are located
 */
const srcDir = 'src';      
    
/**
 * Folder for compiled files
 */
const distDir = 'dist';

/**
 * Files being watched in ./ to be copied to /dist
 */
const rootFiles = [
  'package.json',
  'README.md'
];

/**
 * Globs to select all files but .ts
 */
const allButTsGlob = [
  `${srcDir}/**/*`,
  `!${srcDir}/**/*.ts`,
  `${srcDir}/**/*.d.ts`,
  `${srcDir}/**/files/**/*.ts`
];

/**
 * Run TypeScript compiler
 */
gulp.task('tsc', function() {
  // use tsc.src() instead of gulp.src(...) to load files based 
  // on the tsconfig file: files, excludes and includes
  const tsResult = tsc.src().pipe(tsc());
  return tsResult.pipe(gulp.dest(`${distDir}/`));
});

/**
 * Copy ./src into ./dist, but ignore .ts files
 */
gulp.task('copy:src', function() {
  gulpSrc(allButTsGlob)
    .pipe(gulp.dest(`${distDir}/`));
});

/**
 * Copy files in 'rootFiles' into ./dist
 */
gulp.task('copy:root', function() {
  gulp.src(rootFiles)
    .pipe(gulp.dest(`${distDir}/`));
});

/**
 * Set 'private' to false when moving the manifest to dist
 * so that it becomes publishable
 */
gulp.task('edit:manifest', function() {
  gulp.src('package.json')
    .pipe(jeditor({
      'private': false
    }))
    .pipe(gulp.dest(`${distDir}/`));
});

/**
 * Clean dist directory
 */
gulp.task('clean', function() {
  return del.sync([distDir]);
});

/**
 * Watch changes and run relevant tasks
 */
gulp.task('watch', function() {
  gulp.watch([
    `${srcDir}/**/*.ts`,
    `!${srcDir}/**/files/**/*.ts`,
    `!${srcDir}/**/*.d.ts`
  ], ['tsc']);
  gulp.watch(allButTsGlob, ['copy:src']);
  gulp.watch(rootFiles, ['copy:root', 'edit:manifest']);
});

gulp.task('build', ['clean', 'tsc', 'copy:src', 'copy:root', 'edit:manifest']);

gulp.task('default', ['clean', 'build', 'watch']);
