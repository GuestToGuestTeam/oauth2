Oauth2 library for resource owner password credentials
======================================================

## Configure Oauth2
```
Oauth2.configure({
    tokenUri: '/oauth/v2/token',
    client_id: 's6BhdRkqt3',
    client_secret: '7Fjfp0ZBr1KtDRbnfVdmIw',
    username: 'john@mail.com',
    password: '123456'
});
```

## Request ressource
```
Oauth2.request('/users').then(function (request) {
    console.log(request.responseJSON);
});
```

## Workflow diagram
```
+----------------+                                                                              +----------------+
|                |                                  GET /users                                  |                |
|     CLIENT     |  +------------------------------------------------------------------------>  |     SERVER     |
|                |                            HTTP 401 Unauthorized                             |                |
|                |  <------------------------------------------------------------------------+  |                |
|                |                                                                              |                |
|                |                        POST /token (with credentials)                        |                |
|                |  +------------------------------------------------------------------------>  |                |
|                |                 HTTP 200 with access_token and refresh_token                 |                |
|                |  <------------------------------------------------------------------------+  |                |
|                |                                                                              |                |
|                |         GET /users (with header Authorization: Bearer [access_token])        |                |
|                |  +------------------------------------------------------------------------>  |                |
|                |                                   HTTP 200                                   |                |
|                |  <------------------------------------------------------------------------+  |                |
|                |                                                                              |                |
|                |         GET /users (with header Authorization: Bearer [access_token])        |                |
|                |  +------------------------------------------------------------------------>  |                |
|                |                 HTTP 401 Unauthorized (access_token expired)                 |                |
|                |  <------------------------------------------------------------------------+  |                |
|                |                                                                              |                |
|                |                       POST /token (with refresh_token)                       |                |
|                |  +------------------------------------------------------------------------>  |                |
|                |               HTTP 200 with new access_token and refresh_token               |                |
|                |  <------------------------------------------------------------------------+  |                |
|                |                                                                              |                |
|                |         GET /users (with header Authorization: Bearer [access_token])        |                |
|                |  +------------------------------------------------------------------------>  |                |
|                |                                   HTTP 200                                   |                |
|                |  <------------------------------------------------------------------------+  |                |
|                |                                                                              |                |
+----------------+                                                                              +----------------+
```
