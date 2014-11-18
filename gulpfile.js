/* global require */
var gulp = require('gulp')
var jshint = require('gulp-jshint')
var rjs = require('gulp-requirejs')
var mochaPhantomJS = require('gulp-mocha-phantomjs')

var globs = ['src/**/*.js', 'test/*.js', 'gulpfile.js']
var watchTasks = ['jshint', 'rjs', 'test']

// https://github.com/spenceralger/gulp-jshint
gulp.task('jshint', function() {
    return gulp.src(globs)
        .pipe(jshint('.jshintrc'))
        .pipe(jshint.reporter('jshint-stylish'))
})

// https://github.com/RobinThrift/gulp-requirejs
// http://requirejs.org/docs/optimization.html#empty
gulp.task('rjs', function() {
    var build = {
        baseUrl: 'src',
        name: 'brix/event',
        out: 'dist/event.js',
        paths: {
            jquery: 'empty:',
            underscore: 'empty:'
        }
    }
    rjs(build)
        .pipe(gulp.dest('.')) // pipe it to the output DIR
})

// https://github.com/floatdrop/gulp-watch
gulp.task('watch', function( /*callback*/ ) {
    gulp.watch(globs, watchTasks)
})

// https://github.com/mrhooray/gulp-mocha-phantomjs
gulp.task('test', function() {
    return gulp.src('test/*.html')
        .pipe(mochaPhantomJS({
            reporter: 'spec'
        }))
})

gulp.task('default', watchTasks.concat(['watch']))