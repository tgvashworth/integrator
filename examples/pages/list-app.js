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
        var item = document.createElement('li');
        item.textContent = Create.el.text.value;
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
