var moment = require("moment");

module.exports = {
  info: function(response) {
    return {
      name: response.name,
      url: response.web_url,
      last_release: response.released_at,
      maintenance: response.maintenance,
      slug_size: response.slug_size && ("~ " + (Math.round(response.slug_size / 1000000)) + " MB"),
      repo_size: response.repo_size && ("~ " + (Math.round(response.repo_size / 1000000)) + " MB"),
      region: response.region && response.region.name,
      git_url: response.git_url,
      buildpack: response.buildpack_provided_description,
      stack: response.build_stack && response.build_stack.name
    };
  },
  appShortInfo: function(response) {
    return {
      name: response.name,
      url: response.web_url,
      git_url: response.git_url,
      last_release: (moment(response.released_at).fromNow()) + " ago"
    };
  }
};
