// -------------------------------------
//   Task: Serve Demo & site files,
//   then watch
// -------------------------------------

module.exports = (gulp, paths) => {

  const browserSync = require('browser-sync').create('localDocServer');

  gulp.task('serve', () => {

    const
      gutil = require('gulp-util'),
      path = require('path');

    browserSync.init({
      codesync: false,
      index: 'base.html',
      injectChanges: false,
      open: false,
      server: {
        baseDir: [paths.dest.site, paths.dest.demo]
      },
      logLevel: 'info',
      logPrefix: 'IUX',
      ui: false
    });

    const demoFiles = [
      `${paths.dest.demo}/*/*.html`,
      `${paths.dest.demo}/demo.css`
    ];

    const siteFiles = [
      `${paths.src.site}/css/**/*`,
      `${paths.src.site}/templates/**/*`
    ];

    const packageFiles = [
      `!${paths.src.packages}/*/dist`,
      `${paths.src.packages}/*/+(*.css|*.js|*.md)`
    ];

    const changeEvent = (evt) => {
      gutil.log('File', gutil.colors.cyan(evt.path.replace(new RegExp('/.*(?=/' + paths.root + ')/'), '')), 'was', gutil.colors.magenta(evt.type));
    };

    gulp
      .watch(demoFiles, ['watch-demo'])
      .on('change', (evt) => {
        changeEvent(evt);
      });

    gulp
      .watch(siteFiles, ['watch-site'])
      .on('change', (evt) => {
        changeEvent(evt);
      });

    gulp
      .watch(packageFiles, ['watch-packages'])
      .on('change', (evt) => {
        changeEvent(evt);
      });
  });

  gulp.task('watch-demo', (done) => {
    browserSync.reload();
    done();
  });

  gulp.task('watch-site', ['build:site'], (done) => {
    browserSync.reload();
    done();
  });

  gulp.task('watch-packages', ['build'], (done) => {
    browserSync.reload();
    done();
  });
}
