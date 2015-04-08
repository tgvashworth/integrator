var dom = {};

dom.make = function make(type) {
  var attrs = arguments[1] === undefined ? [] : arguments[1];
  var children = arguments[2] === undefined ? [] : arguments[2];

  var elem = document.createElement(type);
  attrs.forEach(function (attr) {
    var res = attr(elem);
    elem.setAttribute(res.k, res.v);
  });
  children.forEach(function (child) {
    elem.appendChild(child);
  });
  return elem;
};

dom.text = document.createTextNode.bind(document);

dom.attr = function attr(k, v) {
  return function (elem) {
    return { k: k, v: v };
  };
};

dom.attr.class = function (spec) {
  return function () {
    return Object.keys(spec).filter(function (k) {
      return spec[k];
    }).reduce(function (memo, k) {
      memo.v = memo.v + ' ' + k;
      return memo.trim();
    }, { k: 'class', v: '' });
  };
};


var Create = {
    el: {}
};
var List = {
    el: {}
};

var App = {
    init: function () {
        Create.el = {
            submit: document.querySelector('.Create-submit'),
            text: document.querySelector('.Create-text')
        };

        List.el = {
            list: document.querySelector('.List-list')
        };

        Create.el.submit.addEventListener('click', App.new);
        Create.el.text.addEventListener('keypress', App.keypress);
    },

    new: function () {
        if (!Create.el.text.value) { return; }

        var item = dom.make('li', [], [
            dom.text(Create.el.text.value),
            dom.make('button', [ dom.attr.class({ 'List-item-remove': true }) ], [
                dom.text('x')
            ])
        ]);

        List.el.list.appendChild(item);
        Create.el.text.value = '';
        Create.el.text.focus();
    },

    keypress: function (e) {
        if (e.keyCode === 13) {
            App.new();
        }
    }
};

document.addEventListener('DOMContentLoaded', App.init);
