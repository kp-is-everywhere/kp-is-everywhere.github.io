(function() {
  var DEBUG, KpIsEverywhere, getTemplate, image_url, key, kp_url, public_spreadsheet_url, templates, throttle, xx,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  key = '1TIhYo4RpGu7FGr0XZRIkVVx7E9kUzceXsNI8xPmDG9E';

  public_spreadsheet_url = "https://docs.google.com/spreadsheet/pub?hl=en_US&hl=en_US&key=" + key + "&output=html";

  kp_url = function(id) {
    return "http://kptaipei.tw/?page_id=" + id;
  };

  image_url = chrome.extension && chrome.extension.getURL('images/kp.jpg') || '/images/kp.jpg';

  DEBUG = false;

  xx = function(t) {
    return DEBUG && console.log(t);
  };

  templates = ["先別管這個了，你聽過我提出的<strong>{{title}}</strong>嗎？？", "我覺得你可以幫我看看<strong>{{title}}</strong>這個政見怎麼樣？", "關於{{keyword}}，我的想法是<strong>{{title}}</strong>", "說到{{keyword}}，你聽過<strong>{{title}}</strong>嗎？"];

  getTemplate = function(title, keyword) {
    var template;

    template = templates[Math.floor(Math.random() * templates.length)];
    template = template.replace('{{title}}', title);
    template = template.replace('{{keyword}}', keyword);
    return "<div class='kp-wrapper'>\n  <div class='kp-container'>\n    <img class='kp-avatar' src=\"" + image_url + "\" alt=\"柯 P 關心您\">\n    <p class='kp-text'>" + template + "</p>\n  </div>\n</div>";
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
      this.findAll = __bind(this.findAll, this);
      this.addLink = __bind(this.addLink, this);      this.prepare();
      this.load();
      this.bind();
    }

    KpIsEverywhere.prototype.prepare = function() {
      return this.body = $('body');
    };

    KpIsEverywhere.prototype.bind = function() {
      var MutationObserver, config, mutationObserver, target,
        _this = this;

      this.body.on('mouseover', '.kp-highlight', this.addLink);
      /*
        thanks g0v news helper!
        https://github.com/g0v/newshelper-extension
      */

      MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
      target = document;
      config = {
        attributes: true,
        childList: true,
        characterData: true,
        subtree: true
      };
      mutationObserver = new MutationObserver(function(mutations) {
        var hasNewNode;

        hasNewNode = false;
        mutations.forEach(function(mutation, idx) {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0 && !$(mutation.addedNodes).hasClass('kp-wrapper')) {
            return hasNewNode = true;
          }
        });
        if (!hasNewNode) {
          return;
        }
        return throttle(function() {
          _this.findAll();
          return xx('findall');
        }, 1000);
      });
      return mutationObserver.observe(target, config);
    };

    KpIsEverywhere.prototype.addLink = function(e) {
      var $html, $match, id, pos, title;

      $match = $(e.currentTarget);
      if (!$match.data('kp-link-enabled')) {
        $match.data('kp-link-enabled', true);
        title = $match.data('kp-title');
        id = $match.data('kp-id');
        $html = $(getTemplate(title, $match.text()));
        $html.find('strong').wrap("<a class='kp-title' href='" + (kp_url(id)) + "' target='_blank'>");
        $match.append($html);
      }
      if ($(e.target).hasClass('kp-highlight')) {
        pos = $match[0].getBoundingClientRect();
        return $match.find('.kp-wrapper').css({
          left: pos.left,
          top: pos.top
        });
      }
    };

    KpIsEverywhere.prototype.load = function() {
      var _this = this;

      return Tabletop.init({
        key: public_spreadsheet_url,
        simpleSheet: true,
        callback: function(rows) {
          var row, _i, _len;

          xx(rows);
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
          return _this.findAll();
        }
      });
    };

    KpIsEverywhere.prototype.findAll = function() {
      var keyword, row, _i, _len, _ref, _results;

      xx('搜尋中');
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
            _results1.push(this._find(keyword, row));
          }
          return _results1;
        }).call(this));
      }
      return _results;
    };

    KpIsEverywhere.prototype._find = function(keyword, row) {
      var html, notFound;

      html = this.body.html();
      notFound = html.indexOf(keyword) < 0;
      if (notFound) {
        return;
      }
      xx("發現關鍵字：" + keyword);
      return this.body.highlight(keyword, {
        classname: 'kp-highlight',
        tag: 'div',
        ignore: 'kp-wrapper'
      }, function(div) {
        return $(div).attr({
          'data-kp-id': row.id,
          'data-kp-title': row.title
        });
      });
    };

    return KpIsEverywhere;

  })();

  window.KpIsEverywhere = KpIsEverywhere;

}).call(this);
