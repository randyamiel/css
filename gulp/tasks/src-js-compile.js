// -------------------------------------
//   Task: Build Packages JS
// -------------------------------------

module.exports = (gulp, paths) => {

  const rename = require('gulp-rename');
  const path = require('path');
  const webpack = require('webpack');
  const named = require('vinyl-named'); // Use to keep individual files instead one bundle
  const webpackStream = require('webpack-stream');

  gulp.task('src:js:compile', () => {
    const devConfig = require(path.resolve(`${paths.root}/webpack.dev.js`));

    return gulp.src([`${paths.src.packages}/*/*.js`])
      .pipe(named())
      .pipe(webpackStream(devConfig), webpack)
      .pipe(rename((path) => {
        path.dirname += `/${paths.project.prefix}${path.basename}/dist`;
      }))
      .pipe(gulp.dest(paths.demo))
      .pipe(gulp.dest(paths.src.packages));
  });

  // gulp.task('src-jsprod', () => {
  //   const prodConfig = require(path.resolve(`${paths.root}/webpack.prod.js`));

  //   return gulp.src([`${paths.src.packages}/**/tab.js`,`${paths.src.packages}/**/select.js`])
  //     .pipe(named())
  //     .pipe(webpackStream(prodConfig), webpack)
  //     .pipe(rename((path) => {
  //       path.dirname += `/${paths.project.prefix}${path.basename}/dist`;
  //     }))
  //     .pipe(gulp.dest(paths.src.packages));
  // });
}
