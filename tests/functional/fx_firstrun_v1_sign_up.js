/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'intern',
  'intern!object',
  'tests/lib/helpers',
  'tests/functional/lib/helpers'
], function (intern, registerSuite, TestHelpers, FunctionalHelpers) {
  const config = intern.config;
  const PAGE_URL = config.fxaContentRoot + 'signup?context=iframe&service=sync';

  var email;
  const PASSWORD = '12345678';

  const SELECTOR_CONFIRM_HEADER = '#fxa-confirm-header';
  const SELECTOR_CONNECT_ANOTHER_DEVICE_HEADER = '#fxa-connect-another-device-header';
  const SELECTOR_SIGN_UP_HEADER = '#fxa-signup-header';
  const SELECTOR_SIGN_UP_SUB_HEADER = '#fxa-signup-header .service';

  const clearBrowserState = FunctionalHelpers.clearBrowserState;
  const closeCurrentWindow = FunctionalHelpers.closeCurrentWindow;
  const fillOutSignUp = FunctionalHelpers.fillOutSignUp;
  const noSuchElement = FunctionalHelpers.noSuchElement;
  const openPage = FunctionalHelpers.openPage;
  const openVerificationLinkInNewTab = FunctionalHelpers.openVerificationLinkInNewTab;
  const respondToWebChannelMessage = FunctionalHelpers.respondToWebChannelMessage;
  const testElementExists = FunctionalHelpers.testElementExists;
  const testEmailExpected = FunctionalHelpers.testEmailExpected;
  const testIsBrowserNotified = FunctionalHelpers.testIsBrowserNotified;
  const visibleByQSA = FunctionalHelpers.visibleByQSA;

  registerSuite({
    name: 'Firstrun Sync v1 sign_up',

    beforeEach: function () {
      email = TestHelpers.createEmail();
    },

    afterEach: function () {
      return this.remote
        .then(clearBrowserState());
    },

    'sign up, verify same browser in a different tab': function () {
      return this.remote
        .then(openPage(PAGE_URL, SELECTOR_SIGN_UP_HEADER))
        .then(visibleByQSA(SELECTOR_SIGN_UP_SUB_HEADER))
        .then(respondToWebChannelMessage('fxaccounts:can_link_account', { ok: true } ))
        .then(fillOutSignUp(email, PASSWORD))

        .then(testElementExists(SELECTOR_CONFIRM_HEADER))
        .then(testIsBrowserNotified('fxaccounts:can_link_account'))
        .then(testIsBrowserNotified('fxaccounts:login'))


        // verify the user
        .then(openVerificationLinkInNewTab(email, 0))
        .switchToWindow('newwindow')

        // user should see the CAD screen in both signup and verification tabs.
        .then(testElementExists(SELECTOR_CONNECT_ANOTHER_DEVICE_HEADER))
        // switch back to the original window, it should transition.
        .then(closeCurrentWindow())

        .then(testElementExists(SELECTOR_CONNECT_ANOTHER_DEVICE_HEADER))

        // A post-verification email should be sent, this is Sync.
        .then(testEmailExpected(email, 1));
    },

    'sign up, cancel merge warning': function () {
      return this.remote
        .then(openPage(PAGE_URL, SELECTOR_SIGN_UP_HEADER))
        .then(respondToWebChannelMessage('fxaccounts:can_link_account', { ok: false } ))
        .then(fillOutSignUp(email, PASSWORD))

        // user should not transition to the next screen
        .then(noSuchElement(SELECTOR_CONFIRM_HEADER))
        .then(testIsBrowserNotified('fxaccounts:can_link_account'));
    }
  });
});
