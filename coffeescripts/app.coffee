DEBUG                  = false
key                    = '1TIhYo4RpGu7FGr0XZRIkVVx7E9kUzceXsNI8xPmDG9E'
public_spreadsheet_url = "https://docs.google.com/spreadsheet/pub?hl=en_US&hl=en_US&key=#{key}&output=html"
kp_url                 = (id) -> "http://kptaipei.tw/?page_id=#{id}"
image_url              = chrome.extension && chrome.extension.getURL('images/kp.jpg') || '/images/kp.jpg'
ignoreClass            = /kp-highlight|kp-wrapper|fbDock/
DEBUG                  = true

xx = (t) ->
  DEBUG && console.log t

templates = [
  "先別管這個了，你聽過我提出的<strong>{{title}}</strong>嗎？？",
  "我覺得你可以幫我看看<strong>{{title}}</strong>這個政見怎麼樣？",
  "關於{{keyword}}，我的想法是<strong>{{title}}</strong>",
  "說到{{keyword}}，你聽過<strong>{{title}}</strong>嗎？"
]

getTemplate = (title, keyword) ->
  template = templates[Math.floor(Math.random()*templates.length)]
  template = template.replace('{{title}}', title)
  template = template.replace('{{keyword}}', keyword)

  """
    <div class='kp-wrapper'>
      <div class='kp-container'>
        <img class='kp-avatar' src="#{image_url}" alt="柯 P 關心您">
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
    @load()
    @bind()
  prepare: ->
    @body = $('body')
  bind: ->
    @body.on 'mouseover', '.kp-highlight', @addLink

    ###
      thanks g0v news helper!
      https://github.com/g0v/newshelper-extension
    ###

    MutationObserver = window.MutationObserver || window.WebKitMutationObserver
    target = document
    config =
      attributes: true
      childList: true
      characterData: true
      subtree: true

    mutationObserver = new MutationObserver (mutations) =>
      hasNewNode = false
      $newNodes = null
      for mutation in mutations
        $addedNodes = $(mutation.addedNodes)
        if mutation.type == 'childList' && mutation.addedNodes.length > 0 && !(new RegExp(ignoreClass).test(mutation.target.classList))
          $newNodes = $newNodes && $newNodes.add($addedNodes) || $addedNodes
          hasNewNode = true

      return unless hasNewNode
      throttle( =>
        @findAll()
      , 1000)

    mutationObserver.observe(target, config)
  addLink: (e) =>
    $match = $(e.currentTarget)
    if !$match.data('kp-link-enabled')
      $match.data('kp-link-enabled', true)
      title = $match.data('kp-title')
      id    = $match.data('kp-id')
      $html = $(getTemplate(title, $match.text()))
      $html.find('strong').wrap("<a class='kp-title' href='#{kp_url(id)}' target='_blank'>")
      $match.append($html)
    if $(e.target).hasClass('kp-highlight')
      pos = $match[0].getBoundingClientRect()
      $match.find('.kp-wrapper').css
        left: pos.left
        top: pos.top
  load: ->
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
        @findAll()
  findAll: =>
    for row in @rows
      for keyword in row.keywords
        xx "搜尋#{keyword}中"
        @findOne keyword, row

  findOne: (keyword, row) ->
    html = @body.html()
    return if !html
    notFound = html.indexOf(keyword) < 0
    if notFound
      xx '搜尋結束'
      return
    xx "發現關鍵字：#{keyword}"
    @body.highlight keyword, {classname: 'kp-highlight', tag: 'div', ignoreClass: ignoreClass }, (div) ->
      $(div).attr
        'data-kp-id': row.id
        'data-kp-title': row.title

window.KpIsEverywhere = KpIsEverywhere
