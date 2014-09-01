DEBUG                  = false
DEBUG                  = true
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
    @scope = options && options.scope || $('body')
    @observe = options && options.scope[0] || document
    @getKeywords()
    @bind()
  bind: ->
    @scope.on 'mouseover', '.kp-highlight', @mousein
    setTimeout(@_bindMutation, 3000)
  _bindMutation: =>
    ###
      thanks g0v news helper!
      https://github.com/g0v/newshelper-extension
    ###
    target = @observe
    config =
      attributes: false
      characterData: false
      childList: true
      subtree: true

    @mutationObserver = new MutationObserver (mutations) =>
      @scopes = []
      hasNewNode = false
      for mutation in mutations
        if mutation.type == 'childList' && mutation.addedNodes.length > 0 && !(new RegExp(ignoreClass).test(mutation.target.classList))
          # $addedTarget = $(mutation.target)
          $addedPrev = $(mutation.previousSibling)
          # @scopes.push $addedTarget
          @scopes.push $addedPrev
          hasNewNode = true
      return unless hasNewNode
      @scopeChanged = true
      throttle @findAllKeywords, 1000

    @mutationObserver.observe(target, config)
    # TODO: stop observe when idle, restart on scroll or click?
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
    Tabletop.init
      key: public_spreadsheet_url,
      simpleSheet: true
      callback: (rows) =>
        @rows = []
        for row in rows
          continue if !row.keywords
          row =
            title: row.title.replace(/(^(\D)+\d+-)/, '')
            keywords: row.keywords.split('、')
            id: row.id
          @rows.push row
          # TODO: flatten keywords information
        @findAllKeywords()
  findAllKeywords: =>
    for row in @rows
      for keyword in row.keywords
        @_findOneKeyword keyword, row
  _findOneKeyword: (keyword, row) ->
    if @scopes?
      for $scope in @scopes
        @_findOneKeywordInScope keyword, row, $scope.next()
      @scopes = null
      # TODO: loop recursive instead of iterative => @addNodes.shift()
    else
      @_findOneKeywordInScope keyword, row, @scope
  _findOneKeywordInScope: (keyword, row, scope) ->
    html = scope.html()
    return if !html
    notFound = html.indexOf(keyword) < 0
    if notFound
      return
    scope.highlight keyword, {classname: 'kp-highlight', tag: 'div', ignoreClass: ignoreClass }, (div) ->
      $(div).attr
        'data-kp-id': row.id
        'data-kp-title': row.title

$.fn.kpkey = ->
  $(@).each (i, scope) ->
    $scope = $(scope)
    if !$scope.data('kpkey')
      kpkey = new KpIsEverywhere({ scope: $scope })
      $scope.data('kpkey', kpkey)
  @
