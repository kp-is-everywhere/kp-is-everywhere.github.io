blocklist = /kptaipei.tw|docs.google.com|hackpad.com/
chrome.extension.sendMessage {}, (response) ->
  readyStateCheckInterval = setInterval ->
    if document.readyState == "complete"
      clearInterval(readyStateCheckInterval)
      return if (new RegExp(blocklist).test(window.location.host))
      $('html').kpkey()
  , 500
