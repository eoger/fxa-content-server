/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'intern',
  'intern!object',
  'require',
  'tests/functional/lib/helpers'
], function (intern, registerSuite, require, TestHelpers) {
  'use strict';

  var AUTOMATED = '?automatedBrowser=true';
  var url = intern.config.fxaContentRoot + 'signup' + AUTOMATED;
  var signin = intern.config.fxaContentRoot + 'signin' + AUTOMATED;

  registerSuite({
    name: 'refreshes metrics',

    beforeEach: function () {

    },

    setup: function () {
    },

    'signup page': function () {
      var self = this;

      return this.get('remote')
        .get(require.toUrl(url))
        .setFindTimeout(intern.config.pageLoadTimeout)

        .findByCssSelector('form input.email')
        .end()

        .refresh()
        .findByCssSelector('form input.email')
        .end()

        // Unload the page to flush the metrics
        .get(require.toUrl(signin))
        .findByCssSelector('input[type=email]')

        .then(function () {
          return TestHelpers.testIsEventLogged(self, 'signup.refresh');
        })
        .end();
    }
  });
});
