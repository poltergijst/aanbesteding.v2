import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';

interface Profile {
  id: string;
  organization_id: string;
  email: string;
  full_name: string | null;
  role: 'admin' | 'jurist' | 'procurement_officer';
  is_active: boolean;
  organization?: {
    id: string;
    name: string;
    type: string;
  };
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
  hasRole: (roles: string | string[]) => boolean;
  canAccess: (resource: string, action: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await loadProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          organization:organizations(id, name, type)
        `)
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error loading profile:', error);
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    const result = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (!result.error && result.data.user) {
      // Update last login
      await supabase
        .from('profiles')
        .update({ last_login: new Date().toISOString() })
        .eq('id', result.data.user.id);
    }
    
    setLoading(false);
    return { error: result.error };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    setLoading(true);
    const result = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    setLoading(false);
    return { error: result.error };
  };

  const signOut = async () => {
    setLoading(true);
    const result = await supabase.auth.signOut();
    setProfile(null);
    setLoading(false);
    return { error: result.error };
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error('No user logged in') };

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      // Reload profile
      await loadProfile(user.id);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const hasRole = (roles: string | string[]): boolean => {
    if (!profile) return false;
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(profile.role);
  };

  const canAccess = (resource: string, action: string): boolean => {
    if (!profile || !profile.is_active) return false;

    // Admin can do everything
    if (profile.role === 'admin') return true;

    // Define role-based permissions
    const permissions: Record<string, Record<string, string[]>> = {
      tenders: {
        read: ['admin', 'jurist', 'procurement_officer'],
        create: ['admin', 'procurement_officer'],
        update: ['admin', 'procurement_officer'],
        delete: ['admin'],
      },
      submissions: {
        read: ['admin', 'jurist', 'procurement_officer'],
        create: ['admin', 'procurement_officer'],
        update: ['admin', 'jurist', 'procurement_officer'],
        delete: ['admin'],
      },
      documents: {
        read: ['admin', 'jurist', 'procurement_officer'],
        create: ['admin', 'jurist', 'procurement_officer'],
        update: ['admin', 'jurist'],
        delete: ['admin'],
      },
      analyses: {
        read: ['admin', 'jurist', 'procurement_officer'],
        create: ['admin', 'jurist'],
        update: ['admin', 'jurist'],
        delete: ['admin'],
      },
      checklists: {
        read: ['admin', 'jurist', 'procurement_officer'],
        create: ['admin', 'jurist'],
        update: ['admin', 'jurist'],
        delete: ['admin'],
      },
      users: {
        read: ['admin'],
        create: ['admin'],
        update: ['admin'],
        delete: ['admin'],
      },
    };

    const resourcePermissions = permissions[resource];
    if (!resourcePermissions) return false;

    const actionPermissions = resourcePermissions[action];
    if (!actionPermissions) return false;

    return actionPermissions.includes(profile.role);
  };

  const value = {
    user,
    profile,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    hasRole,
    canAccess,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}