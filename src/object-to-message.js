var mapper = require('./heroku-response-mapper');

var rpad = function(string, width, padding) {
  if (padding == null) {
    padding = ' ';
  }
  if (width <= string.length) {
    return string;
  } else {
    return rpad(width, string + padding, padding);
  }
};

module.exports = function(object, mapperName) {
  var cleanedObject, keys, maxLength, output;
  cleanedObject = mapper[mapperName](object);
  output = [];
  maxLength = 0;
  keys = Object.keys(cleanedObject);
  keys.forEach(function(key) {
    if (key.length > maxLength) {
      return maxLength = key.length;
    }
  });
  keys.forEach(function(key) {
    return output.push((rpad(key, maxLength)) + " : " + cleanedObject[key]);
  });
  return output.join("\n");
};
