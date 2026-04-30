import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Scan from './pages/Scan';
import Doctors from './pages/Doctors';
import Medications from './pages/Medications';
import History from './pages/History';
import Records from './pages/Records';
import Settings from './pages/Settings';
import Auth from './pages/Auth';
import Tips from './pages/Tips';
import AIGuide from './components/AIGuide';
import WalkthroughOverlay from './components/WalkthroughOverlay';
import WebsiteFeedbackModal from './components/WebsiteFeedbackModal';
import DoctorFeedbackModal from './components/DoctorFeedbackModal';

function App() {
  return (
    <AppProvider>
      <Router>
        <div className="app-wrapper">
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/scan" element={<Scan />} />
              <Route path="/doctors" element={<Doctors />} />
              <Route path="/history" element={<History />} />
              <Route path="/records" element={<Records />} />
              <Route path="/medications" element={<Medications />} />
              <Route path="/tips" element={<Tips />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/auth" element={<Auth />} />
            </Routes>
          </main>
          <AIGuide />
          <WalkthroughOverlay />
          <WebsiteFeedbackModal />
          <DoctorFeedbackModal />
        </div>
      </Router>
    </AppProvider>
  );
}

export default App;
