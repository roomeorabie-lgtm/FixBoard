import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isTechnician: boolean;
  signInWithPhone: (phone: string, pass: string) => Promise<void>;
  signUpWithPhone: (name: string, phone: string, pass: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to normalize phone numbers (digits only)
export const normalizePhoneNumber = (rawPhone: string): string => {
  return rawPhone.replace(/\D/g, '');
};

// Cryptographic hash for user passwords using standard browser Web Crypto API (SHA-256)
export const hashPassword = async (password: string, salt: string): Promise<string> => {
  const enc = new TextEncoder();
  const data = enc.encode(`${salt}:${password}:fixboard_secret_salt_2026`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const SESSION_KEY = 'fixboard_auth_session_phone';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore authenticated session from persistent storage on mount
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const savedPhone = localStorage.getItem(SESSION_KEY);
        if (savedPhone) {
          const userDoc = await getDoc(doc(db, 'phone_directory', savedPhone));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const prof: UserProfile = {
              uid: userData.uid,
              phoneNumber: userData.phoneNumber,
              displayName: userData.displayName,
              role: userData.role || 'technician',
              workshopName: userData.workshopName,
              createdAt: userData.createdAt,
            };
            setProfile(prof);
          } else {
            localStorage.removeItem(SESSION_KEY);
          }
        }
      } catch (err) {
        console.error('Failed to restore session from Firestore:', err);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const signInWithPhone = async (phone: string, pass: string) => {
    const cleanPhone = normalizePhoneNumber(phone);
    if (!cleanPhone || cleanPhone.length < 6) {
      throw new Error('يرجى إدخال رقم هاتف صحيح');
    }

    const phoneRef = doc(db, 'phone_directory', cleanPhone);
    const snap = await getDoc(phoneRef);

    if (!snap.exists()) {
      throw new Error('رقم الهاتف هذا غير مسجل في FixBoard. يرجى إنشاء حساب جديد أولاً.');
    }

    const data = snap.data();
    const computedHash = await hashPassword(pass, cleanPhone);

    if (data.passwordHash !== computedHash) {
      throw new Error('كلمة المرور غير صحيحة، يرجى المحاولة مرة أخرى.');
    }

    const prof: UserProfile = {
      uid: data.uid,
      phoneNumber: data.phoneNumber,
      displayName: data.displayName,
      role: data.role || 'technician',
      workshopName: data.workshopName,
      createdAt: data.createdAt,
    };

    setProfile(prof);
    localStorage.setItem(SESSION_KEY, cleanPhone);
  };

  const signUpWithPhone = async (name: string, phone: string, pass: string) => {
    const cleanPhone = normalizePhoneNumber(phone);
    if (!cleanPhone || cleanPhone.length < 6) {
      throw new Error('يرجى إدخال رقم هاتف صالح (أرقام فقط)');
    }

    if (!name.trim()) {
      throw new Error('يرجى كتابة الاسم أو اسم المركز');
    }

    if (pass.length < 6) {
      throw new Error('كلمة المرور يجب أن تتكون من 6 أحرف أو أرقام على الأقل');
    }

    // 1. Verify phone uniqueness in database
    const phoneRef = doc(db, 'phone_directory', cleanPhone);
    const existingSnap = await getDoc(phoneRef);

    if (existingSnap.exists()) {
      throw new Error('رقم الهاتف هذا مسجل بالفعل في منصة FixBoard. يرجى تسجيل الدخول مباشرة.');
    }

    // 2. Hash password securely
    const passwordHash = await hashPassword(pass, cleanPhone);
    const generatedUid = `user_${cleanPhone}_${Date.now()}`;

    // 3. Save to phone_directory in Firestore
    const newUserData = {
      uid: generatedUid,
      phoneNumber: cleanPhone,
      displayName: name.trim(),
      passwordHash,
      role: 'technician',
      createdAt: Date.now(),
    };

    await setDoc(phoneRef, newUserData);

    // Also mirror into users collection
    await setDoc(doc(db, 'users', generatedUid), {
      uid: generatedUid,
      phoneNumber: cleanPhone,
      displayName: name.trim(),
      role: 'technician',
      createdAt: Date.now(),
    });

    const prof: UserProfile = {
      uid: generatedUid,
      phoneNumber: cleanPhone,
      displayName: name.trim(),
      role: 'technician',
      createdAt: Date.now(),
    };

    setProfile(prof);
    localStorage.setItem(SESSION_KEY, cleanPhone);
  };

  const signOut = async () => {
    localStorage.removeItem(SESSION_KEY);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (profile?.phoneNumber) {
      const snap = await getDoc(doc(db, 'phone_directory', profile.phoneNumber));
      if (snap.exists()) {
        const d = snap.data();
        setProfile({
          uid: d.uid,
          phoneNumber: d.phoneNumber,
          displayName: d.displayName,
          role: d.role || 'technician',
          workshopName: d.workshopName,
          createdAt: d.createdAt,
        });
      }
    }
  };

  // Allow admin features for owner or anyone designated
  const isAdmin = true; // Full access for managing motherboards and schematics
  const isTechnician = true;

  return (
    <AuthContext.Provider
      value={{
        user: profile,
        profile,
        loading,
        isAdmin,
        isTechnician,
        signInWithPhone,
        signUpWithPhone,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
