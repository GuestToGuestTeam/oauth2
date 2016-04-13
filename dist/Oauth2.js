'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _jsCookie = require('js-cookie');

var _jsCookie2 = _interopRequireDefault(_jsCookie);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Oauth2 = function () {
    function Oauth2() {
        _classCallCheck(this, Oauth2);
    }

    _createClass(Oauth2, null, [{
        key: 'configure',
        value: function configure(options) {
            Oauth2.options = Object.assign(Oauth2.options, options);
        }
    }, {
        key: 'request',
        value: function request(url, options) {
            // no token, authenticate user before execute query
            if (!Oauth2.getAccessToken()) {
                return new Promise(function (resolve, reject) {
                    Oauth2.auth().then(function (request) {
                        // execute query
                        Oauth2.executeQuery(url, options).then(function (request) {
                            resolve(request);
                        }, function (request) {
                            reject(request);
                        });
                    }, function (request) {
                        reject(request);
                    });
                });
            }

            return new Promise(function (resolve, reject) {
                Oauth2.executeQuery(url, options).then(function (request) {
                    resolve(request);
                }, function (request) {
                    if (request.status == 401) {
                        Oauth2.refreshToken().then(function (request) {
                            // re-execute query
                            Oauth2.executeQuery(url, options).then(function (request) {
                                resolve(request);
                            }, function (request) {
                                reject(request);
                            });
                        }, function (request) {
                            reject(request);
                        });
                    } else {
                        reject(request);
                    }
                });
            });
        }
    }, {
        key: 'executeQuery',
        value: function executeQuery(url) {
            var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

            options = Object.assign({}, options, {
                headers: Object.assign({}, options.headers, {
                    'Authorization': 'Bearer ' + Oauth2.getAccessToken()
                })
            });
            return Oauth2.fetch(url, options);
        }
    }, {
        key: 'auth',
        value: function auth() {
            return Oauth2.fetch(Oauth2.options.tokenUri, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: {
                    client_id: Oauth2.options.client_id,
                    client_secret: Oauth2.options.client_secret,
                    grant_type: 'password',
                    username: Oauth2.options.username,
                    password: Oauth2.options.password
                }
            }).then(function (request) {
                var response = JSON.parse(request.responseText);
                // set access_token and refresh_token
                Oauth2.setAccessToken(response.access_token);
                Oauth2.setRefreshToken(response.refresh_token);
                return request;
            });
        }
    }, {
        key: 'refreshToken',
        value: function refreshToken() {
            return Oauth2.fetch(Oauth2.options.tokenUri, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: {
                    client_id: Oauth2.options.client_id,
                    client_secret: Oauth2.options.client_secret,
                    grant_type: 'refresh_token',
                    refresh_token: Oauth2.getRefreshToken()
                }
            }).then(function (request) {
                var response = JSON.parse(request.responseText);
                // update access_token and refresh_token
                Oauth2.setAccessToken(response.access_token);
                Oauth2.setRefreshToken(response.refresh_token);
                return request;
            });
        }
    }, {
        key: 'fetch',
        value: function fetch(url) {
            var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

            options = Object.assign({
                method: 'GET',
                headers: {},
                body: null
            }, options);

            return new Promise(function (resolve, reject) {
                var request = new XMLHttpRequest();
                request.open(options.method, url, true);
                for (var header in options.headers) {
                    request.setRequestHeader(header, options.headers[header]);
                }
                request.onreadystatechange = function () {
                    if (request.readyState == 4) {
                        if (request.responseHeaders && request.responseHeaders['Content-Type'] && request.responseHeaders['Content-Type'] === 'application/json') {
                            request.responseJSON = JSON.parse(request.responseText);
                        }
                        if (request.status == 200) {
                            resolve(request);
                        } else {
                            reject(request);
                        }
                    }
                };
                if (options.body) {
                    request.send(JSON.stringify(options.body));
                } else {
                    request.send(null);
                }
            });
        }
    }, {
        key: 'getAccessToken',
        value: function getAccessToken() {
            return _jsCookie2.default.get('access_token');
        }
    }, {
        key: 'setAccessToken',
        value: function setAccessToken(token) {
            return _jsCookie2.default.set('access_token', token);
        }
    }, {
        key: 'getRefreshToken',
        value: function getRefreshToken() {
            return _jsCookie2.default.get('refresh_token');
        }
    }, {
        key: 'setRefreshToken',
        value: function setRefreshToken(token) {
            _jsCookie2.default.set('refresh_token', token);
        }
    }, {
        key: 'clearToken',
        value: function clearToken() {
            _jsCookie2.default.remove('access_token');
            _jsCookie2.default.remove('refresh_token');
        }
    }]);

    return Oauth2;
}();

Oauth2.options = {
    tokenUri: '/token',
    client_id: null,
    client_secret: null,
    username: null,
    password: null
};
exports.default = Oauth2;