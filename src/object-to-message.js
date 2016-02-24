var mapper = require('./heroku-response-mapper');

module.exports = function(object, msg, mapperName) {
  var fields = mapper[mapperName](object);

  return msg.newRichResponse({
    title: "<" + object.web_url + "|" + object.name + ">",
    fallback: "* [" + object.web_url + "] " + object.name,
    fields: fields
  });
};
