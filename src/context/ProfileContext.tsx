import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { UserProfile, defaultProfile } from "@/types/profile";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useSelectedLanguage } from "@/hooks/useSelectedLanguage";

interface ProfileContextType {
  profile: UserProfile;
  setProfile: (p: UserProfile) => void;
  updateProfile: (partial: Partial<UserProfile>) => void;
  loading: boolean;
}

const ProfileContext = createContext<ProfileContextType | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { code } = useSelectedLanguage();
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
        const [{ data: prof }, { data: lp }] = await Promise.all([
          supabase
            .from("profiles")
            .select("display_name, preferred_language")
            .eq("user_id", user.id)
            .maybeSingle(),
          supabase
            .from("language_profiles")
            .select("level, learning_goal, focus_area, confidence_level, preferred_tone, lives_in_norway")
            .eq("user_id", user.id)
            .eq("language", code)
            .maybeSingle(),
        ]);

        const dbProfile: UserProfile = {
          name: prof?.display_name || "",
          level: (lp?.level as UserProfile["level"]) || "A1",
          learning_goal: lp?.learning_goal || defaultProfile.learning_goal,
          preferred_tone: lp?.preferred_tone || defaultProfile.preferred_tone,
          focus_area: lp?.focus_area || defaultProfile.focus_area,
          confidence_level: lp?.confidence_level ?? defaultProfile.confidence_level,
          lives_in_norway: lp?.lives_in_norway ?? defaultProfile.lives_in_norway,
        };
        setProfile(dbProfile);
        localStorage.setItem("norskly_profile", JSON.stringify(dbProfile));
        if (prof?.preferred_language) {
          localStorage.setItem("norskly_selected_language", prof.preferred_language);
        }
      } catch (e) {
        console.error("Failed to fetch profile from DB", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [user, code]);

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
