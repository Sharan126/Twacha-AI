import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, MapPin, Video, Stethoscope, Search, Filter, CheckCircle, X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import './Doctors.css';

const mockDoctors = [
  {
    id: 1,
    name: 'Dr. Sarah Jenkins',
    type: 'Dermatologist',
    experience: 12,
    rating: 4.9,
    reviews: 128,
    languages: 'English, Kannada',
    priceOnline: 500,
    priceOffline: 800,
    isAIRecommended: true,
    distance: 2.5,
    clinic: 'SkinCare Pro Clinic, Jayanagar',
    image: 'https://i.pravatar.cc/150?img=1'
  },
  {
    id: 2,
    name: 'Dr. Rajesh Kumar',
    type: 'Dermatologist',
    experience: 8,
    rating: 4.7,
    reviews: 84,
    languages: 'English, Hindi, Kannada',
    priceOnline: 400,
    priceOffline: 700,
    isAIRecommended: false,
    distance: 5.1,
    clinic: 'Dermalife Center, Indiranagar',
    image: 'https://i.pravatar.cc/150?img=11'
  },
  {
    id: 3,
    name: 'Dr. Priya Sharma',
    type: 'Cosmetologist & Dermatologist',
    experience: 15,
    rating: 4.9,
    reviews: 256,
    languages: 'English, Hindi',
    priceOnline: 600,
    priceOffline: 1000,
    isAIRecommended: true,
    distance: 8.0,
    clinic: 'Aesthetic Skin, Koramangala',
    image: 'https://i.pravatar.cc/150?img=5'
  }
];

const Doctors = () => {
  const { setDoctorFeedbackModal } = useAppContext();
  const [consultType, setConsultType] = useState('online'); // online or offline
  const [showFilters, setShowFilters] = useState(false);
  const [bookingModal, setBookingModal] = useState(null); // stores doctor info when open
  const [paymentStep, setPaymentStep] = useState(0); // 0: details, 1: processing, 2: success

  const handleBook = (doctor, type) => {
    setBookingModal({ doctor, type });
    setPaymentStep(0);
  };

  const processPayment = () => {
    setPaymentStep(1);
    setTimeout(() => {
      setPaymentStep(2);
    }, 2000);
  };

  return (
    <div className="doctors-page container">
      <div className="doctors-header">
        <h2>Find a Dermatologist</h2>
        
        <div className="consult-toggle glass">
          <button 
            className={consultType === 'online' ? 'active' : ''} 
            onClick={() => setConsultType('online')}
          >
            <Video size={18} /> Online Consult
          </button>
          <button 
            className={consultType === 'offline' ? 'active' : ''} 
            onClick={() => setConsultType('offline')}
          >
            <Stethoscope size={18} /> Clinic Visit
          </button>
        </div>
      </div>

      <div className="doctors-layout">
        {/* Filters Sidebar */}
        <aside className="filters-sidebar glass-card">
          <div className="filter-header">
            <h3><Filter size={18} /> Filters</h3>
          </div>
          
          <div className="filter-group">
            <label>Experience</label>
            <select>
              <option>Any Experience</option>
              <option>5+ Years</option>
              <option>10+ Years</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Maximum Price</label>
            <input type="range" min="300" max="2000" step="100" />
            <div className="flex-between text-muted"><small>₹300</small><small>₹2000+</small></div>
          </div>
          
          <div className="filter-group">
            <label>Language</label>
            <select>
              <option>English</option>
              <option>Kannada</option>
              <option>Hindi</option>
            </select>
          </div>
          
          {consultType === 'offline' && (
            <div className="filter-group">
              <label>Distance</label>
              <select>
                <option>Within 5 km</option>
                <option>Within 10 km</option>
                <option>Any Distance</option>
              </select>
            </div>
          )}
        </aside>

        {/* Doctors List */}
        <main className="doctors-list">
          {mockDoctors.map(doc => (
            <motion.div 
              key={doc.id} 
              className="doctor-card glass-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {doc.isAIRecommended && (
                <div className="recommendation-badge bg-primary">
                  ✨ AI Recommended
                </div>
              )}
              
              <div className="doc-info-main">
                <img src={doc.image} alt={doc.name} className="doc-image" />
                <div className="doc-details">
                  <h3>{doc.name}</h3>
                  <p className="doc-type text-primary">{doc.type}</p>
                  
                  <div className="doc-stats">
                    <span className="flex-center text-warning"><Star size={14} fill="currentColor"/> {doc.rating} ({doc.reviews})</span>
                    <span>• {doc.experience} Yrs Exp.</span>
                  </div>
                  
                  <p className="doc-langs text-muted"><small>Speaks: {doc.languages}</small></p>
                  
                  {consultType === 'offline' && (
                    <div className="doc-clinic flex-center">
                      <MapPin size={14} className="text-secondary" /> 
                      <small>{doc.clinic} ({doc.distance} km away)</small>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="doc-actions">
                <div className="price">
                  <span className="price-val">₹{consultType === 'online' ? doc.priceOnline : doc.priceOffline}</span>
                  <span className="price-label">/ consult</span>
                </div>
                
                <button 
                  className="btn-primary"
                  onClick={() => handleBook(doc, consultType)}
                >
                  {consultType === 'online' ? 'Book Online' : 'Book Clinic Visit'}
                </button>
              </div>
            </motion.div>
          ))}
        </main>
      </div>

      {/* Booking Modal */}
      <AnimatePresence>
        {bookingModal && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="modal-content glass"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              <button className="close-btn" onClick={() => setBookingModal(null)}>
                <X size={24} />
              </button>

              {paymentStep === 0 && (
                <div className="booking-details">
                  <h3>Confirm Booking</h3>
                  <div className="modal-doc-info">
                    <img src={bookingModal.doctor.image} alt={bookingModal.doctor.name} />
                    <div>
                      <h4>{bookingModal.doctor.name}</h4>
                      <p>{bookingModal.type === 'online' ? 'Video Consultation' : 'Clinic Visit'}</p>
                    </div>
                  </div>
                  
                  <div className="time-slots">
                    <h4>Select Time</h4>
                    <div className="slots-grid">
                      <button className="slot glass">10:00 AM</button>
                      <button className="slot glass active">11:30 AM</button>
                      <button className="slot glass">02:00 PM</button>
                      <button className="slot glass">04:30 PM</button>
                    </div>
                  </div>

                  {bookingModal.type === 'offline' && (
                    <div className="clinic-location mt-2 mb-2">
                      <h4>Clinic Location</h4>
                      <p className="text-muted text-sm" style={{marginBottom: '0.5rem'}}><MapPin size={14}/> {bookingModal.doctor.clinic}</p>
                      <div className="map-container glass-card" style={{overflow: 'hidden', height: '150px', position: 'relative'}}>
                        {/* Simulated Map iframe using OpenStreetMap or standard static image */}
                        <iframe 
                          title="Clinic Location"
                          width="100%" 
                          height="100%" 
                          frameBorder="0" 
                          scrolling="no" 
                          marginHeight="0" 
                          marginWidth="0" 
                          src={`https://maps.google.com/maps?q=${encodeURIComponent(bookingModal.doctor.clinic)}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                          style={{border: 0}}
                        ></iframe>
                      </div>
                      <button className="btn-secondary full-width mt-1" style={{fontSize: '0.85rem'}}>Get Directions</button>
                    </div>
                  )}

                  <div className="price-breakdown glass-card mt-2">
                    <div className="flex-between">
                      <span>Consultation Fee</span>
                      <span>₹{bookingModal.type === 'online' ? bookingModal.doctor.priceOnline : bookingModal.doctor.priceOffline}</span>
                    </div>
                    <div className="flex-between">
                      <span>Platform Fee</span>
                      <span>₹50</span>
                    </div>
                    <hr />
                    <div className="flex-between total">
                      <span>Total Pay</span>
                      <span className="text-primary">
                        ₹{(bookingModal.type === 'online' ? bookingModal.doctor.priceOnline : bookingModal.doctor.priceOffline) + 50}
                      </span>
                    </div>
                  </div>

                  <button className="btn-primary full-width" onClick={processPayment}>
                    Proceed to Pay
                  </button>
                </div>
              )}

              {paymentStep === 1 && (
                <div className="payment-processing">
                  <div className="spinner-lg text-primary"></div>
                  <h3>Processing Payment...</h3>
                  <p className="text-muted">Please do not close this window (Razorpay style mock)</p>
                </div>
              )}

              {paymentStep === 2 && (
                <div className="payment-success">
                  <CheckCircle size={64} className="text-success" />
                  <h3 className="text-success">Booking Confirmed!</h3>
                  <p>Your appointment with {bookingModal.doctor.name} is scheduled for Tomorrow at 11:30 AM.</p>
                  <div className="receipt-card glass-card">
                    <p><strong>Booking ID:</strong> TWA-88492</p>
                    <p><strong>Type:</strong> {bookingModal.type === 'online' ? 'Video Call' : 'Clinic Visit'}</p>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                    <button className="btn-secondary flex-1" onClick={() => setBookingModal(null)}>
                      Done
                    </button>
                    <button 
                      className="btn-primary flex-1" 
                      onClick={() => {
                        setDoctorFeedbackModal({
                          doctorId: bookingModal.doctor.id,
                          doctorName: bookingModal.doctor.name,
                          doctorImage: bookingModal.doctor.image,
                          consultType: bookingModal.type,
                          date: new Date().toISOString()
                        });
                        setBookingModal(null);
                      }}
                    >
                      Leave a Review
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Doctors;
