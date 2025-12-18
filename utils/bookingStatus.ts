/**
 * Utility functions to calculate real-time booking status
 */

export interface ConventionBooking {
  eventDate: string;
  timeSlot: string;
  programStatus: string;
  remainingPayment: number;
  paymentStatus: string;
}

/**
 * Check if a convention event has already passed based on date and time slot
 */
export function isEventPassed(eventDate: string, timeSlot: string): boolean {
  const now = new Date();
  const event = new Date(eventDate);
  
  // If event date is in the past (not today), it's passed
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const eventDay = new Date(event.getFullYear(), event.getMonth(), event.getDate());
  
  if (eventDay < today) {
    return true;
  }
  
  // If event is not today, it hasn't passed
  if (eventDay > today) {
    return false;
  }
  
  // Event is today - check time slot
  const currentHour = now.getHours();
  const slot = timeSlot.toLowerCase();
  
  switch (slot) {
    case 'morning':
      return currentHour >= 12; // Morning ends at 12 PM
    case 'afternoon':
      return currentHour >= 18; // Afternoon ends at 6 PM
    case 'evening':
      return currentHour >= 23; // Evening ends at 11 PM
    case 'full-day':
    case 'full day':
      return currentHour >= 23; // Full day ends at 11 PM
    default:
      return currentHour >= 23; // Unknown slot, use end of day
  }
}

/**
 * Get the real-time program status (considering if event has passed)
 */
export function getRealTimeProgramStatus(booking: ConventionBooking): string {
  // If manually cancelled, keep it cancelled
  if (booking.programStatus === 'cancelled') {
    return 'cancelled';
  }
  
  // If event has passed and not marked as completed/cancelled, show as completed
  if (isEventPassed(booking.eventDate, booking.timeSlot)) {
    return 'completed';
  }
  
  // Otherwise return the stored status
  return booking.programStatus;
}

/**
 * Get the real-time payment status (showing DUE if there's remaining payment)
 */
export function getRealTimePaymentStatus(booking: ConventionBooking): {
  status: string;
  displayText: string;
  isDue: boolean;
} {
  const remaining = Number(booking.remainingPayment || 0);
  
  if (remaining <= 0) {
    return {
      status: 'paid',
      displayText: 'Paid',
      isDue: false,
    };
  }
  
  // Has remaining payment
  const isDue = true;
  
  if (booking.paymentStatus === 'partial' || remaining < Number(booking.remainingPayment)) {
    return {
      status: 'partial',
      displayText: 'Partial (Due)',
      isDue,
    };
  }
  
  return {
    status: 'pending',
    displayText: 'Pending (Due)',
    isDue,
  };
}

/**
 * Format remaining payment with DUE indicator
 */
export function formatPaymentDue(remainingPayment: number): string {
  if (remainingPayment <= 0) {
    return '৳0 (Paid)';
  }
  return `৳${remainingPayment.toLocaleString()} (DUE)`;
}
