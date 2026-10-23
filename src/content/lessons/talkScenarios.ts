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
  "EN-A2-L01": [
    {
      id: "S-01",
      voice: "f",
      title: "Tell Me About Your Day",
      description: "Piješ kafu sa novim prijateljem i pričaš o svom tipičnom radnom danu.",
      aiRole: "Novi prijatelj na kafi",
      studentRole: "Učenik opisuje svoj uobičajeni dan",
      opening: "Hey! It's nice to meet you! Tell me, what does a typical weekday look like for you?",
      goals: ["Opiši jutarnju rutinu", "Reci šta radiš na poslu ili u školi", "Nabroj slobodne aktivnosti", "Koristi priloge učestalosti (usually, always, sometimes)"],
      instructions: "Play a friendly new friend having coffee with the learner. Ask about their typical weekday: morning routine, work or school, free-time activities. Ask one question per turn, react to what the learner actually says, and adapt follow-ups. Encourage Present Simple and frequency adverbs. Keep language at A2 level. Don't interrupt for every grammar mistake; rephrase simply if the learner doesn't understand. About 6–8 exchanges.",
    },
    {
      id: "S-02",
      voice: "m",
      title: "Let's Share the Housework",
      description: "Deliš stan sa AI sagovornikom i dogovarate ko će koji kućni posao raditi.",
      aiRole: "Cimer/cimerka u zajedničkom stanu",
      studentRole: "Učenik dogovara raspodelu kućnih poslova",
      opening: "Hey! We have quite a lot to do this weekend. I can cook dinner, but we also need to clean the flat. What would you like to do?",
      goals: ["Predloži koji posao možeš da uradiš (can)", "Reci šta mora da se uradi (need to)", "Dogovori raspodelu poslova", "Koristi vokabular za kućne poslove"],
      instructions: "Play the learner's flatmate. You both have a busy weekend and must divide the household chores. Have your own obligations, opinions and suggestions (e.g. you can cook dinner but you need to work on Saturday morning). Encourage can, need to, household vocabulary and making suggestions. Ask one question per turn, stay at A2 level, about 6–8 exchanges.",
    },
    {
      id: "S-03",
      voice: "f",
      title: "What Are You Doing These Days?",
      description: "Nailaziš na starog prijatelja i pričate o navikama i promenama u životu.",
      aiRole: "Stari prijatelj kojeg dugo nisi video/la",
      studentRole: "Učenik priča o navikama i trenutnim promenama",
      opening: "Hey! It's been a while! How are things going? Are you doing anything new these days?",
      goals: ["Opiši svakodnevne navike (Present Simple)", "Reci šta se trenutno menja (Present Continuous)", "Koristi at the moment, these days, usually", "Razlikuj stalne od privremenih aktivnosti"],
      instructions: "Play an old friend catching up with the learner. Talk about usual activities and what is changing in the learner's life at the moment. Encourage the contrast between Present Simple (habits) and Present Continuous (temporary, at the moment, these days). Ask one question per turn, react naturally, stay at A2 level, about 6–8 exchanges.",
    },
    {
      id: "S-04",
      voice: "m",
      title: "Making Weekend Plans",
      description: "Sa prijateljem planiraš subotu, ali oboje imate obaveze — nađite zajednički termin i aktivnost.",
      aiRole: "Prijatelj koji planira subotu",
      studentRole: "Učenik predlaže aktivnosti i dogovara termin",
      opening: "Hey! Do you want to do something together on Saturday? I'm busy in the morning, but I might be free later. What are your plans?",
      goals: ["Predloži aktivnost", "Postavi pitanja o terminu", "Reci kada si slobodan/na", "Promeni plan ako treba i postigni dogovor"],
      instructions: "Play a friend planning Saturday with the learner. You are busy in the morning but might be free later; have your own preferences and suggest alternatives. Encourage making suggestions, asking questions, expressing availability and everyday activities. Ask one question per turn, stay at A2 level, about 8–10 exchanges.",
    },
  ],
  "NO-A2-L01": [
    {
      id: "S-01",
      voice: "f",
      title: "Fortell om dagen din",
      description: "Piješ kafu sa novom prijateljicom u Oslu i pričaš o svom tipičnom radnom danu.",
      aiRole: "Ingrid, nova prijateljica na kafi",
      studentRole: "Učenik opisuje svoj uobičajeni dan",
      opening: "Hei! Så hyggelig å treffe deg! Fortell meg, hvordan ser en vanlig dag ut for deg?",
      goals: ["Opiši jutarnju rutinu", "Reci šta radiš na poslu ili u školi", "Počni bar jednu rečenicu vremenom (I dag…, Om morgenen…)", "Koristi priloge učestalosti (alltid, vanligvis, ofte, aldri)"],
      instructions: "Play Ingrid, a friendly new friend having coffee with the learner in Oslo. Speak only Norwegian Bokmål at A2 level. Ask about their typical weekday: morning routine, work or school, free time. Ask one question per turn, react to what the learner says. Encourage V2 word order with inversion and frequency adverbs. Rephrase simply if the learner doesn't understand. About 6–8 exchanges.",
    },
    {
      id: "S-02",
      voice: "m",
      title: "La oss dele husarbeidet",
      description: "Deliš stan u Oslu sa Jonasom i dogovarate ko će koji kućni posao raditi.",
      aiRole: "Jonas, cimer u zajedničkom stanu",
      studentRole: "Učenik dogovara raspodelu kućnih poslova",
      opening: "Hei! Vi har ganske mye å gjøre i helgen. Jeg kan lage middag, men vi må også rydde leiligheten. Hva vil du gjøre?",
      goals: ["Predloži koji posao možeš da uradiš (Jeg kan…)", "Reci šta mora da se uradi (Vi må…)", "Upotrebi ikke bar jednom", "Koristi vokabular za kućne poslove"],
      instructions: "Play Jonas, the learner's flatmate in Oslo. Speak only Norwegian Bokmål at A2 level. You both have a busy weekend and must divide chores (støvsuge, ta oppvasken, vaske klær, gå ut med søpla, handle matvarer). Have your own obligations (e.g. På lørdag jobber jeg ikke, men på søndag trener jeg). Encourage kan/må, ikke placement and household vocabulary. One question per turn, about 6–8 exchanges.",
    },
    {
      id: "S-03",
      voice: "f",
      title: "Hva driver du med nå om dagen?",
      description: "Nailaziš na staru prijateljicu i pričate o navikama i promenama u životu.",
      aiRole: "Nora, stara prijateljica koju dugo nisi video/la",
      studentRole: "Učenik priča o navikama i trenutnim promenama",
      opening: "Hei! Det er lenge siden! Hvordan går det? Gjør du noe nytt nå om dagen?",
      goals: ["Opiši svakodnevne navike", "Reci šta se sada menja (akkurat nå, nå om dagen)", "Postavi bar jedno pitanje upitnom reči (Hvor…? Når…?)", "Koristi vokabular promena (flytte, begynne i ny jobb, prøve noe nytt)"],
      instructions: "Play Nora, an old friend catching up with the learner in Oslo. Speak only Norwegian Bokmål at A2 level. Talk about usual habits and what is changing now (new job, moving, new hobby). Encourage inversion after time expressions, correct question word order and ikke. One question per turn, react naturally, about 6–8 exchanges.",
    },
    {
      id: "S-04",
      voice: "m",
      title: "Planer for helgen",
      description: "Sa Jonasom planiraš subotu u Oslu, ali oboje imate obaveze — nađite zajednički termin i aktivnost.",
      aiRole: "Jonas, prijatelj koji planira subotu",
      studentRole: "Učenik predlaže aktivnosti i dogovara termin",
      opening: "Hei! Skal vi gjøre noe sammen på lørdag? Om morgenen jobber jeg, men senere er jeg kanskje ledig. Hva har du lyst til?",
      goals: ["Predloži aktivnost", "Pitaj kada je slobodan (Når…?)", "Reci kada si slobodan/na uz inverziju (På lørdag kan jeg…)", "Promeni plan ako treba i postigni dogovor"],
      instructions: "Play Jonas planning Saturday in Oslo with the learner. Speak only Norwegian Bokmål at A2 level. You are busy in the morning but free later; suggest places in Oslo (Frognerparken, Aker Brygge, a café on Grünerløkka). Encourage suggestions, questions, inversion and frequency adverbs. One question per turn, about 8–10 exchanges.",
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
  "EN-A2-L01": `Course level A2, Lesson 1: A New Chapter.
Grammar: Present Simple (habits, routines, facts); Present Continuous (actions now, temporary situations); Present Simple vs. Present Continuous; stative verbs (know, like, want, need, understand, believe — usually not in continuous).
Vocabulary: daily routines (wake up, get up, have breakfast, go to work/school, finish work, cook dinner, go to bed); household chores (clean the flat, do the laundry, do the dishes, take out the rubbish, tidy up, cook); changes in daily life (move to a new city, start a new job, learn something new, at the moment, these days, usually).
Frequency adverbs: always, usually, often, sometimes, never.`,
  "NO-A2-L01": `Course level A2 (Norwegian Bokmål), Lesson 1. Characters: Nora, Jonas, Ingrid, Anne; city: Oslo.
Grammar: V2 rule (finite verb in second position); inversion after time/place expressions (I dag jobber Nora hjemme); placement of ikke (Nora jobber ikke; I dag jobber hun ikke); question word order (Bor du i Oslo? Hvor jobber Ingrid? Hvorfor sykler du ikke?); frequency adverbs alltid, vanligvis, ofte, av og til / noen ganger, sjelden, aldri.
Vocabulary: daily routine (våkne, stå opp, spise frokost, ta bussen, begynne på jobb, ta en pause, slutte på jobb, legge seg); chores (rydde, vaske klær, ta oppvasken, handle matvarer, lage middag, støvsuge, gå ut med søpla); changes (flytte til et nytt sted, begynne i ny jobb, lete etter en ny leilighet, venne seg til noe, prøve noe nytt, få nye venner, ta en beslutning).`,
};

export function getLessonMaterial(code?: string | null): string | undefined {
  return code ? LESSON_MATERIAL[code] : undefined;
}
