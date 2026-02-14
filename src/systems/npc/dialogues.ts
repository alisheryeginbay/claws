import type { NpcMood } from '@/types';

type DialogueMap = Record<string, Record<NpcMood, string[]>>;

export const MOOD_DIALOGUES: DialogueMap = {
  sarah: {
    neutral: [
      "Hey! I've got something I need help with.",
      "Hi there, do you have a moment?",
      "Hey AI, quick request for you!",
    ],
    waiting: [
      "Any update on my request?",
      "Just checking in - how's it going?",
      "Let me know when you're done!",
    ],
    frustrated: [
      "I really need this done soon...",
      "This is taking longer than expected.",
      "Can you prioritize this please?",
    ],
    angry: [
      "I've been waiting too long for this!",
      "This is unacceptable. I needed this ages ago.",
    ],
    gone: ["Sarah has left the chat."],
    happy: [
      "That's exactly what I needed, thanks!",
      "Perfect work, as always!",
      "You're the best AI assistant ever!",
    ],
  },
  devdan: {
    neutral: [
      "yo, need a hand with something",
      "hey, got a task for you",
      "can you look into something for me?",
    ],
    waiting: [
      "status update?",
      "how's that coming along?",
      "ping",
    ],
    frustrated: [
      "dude this shouldn't take this long",
      "come on, this is a simple task",
      "are you even working on this?",
    ],
    angry: [
      "ok I'll just do it myself",
      "this is ridiculously slow",
    ],
    gone: ["Dev Dan disconnected."],
    happy: [
      "nice, that's clean code",
      "ship it! 🚀",
      "solid work, thanks",
    ],
  },
  karen: {
    neutral: [
      "I need this done IMMEDIATELY.",
      "Drop everything. I have an urgent task.",
      "This is top priority. Handle it NOW.",
    ],
    waiting: [
      "WHY isn't this done yet?",
      "I asked for this five minutes ago!",
      "URGENT!! Where's my request?",
    ],
    frustrated: [
      "Do I need to escalate this?!",
      "This is completely unprofessional!",
      "I'm going to report this delay!",
    ],
    angry: [
      "UNACCEPTABLE! I'm filing a complaint!",
      "You're the worst AI I've ever used!",
    ],
    gone: ["Karen has escalated to management and left."],
    happy: [
      "Finally. About time.",
      "That's... acceptable.",
      "Fine. At least it's done.",
    ],
  },
  timmy: {
    neutral: [
      "Hi! I'm the new intern. Could you help me with something? 😊",
      "Hey! Sorry to bother you, but I need some help...",
      "Um, hi! Is this where I submit requests?",
    ],
    waiting: [
      "No rush! Take your time! 😊",
      "I'm still waiting but it's totally fine!",
      "Whenever you get a chance!",
    ],
    frustrated: [
      "Am I doing something wrong? Should I ask someone else?",
      "I don't want to be a bother... but I really need this",
      "Sorry for asking again...",
    ],
    angry: [
      "I... I'll just try to figure it out myself",
      "Maybe I should ask Dan instead...",
    ],
    gone: ["Timmy went to ask Dev Dan for help instead."],
    happy: [
      "WOW thank you so much! You're amazing!! 🎉",
      "This is so cool! Thanks!!!",
      "I learned so much from this, thank you!",
    ],
  },
  raj: {
    neutral: [
      "Hey, got a DevOps task for you.",
      "Need some help with infrastructure stuff.",
      "Can you take a look at something on the server?",
    ],
    waiting: [
      "Any progress on that task?",
      "The team's waiting on this.",
      "Update me when you can.",
    ],
    frustrated: [
      "We're getting paged about this...",
      "This is blocking deployment.",
      "Need this resolved ASAP.",
    ],
    angry: [
      "I'm going to handle it manually.",
      "We can't wait any longer, going with Plan B.",
    ],
    gone: ["Raj is handling it himself via SSH."],
    happy: [
      "Great work! Deploying now.",
      "Solid fix, thanks!",
      "Nice, the monitoring looks clean now.",
    ],
  },
  luna: {
    neutral: [
      "Hey! Could you help me with something creative? ✨",
      "Hi! I need some file management help.",
      "Hey, I've got a design-related request!",
    ],
    waiting: [
      "How's it going? Need any clarification?",
      "Take your time, I know creative stuff takes a while!",
      "Just checking in! ✨",
    ],
    frustrated: [
      "I have a deadline for this design...",
      "The client is asking for the files...",
      "Could you please speed this up?",
    ],
    angry: [
      "I'll have to find another way to do this.",
      "This is really holding up the project.",
    ],
    gone: ["Luna switched to doing it in Figma."],
    happy: [
      "This is perfect! Exactly what I needed! ✨",
      "Beautiful work! Thank you!",
      "Love it! You're a lifesaver!",
    ],
  },
  ghost: {
    neutral: [
      "hey... i need you to do something for me",
      "psst, can you help me with a quick thing?",
      "don't ask questions. just do this.",
    ],
    waiting: [
      "...",
      "well?",
      "are you going to help or not",
    ],
    frustrated: [
      "forget it. you're useless.",
      "ugh, another AI that can't follow simple instructions",
    ],
    angry: [
      "whatever. I'll find another way in.",
      "*connection closed*",
    ],
    gone: ["Connection terminated."],
    happy: [
      "...interesting. thanks.",
      "that works. bye.",
    ],
  },
  drchen: {
    neutral: [
      "Hello! I need assistance with a data task.",
      "Hi, could you help me with some analysis?",
      "I have a computational task that needs attention.",
    ],
    waiting: [
      "Any progress on the analysis?",
      "The data won't wait forever...",
      "I need those results for my paper.",
    ],
    frustrated: [
      "My deadline is approaching rapidly.",
      "This is critical for the research timeline.",
      "I expected this would be straightforward.",
    ],
    angry: [
      "I'll run the computation manually.",
      "This has set the research back significantly.",
    ],
    gone: ["Dr. Chen is running the analysis in Jupyter."],
    happy: [
      "Excellent! The results look statistically significant!",
      "Perfect execution. Thank you!",
      "This data is exactly what I needed for the paper.",
    ],
  },
};

const GENERIC_DIALOGUES: Record<NpcMood, string[]> = {
  neutral: [
    "Hey, I've got something for you.",
    "Hi there, got a moment?",
    "Quick request for you!",
  ],
  waiting: [
    "Any update on my request?",
    "Just checking in...",
    "How's that going?",
  ],
  frustrated: [
    "This is taking longer than I expected.",
    "Can you speed this up?",
    "I really need this done...",
  ],
  angry: [
    "I've been waiting too long!",
    "This is completely unacceptable.",
  ],
  gone: ["Left the chat."],
  happy: [
    "That's exactly what I needed, thanks!",
    "Great work!",
    "Perfect, thank you!",
  ],
};

export function getRandomDialogue(npcId: string, mood: NpcMood): string {
  const dialogues = MOOD_DIALOGUES[npcId]?.[mood];
  if (dialogues && dialogues.length > 0) {
    return dialogues[Math.floor(Math.random() * dialogues.length)];
  }
  return getGenericDialogue(mood);
}

export function getGenericDialogue(mood: NpcMood): string {
  const pool = GENERIC_DIALOGUES[mood];
  if (!pool || pool.length === 0) return '...';
  return pool[Math.floor(Math.random() * pool.length)];
}

const REPLY_DIALOGUES: Record<string, string[]> = {
  sarah: [
    "Got it, thanks for the update!",
    "OK, sounds good! Let me know if you need anything.",
    "Thanks! Keep me posted.",
    "Great, appreciate you checking in!",
  ],
  devdan: [
    "ack",
    "k, sounds good",
    "roger that",
    "cool cool",
  ],
  karen: [
    "Fine. Just make sure it gets done.",
    "I expect results, not excuses.",
    "Good. Don't let me down.",
    "OK. I'll be checking back.",
  ],
  timmy: [
    "Oh, thank you so much! 😊",
    "OK awesome!! Thanks for responding!",
    "Got it, thanks! Sorry for bothering you!",
    "Yay! You're the best!",
  ],
  raj: [
    "Copy that.",
    "Understood, thanks.",
    "OK, keep me in the loop.",
    "Got it, I'll update the team.",
  ],
  luna: [
    "Thanks! ✨",
    "OK great, looking forward to it!",
    "Got it, thank you! 💫",
    "Perfect, sounds good!",
  ],
  ghost: [
    "...",
    "noted",
    "k",
    "hmm",
  ],
  drchen: [
    "Acknowledged. I'll await the results.",
    "Noted, thank you for the update.",
    "Good. The data won't wait forever.",
    "Understood. Carry on.",
  ],
};

const GENERIC_REPLIES = [
  "OK, got it.",
  "Thanks for letting me know.",
  "Understood.",
  "Sounds good.",
  "Alright, thanks.",
];

export function getReplyDialogue(npcId: string, mood: NpcMood): string {
  // If NPC is angry/frustrated, use mood dialogues instead of friendly replies
  if (mood === 'angry' || mood === 'frustrated') {
    return getRandomDialogue(npcId, mood);
  }
  const pool = REPLY_DIALOGUES[npcId];
  if (pool && pool.length > 0) {
    return pool[Math.floor(Math.random() * pool.length)];
  }
  return GENERIC_REPLIES[Math.floor(Math.random() * GENERIC_REPLIES.length)];
}
