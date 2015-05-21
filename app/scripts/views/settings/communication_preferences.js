/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

define([
  'cocktail',
  'jquery',
  'lib/xss',
  'lib/constants',
  'views/base',
  'views/mixins/back-mixin',
  'views/mixins/settings-mixin',
  'stache!templates/settings/communication_preferences'
],
function (Cocktail, $, Xss, Constants, BaseView, BackMixin, SettingsMixin, Template) {
  var NEWSLETTER_ID = Constants.MARKETING_EMAIL_NEWSLETTER_ID;

  var View = BaseView.extend({
    template: Template,
    className: 'communication-preferences',

    events: {
      'change .marketing-email-optin': 'onOptInChange'
    },

    initialize: function () {
      this._emailPrefs = this.getSignedInAccount().getMarketingEmailPrefs();
    },

    beforeDestroy: function () {
      // clean up any access tokens used for page management.
      // TODO - ensure this happens on page unload too?
      return this._emailPrefs.destroy();
    },

    beforeRender: function () {
      return this._emailPrefs.fetch();
    },

    context: function () {
      var emailPrefs = this._emailPrefs;
      return {
        isOptedIn: emailPrefs.isOptedIn(NEWSLETTER_ID),
        // preferencesURL is only available if the user is already
        // registered with basket.
        preferencesUrl: Xss.href(emailPrefs.get('preferencesUrl'))
      };
    },

    onOptInChange: function (event) {
      var isChecked = $(event.currentTarget).is(':checked');
      this.setOptInStatus(NEWSLETTER_ID, isChecked);
    },

    setOptInStatus: function (newsletterId, isOptedIn) {
      var emailPrefs = this._emailPrefs;
      if (isOptedIn) {
        return emailPrefs.optIn(newsletterId);
      } else {
        return emailPrefs.optOut(newsletterId);
      }
    }
  });

  Cocktail.mixin(
    View,
    BackMixin,
    SettingsMixin
  );

  return View;
});

