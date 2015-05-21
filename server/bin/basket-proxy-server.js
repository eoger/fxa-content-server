#!/usr/bin/env node

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

var url = require('url');
var mozlog = require('mozlog');
var request = require('request');
var p = require('bluebird');

var config = require('../lib/configuration');
mozlog.config(config.get('logging'));

var logger = require('mozlog')('server.basketproxy');

var express = require('express');
var bodyParser = require('body-parser');
var cors = require('cors');

var CORS_ORIGIN = config.get('public_url');
var API_KEY = config.get('basket.api_key');
var API_URL = config.get('basket.api_url');
var VERIFY_URL = config.get('oauth_url') + '/v1/verify';

// Verify an OAuth token and return the associated credentials
function verifyOAuthToken(cb) {
  return function (req, res, next) {
    var authHeader = req.headers && req.headers.authorization;

    if (! authHeader) {
      logger.error('unauthorized');
      return next(new Error('Not authorized'));
    }

    var token = authHeader.replace(/^Bearer /, '');

    request.post({
      url: VERIFY_URL,
      json: {
        token: token
      }
    }, function (err, _, body) {
      // TODO use an actual error format
      if (err) {
        logger.error('auth.error', err);
        res.status(400).send(err);
        return;
      }

      if (body.code >= 400) {
        logger.error('unauthorized', body);
        res.status(400).send('unauthorized');
        return;
      }

      logger.debug('auth.valid', body);

      cb(body, req, res, next);
    });
  };
}

// Send a request to the Basket backend
function basketRequest(path, method, params) {
  var config = {
    url: API_URL + path,
    strictSSL: true,
    method: method,
    headers: {
      'X-API-Key': API_KEY
    },
    form: params
  };

  var deferred = p.defer();

  request(config, function (err, httpRequest, body) {
    if (err) {
      logger.error('basket.error', err);
      return deferred.reject(err);
    }

    if (httpRequest.statusCode !== 200) {
      // TODO do something here.
    }

    deferred.resolve(body);
  });

  return deferred.promise;
}

function forwardBasketResponse(res, path, method, params) {
  return basketRequest(path, method, params)
    .then(function (body) {
      res.type('application/json');
      res.send(body);
    }, function (err) {
      res.status(400).send(err);
    });
}

function initApp() {
  var app = express();
  app.use(bodyParser.json());

  app.use(cors({
    origin: CORS_ORIGIN
  }));

  app.get('/lookup-user', verifyOAuthToken(function (creds, req, res) {
    forwardBasketResponse(res, '/lookup-user/?email=' + creds.email, 'get');
  }));

  app.post('/subscribe', verifyOAuthToken(function (creds, req, res) {
    forwardBasketResponse(res, '/subscribe/', 'post', {
      email: creds.email,
      newsletters: req.body.newsletters.join(','),
      optin: 'Y'
    });
  }));

  app.post('/unsubscribe', verifyOAuthToken(function (creds, req, res) {
    basketRequest('/lookup-user/?email=' + creds.email, 'get')
      .then(function (body) {
        var token;
        try {
          token = JSON.parse(body).token;
        } catch(e) {
          return res.status(400).send('error');
        }

        return forwardBasketResponse(res, '/unsubscribe/' + token + '/', 'post', {
          email: creds.email,
          newsletters: req.body.newsletters.join(',')
        });
      });
  }));

  return app;
}

function listen(app) {
  var serverUrl = url.parse(config.get('marketing_email.api_url'));
  app.listen(serverUrl.port, serverUrl.hostname);
  logger.info('FxA Basket Proxy listening on port', serverUrl.port);
  return true;
}

var app = initApp();
listen(app);
