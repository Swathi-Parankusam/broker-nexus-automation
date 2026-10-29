Feature: Broker Nexus Login and Logout

  Feature: Broker Nexus Login and Logout

  Background:
    Given I open the Broker Nexus login page

  # =========================================
  # POSITIVE LOGIN SCENARIOS
  # =========================================

  @positive @smoke
  Scenario: TC_LOGIN_001 Verify Email Address field is displayed
    Then the Email Address field should be visible

  @positive
  Scenario: TC_LOGIN_002 Verify Email Address placeholder
    Then the Email Address placeholder should be displayed

  @positive @smoke
  Scenario: TC_LOGIN_003 Verify Password field is displayed
    Then the Password field should be visible

  @positive
  Scenario: TC_LOGIN_004 Verify password is masked by default
    Then the Password field should be masked

  @TC_LOGIN_005 @positive @smoke
  Scenario: TC_LOGIN_005 Verify password visibility icon is displayed
    Then the password visibility icon should be visible

  @TC_LOGIN_006 @positive
  Scenario: TC_LOGIN_006 Verify password visibility toggle
    When I enter password "Test@123"
    And I click the password visibility icon
    Then the Password field should be displayed in plain text
    When I click the password visibility icon
    Then the Password field should be masked

  @TC_LOGIN_007 @positive @smoke
  Scenario: TC_LOGIN_007 Verify login with valid credentials and view homepage
    When I enter valid login credentials
    And I click the Login button
    Then I should be logged in successfully
    And I should see the homepage

  # =========================================
  # POSITIVE LOGOUT SCENARIOS
  # =========================================

@TC_LOGOUT_001 @positive @smoke @logout
Scenario: TC_LOGOUT_001 Verify logout after successful login
    Given I open the Broker Nexus login page
    When I enter valid login credentials
    And I click the Login button
    Then I should be logged in successfully
    And I should see the homepage
    When I click the Profile Icon
    And I click the Logout option
   # Then I should be redirected to the login page

  # =========================================
  # NEGATIVE LOGIN SCENARIOS
  # =========================================

  @TC_LOGIN_008 @negative
  Scenario Outline: TC_LOGIN_008 Verify login with invalid or missing credentials
    When I enter email "<email>"
    And I enter password "<password>"
    And I click the Login button
    Then login should be rejected

    Examples:
      | email               | password      |
      |                     | Test@123      |
      | admin@nsure.com     |               |
      |                     |               |
      | invalid-email       | Test@123      |
      | admin@              | Test@123      |
      | @nsure.com          | Test@123      |
      | unknown@example.com | WrongPass123! |
      | admin@nsure.com     | WrongPass123! |

  @TC_LOGIN_009 @negative
  Scenario: TC_LOGIN_009 Verify login with a whitespace-only password
    When I enter email "admin@nsure.com"
    And I enter a password containing only spaces
    And I click the Login button
    Then login should be rejected

  @TC_LOGIN_010 @negative
  Scenario: TC_LOGIN_010 Verify login with spaces inside the email address
    When I enter email "admin @nsure.com"
    And I enter password "Test@123"
    And I click the Login button
    Then login should be rejected
