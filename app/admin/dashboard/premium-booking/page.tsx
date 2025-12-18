'use client';

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { api } from '@/lib/api';
import { useReactToPrint } from 'react-to-print';
import { InvoiceTemplate } from '@/components/InvoiceTemplate';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Modal from '@/components/Modal';
import { useModal } from '@/hooks/useModal';

interface AdditionalGuest {
  name: string;
  nid: string;
  phone: string;
}

export default function PremiumBookingPage() {
  const { modalState, showModal, closeModal } = useModal();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [roomSearchQuery, setRoomSearchQuery] = useState('');
  const [searchedRoom, setSearchedRoom] = useState<any>(null);
  const [availability, setAvailability] = useState<any>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [additionalGuests, setAdditionalGuests] = useState<AdditionalGuest[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdBooking, setCreatedBooking] = useState<any>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [vatPercentage, setVatPercentage] = useState(15); // Default 15%
  const [customerFound, setCustomerFound] = useState(false);
  
  const [formData, setFormData] = useState({
    // Room Selection
    roomId: '',
    roomNumber: '',
    
    // Guest Information
    customerName: '',
    customerNid: '',
    customerPhone: '',
    customerWhatsapp: '',
    customerEmail: '',
    customerAddress: '',
    referenceName: '',
    referencePhone: '',
    customerPhoto: null as File | null,
    customerNidDocument: null as File | null,
    passportNumber: '',
    passportDocument: null as File | null,
    visitingCard: null as File | null,
    
    // Dates
    checkInDate: '',
    checkOutDate: '',
    checkInTime: '14:00',
    checkOutTime: '11:00',
    numberOfGuests: 1,
    
    // Room Preferences
    acPreference: 'ac',
    
    // Payment
    totalAmount: 0,
    vatEnabled: false,
    vatAmount: 0,
    extraCharges: 0,
    extraChargesDescription: '',
    discountType: 'none' as 'none' | 'percentage' | 'flat',
    discountPercentage: 0,
    discountAmount: 0,
    advancePayment: 0,
    paymentMethod: 'cash',
    paymentStatus: 'pending',
    status: 'confirmed'
  });

  useEffect(() => {
    fetchRooms();
    fetchResortInfo(); // Fetch VAT settings
    
    // Pre-fill from URL params if coming from dashboard
    const roomId = searchParams.get('roomId');
    const checkIn = searchParams.get('checkIn');
    const checkOut = searchParams.get('checkOut');
    
    if (roomId && checkIn && checkOut) {
      setFormData(prev => ({
        ...prev,
        roomId: roomId,
        checkInDate: checkIn,
        checkOutDate: checkOut,
      }));
      
      // Auto-load the room details with dates
      fetchRoomById(roomId, checkIn, checkOut);
    }
  }, [searchParams]);

  const fetchResortInfo = async () => {
    try {
      const response = await axios.get('http://localhost:3001/resort-info');
      if (response.data) {
        // Set VAT percentage
        if (response.data.vatPercentage) {
          setVatPercentage(response.data.vatPercentage);
        }
        
        // Set default check-in/check-out times from resort settings
        const checkInTime = response.data.defaultCheckInTime 
          ? response.data.defaultCheckInTime.substring(0, 5) 
          : '14:00';
        const checkOutTime = response.data.defaultCheckOutTime 
          ? response.data.defaultCheckOutTime.substring(0, 5) 
          : '11:00';
          
        setFormData(prev => ({
          ...prev,
          checkInTime,
          checkOutTime
        }));
      }
    } catch (error) {
      console.error('Error fetching resort info:', error);
    }
  };

  const checkCustomerByPhone = async (phone: string) => {
    if (!phone || phone.length < 10) {
      setCustomerFound(false);
      return;
    }
    
    try {
      const response = await api.get(`/bookings/customer/${phone}`);
      if (response.data) {
        // Auto-fill customer details
        setFormData(prev => ({
          ...prev,
          customerName: response.data.guestName || prev.customerName,
          customerNid: response.data.guestNid || prev.customerNid,
          customerEmail: response.data.guestEmail || prev.customerEmail,
          customerPhone: response.data.guestPhone || prev.customerPhone,
          customerAddress: response.data.guestAddress || prev.customerAddress,
        }));
        setCustomerFound(true);
        showModal('✅ Customer found! Details auto-filled', 'success');
      }
    } catch (error: any) {
      setCustomerFound(false);
      console.log('Customer not found:', error.response?.status);
      // Silently fail - customer not found is normal
    }
  };

  const fetchRoomById = async (roomId: string, checkIn?: string, checkOut?: string) => {
    try {
      const response = await axios.get(`http://localhost:3001/rooms/${roomId}`);
      setSearchedRoom(response.data);
      setFormData(prev => ({ ...prev, roomId: response.data.id, roomNumber: response.data.roomNumber }));
      
      // If dates are provided, auto-check availability
      if (checkIn && checkOut) {
        setTimeout(() => {
          checkAvailabilityWithDates(response.data.id, checkIn, checkOut);
        }, 100);
      }
    } catch (error) {
      console.error('Error fetching room:', error);
    }
  };

  const fetchRooms = async () => {
    try {
      const response = await axios.get('http://localhost:3001/rooms');
      setRooms(response.data);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  const handleRoomSearch = async () => {
    if (!roomSearchQuery.trim()) {
      showModal('Please enter a room number', 'warning');
      return;
    }

    try {
      const response = await axios.get(
        `http://localhost:3001/rooms/by-room-number/${roomSearchQuery}`
      );
      setSearchedRoom(response.data);
      setFormData({ ...formData, roomId: response.data.id, roomNumber: response.data.roomNumber });
    } catch (error) {
      showModal('Room not found', 'error');
      setSearchedRoom(null);
    }
  };

  const checkAvailabilityWithDates = async (roomId: string, checkIn: string, checkOut: string) => {
    try {
      const room = await axios.get(`http://localhost:3001/rooms/${roomId}`);
      const response = await axios.get(
        `http://localhost:3001/rooms/check-availability/${room.data.roomNumber}?checkIn=${checkIn}&checkOut=${checkOut}`
      );
      setAvailability(response.data);
      
      if (response.data.available) {
        // Calculate total amount based on AC preference
        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);
        const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
        const pricePerNight = formData.acPreference === 'ac' 
          ? (response.data.room.acPrice || response.data.room.pricePerNight)
          : (response.data.room.nonAcPrice || response.data.room.pricePerNight);
        const baseAmount = nights * pricePerNight;
        setFormData(prev => ({ ...prev, totalAmount: baseAmount }));
      }
    } catch (error) {
      console.error('Error checking availability:', error);
    }
  };

  const checkAvailability = async () => {
    if (!formData.roomNumber || !formData.checkInDate || !formData.checkOutDate) {
      showModal('Please select room and dates', 'warning');
      return;
    }

    try {
      const response = await axios.get(
        `http://localhost:3001/rooms/check-availability/${formData.roomNumber}?checkIn=${formData.checkInDate}&checkOut=${formData.checkOutDate}`
      );
      setAvailability(response.data);
      
      if (response.data.available) {
        // Calculate total amount based on AC preference
        const checkIn = new Date(formData.checkInDate);
        const checkOut = new Date(formData.checkOutDate);
        const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
        const pricePerNight = formData.acPreference === 'ac' 
          ? (response.data.room.acPrice || response.data.room.pricePerNight)
          : (response.data.room.nonAcPrice || response.data.room.pricePerNight);
        const baseAmount = nights * pricePerNight;
        setFormData({ ...formData, totalAmount: baseAmount });
      }
    } catch (error) {
      console.error('Error checking availability:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, [field]: file });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const token = localStorage.getItem('token');
    const submitData = new FormData();
    
    // Append all text fields with calculated values
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== null && !(value instanceof File)) {
        submitData.append(key, value.toString());
      }
    });
    
    // Keep totalAmount as base amount (before discount, after VAT)
    const baseWithVat = formData.totalAmount + (formData.vatEnabled ? formData.vatAmount : 0);
    submitData.set('totalAmount', baseWithVat.toString());
    // Save discount fields
    submitData.set('discountType', formData.discountType);
    submitData.set('discountPercentage', formData.discountPercentage.toString());
    submitData.set('discountAmount', formData.discountAmount.toString());
    // Save VAT fields
    submitData.set('vatEnabled', formData.vatEnabled.toString());
    submitData.set('vatAmount', formData.vatAmount.toString());
    // Save AC preference
    submitData.set('acPreference', formData.acPreference);
    // Calculate and set remaining payment based on grand total (after discount + extra charges)
    const remainingPayment = calculateRemainingPayment();
    submitData.set('remainingPayment', remainingPayment.toString());
    
    // Set correct payment status based on advance payment
    const advancePayment = Number(formData.advancePayment);
    const grandTotal = calculateGrandTotal();
    let paymentStatus = 'pending';
    if (advancePayment >= grandTotal) {
      paymentStatus = 'paid';
    } else if (advancePayment > 0) {
      paymentStatus = 'partial';
    }
    submitData.set('paymentStatus', paymentStatus);
    
    submitData.set('numberOfGuests', (1 + additionalGuests.length).toString());
    
    // Append files
    if (formData.customerPhoto) {
      submitData.append('customerPhoto', formData.customerPhoto);
    }
    if (formData.customerNidDocument) {
      submitData.append('customerNidDocument', formData.customerNidDocument);
    }
    if (formData.passportDocument) {
      submitData.append('passportDocument', formData.passportDocument);
    }
    if (formData.visitingCard) {
      submitData.append('visitingCard', formData.visitingCard);
    }
    
    // Append additional guests
    if (additionalGuests.length > 0) {
      submitData.append('additionalGuests', JSON.stringify(additionalGuests));
    }

    try {
      const response = await axios.post('http://localhost:3001/bookings', submitData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Get the created booking
      const bookingId = response.data.id;
      const bookingResponse = await axios.get(`http://localhost:3001/bookings/${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setCreatedBooking(bookingResponse.data);
      setShowSuccessModal(true);
    } catch (error: any) {
      console.error('Error creating booking:', error);
      showModal('Failed to create booking: ' + (error.response?.data?.message || 'Please try again'), 'error');
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: invoiceRef,
    documentTitle: createdBooking ? `Invoice-BOOKING-${createdBooking.id.toString().padStart(5, '0')}` : 'Invoice',
  });

  // Calculate base amount from dates and room
  const calculateBaseAmount = (): number => {
    if (!formData.checkInDate || !formData.checkOutDate || !searchedRoom) {
      return 0;
    }
    const checkIn = new Date(formData.checkInDate);
    const checkOut = new Date(formData.checkOutDate);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    if (nights <= 0) return 0;
    return nights * (searchedRoom.pricePerNight || 0);
  };

  // Calculate discount amount
  const calculateDiscountAmount = (): number => {
    const baseAmount = calculateBaseAmount();
    if (formData.discountType === 'percentage') {
      return (baseAmount * formData.discountPercentage) / 100;
    } else if (formData.discountType === 'flat') {
      return formData.discountAmount;
    }
    return 0;
  };

  // Calculate grand total
  const calculateGrandTotal = (): number => {
    const base = calculateBaseAmount();
    const discount = calculateDiscountAmount();
    const afterDiscount = base - discount;
    return afterDiscount + (formData.extraCharges || 0);
  };

  // Calculate remaining payment
  const calculateRemainingPayment = (): number => {
    return calculateGrandTotal() - (formData.advancePayment || 0);
  };

  // Add guest
  const addAdditionalGuest = () => {
    setAdditionalGuests([...additionalGuests, { name: '', nid: '', phone: '' }]);
  };

  // Remove guest
  const removeAdditionalGuest = (index: number) => {
    setAdditionalGuests(additionalGuests.filter((_, i) => i !== index));
  };

  // Update guest
  const updateAdditionalGuest = (index: number, field: keyof AdditionalGuest, value: string) => {
    const updated = [...additionalGuests];
    updated[index][field] = value;
    setAdditionalGuests(updated);
  };

  // Print invoice handler
  const handlePrintInvoice = useReactToPrint({
    contentRef: invoiceRef,
    documentTitle: createdBooking ? `Invoice-BOOKING-${createdBooking.id.toString().padStart(5, '0')}` : 'Invoice',
  });

  return (
    <div className="p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#006747] to-[#f4a425] rounded-2xl p-8 mb-6 text-white">
        <h1 className="text-3xl font-bold mb-2">🏨 Premium Room Booking</h1>
        <p className="text-green-50">Create a new room booking with advanced features</p>
      </div>

      {/* Progress Steps */}
      <div className="flex justify-between mb-8 max-w-4xl mx-auto">
        {[
          { num: 1, label: 'Room Selection' },
          { num: 2, label: 'Guest Details' },
          { num: 3, label: 'Payment Info' }
        ].map((s) => (
          <div key={s.num} className="flex items-center flex-1">
            <div className={`flex flex-col items-center flex-1 ${s.num < 3 ? 'relative' : ''}`}>
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                  step >= s.num
                    ? 'bg-[#006747] text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}
              >
                {s.num}
              </div>
              <span className="text-sm mt-2 font-semibold">{s.label}</span>
              {s.num < 3 && (
                <div
                  className={`absolute top-6 left-1/2 w-full h-1 ${
                    step > s.num ? 'bg-[#006747]' : 'bg-gray-300'
                  }`}
                  style={{ left: '50%' }}
                />
              )}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="max-w-6xl mx-auto">
        {/* Step 1: Room Selection */}
        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold mb-6 text-[#006747]">🔍 Search & Select Room</h2>
            
            {/* Room Number Search */}
            <div className="mb-6">
              <label className="block text-gray-700 font-semibold mb-2">
                Search by Room Number
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={roomSearchQuery}
                  onChange={(e) => setRoomSearchQuery(e.target.value)}
                  placeholder="Enter room number (e.g., R001)"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006747]"
                />
                <button
                  type="button"
                  onClick={handleRoomSearch}
                  className="bg-[#006747] text-white px-6 py-3 rounded-lg hover:bg-[#005030] font-semibold"
                >
                  🔍 Search
                </button>
              </div>
            </div>

            {/* Display Searched Room */}
            {searchedRoom && (
              <div className="bg-green-50 border-2 border-green-600 rounded-xl p-6 mb-6">
                <h3 className="text-xl font-bold text-green-900 mb-3">✅ Room Found!</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-600">Room Number:</span>
                    <span className="ml-2 font-bold">{searchedRoom.roomNumber}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Room Name:</span>
                    <span className="ml-2 font-bold">{searchedRoom.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Type:</span>
                    <span className="ml-2 font-bold">{searchedRoom.type}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Price:</span>
                    <span className="ml-2 font-bold">৳{searchedRoom.pricePerNight}/night</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Max Guests:</span>
                    <span className="ml-2 font-bold">{searchedRoom.maxGuests}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <span className={`ml-2 font-bold ${searchedRoom.status === 'available' ? 'text-green-600' : 'text-red-600'}`}>
                      {searchedRoom.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Date Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Check-in Date</label>
                <input
                  type="date"
                  value={formData.checkInDate}
                  onChange={(e) => setFormData({ ...formData, checkInDate: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006747]"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Check-out Date</label>
                <input
                  type="date"
                  value={formData.checkOutDate}
                  onChange={(e) => setFormData({ ...formData, checkOutDate: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006747]"
                  required
                />
              </div>
            </div>

            {/* AC/Non-AC Selection */}
            {searchedRoom && searchedRoom.hasAC && (
              <div className="mb-6">
                <label className="block text-gray-700 font-semibold mb-2">❄️ AC Preference</label>
                <div className="flex gap-4">
                  <label className="flex items-center cursor-pointer bg-blue-50 border-2 border-blue-300 rounded-lg px-6 py-3 hover:bg-blue-100 transition">
                    <input
                      type="radio"
                      name="acPreference"
                      value="ac"
                      checked={formData.acPreference === 'ac'}
                      onChange={(e) => setFormData({ ...formData, acPreference: e.target.value })}
                      className="mr-3 w-5 h-5"
                    />
                    <span className="font-semibold">❄️ With AC (৳{searchedRoom.acPrice || searchedRoom.pricePerNight}/night)</span>
                  </label>
                  <label className="flex items-center cursor-pointer bg-green-50 border-2 border-green-300 rounded-lg px-6 py-3 hover:bg-green-100 transition">
                    <input
                      type="radio"
                      name="acPreference"
                      value="non-ac"
                      checked={formData.acPreference === 'non-ac'}
                      onChange={(e) => setFormData({ ...formData, acPreference: e.target.value })}
                      className="mr-3 w-5 h-5"
                    />
                    <span className="font-semibold">🌿 Non-AC (৳{searchedRoom.nonAcPrice || searchedRoom.pricePerNight}/night)</span>
                  </label>
                </div>
              </div>
            )}

            {/* Check Availability Button */}
            {searchedRoom && formData.checkInDate && formData.checkOutDate && (
              <button
                type="button"
                onClick={checkAvailability}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold mb-6"
              >
                🔍 Check Availability
              </button>
            )}

            {/* Availability Status */}
            {availability && (
              <div className={`border-2 rounded-xl p-6 mb-6 ${
                availability.available ? 'bg-green-50 border-green-600' : 'bg-red-50 border-red-600'
              }`}>
                <h3 className={`text-xl font-bold mb-2 ${
                  availability.available ? 'text-green-900' : 'text-red-900'
                }`}>
                  {availability.available ? '✅ Room is Available!' : '❌ Room is Not Available'}
                </h3>
                <p className={availability.available ? 'text-green-700' : 'text-red-700'}>
                  {availability.message}
                </p>
              </div>
            )}

            {/* Number of Guests */}
            <div className="mb-6">
              <label className="block text-gray-700 font-semibold mb-2">Number of Guests</label>
              <input
                type="number"
                value={formData.numberOfGuests}
                onChange={(e) => setFormData({ ...formData, numberOfGuests: Number(e.target.value) })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006747]"
                min="1"
                required
              />
            </div>

            {/* Next Button */}
            <button
              type="button"
              onClick={() => availability?.available && setStep(2)}
              disabled={!availability?.available}
              className={`w-full px-6 py-4 rounded-lg font-bold text-lg ${
                availability?.available
                  ? 'bg-gradient-to-r from-[#006747] to-[#f4a425] text-white hover:shadow-lg'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Next: Guest Details →
            </button>
          </div>
        )}

        {/* Step 2: Guest Information */}
        {step === 2 && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold mb-6 text-[#006747]">👤 Guest Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-gray-700 font-semibold mb-2">
                  📱 Phone Number * 
                  {customerFound && <span className="ml-2 text-green-600 text-sm font-bold">✅ Customer Found - Details Auto-Filled!</span>}
                </label>
                <input
                  type="tel"
                  value={formData.customerPhone}
                  onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                  onBlur={(e) => checkCustomerByPhone(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006747] focus:border-[#006747]"
                  placeholder="Enter phone number first to auto-fill customer details"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">💡 Enter phone number and press Tab - if customer exists, details will auto-fill</p>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">Full Name *</label>
                <input
                  type="text"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006747]"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">NID/Passport Number *</label>
                <input
                  type="text"
                  value={formData.customerNid}
                  onChange={(e) => setFormData({ ...formData, customerNid: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006747]"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">Reference Name</label>
                <input
                  type="text"
                  value={formData.referenceName}
                  onChange={(e) => setFormData({ ...formData, referenceName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006747]"
                  placeholder="Who referred / booked"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">Reference Phone</label>
                <input
                  type="tel"
                  value={formData.referencePhone}
                  onChange={(e) => setFormData({ ...formData, referencePhone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006747]"
                  placeholder="Ref contact number"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">WhatsApp Number</label>
                <input
                  type="tel"
                  value={formData.customerWhatsapp}
                  onChange={(e) => setFormData({ ...formData, customerWhatsapp: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006747]"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">Email</label>
                <input
                  type="email"
                  value={formData.customerEmail}
                  onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006747]"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">Address</label>
                <input
                  type="text"
                  value={formData.customerAddress}
                  onChange={(e) => setFormData({ ...formData, customerAddress: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006747]"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">📷 Guest Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'customerPhoto')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006747]"
                />
                {formData.customerPhoto && (
                  <p className="text-green-600 text-sm mt-1">✓ Photo selected</p>
                )}
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">📄 NID Document</label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => handleFileChange(e, 'customerNidDocument')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006747]"
                />
                {formData.customerNidDocument && (
                  <p className="text-green-600 text-sm mt-1">✓ NID Document selected</p>
                )}
              </div>
            </div>

            {/* Passport & Visiting Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">🛂 Passport Number (Optional)</label>
                <input
                  type="text"
                  value={formData.passportNumber}
                  onChange={(e) => setFormData({ ...formData, passportNumber: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006747]"
                  placeholder="Enter passport number"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">🛂 Passport Document</label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => handleFileChange(e, 'passportDocument')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006747]"
                />
                {formData.passportDocument && (
                  <p className="text-green-600 text-sm mt-1">✓ Passport selected</p>
                )}
              </div>
            </div>

            {/* Visiting Card Upload */}
            <div className="mb-6">
              <label className="block text-gray-700 font-semibold mb-2">💼 Visiting Card (Optional)</label>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => handleFileChange(e, 'visitingCard')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006747]"
              />
              {formData.visitingCard && (
                <p className="text-green-600 text-sm mt-1">✓ Visiting card selected</p>
              )}
            </div>

            {/* Additional Guests Section */}
            <div className="mt-8 border-t-2 border-gray-200 pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-[#006747]">👥 Additional Guests</h3>
                <button
                  type="button"
                  onClick={addAdditionalGuest}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Guest Member
                </button>
              </div>

              {additionalGuests.length === 0 && (
                <p className="text-gray-500 text-center py-4 bg-gray-50 rounded-lg">
                  No additional guests added. Click "+ Add Guest Member" to add more guests.
                </p>
              )}

              {additionalGuests.map((guest, index) => (
                <div key={index} className="bg-gradient-to-r from-blue-50 to-green-50 border-2 border-blue-300 rounded-xl p-4 mb-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-bold text-blue-900">Guest #{index + 2}</h4>
                    <button
                      type="button"
                      onClick={() => removeAdditionalGuest(index)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm font-semibold"
                    >
                      ✕ Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-gray-700 font-semibold mb-2 text-sm">Full Name *</label>
                      <input
                        type="text"
                        value={guest.name}
                        onChange={(e) => updateAdditionalGuest(index, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Jane Doe"
                        required={additionalGuests.length > 0}
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-semibold mb-2 text-sm">NID/Passport *</label>
                      <input
                        type="text"
                        value={guest.nid}
                        onChange={(e) => updateAdditionalGuest(index, 'nid', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., 123456789"
                        required={additionalGuests.length > 0}
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-semibold mb-2 text-sm">Phone Number *</label>
                      <input
                        type="tel"
                        value={guest.phone}
                        onChange={(e) => updateAdditionalGuest(index, 'phone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., 01712345678"
                        required={additionalGuests.length > 0}
                      />
                    </div>
                  </div>
                </div>
              ))}

              {additionalGuests.length > 0 && (
                <div className="bg-green-100 border-2 border-green-500 rounded-lg p-3 mt-4">
                  <p className="font-bold text-green-900">
                    Total Guests: {1 + additionalGuests.length} (1 Main + {additionalGuests.length} Additional)
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 bg-gray-300 text-gray-700 px-6 py-4 rounded-lg font-bold hover:bg-gray-400"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex-1 bg-gradient-to-r from-[#006747] to-[#f4a425] text-white px-6 py-4 rounded-lg font-bold hover:shadow-lg"
              >
                Next: Payment Info →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Payment */}
        {step === 3 && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold mb-6 text-[#006747]">💳 Payment Information</h2>
            
            <div className="bg-gradient-to-r from-green-50 to-yellow-50 border-2 border-[#006747] rounded-xl p-6 mb-6">
              <h3 className="font-bold text-lg mb-4 text-[#006747]">💰 Bill Summary:</h3>
              <div className="space-y-3">
                {searchedRoom && formData.checkInDate && formData.checkOutDate && (
                  <div className="bg-white rounded-lg p-3 mb-2">
                    <div className="text-sm text-gray-600 mb-1">
                      Room: {searchedRoom.roomNumber} - {searchedRoom.name}
                    </div>
                    <div className="text-sm text-gray-600">
                      Duration: {Math.ceil((new Date(formData.checkOutDate).getTime() - new Date(formData.checkInDate).getTime()) / (1000 * 60 * 60 * 24))} nights × ৳{searchedRoom.pricePerNight}/night
                    </div>
                  </div>
                )}
                <div className="flex justify-between text-lg">
                  <span className="font-semibold">Base Amount:</span>
                  <span className="font-bold text-green-700">৳{calculateBaseAmount().toLocaleString()}</span>
                </div>
                {calculateDiscountAmount() > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Discount ({formData.discountType === 'percentage' ? `${formData.discountPercentage}%` : 'Flat'}):</span>
                    <span className="font-bold">- ৳{calculateDiscountAmount().toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Extra Charges:</span>
                  <span className="font-bold text-orange-600">৳{(formData.extraCharges || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xl font-bold text-[#006747] border-t-2 border-[#006747] pt-2 mt-2">
                  <span>Grand Total:</span>
                  <span>৳{calculateGrandTotal().toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-lg">
                  <span>Advance Payment:</span>
                  <span className="font-bold text-blue-600">৳{(formData.advancePayment || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xl font-bold text-red-600 border-t-2 border-red-300 pt-2 mt-2 bg-red-50 -mx-3 px-3 py-2 rounded">
                  <span>Remaining Payment:</span>
                  <span>৳{calculateRemainingPayment().toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Discount Section */}
              <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-300 rounded-xl p-6">
                <h3 className="font-bold text-lg mb-4 text-red-700 flex items-center gap-2">
                  🎁 Discount Options
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">Discount Type</label>
                    <select
                      value={formData.discountType}
                      onChange={(e) => setFormData({ ...formData, discountType: e.target.value as 'none' | 'percentage' | 'flat', discountPercentage: 0, discountAmount: 0 })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    >
                      <option value="none">No Discount</option>
                      <option value="percentage">Percentage Discount (%)</option>
                      <option value="flat">Flat/Fixed Discount (৳)</option>
                    </select>
                  </div>

                  {formData.discountType === 'percentage' && (
                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">Discount Percentage (%)</label>
                      <input
                        type="number"
                        value={formData.discountPercentage}
                        onChange={(e) => setFormData({ ...formData, discountPercentage: Number(e.target.value) })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                        min="0"
                        max="100"
                        step="0.01"
                        placeholder="e.g., 10 for 10% off"
                      />
                      {formData.discountPercentage > 0 && (
                        <p className="text-sm text-red-600 mt-2">
                          Discount Amount: ৳{calculateDiscountAmount().toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}

                  {formData.discountType === 'flat' && (
                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">Fixed Discount Amount (৳)</label>
                      <input
                        type="number"
                        value={formData.discountAmount}
                        onChange={(e) => setFormData({ ...formData, discountAmount: Number(e.target.value) })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                        min="0"
                        max={calculateBaseAmount()}
                        placeholder="e.g., 500 for ৳500 off"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">Extra Charges (৳)</label>
                <input
                  type="number"
                  value={formData.extraCharges}
                  onChange={(e) => setFormData({ ...formData, extraCharges: Number(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006747]"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">Extra Charges Description</label>
                <textarea
                  value={formData.extraChargesDescription}
                  onChange={(e) => setFormData({ ...formData, extraChargesDescription: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006747]"
                  rows={3}
                  placeholder="e.g., Food: ৳1500, Laundry: ৳500, Room Service: ৳300"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">Advance Payment (৳)</label>
                <input
                  type="number"
                  value={formData.advancePayment}
                  onChange={(e) => setFormData({ ...formData, advancePayment: Number(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006747]"
                  min="0"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">Payment Method</label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006747]"
                  required
                >
                  <option value="cash">💵 Cash</option>
                  <option value="card">💳 Card</option>
                  <option value="mfs">📱 Mobile Banking (bKash/Nagad)</option>
                </select>
              </div>
            </div>

            {/* VAT/Tax Section */}
            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.vatEnabled}
                    onChange={(e) => {
                      const vatEnabled = e.target.checked;
                      const baseAmount = calculateBaseAmount();
                      const vatAmount = vatEnabled ? (baseAmount * vatPercentage / 100) : 0;
                      setFormData({ ...formData, vatEnabled, vatAmount });
                    }}
                    className="mr-3 w-5 h-5"
                  />
                  <span className="text-lg font-semibold text-gray-800">📊 Include VAT/Tax ({vatPercentage}%)</span>
                </label>
              </div>
              
              {formData.vatEnabled && (
                <div className="bg-white rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-gray-700">
                    <span>Subtotal:</span>
                    <span className="font-semibold">৳{calculateBaseAmount().toLocaleString('en-BD')}</span>
                  </div>
                  <div className="flex justify-between text-orange-600">
                    <span>VAT ({vatPercentage}%):</span>
                    <span className="font-semibold">৳{formData.vatAmount.toLocaleString('en-BD')}</span>
                  </div>
                  <div className="border-t-2 border-gray-300 pt-2 flex justify-between text-green-700 text-lg font-bold">
                    <span>Total Amount:</span>
                    <span>৳{(calculateBaseAmount() + formData.vatAmount).toLocaleString('en-BD')}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex-1 bg-gray-300 text-gray-700 px-6 py-4 rounded-lg font-bold hover:bg-gray-400"
              >
                ← Back
              </button>
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-[#006747] to-[#f4a425] text-white px-6 py-4 rounded-lg font-bold hover:shadow-lg"
              >
                🔒 Confirm Booking
              </button>
            </div>
          </div>
        )}
      </form>

      {/* Success Modal with Invoice Option */}
      {showSuccessModal && createdBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
            <div className="bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-6 rounded-t-2xl text-center">
              <div className="text-6xl mb-4">✅</div>
              <h2 className="text-3xl font-bold mb-2">Booking Created Successfully!</h2>
              <p className="text-green-100">Booking ID: #{createdBooking.id.toString().padStart(5, '0')}</p>
            </div>

            <div className="p-8">
              <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-xl p-6 mb-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">📋 Booking Summary</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Guest Name:</p>
                    <p className="font-bold text-gray-900">{createdBooking.customerName}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Room:</p>
                    <p className="font-bold text-gray-900">{createdBooking.room?.roomNumber} - {createdBooking.room?.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Check-In:</p>
                    <p className="font-bold text-gray-900">{new Date(createdBooking.checkInDate).toLocaleDateString('en-GB')}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Check-Out:</p>
                    <p className="font-bold text-gray-900">{new Date(createdBooking.checkOutDate).toLocaleDateString('en-GB')}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Total Amount:</p>
                    <p className="font-bold text-green-600 text-lg">৳{createdBooking.totalAmount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Advance Paid:</p>
                    <p className="font-bold text-blue-600 text-lg">৳{createdBooking.advancePayment.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handlePrintInvoice}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-4 rounded-xl font-bold text-lg shadow-lg transform hover:scale-105 transition-all flex items-center justify-center gap-3"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  🖨️ Print Invoice
                </button>

                <Link
                  href="/admin/dashboard/bookings"
                  className="block w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-4 rounded-xl font-bold text-lg shadow-lg transform hover:scale-105 transition-all text-center"
                >
                  📋 View All Bookings
                </Link>

                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    window.location.reload();
                  }}
                  className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-4 rounded-xl font-bold text-lg transition-all"
                >
                  ➕ Create Another Booking
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Invoice Component for Printing */}
      <div className="hidden">
        {createdBooking && <InvoiceTemplate ref={invoiceRef} booking={createdBooking} />}
      </div>

      <Modal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        onConfirm={modalState.onConfirm}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
      />
    </div>
  );
}
