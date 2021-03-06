// -------------------------------------
//   Task: StyleLint Packages
//   Lint the package source css
// -------------------------------------

module.exports = (gulp, gconfig) => {

  gulp.task('src:css:lint', () => {

    const stylelint = require('gulp-stylelint');

    return gulp.src([
        `${gconfig.paths.src.packages}/*/*.css`,
        `${gconfig.paths.src.packages}/*/css/*.css`
      ])
      .pipe(stylelint(gconfig.options.stylelint));
  });
}
