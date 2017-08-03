'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _jsdom = require('jsdom');

var _jsdom2 = _interopRequireDefault(_jsdom);

var _server = require('react-dom/server');

var _server2 = _interopRequireDefault(_server);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* Wraps a jsdom call and returns the full page */

exports.default = function (protocol, host, path, delay) {
  return new Promise(function (resolve, reject) {
    var render_called = false;
    _jsdom2.default.env({
      url: protocol + '//' + host + path,
      headers: { Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8" },
      resourceLoader: function resourceLoader(resource, callback) {
        if (resource.url.host === host) {
          resource.defaultFetch(callback);
        } else {
          callback();
        }
      },

      features: {
        FetchExternalResources: ["script"],
        ProcessExternalResources: ["script"],
        SkipExternalResources: false
      },
      virtualConsole: _jsdom2.default.createVirtualConsole().sendTo(console),
      created: function created(err, window) {
        if (err) reject(err);
        window.react_snapshot_render = function (element, state, rootComponent) {
          render_called = { element: element, state: state, rootComponent: rootComponent };
        };
      },
      done: function done(err, window) {
        if (!render_called) {
          return reject("'render' from react-snapshot was never called. Did you replace the call to ReactDOM.render()?");
        }

        var _render_called = render_called,
            element = _render_called.element,
            state = _render_called.state,
            rootComponent = _render_called.rootComponent;


        var next = function next() {
          var shift = state.requests.shift();
          return shift && shift.then(next);
        };
        /* Wait a short while, then wait for all requests, then serialise */
        new Promise(function (res) {
          return setTimeout(res, delay);
        }).then(next).then(function () {
          // This approach is really difficult to get working reliably

          //Array.from(element.querySelectorAll('*')).forEach(el => {
          //  const instance_key = Object.keys(el).find(k => k.startsWith('__reactInternalInstance'))
          //  if (instance_key) el.setAttribute('data-reactid', el[instance_key]._domID)
          //  if (el.hasChildNodes()) {
          //    for (let i = 0; i < el.childNodes.length; i++) {
          //      const tn = el.childNodes[i]
          //      if (tn.nodeType === TEXT_NODE) tn.data = escapeTextContentForBrowser(tn.textContent)
          //    }
          //  }
          //})
          //

          //const markup = element.innerHTML
          //console.log(adler32(markup))
          //console.log(markup)
          //element.innerHTML = ReactMarkupChecksum.addChecksumToMarkup(markup)

          // This approach is much more reliable but is it too confusing??
          state.count = 0;
          element.innerHTML = _server2.default.renderToString(rootComponent);

          window.document.body.insertAdjacentHTML('afterBegin', '\n              <script>window.react_snapshot_state = ' + JSON.stringify(state.data) + ';</script>\n            ');
          resolve(window);
        });
      }
    });
  });
};
//import * as ReactMarkupChecksum from 'react-dom/lib/ReactMarkupChecksum'
//import escapeTextContentForBrowser from 'react-dom/lib/escapeTextContentForBrowser'
//import adler32 from 'react-dom/lib/adler32'
//const TEXT_NODE = 3


module.exports = exports['default'];