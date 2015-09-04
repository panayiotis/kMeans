gulp        = require 'gulp'
gutil       = require 'gulp-util'
concat      = require 'gulp-concat'
prefix      = require 'gulp-autoprefixer'
coffee      = require 'gulp-coffee'
sourcemaps  = require 'gulp-sourcemaps'
nodemon     = require 'gulp-nodemon'
sass        = require 'gulp-sass'
uglify      = require 'gulp-uglify'
jasmine     = require 'gulp-jasmine'
browserSync = require 'browser-sync'
spawn       = require('child_process').spawn
exec        = require('child_process').exec
reload      = browserSync.reload
chalk       = gutil.colors


# Paths
paths =
  coffee: [ './app/javascripts/*.coffee' ]
  spec:   [ './spec/*' ]
  js:     [
            'vendor/components/lodash/lodash.min.js'
            'vendor/components/d3/d3.min.js'
            'vendor/components/highlightjs/highlight.coffee.js'
            'public/*.js'
            '!public/application.js'
          ]
  sass:   [
            'vendor/components/foundation/scss/*.scss'
            'app/stylesheets/*.scss'
          ]
  sass_paths: [
               'vendor/components/foundation/scss/'
               'app/stylesheets/'
              ]
  css:    [
            'vendor/components/highlightjs/styles/tomorrow.css'
            './public/*.css'
            '!./public/application.css'
          ]
  views:  [ 'views/*.jade' ]


# Javascript
# concaternate javascripts to
gulp.task 'javascript', ['coffee'], ->
  gulp.src paths.js
      .pipe concat('application.js')
      .pipe gulp.dest('./public/')


# Coffeescript
# compile .coffee files to js
gulp.task 'coffee', ->
  gulp.src paths.coffee
      .pipe sourcemaps.init()
      .pipe coffee({bare: true}).on 'error', (error) ->
        gutil.log(
          chalk.red(error.name),
          "from #{error.plugin}\n",
          "#{chalk.yellow(error.message)}\n",
          "\n#{chalk.yellow('Error Stack')}\n#{error.stack}"
        )
        
        spawn 'notify-send', [
          '--urgency=low'
          '--expire-time=5'
          '--icon=/home/panos/Pictures/coffeescript.svg'
          "Coffeescript " + error.name
          error.message
        ]
        #.pipe uglify()
      .pipe sourcemaps.write()
      .pipe gulp.dest('./public/')

# Stylesheets
# concaternate css together
gulp.task 'stylesheets', ['sass'], ->
  gulp.src paths.css
      .pipe concat('application.css')
      .pipe gulp.dest('public')
      .pipe reload(stream: true)


# Sass
# compile .scss files to css
gulp.task 'sass', ->
  gulp.src paths.sass
      .pipe sass(
        includePaths: paths.sass_paths
        outputStyle: 'expanded'
      , errLogToConsole: true)
      .pipe prefix 'last 2 versions','> 1%','ie 8','Android 2','Firefox ESR'
      .pipe gulp.dest('public/')
      .pipe reload(stream: true)
      


gulp.task 'browser-sync', [ 'nodemon' ], ->
  browserSync.init
    # Express server starts on port 5000
    proxy: 'localhost:5000'
    browser: ['google-chrome']


gulp.task 'default', [ 'watch', 'javascript', 'stylesheets', 'browser-sync']


gulp.task 'watch', ->
  console.reset()
  gulp.watch paths.sass,                 ['stylesheets']
  gulp.watch paths.coffee,               ['javascript']
  gulp.watch paths.views,                  reload
  gulp.watch ['./public/application.css'],  reload
  gulp.watch ['./public/application.js'],  reload

gulp.task 'wget', ->
  console.log('wget html page')
  spawn 'wget', ['http://localhost:5000/', '-O', 'kmeans.html']


gulp.task 'nodemon', (cb) ->
  # clear terminal
  process.stdout.write('\x1b[2J\x1b[1;1H')
  called = false
  
  nodemon
    # nodemon our expressjs server
    script: 'app.coffee'
    # watch core server file(s) that require server restart on change
    watch: ['app.coffee']
  
  .on 'start', ->
    # ensure start only got called once
    if !called
      called = true
      cb()
  .on 'restart', ->
    # reload connected browsers after a slight delay
    setTimeout (->
      reload stream: false
    ), 500


gulp.task 'jasmine', ->
  console.reset()
  gulp.src paths.coffee.concat(paths.specs)
  .pipe jasmine(includeStackTrace: true)
  .on('error', (error) ->
    gutil.log(
      chalk.red(error.name),
      "from #{error.plugin}\n",
      "#{chalk.yellow(error.message)}\n",
      "\n#{chalk.yellow('Error Stack')}\n#{error.stack}"
    )
  )


gulp.task 'test', ['jasmine'], ->
  gulp.watch [ 'app/javascripts/kmeans.coffee', 'spec/*' ], [ 'jasmine' ]


gulp.task 'deploy', ['wget'], ->
  exec 'scp', [
    '/home/panos/kmeans/kmeans.html'
    'root@vlantis.gr:/var/www/html/static/'
  ]
