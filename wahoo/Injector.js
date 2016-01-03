var _ = require('underscore');

module.exports = Injector;

function extractArgNames(func) {
  var allArgs = func.toString().match(/^[^\(]*\(\s*([^\)]*)\)/m)[1];
  var argsWithSpaces = allArgs.split(',');
  return _.map(argsWithSpaces, function(s) { return s.trim(); });
}

function Injector(modules, preprocessor) {
  this.modules = modules;
  this.preprocessor = preprocessor ? preprocessor : _.identity;
}

Injector.prototype.invoke = function invoke(func, staticArgs, extraModules) {
  var args;
  
  if (_.isArray(staticArgs)) {
    args = _.clone(staticArgs);
  } else {
    args = [];
    extraModules = staticArgs;
  }

  if (!_.isObject(extraModules)) {
    extraModules = {};
  }

  var argNames = extractArgNames(func);

  var i = args.length;
  while (args.length < argNames.length) {
    var nextArgName = argNames[i++];

    var argInExtraModules = nextArgName in extraModules;
    if (argInExtraModules) {
      nextArg = extraModules[nextArgName];
    } else {
      nextArg = this.modules[nextArgName];
    }
    args.push(this.preprocessor(nextArg));
  }

  return func.apply(null, args);
};
