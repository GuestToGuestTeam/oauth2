import { assert } from 'chai';
import sinon from 'sinon';
import Oauth2 from '../src/Oauth2';

before(() => {
    Oauth2.configure({
        tokenUri: '/oauth/v2/token',
        client_id: 'azerty',
        client_secret: 'abc123',
        username: 'john@mail.com',
        password: '123456'
    });
});

describe('Configuration', () => {

    it('should return configuration', () => {
        assert.deepEqual(Oauth2.options, {
            tokenUri: '/oauth/v2/token',
            client_id: 'azerty',
            client_secret: 'abc123',
            username: 'john@mail.com',
            password: '123456'
        });
    });

});

describe('AccessToken', () => {
    it('should return null', () => {
        assert.equal(null, Oauth2.getAccessToken());
    });
    it('should store access_token', () => {
        Oauth2.setAccessToken('this_is_an_access_token');
        assert.equal('this_is_an_access_token', Oauth2.getAccessToken());
    });
});

describe('RefreshToken', () => {
    it('should return null', () => {
        assert.equal(null, Oauth2.getRefreshToken());
    });
    it('should store refresh_token', () => {
        Oauth2.setRefreshToken('this_is_a_refresh_token');
        assert.equal('this_is_a_refresh_token', Oauth2.getRefreshToken());
    });
});

describe('Clear tokens', () => {

    before(() => {
        Oauth2.setAccessToken('this_is_an_access_token');
        Oauth2.setRefreshToken('this_is_a_refresh_token');
    });

    it('should return null', () => {
        Oauth2.clearToken();
        assert.equal(null, Oauth2.getAccessToken());
        assert.equal(null, Oauth2.getRefreshToken());
    });
});

describe('Oauth2', () => {

    var server;

    beforeEach(() => {
        server = sinon.fakeServer.create();
        server.autoRespond = true;

        server.respondWith('POST', /oauth\/v2\/token/, (xhr) => {
            let requestBody = JSON.parse(xhr.requestBody);
            assert.property(requestBody, 'client_id');
            assert.property(requestBody, 'client_secret');
            assert.property(requestBody, 'grant_type');
            if (requestBody.grant_type === 'password') {
                assert.property(requestBody, 'username');
                assert.property(requestBody, 'password');
                xhr.respond(200, { "Content-Type": "application/json" }, JSON.stringify({ access_token: "this_is_an_access_token", refresh_token: "this_is_a_refresh_token" }));
            }
            else if (requestBody.grant_type === 'refresh_token') {
                assert.property(requestBody, 'refresh_token');
                xhr.respond(200, { "Content-Type": "application/json" }, JSON.stringify({ access_token: "this_is_a_new_access_token", refresh_token: "this_is_a_new_refresh_token" }));
            }
            else {
                throw new Error('Unknow grant_type.');
            }
        });
    });

    afterEach(() => {
        server.restore();
    });

    describe('fetch()', () => {

        it('should submit GET request', (done) => {
            server.respondWith('GET', '/get', 'FooBarBaz!');
            Oauth2.fetch('/get').then((request) => {
                assert.equal(request.responseText, 'FooBarBaz!');
                done();
            });
            server.respond();
        });

        it('should submit POST request', (done) => {
            server.respondWith('POST', '/post', [
                201, { "Content-Type": "application/json" }, JSON.stringify({ foo: "bar" })
            ]);

            Oauth2.fetch('/post', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: {
                    foo: 'bar',
                }
            })
            .then((request) => {
                assert.equal(201, request.status);
                assert.isObject(request.responseJSON);
                assert.propertyVal(request.responseJSON, 'foo', 'bar');
                done();
            });

            server.respond();
        });

        it('should fail with 500 error status', (done) => {
            server.respondWith('GET', '/error', [500, {}, 'Internal Server Error']);
            Oauth2.fetch('/error')
                .then(
                    (request) => {
                        done(new Error('Should not be reached'));
                    },
                    (request) => {
                        try {
                            assert.equal(500, request.status);
                            done();
                        } catch (e) {
                            done(e);
                        }
                    }
                );
            server.respond();
        });

    });

    describe('executeQuery()', () => {

        before(() => {
            Oauth2.setAccessToken('this_is_an_access_token');
            Oauth2.setRefreshToken('this_is_a_refresh_token');
        });

        it('should set Authorization header and execute request', (done) => {
            server.respondWith('GET', '/fetch', 'plop');
            Oauth2.executeQuery('/fetch').then((request) => {
                try {
                    assert.propertyVal(request.requestHeaders, 'Authorization', 'Bearer this_is_an_access_token');
                    done();
                } catch (e) {
                    done(e);
                }
            });
            server.respond();
        });

    });

    describe('auth()', () => {

        it('should return access_token and refresh_token', (done) => {
            Oauth2.auth().then((request) => {
                try {
                    assert.isObject(request.responseJSON);
                    assert.propertyVal(request.responseJSON, 'access_token', 'this_is_an_access_token');
                    assert.propertyVal(request.responseJSON, 'refresh_token', 'this_is_a_refresh_token');
                    done();
                } catch (e) {
                    done(e);
                }
            });

            server.respond();
        });

        it('should fail with 400 error status', (done) => {
            server.respondWith('POST', /oauth\/v2\/token/, [400, {}, 'Bad Request']);

            Oauth2.auth().then(
                (request) => {
                    done(new Error('Should not be reached'));
                },
                (request) => {
                    try {
                        assert.equal(400, request.status);
                        done();
                    } catch (e) {
                        done(e);
                    }
                }
            );

            server.respond();
        });

    });

    describe('refreshToken()', () => {

        before(() => {
            Oauth2.setAccessToken('this_is_an_access_token');
            Oauth2.setRefreshToken('this_is_a_refresh_token');
        });

        it('should return access_token and refresh_token', (done) => {
            Oauth2.refreshToken().then((request) => {
                try {
                    assert.isObject(request.responseJSON);
                    assert.propertyVal(request.responseJSON, 'access_token', 'this_is_a_new_access_token');
                    assert.propertyVal(request.responseJSON, 'refresh_token', 'this_is_a_new_refresh_token');
                    assert.equal('this_is_a_new_access_token', Oauth2.getAccessToken());
                    assert.equal('this_is_a_new_refresh_token', Oauth2.getRefreshToken());
                    done();
                } catch (e) {
                    done(e);
                }
            });

            server.respond();
        });

        it('should fail with 400 error status', (done) => {
            server.respondWith('POST', /oauth\/v2\/token/, [400, {}, 'Bad Request']);

            Oauth2.refreshToken().then(
                (request) => {
                    done(new Error('Should not be reached'));
                },
                (request) => {
                    try {
                        assert.equal(400, request.status);
                        done();
                    } catch (e) {
                        done(e);
                    }
                }
            );

            server.respond();
        });

    });

    describe('request()', () => {

        it('should get access_token before execute request', (done) => {
            server.respondWith('GET', '/fetch', 'Success!');

            Oauth2.clearToken();

            Oauth2.request('/fetch').then((request) => {
                try {
                    assert.propertyVal(request.requestHeaders, 'Authorization', 'Bearer this_is_an_access_token');
                    assert.equal(request.responseText, 'Success!');
                    done();
                } catch (e) {
                    done(e);
                }
            }).catch(done);

            server.respond();
        });

        it('should execute request with token already defined', (done) => {
            server.respondWith('GET', '/fetch', 'Success!');

            Oauth2.setAccessToken('this_is_an_access_token');
            Oauth2.setRefreshToken('this_is_a_refresh_token');

            Oauth2.request('/fetch').then((request) => {
                try {
                    assert.propertyVal(request.requestHeaders, 'Authorization', 'Bearer this_is_an_access_token');
                    assert.equal(request.responseText, 'Success!');
                    assert.equal('this_is_an_access_token', Oauth2.getAccessToken());
                    assert.equal('this_is_a_refresh_token', Oauth2.getRefreshToken());
                    done();
                } catch (e) {
                    done(e);
                }
            });

            server.respond();
        });

        it('should refresh token before execute request', (done) => {
            let count = 0;
            server.respondWith('GET', '/fetch', (xhr) => {
                count++;
                if (count < 2) {
                    xhr.respond(401, {}, 'Unauthorised');
                } else {
                    xhr.respond(200, {}, 'Success!');
                }

            });

            Oauth2.setAccessToken('this_is_an_access_token');
            Oauth2.setRefreshToken('this_is_a_refresh_token');

            Oauth2.request('/fetch').then((request) => {
                try {
                    assert.propertyVal(request.requestHeaders, 'Authorization', 'Bearer this_is_a_new_access_token');
                    assert.equal(request.responseText, 'Success!');
                    assert.equal('this_is_a_new_access_token', Oauth2.getAccessToken());
                    assert.equal('this_is_a_new_refresh_token', Oauth2.getRefreshToken());
                    done();
                } catch (e) {
                    done(e);
                }
            });

            server.respond();
        });

        it('should fail with 401 error status', (done) => {
            server.respondWith('GET', '/fetch', [401, {}, 'Unauthorized']);

            Oauth2.setAccessToken('this_is_an_access_token');
            Oauth2.setRefreshToken('this_is_a_refresh_token');

            Oauth2.request('/fetch').then(
                (request) => {
                    done(new Error('Should not be reached'));
                },
                (request) => {
                    try {
                        assert.equal(401, request.status);
                        done();
                    } catch (e) {
                        done(e);
                    }
                }
            );

            server.respond();
        });

        it('should fail with 409 error status', (done) => {
            server.respondWith('GET', '/fetch', [409, {}, 'Conflict']);

            Oauth2.setAccessToken('this_is_an_access_token');
            Oauth2.setRefreshToken('this_is_a_refresh_token');

            Oauth2.request('/fetch').then(
                (request) => {
                    done(new Error('Should not be reached'));
                },
                (request) => {
                    try {
                        assert.equal(409, request.status);
                        done();
                    } catch (e) {
                        done(e);
                    }
                }
            );

            server.respond();
        });

    });

});
