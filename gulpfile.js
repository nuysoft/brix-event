/* global require, console */
var gulp = require('gulp')
var through = require('through2')
var connect = require('gulp-connect')
var jshint = require('gulp-jshint')
var rjs = require('gulp-requirejs')
var uglify = require('gulp-uglify')
var mochaPhantomJS = require('gulp-mocha-phantomjs')
var exec = require('child_process').exec

var globs = ['src/**/*.js', 'test/*.js', 'gulpfile.js']
var watchTasks = ['hello', 'madge', 'jshint', 'rjs', 'compress', 'test']

gulp.task('hello', function() {
    console.log((function() {
        /*
______        _         _____                    _   
| ___ \      (_)       |  ___|                  | |  
| |_/ / _ __  _ __  __ | |__ __   __ ___  _ __  | |_ 
| ___ \| '__|| |\ \/ / |  __|\ \ / // _ \| '_ \ | __|
| |_/ /| |   | | >  <  | |___ \ V /|  __/| | | || |_ 
\____/ |_|   |_|/_/\_\ \____/  \_/  \___||_| |_| \__|
        */
    }).toString().split('\n').slice(2, -2).join('\n') + '\n')
})

// https://github.com/AveVlad/gulp-connect
gulp.task('connect', function() {
    connect.server({
        port: 4246,
        middleware: function( /*connect, opt*/ ) {
            return [
                // https://github.com/senchalabs/connect/#use-middleware
                /* jshint unused:true */
                function cors(req, res, next) {
                    if (req.method === 'POST') req.method = 'GET'
                    next()
                }
            ]
        }
    })
})

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

// https://github.com/terinjokes/gulp-uglify
gulp.task('compress', function() {
    gulp.src(['dist/**.js','!dist/**-debug.js'])
        .pipe(through.obj(function(file, encoding, callback) { /* jshint unused:false */
            file.path = file.path.replace(
                '.js',
                '-debug.js'
            )
            callback(null, file)
        }))
        .pipe(gulp.dest('dist/'))
    gulp.src(['dist/**.js','!dist/**-debug.js'])
        .pipe(uglify())
        .pipe(gulp.dest('dist/'))
})

// https://github.com/pahen/madge
gulp.task('madge', function( /*callback*/ ) {
    exec('madge --format amd ./src/',
        function(error, stdout /*, stderr*/ ) {
            if (error) console.log('exec error: ' + error)
            console.log('module dependencies:')
            console.log(stdout)
        }
    )
    exec('madge --format amd --image ./doc/dependencies.png ./src/',
        function(error /*, stdout, stderr*/ ) {
            if (error) console.log('exec error: ' + error)
        }
    )
})

gulp.task('default', watchTasks.concat(['watch']))