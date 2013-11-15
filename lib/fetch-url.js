var Uri = require("jsuri");
var fs      = require("fs");
var request = require("request");
var _       = require("underscore");

var FetchUrl = function(fileRef, cbSuccess, cbError, kind, context) {

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
    var fixed = "";
    if (url.substring(0,2) == "//") {
      fixed = "http:" + url;
    } else if ((url.substring(0,1) == "/") && (typeof fileRef.linkedFrom != 'undefined')) {
      // Absolute path
      var linked = new Uri(fileRef.linkedFrom);
      fixed = linked.protocol() + '://' + linked.host();
      if (linked.port().length > 0) {
        fixed += ':' + linked.port();
      }
      fixed += url;
    } else if ((url.substring(0,4) != 'http') && (typeof fileRef.linkedFrom != 'undefined')) {
      // Relative path
      var linked = new Uri(fileRef.linkedFrom);
      fixed = linked.protocol() + '://' + linked.host();
      if (linked.port().length > 0) {
        fixed += ':' + linked.port();
      }
      var parts = linked.path().split("/");
      var filename = parts[parts.length - 1];
      if ((filename != null) && (filename.length != 0)) {
        parts.pop();
      }
      fixed += parts.join('/') + '/' + url;
    } else {
      fixed = url;
    }
    return fixed;
  };

  if (typeof kind == 'undefined') {
    kind = 'utf-8';
  }
  if ((typeof fileRef === 'undefined') || (fileRef === "")) {
    cbError.call(context, "Empty file spec.");
  } else {
    if (_.isObject(fileRef)) {
      kind = 'utf-8';
      if (fileRef.binary === true) {
        kind = 'binary';
      }
      var url = fixUrl(fileRef.url);
      FetchUrl(url, cbSuccess, cbError, kind, context);
    } else if (fileRef.indexOf("github://") === 0) {
      var url = githubUrlToRealUrl(fileRef);
      if (url === null) {
        cbError.call(context, "Invalid github URL: " + fileRef);
      } else {
        FetchUrl(url, cbSuccess, cbError, kind, context);
      }
    } else if ((fileRef.indexOf("http://") === 0) ||
               (fileRef.indexOf("https://") === 0)) {
      var settings = {
        uri: fileRef
      };

      if (kind == 'binary') {
        settings.encoding = 'binary';
      }

      request(settings, function(err, response, body) {
        if (err) {
          var sc = "";
          cbError.call(context, err);
        } else {
          if (Buffer.isBuffer(body)) {
            body = body.toString(settings.encoding);
          }
          cbSuccess.call(context, body);
        }
      });
    } else {
      // Load from FS
      fs.readFile(fileRef, kind, function(err, data) {
        if (err) {
          cbError.call(context, "  Could not read file: " + fileRef + "\n" + err);
        } else {
          cbSuccess.call(context, data);
        }
      });
    }
  }
};

module.exports = FetchUrl;
