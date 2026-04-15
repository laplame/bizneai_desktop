# Tax Management System

**Last Updated:** November 2025  
**Version:** 1.18.0  
**Status:** ✅ Production Ready

## 📋 Table of Contents

1. [Overview](#overview)
2. [Tax Architecture](#tax-architecture)
3. [Tax Rate Configuration](#tax-rate-configuration)
4. [Tax Calculations](#tax-calculations)
5. [Fiscal Configuration](#fiscal-configuration)
6. [Invoice History](#invoice-history)
7. [Fiscal Regimes](#fiscal-regimes)
8. [WhatsApp Integration](#whatsapp-integration)
9. [Technical Architecture](#technical-architecture)
10. [Internationalization](#internationalization)

---

## Overview

The Tax Management System is a comprehensive solution for managing tax rates, fiscal configuration, and invoice history. It provides:

- **Tax Rate Management**: Configure and persist tax rates
- **Tax Calculations**: Multiple calculation methods (base to total, inclusive to base, etc.)
- **Fiscal Configuration**: Complete fiscal data management (RFC, address, regime, etc.)
- **Invoice History**: View and manage CFDI invoices
- **Fiscal Regimes**: Support for all Mexican fiscal regimes
- **WhatsApp Integration**: Contact support for fiscal configuration
- **Internationalization**: Full support for English and Spanish

---

## Tax Architecture

### Core Components

#### TaxContext (`src/context/TaxContext.tsx`)
- Global tax state management
- Tax rate persistence
- Tax calculation functions
- Tax rate configuration

#### TaxesScreen (`app/taxes.tsx`)
- Tax management UI
- Three main tabs: History, Tax Rate, Configuration
- Invoice history display
- Fiscal configuration form
- WhatsApp integration

### Data Structures

#### TaxContextType Interface
```typescript
interface TaxContextType {
  taxRate: number;
  setTaxRate: (rate: number) => Promise<void>;
  calculateTax: (amount: number) => number;
  calculateTotalWithTax: (amount: number) => number;
  calculateTaxFromInclusive: (inclusiveAmount: number) => number;
  calculateBaseFromInclusive: (inclusiveAmount: number) => number;
}
```

#### TaxConfiguration Interface
```typescript
interface TaxConfiguration {
  rfc: string; // Tax ID (RFC)
  legalName: string;
  tradeName?: string;
  fiscalAddress: {
    street: string;
    exteriorNumber: string;
    interiorNumber?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  fiscalRegime: string; // Tax regime code
  email: string;
  phone: string;
  certificateNumber?: string;
  certificateKey?: string;
}
```

---

## Tax Rate Configuration

### Features

#### Set Tax Rate
- Input field for tax rate (percentage)
- Validation (must be non-negative number)
- Save button
- Success/error feedback
- Persistence to AsyncStorage

#### View Current Rate
- Display current tax rate
- Example calculations
- Visual feedback

### Storage
- Key: `@tax_rate`
- Format: String representation of number
- Automatic load on app start
- Automatic save on change

### Usage Example
```typescript
const { taxRate, setTaxRate, calculateTax } = useTax();

// Set tax rate
await setTaxRate(16); // 16%

// Calculate tax
const tax = calculateTax(100); // Returns 16
const total = calculateTotalWithTax(100); // Returns 116
```

---

## Tax Calculations

### Calculation Methods

#### Calculate Tax from Base Amount
```typescript
calculateTax(amount: number): number {
  return (amount * taxRate) / 100;
}
```

**Example:**
- Base: $100.00
- Tax Rate: 16%
- Tax: $16.00
- Total: $116.00

#### Calculate Total with Tax
```typescript
calculateTotalWithTax(amount: number): number {
  return amount + calculateTax(amount);
}
```

**Example:**
- Base: $100.00
- Tax Rate: 16%
- Total: $116.00

#### Calculate Tax from Inclusive Amount
```typescript
calculateTaxFromInclusive(inclusiveAmount: number): number {
  if (taxRate === 0) return 0;
  return inclusiveAmount - (inclusiveAmount / (1 + taxRate / 100));
}
```

**Example:**
- Inclusive: $116.00
- Tax Rate: 16%
- Tax: $16.00
- Base: $100.00

#### Calculate Base from Inclusive Amount
```typescript
calculateBaseFromInclusive(inclusiveAmount: number): number {
  if (taxRate === 0) return inclusiveAmount;
  return inclusiveAmount / (1 + taxRate / 100);
}
```

**Example:**
- Inclusive: $116.00
- Tax Rate: 16%
- Base: $100.00

### Zero Tax Rate Handling
- If tax rate is 0, all calculations return base amount
- No division by zero errors
- Clean handling of tax-free scenarios

### Integration Points

#### Cart Integration
- Tax calculated on cart subtotal
- Displayed in cart summary
- Included in total calculation

#### Sales Integration
- Tax included in sale record
- Tax displayed on ticket
- Tax included in eInvoice

---

## Fiscal Configuration

### Configuration Fields

#### Business Information
- **RFC (Tax ID)**: Required, max 13 characters, uppercase
- **Legal Name**: Required
- **Trade Name**: Optional

#### Fiscal Address
- **Street**: Required
- **Exterior Number**: Required
- **Interior Number**: Optional
- **Neighborhood**: Required
- **City**: Required
- **State**: Required
- **ZIP Code**: Required, numeric, 5 digits
- **Country**: Default "México"

#### Tax Regime
- **Fiscal Regime**: Required, selected from list
- 20+ available regimes
- Translated names

#### Contact Information
- **Email**: Required, validated
- **Phone**: Required

### Storage
- Key: `@BizneAI_tax_config`
- Format: JSON string
- Automatic load on app start
- Automatic save on change

### Validation
- Required fields validated before saving
- Email format validation
- RFC format validation (uppercase, max length)
- ZIP code validation (numeric, 5 digits)

### Status Banner
- **Configured**: Green banner, checkmark icon
- **Not Configured**: Yellow banner, warning icon
- Displayed at top of Taxes screen

---

## Invoice History

### Features

#### Invoice List
- Display all invoices with eInvoice data
- Filter by invoice type
- Pull-to-refresh
- Empty state handling

#### Invoice Types
- **Income**: Regular invoices
- **Credit Notes**: Credit note invoices
- **Cancellation**: Cancelled invoices
- **Complements**: Complementary invoices
- **Expenses**: Expense invoices

#### Invoice Display
Each invoice card shows:
- Invoice number
- Date
- Customer name
- Total amount
- Tax ID (RFC)

#### Invoice Details Modal
- Invoice information (number, date, total)
- Business information (name, RFC, address)
- Customer information (name, email, phone)
- Items list with quantities and prices

### Filtering
- Filter by invoice type
- Horizontal scrollable tabs
- Active tab highlighted
- Real-time filtering

---

## Fiscal Regimes

### Available Regimes

The system supports 20+ Mexican fiscal regimes:

1. **601** - General Law of Legal Entities
2. **603** - Income from Interest
3. **605** - Income from Obtaining Prizes
4. **606** - Income from Dividends and Profit Distributions
5. **608** - Income from Leasing
6. **610** - Residents Abroad Without Permanent Establishment in Mexico
7. **611** - Income from Incorporation
8. **612** - Income from Personal Services
9. **614** - Income from Salaries and Wages
10. **615** - Income from Business Activities
11. **616** - Income from Business Activities with Fixed Income
12. **620** - Simplified Trust Regime
13. **621** - Incorporation Regime
14. **622** - Activities with Agricultural, Livestock, Fishing or Forestry Income
15. **623** - Optional Group of Companies
16. **624** - Coordinated Activities
17. **625** - Income from Business Activities and Leasing
18. **626** - Simplified Regime for Trusts
19. **628** - Hydrocarbons Regime
20. **629** - Income from Leasing
21. **630** - Income from Leasing

### Regime Selection
- Scrollable list in modal
- Code and name displayed
- Selected regime highlighted
- Default: 601 (General Law of Legal Entities)

### Translations
- All regime names translated
- Supports English and Spanish
- Updates on language change

---

## WhatsApp Integration

### Contact Developer Feature

#### Flow
1. User fills fiscal configuration form
2. User taps "Contact Developer" button
3. Validation checks required fields
4. WhatsApp opens with pre-filled message
5. Message includes all configuration data

#### Message Format
```
[Header Message]

RFC: [RFC]
Legal Name: [Legal Name]
Trade Name: [Trade Name] (if provided)

Fiscal Address:
[Street] [Exterior Number] [Interior Number]
[Neighborhood], [City], [State]
ZIP Code: [ZIP Code]

Fiscal Regime: [Code] - [Name]

Contact Information:
Email: [Email]
Phone: [Phone]

[Footer Message]
```

#### Error Handling
- WhatsApp not installed: Shows error with phone number
- Validation errors: Prevents opening WhatsApp
- Network errors: Graceful error handling

---

## Technical Architecture

### TaxContext Service

#### Core Functions
```typescript
// Set tax rate
setTaxRate(rate: number): Promise<void>

// Calculate tax from base
calculateTax(amount: number): number

// Calculate total with tax
calculateTotalWithTax(amount: number): number

// Calculate tax from inclusive amount
calculateTaxFromInclusive(inclusiveAmount: number): number

// Calculate base from inclusive amount
calculateBaseFromInclusive(inclusiveAmount: number): number
```

#### State Management
```typescript
const [taxRate, setTaxRateState] = useState<number>(0);

useEffect(() => {
  loadTaxRate();
}, []);
```

### TaxesScreen Component

#### Tabs
- **History**: Invoice history and filtering
- **Tax Rate**: Tax rate configuration
- **Configuration**: Fiscal data configuration

#### State Management
```typescript
const [activeTab, setActiveTab] = useState<'history' | 'configuration' | 'taxRate'>('history');
const [invoiceType, setInvoiceType] = useState<InvoiceType>('income');
const [taxConfig, setTaxConfig] = useState<TaxConfiguration>({...});
const [isTaxConfigured, setIsTaxConfigured] = useState(false);
```

### Integration Points

#### Cart Integration
```typescript
const { taxRate } = useTax();
const tax = subtotal * (taxRate / 100);
const total = subtotal + tax;
```

#### Sales Integration
```typescript
const sale = {
  subtotal: cartSubtotal,
  tax: calculateTax(cartSubtotal),
  total: calculateTotalWithTax(cartSubtotal),
  // ...
};
```

---

## Internationalization

### Supported Languages
- **English**: Default language
- **Spanish**: Full translation support

### Translation Keys

#### Taxes Section
```json
{
  "taxes": {
    "title": "Taxes",
    "subtitle": "Manage tax rates and fiscal configuration",
    "invoiceHistory": "Invoice History",
    "taxRate": "Tax Rate",
    "subscribeOrRaise": "Subscribe or Raise Invoice",
    "rfc": "RFC",
    "legalName": "Legal Name",
    "tradeName": "Trade Name",
    "fiscalAddress": "Fiscal Address",
    "fiscalRegime": "Fiscal Regime",
    "email": "Email",
    "phone": "Phone",
    "configured": "Configured",
    "notConfigured": "Not Configured",
    "contactDeveloper": "Contact Developer",
    "fiscalRegimes": {
      "601": "General Law of Legal Entities",
      "603": "Income from Interest",
      // ... other regimes
    }
  }
}
```

### Language Switching
- Tax labels update on language change
- Fiscal regime names translated
- All messages properly translated
- Consistent UI across languages

---

## Best Practices

### Tax Rate Management
1. Always validate tax rate input
2. Handle zero tax rate gracefully
3. Persist tax rate to storage
4. Provide clear feedback
5. Show example calculations

### Fiscal Configuration
1. Validate all required fields
2. Format RFC to uppercase
3. Validate email format
4. Validate ZIP code format
5. Provide clear error messages

### Tax Calculations
1. Use context functions for consistency
2. Handle zero tax rate
3. Round appropriately
4. Display with proper formatting
5. Include in all financial calculations

### Invoice Management
1. Filter invoices by type
2. Display clear invoice information
3. Handle empty states gracefully
4. Provide refresh functionality
5. Show detailed invoice information

---

## Troubleshooting

### Common Issues

#### Tax Rate Not Saving
- Check AsyncStorage permissions
- Verify storage keys
- Review error logs
- Check validation logic

#### Tax Calculations Incorrect
- Verify tax rate is set correctly
- Check calculation formulas
- Review integration points
- Validate input amounts

#### Fiscal Configuration Not Persisting
- Check AsyncStorage save logic
- Verify JSON serialization
- Review error logs
- Check storage permissions

#### WhatsApp Not Opening
- Verify WhatsApp is installed
- Check phone number format
- Review URL encoding
- Check error messages

#### Invoice History Not Loading
- Verify sales have eInvoice data
- Check database queries
- Review error logs
- Validate invoice structure

---

## Future Enhancements

### Planned Features
- Multiple tax rates (federal, state, local)
- Tax exemptions
- Tax reporting
- Export invoice data
- Invoice templates
- Automatic tax calculation rules
- Tax compliance validation
- Integration with SAT (Mexican tax authority)
- Invoice cancellation workflow
- Credit note generation

### Technical Improvements
- Real-time tax rate updates
- Advanced tax calculation rules
- Tax reporting dashboard
- Invoice analytics
- Performance optimization
- Enhanced error handling
- Better validation
- Improved UI/UX

---

## Related Documentation

- `features/taxes.feature`: Gherkin feature file
- `docs/CART_SYSTEM.md`: Cart system documentation (tax integration)
- `docs/SALES_SYSTEM.md`: Sales system documentation (tax integration)
- `src/context/TaxContext.tsx`: Tax context implementation
- `app/taxes.tsx`: Taxes screen implementation

---

**Documentation Version**: 1.0  
**Last Updated**: November 2025  
**Maintained By**: BizneAI Development Team

