var gulp = require('gulp');
var eslint = require('gulp-eslint');
var babel = require('gulp-babel');
var mocha = require('gulp-mocha');
require('babel-core/register');

// Lint Task
gulp.task('lint', function() {
    return gulp.src(['src/**/*.js'])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});

gulp.task('scripts', function() {
    return gulp.src('src/**/*.js')
        .pipe(babel())
        .pipe(gulp.dest('dist'));
});

gulp.task('test', function() {
    return gulp.src('test/**/*.js', {read: false})
        .pipe(babel())
        .pipe(mocha({
            require: [__dirname + '/test/utils/dom'],
            reporter: 'nyan'
        }));
});

gulp.task('watch', function() {
    gulp.watch('src/**/*.js', ['lint', 'scripts']);
});

// Default Task
gulp.task('default', ['lint', 'scripts', 'test']);
