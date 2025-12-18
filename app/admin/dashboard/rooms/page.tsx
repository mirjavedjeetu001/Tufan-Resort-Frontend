'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import Modal from '@/components/Modal';
import { useModal } from '@/hooks/useModal';

interface Room {
  id: number;
  roomNumber: string;
  name: string;
  type: 'Standard' | 'Deluxe' | 'Suite' | 'Family';
  pricePerNight: number;
  maxGuests: number;
  numberOfBeds: number;
  description: string;
  amenities: string[];
  images: string[];
  status: 'available' | 'booked' | 'maintenance';
}

export default function RoomsManagement() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [formData, setFormData] = useState({
    roomNumber: '',
    name: '',
    type: 'Standard' as Room['type'],
    pricePerNight: 0,
    hasAC: true,
    acPrice: 0,
    nonAcPrice: 0,
    maxGuests: 1,
    numberOfBeds: 1,
    description: '',
    amenities: '',
    status: 'available' as 'available' | 'booked' | 'maintenance',
  });
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreview, setImagePreview] = useState<string[]>([]);
  const { modalState, showModal: showNotification, closeModal: closeNotificationModal } = useModal();

  useEffect(() => {
    fetchRooms();
    fetchRoomTypes();
  }, []);

  const fetchRoomTypes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/room-types', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRoomTypes(response.data.filter((type: any) => type.isActive));
    } catch (error) {
      console.error('Error fetching room types:', error);
    }
  };

  const fetchRooms = async () => {
    try {
      const response = await api.get('/rooms');
      setRooms(response.data);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImageFiles(files);
    
    // Create preview URLs
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreview(previews);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const formDataToSend = new FormData();
    formDataToSend.append('roomNumber', formData.roomNumber);
    formDataToSend.append('name', formData.name);
    formDataToSend.append('type', formData.type);
    formDataToSend.append('pricePerNight', formData.pricePerNight.toString());
    formDataToSend.append('hasAC', formData.hasAC.toString());
    formDataToSend.append('acPrice', formData.acPrice.toString());
    formDataToSend.append('nonAcPrice', formData.nonAcPrice.toString());
    formDataToSend.append('maxGuests', formData.maxGuests.toString());
    formDataToSend.append('numberOfBeds', formData.numberOfBeds.toString());
    formDataToSend.append('description', formData.description);
    formDataToSend.append('amenities', formData.amenities);
    formDataToSend.append('status', formData.status);
    
    imageFiles.forEach(file => {
      formDataToSend.append('images', file);
    });

    try {
      if (editingRoom) {
        // For updates, send data based on whether new images are provided
        if (imageFiles.length > 0) {
          await api.put(`/rooms/${editingRoom.id}`, formDataToSend, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        } else {
          // Send JSON data without images
          const jsonData = {
            roomNumber: formData.roomNumber,
            name: formData.name,
            type: formData.type,
            pricePerNight: Number(formData.pricePerNight),
            hasAC: formData.hasAC,
            acPrice: Number(formData.acPrice),
            nonAcPrice: Number(formData.nonAcPrice),
            maxGuests: Number(formData.maxGuests),
            numberOfBeds: Number(formData.numberOfBeds),
            description: formData.description,
            amenities: formData.amenities,
            status: formData.status,
          };
          await api.put(`/rooms/${editingRoom.id}`, jsonData);
        }
        showNotification('Room updated successfully!', 'success');
      } else {
        await api.post('/rooms', formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        showNotification('Room created successfully!', 'success');
      }
      
      fetchRooms();
      closeModal();
    } catch (error) {
      console.error('Error saving room:', error);
      showNotification('Error saving room. Please try again.', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this room?')) {
      try {
        await api.delete(`/rooms/${id}`);
        fetchRooms();
      } catch (error) {
        console.error('Error deleting room:', error);
      }
    }
  };

  const handlePrintRoom = (room: Room) => {
    // Create a print window
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Room Details - ${room.roomNumber}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: Arial, sans-serif; 
              padding: 40px; 
              background: white;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 3px solid #006747;
            }
            .header h1 {
              color: #006747;
              font-size: 32px;
              margin-bottom: 10px;
            }
            .header p {
              color: #666;
              font-size: 16px;
            }
            .room-details {
              margin: 30px 0;
            }
            .detail-row {
              display: flex;
              padding: 15px;
              border-bottom: 1px solid #eee;
            }
            .detail-row:nth-child(even) {
              background: #f9f9f9;
            }
            .detail-label {
              font-weight: bold;
              color: #006747;
              width: 200px;
            }
            .detail-value {
              color: #333;
              flex: 1;
            }
            .amenities-list {
              display: flex;
              flex-wrap: wrap;
              gap: 10px;
              margin-top: 5px;
            }
            .amenity-tag {
              background: #006747;
              color: white;
              padding: 5px 15px;
              border-radius: 20px;
              font-size: 14px;
            }
            .status-badge {
              display: inline-block;
              padding: 8px 20px;
              border-radius: 20px;
              font-weight: bold;
              text-transform: uppercase;
            }
            .status-available { background: #10b981; color: white; }
            .status-booked { background: #f59e0b; color: white; }
            .status-maintenance { background: #ef4444; color: white; }
            .footer {
              margin-top: 50px;
              text-align: center;
              color: #999;
              font-size: 12px;
              padding-top: 20px;
              border-top: 2px solid #eee;
            }
            @media print {
              body { padding: 20px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🏨 Lake View Resort</h1>
            <p>Room Details Report</p>
          </div>

          <div class="room-details">
            <div class="detail-row">
              <div class="detail-label">Room Number:</div>
              <div class="detail-value"><strong>${room.roomNumber}</strong></div>
            </div>
            
            <div class="detail-row">
              <div class="detail-label">Room Name:</div>
              <div class="detail-value">${room.name}</div>
            </div>
            
            <div class="detail-row">
              <div class="detail-label">Room Type:</div>
              <div class="detail-value">${room.type}</div>
            </div>
            
            <div class="detail-row">
              <div class="detail-label">Price Per Night:</div>
              <div class="detail-value"><strong>৳${room.pricePerNight.toLocaleString('en-BD')}</strong></div>
            </div>
            
            <div class="detail-row">
              <div class="detail-label">Maximum Guests:</div>
              <div class="detail-value">${room.maxGuests} persons</div>
            </div>
            
            <div class="detail-row">
              <div class="detail-label">Number of Beds:</div>
              <div class="detail-value">${room.numberOfBeds}</div>
            </div>
            
            <div class="detail-row">
              <div class="detail-label">Status:</div>
              <div class="detail-value">
                <span class="status-badge status-${room.status}">${room.status}</span>
              </div>
            </div>
            
            <div class="detail-row">
              <div class="detail-label">Description:</div>
              <div class="detail-value">${room.description}</div>
            </div>
            
            <div class="detail-row">
              <div class="detail-label">Amenities:</div>
              <div class="detail-value">
                <div class="amenities-list">
                  ${room.amenities.map(a => `<span class="amenity-tag">${a}</span>`).join('')}
                </div>
              </div>
            </div>
          </div>

          <div class="footer">
            <p>Generated on: ${new Date().toLocaleString('en-GB')}</p>
            <p>Lake View Resort - Premium Accommodation</p>
          </div>

          <script>
            window.onload = () => {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handlePrintAllRooms = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const roomsList = rooms.map(room => `
      <div class="room-card">
        <div class="room-header">
          <h2>${room.roomNumber} - ${room.name}</h2>
          <span class="status-badge status-${room.status}">${room.status}</span>
        </div>
        <div class="room-details">
          <div class="detail-item">
            <strong>Type:</strong> ${room.type}
          </div>
          <div class="detail-item">
            <strong>Price:</strong> ৳${room.pricePerNight.toLocaleString('en-BD')}/night
          </div>
          ${room.hasAC ? `
            <div class="detail-item">
              <strong>AC Price:</strong> ৳${room.acPrice?.toLocaleString('en-BD') || room.pricePerNight.toLocaleString('en-BD')}/night
            </div>
            <div class="detail-item">
              <strong>Non-AC Price:</strong> ৳${room.nonAcPrice?.toLocaleString('en-BD') || room.pricePerNight.toLocaleString('en-BD')}/night
            </div>
          ` : ''}
          <div class="detail-item">
            <strong>Max Guests:</strong> ${room.maxGuests}
          </div>
          <div class="detail-item">
            <strong>Beds:</strong> ${room.numberOfBeds}
          </div>
          <div class="detail-item description">
            <strong>Description:</strong> ${room.description}
          </div>
          <div class="detail-item">
            <strong>Amenities:</strong>
            <div class="amenities">
              ${room.amenities.map(a => `<span class="amenity-tag">${a}</span>`).join('')}
            </div>
          </div>
        </div>
      </div>
    `).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>All Rooms - Lake View Resort</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: Arial, sans-serif; 
              padding: 30px;
              background: white;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 3px solid #006747;
            }
            .header h1 {
              color: #006747;
              font-size: 32px;
              margin-bottom: 10px;
            }
            .room-card {
              background: #fff;
              border: 2px solid #e0e0e0;
              border-radius: 10px;
              padding: 20px;
              margin-bottom: 20px;
              page-break-inside: avoid;
            }
            .room-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 15px;
              padding-bottom: 15px;
              border-bottom: 2px solid #006747;
            }
            .room-header h2 {
              color: #006747;
              font-size: 22px;
            }
            .status-badge {
              padding: 8px 20px;
              border-radius: 20px;
              font-weight: bold;
              text-transform: uppercase;
              font-size: 12px;
            }
            .status-available { background: #10b981; color: white; }
            .status-booked { background: #f59e0b; color: white; }
            .status-maintenance { background: #ef4444; color: white; }
            .room-details {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 15px;
            }
            .detail-item {
              padding: 10px;
              background: #f9f9f9;
              border-radius: 5px;
            }
            .detail-item strong {
              color: #006747;
              display: block;
              margin-bottom: 5px;
            }
            .description {
              grid-column: 1 / -1;
            }
            .amenities {
              display: flex;
              flex-wrap: wrap;
              gap: 8px;
              margin-top: 5px;
            }
            .amenity-tag {
              background: #006747;
              color: white;
              padding: 4px 12px;
              border-radius: 15px;
              font-size: 12px;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              color: #999;
              font-size: 12px;
              padding-top: 20px;
              border-top: 2px solid #eee;
            }
            @media print {
              body { padding: 15px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🏨 Lake View Resort - All Rooms</h1>
            <p>Complete Room Inventory Report</p>
          </div>

          ${roomsList}

          <div class="footer">
            <p>Total Rooms: ${rooms.length} | Generated on: ${new Date().toLocaleString('en-GB')}</p>
            <p>Lake View Resort - Premium Accommodation</p>
          </div>

          <script>
            window.onload = () => {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const openModal = (room?: Room) => {
    if (room) {
      setEditingRoom(room);
      setFormData({
        roomNumber: room.roomNumber || '',
        name: room.name,
        type: room.type,
        pricePerNight: room.pricePerNight,
        hasAC: room.hasAC !== undefined ? room.hasAC : true,
        acPrice: room.acPrice || room.pricePerNight,
        nonAcPrice: room.nonAcPrice || room.pricePerNight,
        maxGuests: room.maxGuests || 1,
        numberOfBeds: room.numberOfBeds || 1,
        description: room.description,
        amenities: room.amenities.join(', '),
        status: room.status,
      });
      setImagePreview(room.images || []);
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingRoom(null);
    setFormData({
      roomNumber: '',
      name: '',
      type: 'Standard',
      pricePerNight: 0,
      hasAC: true,
      acPrice: 0,
      nonAcPrice: 0,
      maxGuests: 1,
      numberOfBeds: 1,
      description: '',
      amenities: '',
      status: 'available' as 'available' | 'booked' | 'maintenance',
    });
    setImageFiles([]);
    setImagePreview([]);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Room Management</h1>
        <div className="flex gap-3">
          <button
            onClick={handlePrintAllRooms}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 shadow-md transition-all"
          >
            🖨️ Print All Rooms
          </button>
          <button
            onClick={() => openModal()}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add New Room
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map((room) => (
          <div key={room.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
            <div className="relative h-48">
              {room.images && room.images.length > 0 ? (
                <img
                  src={`http://localhost:3001${room.images[0]}`}
                  alt={room.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-400">No Image</span>
                </div>
              )}
              <span
                className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold ${
                  room.status === 'available' ? 'bg-green-500 text-white' : room.status === 'maintenance' ? 'bg-yellow-500 text-white' : 'bg-red-500 text-white'
                }`}
              >
                {room.status === 'available' ? 'Available' : room.status === 'maintenance' ? 'Maintenance' : 'Booked'}
              </span>
            </div>
            
            <div className="p-5">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-blue-500 text-white px-2 py-0.5 rounded text-xs font-bold">
                      {room.roomNumber}
                    </span>
                    <span className="bg-primary/10 text-primary px-2 py-1 rounded text-sm font-medium">
                      {room.type}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">{room.name}</h3>
                </div>
              </div>
              
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">{room.description}</p>
              
              <div className="flex items-center gap-4 mb-3 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>{room.maxGuests} Guests · {room.numberOfBeds} Bed(s)</span>
                </div>
                <div className="text-accent font-bold text-lg">
                  ৳{room.pricePerNight}/night
                </div>
              </div>
              
              {room.amenities && room.amenities.length > 0 && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-1">
                    {room.amenities.slice(0, 3).map((amenity, index) => (
                      <span key={index} className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                        {amenity}
                      </span>
                    ))}
                    {room.amenities.length > 3 && (
                      <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                        +{room.amenities.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              <div className="flex gap-2 pt-3 border-t">
                <button
                  onClick={() => openModal(room)}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-medium transition-colors"
                >
                  📝 Edit
                </button>
                <button
                  onClick={() => handlePrintRoom(room)}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-medium transition-colors"
                >
                  🖨️ Print
                </button>
                <button
                  onClick={() => handleDelete(room.id)}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg font-medium transition-colors"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {rooms.length === 0 && (
        <div className="text-center py-12">
          <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No Rooms Yet</h3>
          <p className="text-gray-500 mb-4">Get started by adding your first room</p>
          <button
            onClick={() => openModal()}
            className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg font-semibold"
          >
            Add First Room
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">
                {editingRoom ? 'Edit Room' : 'Add New Room'}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Room Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.roomNumber}
                    onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="e.g., R101"
                  />
                  <p className="text-xs text-gray-500 mt-1">Unique identifier (e.g., R101, R102)</p>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Room Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="e.g., Deluxe Lake View"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Room Type *
                  </label>
                  {roomTypes.length > 0 ? (
                    <select
                      required
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as Room['type'] })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="">Select room type...</option>
                      {roomTypes.map((type) => (
                        <option key={type.id} value={type.name}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4">
                      <p className="text-yellow-800 font-semibold mb-2">⚠️ No Room Types Available</p>
                      <p className="text-yellow-700 text-sm mb-3">
                        Please create room types first before adding rooms.
                      </p>
                      <a
                        href="/admin/dashboard/room-types"
                        className="inline-block bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-semibold text-sm"
                      >
                        🏷️ Go to Room Types Management
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Base Price per Night (৳) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.pricePerNight}
                    onChange={(e) => setFormData({ ...formData, pricePerNight: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="e.g., 3500"
                  />
                </div>
                
                <div>
                  <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                    <input
                      type="checkbox"
                      checked={formData.hasAC}
                      onChange={(e) => setFormData({ ...formData, hasAC: e.target.checked })}
                      className="mr-2 w-4 h-4"
                    />
                    Room has AC option
                  </label>
                </div>
              </div>

              {formData.hasAC && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      ❄️ AC Price (৳) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.acPrice || ''}
                      onChange={(e) => setFormData({ ...formData, acPrice: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="e.g., 4000"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      🌿 Non-AC Price (৳) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.nonAcPrice || ''}
                      onChange={(e) => setFormData({ ...formData, nonAcPrice: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="e.g., 3000"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Max Guests *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.maxGuests}
                    onChange={(e) => setFormData({ ...formData, maxGuests: parseInt(e.target.value) || 1 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="e.g., 2"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Number of Beds *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.numberOfBeds}
                    onChange={(e) => setFormData({ ...formData, numberOfBeds: parseInt(e.target.value) || 1 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="e.g., 1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Describe the room features, view, and amenities..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Amenities (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.amenities}
                  onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="e.g., Free WiFi, AC, TV, Mini Bar, Lake View"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Room Images
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                {imagePreview.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mt-3">
                    {imagePreview.map((preview, index) => (
                      <img
                        key={index}
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-20 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Room Status *
                </label>
                <select
                  required
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'available' | 'booked' | 'maintenance' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="available">Available</option>
                  <option value="booked">Booked</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={roomTypes.length === 0 && !editingRoom}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl disabled:bg-gray-400 disabled:cursor-not-allowed"
                  title={roomTypes.length === 0 ? 'Please create room types first' : ''}
                >
                  {editingRoom ? 'Update Room' : 'Add Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Modal
        isOpen={modalState.isOpen}
        onClose={closeNotificationModal}
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
