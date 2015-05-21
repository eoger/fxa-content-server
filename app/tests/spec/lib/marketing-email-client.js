/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'chai',
  'sinon',
  'lib/marketing-email-client',
  'lib/promise',
  'lib/xhr'
],
function (chai, sinon, MarketingEmailClient, p, xhr) {
  'use strict';

  var assert = chai.assert;

  describe('lib/marketing-email-client', function () {
    var BASE_URL = 'https://basket.mozilla.com';
    var PREFERENCES_URL = 'https://www.allizom.org/newsletter/existing/';

    var client;
    var xhrMock;

    beforeEach(function () {
      // Xhr has no constructor
      xhrMock = Object.create(xhr);
      xhrMock.ajax = function () {
        return p();
      };

      client = new MarketingEmailClient({
        xhr: xhrMock,
        baseUrl: BASE_URL,
        preferencesUrl: PREFERENCES_URL
      });
    });

    describe('fetch', function () {
      it('returns a preferences URL for the user', function () {
        sinon.stub(xhrMock, 'ajax', function () {
          return p({
            token: 'users_uuid'
          });
        });

        return client.fetch('token')
          .then(function (data) {
            assert.equal(data.token, 'users_uuid');
            assert.equal(data.preferencesUrl, PREFERENCES_URL + 'users_uuid');

            var request = xhrMock.ajax.args[0][0];
            assert.equal(request.url, BASE_URL + '/lookup-user');
            assert.equal(request.type, 'get');
            assert.include(request.headers.Authorization, 'token');
          });
      });
    });

    describe('optIn', function () {
      it('opts the user in', function () {
        sinon.spy(xhrMock, 'ajax');

        return client.optIn('token')
          .then(function () {
            var request = xhrMock.ajax.args[0][0];
            assert.equal(request.url, BASE_URL + '/subscribe');
            assert.equal(request.type, 'post');
            assert.include(request.headers.Authorization, 'token');
          });
      });
    });

    describe('optOut', function () {
      it('opts the user out', function () {
        sinon.spy(xhrMock, 'ajax');

        return client.optOut('token')
          .then(function () {
            var request = xhrMock.ajax.args[0][0];
            assert.equal(request.url, BASE_URL + '/unsubscribe');
            assert.equal(request.type, 'post');
            assert.include(request.headers.Authorization, 'token');
          });
      });
    });
  });
});
