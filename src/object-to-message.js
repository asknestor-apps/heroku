var mapper = require('./heroku-response-mapper');

module.exports = function(object, msg, mapperName) {
  var fields = mapper[mapperName](object);

  return msg.newRichResponse({
    title: object.name,
    title_link: object.web_url,
    fallback: "* [" + object.web_url + "] " + object.name,
    fields: fields
  });
};
