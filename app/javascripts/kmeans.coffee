class kMeans
  
  ## Constructor
  #  a kMeans object can be initialized as km = new kMeans(options)
  constructor: (options = {}) ->
    
    ## Input options
    
    # The dataset is an Array of objects
    # each object property represents a feature
    @data             = options.data ? []
    
    # The list of features that the dataset has
    @features         = options.features ? ['1','2']
    
    # If the points in the dataset are preclassified
    # this is the name of a property that holds this value
    @class_name       = options.class_name ? 'class'
    
    # in how many clusters the kMeans will classify the data
    @clusters_size    = options.clusters_size ? 2
    
    # a tolerance value that is used in convergence
    @tolerance        = options.tolerance ? 1.0
    
    # an iterations limit
    @iterations_limit = options.iterations_limit ? 100
    
    # Initialize variables
    @iterations       = 0
    @dominant         = ''
    @hasRun           = false
    
    # initialize @centroids
    if options.centroids
      @centroids = for centroid in options.centroids
        new kMeans::Centroid(centroid, @features, @class_name)
    else
      @centroids = []
  
  
  ## info
  #  return an info object.
  info: ->
    info =
      'dataset size'       : @data.length
      'features'           : @features.join(', ')
      'num of clusters'    : @clusters_size
      'tolerance'          : @tolerance
      'iterations'         : @iterations
      'points distribution': (centroid.points for centroid in @centroids).join(', ')
    
    if @hasRun
      classes = @classifyCentroids()
      for key in Object.keys(classes)
        info[key] = classes[key].join(', ')
    
    return info
  
  
  ## classifyCentroids
  #  after the kMeans has run this function attaches
  #  statistics about the class distribution in each centroid
  classifyCentroids: ->
    
    classes = {}
      
    
    for point in @data
      centroid_index = @centroids.indexOf(point.centroid)
      point_class = point[@class_name]
      
      if classes.hasOwnProperty point_class
        classes[point_class][centroid_index] += 1
      else
        classes[point_class] = new Array (@clusters_size)
        for n,i in classes[point_class]
          classes[point_class][i] = 0
    

    for key in Object.keys(classes)
      centroid_index = classes[key].indexOf(Math.max.apply(Math, classes[key]))
      @centroids[centroid_index].dominant = key
      
       
    return classes
  
  ## points
  #  this returns the points in the dataset but also
  #  attaches to the dataset the dominent class of the
  #  centroid they have been classified
  points: ->
    for point in @data
      point.cluster = point.centroid.dominant
    return @data
  
  ## nodes
  #  return the centroids as visualization nodes
  #  this is used in d3 visualizations
  nodes: ->
    nodes = []
    for centroid in @centroids
      for state in centroid.history
        state.dominant = centroid.dominant
        state.last = false
      centroid.history[centroid.history.length - 1].last = true
      nodes.push.apply nodes, centroid.history
    return nodes
  
  
  ## links
  #  return centroid nodes links
  #  centroid nodes in visualization have links between them
  #  that show their convergence history
  links: ->
    links = []
    for centroid in @centroids
      source_nodes = _.slice( centroid.history,
                              0 ,
                              centroid.history.length - 1
                            )
      target_nodes =  _.slice( centroid.history,
                               1
                             )
      
      for source_node, i in source_nodes
        links.push {
          source: source_node
          target: target_nodes[i]
          cluster: source_node.dominant
        }
      
        
    
    return links
  
  ## initialize
  #  pick random centroids before running the algorithm
  initialize: ->
    samples = _.sample(@data, @clusters_size)
    
    for sample in samples
      @centroids.push new kMeans::Centroid(sample, @features, @class_name)
    
    #console.log @centroids
  
  ## run
  #  run the algorithm until it converges or @iterations_limit
  run: ->
    @hasRun = true
    @iterations = 0
    
    while  (@iterations < 100) and (not @hasConverged())
      @iterations++
      @pass()
      @updateCentroids()
  
  
  ## pass
  #  run the algorithm one step
  pass: ->
    for point in @data
      @classify point
  
  
  classify: (point) =>
    point.centroid = null unless point.hasOwnProperty('centroid')
    
    distances = []
    
    for centroid, i in @centroids
      distances.push @distance(point , centroid)
    
    closest_centroid = distances.indexOf(Math.min.apply(Math, distances))
    
    point.centroid = @centroids[closest_centroid]
  
  
  ## updateCentroids
  #  pick new centroids
  updateCentroids: ->
    for centroid, i in @centroids
      if centroid.history.length is 0
        centroid.updateHistory()
    
    for centroid, i in @centroids
      centroid.points = 0
      for feature in @features
        centroid[feature+' sum'] = 0
    
    for point in @data
      point.centroid.points += 1
      for feature in @features
        point.centroid[feature+' sum'] += parseFloat(point[feature])
    
    for centroid, i in @centroids
      if centroid.points == 0
        centroid.initialize(_.sample(@data))
      else
        for feature in @features
          centroid[feature] = centroid[feature+' sum'] / centroid.points

    for centroid, i in @centroids
      centroid.updateHistory()
  
  ## distance
  #  return the euclidean distance between two points
  distance: (point, centroid) ->
    sum = 0
    
    for feature in @features
      sum += Math.pow(centroid[feature] - point[feature], 2)

    return sum
  
  
  ## hasConverged
  #  check if all centroids have converged
  hasConverged: ->
    for centroid in @centroids
      return false if not centroid.hasConverged(@tolerance)
    return true
  
  
   


class kMeans::Centroid
  
  ## Constructor
  #  create a Centroid instance
  constructor: (initial_data, features, class_name) ->
    @class_name=class_name
    @features = features
    @history = []
    @points = 0
    @id = (Math.random() + 1).toString(36).substring(7)
    
    @initialize(initial_data)
  
  ## initialize
  #  initialize variables
  initialize: (data)->
    for feature in @features
      this[feature]           = data[feature]
      this[feature + ' sum']  = 0.0
  
  
  ## updateHistory
  #  push the current state of the centroid into the history array
  updateHistory: ->
    state = {}
    state.id = (Math.random() + 1).toString(36).substring(7)
    for feature in @features
      state[feature] = this[feature]
    
    @history.push(state)
    #console.log @history
    return
  
  ## hasConverged
  #  check if the centroid has converged
  hasConverged: (tolerance) ->
    return false if @history.length < 2
    
    last = @history[@history.length - 1]
    prelast = @history[@history.length - 2]
    
    for feature in @features
      delta = Math.abs(last[feature] - prelast[feature])
      
      return true if delta < tolerance
    
    return false
  
  ## distance
  #  check if the centroid has converged
  distance: (point) ->
    sum = 0
    
    for feature in @features
      sum += Math.pow(this[feature] - point[feature], 2)
    return sum
  
  
  ## toObject
  #  return the centroid as an object
  toObject: ->
    o = {}
    o.id = this.id
    for feature in @features
      o[feature] = this[feature]
    return o

## Export library
# Export as a nodejs module
# or as a top level variable
if module?.exports? or exports?
  module.exports = exports = kMeans
else
  window.kMeans = kMeans
