import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as fbSignOut
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
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

// Helper to normalize phone numbers (e.g. 01012345678 -> 201012345678)
export const normalizePhoneNumber = (rawPhone: string): string => {
  return rawPhone.replace(/\D/g, '');
};

// Create a synthetic email representation for Firebase Auth provider based on phone number
const phoneToAuthEmail = (normalizedPhone: string): string => {
  return `user_${normalizedPhone}@fixboard.auth`;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (firebaseUser: User) => {
    try {
      const userRef = doc(db, 'users', firebaseUser.uid);
      const snapshot = await getDoc(userRef);

      if (snapshot.exists()) {
        const data = snapshot.data() as UserProfile;
        setProfile(data);
      } else {
        // Look up by phone if stored
        const phone = firebaseUser.email?.replace('user_', '').replace('@fixboard.auth', '') || '';
        const newProfile: UserProfile = {
          uid: firebaseUser.uid,
          phoneNumber: phone,
          displayName: 'فني صيانة FixBoard',
          role: 'technician',
          createdAt: Date.now(),
        };
        await setDoc(userRef, newProfile);
        setProfile(newProfile);
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currUser) => {
      setUser(currUser);
      if (currUser) {
        await fetchProfile(currUser);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithPhone = async (phone: string, pass: string) => {
    const cleanPhone = normalizePhoneNumber(phone);
    if (!cleanPhone || cleanPhone.length < 6) {
      throw new Error('يرجى إدخال رقم هاتف صحيح');
    }
    const syntheticEmail = phoneToAuthEmail(cleanPhone);
    await signInWithEmailAndPassword(auth, syntheticEmail, pass);
  };

  const signUpWithPhone = async (name: string, phone: string, pass: string) => {
    const cleanPhone = normalizePhoneNumber(phone);
    if (!cleanPhone || cleanPhone.length < 6) {
      throw new Error('يرجى إدخال رقم هاتف صالح (أرقام فقط)');
    }

    // Check if phone already registered in directory
    const dirRef = doc(db, 'phone_directory', cleanPhone);
    const dirSnap = await getDoc(dirRef);
    if (dirSnap.exists()) {
      throw new Error('رقم الهاتف هذا مسجل بالفعل في منصة FixBoard. يرجى تسجيل الدخول بدلاً من ذلك.');
    }

    const syntheticEmail = phoneToAuthEmail(cleanPhone);
    const cred = await createUserWithEmailAndPassword(auth, syntheticEmail, pass);

    // Save profile to Firestore
    const newProfile: UserProfile = {
      uid: cred.user.uid,
      phoneNumber: cleanPhone,
      displayName: name.trim(),
      role: 'technician',
      createdAt: Date.now(),
    };

    // Save user document
    await setDoc(doc(db, 'users', cred.user.uid), newProfile);

    // Save phone directory mapping for uniqueness and fast lookup
    await setDoc(dirRef, {
      uid: cred.user.uid,
      phoneNumber: cleanPhone,
      displayName: name.trim(),
      createdAt: Date.now()
    });

    setProfile(newProfile);
  };

  const signOut = async () => {
    await fbSignOut(auth);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user);
    }
  };

  // Determine admin rights (first user or role 'admin')
  const isAdmin = profile?.role === 'admin' || profile?.displayName?.includes('Admin') || false;
  const isTechnician = true;

  return (
    <AuthContext.Provider
      value={{
        user,
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
