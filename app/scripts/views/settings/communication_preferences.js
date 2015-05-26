/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

define([
  'underscore',
  'cocktail',
  'lib/xss',
  'lib/constants',
  'views/form',
  'views/mixins/back-mixin',
  'views/mixins/settings-mixin',
  'stache!templates/loading',
  'stache!templates/settings/communication_preferences'
],
function (_, Cocktail, Xss, Constants, FormView, BackMixin, SettingsMixin,
  LoadingTemplate, Template) {
  var NEWSLETTER_ID = Constants.MARKETING_EMAIL_NEWSLETTER_ID;

  var View = FormView.extend({
    // email preferences can take a long time to load. Load the "loading"
    // template while waiting for the prefs to load, then render the
    // real template.
    template: LoadingTemplate,
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

    afterRender: function () {
      var self = this;
      var emailPrefs = self._emailPrefs;
      emailPrefs.fetch()
        .then(function () {
          var context = _.extend({
            isOptedIn: emailPrefs.isOptedIn(NEWSLETTER_ID),
            // preferencesURL is only available if the user is already
            // registered with basket.
            preferencesUrl: Xss.href(emailPrefs.get('preferencesUrl'))
          }, self.getContext());

          self.$el.html(Template(context)); //jshint ignore:line
        });
    },

    /*
    submit: function () {
      var self = this;
      return self.onOptInChange()
        .then(function () {
          self.navigate('settings');
        });
    },
    */

    onOptInChange: function () {
      var self = this;
      var isChecked = self.$('#marketing-email-optin').is(':checked');
      return self.setOptInStatus(NEWSLETTER_ID, isChecked);
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

