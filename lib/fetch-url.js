var url     = require("jsuri");
var fs      = require("fs");
var request = require("request");

module.exports = function(fileRef, cbSuccess, cbError, kind) {

  var githubUrlToRealUrl = function(url) {
    var parts = url.split("/");
    if (parts.length < 5) {
      return null;
    }
    parts.shift(); // bye http
    parts.shift(); // bye //
    var user = parts.shift();
    var repo = parts.shift();
    var file = parts.join("/");
    return "https://raw.github.com/" + user + "/" + repo + "/master/" + file;
  };

  var fixUrl = function(url) {
    if (url.substring(0,2) == "//") {
      url = "http:" + url;
    } else if (url.substring(0,1) == "/") {
      url = "http://" + theme.contentMap.domain + url;
    }
    if (url.substring(0,4) != "http"){
      url = theme.contentMap.domain + theme.contentMap.pages[0].path + url;
    }
    return url;
  };

  if (typeof kind == 'undefined') {
    kind = 'utf-8';
  }
  if ((typeof fileRef === 'undefined') || (fileRef === "")) {
    cbError("Empty file spec.");
  } else {
    if (_.isObject(fileRef)) {
      kind = 'utf-8';
      if (fileRef.binary === true) {
        kind = 'binary';
      }
      var url = fixUrl(fileRef.url);
      WebScraper.fetchUrl(url, cbSuccess, cbError, kind);
    } else if (fileRef.indexOf("github://") === 0) {
      var url = githubUrlToRealUrl(fileRef);
      if (url === null) {
        cbError("Invalid github URL: " + fileRef);
      } else {
        WebScraper.fetchUrl(url, cbSuccess, cbError);
      }
    } else if ((fileRef.indexOf("http://") === 0) ||
               (fileRef.indexOf("https://") === 0)) {
      var settings = {
        uri: fileRef
      };

      if (kind == 'binary') {
        settings.encoding = null;
      }

      request(settings, function(err, response, body) {
        if (err) {
          cbError("Could not fetch file\n" +
                  "  Response code: " + response.statusCode + "\n");
        } else {
          cbSuccess(body);
        }
      });
    } else {
      // Load from FS
      fs.readFile(fileRef, kind, function(err, data) {
        if (err) {
          cbError("  Coult not read file: " + fileRef + "\n" + err);
        } else {
          cbSuccess(data);
        }
      });
    }
  }
};

