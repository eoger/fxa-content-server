/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

define([
  'underscore',
  'backbone',
  'lib/promise',
  'lib/constants'
], function (_, Backbone, p, Constants) {

  var SCOPES = Constants.MARKETING_EMAIL_OAUTH_SCOPE;

  var MarketingEmailPrefs = Backbone.Model.extend({
    defaults: {
      preferencesUrl: null,
      token: null,
      newsletters: []
    },

    initialize: function (options) {
      options = options || {};

      var self = this;
      self._marketingEmailClient = options.marketingEmailClient;
      self._account = options.account;
    },

    destroy: function () {
      var self = this;
      if (self._accessToken) {
        return self._accessToken.destroy();
      }
    },

    _withMarketingEmailClient: function (method) {
      var self = this;
      var client = self._marketingEmailClient;
      var args = [].slice.call(arguments, 1);
      return p()
        .then(function () {
          if (! self._accessToken) {
            return self._account.createOAuthToken(SCOPES)
              .then(function (accessToken) {
                self._accessToken = accessToken;
              });
          }
        })
        .then(function () {
          args.unshift(self._accessToken.get('token'));
          return client[method].apply(client, args);
        });
    },

    fetch: function () {
      var self = this;
      return self._withMarketingEmailClient('fetch')
        .then(function (response) {
          if (response) {
            response.newsletters = response.newsletters || [];
            for (var key in response) {
              self.set(key, response[key]);
            }
          }
        });
    },

    optIn: function (newsletterId) {
      var self = this;
      if (self.isOptedIn(newsletterId)) {
        return p();
      }

      return self._withMarketingEmailClient('optIn', newsletterId)
        .then(function () {
          var newsletters = self.get('newsletters');
          newsletters.push(newsletterId);
          self.set('newsletters', newsletters);
        });
    },

    optOut: function (newsletterId) {
      var self = this;
      if (! self.isOptedIn(newsletterId)) {
        return p();
      }

      return self._withMarketingEmailClient('optOut', newsletterId)
        .then(function () {
          var newsletters = _.without(self.get('newsletters'), newsletterId);
          self.set('newsletters', newsletters);
        });
    },

    isOptedIn: function (newsletterId) {
      var newsletters = this.get('newsletters');
      return newsletters.indexOf(newsletterId) !== -1;
    }
  });

  return MarketingEmailPrefs;
});
