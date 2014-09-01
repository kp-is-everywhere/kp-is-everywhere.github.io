DEBUG                  = false
# DEBUG                  = true
MutationObserver       = window.MutationObserver || window.WebKitMutationObserver
googleKey              = '1TIhYo4RpGu7FGr0XZRIkVVx7E9kUzceXsNI8xPmDG9E'
public_spreadsheet_url = "https://docs.google.com/spreadsheet/pub?hl=en_US&hl=en_US&key=#{googleKey}&output=html"
image_url              = chrome.extension && chrome.extension.getURL('images/kp.jpg') || 'images/kp.jpg'
ignoreClass            = /kp-highlight|kp-wrapper|fbDock|hidden_elem/
kp_url                 = (kpid) -> "http://kptaipei.tw/?page_id=#{kpid}"

templates = [
  "先別管這個了，你聽過我提出的 <strong>{{title}}</strong> 嗎？？",
  "我覺得你可以幫我看看 <strong>{{title}}</strong> 這個政見怎麼樣？",
  "關於{{keyword}}，我的想法是 <strong>{{title}}</strong>",
  "關於{{keyword}}，我主張 <strong>{{title}}</strong>",
  "說到{{keyword}}，你知道 <strong>{{title}}</strong> 嗎？"
]

xx = (t) ->
  DEBUG && console.log t

render = (title, keyword) ->
  template = templates[Math.floor(Math.random()*templates.length)]
  template = template.replace('{{title}}', title)
  template = template.replace('{{keyword}}', keyword)

  """
    <div class='kp-wrapper'>
      <div class='kp-container'>
        <img class='kp-avatar' src="#{image_url}" alt="柯文哲關心您">
        <p class='kp-text'>#{template}</p>
      </div>
    </div>
  """

throttle = (() ->
  timer_ = null
  return (fn, wait) ->
    clearTimeout(timer_) if timer_
    timer_ = setTimeout(fn, wait)
)()

class KpIsEverywhere
  constructor: (options) ->
    @prepare()
    @body = $('body')
    $scope = options && options.scope || @body
    @scopes = [$scope]
    @observeTarget = document
    @getKeywords()
    @bind()
  prepare: ->
    ###
      thanks g0v news helper!
      https://github.com/g0v/newshelper-extension
    ###
    @mutationConfig =
      attributes: false
      characterData: false
      childList: true
      subtree: true
    @mutationObserver = new MutationObserver (mutations) =>
      hasNewNode = false
      for mutation in mutations
        if mutation.type == 'childList' && mutation.addedNodes.length > 0 && !(new RegExp(ignoreClass).test(mutation.target.classList))
          $scope = $(mutation.addedNodes)
          @scopes.push $scope
          xx "+1"
          @scopeChanged = true
          hasNewNode = true
      return unless hasNewNode
      throttle @findAllKeywords, 2000
  bind: ->
    @body.on 'mouseover', '.kp-highlight', @mousein
    @observe()
  observe: ->
    return if @observing
    @mutationObserver.observe @observeTarget, @mutationConfig
    @observing = true
    xx 'observing'
  unobserve: ->
    return if !@observing
    @mutationObserver.disconnect()
    @observing = false
    xx 'unobserve'
  mousein: (e) =>
    $match = $(e.currentTarget)
    @_addLink($match) if !$match.data('kp-link-enabled')
    if $(e.target).hasClass('kp-highlight')
      $match.find('.kp-wrapper').css
        left: e.clientX
        top: e.clientY
  _addLink: ($match) ->
    return if $match.find('.kp-wrapper').length # to avoid duplicated dom with plugin
    $match.data('kp-link-enabled', true)
    title = $match.data('kp-title')
    id    = $match.data('kp-id')
    $html = $(render(title, $match.text()))
    $html.find('strong').wrap("<a class='kp-title' href='#{kp_url(id)}' target='_blank'>")
    $match.append($html)
  getKeywords: ->
    @keywords = []
    Tabletop.init
      key: public_spreadsheet_url,
      simpleSheet: true
      callback: (rows) =>
        for row in rows
          continue if !row.keywords
          keywords = row.keywords.split('、')
          for keyword in keywords
            keywordObj =
              title: row.title.replace(/(^(\D)+\d+-)/, '')
              text: keyword
              id: row.id
            @keywords.push keywordObj
        @findAllKeywords()
  findAllKeywords: =>
    @_findAllKeywordsInScopes()
  _findAllKeywordsInScopes: =>
    $scope = @scopes.shift()
    xx "#{@scopes.length}"
    for keyword in @keywords
      @_findOneKeywordInOneScope(keyword, $scope)
    return if !@scopes.length
    setTimeout(@_findAllKeywordsInScopes, 100)
  _findOneKeywordInOneScope: (keyword, $scope) ->
    text = $scope.text()
    return if !text || !keyword
    notFound = text.indexOf(keyword.text) < 0
    return if notFound
    @unobserve()
    xx "found #{keyword.text}"
    $scope.highlight keyword.text, {classname: 'kp-highlight', tag: 'div', ignoreClass: ignoreClass }, (div) =>
      $(div).attr
        'data-kp-id': keyword.id
        'data-kp-title': keyword.title
    @observe()

$.fn.kpkey = ->
  $(@).each (i, scope) ->
    $scope = $(scope)
    if !$scope.data('kpkey')
      kpkey = new KpIsEverywhere({ scope: $scope })
      $scope.data('kpkey', kpkey)
  @
