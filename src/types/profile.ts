export interface UserProfile {
  name: string;
  level: "A1" | "A2" | "B1" | "B2" | "C1";
  learning_goal: string;
  preferred_tone: string;
  focus_area: string;
  confidence_level: number;
  lives_in_norway: boolean;
}

export const defaultProfile: UserProfile = {
  name: "",
  level: "A1",
  learning_goal: "svakodnevna komunikacija",
  preferred_tone: "opušten",
  focus_area: "govor",
  confidence_level: 3,
  lives_in_norway: false,
};
