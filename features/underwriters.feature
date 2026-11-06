@Underwriters
Feature: Broker Nexus Underwriters Management

  As a Broker Nexus user
  I want to manage underwriters
  So that I can create, search, filter, edit, and change underwriter status

  Background:
    Given I open the Chromium browser
    And I log in to Broker Nexus with valid credentials
    When I navigate to Administration and select Underwriters

  # ==========================================================
  # POSITIVE SCENARIOS
  # ==========================================================

  @UW_TC_001 @UW_Navigation @UW_Create @UW_Positive
  Scenario: UW_TC_001 - Navigate to Underwriters and create an underwriter using mandatory fields
    Then the Underwriters page should be displayed
    And the underwriters list should be displayed
    When I select New Underwriter
    And I enter the following underwriter details
      | field       | value                             |
      | companyName | UW Test Company 13                |
      | email       | uw.test13@example.com             |
      | phone       | 98765432100                       |
      | website     | https://gmail.com                 |
      | description | Underwriter mandatory fields test |
      | address     | 10 Test Street                    |
      | city        | Hyderabad                         |
      | state       | Telangana                         |
      | country     | India                             |
      | postalCode  | 500001                            |
    And I save the underwriter
    And I log out from Broker Nexus


  @UW_TC_002 @UW_Create @UW_OptionalFields @UW_Logo @UW_Positive
  Scenario: UW_TC_002 - Add optional company information, logo, and bank details to an existing underwriter
    When I search for an existing underwriter using the following details
      | field | value                |
      | email | uw.test13@example.com |
    And I open the actions menu and select Edit
    And I enter the following optional underwriter details
      | field              | value                 |
      | registrationNumber | REG123456             |
      | taxNumber          | GST123456             |
      | premiumRateBases   | ProRate              |
      | accountHolderName  | Test Account Holder   |
      | accountNumber      | 123456789012          |
      | branchCode         | BR001                 |
      | branchName         | Hyderabad Main Branch |
    And I enable API Available
    And I enter the following API details
      | field      | value                         |
      | webhookUrl | https://example.com/webhook   |
      | apiKey     | test-api-key-12345            |
    And I upload a valid company logo
    And I save the underwriter changes
    And I log out from Broker Nexus


  @UW_TC_003 @UW_Search @UW_Positive
  Scenario Outline: UW_TC_003 - Search underwriters by company name, email, and phone
    When I search for an underwriter using "<searchField>" with value "<searchValue>"
    Then the matching underwriter records should be displayed
    And I log out from Broker Nexus

    Examples:
      | searchField   | searchValue          |
      | Company Name  | UW Test Company 13    |
      | Email Address | uw.test13@example.com |
      | Phone         | 98765432100          |                        


  @UW_TC_004 @UW_Edit @UW_CancelEdit @UW_Positive
  Scenario: UW_TC_004 - Edit an underwriter and verify cancel changes functionality

    # Update existing underwriter details
    When I search for an existing underwriter using the following details
      | field | value                |
      | email | uw.test13@example.com |
    And I open the actions menu and select Edit
    And I update the following underwriter details
      | field       | value                       |
      | companyName | UW Test Company 13 Updated  |
      | phone       | 98765432110                 |
      | description | Updated underwriter details |
    And I save the underwriter changes
   
    # Verify cancel edit functionality
    When I search for an existing underwriter using the following details
      | field | value                |
      | email | uw.test13@example.com |
    And I open the actions menu and select Edit
    And I change the company name to "Cancelled Company Name"
    And I cancel the underwriter changes
    And I log out from Broker Nexus

@UW_TC_005
Scenario: UW_TC_005 - Verify combined filters, clear filters and logout

  # 1. Active Status with Email
  When I filter underwriters by status "Active"
  And I apply the filter "Email" with value "uw.test13@example.com"
  Then the underwriter list should match the filter "Email" with value "uw.test13@example.com"
  When I clear all underwriter filters

  # 2. Inactive Status with Email
  When I filter underwriters by status "Inactive"
  And I apply the filter "Email" with value "uw.test11@example.com"
  Then the underwriter list should match the filter "Email" with value "uw.test11@example.com"
  When I clear all underwriter filters

  # 3. Active Status with Company Name
  When I filter underwriters by status "Active"
  And I apply the filter "Company Name" with value "UW Test Company 13 Updated"
  Then the underwriter list should match the filter "Company Name" with value "UW Test Company 13 Updated"
  When I clear all underwriter filters

  # 4. Inactive Status with Company Name
  When I filter underwriters by status "Inactive"
  And I apply the filter "Company Name" with value "UW Test Company Updated"
  Then the underwriter list should match the filter "Company Name" with value "UW Test Company Updated"
  When I clear all underwriter filters

  # 5. Active Status with Last Updated
  When I filter underwriters by status "Active"
  And I filter underwriters by Last Updated date "02/11/2026"
  Then the underwriter list should match the selected Last Updated date "02/11/2026"
  When I clear all underwriter filters

  # 6. Inactive Status with Last Updated
  When I filter underwriters by status "Inactive"
  And I filter underwriters by Last Updated date "02/11/2026"
  Then the underwriter list should match the selected Last Updated date "02/11/2026"
  When I clear all underwriter filters

  # Final Logout
  When I log out from Broker Nexus
  Then I should be redirected to the login page


@UW_TC_006 @UW_Deactivate @UW_Activate @UW_Positive
Scenario: UW_TC_009 - Deactivate and reactivate an underwriter and verify both statuses

  # Locate and deactivate the active underwriter
  When I filter underwriters by status "Active"
  And I apply the filter "Email" with value "uw.test13@example.com"
  Then the underwriter should be displayed with Active status
  When I open the actions menu and select Deactivate
  And I confirm the deactivation
  When I clear all underwriter filters

  # Locate and verify the inactive underwriter
  When I filter underwriters by status "Inactive"
  And I apply the filter "Email" with value "uw.test13@example.com"
  Then the underwriter should be displayed with Inactive status
  When I open the actions menu and select Activate
  And I confirm the activation
  When I clear all underwriter filters

  # Verify the final Active status
  When I filter underwriters by status "Active"
  And I apply the filter "Email" with value "uw.test13@example.com"
  Then the underwriter should be displayed with Active status
  And I log out from Broker Nexus

  # ==========================================================
  # NEGATIVE SCENARIOS
  # ==========================================================

  @UW_TC_007 @UW_Create @UW_Negative
  Scenario: UW_TC_007 - Verify mandatory field validation when creating an underwriter
    When I select New Underwriter
    And I leave all mandatory fields empty
    And I save the underwriter
    Then the mandatory field validation messages should be displayed
    And the underwriter should not be created
    And I log out from Broker Nexus

 @UW_TC_008 @UW_Search @UW_Negative
  Scenario: UW_TC_010 - Search for a nonexistent underwriter
    When I search for an underwriter using "Email Address" with value "notfound@example.com"
    Then no matching underwriter records should be displayed
    And I log out from Broker Nexus


  @UW_TC_009 @UW_Filter @UW_Negative
  Scenario: UW_TC_011 - Verify filters when no records match
    When I apply the filter "Company Name" with value "No Such Company 999"
    Then no matching underwriter records should be displayed
    And I log out from Broker Nexus

 