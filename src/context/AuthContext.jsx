import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../config/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null); // data from profiles table
  const [role, setRole] = useState(null);        // 'user' | 'doctor'
  const [loading, setLoading] = useState(true);  // initial auth check

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
  //   Send OTP
  // -----------------------------------------
  const sendOtp = async (phone) => {
    const { data, error } = await supabase.auth.signInWithOtp({ phone });
    return { data, error };
  };

  // -----------------------------------------
  //   Verify OTP
  // -----------------------------------------
  const verifyOtp = async (phone, token) => {
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms'
    });
    return { data, error };
  };

  // -----------------------------------------
  //   Update Profile (Role & Name for new users)
  // -----------------------------------------
  const completeProfile = async (userId, profileData) => {
    // Upsert the profile record
    const { data, error } = await supabase
      .from('profiles')
      .upsert({ id: userId, ...profileData });
      
    if (!error) {
      setProfile(prev => ({ ...prev, ...profileData }));
      setRole(profileData.role);
    }
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
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        const prof = await fetchProfile(session.user.id);
        setProfile(prof);
        setRole(prof?.role ?? null);
      }
      setLoading(false);
    });

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          const prof = await fetchProfile(session.user.id);
          setProfile(prof);
          setRole(prof?.role ?? null);
        } else {
          setProfile(null);
          setRole(null);
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
        sendOtp,
        verifyOtp,
        completeProfile,
        logout,
        markFirstLoginDone,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
