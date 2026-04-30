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
  //   Signup — Two-step process:
  //   Step 1: auth.signUp() with name + role as metadata.
  //           DB trigger auto-creates the profiles row.
  //   Step 2: If role = doctor, update profiles with extra fields.
  //           (signUp only accepts email, password, options.data)
  // -----------------------------------------
  const signUp = async ({ email, password, name, role, specialization, regNumber, clinicName }) => {
    // Step 1 — Create auth user with metadata only
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role, // 'user' | 'doctor'
        },
      },
    });

    if (error) return { error };

    // Step 2 — Update doctor-specific fields in profiles table
    // The trigger creates the row first; we update extra columns after.
    if (role === 'doctor' && data?.user) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          specialization: specialization || null,
          registration_number: regNumber || null,
          clinic_name: clinicName || null,
        })
        .eq('id', data.user.id);

      if (updateError) {
        // Non-fatal — auth user was created, log and continue
        console.warn('Doctor profile update failed:', updateError.message);
      }
    }

    return { data };
  };

  // -----------------------------------------
  //   Login
  // -----------------------------------------
  const signIn = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error };

    // profile is loaded via onAuthStateChange
    return { data };
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
        signUp,
        signIn,
        logout,
        markFirstLoginDone,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
