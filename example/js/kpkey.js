(function() {
  var DEBUG, KpIsEverywhere, MutationObserver, googleKey, ignoreClass, image_url, kp_url, public_spreadsheet_url, render, templates, throttle, xx,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  DEBUG = false;

  MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

  googleKey = '1TIhYo4RpGu7FGr0XZRIkVVx7E9kUzceXsNI8xPmDG9E';

  public_spreadsheet_url = "https://docs.google.com/spreadsheet/pub?hl=en_US&hl=en_US&key=" + googleKey + "&output=html";

  image_url = chrome.extension && chrome.extension.getURL('images/kp.jpg') || 'images/kp.jpg';

  ignoreClass = /kp-highlight|kp-wrapper|fbDock|hidden_elem/;

  kp_url = function(kpid) {
    return "http://kptaipei.tw/?page_id=" + kpid;
  };

  templates = ["先別管這個了，你聽過我提出的 <strong>{{title}}</strong> 嗎？？", "我覺得你可以幫我看看 <strong>{{title}}</strong> 這個政見怎麼樣？", "關於{{keyword}}，我的想法是 <strong>{{title}}</strong>", "關於{{keyword}}，我主張 <strong>{{title}}</strong>", "說到{{keyword}}，你知道 <strong>{{title}}</strong> 嗎？"];

  xx = function(t) {
    return DEBUG && console.log(t);
  };

  render = function(title, keyword) {
    var template;

    template = templates[Math.floor(Math.random() * templates.length)];
    template = template.replace('{{title}}', title);
    template = template.replace('{{keyword}}', keyword);
    return "<div class='kp-wrapper'>\n  <div class='kp-container'>\n    <img class='kp-avatar' src=\"" + image_url + "\" alt=\"柯文哲關心您\">\n    <p class='kp-text'>" + template + "</p>\n  </div>\n</div>";
  };

  throttle = (function() {
    var timer_;

    timer_ = null;
    return function(fn, wait) {
      if (timer_) {
        clearTimeout(timer_);
      }
      return timer_ = setTimeout(fn, wait);
    };
  })();

  KpIsEverywhere = (function() {
    function KpIsEverywhere(options) {
      this._findAllKeywordsInScopes = __bind(this._findAllKeywordsInScopes, this);
      this.findAllKeywords = __bind(this.findAllKeywords, this);
      this.mousein = __bind(this.mousein, this);
      var $scope;

      this.prepare();
      this.body = $('body');
      $scope = options && options.scope || this.body;
      this.scopes = [$scope];
      this.observeTarget = document;
      this.getKeywords();
      this.bind();
    }

    KpIsEverywhere.prototype.prepare = function() {
      /*
        thanks g0v news helper!
        https://github.com/g0v/newshelper-extension
      */

      var _this = this;

      this.mutationConfig = {
        attributes: false,
        characterData: false,
        childList: true,
        subtree: true
      };
      return this.mutationObserver = new MutationObserver(function(mutations) {
        var $scope, hasNewNode, mutation, _i, _len;

        hasNewNode = false;
        for (_i = 0, _len = mutations.length; _i < _len; _i++) {
          mutation = mutations[_i];
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0 && !(new RegExp(ignoreClass).test(mutation.target.classList))) {
            $scope = $(mutation.addedNodes);
            _this.scopes.push($scope);
            xx("+1");
            _this.scopeChanged = true;
            hasNewNode = true;
          }
        }
        if (!hasNewNode) {
          return;
        }
        return throttle(_this.findAllKeywords, 2000);
      });
    };

    KpIsEverywhere.prototype.bind = function() {
      this.body.on('mouseover', '.kp-highlight', this.mousein);
      return this.observe();
    };

    KpIsEverywhere.prototype.observe = function() {
      if (this.observing) {
        return;
      }
      this.mutationObserver.observe(this.observeTarget, this.mutationConfig);
      this.observing = true;
      return xx('observing');
    };

    KpIsEverywhere.prototype.unobserve = function() {
      if (!this.observing) {
        return;
      }
      this.mutationObserver.disconnect();
      this.observing = false;
      return xx('unobserve');
    };

    KpIsEverywhere.prototype.mousein = function(e) {
      var $match;

      $match = $(e.currentTarget);
      if (!$match.data('kp-link-enabled')) {
        this._addLink($match);
      }
      if ($(e.target).hasClass('kp-highlight')) {
        return $match.find('.kp-wrapper').css({
          left: e.clientX,
          top: e.clientY
        });
      }
    };

    KpIsEverywhere.prototype._addLink = function($match) {
      var $html, id, title;

      if ($match.find('.kp-wrapper').length) {
        return;
      }
      $match.data('kp-link-enabled', true);
      title = $match.data('kp-title');
      id = $match.data('kp-id');
      $html = $(render(title, $match.text()));
      $html.find('strong').wrap("<a class='kp-title' href='" + (kp_url(id)) + "' target='_blank'>");
      return $match.append($html);
    };

    KpIsEverywhere.prototype.getKeywords = function() {
      var _this = this;

      this.keywords = [];
      return Tabletop.init({
        key: public_spreadsheet_url,
        simpleSheet: true,
        callback: function(rows) {
          var keyword, keywordObj, keywords, row, _i, _j, _len, _len1;

          for (_i = 0, _len = rows.length; _i < _len; _i++) {
            row = rows[_i];
            if (!row.keywords) {
              continue;
            }
            keywords = row.keywords.split('、');
            for (_j = 0, _len1 = keywords.length; _j < _len1; _j++) {
              keyword = keywords[_j];
              keywordObj = {
                title: row.title.replace(/(^(\D)+\d+-)/, ''),
                text: keyword,
                id: row.id
              };
              _this.keywords.push(keywordObj);
            }
          }
          return _this.findAllKeywords();
        }
      });
    };

    KpIsEverywhere.prototype.findAllKeywords = function() {
      return this._findAllKeywordsInScopes();
    };

    KpIsEverywhere.prototype._findAllKeywordsInScopes = function() {
      var $scope, keyword, _i, _len, _ref;

      $scope = this.scopes.shift();
      xx("" + this.scopes.length);
      _ref = this.keywords;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        keyword = _ref[_i];
        this._findOneKeywordInOneScope(keyword, $scope);
      }
      if (!this.scopes.length) {
        return;
      }
      return setTimeout(this._findAllKeywordsInScopes, 100);
    };

    KpIsEverywhere.prototype._findOneKeywordInOneScope = function(keyword, $scope) {
      var notFound, text,
        _this = this;

      text = $scope.text();
      if (!text || !keyword) {
        return;
      }
      notFound = text.indexOf(keyword.text) < 0;
      if (notFound) {
        return;
      }
      this.unobserve();
      xx("found " + keyword.text);
      $scope.highlight(keyword.text, {
        classname: 'kp-highlight',
        tag: 'div',
        ignoreClass: ignoreClass
      }, function(div) {
        return $(div).attr({
          'data-kp-id': keyword.id,
          'data-kp-title': keyword.title
        });
      });
      return this.observe();
    };

    return KpIsEverywhere;

  })();

  $.fn.kpkey = function() {
    $(this).each(function(i, scope) {
      var $scope, kpkey;

      $scope = $(scope);
      if (!$scope.data('kpkey')) {
        kpkey = new KpIsEverywhere({
          scope: $scope
        });
        return $scope.data('kpkey', kpkey);
      }
    });
    return this;
  };

}).call(this);
