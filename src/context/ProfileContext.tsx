import { createContext, useContext, useState, ReactNode } from "react";
import { UserProfile, defaultProfile } from "@/types/profile";

interface ProfileContextType {
  profile: UserProfile;
  setProfile: (p: UserProfile) => void;
  updateProfile: (partial: Partial<UserProfile>) => void;
}

const ProfileContext = createContext<ProfileContextType | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem("norskly_profile");
    return saved ? JSON.parse(saved) : defaultProfile;
  });

  const updateProfile = (partial: Partial<UserProfile>) => {
    setProfile((prev) => {
      const next = { ...prev, ...partial };
      localStorage.setItem("norskly_profile", JSON.stringify(next));
      return next;
    });
  };

  const setFullProfile = (p: UserProfile) => {
    localStorage.setItem("norskly_profile", JSON.stringify(p));
    setProfile(p);
  };

  return (
    <ProfileContext.Provider value={{ profile, setProfile: setFullProfile, updateProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used within ProfileProvider");
  return ctx;
}
