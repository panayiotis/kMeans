
fs = require('fs')

# require d3 library for importing CSV dataset
require '../bower_components/d3/d3.js'

# require lodash library for utility functions
global._ = require '../bower_components/lodash/lodash.js'


# Before All
# Before all tests read Iris and yeast datasets and
# define some kMeans options that are common in all tests
beforeAll ->
  global.kMeans = require('../app/javascripts/kmeans.coffee')
  
  # import iris dataset
  iris_data = "sepal length,sepal width,petal length,petal width,species\n" + fs.readFileSync('./iris.data').toString()
  iris_data = iris_data.replace(/^\s*\n/gm, "")
  
  @iris = ->
    d3.csv.parse(iris_data)
  
  # import yeast dataset
  yeast_data = "name  mcg  gvh  alm  mit  erl  pox  vac  nuc  site\n" + fs.readFileSync('./yeast.data').toString()
  yeast_data = yeast_data.replace(/^\s*\n/gm, "")
  yeast_data = yeast_data.replace(/ +/g, ",")
  
  @yeast = ->
    d3.csv.parse(yeast_data)
  
  # dummy kMeans options
  @dummy_options =
    data: [
      {x:7, y:4}
      {x:1, y:1}
      {x:2, y:2}
      {x:3, y:3}
      {x:40, y:90}
    ]
    
    features:  ['x','y']
    centroids: [
      {x:17, y:6}
      {x:55, y:100}
    ]
    class_name: ''
    clusters_size:2
    tolerance: 1.0
  
  # iris kMeans options
  @iris_options =
    data:         @iris()
    features:     ['sepal length','sepal width','petal length','petal width']
    class_name:   'species'
    clusters_size:3
    tolerance:    1.0
  
  # predifine three iris centroids
  cent_1 =
    'sepal length' : 2
    'sepal width'  : 2
    'petal length' : 2
    'petal width'  : 2
  
  cent_2 =
    'sepal length' : 3
    'sepal width'  : 3
    'petal length' : 3
    'petal width'  : 3
  
  cent_3 =
    'sepal length' : 5
    'sepal width'  : 5
    'petal length' : 5
    'petal width'  : 5
  
  # iris kMeans options with predifined centroid positions
  @iris_fixed_options =
    data:         @iris()
    features:     ['sepal length','sepal width','petal length','petal width']
    class_name:   'species'
    clusters_size:3
    tolerance:    0.001
    centroids:    [cent_1,cent_2,cent_3]
  
  # yeast kMeans options
  @yeast_options =
    data:         @yeast()
    features:     ['mcg', 'gvh', 'alm', 'mit', 'erl', 'pox', 'vac', 'nuc']
    class_name:   'site'
    clusters_size: 10
    tolerance:     1.0


## Kmeans Spec Suite
describe 'kMeans', ->
  
  
  # simple test to check if kMeans is defined
  it 'is defined', ->
    expect(kMeans).toBeDefined()
  
  
  # simple test to check if kMeans.initialize() thows any exception
  it 'can be initialized', ->
    km = new kMeans @iris_options
    km.initialize()
    expect(km).toBeTruthy()
  
  
  # check if kMeans has picked random centroids after initialization
  it 'can initialize random centroids', ->
    km = new kMeans @iris_options
    km.initialize()
    expect(km.centroids.length).toEqual 3
    centroid_keys = Object.keys(km.centroids[0]).length
    for centroid in km.centroids
      for feature in @iris_options.features
        expect(centroid.hasOwnProperty(feature)).toBeTruthy()
        expect(centroid.hasOwnProperty(feature+' sum')).toBeTruthy()
  
  
  # check if euclidean distance is computed correctly
  it 'can compute euclidean distance between two points', ->
    km = new kMeans @dummy_options
    distance = km.centroids[0].distance(km.data[0])
    
    # online vector distance calculator:
    # http://tinyurl.com/njk5t2s
    expect(distance).toEqual 104
  
  
  # check if a certain point is classified correctly (dummy dataset)
  it 'can classify a point', ->
    km = new kMeans @dummy_options
    point = km.data[0]
    km.classify(point)
    expect(point.centroid).toBe km.centroids[0]

    point = km.data[4]
    km.classify(point)
    expect(point.centroid).toBe km.centroids[1]
  
  
  # check if after one pass of the algorithm all points have been
  # assigned to a centroid (iris dataset)
  it 'assigns all iris points to a centroid in one pass', ->
    km = new kMeans @iris_options
    km.initialize()
    km.pass()
    for point in km.data
      expect(km.centroids).toContain(point.centroid)
  
  
  # check if after one pass of the algorithm all points have been
  # assigned to a centroid (yeast dataset)
  it 'assigns all yeast points to a centroid in one pass', ->
    km = new kMeans @yeast_options
    km.initialize()
    km.pass()
    for point in km.data
      expect(km.centroids).toContain(point.centroid)
  
  
  # check if centroids are updated correctly when kMeans initializes
  # and after one pass of the algorithm
  it 'updates centroids', ->
    km = new kMeans @iris_options
    km.initialize()
    
    # check that history has been updated
    for centroid in km.centroids
      expect(centroid.history.length).toEqual 0
    km.pass()
    km.updateCentroids()
    for centroid in km.centroids
      expect(centroid.history.length).toEqual 2
    
    # check that the sum of points in centroids is 150
    points = 0
    for centroid in km.centroids
      points += centroid.points
    expect(points).toEqual 150
  
  
  # Predefine three centroids and run kMeans. After the exceqution
  # the centroids must have 50,61,39 points respectively
  # uses iris dataset with predifined centroids
  it 'finds clusters with good data', ->
    km = new kMeans @iris_fixed_options
    km.run()
    expect(km.iterations).toEqual 9
    points = (centroid.points for centroid in km.centroids)
    expect(points).toEqual [50,61,39]
  
  
  # Predefine three centroids and run kMeans. After the excecution
  # the centroids must have 50,61,39 points respectively
  # uses iris dataset with predifined centroids
  it 'updates history', ->
    km = new kMeans @iris_fixed_options
    km.run()
    expect(km.centroids[0].history.length).toEqual 10
  
  # check if the nodes method return nodes correctly
  # uses iris dataset with predifined centroids
  it 'returns centroid nodes', ->
    km = new kMeans @iris_fixed_options
    km.run()
    console.log
    expect(km.nodes().length).toEqual 30
    for node in km.nodes()
      expect(Object.keys(node)).toEqual(['id'].concat(@iris_options.features))
  
  
  # check if the links method returns links correctly
  # uses iris dataset with predifined centroids
  it 'returns centroid links', ->
    km = new kMeans @iris_fixed_options
    km.run()
    expect(km.links().length).toEqual 27
    for link in km.links()
      expect(Object.keys(link)).toEqual(['source', 'target'])
  
  
  # Predefine thre bad centroids that have the same values in every feature
  # (the worst possible combination) and run the algorithm
  # uses iris dataset with predifined centroids
  it 'finds clusters even when seeded with bad data', ->
    cent =
      'sepal length' : 0
      'sepal width'  : 0
      'petal length' : 0
      'petal width'  : 0
    
    @iris_fixed_options.tolerance = 0.01
    @iris_fixed_options.centroids = [cent,cent,cent]
    
    km = new kMeans @iris_fixed_options
    km.run()
    points = (centroid.points for centroid in km.centroids)
    expect(points).not.toContain 0
  
  
  # run kMeans on yeast dataset
  it 'runs with the yeast dataset', ->
    km = new kMeans @yeast_options
    km.initialize()
    km.run()
    #km.updateCentroids()
    #km.pass()
    #km.updateCentroids()
    points = (centroid.points for centroid in km.centroids)
    expect(points).not.toContain 0
