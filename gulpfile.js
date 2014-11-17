/* global require */

var gulp = require('gulp')
var jshint = require('gulp-jshint')
var mochaPhantomJS = require('gulp-mocha-phantomjs')


// https://github.com/spenceralger/gulp-jshint
gulp.task('jshint', function() {
    var globs = [
        'src/*.js', 'test/*.js'
    ]
    return gulp.src(globs)
        .pipe(jshint('.jshintrc'))
        .pipe(jshint.reporter('jshint-stylish'))
})

// https://github.com/mrhooray/gulp-mocha-phantomjs
gulp.task('test', function() {
    return gulp.src('test/*.html')
        .pipe(mochaPhantomJS({
            reporter: 'spec'
        }))
})

// https://github.com/floatdrop/gulp-watch
gulp.task('watch', function( /*callback*/ ) {
    var globs = [
        'src/*.js', 'test/*.js'
    ]
    gulp.watch(globs, ['jshint', 'test'])
})

gulp.task('default', ['jshint', 'test', 'watch'])