import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../config/supabaseClient';

const AuthContext = createContext();

const DEMO_PATIENT = {
  id: 'demo-patient-123',
  email: 'patient@demo.com',
  full_name: 'Alex Johnson',
  name: 'Alex Johnson',
  role: 'patient',
  age: 28,
  gender: 'Male',
  medical_history: 'Eczema sensitivity'
};

const DEMO_DOCTOR = {
  id: 'demo-doctor-456',
  email: 'dr.smith@demo.com',
  full_name: 'Dr. Sarah Jenkins',
  name: 'Dr. Sarah Jenkins',
  role: 'doctor',
  specialization: 'Dermatologist',
  experience: '8 Years',
  clinic_name: 'City Skin Care Clinic'
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(DEMO_PATIENT);
  const [session, setSession] = useState({ user: DEMO_PATIENT });
  const [profile, setProfile] = useState(DEMO_PATIENT); // data from profiles table
  const [role, setRole] = useState('patient');           // 'patient' | 'doctor'
  const [loading, setLoading] = useState(false);        // initial auth check

  // Quick Demo Login function
  const loginAsDemo = (targetRole = 'patient') => {
    const demoData = targetRole === 'doctor' ? DEMO_DOCTOR : DEMO_PATIENT;
    setUser(demoData);
    setSession({ user: demoData });
    setProfile(demoData);
    setRole(demoData.role);
  };

  // Fetch the profile row from the profiles table
  const fetchProfile = async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error.message);
      return null;
    }
    return data;
  };

  // -----------------------------------------
  //   Sign Up
  // -----------------------------------------
  const signUp = async ({ email, password, name, role }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, full_name: name, role }
      }
    });
    return { data, error };
  };

  // -----------------------------------------
  //   Login
  // -----------------------------------------
  const signIn = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { data, error };
  };

  // -----------------------------------------
  //   Logout
  // -----------------------------------------
  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRole(null);
  };

  // -----------------------------------------
  //  Mark first login as done
  // -----------------------------------------
  const markFirstLoginDone = async () => {
    if (!user) return;
    await supabase
      .from('profiles')
      .update({ is_first_login: false })
      .eq('id', user.id);

    setProfile(prev => prev ? { ...prev, is_first_login: false } : prev);
  };

  // -----------------------------------------
  //   Session Listener
  // -----------------------------------------
  useEffect(() => {
    // Get initial session
    const initSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (session?.user) {
          setSession(session);
          setUser(session.user);
          const prof = await fetchProfile(session.user.id);
          if (prof) {
            setProfile(prof);
            setRole(prof.role ?? null);
          }
        }
      } catch (err) {
        console.error('Error getting session:', err);
      } finally {
        setLoading(false);
      }
    };

    initSession();

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setSession(session);
          setUser(session.user);
          const prof = await fetchProfile(session.user.id);
          if (prof) {
            setProfile(prof);
            setRole(prof.role ?? null);
          }
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const isAuthenticated = !!session;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        role,
        loading,
        isAuthenticated,
        signUp,
        signIn,
        logout,
        loginAsDemo,
        markFirstLoginDone,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
