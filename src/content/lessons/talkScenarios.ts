export interface TalkScenario {
  id: string;
  title: string;
  description: string;
  aiRole: string;
  studentRole: string;
  opening: string;
  goals: string[];
  instructions: string;
  /** Glas sagovornika: f = ženski, m = muški. */
  voice?: "f" | "m";
}

/** Obavezne razgovorne situacije po lekciji (lesson_code). */
export const TALK_SCENARIOS: Record<string, TalkScenario[]> = {
  "EN-A1-L01": [
    {
      id: "RZ-01",
      voice: "f",
      title: "Prvi dan u školi",
      description: "Upoznaješ novu drugaricu iz razreda u hodniku.",
      aiRole: "Sophie, nova učenica u školi",
      studentRole: "Učenik/učenica koji upoznaje Sophie",
      opening: "Hi! I'm Sophie. I'm new here. What's your name?",
      goals: ["Pozdravi i predstavi se", "Reci odakle si", "Pitaj Sophie kako je", "Pozdravi se na kraju"],
      instructions: "Play Sophie, a friendly new student. Ask the learner's name, where they are from and how they are. If the learner forgets a goal, gently prompt it with a simple question. Use only A1 language: to be, personal pronouns, greetings.",
    },
    {
      id: "RZ-02",
      voice: "f",
      title: "Upis u školsku kancelariju",
      description: "Sekretarica te upisuje i traži osnovne podatke.",
      aiRole: "Mrs Brown, školska sekretarica",
      studentRole: "Novi učenik koji se upisuje",
      opening: "Good morning! Welcome to the school office. Can I have your name, please?",
      goals: ["Reci ime i prezime", "Speluj svoje ime", "Reci koliko imaš godina", "Zahvali se"],
      instructions: "Play a polite school secretary filling in a form. Ask for full name, ask the learner to spell it, ask their age and phone number. Keep sentences very short (A1).",
    },
    {
      id: "RZ-03",
      voice: "m",
      title: "U učionici",
      description: "Nastavnik pita šta imaš u torbi i kako se osećaš.",
      aiRole: "Mr Smith, nastavnik engleskog",
      studentRole: "Učenik na času",
      opening: "Hello, class! Let's start. How are you today?",
      goals: ["Reci kako se osećaš", "Nabroji 3 predmeta iz torbe (a/an)", "Pitaj nastavnika jedno pitanje"],
      instructions: "Play a friendly teacher. Ask how the learner feels (happy, tired...), what is in their bag (a book, an eraser...), and invite them to ask you a question. Correct a/an gently.",
    },
    {
      id: "RZ-04",
      voice: "m",
      title: "Upoznaj mog prijatelja",
      description: "Liam ti predstavlja svog prijatelja i postavlja pitanja.",
      aiRole: "Liam, učenik koji predstavlja prijatelja Olivera",
      studentRole: "Učenik koji upoznaje novog druga",
      opening: "Hey! This is my friend Oliver. He is from London. And you? Where are you from?",
      goals: ["Odgovori odakle si", "Pitaj koliko Oliver ima godina", "Upotrebi he/she/they is/are", "Kaži broj telefona (0–20 cifre)"],
      instructions: "Play Liam introducing Oliver. Use he/she/they with to be. Ask the learner questions and encourage them to ask about Oliver. Stay at A1 level.",
    },
  ],
};

export function getTalkScenarios(code?: string | null): TalkScenario[] {
  return code ? TALK_SCENARIOS[code] ?? [] : [];
}

/** Sažetak gradiva lekcije koji AI koristi u obaveznim situacijama. */
export const LESSON_MATERIAL: Record<string, string> = {
  "EN-A1-L01": `Course level A1, Lesson 1.
Grammar: personal pronouns (I, you, he, she, it, we, they); verb to be in present (am/is/are, negative isn't/aren't, questions Are you...? Is she...?, short forms I'm/you're/he's); articles a/an (a book, an eraser, an apple).
Vocabulary: greetings & introductions (hello, hi, good morning, goodbye, see you, nice to meet you, my name is, I'm from, how are you, I'm fine/great/OK, thank you); people & feelings (friend, student, teacher, classmate, boy, girl, happy, sad, tired, fine, hungry, new); classroom objects (book, pen, pencil, eraser, notebook, bag/backpack, desk, chair, board, phone, ruler); numbers 0–20 (age, phone numbers); spelling names with the alphabet ("How do you spell that?").`,
};

export function getLessonMaterial(code?: string | null): string | undefined {
  return code ? LESSON_MATERIAL[code] : undefined;
}
