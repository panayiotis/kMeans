var Visualization, iris1, iris2, yeast;

Visualization = (function() {
  function Visualization(options) {
    var class_name, color, data, element, features, force, height, info, km, link, links, margin, node, nodes, point_r, start, svg, tick, width, x, xAxis, x_feature, y, yAxis, y_feature;
    features = options.features;
    x_feature = options.x_feature;
    y_feature = options.y_feature;
    point_r = options.point_r;
    data = options.data;
    class_name = options.class_name;
    element = options.element;
    margin = {
      top: 20,
      right: 20,
      bottom: 40,
      left: 40
    };
    width = d3.select('#iris1').node().getBoundingClientRect().width - 80;
    height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
    height = height * 0.7 - margin.top - margin.bottom;
    console.log('width: ' + width);
    console.log('height: ' + height);
    console.log('data length: ' + data.length);
    nodes = [];
    links = [];
    svg = d3.select(element).append('svg').attr('width', width + margin.left + margin.right).attr('height', height + margin.top + margin.bottom).append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
    info = d3.select(element).append('div').attr('class', 'info');
    color = d3.scale.category10();
    x = d3.scale.linear().range([0, width]);
    x.domain(d3.extent(data, function(d) {
      return d[x_feature];
    })).nice();
    xAxis = d3.svg.axis().scale(x).orient('bottom');
    xAxis.scale(x);
    y = d3.scale.linear().range([height, 0]);
    y.domain(d3.extent(data, function(d) {
      return d[y_feature];
    })).nice();
    yAxis = d3.svg.axis().scale(y).orient('left');
    yAxis.scale(y);
    svg.append('g').attr('class', 'x axis').call(xAxis).attr('transform', 'translate(0,' + height + ')').append('text').attr('class', 'label').attr('x', width).attr('y', -6).style('text-anchor', 'end').text(x_feature);
    svg.append('g').attr('class', 'y axis').call(yAxis).append('text').attr('transform', 'rotate(-90)').attr('class', 'label').attr('y', 6).attr('dy', '.71em').style('text-anchor', 'end').text(y_feature);
    setTimeout((function() {
      var inconclusive, legend;
      legend = svg.selectAll('.legend').data(color.domain()).enter().append('g').attr('class', 'legend').attr('transform', function(d, i) {
        return "translate(0," + (20 + i * 20) + ")";
      });
      legend.append('rect').attr('x', width).attr('width', 18).attr('height', 18).style('fill', color);
      legend.append('text').attr('x', width - 4).attr('y', 9).attr('dy', '.35em').style('text-anchor', 'end').text(function(d) {
        return d;
      });
      inconclusive = svg.append('g').attr('class', 'legend');
      inconclusive.append('rect').attr('x', width).attr('width', 18).attr('height', 18).style('fill', '#334C4C');
      return inconclusive.append('text').attr('x', width - 4).attr('y', 9).attr('dy', '.35em').style('text-anchor', 'end').text('inconclusive');
    }), 100);
    data.forEach(function(d, i) {
      d.x = x(d[x_feature]);
      return d.y = y(d[y_feature]);
    });
    node = svg.selectAll('.node');
    link = svg.selectAll('.link');
    tick = function(e) {
      node.attr('cx', function(d) {
        return d.x = x(d[x_feature]) * e.alpha + d.x * (1 - e.alpha);
      }).attr('cy', function(d) {
        return d.y = y(d[y_feature]) * e.alpha + d.y * (1 - e.alpha);
      });
      link.attr('x1', function(d) {
        return d.source.x;
      }).attr('y1', function(d) {
        return d.source.y;
      }).attr('x2', function(d) {
        return d.target.x;
      }).attr('y2', function(d) {
        return d.target.y;
      });
    };
    force = d3.layout.force().nodes(nodes).links(links).linkStrength(0).friction(0.0).linkDistance(0).charge(0).gravity(0).theta(.9).alpha(0.03).size([width, height]).on('tick', tick);
    start = function() {
      link = link.data(force.links(), function(d) {
        return d.source.id + '-' + d.target.id;
      });
      link.enter().insert('line', '.node').attr('class', 'link').style('stroke-width', 1.2).style('stroke', function(d) {
        if (d.cluster != null) {
          return color(d.cluster);
        } else {
          return '#334C4C';
        }
      });
      link.exit().remove();
      node = node.data(force.nodes());
      node.enter().append('circle').attr('class', function(d) {
        return 'node';
      }).style('fill', function(d) {
        if (d[class_name] != null) {
          return color(d[class_name]);
        } else if (d.dominant != null) {
          return color(d.dominant);
        } else {
          return '#334C4C';
        }
      }).attr('r', function(d) {
        if (d[class_name] != null) {
          return point_r;
        } else {
          if ((d.last != null) && d.last) {
            return 10;
          } else {
            return 3;
          }
        }
      }).style('stroke-width', function(d) {
        if (d.cluster != null) {
          if (d.cluster !== d[options.class_name]) {
            return 1.2;
          } else {
            return 1;
          }
        } else {
          return 2;
        }
      }).style('stroke', function(d) {
        if (d.cluster != null) {
          if (d.cluster !== d[options.class_name]) {
            return 'red';
          } else {
            return 'black';
          }
        } else {
          return 'black';
        }
      }).call(force.drag);
      node.exit().remove();
      force.start();
    };
    km = new kMeans(options);
    setTimeout((function() {
      console.log('Add ten nodes');
      km.initialize();
      km.run();
      km.classifyCentroids();
      nodes.push.apply(nodes, km.points());
      start();
    }), 0);
    setTimeout(((function(_this) {
      return function() {
        var km_info;
        console.log('Add Centroids and associated links');
        km_info = km.info();
        info.html(_this.kmInfoTable(km_info));
        nodes.push.apply(nodes, km.nodes());
        links.push.apply(links, km.links());
        start();
      };
    })(this)), 100);
    return;
  }

  Visualization.prototype.kmInfoTable = function(info) {
    var j, key, len, ref, table;
    table = '<table>\n';
    ref = Object.keys(info);
    for (j = 0, len = ref.length; j < len; j++) {
      key = ref[j];
      table += '<tr>\n';
      table += '<th>';
      table += key;
      table += '</th>';
      table += '<td>';
      table += info[key];
      table += '</td>';
      table += '\n';
      table += '</tr>\n';
    }
    table += '</table>\n';
    return table;
  };

  return Visualization;

})();

iris1 = {
  data: d3.csv.parse(window.iris_data),
  features: ['sepal length', 'sepal width', 'petal length', 'petal width'],
  x_feature: 'sepal length',
  y_feature: 'sepal width',
  class_name: 'species',
  clusters_size: 3,
  tolerance: 0.01,
  point_r: 8,
  element: '#iris1'
};

iris2 = {
  data: d3.csv.parse(window.iris_data),
  features: ['sepal length', 'sepal width', 'petal length', 'petal width'],
  x_feature: 'petal width',
  y_feature: 'petal length',
  class_name: 'species',
  clusters_size: 3,
  tolerance: 0.01,
  point_r: 6,
  element: '#iris2'
};

yeast = {
  data: d3.csv.parse(window.yeast_data),
  features: ['mcg', 'gvh', 'alm', 'mit', 'erl', 'pox', 'vac', 'nuc'],
  x_feature: 'mcg',
  y_feature: 'gvh',
  class_name: 'site',
  clusters_size: 10,
  iterations_limit: 1000,
  tolerance: 0.001,
  point_r: 3,
  element: '#yeast'
};

setTimeout((function() {
  return new Visualization(iris1);
}), 0);

setTimeout((function() {
  return new Visualization(iris2);
}), 500);

setTimeout((function() {
  return new Visualization(yeast);
}), 1000);

//# sourceMappingURL=data:application/json;base64,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QWY7RUFDQSxRQUFBLEVBQWUsQ0FBQyxjQUFELEVBQWdCLGFBQWhCLEVBQThCLGNBQTlCLEVBQTZDLGFBQTdDLENBRGY7RUFFQSxTQUFBLEVBQWUsYUFGZjtFQUdBLFNBQUEsRUFBZSxjQUhmO0VBSUEsVUFBQSxFQUFlLFNBSmY7RUFLQSxhQUFBLEVBQWUsQ0FMZjtFQU1BLFNBQUEsRUFBZSxJQU5mO0VBT0EsT0FBQSxFQUFVLENBUFY7RUFRQSxPQUFBLEVBQVUsUUFSVjs7O0FBV0YsS0FBQSxHQUNFO0VBQUEsSUFBQSxFQUFZLEVBQUUsQ0FBQyxHQUFHLENBQUMsS0FBUCxDQUFhLE1BQU0sQ0FBQyxVQUFwQixDQUFaO0VBQ0EsUUFBQSxFQUFZLENBQUMsS0FBRCxFQUFRLEtBQVIsRUFBZSxLQUFmLEVBQXNCLEtBQXRCLEVBQTZCLEtBQTdCLEVBQW9DLEtBQXBDLEVBQTJDLEtBQTNDLEVBQWtELEtBQWxELENBRFo7RUFFQSxTQUFBLEVBQVksS0FGWjtFQUdBLFNBQUEsRUFBWSxLQUhaO0VBSUEsVUFBQSxFQUFrQixNQUpsQjtFQUtBLGFBQUEsRUFBa0IsRUFMbEI7RUFNQSxnQkFBQSxFQUFrQixJQU5sQjtFQU9BLFNBQUEsRUFBa0IsS0FQbEI7RUFRQSxPQUFBLEVBQVUsQ0FSVjtFQVNBLE9BQUEsRUFBVSxRQVRWOzs7QUFZRixVQUFBLENBQVcsQ0FBQyxTQUFBO1NBQ04sSUFBQSxhQUFBLENBQWMsS0FBZDtBQURNLENBQUQsQ0FBWCxFQUVHLENBRkg7O0FBSUEsVUFBQSxDQUFXLENBQUMsU0FBQTtTQUNOLElBQUEsYUFBQSxDQUFjLEtBQWQ7QUFETSxDQUFELENBQVgsRUFFRyxHQUZIOztBQUlBLFVBQUEsQ0FBVyxDQUFDLFNBQUE7U0FDTixJQUFBLGFBQUEsQ0FBYyxLQUFkO0FBRE0sQ0FBRCxDQUFYLEVBRUcsSUFGSCIsImZpbGUiOiJ2aXN1YWxpemF0aW9uLmpzIiwic291cmNlUm9vdCI6Ii9zb3VyY2UvIiwic291cmNlc0NvbnRlbnQiOlsiY2xhc3MgVmlzdWFsaXphdGlvblxuICBcbiAgY29uc3RydWN0b3I6IChvcHRpb25zKSAtPlxuICAgIGZlYXR1cmVzICAgPSBvcHRpb25zLmZlYXR1cmVzXG4gICAgeF9mZWF0dXJlICA9IG9wdGlvbnMueF9mZWF0dXJlXG4gICAgeV9mZWF0dXJlICA9IG9wdGlvbnMueV9mZWF0dXJlXG4gICAgcG9pbnRfciAgICA9IG9wdGlvbnMucG9pbnRfclxuICAgIGRhdGEgICAgICAgPSBvcHRpb25zLmRhdGFcbiAgICBjbGFzc19uYW1lID0gb3B0aW9ucy5jbGFzc19uYW1lXG4gICAgZWxlbWVudCAgICA9IG9wdGlvbnMuZWxlbWVudFxuICAgIFxuICAgIFxuICAgIG1hcmdpbiA9IHt0b3A6IDIwLCByaWdodDogMjAsIGJvdHRvbTogNDAsIGxlZnQ6IDQwfVxuICAgIFxuICAgICN3aWR0aCA9IHdpbmRvdy5pbm5lcldpZHRoIG9yXG4gICAgIyAgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudFdpZHRoIG9yXG4gICAgIyAgZG9jdW1lbnQuYm9keS5jbGllbnRXaWR0aFxuICAgIFxuICAgICN3aWR0aCA9IHdpZHRoIC0gbWFyZ2luLmxlZnQgLSBtYXJnaW4ucmlnaHQgLSA4MFxuICAgIFxuICAgIHdpZHRoID0gZDMuc2VsZWN0KCcjaXJpczEnKS5ub2RlKCkuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkud2lkdGggLSA4MFxuICAgIFxuICAgIGhlaWdodCA9IHdpbmRvdy5pbm5lckhlaWdodCBvclxuICAgICAgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudEhlaWdodCBvclxuICAgICAgZG9jdW1lbnQuYm9keS5jbGllbnRIZWlnaHRcbiAgICBcbiAgICBoZWlnaHQgPSBoZWlnaHQqMC43IC0gbWFyZ2luLnRvcCAtIG1hcmdpbi5ib3R0b21cbiAgICBcbiAgICBjb25zb2xlLmxvZyAnd2lkdGg6ICcgKyB3aWR0aFxuXG4gICAgY29uc29sZS5sb2cgJ2hlaWdodDogJyArIGhlaWdodFxuXG4gICAgY29uc29sZS5sb2cgJ2RhdGEgbGVuZ3RoOiAnICsgZGF0YS5sZW5ndGhcblxuXG4gICAgbm9kZXMgPSBbXVxuXG4gICAgbGlua3MgPSBbXVxuXG4gICAgc3ZnID0gZDMuc2VsZWN0KGVsZW1lbnQpXG4gICAgICAgICAgICAuYXBwZW5kKCdzdmcnKVxuICAgICAgICAgICAgLmF0dHIgJ3dpZHRoJywgd2lkdGggKyBtYXJnaW4ubGVmdCArIG1hcmdpbi5yaWdodFxuICAgICAgICAgICAgLmF0dHIgJ2hlaWdodCcsIGhlaWdodCArIG1hcmdpbi50b3AgKyBtYXJnaW4uYm90dG9tXG4gICAgICAgICAgICAuYXBwZW5kKCdnJylcbiAgICAgICAgICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCAndHJhbnNsYXRlKCcgKyBtYXJnaW4ubGVmdCArICcsJyArIG1hcmdpbi50b3AgKyAnKScpXG5cbiAgICBpbmZvID0gZDMuc2VsZWN0KGVsZW1lbnQpLmFwcGVuZCgnZGl2JykuYXR0cignY2xhc3MnLCdpbmZvJylcblxuICAgIGNvbG9yID0gZDMuc2NhbGUuY2F0ZWdvcnkxMCgpXG4gICAgXG4gICAgeCA9IGQzLnNjYWxlLmxpbmVhcigpLnJhbmdlKFsgMCwgd2lkdGggXSlcbiAgICB4LmRvbWFpbihkMy5leHRlbnQoZGF0YSwgKGQpIC0+IGRbeF9mZWF0dXJlXSApKS5uaWNlKClcbiAgICB4QXhpcyA9IGQzLnN2Zy5heGlzKCkuc2NhbGUoeCkub3JpZW50KCdib3R0b20nKVxuICAgIHhBeGlzLnNjYWxlKHgpXG5cbiAgICB5ID0gZDMuc2NhbGUubGluZWFyKCkucmFuZ2UoWyBoZWlnaHQsIDAgXSlcbiAgICB5LmRvbWFpbihkMy5leHRlbnQoZGF0YSwgKGQpIC0+IGRbeV9mZWF0dXJlXSApKS5uaWNlKClcbiAgICB5QXhpcyA9IGQzLnN2Zy5heGlzKCkuc2NhbGUoeSkub3JpZW50KCdsZWZ0JylcbiAgICB5QXhpcy5zY2FsZSh5KVxuXG4gICAgXG4gICAgc3ZnLmFwcGVuZCgnZycpXG4gICAgICAgLmF0dHIoJ2NsYXNzJywgJ3ggYXhpcycpXG4gICAgICAgLmNhbGwoeEF4aXMpXG4gICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsICd0cmFuc2xhdGUoMCwnICsgaGVpZ2h0ICsgJyknKVxuICAgICAgIC5hcHBlbmQoJ3RleHQnKVxuICAgICAgIC5hdHRyKCdjbGFzcycsICdsYWJlbCcpXG4gICAgICAgLmF0dHIoJ3gnLCB3aWR0aClcbiAgICAgICAuYXR0cigneScsIC02KVxuICAgICAgIC5zdHlsZSgndGV4dC1hbmNob3InLCAnZW5kJylcbiAgICAgICAudGV4dCB4X2ZlYXR1cmVcblxuICAgIHN2Zy5hcHBlbmQoJ2cnKVxuICAgICAgIC5hdHRyKCdjbGFzcycsICd5IGF4aXMnKVxuICAgICAgIC5jYWxsKHlBeGlzKVxuICAgICAgIC5hcHBlbmQoJ3RleHQnKVxuICAgICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCAncm90YXRlKC05MCknKVxuICAgICAgIC5hdHRyKCdjbGFzcycsICdsYWJlbCcpXG4gICAgICAgLmF0dHIoJ3knLCA2KVxuICAgICAgIC5hdHRyKCdkeScsICcuNzFlbScpXG4gICAgICAgLnN0eWxlKCd0ZXh0LWFuY2hvcicsICdlbmQnKVxuICAgICAgIC50ZXh0IHlfZmVhdHVyZVxuICAgIFxuICAgIHNldFRpbWVvdXQgKC0+XG4gICAgICBcbiAgICAgIGxlZ2VuZCA9IHN2Zy5zZWxlY3RBbGwoJy5sZWdlbmQnKVxuICAgICAgICAgICAgICAgICAgLmRhdGEgY29sb3IuZG9tYWluKClcbiAgICAgICAgICAgICAgICAgIC5lbnRlcigpXG4gICAgICAgICAgICAgICAgICAuYXBwZW5kICdnJ1xuICAgICAgICAgICAgICAgICAgLmF0dHIgJ2NsYXNzJywgJ2xlZ2VuZCdcbiAgICAgICAgICAgICAgICAgIC5hdHRyICd0cmFuc2Zvcm0nLCAoZCwgaSkgLT4gXCJ0cmFuc2xhdGUoMCwjezIwICsgaSAqIDIwfSlcIlxuXG4gICAgICBsZWdlbmQuYXBwZW5kKCdyZWN0JylcbiAgICAgICAgICAgIC5hdHRyKCd4Jywgd2lkdGggKVxuICAgICAgICAgICAgLmF0dHIoJ3dpZHRoJywgMTgpXG4gICAgICAgICAgICAuYXR0cignaGVpZ2h0JywgMTgpXG4gICAgICAgICAgICAuc3R5bGUgJ2ZpbGwnLCBjb2xvclxuXG4gICAgICBsZWdlbmQuYXBwZW5kKCd0ZXh0JylcbiAgICAgICAgICAgIC5hdHRyKCd4Jywgd2lkdGggLSA0KVxuICAgICAgICAgICAgLmF0dHIoJ3knLCA5KVxuICAgICAgICAgICAgLmF0dHIoJ2R5JywgJy4zNWVtJylcbiAgICAgICAgICAgIC5zdHlsZSgndGV4dC1hbmNob3InLCAnZW5kJylcbiAgICAgICAgICAgIC50ZXh0IChkKSAtPiBkXG4gICAgICBcbiAgICAgIGluY29uY2x1c2l2ZSA9IHN2Zy5hcHBlbmQgJ2cnXG4gICAgICAgICAgICAgICAgICAgICAgICAuYXR0ciAnY2xhc3MnLCAnbGVnZW5kJ1xuICAgICAgXG4gICAgICBpbmNvbmNsdXNpdmUuYXBwZW5kKCdyZWN0JylcbiAgICAgICAgICAgICAgICAgIC5hdHRyKCd4Jywgd2lkdGggKVxuICAgICAgICAgICAgICAgICAgLmF0dHIoJ3dpZHRoJywgMTgpXG4gICAgICAgICAgICAgICAgICAuYXR0cignaGVpZ2h0JywgMTgpXG4gICAgICAgICAgICAgICAgICAuc3R5bGUgJ2ZpbGwnLCAnIzMzNEM0QydcblxuICAgICAgaW5jb25jbHVzaXZlLmFwcGVuZCgndGV4dCcpXG4gICAgICAgICAgICAgICAgICAuYXR0cigneCcsIHdpZHRoIC0gNClcbiAgICAgICAgICAgICAgICAgIC5hdHRyKCd5JywgOSlcbiAgICAgICAgICAgICAgICAgIC5hdHRyKCdkeScsICcuMzVlbScpXG4gICAgICAgICAgICAgICAgICAuc3R5bGUoJ3RleHQtYW5jaG9yJywgJ2VuZCcpXG4gICAgICAgICAgICAgICAgICAudGV4dCAnaW5jb25jbHVzaXZlJ1xuICAgICksIDEwMFxuICAgICAgICAgIFxuICAgIGRhdGEuZm9yRWFjaCAoZCwgaSkgLT5cbiAgICAgIGQueCA9IHgoZFt4X2ZlYXR1cmVdKSN3aWR0aC8yXG4gICAgICBkLnkgPSB5KGRbeV9mZWF0dXJlXSkjaGVpZ2h0LzJcbiAgICAgIFxuICAgIG5vZGUgPSBzdmcuc2VsZWN0QWxsKCcubm9kZScpXG5cbiAgICBsaW5rID0gc3ZnLnNlbGVjdEFsbCgnLmxpbmsnKVxuXG5cbiAgICB0aWNrID0gKGUpIC0+XG4gICAgICBub2RlLmF0dHIoJ2N4JywgKGQpIC0+XG4gICAgICAgIGQueCA9IHgoZFt4X2ZlYXR1cmVdKSplLmFscGhhICsgZC54ICogKDEtZS5hbHBoYSlcbiAgICAgICkuYXR0ciAnY3knLCAoZCkgLT5cbiAgICAgICAgZC55ID0geShkW3lfZmVhdHVyZV0pKmUuYWxwaGEgICsgZC55ICogKDEtZS5hbHBoYSlcbiAgICAgICMjIyNcbiAgICAgIGxpbmsuYXR0cigneDEnLCAoZCkgLT4gZC5zb3VyY2UueCApXG4gICAgICAgICAgLmF0dHIoJ3kxJywgKGQpIC0+IGQuc291cmNlLnkgKVxuICAgICAgICAgIC5hdHRyKCd4MicsIChkKSAtPiBkLnRhcmdldC54IClcbiAgICAgICAgICAuYXR0cigneTInLCAoZCkgLT4gZC50YXJnZXQueSApXG4gICAgICAjIyMjXG4gICAgICByZXR1cm5cblxuXG4gICAgZm9yY2UgPSBkMy5sYXlvdXQuZm9yY2UoKVxuICAgICAgICAgICAgICAubm9kZXMobm9kZXMpXG4gICAgICAgICAgICAgIC5saW5rcyhsaW5rcylcbiAgICAgICAgICAgICAgLmxpbmtTdHJlbmd0aCgwKVxuICAgICAgICAgICAgICAuZnJpY3Rpb24oMC4wKVxuICAgICAgICAgICAgICAubGlua0Rpc3RhbmNlKDApXG4gICAgICAgICAgICAgIC5jaGFyZ2UoMClcbiAgICAgICAgICAgICAgLmdyYXZpdHkoMClcbiAgICAgICAgICAgICAgLnRoZXRhKC45KVxuICAgICAgICAgICAgICAuYWxwaGEoMC4wMylcbiAgICAgICAgICAgICAgLnNpemUoWyB3aWR0aCwgaGVpZ2h0XSlcbiAgICAgICAgICAgICAgLm9uKCd0aWNrJywgdGljaylcblxuXG5cbiAgICAjIDEuIEFkZCB0aHJlZSBub2RlcyBhbmQgdGhyZWUgbGlua3MuXG4gICAgc3RhcnQgPSAtPlxuICAgICAgXG4gICAgICAjY29uc29sZS5sb2cgZm9yY2UubGlua3MoKVxuICAgICAgIyMjI1xuICAgICAgbGluayA9IGxpbmsuZGF0YShmb3JjZS5saW5rcygpLCAoZCkgLT5cbiAgICAgICAgZC5zb3VyY2UuaWQgKyAnLScgKyBkLnRhcmdldC5pZFxuICAgICAgKVxuICAgICAgXG4gICAgICBsaW5rLmVudGVyKClcbiAgICAgIC5pbnNlcnQoJ2xpbmUnLCAnLm5vZGUnKVxuICAgICAgLmF0dHIgJ2NsYXNzJywgJ2xpbmsnXG4gICAgICAuc3R5bGUgJ3N0cm9rZS13aWR0aCcsIDEuMlxuICAgICAgLnN0eWxlICdzdHJva2UnLCAoZCkgLT5cbiAgICAgICAgaWYgZC5jbHVzdGVyP1xuICAgICAgICAgIGNvbG9yIGQuY2x1c3RlclxuICAgICAgICBlbHNlXG4gICAgICAgICAgJyMzMzRDNEMnXG4gICAgICAgIFxuICAgICAgXG4gICAgICBsaW5rLmV4aXQoKS5yZW1vdmUoKVxuICAgICAgXG4gICAgICAjIyMjXG4gICAgICBcbiAgICAgIG5vZGUgPSBub2RlLmRhdGEoZm9yY2Uubm9kZXMoKSlcbiAgICAgIFxuICAgICAgbm9kZS5lbnRlcigpXG4gICAgICAuYXBwZW5kKCdjaXJjbGUnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgKGQpIC0+ICdub2RlJylcbiAgICAgIC5zdHlsZSAnZmlsbCcsIChkKSAtPlxuICAgICAgICBpZiBkW2NsYXNzX25hbWVdP1xuICAgICAgICAgIGNvbG9yKGRbY2xhc3NfbmFtZV0pXG4gICAgICAgIGVsc2UgaWYgZC5kb21pbmFudD9cbiAgICAgICAgICBjb2xvcihkLmRvbWluYW50KVxuICAgICAgICBlbHNlXG4gICAgICAgICAgJyMzMzRDNEMnXG4gICAgICAuYXR0ciAncicsIChkKSAtPlxuICAgICAgICBpZiBkW2NsYXNzX25hbWVdP1xuICAgICAgICAgIHBvaW50X3JcbiAgICAgICAgZWxzZVxuICAgICAgICAgIGlmIGQubGFzdD8gYW5kIGQubGFzdFxuICAgICAgICAgICAgMTBcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAzXG4gICAgICAuc3R5bGUgJ3N0cm9rZS13aWR0aCcsIChkKSAtPlxuICAgICAgICBpZiBkLmNsdXN0ZXI/XG4gICAgICAgICAgaWYgZC5jbHVzdGVyICE9IGRbb3B0aW9ucy5jbGFzc19uYW1lXVxuICAgICAgICAgICAgMS4yXG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgMVxuICAgICAgICBlbHNlXG4gICAgICAgICAgMlxuICAgICAgLnN0eWxlICdzdHJva2UnLCAoZCkgLT5cbiAgICAgICAgaWYgZC5jbHVzdGVyP1xuICAgICAgICAgIGlmIGQuY2x1c3RlciAhPSBkW29wdGlvbnMuY2xhc3NfbmFtZV1cbiAgICAgICAgICAgICdyZWQnXG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgJ2JsYWNrJ1xuICAgICAgICBlbHNlXG4gICAgICAgICAgJ2JsYWNrJ1xuICAgICAgLmNhbGwoZm9yY2UuZHJhZylcbiAgICAgIFxuICAgICAgbm9kZS5leGl0KCkucmVtb3ZlKClcbiAgICAgIGZvcmNlLnN0YXJ0KClcbiAgICAgIHJldHVyblxuXG4gICAga20gPSBuZXcga01lYW5zIG9wdGlvbnNcblxuXG4gICAgc2V0VGltZW91dCAoLT5cbiAgICAgIGNvbnNvbGUubG9nICdBZGQgdGVuIG5vZGVzJ1xuICAgICAga20uaW5pdGlhbGl6ZSgpXG4gICAgICBrbS5ydW4oKVxuICAgICAga20uY2xhc3NpZnlDZW50cm9pZHMoKVxuICAgICAgXG4gICAgICBub2Rlcy5wdXNoLmFwcGx5IG5vZGVzLCBrbS5wb2ludHMoKVxuXG4gICAgICBzdGFydCgpXG4gICAgICByZXR1cm5cbiAgICApLCAwXG5cblxuICAgICMgQWRkIENlbnRyb2lkcyBhbmQgYXNzb2NpYXRlZCBsaW5rcy5cbiAgICBzZXRUaW1lb3V0ICg9PlxuICAgICAgY29uc29sZS5sb2cgJ0FkZCBDZW50cm9pZHMgYW5kIGFzc29jaWF0ZWQgbGlua3MnXG4gICAgICBcbiAgICAgIGttX2luZm8gPSBrbS5pbmZvKClcbiAgICAgIFxuICAgICAgI2NvbnNvbGUubG9nIEBrbUluZm9UYWJsZShrbV9pbmZvKVxuICAgICAgaW5mby5odG1sKEBrbUluZm9UYWJsZShrbV9pbmZvKSlcbiAgICAgIFxuICAgICAgI21lc3NhZ2UgID0gJ0ttZWFucyBtb2R1bGUgb3B0aW9uc1xcbidcbiAgICAgICNmb3Iga2V5IGluIE9iamVjdC5rZXlzKGttX2luZm8pXG4gICAgICAjICBtZXNzYWdlICs9IGtleVxuICAgICAgIyAgbWVzc2FnZSArPSAnOiAnXG4gICAgICAjICBtZXNzYWdlICs9IEpTT04uc3RyaW5naWZ5IGttX2luZm9ba2V5XVxuICAgICAgIyAgbWVzc2FnZSArPSAnXFxuJ1xuICAgICAgI2NvbnNvbGUubG9nIG1lc3NhZ2VcbiAgICAgIFxuICAgICAgI2luZm8udGV4dCBtZXNzYWdlXG4gICAgICBcbiAgICAgIG5vZGVzLnB1c2guYXBwbHkgbm9kZXMsIGttLm5vZGVzKClcbiAgICAgIFxuICAgICAgbGlua3MucHVzaC5hcHBseShsaW5rcyxrbS5saW5rcygpKVxuICAgICAgXG4gICAgICBzdGFydCgpXG4gICAgICBcbiAgICAgIHJldHVyblxuICAgICksIDEwMFxuICAgICMgdXBkYXRlWEF4aXM9ICAtPlxuICAgICMgICBjb25zb2xlLmxvZyAnVXBkYXRlIGF4aXMnXG4gICAgIyAgIHhfZmVhdHVyZSA9IF8uc2FtcGxlKGZlYXR1cmVzLCAxKVswXVxuICAgICMgICB5X2ZlYXR1cmUgPSBfLnNhbXBsZShmZWF0dXJlcywgMSlbMF1cbiAgICAjXG4gICAgIyAgIHguZG9tYWluKGQzLmV4dGVudChkYXRhLCAoZCkgLT4gZFt4X2ZlYXR1cmVdICkpLm5pY2UoKVxuICAgICMgICB4QXhpcy5zY2FsZSh4KVxuICAgICMgICBzdmcuc2VsZWN0QWxsICdnIC54LmF4aXMnXG4gICAgIyAgICAgIC5jYWxsIHhBeGlzXG4gICAgIyAgICAgIC5zZWxlY3RBbGwgJ3RleHQubGFiZWwnXG4gICAgIyAgICAgIC50ZXh0IHhfZmVhdHVyZVxuICAgICNcbiAgICAjXG4gICAgIyAgIHkuZG9tYWluKGQzLmV4dGVudChkYXRhLCAoZCkgLT4gZFt5X2ZlYXR1cmVdICkpLm5pY2UoKVxuICAgICMgICB5QXhpcy5zY2FsZSh5KVxuICAgICNcbiAgICAjICAgc3ZnLnNlbGVjdEFsbCAnZyAueS5heGlzJ1xuICAgICMgICAgICAuY2FsbCB5QXhpc1xuICAgICMgICAgICAuc2VsZWN0QWxsICd0ZXh0LmxhYmVsJ1xuICAgICMgICAgICAudGV4dCB5X2ZlYXR1cmVcbiAgICAjICAgc3RhcnQoKVxuICAgICNcbiAgICAjICAgcmV0dXJuXG4gICAgI1xuICAgICNcbiAgICAjXG4gICAgIyAjIEFkZCBDZW50cm9pZHMgYW5kIGFzc29jaWF0ZWQgbGlua3MuXG4gICAgIyBzZXRUaW1lb3V0ICgtPlxuICAgICMgICBkMy5zZWxlY3QoZWxlbWVudCkuYXBwZW5kKCdoMycpLnRleHQoJ3hBeGlzOiAnKVxuICAgICMgICB4QXhpc0Zvcm0gPSBkMy5zZWxlY3QoZWxlbWVudClcbiAgICAjICAgICAgICAgICAgICAgICAuc2VsZWN0QWxsICdsYWJlbC54J1xuICAgICMgICAgICAgICAgICAgICAgIC5kYXRhKGZlYXR1cmVzKVxuICAgICMgICAgICAgICAgICAgICAgIC5lbnRlcigpXG4gICAgIyAgICAgICAgICAgICAgICAgLmFwcGVuZCAnbGFiZWwnXG4gICAgIyAgICAgICAgICAgICAgICAgLmF0dHIgJ2NsYXNzJywgJ2xhYmVsIHgnXG4gICAgIyAgICAgICAgICAgICAgICAgLnRleHQgKGQpIC0+IGRcbiAgICAjICAgICAgICAgICAgICAgICAuaW5zZXJ0KCdpbnB1dCcpXG4gICAgIyAgICAgICAgICAgICAgICAgLmF0dHJcbiAgICAjICAgICAgICAgICAgICAgICAgIHR5cGU6ICdyYWRpbydcbiAgICAjICAgICAgICAgICAgICAgICAgIG5hbWU6IFwiI3tlbGVtZW50fS14YXhpc1wiXG4gICAgIyAgICAgICAgICAgICAgICAgICB2YWx1ZTogKGQpIC0+IGRcbiAgICAjICAgICAgICAgICAgICAgICAucHJvcGVydHlcbiAgICAjICAgICAgICAgICAgICAgICAgIGNoZWNrZWQ6IChkLCBpKSAtPiAoaT09MClcbiAgICAjICAgZDMuc2VsZWN0KGVsZW1lbnQpLmFwcGVuZCgnYnInKVxuICAgICMgICBkMy5zZWxlY3QoZWxlbWVudCkuYXBwZW5kKCdoMycpLnRleHQoJ3lBeGlzOiAnKVxuICAgICMgICB5QXhpc0Zvcm0gPSBkMy5zZWxlY3QoZWxlbWVudClcbiAgICAjICAgICAgICAgICAgICAgICAuc2VsZWN0QWxsICdsYWJlbC55J1xuICAgICMgICAgICAgICAgICAgICAgIC5kYXRhKGZlYXR1cmVzKVxuICAgICMgICAgICAgICAgICAgICAgIC5lbnRlcigpXG4gICAgIyAgICAgICAgICAgICAgICAgLmFwcGVuZCAnbGFiZWwnXG4gICAgIyAgICAgICAgICAgICAgICAgLmF0dHIgJ2NsYXNzJywgJ2xhYmVsIHknXG4gICAgIyAgICAgICAgICAgICAgICAgLnRleHQgKGQpIC0+IGRcbiAgICAjICAgICAgICAgICAgICAgICAuYXBwZW5kKCdpbnB1dCcpXG4gICAgIyAgICAgICAgICAgICAgICAgLmF0dHJcbiAgICAjICAgICAgICAgICAgICAgICAgIHR5cGU6ICdyYWRpbydcbiAgICAjICAgICAgICAgICAgICAgICAgIG5hbWU6IFwiI3tlbGVtZW50fS15YXhpc1wiXG4gICAgIyAgICAgICAgICAgICAgICAgICBvbmNsaWNrOiAndXBkYXRlWEF4aXMoKTsnXG4gICAgIyAgICAgICAgICAgICAgICAgICB2YWx1ZTogKGQpIC0+IGRcbiAgICAjICAgICAgICAgICAgICAgICAucHJvcGVydHlcbiAgICAjICAgICAgICAgICAgICAgICAgIGNoZWNrZWQ6IChkLCBpKSAtPiAoaT09MSlcbiAgICAjICAgcmV0dXJuXG4gICAgIyApLCAxMDBcbiAgXG4gICAgcmV0dXJuICMgZW5kIGNvbnN0cnVjdG9yXG4gIFxuICBcbiAga21JbmZvVGFibGU6IChpbmZvKSAtPlxuICAgIHRhYmxlICA9ICc8dGFibGU+XFxuJ1xuICAgIGZvciBrZXkgaW4gT2JqZWN0LmtleXMoaW5mbylcbiAgICAgIHRhYmxlICs9ICc8dHI+XFxuJ1xuICAgICAgdGFibGUgKz0gJzx0aD4nXG4gICAgICB0YWJsZSArPSBrZXlcbiAgICAgIHRhYmxlICs9ICc8L3RoPidcbiAgICAgIHRhYmxlICs9ICc8dGQ+J1xuICAgICAgdGFibGUgKz0gaW5mb1trZXldXG4gICAgICB0YWJsZSArPSAnPC90ZD4nXG4gICAgICB0YWJsZSArPSAnXFxuJ1xuICAgICAgdGFibGUgICs9ICc8L3RyPlxcbidcbiAgICB0YWJsZSArPSAnPC90YWJsZT5cXG4nXG4gICAgcmV0dXJuIHRhYmxlXG5cblxuaXJpczEgPVxuICBkYXRhOiAgICAgICAgICBkMy5jc3YucGFyc2Ugd2luZG93LmlyaXNfZGF0YVxuICBmZWF0dXJlczogICAgICBbJ3NlcGFsIGxlbmd0aCcsJ3NlcGFsIHdpZHRoJywncGV0YWwgbGVuZ3RoJywncGV0YWwgd2lkdGgnXVxuICB4X2ZlYXR1cmU6ICAgICAnc2VwYWwgbGVuZ3RoJ1xuICB5X2ZlYXR1cmU6ICAgICAnc2VwYWwgd2lkdGgnXG4gIGNsYXNzX25hbWU6ICAgICdzcGVjaWVzJ1xuICBjbHVzdGVyc19zaXplOiAzXG4gIHRvbGVyYW5jZTogICAgIDAuMDFcbiAgcG9pbnRfciA6IDhcbiAgZWxlbWVudCA6ICcjaXJpczEnXG4gIFxuXG5pcmlzMiA9XG4gIGRhdGE6ICAgICAgICAgIGQzLmNzdi5wYXJzZSB3aW5kb3cuaXJpc19kYXRhXG4gIGZlYXR1cmVzOiAgICAgIFsnc2VwYWwgbGVuZ3RoJywnc2VwYWwgd2lkdGgnLCdwZXRhbCBsZW5ndGgnLCdwZXRhbCB3aWR0aCddXG4gIHhfZmVhdHVyZTogICAgICdwZXRhbCB3aWR0aCdcbiAgeV9mZWF0dXJlOiAgICAgJ3BldGFsIGxlbmd0aCdcbiAgY2xhc3NfbmFtZTogICAgJ3NwZWNpZXMnXG4gIGNsdXN0ZXJzX3NpemU6IDNcbiAgdG9sZXJhbmNlOiAgICAgMC4wMVxuICBwb2ludF9yIDogNlxuICBlbGVtZW50IDogJyNpcmlzMidcbiAgXG5cbnllYXN0ID1cbiAgZGF0YTogICAgICAgZDMuY3N2LnBhcnNlIHdpbmRvdy55ZWFzdF9kYXRhXG4gIGZlYXR1cmVzOiAgIFsnbWNnJywgJ2d2aCcsICdhbG0nLCAnbWl0JywgJ2VybCcsICdwb3gnLCAndmFjJywgJ251YyddXG4gIHhfZmVhdHVyZTogICdtY2cnXG4gIHlfZmVhdHVyZTogICdndmgnXG4gIGNsYXNzX25hbWU6ICAgICAgICdzaXRlJ1xuICBjbHVzdGVyc19zaXplOiAgICAxMFxuICBpdGVyYXRpb25zX2xpbWl0OiAxMDAwXG4gIHRvbGVyYW5jZTogICAgICAgIDAuMDAxXG4gIHBvaW50X3IgOiAzXG4gIGVsZW1lbnQgOiAnI3llYXN0J1xuXG5cbnNldFRpbWVvdXQgKC0+XG4gIG5ldyBWaXN1YWxpemF0aW9uKGlyaXMxKVxuKSwgMFxuICBcbnNldFRpbWVvdXQgKC0+XG4gIG5ldyBWaXN1YWxpemF0aW9uKGlyaXMyKVxuKSwgNTAwXG5cbnNldFRpbWVvdXQgKC0+XG4gIG5ldyBWaXN1YWxpemF0aW9uKHllYXN0KVxuKSwgMTAwMFxuIl19