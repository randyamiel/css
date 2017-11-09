// -------------------------------------
//   Task: Build Site
//   Compile the website css
// -------------------------------------

module.exports = (gulp, gconfig, postCssPlugins) => {

  //   Task: Build Site Css
  gulp.task('site:css:compile', () => {
    const
      pkgJson  = require('../../package.json'),
      flatten  = require('gulp-flatten'),
      postcss  = require('gulp-postcss'),
      hb       = require('gulp-hb'),
      rename   = require('gulp-rename');

    // Note: plugin order matters
    const plugins = [
      postCssPlugins.atImport,
      postCssPlugins.commas,
      postCssPlugins.atVariables,
      postCssPlugins.atFor,
      postCssPlugins.lost,
      postCssPlugins.cssnext,
      postCssPlugins.cssnano({ autoprefixer: false })
    ];

    return gulp.src(`${gconfig.paths.site.root}/css/site.css`)
      .pipe(postcss(plugins, { map: true }))
      .pipe(rename({ suffix: '.min' }))
      .pipe(gulp.dest(`${gconfig.paths.site.www}/dist`));
  });
}
