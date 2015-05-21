/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * A client to talk to the basket marketing email server
 */

'use strict';

define([
  'lib/xhr'
], function (xhr) {

  function MarketingEmailClient(options) {
    options = options || {};

    var self = this;

    self._xhr = options.xhr || xhr;
    self._baseUrl = options.baseUrl;
    self._preferencesUrl = options.preferencesUrl;
  }

  MarketingEmailClient.prototype = {
    _request: function (path, type, accessToken, data, headers) {
      var url = this._baseUrl + path;

      return this._xhr.oauthAjax({
        url: url,
        type: type,
        accessToken: accessToken,
        data: data,
        headers: headers
      });
    },

    fetch: function (accessToken) {
      var self = this;
      return this._request('/lookup-user', 'get', accessToken)
        .then(function (response) {
          // TODO
          // I would prefer to place this into the MarketingEmailPrefs model
          // but doing so required passing around the preferencesUrl to lots of
          // irrelevant classes.
          if (response.token) {
            response.preferencesUrl = self._preferencesUrl + response.token;
          }

          return response;
        });
    },

    optIn: function (accessToken, newsletterId) {
      return this._request('/subscribe', 'post', accessToken, {
        newsletters: [newsletterId]
      });
    },

    optOut: function (accessToken, newsletterId) {
      return this._request('/unsubscribe', 'post', accessToken, {
        newsletters: [newsletterId]
      });
    }
  };

  return MarketingEmailClient;
});

