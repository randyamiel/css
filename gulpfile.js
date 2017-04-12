// *************************************
//
//   Gulpfile
//
// *************************************
//
// Available tasks:
//   `gulp`
//   `gulp build`
//      `gulp compile:css`
//      `gulp compile:docs`
//      `gulp compile:site`
//   `gulp clean`
//   `gulp dev`
//   `gulp lint`
//      `gulp lint:css`
//      `gulp lint:site`
//   `gulp svg:optimize`
//   `gulp svg:store`
//   `gulp watch`
//   `gulp serve`
//
// *************************************


// -------------------------------------
//   Modules
// -------------------------------------
//
// gulp           : The streaming build system
// gulp-concat    : Concatenate files
// annotateBlock  : Parse css for 1 comment block
// del            : Compile CoffeeScript files
// fs             : Lint your CoffeeScript
// glob           : File pattern matching
// hb             : Template parser
// is-color       : Validate hex colors
// frontMatter    : Used to extract meta yaml
// gulp-pandoc    : File converter
// gulp-postcss   : Transform styles with JS
// gulp-rename    : Rename files
// gulp-server    : Serve the website for dev
// gulp-stylelint : Lint the styles
// stylelint-order: Stylelint plugin
// gulp-svgstore  : Combine svg files
// gulp-tap       : Easily tap into a pipeline (debug)
// gulp-wrap      : Wrap stream contents to template
//
// postcss-for       : Allow at-for loops
// postcss-variables : Allow at-vars in at-for loops
// postcss-import    : Include css files with `@`
// postcss-commas    : Allow lists of properties per value
// postcss-cssnext   : Collection of future proof plugins
// cssnano           : CSS minify
// lost              : Grid system
//
// -------------------------------------

let gulp = require(`gulp`);
let browserSync = require(`browser-sync`).create(),
    concat = require(`gulp-concat`),
    annotateBlock = require(`css-annotation-block`),
    del = require(`del`),
    frontMatter = require('gulp-front-matter'),
    fs = require(`fs`),
    glob = require(`glob`),
    hb = require(`gulp-hb`),
    isColor = require(`is-color`),
    pandoc = require(`gulp-pandoc`),
    postcss = require(`gulp-postcss`),
    rename = require(`gulp-rename`),
    server = require(`gulp-server-livereload`),
    stylelint = require(`gulp-stylelint`),
    svgstore = require(`gulp-svgstore`),
    tap = require(`gulp-tap`),
    wrap = require(`gulp-wrap`);


// -------------------------------------
//   PostCSS Plugins
// -------------------------------------
let atFor = require(`postcss-for`),
  atImport = require(`postcss-import`),
  atVariables = require(`postcss-at-rules-variables`),
  commas     = require(`postcss-commas`),
  cssnext    = require(`postcss-cssnext`),
  cssnano    = require(`cssnano`),
  lost       = require(`lost`);


// -------------------------------------
//   Globals
// -------------------------------------
let PATHS = {
  src:  {},
  dist: {},
  site: {}
};

// Source
PATHS.src.root      = `src`;
PATHS.src.docs      = `${PATHS.src.root}/docs`;
PATHS.src.css       = `${PATHS.src.root}/css`;
PATHS.src.icons     = `${PATHS.src.root}/icons`;

// Dist
PATHS.dist.root = `dist`;
PATHS.dist.css  = `${PATHS.dist.root}/css`;

// Website
PATHS.site.root      = `site`
PATHS.site.css       = `${PATHS.site.root}/css`;
PATHS.site.templates = `${PATHS.site.root}/templates`;
PATHS.site.www       = `${PATHS.site.root}/www`;


let CSS_VAR_ANNOTATIONS = parseVarAnnotations();
let COLORS_ARR = parseColorAnnotations();
let ICONS_ARR = parseIcons();
let SVG_HTML = fs.readFileSync(`${PATHS.src.root}/icons/icons.svg`, `utf-8`);


// -------------------------------------
//   Task: Default
// -------------------------------------
// Does a full build and runs the site
gulp.task(`default`, [`build`, `serve`]);



// -------------------------------------
//   Task: Build
// -------------------------------------
gulp.task(`build`, [`svg:store`, `compile:colors`, `compile:css`, `compile:docs`, `compile:site`]);


// -------------------------------------
//   Task: build-watch
//   A task that ensures reload after
//   everything is built (for serve task)
// -------------------------------------
gulp.task(`build-watch`, [`compile:colors`, `compile:css`, `compile:docs`, `compile:site`], function (done) {
    browserSync.reload();
    done();
});


// -------------------------------------
//   Task: Compile Colors List
// -------------------------------------
gulp.task(`compile:colors`, function () {
  COLORS_ARR = parseColorAnnotations();
});


// -------------------------------------
//   Task: Compile CSS
// -------------------------------------
gulp.task(`compile:css`, function () {

  // Note: plugin order matters
  let plugins = [
    atImport,
    commas,
    atVariables,
    atFor,
    lost,
    cssnext
  ];

  let postcssOptions = {
    map: true
  };

  return gulp.src(`${PATHS.src.css}/soho-foundation.css`)
    .pipe(postcss(plugins, postcssOptions))
    .pipe(gulp.dest(PATHS.dist.css))
    .pipe(postcss([
      require(`cssnano`)({ autoprefixer: false })
    ], postcssOptions))
    .pipe(rename({ extname: `.min.css` }))
    .pipe(gulp.dest(PATHS.dist.css))
    .pipe(gulp.dest(PATHS.site.www + `/css`));
});

// -------------------------------------
//   Task: Compile Docs
// -------------------------------------
gulp.task(`compile:docs`, function() {
  var templateData = CSS_VAR_ANNOTATIONS;
  templateData.colorSwatches = COLORS_ARR;
  templateData.svgIcons = ICONS_ARR;

  let hbStream = hb().data(templateData);

  return gulp.src(`${PATHS.src.docs}/*.md`)
    .pipe(hbStream)
    .pipe(frontMatter({
      property: 'meta',
      remove: true
    }))
    .pipe(pandoc({
       from: `markdown-markdown_in_html_blocks`, // http://pandoc.org/MANUAL.html#raw-html
       to: `html5`,
       ext: `.html`,
       args: [`--smart`]
    }))
    .pipe(wrap({
        src: `${PATHS.site.templates}/page.hbs`
      }, {
        icons: SVG_HTML,
      }, {
        engine: `handlebars`
      }
    ))
    .pipe(gulp.dest(PATHS.site.www));
});


// -------------------------------------
//   Task: Compile Site
// -------------------------------------
gulp.task(`compile:site`, function () {

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

  return gulp.src(`${PATHS.site.css}/site.css`)
    .pipe(postcss(plugins, { map: true }))
    .pipe(rename({ extname: `.min.css` }))
    .pipe(gulp.dest(`${PATHS.site.www}/css`));
});


// -------------------------------------
//   Task: Clean
// -------------------------------------
gulp.task(`clean`, function () {
  return del([
    PATHS.dist.root,
    PATHS.site.www
  ]);
});


// -------------------------------------
//   Task: Dev
// -------------------------------------
gulp.task(`dev`, [`default`, `watch`]);


// -------------------------------------
//   Task: Lint CSS
// -------------------------------------
gulp.task(`lint`, [`lint:css`, `lint:site`]);


// -------------------------------------
//   Task: Lint src css
// -------------------------------------
gulp.task(`lint:css`, function() {
  return gulp.src(`${PATHS.src.css}/*.css`)
    .pipe(stylelint({
      failAfterError: true,
      reporters: [{
        formatter: `verbose`,
        console: true
      }]
    }))
});

// -------------------------------------
//   Task: Lint site css
// -------------------------------------
gulp.task(`lint:site`, function() {
  return gulp.src(`${PATHS.site.css}/*.css`)
    .pipe(stylelint({
      failAfterError: true,
      reporters: [{
        formatter: `verbose`,
        console: true
      }]
    }))
});


// -------------------------------------
//   Task: SVG Optimization
// -------------------------------------
gulp.task(`svg:optimize`, function() {
  let svgs = `${PATHS.src.icons}/svg/*.svg`;
  return gulp.src(svgs)
    .pipe(svgmin())
    .pipe(gulp.dest(svgs));
});


// -------------------------------------
//   Task: SVG building / listing
// -------------------------------------
gulp.task(`svg:store`, function() {
  ICONS_ARR = parseIcons(); // Refresh icons list

  return gulp.src(`${PATHS.src.icons}/svg/*.svg`)
    .pipe(svgstore({ inlineSvg: true }))
    .pipe(rename(`icons.svg`))
    .pipe(gulp.dest(PATHS.src.icons))
    .pipe(gulp.dest(PATHS.dist.root));
});


// -------------------------------------
//   Task: Serve
// -------------------------------------
gulp.task(`serve`, function() {
  browserSync.init({
    codesync: false,
    injectChanges: false,
    open: false,
    server: {
      baseDir: PATHS.site.www
    },
    logLevel: `basic`,
    logPrefix: `Soho-Fnd`
  });

  let files = [
    `${PATHS.src.css}/**/*.css`,
    `${PATHS.src.docs}/*.md`,
    `${PATHS.site.css}/*.css`,
    `${PATHS.site.templates}/*.hbs`
  ];

  gulp.watch(files, [`build-watch`]);
});


// -------------------------------------
//   Function: parseColorAnnotations()
// -------------------------------------
function parseColorAnnotations() {
  let path = `${PATHS.src.css}/variables/_colors.css`;
  let content = fs.readFileSync(path, `utf-8`).trim();
  let blocks = annotateBlock(content);
  let colorBlock = [];

  blocks.forEach(block => {
    if (block.name === `color`) {
      block.nodes.forEach(node => {
        colorBlock.push(node);
      });
    }
  });

  let colorSwatches = [];
  colorBlock.forEach(color => {
    color.walkDecls(decl => {
      if (isColor(decl.value)) {
        colorSwatches.push({
          name: decl.prop.replace(/^--/, ``),
          color: decl.value
        });
      }
    });
  });
  return colorSwatches;
};


// -------------------------------------
//   Function: parseIcons()
// -------------------------------------
function parseIcons() {
  let iconFiles = glob.sync(`*.svg`, { cwd: `${PATHS.src.icons}/svg` })
  return iconSet = iconFiles.map(file => {
    return file.substring(0, file.lastIndexOf(`.`));
  });
};


// -------------------------------------
//   Function: parseVarAnnotations()
// -------------------------------------
function parseVarAnnotations() {
  let path = `${PATHS.src.css}/_variables.css`;
  let content = fs.readFileSync(path, `utf-8`).trim();
  let blocks = annotateBlock(content);
  let annotationsData = {};

  blocks.forEach(block => {

    annotationsData[block.name] = [];

    block.nodes.forEach(node => {
      node.walkDecls(decl => {
        annotationsData[block.name].push({
          name: decl.prop.replace(/^--/, ``),
          value: decl.value
        });
      });
    });
  });

  return annotationsData;
};


// -------------------------------------
// Task: Deploy (Lepore only)
// Copies the WWW folder on Lepore`s machine to his dropbox folder for temporary viewing
// -------------------------------------
gulp.task(`deploy`, [`lint`, `build`], function() {
  let gutil = require(`gulp-util`);
  let exec = require(`child_process`).exec;

  let src = `~/HookandLoop/git/soho/soho-foundation/site/www/*`,
      dest = ` ~/Dropbox/Public/soho-foundation`;

  return exec(`cp -R ${src} ${dest}`, function (err, stdout, stderr) {
    gutil.log(`Deployed to https://dl.dropboxusercontent.com/u/21521721/soho-foundation/index.html`);

    console.log(stdout);
    console.log(stderr);
  });
});
// -------------------------------------
