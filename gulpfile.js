// *************************************
//
//   Gulpfile
//
// *************************************
//
// Available tasks:
//   'gulp default'
//   'gulp build'
//      'gulp compile:docs'
//      'gulp compile:site'
//      'gulp compile:src'
//   'gulp clean'
//   'gulp lint'
//      'gulp lint:css'
//      'gulp lint:site'
//   'gulp serve'
//   'gulp svg:optimize'
//   'gulp svg:store'
//   'gulp watch-docs'
//   'gulp watch-site'
//   'gulp watch-src'
//
// *************************************

let gulp       = require('gulp'),
  gConfig      = require('./gulp-config.js'),
  basePath     = gConfig.paths.base.root;
  sources      = gConfig.paths.sources,
  destinations = gConfig.paths.destinations;

// -------------------------------------
// Load "gulp-" plugins
// -------------------------------------
// gulp           : The streaming build system
// gulp-concat    : Concatenate files
// gulp-pandoc    : File converter
// gulp-postcss   : Transform styles with JS
// gulp-rename    : Rename files
// gulp-stylelint : Lint the styles
// gulp-svgmin    : SVGO for gulp
// gulp-svgstore  : Combine svg files
// gulp-tap       : Easily tap into a pipeline (debug)
// gulp-util      : Utility functions for gulp plugins
// -------------------------------------
let concat = require('gulp-concat'),
  hb = require('gulp-hb'),
  pandoc = require('gulp-pandoc'),
  postcss = require('gulp-postcss'),
  rename = require('gulp-rename'),
  stylelint = require('gulp-stylelint'),
  svgmin = require('gulp-svgmin'),
  svgstore = require('gulp-svgstore'),
  tap = require('gulp-tap'),
  gutil = require('gulp-util');


// -------------------------------------
//   Utility NPM Plugins
// -------------------------------------
// annotateBlock  : Parse css for comment blocks
// del            : Delete files
// fs             : Read/sync file stream
// glob           : File pattern matching
// hb             : Handlebars Template parser
// is-color       : Validate hex colors
// stylelint-order: Stylelint plugin
// -------------------------------------
let annotateBlock = require('css-annotation-block'),
  browserSync = require('browser-sync').create(),
  del = require('del'),
  fs = require('fs'),
  glob = require('glob'),
  isColor = require('is-color');


// -------------------------------------
//   PostCSS Plugins
// -------------------------------------
// postcss-for       : Allow at-for loops
// postcss-variables : Allow at-vars in at-for loops
// postcss-import    : Include css files with '@'
// postcss-commas    : Allow lists of properties per value
// postcss-cssnext   : Collection of future proof plugins
// cssnano           : CSS minify
// lost              : Grid system
// -------------------------------------
let atFor      = require('postcss-for'),
  atImport     = require('postcss-import'),
  atVariables  = require('postcss-at-rules-variables'),
  commas       = require('postcss-commas'),
  cssnext      = require('postcss-cssnext'),
  cssnano      = require('cssnano'),
  lost         = require('lost');


// -------------------------------------
//   Global Variables
// -------------------------------------
let ICONS_ARR = [];
let SVG_HTML = fs.readFileSync(`${sources.root}/icons/icons.svg`, 'utf-8');


// -------------------------------------
//   Task: Default
//   Does a build and serves the website
// -------------------------------------
gulp.task('default', ['build', 'serve']);


// -------------------------------------
//   Task: Build
// -------------------------------------
gulp.task('build', ['svg:store', 'compile:src', 'compile:docs', 'compile:site']);


// -------------------------------------
//   Task: Compile Docs
//   Compile foundation markdown files
// -------------------------------------
gulp.task('compile:docs', function() {
  let packageData = require('./package.json')
  let templateData = createCssAnnotations();

  if (ICONS_ARR.length === 0) {
    ICONS_ARR = parseIcons();;
  }
  templateData.svgIcons = ICONS_ARR;

  let hbStream = hb()
    .partials(`${sources.templates}/partials/*.hbs`)
    .data(templateData);

  return gulp.src(`${sources.docs}/*.md`)
    // Parse any handlebar templates in the markdown
    .pipe(hbStream)

    // Convert markdown to html and insert into layout template
    .pipe(pandoc({
      from: 'markdown-markdown_in_html_blocks', // http://pandoc.org/MANUAL.html#raw-html
      to: 'html5+yaml_metadata_block',
      ext: '.html',
      args: [
        `--data-dir=${sources.site}`, // looks for template dir inside data-dir so don't use path.site.templates
        '--template=layout.html',
        '--table-of-contents',
        `--variable=icons:${SVG_HTML}`,
        `--variable=releaseversion:${packageData.version}`
      ]
    }))
    .pipe(gulp.dest(destinations.www));
});


// -------------------------------------
//   Task: Compile Site
//   Compile the website css
// -------------------------------------
gulp.task('compile:site', function () {

  // Note: plugin order matters
  let plugins = [
    atImport,
    commas,
    atVariables,
    atFor,
    lost,
    cssnext,
    cssnano({ autoprefixer: false })
  ];

  return gulp.src(`${sources.siteCss}/site.css`)
    .pipe(postcss(plugins, { map: true }))
    .pipe(rename({ extname: '.min.css' }))
    .pipe(gulp.dest(`${destinations.www}/css`));
});


// -------------------------------------
//   Task: Compile Src
//   Compile Foundation source css
// -------------------------------------
gulp.task('compile:src', function () {

  // Note: plugin order matters
  let plugins = [
    atImport,
    commas,
    atVariables,
    atFor,
    lost,
    // Possible in the future to preserve the css vars to others' use
    // cssnext({ features: { customProperties: { preserve: true, appendVariables: true }}})
    cssnext
  ];

  let postcssOptions = {
    map: true
  };

  return gulp.src(`${sources.css}/*.css`)
    .pipe(postcss(plugins, postcssOptions))
    .pipe(gulp.dest(destinations.css))
    .pipe(postcss([
      require('cssnano')({ autoprefixer: false })
    ], postcssOptions))
    .pipe(rename({ extname: '.min.css' }))
    .pipe(gulp.dest(destinations.css))
    .pipe(gulp.dest(`${destinations.www}/css`));
});


// -------------------------------------
//   Task: Clean
//   Delete contents of '/www'
//   but not '/www/examples'
// -------------------------------------
gulp.task('clean', function () {
  return del([
    destinations.root,
    `${destinations.www}/**`,
    `!${destinations.www}`,
    `!${destinations.www}/examples/**`,
  ]);
});


// -------------------------------------
//   Task: Lint
// -------------------------------------
gulp.task('lint', ['lint:css', 'lint:site']);


// -------------------------------------
//   Task: Lint:css
//   Lint the foundation source css
// -------------------------------------
gulp.task('lint:css', function() {
  return gulp.src(`${sources.css}/**/*.css`)
    .pipe(stylelint({
      failAfterError: true,
      reporters: [{
        formatter: 'verbose',
        console: true
      }]
    }))
});

// -------------------------------------
//   Task: Lint:site
//   Lint the website css
// -------------------------------------
gulp.task('lint:site', function() {
  return gulp.src(`${sources.siteCss}/*.css`)
    .pipe(stylelint({
      failAfterError: true,
      reporters: [{
        formatter: 'verbose',
        console: true
      }]
    }))
});


// -------------------------------------
//   Task: Serve
//   Serve and watch files
// -------------------------------------
gulp.task('serve', function() {
  browserSync.init({
    codesync: false,
    injectChanges: false,
    open: false,
    server: {
      baseDir: destinations.www
    },
    logLevel: 'basic',
    logPrefix: 'Soho-Fnd'
  });


  let srcDocs = [
    `${sources.docs}/*.md`,
    `${sources.templates}/**/*`
  ];

  let siteCss = [
    `${sources.siteCss}/*.css`
  ];

  let srcCss = [
    `${sources.css}/**/*.css`
  ];

  gulp
    .watch(srcDocs, ['watch-docs'])
    .on('change', function(evt) {
      changeEvent(evt);
    });

  gulp
    .watch(siteCss, ['watch-site'])
    .on('change', function(evt) {
      changeEvent(evt);
    });

  gulp
    .watch(srcCss, ['watch-src'])
    .on('change', function(evt) {
      changeEvent(evt);
    });
});


// -------------------------------------
//   Task: SVG Optimization
//   Optimizes the svg icon markup
// -------------------------------------
gulp.task('svg:optimize', function() {
  return gulp.src(`${sources.icons}/svg/*.svg`)
    .pipe(svgmin())
    .pipe(gulp.dest(`${sources.icons}/svg`));
});


// -------------------------------------
//   Task: SVG Store
//   Creates and builds the svg icons
// -------------------------------------
gulp.task('svg:store', function() {
  ICONS_ARR = parseIcons(); // Refresh icons list

  return gulp.src(`${sources.icons}/svg/*.svg`)
    .pipe(svgstore({ inlineSvg: true }))
    .pipe(rename('icons.svg'))
    .pipe(gulp.dest(sources.icons))
    .pipe(gulp.dest(destinations.root));
});


// -------------------------------------
//   Task: watch-docs
//   Guarantees reload is last task
// -------------------------------------
gulp.task('watch-docs', ['compile:docs', 'compile:site'], function(done) {
  browserSync.reload();
  done();
});


// -------------------------------------
//   Task: watch-site
//   Guarantees reload is last task
// -------------------------------------
gulp.task('watch-site', ['compile:site'], function(done) {
  browserSync.reload();
  done();
});


// -------------------------------------
//   Task: watch-src
//   Guarantees reload is last task
// -------------------------------------
gulp.task('watch-src', ['compile:src', 'compile:docs', 'compile:site'], function(done) {
  browserSync.reload();
  done();
});


// -------------------------------------
//   Function: changeEvent()
// -------------------------------------
function changeEvent(evt) {
    gutil.log('File', gutil.colors.cyan(evt.path.replace(new RegExp('/.*(?=/' + basePath + ')/'), '')), 'was', gutil.colors.magneta(evt.type));
}


// -------------------------------------
//   Function: cloneSimpleObj()
// -------------------------------------
function cloneSimpleObj(obj) {
  return JSON.parse(JSON.stringify(obj));
}


// -------------------------------------
//   Function: cssVarToCamelCaseStr()
// -------------------------------------
function cssVarToCamelCaseStr(str) {
  // parse "var(--var-name)" into "--var-name"
  str = str.replace('var(', '').replace(')', '')
  str = str.substr(str.indexOf('--') + 2);

  // parse "var-name" into "varName"
  return str.replace(/-([a-z])/g, function (g) {
    return g[1].toUpperCase();
  });
}

// -------------------------------------
//   Function: createCssAnnotations()
// -------------------------------------
function createCssAnnotations() {
  let content, blocks, cssVarAnnotations = {};

  // Parse the defaults first
  let defaultVarsObj = parseCss(`${sources.css}/components/_variables.css`);

  let themes = [
    { name: 'themeDark',         path: `${sources.css}/themes/_theme-dark.css` },
    { name: 'themeHighContrast', path: `${sources.css}/themes/_theme-high-contrast.css` }
  ];

  cssVarAnnotations = {
    default: cloneSimpleObj(defaultVarsObj)
  };

  // Build the theme objects
  themes.forEach(theme => {
    cssVarAnnotations[theme.name] = cloneSimpleObj(cssVarAnnotations['default']);
    parseCss(theme.path, cssVarAnnotations[theme.name]);
  });

  return cssVarAnnotations;
};


// -------------------------------------
//   Function: isCssVar()
// -------------------------------------
function isCssVar(str) {
  return str.substr(0, 3) === 'var';
}


// -------------------------------------
//   Function: parseCss()
// -------------------------------------
function parseCss(cssPath, themeAnnotationsObj = {}) {
  let content,
      blocks;

  content = fs.readFileSync(cssPath, 'utf-8').trim();
  blocks = annotateBlock(content);

  blocks.forEach(block => {
    block.nodes.forEach(node => {
      node.walkDecls(decl => {

        let propStr = cssVarToCamelCaseStr(decl.prop);

        themeAnnotationsObj[propStr] = {
          originalDeclaration: decl.prop,
          originalValue: decl.value,
          value: decl.value
        };

        if (block.name === 'colorPalette') {
          themeAnnotationsObj[propStr].isColor = true;
        }
      });
    });
  });

  // Replace all values that are variables with actual values
  let val,
    varNameToLookUp = '';

  for (let cssProp in themeAnnotationsObj) {
    val = themeAnnotationsObj[cssProp].value;
    if (isCssVar(val)) {

      varNameToLookUp = cssVarToCamelCaseStr(val);

      // Set the current prop value of the variable
      themeAnnotationsObj[cssProp].value = themeAnnotationsObj[varNameToLookUp].value;
    }
  }
  return themeAnnotationsObj;
};


// -------------------------------------
//   Function: parseIcons()
// -------------------------------------
function parseIcons() {
  let iconFiles = glob.sync('*.svg', { cwd: `${sources.icons}/svg` })
  return iconSet = iconFiles.map(file => {
    return file.substring(0, file.lastIndexOf('.'));
  });
};


// -------------------------------------
// Task: Deploy (Lepore only)
// Copies the WWW folder on Lepore's machine to his dropbox folder for temporary viewing
// -------------------------------------
gulp.task('deploy', ['lint', 'build'], function() {
  let exec = require('child_process').exec;

  let src = '~/HookandLoop/git/soho/soho-foundation/site/www/*',
      dest = ' ~/Dropbox/Public/soho-foundation';

  return exec(`cp -R ${src} ${dest}`, function (err, stdout, stderr) {
    gutil.log('Deployed to https://dl.dropboxusercontent.com/u/21521721/soho-foundation/index.html');

    console.log(stdout);
    console.log(stderr);
  });
});
// -------------------------------------
