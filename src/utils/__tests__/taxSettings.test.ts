import { describe, it, expect, beforeEach } from 'vitest';
import {
  DEFAULT_TAX_SETTINGS,
  pricesIncludeTax,
  computeCartTaxBreakdownFromCartItems,
  computeCartTaxBreakdown,
  loadTaxSettings,
  type TaxSettings,
} from '../taxSettings';

const exclusive16: TaxSettings = { taxRate: 16, taxCalculationMethod: 'exclusive', taxInclusive: false };
const inclusive16: TaxSettings = { taxRate: 16, taxCalculationMethod: 'inclusive', taxInclusive: true };

describe('pricesIncludeTax', () => {
  it('is true when calculation method is inclusive', () => {
    expect(pricesIncludeTax({ ...exclusive16, taxCalculationMethod: 'inclusive' })).toBe(true);
  });
  it('is true when taxInclusive flag is set', () => {
    expect(pricesIncludeTax({ ...exclusive16, taxInclusive: true })).toBe(true);
  });
  it('is false for a plain exclusive config', () => {
    expect(pricesIncludeTax(exclusive16)).toBe(false);
  });
});

describe('computeCartTaxBreakdownFromCartItems', () => {
  it('adds tax on top for exclusive pricing', () => {
    const r = computeCartTaxBreakdownFromCartItems([{ itemTotal: 100, product: {} }], exclusive16);
    expect(r.subtotalExclTax).toBeCloseTo(100, 6);
    expect(r.taxAmount).toBeCloseTo(16, 6);
    expect(r.total).toBeCloseTo(116, 6);
  });

  it('extracts tax from the price for inclusive pricing', () => {
    const r = computeCartTaxBreakdownFromCartItems([{ itemTotal: 116, product: {} }], inclusive16);
    expect(r.subtotalExclTax).toBeCloseTo(100, 6);
    expect(r.taxAmount).toBeCloseTo(16, 6);
    expect(r.total).toBeCloseTo(116, 6);
  });

  it('honors a per-product priceIncludesTax override against the store rule', () => {
    // Store is exclusive, but this line already includes tax.
    const r = computeCartTaxBreakdownFromCartItems(
      [{ itemTotal: 116, product: { priceIncludesTax: true } }],
      exclusive16
    );
    expect(r.subtotalExclTax).toBeCloseTo(100, 6);
    expect(r.taxAmount).toBeCloseTo(16, 6);
    expect(r.total).toBeCloseTo(116, 6);
  });

  it('charges no tax on exempt products', () => {
    const r = computeCartTaxBreakdownFromCartItems(
      [{ itemTotal: 100, product: { taxExempt: true } }],
      exclusive16
    );
    expect(r.taxAmount).toBe(0);
    expect(r.total).toBeCloseTo(100, 6);
  });

  it('charges no tax when the rate is zero', () => {
    const r = computeCartTaxBreakdownFromCartItems(
      [{ itemTotal: 100, product: {} }],
      { ...exclusive16, taxRate: 0 }
    );
    expect(r.taxAmount).toBe(0);
    expect(r.total).toBeCloseTo(100, 6);
  });

  it('sums tax across a mix of taxable and exempt lines', () => {
    const r = computeCartTaxBreakdownFromCartItems(
      [
        { itemTotal: 100, product: {} },
        { itemTotal: 50, product: { taxExempt: true } },
      ],
      exclusive16
    );
    expect(r.subtotalExclTax).toBeCloseTo(150, 6);
    expect(r.taxAmount).toBeCloseTo(16, 6);
    expect(r.total).toBeCloseTo(166, 6);
  });

  it('treats a non-finite itemTotal as zero tax', () => {
    const r = computeCartTaxBreakdownFromCartItems(
      [{ itemTotal: Number.NaN, product: {} }],
      exclusive16
    );
    expect(r.taxAmount).toBe(0);
  });
});

describe('computeCartTaxBreakdown (single sum)', () => {
  it('matches the itemized computation for one line', () => {
    expect(computeCartTaxBreakdown(100, exclusive16)).toEqual(
      computeCartTaxBreakdownFromCartItems([{ itemTotal: 100, product: {} }], exclusive16)
    );
  });
});

describe('loadTaxSettings', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns defaults when nothing is stored', () => {
    expect(loadTaxSettings()).toEqual(DEFAULT_TAX_SETTINGS);
  });

  it('reads taxRate and method from bizneai-store-config', () => {
    localStorage.setItem(
      'bizneai-store-config',
      JSON.stringify({ taxRate: 8, taxCalculationMethod: 'inclusive', taxInclusive: true })
    );
    expect(loadTaxSettings()).toEqual({ taxRate: 8, taxCalculationMethod: 'inclusive', taxInclusive: true });
  });

  it('falls back to the legacy bizneai-tax-rate key', () => {
    localStorage.setItem('bizneai-tax-rate', '10');
    expect(loadTaxSettings()).toEqual({ ...DEFAULT_TAX_SETTINGS, taxRate: 10 });
  });

  it('ignores malformed store-config JSON and returns defaults', () => {
    localStorage.setItem('bizneai-store-config', '{not json');
    expect(loadTaxSettings()).toEqual(DEFAULT_TAX_SETTINGS);
  });
});
