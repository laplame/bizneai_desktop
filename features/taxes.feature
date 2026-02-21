Feature: Tax Management System
  As a business owner
  I want to manage tax rates and fiscal configuration
  So that I can calculate taxes correctly and generate compliant invoices

  # IMPLEMENTATION STATUS: ✅ COMPLETED
  # Last Updated: November 2025
  # Features: Tax rate configuration, fiscal data management, invoice history, CFDI integration, tax calculations

  Background:
    Given the tax system is initialized
    And I have appropriate permissions
    And I am logged in

  # ============================================
  # TAX RATE CONFIGURATION
  # ============================================

  Scenario: View tax rate configuration
    Given I am on the Taxes screen
    When I tap on the "Tax Rate" tab
    Then I should see the current tax rate
    And I should see an input field to enter new tax rate
    And I should see a "Save Tax Rate" button
    And I should see example calculations

  Scenario: Set tax rate
    Given I am on the Tax Rate tab
    When I enter a valid tax rate (e.g., "16")
    And I tap "Save Tax Rate"
    Then the tax rate should be saved
    And I should see a success message
    And the current tax rate should update
    And taxes should be calculated using this rate

  Scenario: Set tax rate to zero
    Given I am on the Tax Rate tab
    When I enter "0" as the tax rate
    And I tap "Save Tax Rate"
    Then the tax rate should be saved as 0
    And I should see a success message
    And no taxes should be calculated

  Scenario: Validate tax rate input
    Given I am on the Tax Rate tab
    When I enter an invalid tax rate (e.g., negative number or text)
    And I tap "Save Tax Rate"
    Then I should see an error message
    And the tax rate should not be saved
    And I should be prompted to enter a valid rate

  Scenario: View current tax rate
    Given I am on the Tax Rate tab
    When I view the tax rate section
    Then I should see the current tax rate displayed
    And I should see example calculations showing:
      | Base amount |
      | Tax amount |
      | Total with tax |

  Scenario: Tax rate persistence
    Given I have set a tax rate
    When I close and reopen the application
    Then the tax rate should be preserved
    And the tax rate should be loaded correctly
    And calculations should use the saved rate

  # ============================================
  # TAX CALCULATIONS
  # ============================================

  Scenario: Calculate tax from base amount
    Given I have a tax rate configured (e.g., 16%)
    When I have a base amount (e.g., $100.00)
    Then the tax should be calculated as base × rate / 100
    And the tax amount should be $16.00
    And the total with tax should be $116.00

  Scenario: Calculate total with tax
    Given I have a tax rate configured
    When I have a base amount
    And I calculate the total with tax
    Then the total should be base + tax
    And the calculation should be accurate

  Scenario: Calculate tax from inclusive amount
    Given I have a tax rate configured (e.g., 16%)
    When I have an inclusive amount (e.g., $116.00)
    Then the tax should be calculated from the inclusive amount
    And the base amount should be extracted correctly
    And the tax amount should be calculated correctly

  Scenario: Calculate base from inclusive amount
    Given I have a tax rate configured (e.g., 16%)
    When I have an inclusive amount (e.g., $116.00)
    Then the base amount should be calculated as inclusive / (1 + rate / 100)
    And the base amount should be $100.00

  Scenario: Handle zero tax rate in calculations
    Given the tax rate is set to 0
    When I calculate tax for any amount
    Then the tax amount should be 0
    And the total should equal the base amount
    And calculations should not fail

  Scenario: Apply tax rate in cart
    Given I have items in my cart
    And a tax rate is configured
    When I view the cart
    Then the subtotal should be calculated
    And the tax should be calculated on the subtotal
    And the total should include tax
    And all amounts should be displayed correctly

  Scenario: Apply tax rate in sales
    Given I have products in my cart
    And tax rate is configured
    When I complete a payment
    Then the sale should include tax calculations
    And the ticket should include tax information
    And the total should include tax amount
    And the subtotal should be calculated correctly

  # ============================================
  # FISCAL CONFIGURATION
  # ============================================

  Scenario: View fiscal configuration
    Given I am on the Taxes screen
    When I tap on the "Configuration" tab
    Then I should see the fiscal configuration section
    And I should see a status banner indicating if tax data is configured
    And I should see current configuration values or "Not Configured"
    And I should see an "Edit Configuration" or "Configure Tax Information" button

  Scenario: Open fiscal configuration modal
    Given I am on the Configuration tab
    When I tap "Edit Configuration" or "Configure Tax Information"
    Then a configuration modal should open
    And I should see form fields for:
      | RFC (Tax ID) |
      | Legal Name |
      | Trade Name |
      | Fiscal Address |
      | Fiscal Regime |
      | Email |
      | Phone |

  Scenario: Configure RFC (Tax ID)
    Given I am in the fiscal configuration modal
    When I enter an RFC
    Then the RFC should be saved
    And the RFC should be converted to uppercase
    And the RFC should be validated (max 13 characters)

  Scenario: Configure legal name
    Given I am in the fiscal configuration modal
    When I enter a legal name
    Then the legal name should be saved
    And the legal name should be required

  Scenario: Configure trade name
    Given I am in the fiscal configuration modal
    When I enter a trade name
    Then the trade name should be saved
    And the trade name should be optional

  Scenario: Configure fiscal address
    Given I am in the fiscal configuration modal
    When I enter fiscal address information:
      | Street |
      | Exterior Number |
      | Interior Number (optional) |
      | Neighborhood |
      | City |
      | State |
      | ZIP Code |
    Then all address fields should be saved
    And required fields should be validated
    And ZIP code should be numeric (max 5 digits)

  Scenario: Select fiscal regime
    Given I am in the fiscal configuration modal
    When I view the fiscal regime selector
    Then I should see a list of available fiscal regimes
    And each regime should show code and name
    And I should be able to select a regime
    When I select a fiscal regime
    Then the regime should be saved
    And the regime name should be displayed in the selected language

  Scenario: Configure contact information
    Given I am in the fiscal configuration modal
    When I enter email and phone
    Then the email should be validated
    And the phone should be saved
    And both fields should be required

  Scenario: Save fiscal configuration
    Given I am in the fiscal configuration modal
    And I have filled all required fields
    When I tap "Contact Developer" (WhatsApp button)
    Then the configuration should be validated
    And if valid, WhatsApp should open with pre-filled message
    And the configuration data should be included in the message

  Scenario: Validate fiscal configuration
    Given I am in the fiscal configuration modal
    When I try to contact developer without required fields
    Then I should see a validation error
    And the required fields should be highlighted
    And WhatsApp should not open

  Scenario: Fiscal configuration persistence
    Given I have configured fiscal data
    When I close and reopen the application
    Then the fiscal configuration should be preserved
    And the configuration should load correctly
    And the status banner should show "Configured"

  Scenario: View fiscal configuration status
    Given I am on the Taxes screen
    When I view the status banner
    Then I should see "Tax Data: Configured" if data exists
    And I should see "Tax Data: Not Configured" if data is missing
    And the banner should have appropriate color coding

  # ============================================
  # INVOICE HISTORY
  # ============================================

  Scenario: View invoice history
    Given I am on the Taxes screen
    When I tap on the "History" tab
    Then I should see the invoice history section
    And I should see invoice type filters
    And I should see a list of invoices (if any exist)

  Scenario: Display invoice list
    Given I have invoices in the system
    When I view the invoice history
    Then I should see all invoices with eInvoice data
    And each invoice should show:
      | Invoice Number |
      | Date |
      | Customer Name |
      | Total Amount |
      | Tax ID (RFC) |

  Scenario: Filter invoices by type
    Given I have invoices in the system
    When I am on the History tab
    Then I should see invoice type tabs:
      | Income |
      | Credit Notes |
      | Cancellation |
      | Complements |
      | Expenses |
    When I tap on a specific type
    Then I should see only invoices of that type
    And the filter should update correctly

  Scenario: View invoice details
    Given I have invoices in the system
    When I tap on an invoice in the list
    Then a detail modal should open
    And I should see:
      | Invoice Information (number, date, total) |
      | Business Information (name, RFC, address) |
      | Customer Information (name, email, phone) |
      | Items list with quantities and prices |

  Scenario: Empty invoice history
    Given I have no invoices in the system
    When I view the invoice history
    Then I should see an empty state message
    And I should see an appropriate icon
    And I should see a message explaining that invoices will appear after creating CFDI invoices

  Scenario: Refresh invoice history
    Given I am on the invoice history tab
    When I pull down to refresh
    Then the invoice list should reload
    And new invoices should appear if available
    And the refresh indicator should show

  Scenario: Invoice history persistence
    Given I have invoices in the system
    When I close and reopen the application
    Then the invoice history should be preserved
    And invoices should load correctly
    And all invoice data should be intact

  # ============================================
  # FISCAL REGIMES
  # ============================================

  Scenario: View available fiscal regimes
    Given I am in the fiscal configuration modal
    When I view the fiscal regime selector
    Then I should see a scrollable list of fiscal regimes
    And each regime should display:
      | Code (e.g., 601, 603) |
      | Name (translated) |
    And the list should include all available regimes

  Scenario: Select fiscal regime
    Given I am in the fiscal configuration modal
    When I tap on a fiscal regime option
    Then the regime should be selected
    And the selected regime should be highlighted
    And the regime code should be saved

  Scenario: Fiscal regime translations
    Given I am in the fiscal configuration modal
    And the application language is Spanish
    When I view the fiscal regime list
    Then all regime names should be in Spanish
    When I change the language to English
    Then all regime names should update to English

  Scenario: Default fiscal regime
    Given I am in the fiscal configuration modal
    When I first open the modal
    Then the default fiscal regime should be selected (601 - General Law of Legal Entities)
    And the regime should be pre-selected

  # ============================================
  # WHATSAPP INTEGRATION
  # ============================================

  Scenario: Contact developer via WhatsApp
    Given I am in the fiscal configuration modal
    And I have filled all required fields
    When I tap "Contact Developer"
    Then WhatsApp should open
    And the message should be pre-filled with:
      | Header message |
      | RFC |
      | Legal Name |
      | Trade Name (if provided) |
      | Fiscal Address |
      | Fiscal Regime |
      | Contact Information |
      | Footer message |

  Scenario: Handle WhatsApp not available
    Given I am in the fiscal configuration modal
    And WhatsApp is not installed
    When I tap "Contact Developer"
    Then I should see an error message
    And I should see the phone number to contact manually
    And the modal should remain open

  Scenario: WhatsApp message formatting
    Given I am in the fiscal configuration modal
    And I have filled all fields
    When I tap "Contact Developer"
    Then the WhatsApp message should be properly formatted
    And all data should be clearly presented
    And the message should be URL-encoded correctly

  # ============================================
  # TAX CALCULATION IN DIFFERENT CONTEXTS
  # ============================================

  Scenario: Calculate tax in cart
    Given I have items in my cart
    And tax rate is configured
    When I view the cart
    Then the subtotal should be calculated (sum of all items)
    And the tax should be calculated on subtotal
    And the total should be subtotal + tax
    And all amounts should be displayed with proper formatting

  Scenario: Calculate tax in sales
    Given I complete a sale
    And tax rate is configured
    When the sale is processed
    Then the sale record should include:
      | Subtotal |
      | Tax amount |
      | Total |
    And the ticket should display tax information
    And the eInvoice should include tax calculations

  Scenario: Calculate tax for weight-based products
    Given I have weight-based products in my cart
    And tax rate is configured
    When I view the cart
    Then the tax should be calculated on the total including weight-based items
    And decimal quantities should be handled correctly
    And the tax calculation should be accurate

  Scenario: Calculate tax for products with variants
    Given I have products with variants in my cart
    And tax rate is configured
    When I view the cart
    Then the tax should be calculated on the final price (including variant modifiers)
    And the tax calculation should be accurate

  # ============================================
  # INTERNATIONALIZATION
  # ============================================

  Scenario: Display taxes screen in Spanish
    Given the application language is set to Spanish
    When I view the Taxes screen
    Then all labels should be in Spanish
    And all messages should be in Spanish
    And fiscal regime names should be in Spanish

  Scenario: Display taxes screen in English
    Given the application language is set to English
    When I view the Taxes screen
    Then all labels should be in English
    And all messages should be in English
    And fiscal regime names should be in English

  Scenario: Language switching updates taxes display
    Given I am on the Taxes screen
    And the current language is English
    When I change the application language to Spanish
    Then all labels should update to Spanish
    And all text should be properly translated
    And fiscal regime names should update

  # ============================================
  # ERROR HANDLING
  # ============================================

  Scenario: Handle invalid tax rate
    Given I am on the Tax Rate tab
    When I enter an invalid tax rate
    And I try to save
    Then I should see an appropriate error message
    And the tax rate should not be saved
    And I should be able to correct the input

  Scenario: Handle missing fiscal configuration
    Given I have not configured fiscal data
    When I view the Configuration tab
    Then I should see "Not Configured" status
    And I should see a button to configure
    And the status banner should indicate missing configuration

  Scenario: Handle invoice loading errors
    Given I am on the invoice history tab
    When an error occurs loading invoices
    Then I should see an error message
    And I should be able to retry
    And the error should not crash the application

  # ============================================
  # DATA VALIDATION
  # ============================================

  Scenario: Validate RFC format
    Given I am in the fiscal configuration modal
    When I enter an RFC
    Then the RFC should be validated
    And invalid formats should be rejected or warned
    And the RFC should be converted to uppercase

  Scenario: Validate email format
    Given I am in the fiscal configuration modal
    When I enter an email
    Then the email should be validated
    And invalid email formats should be rejected
    And the email keyboard should be used

  Scenario: Validate ZIP code format
    Given I am in the fiscal configuration modal
    When I enter a ZIP code
    Then the ZIP code should be numeric
    And the ZIP code should be limited to 5 digits
    And the numeric keyboard should be used

  Scenario: Validate required fields
    Given I am in the fiscal configuration modal
    When I try to contact developer
    And required fields are missing
    Then I should see validation errors
    And required fields should be highlighted
    And I should not be able to proceed

  # ============================================
  # USER EXPERIENCE
  # ============================================

  Scenario: Navigate between tax tabs
    Given I am on the Taxes screen
    When I tap on different tabs:
      | History |
      | Tax Rate |
      | Configuration |
    Then the appropriate content should be displayed
    And the active tab should be highlighted
    And the tab icons should change color

  Scenario: View tax configuration summary
    Given I am on the Configuration tab
    When I view the configuration card
    Then I should see a summary of:
      | RFC |
      | Legal Name |
      | Fiscal Regime |
    And I should see an option to edit

  Scenario: Responsive tax screen layout
    Given I am on the Taxes screen
    When I view the screen on different device sizes
    Then the layout should be responsive
    And all information should be visible
    And the interface should be usable

