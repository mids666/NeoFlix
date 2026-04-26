import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, setDoc, collection, query, orderBy } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserData, Profile } from '../types';

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  profiles: Profile[];
  currentProfile: Profile | null;
  setCurrentProfile: (profile: Profile | null) => void;
  loading: boolean;
  isAuthReady: boolean;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentProfileId, setCurrentProfileId] = useState<string | null>(() => {
    // We can't access user.uid here yet, but we'll handle it in useEffect
    return null;
  });
  const [loading, setLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const currentProfile = profiles.find(p => p.id === currentProfileId) || null;

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setIsAuthReady(true);
      
      if (!firebaseUser) {
        setUserData(null);
        setProfiles([]);
        setCurrentProfileId(null);
        setLoading(false);
      } else {
        // Load last profile ID from localStorage
        const savedProfileId = localStorage.getItem(`currentProfile_${firebaseUser.uid}`);
        if (savedProfileId) {
          setCurrentProfileId(savedProfileId);
        }
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setUserData(docSnap.data() as UserData);
      } else {
        const newUserData: UserData = {
          email: user.email || '',
          subscriptionStatus: 'active', // Everyone is active by default
        };
        setDoc(userDocRef, newUserData);
        setUserData(newUserData);
      }
    });

    const profilesRef = collection(db, 'users', user.uid, 'profiles');
    const q = query(profilesRef, orderBy('createdAt', 'asc'));
    const unsubscribeProfiles = onSnapshot(q, (snapshot) => {
      const profilesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Profile[];
      setProfiles(profilesData);
      
      // If there's only one profile and none selected, auto-select it
      if (profilesData.length === 1 && !currentProfileId) {
        setCurrentProfileId(profilesData[0].id);
        localStorage.setItem(`currentProfile_${user.uid}`, profilesData[0].id);
      }
      setLoading(false);
    });

    return () => {
      unsubscribeUser();
      unsubscribeProfiles();
    };
  }, [user, currentProfileId]);

  useEffect(() => {
    if (currentProfile?.themeColor) {
      document.documentElement.style.setProperty('--brand', currentProfile.themeColor);
    } else {
      // Default to red-600 equivalent
      document.documentElement.style.setProperty('--brand', 'oklch(0.6 0.25 25)');
    }
  }, [currentProfile?.themeColor]);

  const handleSetCurrentProfile = (profile: Profile | null) => {
    const profileId = profile?.id || null;
    setCurrentProfileId(profileId);
    if (user && profileId) {
      localStorage.setItem(`currentProfile_${user.uid}`, profileId);
    } else if (user) {
      localStorage.removeItem(`currentProfile_${user.uid}`);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      userData, 
      profiles, 
      currentProfile, 
      setCurrentProfile: handleSetCurrentProfile, 
      loading, 
      isAuthReady,
      showAuthModal,
      setShowAuthModal
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
