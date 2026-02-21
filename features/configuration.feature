Feature: Configuration Management
  As a restaurant owner
  I want to configure app settings and business information
  So that the system works according to my business needs

  # IMPLEMENTATION STATUS: ✅ COMPLETED
# Last Updated: October 2025
  # Features: Store info, business settings, payment methods, tax settings, AI config, security settings

  Background:
    Given the configuration system is initialized
    And I am logged in as an administrator
    And I have appropriate permissions

  Scenario: View configuration screen
    Given I am on the main menu
    When I tap "Configuration"
    Then I should see the configuration screen
    And I should see all configuration sections:
      | Store Information |
      | Business Settings |
      | Payment Settings |
      | Tax Settings |
      | AI Settings |
      | Security Settings |

  # --- UnifiedConfiguration.tsx Additions (2025-10) ---

  Scenario: View server sync status and Shop ID
    Given I am on the configuration screen
    Then I should see server sync status with:
      | Synced flag |
      | Shop ID |
      | Last sync |

  Scenario: Manually sync store configuration to server
    When I press "Sync to Server"
    Then the store configuration should be sent to the server
    And the form should reload with server values
    And I should see a success message with the Shop ID

  Scenario: Test API connection from configuration
    When I press "Test Connection"
    Then the app should attempt to reach the API health endpoint
    And I should see a status dialog with response time

  Scenario: Load store data by shop URL
    When I press "Load Shop Data from URL"
    And I enter a valid shop URL
    Then the configuration form should be populated with server data
    And GPS coordinates should be mapped correctly

  Scenario: Select store type from server list with fallback
    When I open "Store Type" selector
    Then I should see server store types when available
    And I should see a comprehensive fallback list when the server is not available

  Scenario: Capture GPS coordinates for store
    When I press "Get Current Location"
    And I grant location permission
    Then latitude and longitude should be saved in configuration

  Scenario: Enable eCommerce and display URL
    When I enable eCommerce
    Then I should see my store URL
    And I can copy the URL to clipboard

  Scenario: Toggle crypto payments globally for eCommerce
    Given eCommerce is enabled
    When I enable crypto payments for eCommerce
    Then I should see configured crypto methods listed

  Scenario Outline: Configure a crypto address with validation and QR
    When I select <crypto>
    And I enter a valid <address>
    And I press "Save <crypto> Address"
    Then the address should be saved and enabled for eCommerce
    And the QR code should be generated
    And I can save the QR to Photos

    Examples:
      | crypto    | address                                        |
      | Bitcoin   | 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa            |
      | Ethereum  | 0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6    |
      | Solana    | 7YyqVqv3i7c7JtHcL9jvZQ8xw3z2J2JtX6z2h5i3Q1h   |

  Scenario: See a summary of configured crypto methods
    Then I should see each crypto marked as "Configured" or "Not Set"

  Scenario: Manage security passcode
    When I enable passcode lock
    And I set a new passcode and confirm it
    Then the passcode should be updated
    And I can reset to default 1234

  Scenario: Configure BizneAI chat with OpenAI API key
    When I enter my OpenAI API key
    And I press "Save OpenAI API Key"
    Then BizneAI chat should be enabled

  Scenario: Add sample products automatically when empty
    Given the products database is empty
    When I open the configuration screen
    Then sample products should be added automatically

  Scenario: Add sample products from configuration
    When I press "Add Sample Products"
    Then 9 sample products should be added with images

  Scenario: Update product images for existing sample products
    When I press "Update Product Images"
    Then products missing images should be updated with Unsplash photos

  Scenario: Export all app data as JSON
    When I press "Export Data"
    Then a JSON export should be generated with total records and filename

  Scenario: Reset setup wizard from configuration
    When I press "Reset Setup Wizard"
    Then I should see a confirmation dialog
    And after confirming, my configuration should be reset

  Scenario: Clear all application data
    When I press "Clear All Data"
    Then I should see a destructive confirmation
    And after confirming, all local data should be removed

  Scenario: Contact developer via WhatsApp
    When I press "Contact Developer"
    Then WhatsApp should open with a prefilled message

  Scenario: Configure store information
    Given I am on the configuration screen
    When I tap "Store Information"
    Then I should be able to set:
      | Store name |
      | Store location |
      | Street address |
      | City |
      | State |
      | ZIP code |
      | Store type |
      | GPS coordinates |
    And I should be able to save the information

  Scenario: Set store name
    Given I am on the store information section
    When I enter store name "My Coffee Shop"
    And I tap "Save"
    Then the store name should be saved
    And I should see success message
    And the store name should appear throughout the app

  Scenario: Set store location
    Given I am on the store information section
    When I enter location "Downtown Location"
    And I tap "Save"
    Then the location should be saved
    And I should see success message
    And the location should be used in reports

  Scenario: Set store address
    Given I am on the store information section
    When I enter address details:
      | Street: "123 Main Street" |
      | City: "New York" |
      | State: "NY" |
      | ZIP: "10001" |
    And I tap "Save"
    Then the address should be saved
    And I should see success message
    And the address should be used in receipts

  Scenario: Set store type
    Given I am on the store information section
    When I select store type "Coffee Shop"
    And I tap "Save"
    Then the store type should be saved
    And I should see success message
    And the store type should affect product categories

  Scenario: Set GPS location
    Given I am on the store information section
    When I tap "Set GPS Location"
    And I allow location access
    Then the GPS coordinates should be captured
    And I should see the coordinates displayed
    And the location should be saved

  Scenario: Configure business settings
    Given I am on the configuration screen
    When I tap "Business Settings"
    Then I should be able to configure:
      | Business hours |
      | Time zone |
      | Currency |
      | Language |
      | Date format |
      | Number format |
    And I should be able to save the settings

  Scenario: Set business hours
    Given I am on the business settings section
    When I set business hours:
      | Monday: 8:00 AM - 6:00 PM |
      | Tuesday: 8:00 AM - 6:00 PM |
      | Wednesday: 8:00 AM - 6:00 PM |
      | Thursday: 8:00 AM - 6:00 PM |
      | Friday: 8:00 AM - 8:00 PM |
      | Saturday: 9:00 AM - 8:00 PM |
      | Sunday: 10:00 AM - 4:00 PM |
    And I tap "Save"
    Then the business hours should be saved
    And I should see success message

  Scenario: Set time zone
    Given I am on the business settings section
    When I select time zone "Eastern Time (ET)"
    And I tap "Save"
    Then the time zone should be saved
    And I should see success message
    And all times should be displayed in the selected time zone

  Scenario: Set currency
    Given I am on the business settings section
    When I select currency "USD ($)"
    And I tap "Save"
    Then the currency should be saved
    And I should see success message
    And all prices should be displayed in the selected currency

  Scenario: Configure payment settings
    Given I am on the configuration screen
    When I tap "Payment Settings"
    Then I should be able to configure:
      | Accepted payment methods |
      | Cash payment settings |
      | Card payment settings |
      | Crypto payment settings |
      | Payment processing fees |
    And I should be able to save the settings

  Scenario: Enable payment methods
    Given I am on the payment settings section
    When I enable payment methods:
      | Cash: Enabled |
      | Card: Enabled |
      | Crypto: Enabled |
    And I tap "Save"
    Then the payment methods should be enabled
    And I should see success message
    And the payment methods should be available in POS

  Scenario: Configure crypto payments
    Given I am on the payment settings section
    When I tap "Crypto Settings"
    Then I should be able to set:
      | Bitcoin address |
      | Ethereum address |
      | Solana address |
      | Crypto payment instructions |
    And I should be able to save the settings

  Scenario: Set crypto addresses
    Given I am on the crypto settings section
    When I enter:
      | Bitcoin: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa" |
      | Ethereum: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6" |
    And I tap "Save"
    Then the crypto addresses should be saved
    And I should see success message
    And the addresses should be used for crypto payments

  Scenario: Configure tax settings
    Given I am on the configuration screen
    When I tap "Tax Settings"
    Then I should be able to configure:
      | Tax rate |
      | Tax calculation method |
      | Tax-inclusive pricing |
      | Tax exemptions |
      | Tax reporting |
    And I should be able to save the settings

  Scenario: Set tax rate
    Given I am on the tax settings section
    When I set tax rate to "8.5%"
    And I tap "Save"
    Then the tax rate should be saved
    And I should see success message
    And taxes should be calculated using this rate

  Scenario: Configure tax calculation
    Given I am on the tax settings section
    When I select tax calculation method "Tax-inclusive"
    And I tap "Save"
    Then the tax calculation method should be saved
    And I should see success message
    And prices should be displayed including tax

  Scenario: Configure AI settings
    Given I am on the configuration screen
    When I tap "AI Settings"
    Then I should be able to configure:
      | OpenAI API key |
      | AI response style |
      | AI context preferences |
      | AI notification settings |
    And I should be able to save the settings

  Scenario: Set OpenAI API key
    Given I am on the AI settings section
    When I enter OpenAI API key "sk-..."
    And I tap "Save"
    Then the API key should be saved
    And I should see success message
    And the AI assistant should be enabled

  Scenario: Configure AI preferences
    Given I am on the AI settings section
    When I set AI preferences:
      | Response style: "Professional" |
      | Detail level: "Detailed" |
      | Notifications: "Enabled" |
    And I tap "Save"
    Then the AI preferences should be saved
    And I should see success message

  Scenario: Configure security settings
    Given I am on the configuration screen
    When I tap "Security Settings"
    Then I should be able to configure:
      | Passcode lock |
      | Session timeout |
      | Data encryption |
      | Backup settings |
      | Access controls |
    And I should be able to save the settings

  Scenario: Enable passcode lock
    Given I am on the security settings section
    When I enable passcode lock
    And I set passcode "1234"
    And I tap "Save"
    Then the passcode lock should be enabled
    And I should see success message
    And the app should require passcode to access

  Scenario: Set session timeout
    Given I am on the security settings section
    When I set session timeout to "30 minutes"
    And I tap "Save"
    Then the session timeout should be saved
    And I should see success message
    And users should be logged out after 30 minutes of inactivity

  Scenario: Configure data backup
    Given I am on the security settings section
    When I tap "Backup Settings"
    Then I should be able to configure:
      | Automatic backup frequency |
      | Backup location |
      | Data retention period |
      | Backup encryption |
    And I should be able to save the settings

  Scenario: Set automatic backup
    Given I am on the backup settings section
    When I enable automatic backup
    And I set frequency to "Daily"
    And I tap "Save"
    Then automatic backup should be enabled
    And I should see success message
    And backups should be created daily

  Scenario: Export configuration
    Given I am on the configuration screen
    When I tap "Export Configuration"
    Then I should be able to:
      | Select which settings to export |
      | Choose export format |
      | Download the configuration file |
    And the export should include all selected settings

  Scenario: Import configuration
    Given I am on the configuration screen
    When I tap "Import Configuration"
    Then I should be able to:
      | Select configuration file |
      | Preview imported settings |
      | Confirm import |
    And the configuration should be imported successfully

  Scenario: Reset configuration
    Given I am on the configuration screen
    When I tap "Reset Configuration"
    Then I should see confirmation dialog
    And I should be able to:
      | Reset to defaults |
      | Reset specific sections |
      | Cancel the reset |
    And I should confirm the action

  Scenario: Validate configuration
    Given I am on the configuration screen
    When I tap "Validate Configuration"
    Then the system should check:
      | Required fields are filled |
      | Settings are valid |
      | Dependencies are met |
      | No conflicts exist |
    And I should see validation results

  Scenario: Save configuration
    Given I am on the configuration screen
    And I have made changes
    When I tap "Save"
    Then the configuration should be saved
    And I should see success message
    And the changes should be applied immediately

  Scenario: Cancel configuration changes
    Given I am on the configuration screen
    And I have made changes
    When I tap "Cancel"
    Then I should see confirmation dialog
    And I should be able to:
      | Discard changes |
      | Continue editing |
    And changes should be discarded if confirmed

  Scenario: View configuration history
    Given I am on the configuration screen
    When I tap "Configuration History"
    Then I should see:
      | Previous configurations |
      | Change history |
      | Who made changes |
      | When changes were made |
    And I should be able to restore previous configurations

  Scenario: Backup configuration
    Given I am on the configuration screen
    When I tap "Backup Configuration"
    Then the system should:
      | Create backup of current configuration |
      | Include all settings |
      | Generate backup file |
      | Save backup securely |
    And I should be able to restore from backup
