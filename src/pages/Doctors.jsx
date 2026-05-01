import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, MapPin, Video, Stethoscope, Filter, CheckCircle, X, MessageSquare, Compass, RefreshCw } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../config/supabaseClient';
import { doctorsData } from '../data/doctors';
import './Doctors.css';

// Haversine formula
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI/180) *
    Math.cos(lat2 * Math.PI/180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
}

const DEFAULT_FILTERS = {
  experience: 0,
  maxPrice: 2000,
  language: '',
  distance: 0 // 0 means any
};

const Doctors = () => {
  const { setDoctorFeedbackModal, language: appLang } = useAppContext();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const condition = searchParams.get('condition');

  const [consultType, setConsultType] = useState('online');
  const [userLocation, setUserLocation] = useState(null);
  const [locating, setLocating] = useState(false);

  // Filters State
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  // Ask for location
  const locateUser = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      (err) => {
        console.warn("Geolocation blocked or failed:", err);
        setLocating(false);
      }
    );
  };

  useEffect(() => {
    locateUser();
  }, []);

  const handleBook = async (doc) => {
    if (!profile) {
      alert("Please login to book a consultation.");
      navigate('/auth');
      return;
    }
    
    try {
      const { error } = await supabase.from('consultation_history').insert([{
        user_id: profile.id,
        doctor_name: doc.name,
        specialization: doc.type,
        status: 'completed',
        created_at: new Date().toISOString()
      }]);
      
      if (error) throw error;
      alert(`Successfully booked a consultation with ${doc.name}!`);
    } catch (err) {
      console.error("Booking error:", err);
      alert("Failed to book consultation.");
    }
  };

  // Compute distances, filter, and smart sort
  const displayDoctors = useMemo(() => {
    let list = [...doctorsData];

    // 1. Calculate Distances
    if (userLocation) {
      list = list.map(doc => ({
        ...doc,
        distance: getDistance(userLocation.lat, userLocation.lng, doc.lat, doc.lng)
      }));
    } else {
      list = list.map(doc => ({ ...doc, distance: 5 + Math.random() * 5 })); // Mock if no location
    }

    // 2. Determine AI recommendation match
    list = list.map(doc => {
      let isRecommended = false;
      if (condition && doc.specializations.includes(condition)) {
        isRecommended = true;
      }
      
      const langMatch = doc.languages.some(l => 
        (appLang === 'kn' && l.includes('Kannada')) || 
        (appLang === 'en' && l.includes('English'))
      );

      if (isRecommended && langMatch) {
         doc.sortScore = 100;
      } else if (isRecommended) {
         doc.sortScore = 80;
      } else {
         doc.sortScore = 0;
      }

      return { ...doc, isAIRecommended: isRecommended };
    });

    // 3. APPLY FILTERS
    list = list.filter((doc) => {
      // Consultation Type filter
      if (doc.consultation_type !== 'both' && doc.consultation_type !== consultType) {
        return false;
      }

      // Experience filter
      if (filters.experience > 0 && doc.experience < filters.experience) {
        return false;
      }

      // Price filter
      const currentPrice = consultType === 'online' ? doc.priceOnline : doc.priceOffline;
      if (currentPrice > filters.maxPrice) {
        return false;
      }

      // Language filter
      if (filters.language && !doc.languages.includes(filters.language)) {
        return false;
      }

      // Distance filter (only if location is active and distance > 0)
      if (filters.distance > 0 && userLocation) {
        if (doc.distance > filters.distance) {
          return false;
        }
      }

      return true;
    });

    // 4. Sort: Recommendation Score (high) -> Distance (low) -> Rating (high)
    list.sort((a, b) => {
      if (b.sortScore !== a.sortScore) return b.sortScore - a.sortScore;
      if (userLocation) return a.distance - b.distance;
      return b.rating - a.rating;
    });

    return list;
  }, [userLocation, condition, appLang, consultType, filters]);


  return (
    <div className="doctors-page container">
      <div className="doctors-header flex-between" style={{ alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2>Find a Dermatologist</h2>
          {condition && <p className="text-muted">Showing specialists for: <strong className="text-primary">{condition}</strong></p>}
          <p className="text-sm text-muted mt-1">Showing {displayDoctors.length} doctors</p>
        </div>
        
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
          <div className="filter-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3><Filter size={18} /> Filters</h3>
            <button className="icon-btn text-muted" onClick={() => setFilters(DEFAULT_FILTERS)} title="Reset Filters">
              <RefreshCw size={16} />
            </button>
          </div>
          
          <div className="filter-group">
            <button className="btn-secondary full-width" onClick={locateUser} disabled={locating} style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
              <Compass size={16} /> {locating ? 'Locating...' : (userLocation ? 'Location Active' : 'Use My Location')}
            </button>
          </div>

          <div className="filter-group">
            <label>Experience</label>
            <select 
              value={filters.experience} 
              onChange={(e) => setFilters({ ...filters, experience: Number(e.target.value) })}
            >
              <option value={0}>Any Experience</option>
              <option value={5}>5+ Years</option>
              <option value={10}>10+ Years</option>
              <option value={15}>15+ Years</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Maximum Price: ₹{filters.maxPrice}</label>
            <input 
              type="range" 
              min="300" max="2000" step="100" 
              value={filters.maxPrice}
              onChange={(e) => setFilters({ ...filters, maxPrice: Number(e.target.value) })}
            />
            <div className="flex-between text-muted"><small>₹300</small><small>₹2000</small></div>
          </div>

          <div className="filter-group">
            <label>Language</label>
            <select 
              value={filters.language} 
              onChange={(e) => setFilters({ ...filters, language: e.target.value })}
            >
              <option value="">Any Language</option>
              <option value="English">English</option>
              <option value="Kannada">Kannada</option>
              <option value="Hindi">Hindi</option>
              <option value="Telugu">Telugu</option>
              <option value="Tamil">Tamil</option>
              <option value="Malayalam">Malayalam</option>
            </select>
          </div>

          {userLocation && (
            <div className="filter-group">
              <label>Maximum Distance</label>
              <select 
                value={filters.distance} 
                onChange={(e) => setFilters({ ...filters, distance: Number(e.target.value) })}
              >
                <option value={0}>Any Distance</option>
                <option value={5}>Within 5 km</option>
                <option value={10}>Within 10 km</option>
                <option value={20}>Within 20 km</option>
              </select>
            </div>
          )}
          
          <button 
            className="btn-secondary full-width mt-1" 
            onClick={() => setFilters(DEFAULT_FILTERS)}
          >
            Clear Filters
          </button>
        </aside>

        {/* Doctors List */}
        <main className="doctors-list">
          {displayDoctors.length === 0 ? (
            <div className="glass-card text-center" style={{ padding: '3rem', margin: 'auto' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👩‍⚕️</div>
              <h3 className="text-muted">No doctors match your criteria</h3>
              <p className="text-muted mb-2">Try adjusting your filters or price range to see more results.</p>
              <button className="btn-primary" onClick={() => setFilters(DEFAULT_FILTERS)}>Reset All Filters</button>
            </div>
          ) : (
            displayDoctors.map(doc => (
              <motion.div 
                key={doc.id} 
                className="doctor-card glass-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                layout
              >
                {doc.isAIRecommended && (
                  <div className="recommendation-badge bg-primary">
                    🤖 AI Recommended for {condition}
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
                    
                    <p className="doc-langs text-muted"><small>Speaks: {doc.languages.join(', ')}</small></p>
                    
                    {consultType === 'offline' && (
                      <div className="doc-clinic flex-center">
                        <MapPin size={14} className="text-secondary" /> 
                        <small>{doc.clinic} ({userLocation ? `${doc.distance.toFixed(1)} km away` : 'Distance unknown'})</small>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="doc-actions">
                  <div className="price">
                    <span className="price-val">₹{consultType === 'online' ? doc.priceOnline : doc.priceOffline}</span>
                    <span className="price-label">/ consult</span>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <button 
                      className="btn-primary flex-center"
                      style={{ gap: '0.5rem', justifyContent: 'center' }}
                      onClick={() => handleBook(doc)}
                    >
                      <CheckCircle size={16} /> Book Now
                    </button>
                    <button 
                      className="btn-secondary flex-center"
                      style={{ gap: '0.5rem', justifyContent: 'center' }}
                      onClick={() => navigate(`/chat/${doc.id}`)}
                    >
                      <MessageSquare size={16} /> Start Chat
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </main>
      </div>
    </div>
  );
};

export default Doctors;
