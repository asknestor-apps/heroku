var Heroku = require('heroku-client');
var objectToMessage = require("../object-to-message");
var moment = require('moment');
var _ = require('lodash');
var heroku = new Heroku({
  token: process.env.HUBOT_HEROKU_API_KEY
});
var useAuth = (process.env.HUBOT_HEROKU_USE_AUTH || '').trim().toLowerCase() === 'true';

module.exports = function(robot) {
  var auth, respondToUser;
  auth = function(msg, appName) {
    var hasRole, isAdmin, role;
    if (appName) {
      role = "heroku-" + appName;
      hasRole = robot.auth.hasRole(msg.envelope.user, role);
    }
    isAdmin = robot.auth.hasRole(msg.envelope.user, 'admin');
    if (useAuth && !(hasRole || isAdmin)) {
      msg.reply("Access denied. You must have this role to use this command: " + role);
      return false;
    }
    return true;
  };
  respondToUser = function(robotMessage, error, successMessage) {
    if (error) {
      return robotMessage.reply("Shucks. An error occurred. " + error.statusCode + " - " + error.body.message);
    } else {
      return robotMessage.reply(successMessage);
    }
  };
  robot.respond(/(heroku list apps)\s?(.*)/i, function(msg) {
    var searchName;
    if (!auth(msg)) {
      return;
    }
    if (msg.match[2].length > 0) {
      searchName = msg.match[2];
    }
    if (searchName) {
      msg.reply("Listing apps matching: " + searchName);
    } else {
      msg.reply("Listing all apps available...");
    }
    return heroku.apps().list(function(error, list) {
      var result;
      list = list.filter(function(item) {
        return item.name.match(new RegExp(searchName, "i"));
      });
      result = list.length > 0 ? list.map(function(app) {
        return objectToMessage(app, "appShortInfo");
      }).join("\n\n") : "No apps found";
      return respondToUser(msg, error, result);
    });
  });
  robot.respond(/heroku info (.*)/i, function(msg) {
    var appName;
    if (!auth(msg, appName)) {
      return;
    }
    appName = msg.match[1];
    msg.reply("Getting information about " + appName);
    return heroku.apps(appName).info(function(error, info) {
      var successMessage;
      if (!error) {
        successMessage = "\n" + objectToMessage(info, "info");
      }
      return respondToUser(msg, error, successMessage);
    });
  });
  robot.respond(/heroku dynos (.*)/i, function(msg) {
    var appName;
    appName = msg.match[1];
    if (!auth(msg, appName)) {
      return;
    }
    msg.reply("Getting dynos of " + appName);
    return heroku.apps(appName).dynos().list(function(error, dynos) {
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
      return respondToUser(msg, error, output.join("\n"));
    });
  });
  robot.respond(/heroku releases (.*)$/i, function(msg) {
    var appName;
    appName = msg.match[1];
    if (!auth(msg, appName)) {
      return;
    }
    msg.reply("Getting releases for " + appName);
    return heroku.apps(appName).releases().list(function(error, releases) {
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
      return respondToUser(msg, error, output.join("\n"));
    });
  });
  robot.respond(/heroku rollback (.*) (.*)$/i, function(msg) {
    var app, appName, version;
    appName = msg.match[1];
    version = msg.match[2];
    if (!auth(msg, appName)) {
      return;
    }
    if (version.match(/v\d+$/)) {
      msg.reply("Telling Heroku to rollback to " + version);
      app = heroku.apps(appName);
      return app.releases().list(function(error, releases) {
        var release;
        release = _.find(releases, function(release) {
          return ("v" + release.version) === version;
        });
        if (!release) {
          return msg.reply("Version " + version + " not found for " + appName + " :(");
        }
        return app.releases().rollback({
          release: release.id
        }, function(error, release) {
          return respondToUser(msg, error, "Success! v" + release.version + " -> Rollback to " + version);
        });
      });
    }
  });
  robot.respond(/heroku restart ([\w-]+)\s?(\w+(?:\.\d+)?)?/i, function(msg) {
    var appName, dynoName, dynoNameText;
    appName = msg.match[1];
    dynoName = msg.match[2];
    dynoNameText = dynoName ? ' ' + dynoName : '';
    if (!auth(msg, appName)) {
      return;
    }
    msg.reply("Telling Heroku to restart " + appName + dynoNameText);
    if (!dynoName) {
      return heroku.apps(appName).dynos().restartAll(function(error, app) {
        return respondToUser(msg, error, "Heroku: Restarting " + appName);
      });
    } else {
      return heroku.apps(appName).dynos(dynoName).restart(function(error, app) {
        return respondToUser(msg, error, "Heroku: Restarting " + appName + dynoNameText);
      });
    }
  });
  robot.respond(/heroku migrate (.*)/i, function(msg) {
    var appName;
    appName = msg.match[1];
    if (!auth(msg, appName)) {
      return;
    }
    msg.reply("Telling Heroku to migrate " + appName);
    return heroku.apps(appName).dynos().create({
      command: "rake db:migrate",
      attach: false
    }, function(error, dyno) {
      respondToUser(msg, error, "Heroku: Running migrations for " + appName);
      return heroku.apps(appName).logSessions().create({
        dyno: dyno.name,
        tail: true
      }, function(error, session) {
        return respondToUser(msg, error, "View logs at: " + session.logplex_url);
      });
    });
  });
  robot.respond(/heroku config (.*)$/i, function(msg) {
    var appName;
    appName = msg.match[1];
    if (!auth(msg, appName)) {
      return;
    }
    msg.reply("Getting config keys for " + appName);
    return heroku.apps(appName).configVars().info(function(error, configVars) {
      var listOfKeys;
      listOfKeys = configVars && Object.keys(configVars).join(", ");
      return respondToUser(msg, error, listOfKeys);
    });
  });
  robot.respond(/heroku config:set (.*) (\w+)=('([\s\S]+)'|"([\s\S]+)"|([\s\S]+\b))/im, function(msg) {
    var appName, key, keyPair, value;
    keyPair = {};
    appName = msg.match[1];
    key = msg.match[2];
    value = msg.match[4] || msg.match[5] || msg.match[6];
    if (!auth(msg, appName)) {
      return;
    }
    msg.reply("Setting config " + key + " => " + value);
    keyPair[key] = value;
    return heroku.apps(appName).configVars().update(keyPair, function(error, configVars) {
      return respondToUser(msg, error, "Heroku: " + key + " is set to " + configVars[key]);
    });
  });
  return robot.respond(/heroku config:unset (.*) (\w+)$/i, function(msg) {
    var appName, key, keyPair, value;
    keyPair = {};
    appName = msg.match[1];
    key = msg.match[2];
    value = msg.match[3];
    if (!auth(msg, appName)) {
      return;
    }
    msg.reply("Unsetting config " + key);
    keyPair[key] = null;
    return heroku.apps(appName).configVars().update(keyPair, function(error, response) {
      return respondToUser(msg, error, "Heroku: " + key + " has been unset");
    });
  });
};