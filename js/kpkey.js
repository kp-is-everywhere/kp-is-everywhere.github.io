(function() {
  var DEBUG, KpIsEverywhere, MutationObserver, googleKey, ignoreClass, image_url, kp_url, public_spreadsheet_url, render, templates, throttle, xx,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  DEBUG = false;

  DEBUG = true;

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
      this.findAllKeywords = __bind(this.findAllKeywords, this);
      this.mousein = __bind(this.mousein, this);
      this._bindMutation = __bind(this._bindMutation, this);      this.scope = options && options.scope || $('body');
      this.observe = options && options.scope[0] || document;
      this.getKeywords();
      this.bind();
    }

    KpIsEverywhere.prototype.bind = function() {
      this.scope.on('mouseover', '.kp-highlight', this.mousein);
      return setTimeout(this._bindMutation, 3000);
    };

    KpIsEverywhere.prototype._bindMutation = function() {
      /*
        thanks g0v news helper!
        https://github.com/g0v/newshelper-extension
      */

      var config, target,
        _this = this;

      target = this.observe;
      config = {
        attributes: false,
        characterData: false,
        childList: true,
        subtree: true
      };
      this.mutationObserver = new MutationObserver(function(mutations) {
        var $addedPrev, hasNewNode, mutation, _i, _len;

        _this.scopes = [];
        hasNewNode = false;
        for (_i = 0, _len = mutations.length; _i < _len; _i++) {
          mutation = mutations[_i];
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0 && !(new RegExp(ignoreClass).test(mutation.target.classList))) {
            $addedPrev = $(mutation.previousSibling);
            _this.scopes.push($addedPrev);
            hasNewNode = true;
          }
        }
        if (!hasNewNode) {
          return;
        }
        _this.scopeChanged = true;
        return throttle(_this.findAllKeywords, 1000);
      });
      return this.mutationObserver.observe(target, config);
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

      return Tabletop.init({
        key: public_spreadsheet_url,
        simpleSheet: true,
        callback: function(rows) {
          var row, _i, _len;

          _this.rows = [];
          for (_i = 0, _len = rows.length; _i < _len; _i++) {
            row = rows[_i];
            if (!row.keywords) {
              continue;
            }
            row = {
              title: row.title.replace(/(^(\D)+\d+-)/, ''),
              keywords: row.keywords.split('、'),
              id: row.id
            };
            _this.rows.push(row);
          }
          return _this.findAllKeywords();
        }
      });
    };

    KpIsEverywhere.prototype.findAllKeywords = function() {
      var keyword, row, _i, _len, _ref, _results;

      _ref = this.rows;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        row = _ref[_i];
        _results.push((function() {
          var _j, _len1, _ref1, _results1;

          _ref1 = row.keywords;
          _results1 = [];
          for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
            keyword = _ref1[_j];
            _results1.push(this._findOneKeyword(keyword, row));
          }
          return _results1;
        }).call(this));
      }
      return _results;
    };

    KpIsEverywhere.prototype._findOneKeyword = function(keyword, row) {
      var $scope, _i, _len, _ref;

      if (this.scopes != null) {
        _ref = this.scopes;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          $scope = _ref[_i];
          this._findOneKeywordInScope(keyword, row, $scope.next());
        }
        return this.scopes = null;
      } else {
        return this._findOneKeywordInScope(keyword, row, this.scope);
      }
    };

    KpIsEverywhere.prototype._findOneKeywordInScope = function(keyword, row, scope) {
      var html, notFound;

      html = scope.html();
      if (!html) {
        return;
      }
      notFound = html.indexOf(keyword) < 0;
      if (notFound) {
        return;
      }
      return scope.highlight(keyword, {
        classname: 'kp-highlight',
        tag: 'div',
        ignoreClass: ignoreClass
      }, function(div) {
        return $(div).attr({
          'data-kp-id': row.id,
          'data-kp-title': row.title
        });
      });
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
