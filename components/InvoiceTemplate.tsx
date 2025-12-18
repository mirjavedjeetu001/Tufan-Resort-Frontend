'use client';

import React from 'react';

interface InvoiceProps {
  booking: {
    id: number;
    customerName: string;
    customerNid: string;
    customerEmail: string;
    customerPhone: string;
    customerWhatsapp?: string;
    customerAddress?: string;
    checkInDate: string;
    checkOutDate: string;
    checkInTime?: string;
    checkOutTime?: string;
    numberOfGuests: number;
    totalAmount: number;
    extraCharges?: number;
    extraChargesDescription?: string;
    discountType?: string;
    discountPercentage?: number;
    discountAmount?: number;
    advancePayment: number;
    remainingPayment: number;
    paymentMethod: string;
    paymentStatus: string;
    status: string;
    additionalGuests?: Array<{
      name: string;
      nid: string;
      phone: string;
    }>;
    room: {
      id: number;
      roomNumber: string;
      name: string;
      type: string;
      pricePerNight: number;
    };
    createdAt: string;
  };
}

export const InvoiceTemplate = React.forwardRef<HTMLDivElement, InvoiceProps>(
  ({ booking }, ref) => {
    const calculateNights = () => {
      const checkIn = new Date(booking.checkInDate);
      const checkOut = new Date(booking.checkOutDate);
      return Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    };

    const nights = calculateNights();
    const baseAmount = Number(booking.totalAmount) || 0;
    const discountType = booking.discountType || 'none';
    const discountPercentage = Number(booking.discountPercentage) || 0;
    const discountAmountValue = Number(booking.discountAmount) || 0;
    
    let discountAmount = 0;
    if (discountType === 'percentage' && discountPercentage > 0) {
      discountAmount = (baseAmount * discountPercentage) / 100;
    } else if (discountType === 'flat' && discountAmountValue > 0) {
      discountAmount = discountAmountValue;
    }
    
    const afterDiscount = baseAmount - discountAmount;
    const extraCharges = Number(booking.extraCharges) || 0;
    const grandTotal = afterDiscount + extraCharges;

    return (
      <div ref={ref} className="bg-white p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center border-b-4 border-[#006747] pb-6 mb-6">
          <h1 className="text-4xl font-bold text-[#006747] mb-2">Tufan Resort</h1>
          <p className="text-gray-600 text-sm">🏞️ Lake View Resort & Convention Center</p>
          <p className="text-gray-500 text-xs mt-2">
            Phone: +880 1234 567890 | Email: info@tufanresort.com
          </p>
        </div>

        {/* Invoice Info */}
        <div className="flex justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">BOOKING INVOICE</h2>
            <p className="text-sm text-gray-600">Invoice #: BOOKING-{booking.id.toString().padStart(5, '0')}</p>
            <p className="text-sm text-gray-600">Date: {new Date(booking.createdAt).toLocaleDateString('en-GB')}</p>
          </div>
          <div className="text-right">
            <div className={`inline-block px-4 py-2 rounded-lg font-bold text-sm ${
              booking.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
              booking.status === 'checked_in' ? 'bg-green-100 text-green-800' :
              booking.status === 'checked_out' ? 'bg-gray-100 text-gray-800' :
              booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {booking.status.toUpperCase().replace('_', ' ')}
            </div>
          </div>
        </div>

        {/* Customer Details */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="border border-gray-300 rounded-lg p-4">
            <h3 className="font-bold text-gray-800 mb-3 border-b pb-2">Guest Information</h3>
            <div className="space-y-2 text-sm">
              <p><span className="font-semibold">Name:</span> {booking.customerName}</p>
              <p><span className="font-semibold">NID:</span> {booking.customerNid}</p>
              <p><span className="font-semibold">Phone:</span> {booking.customerPhone}</p>
              {booking.customerWhatsapp && (
                <p><span className="font-semibold">WhatsApp:</span> {booking.customerWhatsapp}</p>
              )}
              <p><span className="font-semibold">Email:</span> {booking.customerEmail}</p>
              {booking.customerAddress && (
                <p><span className="font-semibold">Address:</span> {booking.customerAddress}</p>
              )}
            </div>
          </div>

          <div className="border border-gray-300 rounded-lg p-4">
            <h3 className="font-bold text-gray-800 mb-3 border-b pb-2">Booking Details</h3>
            <div className="space-y-2 text-sm">
              <p><span className="font-semibold">Room:</span> {booking.room?.roomNumber} - {booking.room?.name}</p>
              <p><span className="font-semibold">Type:</span> {booking.room?.type}</p>
              <p><span className="font-semibold">Check-In:</span> {new Date(booking.checkInDate).toLocaleDateString('en-GB')} {booking.checkInTime && `at ${booking.checkInTime}`}</p>
              <p><span className="font-semibold">Check-Out:</span> {new Date(booking.checkOutDate).toLocaleDateString('en-GB')} {booking.checkOutTime && `at ${booking.checkOutTime}`}</p>
              <p><span className="font-semibold">Total Guests:</span> {booking.numberOfGuests}</p>
              <p><span className="font-semibold">Total Nights:</span> {nights}</p>
            </div>
          </div>
        </div>

        {/* Additional Guests */}
        {booking.additionalGuests && booking.additionalGuests.length > 0 && (
          <div className="border border-gray-300 rounded-lg p-4 mb-6">
            <h3 className="font-bold text-gray-800 mb-3 border-b pb-2">Additional Guest Members</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {booking.additionalGuests.map((guest, index) => (
                <div key={index} className="bg-gray-50 p-3 rounded text-sm">
                  <p className="font-semibold text-gray-800">{index + 2}. {guest.name}</p>
                  <p className="text-gray-600">NID: {guest.nid}</p>
                  <p className="text-gray-600">Phone: {guest.phone}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Billing Details */}
        <div className="border border-gray-300 rounded-lg p-4 mb-6">
          <h3 className="font-bold text-gray-800 mb-3 border-b pb-2">Billing Summary</h3>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-2 border-b">Description</th>
                <th className="text-center p-2 border-b">Quantity</th>
                <th className="text-right p-2 border-b">Rate</th>
                <th className="text-right p-2 border-b">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-2 border-b">Room Booking ({booking.room?.roomNumber} - {booking.room?.name})</td>
                <td className="text-center p-2 border-b">{nights} night(s)</td>
                <td className="text-right p-2 border-b">৳{booking.room?.pricePerNight.toLocaleString()}</td>
                <td className="text-right p-2 border-b">৳{baseAmount.toLocaleString()}</td>
              </tr>
              {discountAmount > 0 && (
                <tr className="text-red-600">
                  <td className="p-2 border-b">
                    Discount {booking.discountType === 'percentage' ? `(${booking.discountPercentage}%)` : '(Flat)'}
                  </td>
                  <td className="text-center p-2 border-b">-</td>
                  <td className="text-right p-2 border-b">-</td>
                  <td className="text-right p-2 border-b">- ৳{discountAmount.toLocaleString()}</td>
                </tr>
              )}
              {booking.extraCharges && booking.extraCharges > 0 && (
                <tr>
                  <td className="p-2 border-b">
                    <div>Additional Charges</div>
                    {booking.extraChargesDescription && (
                      <div className="text-xs text-gray-600 italic">{booking.extraChargesDescription}</div>
                    )}
                  </td>
                  <td className="text-center p-2 border-b">-</td>
                  <td className="text-right p-2 border-b">-</td>
                  <td className="text-right p-2 border-b">৳{booking.extraCharges.toLocaleString()}</td>
                </tr>
              )}
              <tr className="font-bold bg-gray-50">
                <td colSpan={3} className="p-2 text-right">Grand Total:</td>
                <td className="text-right p-2">৳{grandTotal.toLocaleString()}</td>
              </tr>
              <tr className="text-green-600 font-semibold">
                <td colSpan={3} className="p-2 text-right">Advance Payment:</td>
                <td className="text-right p-2">৳{booking.advancePayment.toLocaleString()}</td>
              </tr>
              <tr className="text-red-600 font-bold text-lg">
                <td colSpan={3} className="p-2 text-right">Remaining Payment:</td>
                <td className="text-right p-2">৳{booking.remainingPayment.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Payment Info */}
        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div className="border border-gray-300 rounded-lg p-3">
            <p className="font-semibold text-gray-700">Payment Method:</p>
            <p className="text-gray-900 uppercase">{booking.paymentMethod}</p>
          </div>
          <div className="border border-gray-300 rounded-lg p-3">
            <p className="font-semibold text-gray-700">Payment Status:</p>
            <p className={`uppercase font-semibold ${
              booking.paymentStatus === 'paid' ? 'text-green-600' :
              booking.paymentStatus === 'partial' ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {booking.paymentStatus}
            </p>
          </div>
        </div>

        {/* Terms & Conditions */}
        <div className="border-t-2 border-gray-300 pt-4 mt-6">
          <h4 className="font-bold text-gray-800 mb-2 text-sm">Terms & Conditions:</h4>
          <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
            <li>Check-in time is from 2:00 PM and check-out time is before 11:00 AM</li>
            <li>Valid photo ID required during check-in</li>
            <li>Damage to resort property will be charged</li>
            <li>Cancellation must be done 48 hours before check-in date</li>
            <li>Outside food and beverages are not allowed</li>
          </ul>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 pt-4 border-t">
          <p className="text-sm text-gray-600 mb-2">Thank you for choosing Tufan Resort!</p>
          <p className="text-xs text-gray-500">This is a computer-generated invoice and does not require a signature.</p>
          <p className="text-xs text-[#006747] font-semibold mt-2">🇧🇩 Proudly Made in Bangladesh</p>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-700 font-semibold">Developed By Mir Javed Jeetu</p>
            <p className="text-xs text-gray-600 mt-1">Contact: 01811480222</p>
          </div>
        </div>
      </div>
    );
  }
);

InvoiceTemplate.displayName = 'InvoiceTemplate';
