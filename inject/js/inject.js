(function() {
  chrome.extension.sendMessage({}, function(response) {
    var readyStateCheckInterval;

    return readyStateCheckInterval = setInterval(function() {
      if (document.readyState === "complete") {
        clearInterval(readyStateCheckInterval);
        if (window.location.host === 'kptaipei.tw') {
          return;
        }
        return new KpIsEverywhere();
      }
    }, 10);
  });

}).call(this);
