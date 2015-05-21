/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

define([
  'backbone'
], function (Backbone) {
  var Model = Backbone.Model.extend({
    defaults: {
      token: undefined
    },

    initialize: function (options) {
      options = options || {};

      this._oAuthClient = options.oAuthClient;
      this.set('token', options.token);
    },

    destroy: function () {
      return this._oAuthClient.destroyToken(this.get('token'));
    }
  });

  return Model;
});


