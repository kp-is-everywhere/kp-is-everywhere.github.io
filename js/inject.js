(function() {
  var blocklist;

  blocklist = /kptaipei.tw|docs.google.com|hackpad.com/;

  chrome.extension.sendMessage({}, function(response) {
    var readyStateCheckInterval;

    return readyStateCheckInterval = setInterval(function() {
      if (document.readyState === "complete") {
        clearInterval(readyStateCheckInterval);
        if (new RegExp(blocklist).test(window.location.host)) {
          return;
        }
        return $('body').kpkey();
      }
    }, 500);
  });

}).call(this);
