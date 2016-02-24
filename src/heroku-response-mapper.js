var moment = require("moment");

module.exports = {
  'full': function(response) {
    return {
      last_release: {
        'title': 'Last Release',
        'value': moment(response.released_at).fromNow(),
        'short': true
      },
      maintenance: {
        'title': 'Maintenance',
        'value': response.maintenance,
        'short': true
      },
      slug_size: {
        'title': 'Slug Size',
        'value': response.slug_size && ("~ " + (Math.round(response.slug_size / 1000000)) + " MB"),
        'short': true
      },
      repo_size: {
        'title': 'Repo Size',
        'value': response.repo_size && ("~ " + (Math.round(response.repo_size / 1000000)) + " MB"),
        'short': true
      },
      region: {
        'title': 'Region',
        'value': response.region && response.region.name,
        'short': true
      },
      git_url: {
        'title': 'Git URL',
        'value': response.git_url,
        'short': true
      },
      buildpack: {
        'title': 'Buildpack',
        'value': response.buildpack_provided_description,
        'short': true
      },
      stack: {
        'title': 'Stack',
        'value': response.build_stack && response.build_stack.name,
        'short': true
      }
    };
  },
  'short': function(response) {
    return {
      git_url: {
        'title': 'Git URL',
        'value': response.git_url,
        'short': true
      },
      last_release: {
        'title': 'Last Release',
        'value': moment(response.released_at).fromNow(),
        'short': true
      }
    };
  }
};
