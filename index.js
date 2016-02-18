var path = require('path');

module.exports = function(robot, scripts) {
  robot.loadFile(path.resolve(__dirname, "src", "scripts"), "heroku-commands.js");
};
