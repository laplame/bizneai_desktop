Feature: Sales Management System
  As a business owner
  I want to manage sales, tickets, and sales analytics
  So that I can track transactions, generate reports, and make informed business decisions

  Background:
    Given the sales system is initialized
    And I am logged in with appropriate permissions
    And I have access to the Sales & Tickets screen

  # ============================================
  # SALES & TICKETS INTEGRATION
  # ============================================

  Scenario: Complete sales transaction with ticket creation
    Given I am on the POS screen
    And I have products available in the catalog
    When I add products to the cart
    And I proceed to checkout
    And I select a payment method
    And I complete the payment
    Then a sale should be saved to the sales database
    And a ticket should be created for the sale
    And the inventory should be updated for sold products
    And the cart should be cleared
    And I should see a success message with transaction details

  Scenario: Sales appear in Sales & Tickets view
    Given I have completed a sale transaction
    When I navigate to the Sales & Tickets screen
    Then I should see the new sale in the sales list
    And I should see the corresponding ticket in the tickets tab
    And the sale should show complete transaction details
    And the ticket should show order information

  Scenario: Sales filtering and search functionality
    Given I have multiple sales with different payment types
    When I am on the Sales & Tickets screen
    And I filter by payment type "cash"
    Then I should see only cash sales
    When I filter by payment type "card"
    Then I should see only card sales
    When I filter by payment type "crypto"
    Then I should see only crypto sales
    When I search by transaction ID
    Then I should see matching sales
    When I search by product name
    Then I should see sales containing that product

  Scenario: Ticket status management
    Given I have a ticket created from a sale
    When I am on the Sales & Tickets screen
    And I view the tickets tab
    And I tap on a ticket
    Then I should see ticket details
    And I should be able to update ticket status
    When I mark a ticket as "completed"
    Then the ticket status should be updated
    And the change should be saved to the database

  Scenario: E-Invoice generation
    Given I have a completed sale
    When I am on the Sales & Tickets screen
    And I tap on a sale
    And I tap "Generate E-Invoice"
    Then an electronic invoice should be generated
    And the invoice should contain business information
    And the invoice should contain customer information
    And the invoice should contain item details
    And the invoice should contain tax calculations

  Scenario: Real-time data refresh
    Given I am on the Sales & Tickets screen
    When I complete a new sale from another screen
    And I return to the Sales & Tickets screen
    Then the sales list should be refreshed automatically
    And the tickets list should be refreshed automatically
    And I should see the new sale and ticket

  Scenario: Sales data persistence
    Given I have completed multiple sales
    When I close and reopen the application
    Then all sales should be preserved
    And all tickets should be preserved
    And the data should load correctly
    And the inventory should reflect all sales

  Scenario: Error handling in sales process
    Given I am completing a sale transaction
    When the ticket creation fails
    Then the sale should still be saved
    And I should see a success message
    And the inventory should still be updated
    When the inventory update fails
    Then the sale should still be saved
    And the ticket should still be created
    And I should see a success message

  Scenario: Sales with different payment methods
    Given I have products in my cart
    When I select "cash" payment method
    And I complete the payment
    Then the sale should be recorded with "cash" payment type
    When I add products to cart again
    And I select "card" payment method
    And I complete the payment
    Then the sale should be recorded with "card" payment type
    When I add products to cart again
    And I select "crypto" payment method
    And I complete the payment
    Then the sale should be recorded with "crypto" payment type

  Scenario: Sales with notes and customer information
    Given I have products in my cart
    When I add notes to the order
    And I complete the payment
    Then the sale should include the notes
    And the ticket should include the notes
    And the notes should be visible in the sales details

  Scenario: Multiple items in single sale
    Given I have multiple different products
    When I add multiple products to the cart
    And I set different quantities for each product
    And I complete the payment
    Then the sale should include all products
    And the ticket should include all products
    And the inventory should be updated for all products
    And the total should be calculated correctly

  Scenario: Sales with tax calculations
    Given I have products in my cart
    And tax rate is configured in settings
    When I complete the payment
    Then the sale should include tax calculations
    And the ticket should include tax information
    And the total should include tax amount
    And the subtotal should be calculated correctly

  # ============================================
  # SALES STATISTICS TAB
  # ============================================

  Scenario: View Sales Statistics Tab
    Given I am on the Sales & Tickets screen
    When I tap on the "Stats" tab
    Then I should see the statistics loading indicator
    And I should see the following key metrics:
      | Metric | Description |
      | Total Sales | Number of completed sales |
      | Total Revenue | Sum of all sale totals |
      | Average Order Value | Total revenue divided by sales count |
      | Total Tickets | Number of order tickets |
    And each metric should be displayed in a card with an icon
    And the metrics should be color-coded appropriately

  Scenario: View Payment Method Analytics
    Given I am on the Stats tab
    When the statistics have loaded
    Then I should see a "Sales by Payment Method" section
    And I should see breakdown by payment type:
      | Payment Method | Count |
      | Cash | Number of cash transactions |
      | Card | Number of card transactions |
      | Crypto | Number of crypto transactions |
    And each payment method should have a color indicator
    And the counts should be accurate based on actual sales data

  Scenario: View Top Products Performance
    Given I am on the Stats tab
    When the statistics have loaded
    Then I should see a "Top Products" section
    And I should see the top 5 products by quantity sold
    And for each product I should see:
      | Field | Description |
      | Product Name | Name of the product |
      | Quantity | Total quantity sold |
      | Revenue | Total revenue generated |
    And products should be sorted by quantity sold (highest first)
    And revenue should be calculated correctly

  Scenario: Statistics Auto-loading
    Given I am on the Sales tab
    When I switch to the Stats tab for the first time
    Then the statistics should load automatically
    And I should see a loading indicator
    And when loading completes, I should see all statistics
    And subsequent visits to the Stats tab should show cached data

  Scenario: Statistics Refresh
    Given I am on the Stats tab
    And statistics are already loaded
    When I perform a new sale transaction
    And I return to the Stats tab
    Then the statistics should reflect the new transaction
    And the metrics should be updated accordingly

  Scenario: Empty Statistics Display
    Given I am on the Stats tab
    And there are no sales in the system
    When the statistics load
    Then I should see zero values for all metrics
    And the payment method section should be empty
    And the top products section should be empty
    And no errors should be displayed

  Scenario: Statistics Loading Error Handling
    Given I am on the Stats tab
    When there is an error loading statistics
    Then I should see an appropriate error message
    And the loading indicator should disappear
    And I should be able to retry loading statistics

  Scenario: Statistics Data Accuracy
    Given I have sales data in the system
    When I view the Stats tab
    Then the total sales count should match actual sales records
    And the total revenue should match sum of all sale totals
    And the average order value should be calculated correctly
    And payment method counts should be accurate
    And top products should reflect actual sales data

  Scenario: Statistics Performance
    Given I have a large number of sales records
    When I navigate to the Stats tab
    Then the statistics should load within reasonable time
    And the interface should remain responsive
    And scrolling should be smooth
    And no performance issues should occur

  # ============================================
  # SALES REPORTING
  # ============================================

  Scenario: View sales dashboard
    Given I am on the sales screen
    When I view the dashboard
    Then I should see:
      | Today's sales total |
      | Sales count |
      | Average transaction value |
      | Top selling products |
      | Sales trends |
    And the data should be updated in real-time

  Scenario: View daily sales report
    Given I am on the sales screen
    When I select "Daily" report
    Then I should see:
      | Sales by hour |
      | Payment method breakdown |
      | Product sales summary |
      | Customer count |
      | Revenue total |
    And I should be able to select specific date

  Scenario: View weekly sales report
    Given I am on the sales screen
    When I select "Weekly" report
    Then I should see:
      | Sales by day of week |
      | Weekly trends |
      | Top performing days |
      | Product performance |
      | Revenue comparison |
    And I should be able to select specific week

  Scenario: View monthly sales report
    Given I am on the sales screen
    When I select "Monthly" report
    Then I should see:
      | Sales by day |
      | Monthly trends |
      | Growth indicators |
      | Seasonal patterns |
      | Revenue summary |
    And I should be able to select specific month

  Scenario: View custom date range report
    Given I am on the sales screen
    When I select "Custom Range"
    And I select start and end dates
    Then I should see:
      | Sales summary for selected period |
      | Daily breakdown |
      | Trends and patterns |
      | Comparison with previous period |
    And I should be able to adjust the date range

  Scenario: View sales by payment method
    Given I am on the sales screen
    When I select "Payment Methods" report
    Then I should see:
      | Cash sales total and percentage |
      | Card sales total and percentage |
      | Crypto sales total and percentage |
      | Payment method trends |
    And I should be able to drill down into each method

  Scenario: View top selling products
    Given I am on the sales screen
    When I select "Top Products" report
    Then I should see:
      | Product name |
      | Quantity sold |
      | Revenue generated |
      | Percentage of total sales |
      | Growth trend |
    And I should be able to sort by different metrics

  Scenario: View sales by category
    Given I am on the sales screen
    When I select "Category Sales" report
    Then I should see:
      | Sales by product category |
      | Category performance |
      | Category trends |
      | Revenue distribution |
    And I should be able to drill down into specific categories

  Scenario: View hourly sales analysis
    Given I am on the sales screen
    When I select "Hourly Analysis" report
    Then I should see:
      | Sales by hour of day |
      | Peak hours identification |
      | Hourly trends |
      | Staffing recommendations |
    And I should be able to compare different days

  Scenario: View customer analytics
    Given I am on the sales screen
    When I select "Customer Analytics" report
    Then I should see:
      | Customer count |
      | Average transaction value |
      | Customer frequency |
      | New vs returning customers |
      | Customer trends |
    And I should be able to segment customers

  Scenario: View staff performance
    Given I am on the sales screen
    When I select "Staff Performance" report
    Then I should see:
      | Sales by staff member |
      | Transaction count |
      | Average transaction value |
      | Performance trends |
    And I should be able to compare staff performance

  Scenario: Export sales report
    Given I am on the sales screen
    When I select a report
    And I tap "Export"
    Then I should be able to:
      | Choose export format (PDF, Excel, CSV) |
      | Select date range |
      | Include/exclude specific data |
      | Download the file |
    And the export should include all selected data

  Scenario: View sales trends
    Given I am on the sales screen
    When I select "Trends" report
    Then I should see:
      | Sales growth trends |
      | Seasonal patterns |
      | Peak performance periods |
      | Decline indicators |
    And I should be able to view different time periods

  Scenario: Compare sales periods
    Given I am on the sales screen
    When I select "Compare Periods" report
    And I select two periods to compare
    Then I should see:
      | Revenue comparison |
      | Transaction count comparison |
      | Product performance comparison |
      | Growth/decline percentages |
    And I should be able to identify key differences

  Scenario: View real-time sales
    Given I am on the sales screen
    When I select "Real-time" view
    Then I should see:
      | Live sales updates |
      | Current hour performance |
      | Today's progress |
      | Live transaction feed |
    And the data should update automatically

  Scenario: View sales forecasts
    Given I am on the sales screen
    When I select "Forecasts" report
    Then I should see:
      | Predicted sales for next period |
      | Forecast accuracy |
      | Trend projections |
      | Seasonal adjustments |
    And I should be able to adjust forecast parameters

  Scenario: View sales alerts
    Given I am on the sales screen
    When I have configured sales alerts
    Then I should see alerts for:
      | Unusual sales patterns |
      | Low sales periods |
      | High sales periods |
      | Goal achievements |
    And I should be able to configure alert thresholds

  Scenario: View sales goals
    Given I am on the sales screen
    When I select "Goals" report
    Then I should see:
      | Current goal progress |
      | Goal vs actual performance |
      | Remaining target |
      | Goal achievement timeline |
    And I should be able to set and modify goals

  Scenario: View sales by location
    Given I am on the sales screen
    And I have multiple locations
    When I select "Location Sales" report
    Then I should see:
      | Sales by location |
      | Location performance comparison |
      | Location-specific trends |
      | Revenue distribution |
    And I should be able to drill down into specific locations

  Scenario: View sales summary
    Given I am on the sales screen
    When I select "Summary" report
    Then I should see:
      | Total revenue |
      | Total transactions |
      | Average transaction value |
      | Key performance indicators |
      | Executive summary |
    And I should be able to customize the summary

  Scenario: View sales history
    Given I am on the sales screen
    When I select "History" report
    Then I should see:
      | Historical sales data |
      | Long-term trends |
      | Year-over-year comparisons |
      | Seasonal analysis |
    And I should be able to view different time periods

  Scenario: View sales insights
    Given I am on the sales screen
    When I select "Insights" report
    Then I should see:
      | AI-generated insights |
      | Performance recommendations |
      | Opportunity identification |
      | Risk indicators |
    And I should be able to act on the insights

  Scenario: View sales breakdown
    Given I am on the sales screen
    When I select "Breakdown" report
    Then I should see:
      | Detailed sales breakdown |
      | Item-level analysis |
      | Transaction details |
      | Revenue components |
    And I should be able to drill down into specific items

  Scenario: View sales comparison
    Given I am on the sales screen
    When I select "Comparison" report
    Then I should see:
      | Period-over-period comparison |
      | Year-over-year comparison |
      | Benchmark comparisons |
      | Performance rankings |
    And I should be able to select different comparison criteria

  # ============================================
  # MERKLE TREE SALES HISTORY
  # ============================================

  Scenario: Create sale with history tracking
    Given I am completing a sale transaction
    When I create a new sale
    Then a transaction record should be created
    And the transaction should have a unique hash
    And the transaction should be added to daily transactions
    And the sale should be stored with history tracking

  Scenario: Update sale with history tracking
    Given I have an existing sale
    When I edit the sale details
    And I save the changes
    Then a transaction record should be created for the update
    And the previous sale data should be preserved
    And the transaction should include both old and new data
    And the sale should be updated in the cache

  Scenario: Delete sale with history tracking
    Given I have an existing sale
    When I delete the sale
    Then a transaction record should be created for the deletion
    And the sale should be marked as deleted (soft deletion)
    And the sale data should be preserved in history
    And the transaction should include the deleted sale data

  Scenario: Restore deleted sale
    Given I have a deleted sale
    When I view the sale history
    And I tap "Restore"
    Then the sale should be restored
    And the sale should be marked as active
    And a new transaction record should be created
    And the sale should appear in the sales list

  Scenario: View sale history
    Given I have a sale with multiple changes
    When I tap on the sale's history button
    Then I should see all transaction records for that sale
    And I should see timestamps for each change
    And I should see the action type (create, update, delete)
    And I should see Merkle proofs for verification

  Scenario: Generate daily block
    Given I have transactions for the current day
    When I navigate to the History tab
    And I tap "Generate Daily Block"
    Then a daily block should be created
    And the block should contain all transactions for that day
    And a Merkle tree should be built from the transactions
    And Merkle proofs should be generated for each transaction
    And the block should have a Merkle root hash
    And the block should be linked to the previous block

  Scenario: Verify transaction integrity
    Given I have a transaction in the system
    When I verify the transaction integrity
    Then the transaction hash should be valid
    And the Merkle proof should verify against the Merkle root
    And the transaction data should be unchanged
    And I should see a success confirmation

  Scenario: Verify chain integrity
    Given I have multiple daily blocks
    When I verify the chain integrity
    Then all blocks should be linked correctly
    And all block hashes should be valid
    And all Merkle roots should be valid
    And I should see a report of any integrity issues

  Scenario: View transaction details with Merkle proof
    Given I have a transaction in a daily block
    When I view the transaction details
    Then I should see the transaction data
    And I should see the Merkle proof
    And I should see the block information
    And I should see the integrity verification status

  Scenario: Automatic daily block generation
    Given I have transactions for the day
    When the end of day trigger occurs
    Then a daily block should be generated automatically
    And the block should contain all transactions
    And the block should be saved to the database
    And I should see a notification of block generation

  Scenario: Handle block generation with no transactions
    Given I have no transactions for the current day
    When I attempt to generate a daily block
    Then I should see a message indicating no transactions
    And no block should be created
    And the system should continue normally

