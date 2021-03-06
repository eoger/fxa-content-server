/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Validate COPPA input.
 */
define(function (require, exports, module) {
  'use strict';

  const AuthErrors = require('lib/auth-errors');

  module.exports = {
    match ($el) {
      return $el.attr('type') === 'number' && $el.prop('id') === 'age';
    },

    validate () {
      const isRequired = typeof this.attr('required') !== 'undefined';
      const value = this.val();

      if (isRequired && ! isValidAge(value)) {
        throw AuthErrors.toError('AGE_REQUIRED');
      }
    }
  };

  function isValidAge(value) {
    return value &&
           value.length &&
           ! isNaN(parseInt(value, 10));
  }
});
