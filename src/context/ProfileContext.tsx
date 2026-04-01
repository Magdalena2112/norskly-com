import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { UserProfile, defaultProfile } from "@/types/profile";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface ProfileContextType {
  profile: UserProfile;
  setProfile: (p: UserProfile) => void;
  updateProfile: (partial: Partial<UserProfile>) => void;
  loading: boolean;
}

const ProfileContext = createContext<ProfileContextType | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem("norskly_profile");
    return saved ? JSON.parse(saved) : defaultProfile;
  });

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("display_name, level, learning_goal, focus_area, confidence_level")
          .eq("user_id", user.id)
          .maybeSingle();

        if (data) {
          const dbProfile: UserProfile = {
            name: data.display_name || "",
            level: (data.level as UserProfile["level"]) || "A1",
            learning_goal: data.learning_goal || defaultProfile.learning_goal,
            preferred_tone: profile.preferred_tone || defaultProfile.preferred_tone,
            focus_area: data.focus_area || defaultProfile.focus_area,
            confidence_level: data.confidence_level ?? defaultProfile.confidence_level,
            lives_in_norway: profile.lives_in_norway ?? defaultProfile.lives_in_norway,
          };
          setProfile(dbProfile);
          localStorage.setItem("norskly_profile", JSON.stringify(dbProfile));
        }
      } catch (e) {
        console.error("Failed to fetch profile from DB", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

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
    <ProfileContext.Provider value={{ profile, setProfile: setFullProfile, updateProfile, loading }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used within ProfileProvider");
  return ctx;
}
