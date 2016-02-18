var Heroku = require('heroku-client');
var objectToMessage = require("../object-to-message");
var moment = require('moment');
var _ = require('lodash');
var heroku = new Heroku({
  token: process.env.NESTOR_HEROKU_API_KEY
});

module.exports = function(robot) {
  var respondToUser = function(robotMessage, error, successMessage, done) {
    if (error) {
      return robotMessage.reply("Shucks. An error occurred. " + error.statusCode + " - " + error.body.message, done);
    } else {
      return robotMessage.reply(successMessage, done);
    }
  };

  robot.respond(/(heroku list apps)\s?(.*)/i, function(msg, done) {
    var searchName;
    var promise;

    if (msg.match[2].length > 0) {
      searchName = msg.match[2];
    }

    if (searchName) {
      promise = msg.reply("Listing apps matching: " + searchName);
    } else {
      promise = msg.reply("Listing all apps available...");
    }

    promise.then(function() {
      heroku.apps().list(function(error, list) {
        var result;
        list = list.filter(function(item) {
          return (item.name.match(new RegExp(searchName, "i")) !== null);
        });

        result = list.length > 0 ? list.map(function(app) {
          return objectToMessage(app, "appShortInfo");
        }).join("\n\n") : "No apps found";
        respondToUser(msg, error, result, done);
      });
    });
  });

  robot.respond(/heroku info (.*)/i, function(msg, done) {
    var appName = msg.match[1];

    msg.reply("Getting information about " + appName).then(function() {
      heroku.apps(appName).info(function(error, info) {
        var successMessage;
        if (!error) {
          successMessage = "\n" + objectToMessage(info, "info");
        }
        respondToUser(msg, error, successMessage, done);
      });
    });
  });

  robot.respond(/heroku dynos (.*)/i, function(msg, done) {
    var appName = msg.match[1];

    msg.reply("Getting dynos of " + appName).then(function() {
      heroku.apps(appName).dynos().list(function(error, dynos) {
        var currentFormation, dyno, i, lastFormation, len, output, timeAgo, updatedAt, updatedTime;
        output = [];
        if (dynos) {
          output.push("Dynos of " + appName);
          lastFormation = "";
          for (i = 0, len = dynos.length; i < len; i++) {
            dyno = dynos[i];
            currentFormation = dyno.type + "." + dyno.size;
            if (currentFormation !== lastFormation) {
              if (lastFormation) {
                output.push("");
              }
              output.push("=== " + dyno.type + " (" + dyno.size + "): `" + dyno.command + "`");
              lastFormation = currentFormation;
            }
            updatedAt = moment(dyno.updated_at);
            updatedTime = updatedAt.utc().format('YYYY/MM/DD HH:mm:ss');
            timeAgo = updatedAt.fromNow();
            output.push(dyno.name + ": " + dyno.state + " " + updatedTime + " (~ " + timeAgo + ")");
          }
        }
        respondToUser(msg, error, output.join("\n"), done);
      });
    });
  });

  robot.respond(/heroku releases (.*)$/i, function(msg, done) {
    var appName = msg.match[1];

    msg.reply("Getting releases for " + appName).then(function() {
      heroku.apps(appName).releases().list(function(error, releases) {
        var i, len, output, ref, release;
        output = [];
        if (releases) {
          output.push("Recent releases of " + appName);
          ref = releases.sort(function(a, b) {
            return b.version - a.version;
          }).slice(0, 10);
          for (i = 0, len = ref.length; i < len; i++) {
            release = ref[i];
            output.push("v" + release.version + " - " + release.description + " - " + release.user.email + " -  " + release.created_at);
          }
        }

        respondToUser(msg, error, output.join("\n"), done);
      });
    });
  });

  robot.respond(/heroku rollback (.*) (.*)$/i, function(msg, done) {
    var appName = msg.match[1];
    var version = msg.match[2];

    if (version.match(/v\d+$/)) {
      msg.reply("Telling Heroku to rollback to " + version).then(function() {
        app = heroku.apps(appName);
        app.releases().list(function(error, releases) {
          var release;
          release = _.find(releases, function(release) {
            return ("v" + release.version) === version;
          });

          if (!release) {
            msg.reply("Version " + version + " not found for " + appName + " :(", done);
          } else {
            app.releases().rollback({
              release: release.id
            }, function(error, release) {
              respondToUser(msg, error, "Success! v" + release.version + " -> Rollback to " + version, done);
            });
          }
        });
      });
    }
  });

  robot.respond(/heroku restart ([\w-]+)\s?(\w+(?:\.\d+)?)?/i, function(msg, done) {
    var appName = msg.match[1];
    var dynoName = msg.match[2];
    var dynoNameText = dynoName ? ' ' + dynoName : '';

    msg.reply("Telling Heroku to restart " + appName + dynoNameText).then(function() {
      if (!dynoName) {
        heroku.apps(appName).dynos().restartAll(function(error, app) {
          respondToUser(msg, error, "Heroku: Restarting " + appName, done);
        });
      } else {
        heroku.apps(appName).dynos(dynoName).restart(function(error, app) {
          respondToUser(msg, error, "Heroku: Restarting " + appName + dynoNameText, done);
        });
      }
    });
  });

  robot.respond(/heroku migrate (.*)/i, function(msg, done) {
    var appName = msg.match[1];

    msg.reply("Telling Heroku to migrate " + appName).then(function() {
      heroku.apps(appName).dynos().create({
        command: "rake db:migrate",
        attach: false
      }, function(error, dyno) {
        respondToUser(msg, error, "Heroku: Running migrations for " + appName).then(function() {
          heroku.apps(appName).logSessions().create({
            dyno: dyno.name,
            tail: true
          }, function(error, session) {
            respondToUser(msg, error, "View logs at: " + session.logplex_url, done);
          });
        });
      });
    });
  });

  robot.respond(/heroku config (.*)$/i, function(msg, done) {
    var appName = msg.match[1];
    msg.reply("Getting config keys for " + appName).then(function() {
      heroku.apps(appName).configVars().info(function(error, configVars) {
        var listOfKeys = configVars && Object.keys(configVars).join(", ");
        respondToUser(msg, error, listOfKeys, done);
      });
    });
  });

  robot.respond(/heroku config:set (.*) (\w+)=('([\s\S]+)'|"([\s\S]+)"|([\s\S]+\b))/im, function(msg, done) {
    var keyPair = {};
    var appName = msg.match[1];
    var key = msg.match[2];
    var value = msg.match[4] || msg.match[5] || msg.match[6];

    keyPair[key] = value;

    msg.reply("Setting config " + key + " => " + value).then(function() {
      heroku.apps(appName).configVars().update(keyPair, function(error, configVars) {
        respondToUser(msg, error, "Heroku: " + key + " is set to " + configVars[key], done);
      });
    });
  });

  robot.respond(/heroku config:unset (.*) (\w+)$/i, function(msg, done) {
    var keyPair = {};
    var appName = msg.match[1];
    var key = msg.match[2];
    var value = msg.match[3];
    msg.reply("Unsetting config " + key).then(function() {
      keyPair[key] = null;
      heroku.apps(appName).configVars().update(keyPair, function(error, response) {
        respondToUser(msg, error, "Heroku: " + key + " has been unset", done);
      });
    });
  });
};
