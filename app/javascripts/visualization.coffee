class Visualization
  
  constructor: (options) ->
    features   = options.features
    x_feature  = options.x_feature
    y_feature  = options.y_feature
    point_r    = options.point_r
    data       = options.data
    class_name = options.class_name
    element    = options.element
    
    
    margin = {top: 20, right: 20, bottom: 40, left: 40}
    
    #width = window.innerWidth or
    #  document.documentElement.clientWidth or
    #  document.body.clientWidth
    
    #width = width - margin.left - margin.right - 80
    
    width = d3.select('#iris1').node().getBoundingClientRect().width - 80
    
    height = window.innerHeight or
      document.documentElement.clientHeight or
      document.body.clientHeight
    
    height = height*0.7 - margin.top - margin.bottom
    
    console.log 'width: ' + width

    console.log 'height: ' + height

    console.log 'data length: ' + data.length


    nodes = []

    links = []

    svg = d3.select(element)
            .append('svg')
            .attr 'width', width + margin.left + margin.right
            .attr 'height', height + margin.top + margin.bottom
            .append('g')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

    info = d3.select(element).append('div').attr('class','info')

    color = d3.scale.category10()
    
    x = d3.scale.linear().range([ 0, width ])
    x.domain(d3.extent(data, (d) -> d[x_feature] )).nice()
    xAxis = d3.svg.axis().scale(x).orient('bottom')
    xAxis.scale(x)

    y = d3.scale.linear().range([ height, 0 ])
    y.domain(d3.extent(data, (d) -> d[y_feature] )).nice()
    yAxis = d3.svg.axis().scale(y).orient('left')
    yAxis.scale(y)

    
    svg.append('g')
       .attr('class', 'x axis')
       .call(xAxis)
       .attr('transform', 'translate(0,' + height + ')')
       .append('text')
       .attr('class', 'label')
       .attr('x', width)
       .attr('y', -6)
       .style('text-anchor', 'end')
       .text x_feature

    svg.append('g')
       .attr('class', 'y axis')
       .call(yAxis)
       .append('text')
       .attr('transform', 'rotate(-90)')
       .attr('class', 'label')
       .attr('y', 6)
       .attr('dy', '.71em')
       .style('text-anchor', 'end')
       .text y_feature
    
    setTimeout (->
      
      legend = svg.selectAll('.legend')
                  .data color.domain()
                  .enter()
                  .append 'g'
                  .attr 'class', 'legend'
                  .attr 'transform', (d, i) -> "translate(0,#{20 + i * 20})"

      legend.append('rect')
            .attr('x', width )
            .attr('width', 18)
            .attr('height', 18)
            .style 'fill', color

      legend.append('text')
            .attr('x', width - 4)
            .attr('y', 9)
            .attr('dy', '.35em')
            .style('text-anchor', 'end')
            .text (d) -> d
      
      inconclusive = svg.append 'g'
                        .attr 'class', 'legend'
      
      inconclusive.append('rect')
                  .attr('x', width )
                  .attr('width', 18)
                  .attr('height', 18)
                  .style 'fill', '#334C4C'

      inconclusive.append('text')
                  .attr('x', width - 4)
                  .attr('y', 9)
                  .attr('dy', '.35em')
                  .style('text-anchor', 'end')
                  .text 'inconclusive'
    ), 100
          
    data.forEach (d, i) ->
      d.x = x(d[x_feature])#width/2
      d.y = y(d[y_feature])#height/2
      
    node = svg.selectAll('.node')

    link = svg.selectAll('.link')


    tick = (e) ->
      node.attr('cx', (d) ->
        d.x = x(d[x_feature])*e.alpha + d.x * (1-e.alpha)
      ).attr 'cy', (d) ->
        d.y = y(d[y_feature])*e.alpha  + d.y * (1-e.alpha)
      ####
      link.attr('x1', (d) -> d.source.x )
          .attr('y1', (d) -> d.source.y )
          .attr('x2', (d) -> d.target.x )
          .attr('y2', (d) -> d.target.y )
      ####
      return


    force = d3.layout.force()
              .nodes(nodes)
              .links(links)
              .linkStrength(0)
              .friction(0.0)
              .linkDistance(0)
              .charge(0)
              .gravity(0)
              .theta(.9)
              .alpha(0.03)
              .size([ width, height])
              .on('tick', tick)



    # 1. Add three nodes and three links.
    start = ->
      
      #console.log force.links()
      ####
      link = link.data(force.links(), (d) ->
        d.source.id + '-' + d.target.id
      )
      
      link.enter()
      .insert('line', '.node')
      .attr 'class', 'link'
      .style 'stroke-width', 1.2
      .style 'stroke', (d) ->
        if d.cluster?
          color d.cluster
        else
          '#334C4C'
        
      
      link.exit().remove()
      
      ####
      
      node = node.data(force.nodes())
      
      node.enter()
      .append('circle')
      .attr('class', (d) -> 'node')
      .style 'fill', (d) ->
        if d[class_name]?
          color(d[class_name])
        else if d.dominant?
          color(d.dominant)
        else
          '#334C4C'
      .attr 'r', (d) ->
        if d[class_name]?
          point_r
        else
          if d.last? and d.last
            10
          else
            3
      .style 'stroke-width', (d) ->
        if d.cluster?
          if d.cluster != d[options.class_name]
            1.2
          else
            1
        else
          2
      .style 'stroke', (d) ->
        if d.cluster?
          if d.cluster != d[options.class_name]
            'red'
          else
            'black'
        else
          'black'
      .call(force.drag)
      
      node.exit().remove()
      force.start()
      return

    km = new kMeans options


    setTimeout (->
      console.log 'Add ten nodes'
      km.initialize()
      km.run()
      km.classifyCentroids()
      
      nodes.push.apply nodes, km.points()

      start()
      return
    ), 0


    # Add Centroids and associated links.
    setTimeout (=>
      console.log 'Add Centroids and associated links'
      
      km_info = km.info()
      
      #console.log @kmInfoTable(km_info)
      info.html(@kmInfoTable(km_info))
      
      #message  = 'Kmeans module options\n'
      #for key in Object.keys(km_info)
      #  message += key
      #  message += ': '
      #  message += JSON.stringify km_info[key]
      #  message += '\n'
      #console.log message
      
      #info.text message
      
      nodes.push.apply nodes, km.nodes()
      
      links.push.apply(links,km.links())
      
      start()
      
      return
    ), 100
    # updateXAxis=  ->
    #   console.log 'Update axis'
    #   x_feature = _.sample(features, 1)[0]
    #   y_feature = _.sample(features, 1)[0]
    #
    #   x.domain(d3.extent(data, (d) -> d[x_feature] )).nice()
    #   xAxis.scale(x)
    #   svg.selectAll 'g .x.axis'
    #      .call xAxis
    #      .selectAll 'text.label'
    #      .text x_feature
    #
    #
    #   y.domain(d3.extent(data, (d) -> d[y_feature] )).nice()
    #   yAxis.scale(y)
    #
    #   svg.selectAll 'g .y.axis'
    #      .call yAxis
    #      .selectAll 'text.label'
    #      .text y_feature
    #   start()
    #
    #   return
    #
    #
    #
    # # Add Centroids and associated links.
    # setTimeout (->
    #   d3.select(element).append('h3').text('xAxis: ')
    #   xAxisForm = d3.select(element)
    #                 .selectAll 'label.x'
    #                 .data(features)
    #                 .enter()
    #                 .append 'label'
    #                 .attr 'class', 'label x'
    #                 .text (d) -> d
    #                 .insert('input')
    #                 .attr
    #                   type: 'radio'
    #                   name: "#{element}-xaxis"
    #                   value: (d) -> d
    #                 .property
    #                   checked: (d, i) -> (i==0)
    #   d3.select(element).append('br')
    #   d3.select(element).append('h3').text('yAxis: ')
    #   yAxisForm = d3.select(element)
    #                 .selectAll 'label.y'
    #                 .data(features)
    #                 .enter()
    #                 .append 'label'
    #                 .attr 'class', 'label y'
    #                 .text (d) -> d
    #                 .append('input')
    #                 .attr
    #                   type: 'radio'
    #                   name: "#{element}-yaxis"
    #                   onclick: 'updateXAxis();'
    #                   value: (d) -> d
    #                 .property
    #                   checked: (d, i) -> (i==1)
    #   return
    # ), 100
  
    return # end constructor
  
  
  kmInfoTable: (info) ->
    table  = '<table>\n'
    for key in Object.keys(info)
      table += '<tr>\n'
      table += '<th>'
      table += key
      table += '</th>'
      table += '<td>'
      table += info[key]
      table += '</td>'
      table += '\n'
      table  += '</tr>\n'
    table += '</table>\n'
    return table


iris1 =
  data:          d3.csv.parse window.iris_data
  features:      ['sepal length','sepal width','petal length','petal width']
  x_feature:     'sepal length'
  y_feature:     'sepal width'
  class_name:    'species'
  clusters_size: 3
  tolerance:     0.01
  point_r : 8
  element : '#iris1'
  

iris2 =
  data:          d3.csv.parse window.iris_data
  features:      ['sepal length','sepal width','petal length','petal width']
  x_feature:     'petal width'
  y_feature:     'petal length'
  class_name:    'species'
  clusters_size: 3
  tolerance:     0.01
  point_r : 6
  element : '#iris2'
  

yeast =
  data:       d3.csv.parse window.yeast_data
  features:   ['mcg', 'gvh', 'alm', 'mit', 'erl', 'pox', 'vac', 'nuc']
  x_feature:  'mcg'
  y_feature:  'gvh'
  class_name:       'site'
  clusters_size:    10
  iterations_limit: 1000
  tolerance:        0.001
  point_r : 3
  element : '#yeast'


setTimeout (->
  new Visualization(iris1)
), 0
  
setTimeout (->
  new Visualization(iris2)
), 500

setTimeout (->
  new Visualization(yeast)
), 1000
