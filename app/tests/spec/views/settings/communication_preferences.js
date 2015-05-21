/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';


define([
  'chai',
  'jquery',
  'sinon',
  'views/settings/communication_preferences',
  'models/user',
  'models/account',
  'models/marketing-email-prefs',
  'models/reliers/relier',
  'lib/promise',
  'lib/constants'
],
function (chai, $, sinon, View, User, Account, MarketingEmailPrefs, Relier,
  p, Constants) {
  var assert = chai.assert;
  var NEWSLETTER_ID = Constants.MARKETING_EMAIL_NEWSLETTER_ID;

  describe('views/settings/communication_preferences', function () {
    var user;
    var account;
    var view;
    var emailPrefsModel;
    var relier;
    var preferencesUrl = 'https://marketing.preferences.com/user/user-token';

    function render() {
      return view.render()
        .then(function () {
          $('#container').html(view.el);
        });
    }

    beforeEach(function () {
      relier = new Relier();
      account = new Account();

      emailPrefsModel = new MarketingEmailPrefs({
        account: account
      });
      emailPrefsModel.set('preferencesUrl', preferencesUrl);
      emailPrefsModel.set('newsletters', [NEWSLETTER_ID]);

      sinon.stub(emailPrefsModel, 'fetch', function () {
        return p();
      });

      sinon.stub(emailPrefsModel, 'destroy', function () {
        return p();
      });

      sinon.stub(account, 'isVerified', function () {
        return p(true);
      });

      sinon.stub(account, 'getMarketingEmailPrefs', function () {
        return emailPrefsModel;
      });

      user = new User();
      sinon.stub(user, 'getSignedInAccount', function () {
        return account;
      });

      view = new View({
        relier: relier,
        user: user
      });

      sinon.stub(view, 'isUserAuthorized', function () {
        return p(true);
      });

      return render();
    });

    afterEach(function () {
      $(view.el).remove();
      view.destroy();
      view = null;
    });

    describe('render', function () {
      it('renders with the preferencesUrl', function () {
        sinon.stub(emailPrefsModel, 'isOptedIn', function () {
          return true;
        });

        return render()
          .then(function () {
            assert.isTrue(view.$('#marketing-email-optin').is(':checked'));
            assert.equal(view.$('#preferences-url').attr('href'), preferencesUrl);
          });
      });

      it('does not check the opt-in checkbox if not opted in', function () {
        sinon.stub(emailPrefsModel, 'isOptedIn', function () {
          return false;
        });

        return render()
          .then(function () {
            assert.isTrue(emailPrefsModel.isOptedIn.calledWith(NEWSLETTER_ID));
            assert.isFalse(view.$('#marketing-email-optin').is(':checked'));
          });
      });

      it('does not render the preferencesUrl if the user is not registered with Baseket', function () {
        emailPrefsModel.unset('preferencesUrl');
        return render()
          .then(function () {
            assert.equal(view.$('#preferences-url').length, 0);
          });
      });
    });

    describe('update preferences', function () {
      it('toggle', function () {
        sinon.stub(emailPrefsModel, 'optIn', function () {
          return p();
        });

        sinon.stub(emailPrefsModel, 'optOut', function () {
          return p();
        });

        assert.isFalse(emailPrefsModel.optIn.called);
        assert.isFalse(emailPrefsModel.optOut.called);

        view.$('#marketing-email-optin').click();
        assert.isFalse(emailPrefsModel.optIn.called);
        assert.isTrue(emailPrefsModel.optOut.calledWith(NEWSLETTER_ID));

        view.$('#marketing-email-optin').click();
        assert.isTrue(emailPrefsModel.optIn.calledWith(NEWSLETTER_ID));
      });
    });
  });
});


