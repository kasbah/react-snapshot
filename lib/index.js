'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Snapshot = exports.snapshot = exports.render = exports.IS_REACT_SNAPSHOT = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactDom = require('react-dom');

var _reactDom2 = _interopRequireDefault(_reactDom);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var IS_REACT_SNAPSHOT = exports.IS_REACT_SNAPSHOT = navigator.userAgent.match(/Node\.js/i) && window && window.react_snapshot_render;

var state = {
  requests: [],
  data: window.react_snapshot_state || {},
  count: 0
};

var render = exports.render = function render(rootComponent, domElement) {
  window.rootComponent = rootComponent;
  _reactDom2.default.render(rootComponent, domElement);
  if (IS_REACT_SNAPSHOT) {
    window.react_snapshot_render(domElement, state, rootComponent);
  }
};

var _snapshot = function _snapshot(func, repeat) {
  var i = state.count++;
  var existing = state.data[i];
  if (existing) {
    var success = existing.success,
        failure = existing.failure;
    /* This mimics a Promise API but is entirely synchronous */

    return {
      then: function then(resolve, reject) {
        if (typeof success !== 'undefined') resolve(success);else if (!repeat && reject && typeof failure !== 'undefined') reject(failure);
        if (repeat) func().then(resolve, reject);
      },
      catch: function _catch(reject) {
        if (!repeat && typeof failure !== 'undefined') reject(success);
        if (repeat) func().catch(reject);
      }
    };
  } else {
    if (!IS_REACT_SNAPSHOT) return func();
    var promise = func().then(function (success) {
      state.data[i] = { success: success };
      return success;
    }, function (failure) {
      state.data[i] = { failure: failure };
      return Promise.reject(failure);
    });
    state.requests.push(promise);
    return promise;
  }
};
var snapshot = exports.snapshot = function snapshot(func) {
  return _snapshot(func, false);
};
snapshot.repeat = function (func) {
  return _snapshot(func, true);
};

var _Snapshot = function _Snapshot(prop_defs, repeat_on_client) {
  var prop_names = Object.keys(prop_defs);
  if ((typeof prop_defs === 'undefined' ? 'undefined' : _typeof(prop_defs)) !== "object" || prop_names.some(function (k) {
    return typeof prop_defs[k] !== 'function';
  })) throw new Error("Snapshot requires an object of type { propName: () => Promise }.");
  console.log(prop_defs);

  var hoc = function hoc(Component, render_without_data) {
    var SnapshotComponent = function (_React$Component) {
      _inherits(SnapshotComponent, _React$Component);

      function SnapshotComponent() {
        _classCallCheck(this, SnapshotComponent);

        var _this = _possibleConstructorReturn(this, (SnapshotComponent.__proto__ || Object.getPrototypeOf(SnapshotComponent)).call(this));

        _this.state = { loaded_all: false, async_props: null };
        return _this;
      }

      _createClass(SnapshotComponent, [{
        key: 'componentWillMount',
        value: function componentWillMount() {
          var _this2 = this;

          _snapshot(function () {
            return Promise.all(prop_names.map(function (prop_name) {
              return prop_defs[prop_name](_this2.props);
            }));
          }, repeat_on_client).then(function (responses) {
            var new_state = {};
            prop_names.forEach(function (prop_name, i) {
              return new_state[prop_name] = responses[i];
            });
            _this2.setState({ async_props: new_state, loaded_all: true });
          });
        }
      }, {
        key: 'render',
        value: function render() {
          if (!this.state.loaded_all && !render_without_data) return null;
          var props = Object.assign({}, this.props, this.state.async_props);
          return _react2.default.createElement(Component, props);
        }
      }]);

      return SnapshotComponent;
    }(_react2.default.Component);

    SnapshotComponent.displayName = 'Snapshot(' + (Component.displayName || Component.name) + ')';
    return SnapshotComponent;
  };
  return {
    thenRender: function thenRender(Component) {
      return hoc(Component, false);
    },
    rendering: function rendering(Component) {
      return hoc(Component, true);
    }
  };
};

var Snapshot = exports.Snapshot = function Snapshot(prop_defs) {
  return _Snapshot(prop_defs, false);
};
Snapshot.repeat = function (prop_defs) {
  return _Snapshot(prop_defs, true);
};