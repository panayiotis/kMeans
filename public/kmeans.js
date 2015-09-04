var exports, kMeans,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

kMeans = (function() {
  function kMeans(options) {
    var centroid, ref, ref1, ref2, ref3, ref4, ref5;
    if (options == null) {
      options = {};
    }
    this.classify = bind(this.classify, this);
    this.data = (ref = options.data) != null ? ref : [];
    this.features = (ref1 = options.features) != null ? ref1 : ['1', '2'];
    this.class_name = (ref2 = options.class_name) != null ? ref2 : 'class';
    this.clusters_size = (ref3 = options.clusters_size) != null ? ref3 : 2;
    this.tolerance = (ref4 = options.tolerance) != null ? ref4 : 1.0;
    this.iterations_limit = (ref5 = options.iterations_limit) != null ? ref5 : 100;
    this.iterations = 0;
    this.dominant = '';
    this.hasRun = false;
    if (options.centroids) {
      this.centroids = (function() {
        var j, len, ref6, results;
        ref6 = options.centroids;
        results = [];
        for (j = 0, len = ref6.length; j < len; j++) {
          centroid = ref6[j];
          results.push(new kMeans.prototype.Centroid(centroid, this.features, this.class_name));
        }
        return results;
      }).call(this);
    } else {
      this.centroids = [];
    }
  }

  kMeans.prototype.info = function() {
    var centroid, classes, info, j, key, len, ref;
    info = {
      'dataset size': this.data.length,
      'features': this.features.join(', '),
      'num of clusters': this.clusters_size,
      'tolerance': this.tolerance,
      'iterations': this.iterations,
      'points distribution': ((function() {
        var j, len, ref, results;
        ref = this.centroids;
        results = [];
        for (j = 0, len = ref.length; j < len; j++) {
          centroid = ref[j];
          results.push(centroid.points);
        }
        return results;
      }).call(this)).join(', ')
    };
    if (this.hasRun) {
      classes = this.classifyCentroids();
      ref = Object.keys(classes);
      for (j = 0, len = ref.length; j < len; j++) {
        key = ref[j];
        info[key] = classes[key].join(', ');
      }
    }
    return info;
  };

  kMeans.prototype.classifyCentroids = function() {
    var centroid_index, classes, i, j, k, key, l, len, len1, len2, n, point, point_class, ref, ref1, ref2;
    classes = {};
    ref = this.data;
    for (j = 0, len = ref.length; j < len; j++) {
      point = ref[j];
      centroid_index = this.centroids.indexOf(point.centroid);
      point_class = point[this.class_name];
      if (classes.hasOwnProperty(point_class)) {
        classes[point_class][centroid_index] += 1;
      } else {
        classes[point_class] = new Array(this.clusters_size);
        ref1 = classes[point_class];
        for (i = k = 0, len1 = ref1.length; k < len1; i = ++k) {
          n = ref1[i];
          classes[point_class][i] = 0;
        }
      }
    }
    ref2 = Object.keys(classes);
    for (l = 0, len2 = ref2.length; l < len2; l++) {
      key = ref2[l];
      centroid_index = classes[key].indexOf(Math.max.apply(Math, classes[key]));
      this.centroids[centroid_index].dominant = key;
    }
    return classes;
  };

  kMeans.prototype.points = function() {
    var j, len, point, ref;
    ref = this.data;
    for (j = 0, len = ref.length; j < len; j++) {
      point = ref[j];
      point.cluster = point.centroid.dominant;
    }
    return this.data;
  };

  kMeans.prototype.nodes = function() {
    var centroid, j, k, len, len1, nodes, ref, ref1, state;
    nodes = [];
    ref = this.centroids;
    for (j = 0, len = ref.length; j < len; j++) {
      centroid = ref[j];
      ref1 = centroid.history;
      for (k = 0, len1 = ref1.length; k < len1; k++) {
        state = ref1[k];
        state.dominant = centroid.dominant;
        state.last = false;
      }
      centroid.history[centroid.history.length - 1].last = true;
      nodes.push.apply(nodes, centroid.history);
    }
    return nodes;
  };

  kMeans.prototype.links = function() {
    var centroid, i, j, k, len, len1, links, ref, source_node, source_nodes, target_nodes;
    links = [];
    ref = this.centroids;
    for (j = 0, len = ref.length; j < len; j++) {
      centroid = ref[j];
      source_nodes = _.slice(centroid.history, 0, centroid.history.length - 1);
      target_nodes = _.slice(centroid.history, 1);
      for (i = k = 0, len1 = source_nodes.length; k < len1; i = ++k) {
        source_node = source_nodes[i];
        links.push({
          source: source_node,
          target: target_nodes[i],
          cluster: source_node.dominant
        });
      }
    }
    return links;
  };

  kMeans.prototype.initialize = function() {
    var j, len, results, sample, samples;
    samples = _.sample(this.data, this.clusters_size);
    results = [];
    for (j = 0, len = samples.length; j < len; j++) {
      sample = samples[j];
      results.push(this.centroids.push(new kMeans.prototype.Centroid(sample, this.features, this.class_name)));
    }
    return results;
  };

  kMeans.prototype.run = function() {
    var results;
    this.hasRun = true;
    this.iterations = 0;
    results = [];
    while ((this.iterations < 100) && (!this.hasConverged())) {
      this.iterations++;
      this.pass();
      results.push(this.updateCentroids());
    }
    return results;
  };

  kMeans.prototype.pass = function() {
    var j, len, point, ref, results;
    ref = this.data;
    results = [];
    for (j = 0, len = ref.length; j < len; j++) {
      point = ref[j];
      results.push(this.classify(point));
    }
    return results;
  };

  kMeans.prototype.classify = function(point) {
    var centroid, closest_centroid, distances, i, j, len, ref;
    if (!point.hasOwnProperty('centroid')) {
      point.centroid = null;
    }
    distances = [];
    ref = this.centroids;
    for (i = j = 0, len = ref.length; j < len; i = ++j) {
      centroid = ref[i];
      distances.push(this.distance(point, centroid));
    }
    closest_centroid = distances.indexOf(Math.min.apply(Math, distances));
    return point.centroid = this.centroids[closest_centroid];
  };

  kMeans.prototype.updateCentroids = function() {
    var centroid, feature, i, j, k, l, len, len1, len2, len3, len4, len5, len6, len7, m, p, point, q, r, ref, ref1, ref2, ref3, ref4, ref5, ref6, ref7, results, s;
    ref = this.centroids;
    for (i = j = 0, len = ref.length; j < len; i = ++j) {
      centroid = ref[i];
      if (centroid.history.length === 0) {
        centroid.updateHistory();
      }
    }
    ref1 = this.centroids;
    for (i = k = 0, len1 = ref1.length; k < len1; i = ++k) {
      centroid = ref1[i];
      centroid.points = 0;
      ref2 = this.features;
      for (l = 0, len2 = ref2.length; l < len2; l++) {
        feature = ref2[l];
        centroid[feature + ' sum'] = 0;
      }
    }
    ref3 = this.data;
    for (m = 0, len3 = ref3.length; m < len3; m++) {
      point = ref3[m];
      point.centroid.points += 1;
      ref4 = this.features;
      for (p = 0, len4 = ref4.length; p < len4; p++) {
        feature = ref4[p];
        point.centroid[feature + ' sum'] += parseFloat(point[feature]);
      }
    }
    ref5 = this.centroids;
    for (i = q = 0, len5 = ref5.length; q < len5; i = ++q) {
      centroid = ref5[i];
      if (centroid.points === 0) {
        centroid.initialize(_.sample(this.data));
      } else {
        ref6 = this.features;
        for (r = 0, len6 = ref6.length; r < len6; r++) {
          feature = ref6[r];
          centroid[feature] = centroid[feature + ' sum'] / centroid.points;
        }
      }
    }
    ref7 = this.centroids;
    results = [];
    for (i = s = 0, len7 = ref7.length; s < len7; i = ++s) {
      centroid = ref7[i];
      results.push(centroid.updateHistory());
    }
    return results;
  };

  kMeans.prototype.distance = function(point, centroid) {
    var feature, j, len, ref, sum;
    sum = 0;
    ref = this.features;
    for (j = 0, len = ref.length; j < len; j++) {
      feature = ref[j];
      sum += Math.pow(centroid[feature] - point[feature], 2);
    }
    return sum;
  };

  kMeans.prototype.hasConverged = function() {
    var centroid, j, len, ref;
    ref = this.centroids;
    for (j = 0, len = ref.length; j < len; j++) {
      centroid = ref[j];
      if (!centroid.hasConverged(this.tolerance)) {
        return false;
      }
    }
    return true;
  };

  return kMeans;

})();

kMeans.prototype.Centroid = (function() {
  function Centroid(initial_data, features, class_name) {
    this.class_name = class_name;
    this.features = features;
    this.history = [];
    this.points = 0;
    this.id = (Math.random() + 1).toString(36).substring(7);
    this.initialize(initial_data);
  }

  Centroid.prototype.initialize = function(data) {
    var feature, j, len, ref, results;
    ref = this.features;
    results = [];
    for (j = 0, len = ref.length; j < len; j++) {
      feature = ref[j];
      this[feature] = data[feature];
      results.push(this[feature + ' sum'] = 0.0);
    }
    return results;
  };

  Centroid.prototype.updateHistory = function() {
    var feature, j, len, ref, state;
    state = {};
    state.id = (Math.random() + 1).toString(36).substring(7);
    ref = this.features;
    for (j = 0, len = ref.length; j < len; j++) {
      feature = ref[j];
      state[feature] = this[feature];
    }
    this.history.push(state);
  };

  Centroid.prototype.hasConverged = function(tolerance) {
    var delta, feature, j, last, len, prelast, ref;
    if (this.history.length < 2) {
      return false;
    }
    last = this.history[this.history.length - 1];
    prelast = this.history[this.history.length - 2];
    ref = this.features;
    for (j = 0, len = ref.length; j < len; j++) {
      feature = ref[j];
      delta = Math.abs(last[feature] - prelast[feature]);
      if (delta < tolerance) {
        return true;
      }
    }
    return false;
  };

  Centroid.prototype.distance = function(point) {
    var feature, j, len, ref, sum;
    sum = 0;
    ref = this.features;
    for (j = 0, len = ref.length; j < len; j++) {
      feature = ref[j];
      sum += Math.pow(this[feature] - point[feature], 2);
    }
    return sum;
  };

  Centroid.prototype.toObject = function() {
    var feature, j, len, o, ref;
    o = {};
    o.id = this.id;
    ref = this.features;
    for (j = 0, len = ref.length; j < len; j++) {
      feature = ref[j];
      o[feature] = this[feature];
    }
    return o;
  };

  return Centroid;

})();

if (((typeof module !== "undefined" && module !== null ? module.exports : void 0) != null) || (typeof exports !== "undefined" && exports !== null)) {
  module.exports = exports = kMeans;
} else {
  window.kMeans = kMeans;
}

//# sourceMappingURL=data:application/json;base64,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Qzs7Ozs7O0FBVVosSUFBRyxzRkFBQSxJQUFvQixvREFBdkI7RUFDRSxNQUFNLENBQUMsT0FBUCxHQUFpQixPQUFBLEdBQVUsT0FEN0I7Q0FBQSxNQUFBO0VBR0UsTUFBTSxDQUFDLE1BQVAsR0FBZ0IsT0FIbEIiLCJmaWxlIjoia21lYW5zLmpzIiwic291cmNlUm9vdCI6Ii9zb3VyY2UvIiwic291cmNlc0NvbnRlbnQiOlsiY2xhc3Mga01lYW5zXG4gIFxuICAjIyBDb25zdHJ1Y3RvclxuICAjICBhIGtNZWFucyBvYmplY3QgY2FuIGJlIGluaXRpYWxpemVkIGFzIGttID0gbmV3IGtNZWFucyhvcHRpb25zKVxuICBjb25zdHJ1Y3RvcjogKG9wdGlvbnMgPSB7fSkgLT5cbiAgICBcbiAgICAjIyBJbnB1dCBvcHRpb25zXG4gICAgXG4gICAgIyBUaGUgZGF0YXNldCBpcyBhbiBBcnJheSBvZiBvYmplY3RzXG4gICAgIyBlYWNoIG9iamVjdCBwcm9wZXJ0eSByZXByZXNlbnRzIGEgZmVhdHVyZVxuICAgIEBkYXRhICAgICAgICAgICAgID0gb3B0aW9ucy5kYXRhID8gW11cbiAgICBcbiAgICAjIFRoZSBsaXN0IG9mIGZlYXR1cmVzIHRoYXQgdGhlIGRhdGFzZXQgaGFzXG4gICAgQGZlYXR1cmVzICAgICAgICAgPSBvcHRpb25zLmZlYXR1cmVzID8gWycxJywnMiddXG4gICAgXG4gICAgIyBJZiB0aGUgcG9pbnRzIGluIHRoZSBkYXRhc2V0IGFyZSBwcmVjbGFzc2lmaWVkXG4gICAgIyB0aGlzIGlzIHRoZSBuYW1lIG9mIGEgcHJvcGVydHkgdGhhdCBob2xkcyB0aGlzIHZhbHVlXG4gICAgQGNsYXNzX25hbWUgICAgICAgPSBvcHRpb25zLmNsYXNzX25hbWUgPyAnY2xhc3MnXG4gICAgXG4gICAgIyBpbiBob3cgbWFueSBjbHVzdGVycyB0aGUga01lYW5zIHdpbGwgY2xhc3NpZnkgdGhlIGRhdGFcbiAgICBAY2x1c3RlcnNfc2l6ZSAgICA9IG9wdGlvbnMuY2x1c3RlcnNfc2l6ZSA/IDJcbiAgICBcbiAgICAjIGEgdG9sZXJhbmNlIHZhbHVlIHRoYXQgaXMgdXNlZCBpbiBjb252ZXJnZW5jZVxuICAgIEB0b2xlcmFuY2UgICAgICAgID0gb3B0aW9ucy50b2xlcmFuY2UgPyAxLjBcbiAgICBcbiAgICAjIGFuIGl0ZXJhdGlvbnMgbGltaXRcbiAgICBAaXRlcmF0aW9uc19saW1pdCA9IG9wdGlvbnMuaXRlcmF0aW9uc19saW1pdCA/IDEwMFxuICAgIFxuICAgICMgSW5pdGlhbGl6ZSB2YXJpYWJsZXNcbiAgICBAaXRlcmF0aW9ucyAgICAgICA9IDBcbiAgICBAZG9taW5hbnQgICAgICAgICA9ICcnXG4gICAgQGhhc1J1biAgICAgICAgICAgPSBmYWxzZVxuICAgIFxuICAgICMgaW5pdGlhbGl6ZSBAY2VudHJvaWRzXG4gICAgaWYgb3B0aW9ucy5jZW50cm9pZHNcbiAgICAgIEBjZW50cm9pZHMgPSBmb3IgY2VudHJvaWQgaW4gb3B0aW9ucy5jZW50cm9pZHNcbiAgICAgICAgbmV3IGtNZWFuczo6Q2VudHJvaWQoY2VudHJvaWQsIEBmZWF0dXJlcywgQGNsYXNzX25hbWUpXG4gICAgZWxzZVxuICAgICAgQGNlbnRyb2lkcyA9IFtdXG4gIFxuICBcbiAgIyMgaW5mb1xuICAjICByZXR1cm4gYW4gaW5mbyBvYmplY3QuXG4gIGluZm86IC0+XG4gICAgaW5mbyA9XG4gICAgICAnZGF0YXNldCBzaXplJyAgICAgICA6IEBkYXRhLmxlbmd0aFxuICAgICAgJ2ZlYXR1cmVzJyAgICAgICAgICAgOiBAZmVhdHVyZXMuam9pbignLCAnKVxuICAgICAgJ251bSBvZiBjbHVzdGVycycgICAgOiBAY2x1c3RlcnNfc2l6ZVxuICAgICAgJ3RvbGVyYW5jZScgICAgICAgICAgOiBAdG9sZXJhbmNlXG4gICAgICAnaXRlcmF0aW9ucycgICAgICAgICA6IEBpdGVyYXRpb25zXG4gICAgICAncG9pbnRzIGRpc3RyaWJ1dGlvbic6IChjZW50cm9pZC5wb2ludHMgZm9yIGNlbnRyb2lkIGluIEBjZW50cm9pZHMpLmpvaW4oJywgJylcbiAgICBcbiAgICBpZiBAaGFzUnVuXG4gICAgICBjbGFzc2VzID0gQGNsYXNzaWZ5Q2VudHJvaWRzKClcbiAgICAgIGZvciBrZXkgaW4gT2JqZWN0LmtleXMoY2xhc3NlcylcbiAgICAgICAgaW5mb1trZXldID0gY2xhc3Nlc1trZXldLmpvaW4oJywgJylcbiAgICBcbiAgICByZXR1cm4gaW5mb1xuICBcbiAgXG4gICMjIGNsYXNzaWZ5Q2VudHJvaWRzXG4gICMgIGFmdGVyIHRoZSBrTWVhbnMgaGFzIHJ1biB0aGlzIGZ1bmN0aW9uIGF0dGFjaGVzXG4gICMgIHN0YXRpc3RpY3MgYWJvdXQgdGhlIGNsYXNzIGRpc3RyaWJ1dGlvbiBpbiBlYWNoIGNlbnRyb2lkXG4gIGNsYXNzaWZ5Q2VudHJvaWRzOiAtPlxuICAgIFxuICAgIGNsYXNzZXMgPSB7fVxuICAgICAgXG4gICAgXG4gICAgZm9yIHBvaW50IGluIEBkYXRhXG4gICAgICBjZW50cm9pZF9pbmRleCA9IEBjZW50cm9pZHMuaW5kZXhPZihwb2ludC5jZW50cm9pZClcbiAgICAgIHBvaW50X2NsYXNzID0gcG9pbnRbQGNsYXNzX25hbWVdXG4gICAgICBcbiAgICAgIGlmIGNsYXNzZXMuaGFzT3duUHJvcGVydHkgcG9pbnRfY2xhc3NcbiAgICAgICAgY2xhc3Nlc1twb2ludF9jbGFzc11bY2VudHJvaWRfaW5kZXhdICs9IDFcbiAgICAgIGVsc2VcbiAgICAgICAgY2xhc3Nlc1twb2ludF9jbGFzc10gPSBuZXcgQXJyYXkgKEBjbHVzdGVyc19zaXplKVxuICAgICAgICBmb3IgbixpIGluIGNsYXNzZXNbcG9pbnRfY2xhc3NdXG4gICAgICAgICAgY2xhc3Nlc1twb2ludF9jbGFzc11baV0gPSAwXG4gICAgXG5cbiAgICBmb3Iga2V5IGluIE9iamVjdC5rZXlzKGNsYXNzZXMpXG4gICAgICBjZW50cm9pZF9pbmRleCA9IGNsYXNzZXNba2V5XS5pbmRleE9mKE1hdGgubWF4LmFwcGx5KE1hdGgsIGNsYXNzZXNba2V5XSkpXG4gICAgICBAY2VudHJvaWRzW2NlbnRyb2lkX2luZGV4XS5kb21pbmFudCA9IGtleVxuICAgICAgXG4gICAgICAgXG4gICAgcmV0dXJuIGNsYXNzZXNcbiAgXG4gICMjIHBvaW50c1xuICAjICB0aGlzIHJldHVybnMgdGhlIHBvaW50cyBpbiB0aGUgZGF0YXNldCBidXQgYWxzb1xuICAjICBhdHRhY2hlcyB0byB0aGUgZGF0YXNldCB0aGUgZG9taW5lbnQgY2xhc3Mgb2YgdGhlXG4gICMgIGNlbnRyb2lkIHRoZXkgaGF2ZSBiZWVuIGNsYXNzaWZpZWRcbiAgcG9pbnRzOiAtPlxuICAgIGZvciBwb2ludCBpbiBAZGF0YVxuICAgICAgcG9pbnQuY2x1c3RlciA9IHBvaW50LmNlbnRyb2lkLmRvbWluYW50XG4gICAgcmV0dXJuIEBkYXRhXG4gIFxuICAjIyBub2Rlc1xuICAjICByZXR1cm4gdGhlIGNlbnRyb2lkcyBhcyB2aXN1YWxpemF0aW9uIG5vZGVzXG4gICMgIHRoaXMgaXMgdXNlZCBpbiBkMyB2aXN1YWxpemF0aW9uc1xuICBub2RlczogLT5cbiAgICBub2RlcyA9IFtdXG4gICAgZm9yIGNlbnRyb2lkIGluIEBjZW50cm9pZHNcbiAgICAgIGZvciBzdGF0ZSBpbiBjZW50cm9pZC5oaXN0b3J5XG4gICAgICAgIHN0YXRlLmRvbWluYW50ID0gY2VudHJvaWQuZG9taW5hbnRcbiAgICAgICAgc3RhdGUubGFzdCA9IGZhbHNlXG4gICAgICBjZW50cm9pZC5oaXN0b3J5W2NlbnRyb2lkLmhpc3RvcnkubGVuZ3RoIC0gMV0ubGFzdCA9IHRydWVcbiAgICAgIG5vZGVzLnB1c2guYXBwbHkgbm9kZXMsIGNlbnRyb2lkLmhpc3RvcnlcbiAgICByZXR1cm4gbm9kZXNcbiAgXG4gIFxuICAjIyBsaW5rc1xuICAjICByZXR1cm4gY2VudHJvaWQgbm9kZXMgbGlua3NcbiAgIyAgY2VudHJvaWQgbm9kZXMgaW4gdmlzdWFsaXphdGlvbiBoYXZlIGxpbmtzIGJldHdlZW4gdGhlbVxuICAjICB0aGF0IHNob3cgdGhlaXIgY29udmVyZ2VuY2UgaGlzdG9yeVxuICBsaW5rczogLT5cbiAgICBsaW5rcyA9IFtdXG4gICAgZm9yIGNlbnRyb2lkIGluIEBjZW50cm9pZHNcbiAgICAgIHNvdXJjZV9ub2RlcyA9IF8uc2xpY2UoIGNlbnRyb2lkLmhpc3RvcnksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAwICxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNlbnRyb2lkLmhpc3RvcnkubGVuZ3RoIC0gMVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIClcbiAgICAgIHRhcmdldF9ub2RlcyA9ICBfLnNsaWNlKCBjZW50cm9pZC5oaXN0b3J5LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDFcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgXG4gICAgICBmb3Igc291cmNlX25vZGUsIGkgaW4gc291cmNlX25vZGVzXG4gICAgICAgIGxpbmtzLnB1c2gge1xuICAgICAgICAgIHNvdXJjZTogc291cmNlX25vZGVcbiAgICAgICAgICB0YXJnZXQ6IHRhcmdldF9ub2Rlc1tpXVxuICAgICAgICAgIGNsdXN0ZXI6IHNvdXJjZV9ub2RlLmRvbWluYW50XG4gICAgICAgIH1cbiAgICAgIFxuICAgICAgICBcbiAgICBcbiAgICByZXR1cm4gbGlua3NcbiAgXG4gICMjIGluaXRpYWxpemVcbiAgIyAgcGljayByYW5kb20gY2VudHJvaWRzIGJlZm9yZSBydW5uaW5nIHRoZSBhbGdvcml0aG1cbiAgaW5pdGlhbGl6ZTogLT5cbiAgICBzYW1wbGVzID0gXy5zYW1wbGUoQGRhdGEsIEBjbHVzdGVyc19zaXplKVxuICAgIFxuICAgIGZvciBzYW1wbGUgaW4gc2FtcGxlc1xuICAgICAgQGNlbnRyb2lkcy5wdXNoIG5ldyBrTWVhbnM6OkNlbnRyb2lkKHNhbXBsZSwgQGZlYXR1cmVzLCBAY2xhc3NfbmFtZSlcbiAgICBcbiAgICAjY29uc29sZS5sb2cgQGNlbnRyb2lkc1xuICBcbiAgIyMgcnVuXG4gICMgIHJ1biB0aGUgYWxnb3JpdGhtIHVudGlsIGl0IGNvbnZlcmdlcyBvciBAaXRlcmF0aW9uc19saW1pdFxuICBydW46IC0+XG4gICAgQGhhc1J1biA9IHRydWVcbiAgICBAaXRlcmF0aW9ucyA9IDBcbiAgICBcbiAgICB3aGlsZSAgKEBpdGVyYXRpb25zIDwgMTAwKSBhbmQgKG5vdCBAaGFzQ29udmVyZ2VkKCkpXG4gICAgICBAaXRlcmF0aW9ucysrXG4gICAgICBAcGFzcygpXG4gICAgICBAdXBkYXRlQ2VudHJvaWRzKClcbiAgXG4gIFxuICAjIyBwYXNzXG4gICMgIHJ1biB0aGUgYWxnb3JpdGhtIG9uZSBzdGVwXG4gIHBhc3M6IC0+XG4gICAgZm9yIHBvaW50IGluIEBkYXRhXG4gICAgICBAY2xhc3NpZnkgcG9pbnRcbiAgXG4gIFxuICBjbGFzc2lmeTogKHBvaW50KSA9PlxuICAgIHBvaW50LmNlbnRyb2lkID0gbnVsbCB1bmxlc3MgcG9pbnQuaGFzT3duUHJvcGVydHkoJ2NlbnRyb2lkJylcbiAgICBcbiAgICBkaXN0YW5jZXMgPSBbXVxuICAgIFxuICAgIGZvciBjZW50cm9pZCwgaSBpbiBAY2VudHJvaWRzXG4gICAgICBkaXN0YW5jZXMucHVzaCBAZGlzdGFuY2UocG9pbnQgLCBjZW50cm9pZClcbiAgICBcbiAgICBjbG9zZXN0X2NlbnRyb2lkID0gZGlzdGFuY2VzLmluZGV4T2YoTWF0aC5taW4uYXBwbHkoTWF0aCwgZGlzdGFuY2VzKSlcbiAgICBcbiAgICBwb2ludC5jZW50cm9pZCA9IEBjZW50cm9pZHNbY2xvc2VzdF9jZW50cm9pZF1cbiAgXG4gIFxuICAjIyB1cGRhdGVDZW50cm9pZHNcbiAgIyAgcGljayBuZXcgY2VudHJvaWRzXG4gIHVwZGF0ZUNlbnRyb2lkczogLT5cbiAgICBmb3IgY2VudHJvaWQsIGkgaW4gQGNlbnRyb2lkc1xuICAgICAgaWYgY2VudHJvaWQuaGlzdG9yeS5sZW5ndGggaXMgMFxuICAgICAgICBjZW50cm9pZC51cGRhdGVIaXN0b3J5KClcbiAgICBcbiAgICBmb3IgY2VudHJvaWQsIGkgaW4gQGNlbnRyb2lkc1xuICAgICAgY2VudHJvaWQucG9pbnRzID0gMFxuICAgICAgZm9yIGZlYXR1cmUgaW4gQGZlYXR1cmVzXG4gICAgICAgIGNlbnRyb2lkW2ZlYXR1cmUrJyBzdW0nXSA9IDBcbiAgICBcbiAgICBmb3IgcG9pbnQgaW4gQGRhdGFcbiAgICAgIHBvaW50LmNlbnRyb2lkLnBvaW50cyArPSAxXG4gICAgICBmb3IgZmVhdHVyZSBpbiBAZmVhdHVyZXNcbiAgICAgICAgcG9pbnQuY2VudHJvaWRbZmVhdHVyZSsnIHN1bSddICs9IHBhcnNlRmxvYXQocG9pbnRbZmVhdHVyZV0pXG4gICAgXG4gICAgZm9yIGNlbnRyb2lkLCBpIGluIEBjZW50cm9pZHNcbiAgICAgIGlmIGNlbnRyb2lkLnBvaW50cyA9PSAwXG4gICAgICAgIGNlbnRyb2lkLmluaXRpYWxpemUoXy5zYW1wbGUoQGRhdGEpKVxuICAgICAgZWxzZVxuICAgICAgICBmb3IgZmVhdHVyZSBpbiBAZmVhdHVyZXNcbiAgICAgICAgICBjZW50cm9pZFtmZWF0dXJlXSA9IGNlbnRyb2lkW2ZlYXR1cmUrJyBzdW0nXSAvIGNlbnRyb2lkLnBvaW50c1xuXG4gICAgZm9yIGNlbnRyb2lkLCBpIGluIEBjZW50cm9pZHNcbiAgICAgIGNlbnRyb2lkLnVwZGF0ZUhpc3RvcnkoKVxuICBcbiAgIyMgZGlzdGFuY2VcbiAgIyAgcmV0dXJuIHRoZSBldWNsaWRlYW4gZGlzdGFuY2UgYmV0d2VlbiB0d28gcG9pbnRzXG4gIGRpc3RhbmNlOiAocG9pbnQsIGNlbnRyb2lkKSAtPlxuICAgIHN1bSA9IDBcbiAgICBcbiAgICBmb3IgZmVhdHVyZSBpbiBAZmVhdHVyZXNcbiAgICAgIHN1bSArPSBNYXRoLnBvdyhjZW50cm9pZFtmZWF0dXJlXSAtIHBvaW50W2ZlYXR1cmVdLCAyKVxuXG4gICAgcmV0dXJuIHN1bVxuICBcbiAgXG4gICMjIGhhc0NvbnZlcmdlZFxuICAjICBjaGVjayBpZiBhbGwgY2VudHJvaWRzIGhhdmUgY29udmVyZ2VkXG4gIGhhc0NvbnZlcmdlZDogLT5cbiAgICBmb3IgY2VudHJvaWQgaW4gQGNlbnRyb2lkc1xuICAgICAgcmV0dXJuIGZhbHNlIGlmIG5vdCBjZW50cm9pZC5oYXNDb252ZXJnZWQoQHRvbGVyYW5jZSlcbiAgICByZXR1cm4gdHJ1ZVxuICBcbiAgXG4gICBcblxuXG5jbGFzcyBrTWVhbnM6OkNlbnRyb2lkXG4gIFxuICAjIyBDb25zdHJ1Y3RvclxuICAjICBjcmVhdGUgYSBDZW50cm9pZCBpbnN0YW5jZVxuICBjb25zdHJ1Y3RvcjogKGluaXRpYWxfZGF0YSwgZmVhdHVyZXMsIGNsYXNzX25hbWUpIC0+XG4gICAgQGNsYXNzX25hbWU9Y2xhc3NfbmFtZVxuICAgIEBmZWF0dXJlcyA9IGZlYXR1cmVzXG4gICAgQGhpc3RvcnkgPSBbXVxuICAgIEBwb2ludHMgPSAwXG4gICAgQGlkID0gKE1hdGgucmFuZG9tKCkgKyAxKS50b1N0cmluZygzNikuc3Vic3RyaW5nKDcpXG4gICAgXG4gICAgQGluaXRpYWxpemUoaW5pdGlhbF9kYXRhKVxuICBcbiAgIyMgaW5pdGlhbGl6ZVxuICAjICBpbml0aWFsaXplIHZhcmlhYmxlc1xuICBpbml0aWFsaXplOiAoZGF0YSktPlxuICAgIGZvciBmZWF0dXJlIGluIEBmZWF0dXJlc1xuICAgICAgdGhpc1tmZWF0dXJlXSAgICAgICAgICAgPSBkYXRhW2ZlYXR1cmVdXG4gICAgICB0aGlzW2ZlYXR1cmUgKyAnIHN1bSddICA9IDAuMFxuICBcbiAgXG4gICMjIHVwZGF0ZUhpc3RvcnlcbiAgIyAgcHVzaCB0aGUgY3VycmVudCBzdGF0ZSBvZiB0aGUgY2VudHJvaWQgaW50byB0aGUgaGlzdG9yeSBhcnJheVxuICB1cGRhdGVIaXN0b3J5OiAtPlxuICAgIHN0YXRlID0ge31cbiAgICBzdGF0ZS5pZCA9IChNYXRoLnJhbmRvbSgpICsgMSkudG9TdHJpbmcoMzYpLnN1YnN0cmluZyg3KVxuICAgIGZvciBmZWF0dXJlIGluIEBmZWF0dXJlc1xuICAgICAgc3RhdGVbZmVhdHVyZV0gPSB0aGlzW2ZlYXR1cmVdXG4gICAgXG4gICAgQGhpc3RvcnkucHVzaChzdGF0ZSlcbiAgICAjY29uc29sZS5sb2cgQGhpc3RvcnlcbiAgICByZXR1cm5cbiAgXG4gICMjIGhhc0NvbnZlcmdlZFxuICAjICBjaGVjayBpZiB0aGUgY2VudHJvaWQgaGFzIGNvbnZlcmdlZFxuICBoYXNDb252ZXJnZWQ6ICh0b2xlcmFuY2UpIC0+XG4gICAgcmV0dXJuIGZhbHNlIGlmIEBoaXN0b3J5Lmxlbmd0aCA8IDJcbiAgICBcbiAgICBsYXN0ID0gQGhpc3RvcnlbQGhpc3RvcnkubGVuZ3RoIC0gMV1cbiAgICBwcmVsYXN0ID0gQGhpc3RvcnlbQGhpc3RvcnkubGVuZ3RoIC0gMl1cbiAgICBcbiAgICBmb3IgZmVhdHVyZSBpbiBAZmVhdHVyZXNcbiAgICAgIGRlbHRhID0gTWF0aC5hYnMobGFzdFtmZWF0dXJlXSAtIHByZWxhc3RbZmVhdHVyZV0pXG4gICAgICBcbiAgICAgIHJldHVybiB0cnVlIGlmIGRlbHRhIDwgdG9sZXJhbmNlXG4gICAgXG4gICAgcmV0dXJuIGZhbHNlXG4gIFxuICAjIyBkaXN0YW5jZVxuICAjICBjaGVjayBpZiB0aGUgY2VudHJvaWQgaGFzIGNvbnZlcmdlZFxuICBkaXN0YW5jZTogKHBvaW50KSAtPlxuICAgIHN1bSA9IDBcbiAgICBcbiAgICBmb3IgZmVhdHVyZSBpbiBAZmVhdHVyZXNcbiAgICAgIHN1bSArPSBNYXRoLnBvdyh0aGlzW2ZlYXR1cmVdIC0gcG9pbnRbZmVhdHVyZV0sIDIpXG4gICAgcmV0dXJuIHN1bVxuICBcbiAgXG4gICMjIHRvT2JqZWN0XG4gICMgIHJldHVybiB0aGUgY2VudHJvaWQgYXMgYW4gb2JqZWN0XG4gIHRvT2JqZWN0OiAtPlxuICAgIG8gPSB7fVxuICAgIG8uaWQgPSB0aGlzLmlkXG4gICAgZm9yIGZlYXR1cmUgaW4gQGZlYXR1cmVzXG4gICAgICBvW2ZlYXR1cmVdID0gdGhpc1tmZWF0dXJlXVxuICAgIHJldHVybiBvXG5cbiMjIEV4cG9ydCBsaWJyYXJ5XG4jIEV4cG9ydCBhcyBhIG5vZGVqcyBtb2R1bGVcbiMgb3IgYXMgYSB0b3AgbGV2ZWwgdmFyaWFibGVcbmlmIG1vZHVsZT8uZXhwb3J0cz8gb3IgZXhwb3J0cz9cbiAgbW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzID0ga01lYW5zXG5lbHNlXG4gIHdpbmRvdy5rTWVhbnMgPSBrTWVhbnNcbiJdfQ==