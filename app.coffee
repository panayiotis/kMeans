'use strict'

# simple express server
fs = require('fs')
express = require('express')
router = express.Router()
app = express()
app.locals.pretty = true
app.set 'view engine', 'jade'
app.use express.static('public')
app.listen 5000

# Read Iris data file
iris_data = "sepal length,sepal width,petal length,petal width,species\n" + fs.readFileSync('./iris.data').toString()
iris_data = iris_data.replace(/^\s*\n/gm, "")

# Read Yeast data file
yeast_data = "name  mcg  gvh  alm  mit  erl  pox  vac  nuc  site\n" + fs.readFileSync('./yeast.data').toString()
yeast_data = yeast_data.replace(/^\s*\n/gm, "")
yeast_data = yeast_data.replace(/ +/g, ",")

app.get '/', (req, res) ->
  
  # Stylesheets
  stylesheets = fs.readFileSync('./public/application.css').toString()
  
  # Javascripts
  #javascripts = fs.readFileSync('./bower_components/lodash/lodash.min.js').toString() +
  #fs.readFileSync('./bower_components/d3/d3.min.js').toString() +
  #fs.readFileSync('./public/kmeans.js').toString() +
  #fs.readFileSync('./public/visualization.js').toString()
  
  
  javascripts = fs.readFileSync('./public/application.js').toString()
  
  code = fs.readFileSync('./app/javascripts/kmeans.coffee').toString()
  tests = fs.readFileSync('./spec/kmeans_spec.coffee').toString()

  res.render 'index',
    title      : 'Kmeans Visualization'
    message    : 'Hello there!'
    iris_data  : iris_data
    yeast_data : yeast_data
    stylesheets: stylesheets
    javascripts: javascripts
    code       : code
    tests      : tests
  return
