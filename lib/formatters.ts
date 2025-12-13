/**
 * Utility functions for formatting numbers and currency
 * Tufan Resort - Professional Formatting Standards
 */

/**
 * Format number as Bangladesh Taka currency
 * @param value - Number to format
 * @returns Formatted string with ৳ symbol and thousand separators
 * @example formatCurrency(1500) => "৳1,500"
 * @example formatCurrency(150000) => "৳1,50,000"
 */
export function formatCurrency(value: number | string | null | undefined): string {
  const numValue = Number(value) || 0;
  return `৳${numValue.toLocaleString()}`;
}

/**
 * Safely convert any value to a number
 * @param value - Value to convert
 * @param defaultValue - Default value if conversion fails (default: 0)
 * @returns Converted number or default value
 * @example safeNumber("100") => 100
 * @example safeNumber(null) => 0
 * @example safeNumber("invalid", 10) => 10
 */
export function safeNumber(value: any, defaultValue: number = 0): number {
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
}

/**
 * Format number with thousand separators (no currency symbol)
 * @param value - Number to format
 * @returns Formatted string with thousand separators
 * @example formatNumber(1500) => "1,500"
 */
export function formatNumber(value: number | string | null | undefined): string {
  const numValue = Number(value) || 0;
  return numValue.toLocaleString();
}

/**
 * Calculate percentage of a number
 * @param value - Base value
 * @param percentage - Percentage to calculate (e.g., 10 for 10%)
 * @returns Calculated percentage amount
 * @example calculatePercentage(1000, 10) => 100
 */
export function calculatePercentage(value: number, percentage: number): number {
  return (safeNumber(value) * safeNumber(percentage)) / 100;
}

/**
 * Calculate discount amount based on discount type
 * @param baseAmount - Original amount
 * @param discountType - Type of discount ('none' | 'percentage' | 'flat')
 * @param discountPercentage - Percentage value (for percentage type)
 * @param discountAmount - Flat amount (for flat type)
 * @returns Calculated discount amount
 */
export function calculateDiscount(
  baseAmount: number,
  discountType: string,
  discountPercentage: number = 0,
  discountAmount: number = 0
): number {
  const base = safeNumber(baseAmount);
  
  switch (discountType) {
    case 'percentage':
      const percent = safeNumber(discountPercentage);
      return Math.min((base * percent) / 100, base);
      
    case 'flat':
      const flat = safeNumber(discountAmount);
      return Math.min(flat, base);
      
    default:
      return 0;
  }
}

/**
 * Calculate grand total with discount and extra charges
 * @param baseAmount - Original amount
 * @param discountType - Type of discount
 * @param discountPercentage - Percentage value
 * @param discountAmount - Flat amount
 * @param extraCharges - Additional charges
 * @returns Calculated grand total
 */
export function calculateGrandTotal(
  baseAmount: number,
  discountType: string = 'none',
  discountPercentage: number = 0,
  discountAmount: number = 0,
  extraCharges: number = 0
): number {
  const base = safeNumber(baseAmount);
  const discount = calculateDiscount(base, discountType, discountPercentage, discountAmount);
  const extra = safeNumber(extraCharges);
  
  return base - discount + extra;
}

/**
 * Calculate nights between two dates
 * @param checkInDate - Check-in date
 * @param checkOutDate - Check-out date
 * @returns Number of nights
 */
export function calculateNights(checkInDate: string | Date, checkOutDate: string | Date): number {
  const checkIn = new Date(checkInDate);
  const checkOut = new Date(checkOutDate);
  const diffTime = checkOut.getTime() - checkIn.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

/**
 * Format date to Bangladesh standard (DD/MM/YYYY)
 * @param date - Date to format
 * @returns Formatted date string
 */
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-GB');
}

/**
 * Validate if a number is positive and not NaN
 * @param value - Value to validate
 * @returns True if valid positive number
 */
export function isValidAmount(value: any): boolean {
  const num = Number(value);
  return !isNaN(num) && num >= 0;
}

/**
 * Round to 2 decimal places (for currency)
 * @param value - Value to round
 * @returns Rounded value
 */
export function roundCurrency(value: number): number {
  return Math.round(safeNumber(value) * 100) / 100;
}

/**
 * Calculate payment status based on amounts
 * @param totalAmount - Total amount due
 * @param paidAmount - Amount already paid
 * @returns Payment status string
 */
export function getPaymentStatus(
  totalAmount: number,
  paidAmount: number
): 'pending' | 'partial' | 'paid' {
  const total = safeNumber(totalAmount);
  const paid = safeNumber(paidAmount);
  
  if (paid <= 0) return 'pending';
  if (paid >= total) return 'paid';
  return 'partial';
}

/**
 * Format percentage with % symbol
 * @param value - Percentage value
 * @returns Formatted string
 * @example formatPercentage(10.5) => "10.5%"
 */
export function formatPercentage(value: number): string {
  return `${safeNumber(value)}%`;
}

/**
 * Calculate remaining payment
 * @param grandTotal - Total amount after discounts and charges
 * @param advancePayment - Amount already paid
 * @returns Remaining amount to pay
 */
export function calculateRemainingPayment(
  grandTotal: number,
  advancePayment: number
): number {
  const total = safeNumber(grandTotal);
  const advance = safeNumber(advancePayment);
  return Math.max(0, total - advance);
}

// Type definitions for better IntelliSense
export type DiscountType = 'none' | 'percentage' | 'flat';
export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'refunded';
export type PaymentMethod = 'cash' | 'card' | 'mfs';

/**
 * Example usage:
 * 
 * import { formatCurrency, calculateGrandTotal } from '@/lib/formatters';
 * 
 * const baseAmount = 10000;
 * const discount = calculateDiscount(baseAmount, 'percentage', 10);
 * const total = calculateGrandTotal(baseAmount, 'percentage', 10, 0, 500);
 * 
 * console.log(formatCurrency(total)); // ৳9,500
 */
