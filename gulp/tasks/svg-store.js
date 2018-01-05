// --------------------------------------------------------------------------
//   Task: SVG Store
//   Bundles the svgs into 1 file
// --------------------------------------------------------------------------

module.exports = (gulp, gconfig) => {

  const svgstore = require('gulp-svgstore');
  const rename = require('gulp-rename');

  gulp.task('svg:store', ['sketch:to:svgs'], () => {

    const curPkg = `${gconfig.paths.src.packages}/${gconfig.project.prefix}-icon`;
    const allComponentsPkg = `${gconfig.paths.src.packages}/${gconfig.project.prefix}-web`;

    return gulp.src(`${curPkg}/dist/svgs/*.svg`)
      .pipe(svgstore({ inlineSvg: true }))
      .pipe(rename(`${gconfig.project.prefix}-icons.svg`))
      .pipe(gulp.dest(`${curPkg}/dist`))
      .pipe(gulp.dest(`${allComponentsPkg}/dist`));
  });
}
