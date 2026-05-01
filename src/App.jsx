import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import AIGuide from './components/AIGuide';
import WalkthroughOverlay from './components/WalkthroughOverlay';
import WebsiteFeedbackModal from './components/WebsiteFeedbackModal';
import DoctorFeedbackModal from './components/DoctorFeedbackModal';

const Home = React.lazy(() => import('./pages/Home'));
const Scan = React.lazy(() => import('./pages/Scan'));
const Doctors = React.lazy(() => import('./pages/Doctors'));
const Medications = React.lazy(() => import('./pages/Medications'));
const History = React.lazy(() => import('./pages/History'));
const Records = React.lazy(() => import('./pages/Records'));
const Settings = React.lazy(() => import('./pages/Settings'));
const Auth = React.lazy(() => import('./pages/Auth'));
const Tips = React.lazy(() => import('./pages/Tips'));
const Chat = React.lazy(() => import('./pages/Chat'));
const AdminFeedback = React.lazy(() => import('./pages/AdminFeedback'));
const DoctorDashboard = React.lazy(() => import('./pages/DoctorDashboard'));
const PatientDashboard = React.lazy(() => import('./pages/PatientDashboard'));
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <Router>
          <div className="app-wrapper">
            <Navbar />
            <main>
              <Suspense fallback={<div className="flex-center" style={{ height: '50vh', width: '100%' }}><div className="spinner text-primary" style={{width: '40px', height: '40px'}}></div></div>}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/auth" element={<Auth />} />
                  
                  {/* Doctor Only Routes */}
                  <Route path="/doctor-dashboard" element={<ProtectedRoute allowedRoles={['doctor']}><DoctorDashboard /></ProtectedRoute>} />
                  
                  {/* Patient Only Routes */}
                  <Route path="/patient-dashboard" element={<ProtectedRoute allowedRoles={['user', 'patient']}><PatientDashboard /></ProtectedRoute>} />
                  <Route path="/scan" element={<ProtectedRoute allowedRoles={['user', 'patient']}><Scan /></ProtectedRoute>} />
                  <Route path="/doctors" element={<ProtectedRoute allowedRoles={['user', 'patient']}><Doctors /></ProtectedRoute>} />
                  <Route path="/history" element={<ProtectedRoute allowedRoles={['user', 'patient']}><History /></ProtectedRoute>} />
                  <Route path="/records" element={<ProtectedRoute allowedRoles={['user', 'patient']}><Records /></ProtectedRoute>} />
                  <Route path="/medications" element={<ProtectedRoute allowedRoles={['user', 'patient']}><Medications /></ProtectedRoute>} />
                  
                  {/* Common Protected Routes */}
                  <Route path="/tips" element={<ProtectedRoute><Tips /></ProtectedRoute>} />
                  <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                  <Route path="/chat/:doctorId" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
                  
                  <Route path="/admin/feedback" element={<AdminFeedback />} />
                </Routes>
              </Suspense>
            </main>
            <AIGuide />
            <WalkthroughOverlay />
            <WebsiteFeedbackModal />
            <DoctorFeedbackModal />
          </div>
        </Router>
      </AppProvider>
    </AuthProvider>
  );
}

export default App;
