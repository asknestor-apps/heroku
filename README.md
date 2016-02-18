Heroku for Nestor
=================

[![npm version](https://badge.fury.io/js/hubot-heroku.svg)](https://github.com/daemonsy/hubot-heroku)
[![CircleCI Status](https://circleci.com/gh/daemonsy/hubot-heroku.svg?style=shield)](https://github.com/daemonsy/hubot-heroku)

A library that exposes heroku commands via Heroku's Platform API, with focus of letting non privileged developers carry out tasks around deployments, but not run dangerous commands or get access to the data.

## Background

Under Heroku's permission model, giving someone access to push/promote to production means giving full access to the data as well. This is generally not a good practice and for certain companies, it might be non-compliant.

Our [team](http://engineering.alphasights.com) wanted to let every engineer do deployments without giving production access. We started this by using [atmos/hubot-deploy](https://github.com/atmos/hubot-deploy) and [atmos/heaven](https://github.com/atmos/heaven), but that didn't the ability to run migrations, set config variables etc. hubot-heroku was made with this consideration in mind.

## Considerations
- It's an opionated helper to get things done on Heroku, not an API client
- Only use Heroku's Platform API, no direct running of commands in Bash
- Test coverage for commands, especially if we're implementing
- Certain commands (such as migrate) only work for Rails now =(
- Actual deployment is not the focus of this robot

By the way, I'm also actively looking for co-contributors!

## What about actual deployments?
Deployment usually involves some form of CI process. Hence it is best suited for a robust solution like Github deployments, where you can set required CI contexts etc.

This robot is focused on letting you run auxiliary commands around the heroku system, so developers don't have to be given production access to independently manage deployments.

## Auth

Roles are not available for now, but will be available at a later date.

## Installation
The Heroku API key can be obtained here.

![Heroku API Key Illustration](http://cl.ly/image/2l081V1k1d3g/Screenshot_2014-12-09_21_02_42.png)

and set it in Slack with the command `setenv NESTOR_HEROKU_API_KEY=heroku-api-key`

## Usage

- `heroku list apps <app name filter>` - Lists all apps or filtered by the name
- `heroku info <app>` - Returns useful information about the app
- `heroku dynos <app>` - Lists all dynos and their status
- `heroku releases <app>` - Latest 10 releases
- `heroku rollback <app>` <version> - Rollback to a release
- `heroku restart <app> <dyno>` - Restarts the specified app or dyno/s (e.g. `worker` or `web.2`)
- `heroku migrate <app>` - Runs migrations. Remember to restart the app =)
- `heroku config <app>` - Get config keys for the app. Values not given for security
- `heroku config:set <app> <KEY=value>` - Set KEY to value. Case sensitive and overrides present key
- `heroku config:unset <app> <KEY>` - Unsets KEY, does not throw error if key is not present

For example, `heroku config:set API_KEY=12345`

## Troubleshooting
If you get errors, this might help:
- 400  - Bad request. Hit me with an issue
- 401  - Most likely the API key is incorrect or missing
- 402  - According to Heroku, you need to pay them
- 403  - You don't have access to that app. Perhaps it's a typo on the app name?
- 404  - No such API. Hit me with an issue.
- 405+ - Hit me with an issue

Reference the [API documentation](https://devcenter.heroku.com/articles/platform-api-reference) for more information. Search for "Error Responses".

## Tests
- Mocha
- Chai for BDD expect syntax

Run tests by running `npm test`
