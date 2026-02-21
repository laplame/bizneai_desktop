Feature: Shopping Cart Management System
  As a cashier
  I want to manage the shopping cart
  So that I can process customer orders accurately and efficiently

  Background:
    Given the POS system is initialized
    And the cart is empty
    And products are available in the catalog
    And I have appropriate permissions

  # ============================================
  # ADDING ITEMS TO CART
  # ============================================

  Scenario: Add single item to cart
    Given I am on the POS screen
    When I tap on a product
    Then the product should be added to the cart
    And the cart count should show "1"
    And the product should appear in the cart summary

  Scenario: Add multiple quantities of same item
    Given I am on the POS screen
    When I tap on a product multiple times
    Then the quantity should increase for that item
    And the cart count should reflect total items
    And the item total should be quantity × price

  Scenario: Add different items to cart
    Given I am on the POS screen
    When I add multiple different products
    Then each product should appear as separate line items
    And the cart count should show total items
    And the cart total should be sum of all items

  Scenario: Add weighted product to cart
    Given I am on the POS screen
    And I select a weight-based product
    When I tap on the product
    Then I should be prompted to enter the weight
    And I enter a valid weight
    Then the product should be added to cart with calculated price
    And the price should be based on weight × unit price

  Scenario: Add product with variants to cart
    Given I am on the POS screen
    And I select a product with variants
    When I tap on the product
    Then I should be prompted to select variants
    And I select all required variants
    Then the product should be added to cart with variant information
    And the price should include variant modifiers

  Scenario: Add product with both variants and weight
    Given I am on the POS screen
    And I select a product with both variants and weight-based sales
    When I tap on the product
    Then I should first be prompted to select variants
    And after selecting variants, I should be prompted to enter weight
    Then the product should be added to cart with both variant and weight information

  Scenario: Check inventory before adding to cart
    Given I am on the POS screen
    And a product has limited stock
    When I try to add more items than available stock
    Then I should see a low stock alert
    And the system should prevent adding more than available
    And I should be able to add up to the available quantity

  # ============================================
  # VIEWING CART CONTENTS
  # ============================================

  Scenario: View cart contents
    Given I have items in my cart
    When I tap on the cart button
    Then I should see all cart items
    And each item should show:
      | Name |
      | Quantity |
      | Unit Price |
      | Item Total |
    And I should see cart totals

  Scenario: View cart details
    Given I have items in my cart
    When I tap on the cart button
    Then I should see all cart items
    And each item should show name, quantity, and price
    And I should see subtotal, tax, and total amounts

  Scenario: Handle empty cart
    Given the cart is empty
    When I tap on the cart button
    Then I should see "Your cart is empty" message
    And I should see "Start to Sell" button
    And I should not see checkout options

  Scenario: Display cart count badge
    Given I have items in my cart
    When I view the POS screen
    Then I should see a cart count badge
    And the badge should show the total number of items
    And the badge should update when items are added or removed

  # ============================================
  # MODIFYING CART ITEMS
  # ============================================

  Scenario: Increase item quantity
    Given I have items in my cart
    When I tap the "+" button for an item
    Then the quantity should increase by 1
    And the item total should update
    And the cart total should recalculate

  Scenario: Decrease item quantity
    Given I have items in my cart
    And an item has quantity greater than 1
    When I tap the "-" button for an item
    Then the quantity should decrease by 1
    And the item total should update
    And the cart total should recalculate

  Scenario: Modify cart quantities
    Given I have items in my cart
    When I tap on the quantity controls for an item
    Then the quantity should increase or decrease
    And the item total should update accordingly
    And the cart total should recalculate

  Scenario: Remove item when quantity is 1
    Given I have items in my cart
    And an item has quantity of 1
    When I tap the "-" button for that item
    Then the item should be removed from the cart
    And the cart count should decrease
    And the cart total should update

  Scenario: Remove item directly
    Given I have items in my cart
    When I tap the "Remove" button for an item
    Then the item should be removed from the cart
    And the cart count should decrease
    And the cart total should update

  Scenario: Remove item from cart
    Given I have items in my cart
    When I tap the remove button for an item
    Then the item should be removed from the cart
    And the cart total should update
    And the cart count should decrease

  Scenario: Clear entire cart
    Given I have items in my cart
    When I tap the "Clear Cart" button
    Then all items should be removed
    And the cart should be empty
    And the cart count should be zero
    And I should return to the product catalog

  Scenario: Clear entire cart with confirmation
    Given I have items in my cart
    When I tap the "Clear Cart" button
    Then I should see a confirmation dialog
    And when I confirm
    Then all items should be removed from the cart
    And the cart should be empty
    And the cart count should be zero

  # ============================================
  # CART CALCULATIONS
  # ============================================

  Scenario: Calculate cart totals
    Given I have items in my cart
    When I view the cart
    Then I should see:
      | Subtotal (excl. tax) |
      | Tax amount |
      | Total (incl. tax) |
    And the totals should be calculated correctly

  Scenario: Calculate item totals
    Given I have items in my cart
    When I view the cart
    Then each item should show:
      | Unit price |
      | Quantity |
      | Item total (price × quantity) |
    And item totals should be calculated correctly

  Scenario: Calculate tax on cart
    Given I have items in my cart
    And tax rate is configured
    When I view the cart
    Then I should see the tax amount
    And the tax should be calculated on the subtotal
    And the total should include tax

  Scenario: Handle zero tax rate
    Given I have items in my cart
    And tax rate is set to 0
    When I view the cart
    Then I should see subtotal equals total
    And tax amount should be zero

  # ============================================
  # WEIGHT-BASED PRODUCTS IN CART
  # ============================================

  Scenario: Handle weight-based products
    Given I have weight-based products in my cart
    When I view the cart
    Then I should see weight information
    And I should see price per unit
    And I should see calculated total price

  Scenario: Display weight-based quantities
    Given I have weight-based products in my cart
    When I view the cart
    Then weight-based products should show quantities with 2 decimal places
    And quantities should be displayed as "X.XX kg" or similar format
    And regular products should show integer quantities

  Scenario: Adjust weight-based product quantity
    Given I have a weight-based product in my cart
    When I adjust the quantity
    Then I should be able to enter decimal values
    And the quantity input should use decimal-pad keyboard
    And the total should recalculate based on new weight

  Scenario: Quick add weight to weight-based product
    Given I have a weight-based product in my cart
    When I tap "Quick Add" for the product
    Then I should see quick weight presets (0.25kg, 0.5kg, 1kg, etc.)
    And I should be able to enter custom weight
    And the weight should be added to the current quantity

  # ============================================
  # PRODUCT VARIANTS IN CART
  # ============================================

  Scenario: Display products with variants in cart
    Given I have products with variants in my cart
    When I view the cart
    Then I should see variant information displayed
    And the product name should include variant details
    And the price should reflect variant modifiers

  Scenario: Edit variant selection in cart
    Given I have a product with variants in my cart
    When I tap to edit the product
    Then I should be able to change variant selection
    And the price should update based on new variants
    And the cart total should recalculate

  # ============================================
  # CUSTOMER INFORMATION
  # ============================================

  Scenario: Add customer information
    Given I have items in my cart
    When I tap on the cart button
    Then I should be able to enter customer name
    And I should be able to enter table number
    And I should be able to add order notes

  Scenario: Save customer information
    Given I have items in my cart
    And I have entered customer information
    When I proceed to checkout
    Then the customer information should be saved with the order
    And the information should appear in the sale record

  Scenario: Add order notes
    Given I have items in my cart
    When I view the cart
    Then I should be able to add order notes
    And the notes should be saved with the order
    And the notes should appear in the sale and ticket

  # ============================================
  # CHECKOUT OPTIONS
  # ============================================

  Scenario: Proceed to checkout
    Given I have items in my cart
    When I tap "Proceed to Checkout"
    Then I should see checkout options:
      | Pay Now |
      | Add to Waitlist |
      | Cancel |
    And I should see order summary

  Scenario: Show checkout options dialog
    Given I have items in my cart
    When I tap "Proceed to Checkout"
    Then I should see a dialog with options
    And I should be able to choose payment method
    And I should be able to add to waitlist
    And I should be able to cancel

  # ============================================
  # PAYMENT PROCESSING
  # ============================================

  Scenario: Process cash payment
    Given I have items in my cart
    And the total amount is calculated
    When I select "Cash" payment method
    And I proceed to checkout
    Then the sale should be recorded
    And the cart should be cleared
    And I should return to the product catalog
    And I should see a success message

  Scenario: Process card payment
    Given I have items in my cart
    And the total amount is calculated
    When I select "Card" payment method
    And I proceed to checkout
    Then the sale should be recorded
    And the cart should be cleared
    And I should return to the product catalog
    And I should see a success message

  Scenario: Process crypto payment
    Given I have items in my cart
    And the total amount is calculated
    And crypto wallet is configured
    When I select "Crypto" payment method
    Then I should see QR code for payment
    And I should see the crypto address
    And I should be able to scan the QR code
    When I proceed to checkout
    Then the sale should be recorded
    And the cart should be cleared
    And I should return to the product catalog

  Scenario: Process mixed payment
    Given I have items in my cart
    And the total amount is calculated
    When I select "Mixed" payment method
    Then I should be able to enter amounts for:
      | Cash |
      | Card |
      | Crypto |
    And the total of all payment methods should equal the cart total
    When I proceed to checkout
    Then the sale should be recorded with mixed payment information
    And the cart should be cleared

  Scenario: Fill payment amounts automatically
    Given I have items in my cart
    And I select "Mixed" payment method
    When I tap "Fill Cash" button
    Then the cash amount should be set to the total
    And other amounts should be set to zero
    When I tap "Fill Card" button
    Then the card amount should be set to the total
    And cash amount should be reset to zero

  Scenario: Validate mixed payment totals
    Given I have items in my cart
    And I select "Mixed" payment method
    When I enter payment amounts that don't equal the total
    Then I should see a validation error
    And I should not be able to proceed until amounts match total
    When I adjust amounts to equal the total
    Then I should be able to proceed

  Scenario: Select cryptocurrency for payment
    Given I have items in my cart
    And I select "Crypto" payment method
    When I view the crypto payment screen
    Then I should see available cryptocurrencies:
      | Bitcoin |
      | Ethereum |
      | Solana |
    And I should be able to select a cryptocurrency
    And the QR code should update for the selected crypto

  Scenario: Handle unconfigured crypto address
    Given I have items in my cart
    And I select "Crypto" payment method
    And no crypto address is configured
    When I view the crypto payment screen
    Then I should see "Address not configured" message
    And I should see option to configure address
    And I should not be able to proceed until address is configured

  Scenario: Generate QR code for crypto payment
    Given I have items in my cart
    And I select "Crypto" payment method
    And a crypto address is configured
    When I view the crypto payment screen
    Then a QR code should be generated
    And the QR code should contain the payment address
    And the QR code should be scannable

  Scenario: Prevent duplicate payment processing
    Given I have items in my cart
    And I am processing a payment
    When I tap the payment button multiple times
    Then only one payment should be processed
    And duplicate payments should be prevented
    And I should see a processing indicator

  # ============================================
  # WAITLIST INTEGRATION
  # ============================================

  Scenario: Add to waitlist
    Given I have items in my cart
    When I tap "Add to Waitlist"
    Then I should see waitlist modal
    And I should be able to enter customer name
    When I confirm adding to waitlist
    Then the order should be added to the waitlist
    And the cart should be cleared
    And I should see confirmation message

  Scenario: Add to waitlist with customer information
    Given I have items in my cart
    When I tap "Add to Waitlist"
    And I enter customer name
    And I add order notes
    When I confirm
    Then the order should be added to waitlist with customer information
    And the cart should be cleared

  Scenario: Cancel waitlist addition
    Given I have items in my cart
    When I tap "Add to Waitlist"
    And I tap "Cancel"
    Then the waitlist modal should close
    And the cart should remain unchanged
    And I should return to the cart screen

  # ============================================
  # KITCHEN INTEGRATION
  # ============================================

  Scenario: Send to kitchen
    Given I have items in my cart
    When I tap "Send to Kitchen"
    Then the order should be sent to kitchen
    And the cart should be cleared
    And I should see confirmation message

  # ============================================
  # CART VALIDATION
  # ============================================

  Scenario: Validate cart before checkout
    Given I have items in my cart
    When I attempt to checkout
    Then the system should validate:
      | All items have valid prices |
      | Quantities are positive numbers |
      | Cart total is calculated correctly |
    And I should be able to proceed if validation passes

  Scenario: Validate empty cart checkout
    Given the cart is empty
    When I attempt to checkout
    Then I should see an error message
    And I should not be able to proceed
    And I should be prompted to add items

  Scenario: Validate inventory before checkout
    Given I have items in my cart
    When I attempt to checkout
    Then the system should check inventory for all items
    And if any item is out of stock, I should see an alert
    And I should not be able to proceed until inventory is available

  # ============================================
  # CART PERSISTENCE
  # ============================================

  Scenario: Save cart for later
    Given I have items in my cart
    When I navigate away from the POS
    Then the cart should be preserved
    And I should be able to return to the same cart
    And the cart should persist across app sessions

  Scenario: Load saved cart
    Given I have a saved cart
    When I return to the POS
    Then the cart should be restored
    And all items should be displayed correctly
    And quantities should be preserved

  Scenario: Persist cart across app restarts
    Given I have items in my cart
    When I close the application
    And I reopen the application
    Then the cart should be restored
    And all items should be present
    And quantities should be correct

  # ============================================
  # INVENTORY INTEGRATION
  # ============================================

  Scenario: Check inventory before adding to cart
    Given I am on the POS screen
    And a product has limited stock
    When I try to add the product to cart
    Then the system should check available inventory
    And if stock is available, the product should be added
    And if stock is insufficient, I should see a low stock alert

  Scenario: Update inventory after sale
    Given I have items in my cart
    And I complete a sale
    Then the inventory should be updated for all sold items
    And stock levels should decrease by the sold quantities
    And the inventory should reflect the changes immediately

  Scenario: Handle inventory updates during checkout
    Given I have items in my cart
    And another user is making sales
    When I proceed to checkout
    Then the system should check current inventory
    And if inventory changed, I should be notified
    And I should be able to adjust quantities or cancel

  Scenario: Quick add inventory from cart
    Given I have items in my cart
    When I view an item in the cart
    And I tap "Quick Add Inventory"
    Then I should be able to add stock to that product
    And the inventory should be updated
    And the cart should reflect updated stock availability

  # ============================================
  # ERROR HANDLING
  # ============================================

  Scenario: Handle payment processing errors
    Given I have items in my cart
    When I process a payment
    And an error occurs during payment processing
    Then I should see an error message
    And the cart should not be cleared
    And I should be able to retry the payment

  Scenario: Handle sale recording errors
    Given I have items in my cart
    When I complete a payment
    And sale recording fails
    Then I should see an error message
    And the cart should be preserved
    And I should be able to retry

  Scenario: Handle inventory update errors
    Given I have items in my cart
    When I complete a payment
    And inventory update fails
    Then the sale should still be recorded
    And I should see a warning about inventory
    And I should be able to manually update inventory

  # ============================================
  # USER EXPERIENCE
  # ============================================

  Scenario: Display loading states
    Given I have items in my cart
    When I process a payment
    Then I should see a loading indicator
    And the payment button should show "Processing..."
    And I should not be able to interact during processing

  Scenario: Show success feedback
    Given I have items in my cart
    When I complete a payment successfully
    Then I should see a success message
    And the cart should be cleared
    And I should return to the POS screen

  Scenario: Display order summary
    Given I have items in my cart
    When I view the cart
    Then I should see an order summary showing:
      | List of items |
      | Quantities |
      | Prices |
      | Subtotal |
      | Tax |
      | Total |

  Scenario: Responsive cart display
    Given I have items in my cart
    When I view the cart on different screen sizes
    Then the cart should be displayed appropriately
    And all information should be visible
    And the layout should be usable

  # ============================================
  # INTERNATIONALIZATION
  # ============================================

  Scenario: Display cart in Spanish
    Given the application language is set to Spanish
    And I have items in my cart
    When I view the cart
    Then I should see "Carrito de Compras" as the title
    And all labels should be in Spanish
    And all messages should be in Spanish

  Scenario: Display cart in English
    Given the application language is set to English
    And I have items in my cart
    When I view the cart
    Then I should see "Shopping Cart" as the title
    And all labels should be in English
    And all messages should be in English

  Scenario: Language switching updates cart display
    Given I have items in my cart
    And the current language is English
    When I change the application language to Spanish
    Then the cart labels should update to Spanish
    And all text should be properly translated

