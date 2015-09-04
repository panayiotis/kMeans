# kMeans clustering algorithm

[vlantis.gr/kmeans](http://vlantis.gr/kmeans)

##Features
###kMeans library
kMeans library is written in coffeescript (which compiles to javascript).
It can be run in a Nodejs environment as a module or included in an html page as a script.  
*see file [kmeans.coffee](/app/javascripts/kmeans.coffee "source code")*

###Visualization
Visualizations have two dimensions thus only two features are repressented the each visualization at once.
Centroids and their convergence paths are also represented in the visualization.
Because kMeans picks random centroids on initialization, every time the page loads the results are different.
D3.js library is used to create kMeans visualizations.  
*see file [visualization.coffee](/app/javascripts/visualization.coffee "source code")*

###Test Driven Development
kMeans is developed using the Test Driven Development paradigm.
The library's functionality is tested using jasmine js testing framework.  
*see file [kmeans_spec.coffee](/spec/kmeans_spec.coffee "source code")*
