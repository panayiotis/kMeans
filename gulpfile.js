// Note the new way of requesting CoffeeScript since 1.7.x
require('coffee-script/register');
// This bootstraps your Gulp's main file
require('./gulpfile.coffee');

console.reset = function () {
  return process.stdout.write('\033c');
}
