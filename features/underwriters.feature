@Underwriters
Feature: POSO Underwriters Management

  As a POSO user
  I want to manage underwriters
  So that I can create, search, filter, edit and change underwriter status

  Background:
    Given I open the Chromium browser
    And I log in to POSO with valid credentials
    When I navigate to Administration and select Underwriters

  # ==========================================================
  # POSITIVE SCENARIOS
  # ==========================================================

  @UW_TC_001 @UW_Navigation @UW_Create @UW_MandatoryFields @UW_Positive
  Scenario: UW_TC_001 - Navigate to Underwriters and create an underwriter using all mandatory fields

    Then the Underwriters page should be displayed
    And the underwriters list should be displayed

    When I select New Underwriter
    And I enter the following underwriter details
      | field             | value                                  |
      | companyName       | POSO Test Company 13                   |
      | email             | poso.test13@example.com                |
      | phone             | 98765432100                            |
      | website           | https://gmail.com                      |
      | registrationNumber| REGPOSO123457                      |
      | gst               | GST123456789                           |
      | licenseNumber     | LICPOSO123456                          |
      | description       | POSO mandatory fields test             |
      | address           | 10 Test Street                         |
      | city              | Hyderabad                              |
      | state             | Telangana                              |
      | country           | India                                  |
      | pincode           | 500001                                 |
      | accountHolderName | POSO Test Account Holder               |
      | accountNumber     | 123456789012                           |
      | bankCode          | BR001                                  |
      | branchName        | Hyderabad Main Branch                  |

    And I save the underwriter
    Then the underwriter should be created successfully
    And I log out from POSO


  @UW_TC_002 @UW_Create @UW_OptionalFields @UW_Logo @UW_API @UW_Positive
  Scenario: UW_TC_002 - Configure optional underwriter information, logo and API details

    When I search for an existing underwriter using the following details
      | field | value                   |
      | email | poso.test13@example.com |

    And I open the actions menu and select Edit

    And I enter the following optional underwriter details
      | field                   | value                                      |
      | premiumRateBases        | ProRata                                    |
      | useRatingTable          | Yes                                        |
      | endorsementSubmissionMethod | Automatic (API, else email, else manual) |
      | endorsementEmail        | endorsements@example.com                  |
      | endorsementApiUrl       | https://example.com/endorsements           |

    And I enable API Available

    And I enter the following API details
      | field            | value                       |
      | underwriterApiUrl| https://example.com/webhook  |
      | underwriterApiKey| test-api-key-12345           |

    And I upload a valid company logo
    And I save the underwriter changes
    Then the underwriter changes should be saved successfully
    And I log out from POSO


  @UW_TC_003 @UW_Search @UW_Positive
  Scenario Outline: UW_TC_003 - Search underwriters by company name, email and phone

    When I search for an underwriter using "<searchField>" with value "<searchValue>"
    Then the matching underwriter records should be displayed
    And I log out from POSO

    Examples:
      | searchField   | searchValue           |
      | Company Name  | POSO Test Company 13  |
      | Email Address | poso.test13@example.com |
    

  @UW_TC_004 @UW_Edit @UW_CancelEdit @UW_Positive
  Scenario: UW_TC_004 - Edit an underwriter and verify cancel changes functionality

    When I search for an existing underwriter using the following details
      | field | value                   |
      | email | poso.test13@example.com |

    And I open the actions menu and select Edit

    And I update the following underwriter details
      | field       | value                         |
      | companyName | POSO Test Company 13 Updated  |
      | phone       | 98765432101                   |
      | description | Updated POSO underwriter      |

    And I save the underwriter changes
    Then the underwriter changes should be saved successfully

    When I search for an existing underwriter using the following details
      | field | value                   |
      | email | poso.test13@example.com |

    And I open the actions menu and select Edit
    And I change the company name to "Cancelled POSO Company"
    And I cancel the underwriter changes
    Then the original underwriter details should remain unchanged

    And I log out from POSO


  @UW_TC_005 @UW_Filter
  Scenario: UW_TC_005 - Verify combined filters and clear filters

    # Active Status with Email
    When I filter underwriters by status "Active"
    And I apply the filter "Email" with value "poso.test13@example.com"
    Then the underwriter list should match the filter "Email" with value "poso.test13@example.com"
    When I clear all underwriter filters

    # Inactive Status with Email
    When I filter underwriters by status "Inactive"
    And I apply the filter "Email" with value "testuserom@gmail.com"
    Then the underwriter list should match the filter "Email" with value "testuserom@gmail.com"
    When I clear all underwriter filters

    # Active Status with Company Name
    When I filter underwriters by status "Active"
    And I apply the filter "Company Name" with value "POSO Test Company 13 Updated"
    Then the underwriter list should match the filter "Company Name" with value "POSO Test Company 13 Updated"
    When I clear all underwriter filters

    # Inactive Status with Company Name
    When I filter underwriters by status "Inactive"
    And I apply the filter "Company Name" with value "OM"
    Then the underwriter list should match the filter "Company Name" with value "OM"
    When I clear all underwriter filters

    # Active Status with Last Updated
    When I filter underwriters by status "Active"
    And I filter underwriters by Last Updated date "02/11/2026"
    Then the underwriter list should match the selected Last Updated date "02/11/2026"
    When I clear all underwriter filters

    # Inactive Status with Last Updated
    When I filter underwriters by status "Inactive"
    And I filter underwriters by Last Updated date "21/10/2026"
    Then the underwriter list should match the selected Last Updated date "21/10/2026"
    When I clear all underwriter filters

    And I log out from POSO
    Then I should be redirected to the POSO login page


  @UW_TC_006 @UW_Deactivate @UW_Activate
  Scenario: UW_TC_006 - Deactivate and reactivate an underwriter and verify both statuses

    # Locate and deactivate the active underwriter
    When I filter underwriters by status "Active"
    And I apply the filter "Email" with value "poso.test13@example.com"
    Then the underwriter should be displayed with Active status

    When I open the actions menu and select Deactivate
    And I confirm the deactivation
    And I clear all underwriter filters

    # Locate and verify the inactive underwriter
    When I filter underwriters by status "Inactive"
    And I apply the filter "Email" with value "poso.test13@example.com"
    Then the underwriter should be displayed with Inactive status

    When I open the actions menu and select Activate
    And I confirm the activation
    And I clear all underwriter filters

    # Verify the final Active status
    When I filter underwriters by status "Active"
    And I apply the filter "Email" with value "poso.test13@example.com"
    Then the underwriter should be displayed with Active status

    And I log out from POSO


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
    And I log out from POSO


  @UW_TC_008 @UW_Search @UW_Negative
  Scenario: UW_TC_008 - Search for a nonexistent underwriter

    When I search for an underwriter using "Email Address" with value "notfound@example.com"
    Then no matching underwriter records should be displayed
    And I log out from POSO


  @UW_TC_009 @UW_Filter @UW_Negative
  Scenario: UW_TC_009 - Verify filters when no records match

    When I apply the filter "Company Name" with value "No Such POSO Company 999"
    Then no matching underwriter records should be displayed
    And I log out from POSO
