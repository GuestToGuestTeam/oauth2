import 'babel-polyfill';
import Cookies from 'js-cookie';

export default class Oauth2 {

    static options = {
        tokenUri: '/token',
        client_id: null,
        client_secret: null,
        username: null,
        password: null
    };

    static configure(options) {
        Oauth2.options = Object.assign(Oauth2.options, options);
    }

    static request(url, options) {
        // no token, authenticate user before execute query
        if (!Oauth2.getAccessToken()) {
            return new Promise(function (resolve, reject) {
                Oauth2.auth().then(
                    function (request) {
                        // execute query
                        Oauth2.executeQuery(url, options).then(
                            function (request) {
                                resolve(request);
                            },
                            function (request) {
                                reject(request);
                            }
                        );
                    },
                    function (request) {
                        sweetAlert('API connection failed', request.responseJSON.error_description, 'error');
                        reject(request);
                    }
                );
            });
        }

        return new Promise(function (resolve, reject) {
            Oauth2.executeQuery(url, options).then(
                function (request) {
                    resolve(request);
                },
                function (request) {
                    if (request.status == 401) {
                        Oauth2.refreshToken().then(
                            function (request) {
                                // re-execute query
                                Oauth2.executeQuery(url, options).then(
                                    function (request) {
                                        resolve(request);
                                    },
                                    function (request) {
                                        reject(request);
                                    }
                                );
                            },
                            function (request) {
                                console.error(request);
                                sweetAlert('API connection failed', request.responseJSON.error_description, 'error');
                                reject(request);
                            }
                        );
                    } else {
                        reject(error);
                    }
                }
            );
        });
    }

    static executeQuery(url, options = {}) {
        options = Object.assign({}, options, {
            headers: Object.assign({}, options.headers, {
                'Authorization': 'Bearer ' + Oauth2.getAccessToken()
            })
        });
        return Oauth2.fetch(url, options);
    }

    static auth() {
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
        })
        .then((request) => {
            // set access_token and refresh_token
            Oauth2.setAccessToken(request.responseJSON.access_token);
            Oauth2.setRefreshToken(request.responseJSON.refresh_token);
            return request;
        });
    }

    static refreshToken() {
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
        })
        .then((request) => {
            // update access_token and refresh_token
            Oauth2.setAccessToken(request.responseJSON.access_token);
            Oauth2.setRefreshToken(request.responseJSON.refresh_token);
            return request;
        });
    }

    static fetch(url, options = {}) {
        options = Object.assign({
            method: 'GET',
            headers: {},
            body: null
        }, options);

        return new Promise(function (resolve, reject) {
            var request = new XMLHttpRequest();
            request.open(options.method, url, true);
            for (let header in options.headers) {
                request.setRequestHeader(header, options.headers[header]);
            }
            request.onreadystatechange = function () {
                if (request.readyState == 4) {
                    if (request.responseHeaders['Content-Type'] && request.responseHeaders['Content-Type'] === 'application/json') {
                        request.responseJSON = JSON.parse(request.responseText);
                    }
                    if(request.status == 200) {
                        resolve(request);
                    } else {
                        reject(request);
                    }
                }
            }
            if (options.body) {
                request.send(JSON.stringify(options.body));
            } else {
                request.send(null);
            }
        });
    }

    static getAccessToken() {
        return Cookies.get('access_token');
    }

    static setAccessToken(token) {
        return Cookies.set('access_token', token);
    }

    static getRefreshToken() {
        return Cookies.get('refresh_token');
    }

    static setRefreshToken(token) {
        Cookies.set('refresh_token', token);
    }

    static clearToken() {
        Cookies.remove('access_token');
        Cookies.remove('refresh_token');
    }

}
