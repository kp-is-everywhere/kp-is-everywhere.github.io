chrome.extension.sendMessage {}, (response) ->
  readyStateCheckInterval = setInterval ->
    if document.readyState == "complete"
      clearInterval(readyStateCheckInterval)
      return if window.location.host == 'kptaipei.tw'
      new KpIsEverywhere()
  , 500
