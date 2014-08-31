jQuery.fn.highlight = function(pat, options, callback) {
  tag = options && options.tag || 'span';
  classname = options && options.classname || 'highlight';
  ignoreClass = options && options.ignoreClass;
  function innerHighlight(node, pat) {
    var skip = 0;
    if (node.nodeType == 3) {
      if(!node.parentNode) return;
      var pos = node.data.toUpperCase().indexOf(pat);
      if (pos >= 0) {
        if(new RegExp(ignoreClass).test(node.parentNode.classList)) return;
        var spannode = document.createElement(tag);
        spannode.className = classname;
        var middlebit = node.splitText(pos);
        var endbit = middlebit.splitText(pat.length);
        var middleclone = middlebit.cloneNode(true);
        spannode.appendChild(middleclone);
        middlebit.parentNode.replaceChild(spannode, middlebit);
        if(callback) callback(spannode)
        skip = 1;
      }
    } else if (node.nodeType == 1 && node.childNodes && !/(script|style|textarea)/i.test(node.tagName) && !(new RegExp(ignoreClass).test(node.classList))) {
      // if(!node.parentNode) return;
      for (var i = 0; i < node.childNodes.length; ++i) {
        i += innerHighlight(node.childNodes[i], pat);
      }
    }
    return skip;
  }
  return this.length && pat && pat.length ? this.each(function() {
    innerHighlight(this, pat.toUpperCase());
  }) : this;
};

jQuery.fn.removeHighlight = function(classname) {
  return this.find(classname ? "span." + classname : "span.highlight").each(function() {
    this.parentNode.firstChild.nodeName;
    with(this.parentNode) {
      replaceChild(this.firstChild, this);
      normalize();
    }
  }).end();
};
