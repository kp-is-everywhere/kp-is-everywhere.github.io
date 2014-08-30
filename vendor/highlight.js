jQuery.fn.highlight = function(pat, options, callback) {
    tag = options && options.tag || 'span';
    classname = options && options.classname || 'highlight';
    ignore = options && options.ignore;
    function innerHighlight(node, pat) {
        var skip = 0;
        if (node.nodeType == 3) {
            var pos = node.data.toUpperCase().indexOf(pat);
            if (pos >= 0) {
                if( $(node.parentNode).hasClass(classname) ) return;
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
        } else if (node.nodeType == 1 && node.childNodes && !/(script|style)/i.test(node.tagName) && !(new RegExp(ignore).test(node.classList))) {
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
