import $ from 'jquery';

/**
 * simple replacement for jquery("<div>") e.g.
 *
 * @param domstring
 * @returns {*|Node|exports.TreeWalkerImpl.firstChild|null}
 */
export
const create = (domstring) => {
  if (domstring == null) throw new Error('needs param');
  let html = new DOMParser().parseFromString(domstring, 'text/html');
  return html.body.firstChild;
};

// TODO refactor into nk-window class and wait for appendCallback
export
function setCenter (el) {
  var child = $(el);
  var parent = $(el.parentElement);
  child.css('position', 'absolute');
  child.css('top', ((parent.height() - child.outerHeight()) / 2) + parent.scrollTop() + 'px');
  child.css('left', ((parent.width() - child.outerWidth()) / 2) + parent.scrollLeft() + 'px');
}

export function appendStyle (css) {
  var head = document.head || document.getElementsByTagName('head')[0],
    style = document.createElement('style');

  style.type = 'text/css';
  if (style.styleSheet) {
    style.styleSheet.cssText = css;
  } else {
    style.appendChild(document.createTextNode(css));
  }

  head.appendChild(style);
}