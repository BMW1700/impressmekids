// Pre-K Adventures: continuous, Dora-style obstacle → word → solution stories.
// Each level is a small mission for Benny the Dog. The CHILD reads the word
// that names the tool Benny needs to solve the obstacle in front of him.
//
// Authoring rules (Pre-K cloze style):
//  - askLine MUST be a sentence STEM that the target `word` literally completes.
//    Example: word "JUMP" → askLine "I need to..." (so Benny "asks" and the
//    child says JUMP). The trailing ellipsis matters — TTS pauses on it.
//  - Words must be decodable Pre-K vocabulary (CVC, CVCC, or common sight
//    nouns). No multi-syllable schwas like LADDER, no silent-E like AXE.
//  - 4–6 obstacles per level. One ending celebration.
//  - Keep Benny's lines under ~8 words each — these are 3–4 year olds.

export interface PreKObstacle {
  /** Short scene description for the visual. */
  sceneEmoji: string;            // big visual representing the obstacle (e.g. 🌊 river)
  /** Friendly background color tokens (Tailwind classes). */
  sky: string;                   // e.g. "from-sky-200 via-cyan-200 to-emerald-200"
  ground: string;                // e.g. "from-emerald-300 to-emerald-500"
  /** What Benny sees / why he's stuck — spoken aloud. */
  problemLine: string;           // "Oh no! A river!"
  /** Sentence STEM the target word completes. Ends with "..." so TTS pauses. */
  askLine: string;               // "I need to..."
  /** The single word the child must read — completes askLine. */
  word: string;                  // "JUMP"
  /** Emoji for the solution that appears after the word is read. */
  solutionEmoji: string;         // "🌉"
  /** Where the solution sits relative to the obstacle. */
  solutionPlacement?: "over" | "replace" | "onNabu";
  /** Benny's cheer after success. */
  successLine: string;           // "We did it! Thank you!"
}

export interface PreKAdventure {
  /** Big mission goal — shown in header + spoken at start. */
  goal: string;                  // "Help Benny get to Grandma's house!"
  /** Final scene shown after the last obstacle is solved. */
  endingEmoji: string;           // "🏡"
  endingLine: string;            // "Yay! We made it to Grandma's!"
  /** Color theme for the ending celebration. */
  endingSky: string;
  obstacles: PreKObstacle[];
}

const sky = {
  forest:  "from-emerald-200 via-lime-200 to-amber-200",
  meadow:  "from-sky-200 via-emerald-200 to-amber-200",
  morning: "from-amber-200 via-rose-200 to-pink-200",
  dusk:    "from-indigo-300 via-purple-300 to-pink-300",
  sky:     "from-sky-300 via-cyan-200 to-blue-200",
  night:   "from-indigo-900 via-purple-800 to-slate-900",
  storm:   "from-slate-400 via-slate-500 to-slate-700",
  ocean:   "from-cyan-300 via-sky-300 to-blue-400",
  reef:    "from-teal-300 via-cyan-300 to-emerald-300",
  cave:    "from-stone-700 via-stone-800 to-slate-900",
};

const ground = {
  grass:  "from-emerald-400 to-emerald-600",
  dirt:   "from-amber-600 to-amber-800",
  sand:   "from-amber-200 to-amber-400",
  mud:    "from-stone-500 to-stone-700",
  ocean:  "from-blue-400 to-blue-700",
  rock:   "from-stone-400 to-stone-600",
  clouds: "from-white to-sky-200",
};

// ============================================================================
// WORLD 101 — Forest & Village adventures
// ============================================================================

const W101_L1: PreKAdventure = {
  goal: "Help Benny visit Grandma!",
  endingEmoji: "🏡",
  endingLine: "We made it to Grandma's!",
  endingSky: sky.morning,
  obstacles: [
    {
      sceneEmoji: "🌊", sky: sky.meadow, ground: ground.grass,
      problemLine: "Oh no! A river!",
      askLine: "I need to...",
      word: "JUMP", solutionEmoji: "💨", solutionPlacement: "over",
      successLine: "Whoosh! Over we go!",
    },
    {
      sceneEmoji: "🟫", sky: sky.meadow, ground: ground.mud,
      problemLine: "Ew! Squishy mud!",
      askLine: "My feet need big...",
      word: "BOOTS", solutionEmoji: "🥾", solutionPlacement: "onNabu",
      successLine: "Big boots! Splish splash!",
    },
    {
      sceneEmoji: "🚪", sky: sky.forest, ground: ground.dirt,
      problemLine: "A locked gate! Hmm...",
      askLine: "To open it I need a...",
      word: "KEY", solutionEmoji: "🔑", solutionPlacement: "over",
      successLine: "Click! The gate is open!",
    },
    {
      sceneEmoji: "🌳", sky: sky.forest, ground: ground.grass,
      problemLine: "A log on the path!",
      askLine: "Help me jump and...",
      word: "HOP", solutionEmoji: "🦘", solutionPlacement: "over",
      successLine: "Hop hop! Path is clear!",
    },
    {
      sceneEmoji: "🐶", sky: sky.morning, ground: ground.grass,
      problemLine: "A puppy won't move!",
      askLine: "Give the puppy a...",
      word: "BONE", solutionEmoji: "🦴", solutionPlacement: "over",
      successLine: "Yum! The puppy runs to play!",
    },
  ],
};

const W101_L2: PreKAdventure = {
  goal: "Help the baby bird get home!",
  endingEmoji: "🪺",
  endingLine: "Baby bird is safe in the nest!",
  endingSky: sky.morning,
  obstacles: [
    {
      sceneEmoji: "🐣", sky: sky.morning, ground: ground.grass,
      problemLine: "A baby bird fell down!",
      askLine: "Birds live in a...",
      word: "NEST", solutionEmoji: "🪺", solutionPlacement: "over",
      successLine: "A soft nest! So cozy!",
    },
    {
      sceneEmoji: "😢", sky: sky.morning, ground: ground.grass,
      problemLine: "Baby bird is hungry!",
      askLine: "Birds love a wiggly...",
      word: "WORM", solutionEmoji: "🪱", solutionPlacement: "over",
      successLine: "Yum! All gone!",
    },
    {
      sceneEmoji: "🌳", sky: sky.forest, ground: ground.grass,
      problemLine: "The nest is up high!",
      askLine: "To climb up I need...",
      word: "STEPS", solutionEmoji: "🪜", solutionPlacement: "over",
      successLine: "Up we go!",
    },
    {
      sceneEmoji: "💧", sky: sky.storm, ground: ground.grass,
      problemLine: "Rain! Baby bird is cold!",
      askLine: "To stay dry I need a...",
      word: "HOOD", solutionEmoji: "🧥", solutionPlacement: "onNabu",
      successLine: "Nice and dry!",
    },
    {
      sceneEmoji: "🌤️", sky: sky.morning, ground: ground.grass,
      problemLine: "Baby bird wants to fly!",
      askLine: "Spread your...",
      word: "WINGS", solutionEmoji: "🪽", solutionPlacement: "onNabu",
      successLine: "Whee! Up to the sky!",
    },
  ],
};

const W101_L3: PreKAdventure = {
  goal: "Wake up Benny's Village!",
  endingEmoji: "🌅",
  endingLine: "Good morning, village!",
  endingSky: sky.morning,
  obstacles: [
    {
      sceneEmoji: "🌑", sky: sky.night, ground: ground.grass,
      problemLine: "It's too dark to see!",
      askLine: "We need the...",
      word: "SUN", solutionEmoji: "☀️", solutionPlacement: "over",
      successLine: "Sunrise! So warm!",
    },
    {
      sceneEmoji: "💤", sky: sky.morning, ground: ground.grass,
      problemLine: "Everyone is sleeping!",
      askLine: "A loud bird, the...",
      word: "HEN", solutionEmoji: "🐔", solutionPlacement: "over",
      successLine: "Cluck cluck! Wake up!",
    },
    {
      sceneEmoji: "🏠", sky: sky.morning, ground: ground.grass,
      problemLine: "The houses are quiet!",
      askLine: "Ring the...",
      word: "BELL", solutionEmoji: "🔔", solutionPlacement: "over",
      successLine: "The bell rings out!",
    },
    {
      sceneEmoji: "🥱", sky: sky.morning, ground: ground.grass,
      problemLine: "Villagers are sleepy!",
      askLine: "Cook breakfast in a...",
      word: "POT", solutionEmoji: "🍲", solutionPlacement: "over",
      successLine: "Yum! Wide awake!",
    },
    {
      sceneEmoji: "🎵", sky: sky.morning, ground: ground.grass,
      problemLine: "Time to celebrate!",
      askLine: "Bang the...",
      word: "DRUM", solutionEmoji: "🥁", solutionPlacement: "over",
      successLine: "Boom boom! Everyone dances!",
    },
  ],
};

const W101_L4: PreKAdventure = {
  goal: "Take the lost puppy home!",
  endingEmoji: "🏡",
  endingLine: "Puppy is home! Thank you!",
  endingSky: sky.morning,
  obstacles: [
    {
      sceneEmoji: "🐕", sky: sky.meadow, ground: ground.grass,
      problemLine: "A lost puppy! He runs too fast!",
      askLine: "Hold him with a...",
      word: "ROPE", solutionEmoji: "🪢", solutionPlacement: "over",
      successLine: "Got him! Good puppy!",
    },
    {
      sceneEmoji: "😋", sky: sky.meadow, ground: ground.grass,
      problemLine: "Puppy is hungry!",
      askLine: "Dogs love a...",
      word: "BONE", solutionEmoji: "🦴", solutionPlacement: "over",
      successLine: "Chomp chomp! Yummy!",
    },
    {
      sceneEmoji: "🚧", sky: sky.meadow, ground: ground.dirt,
      problemLine: "A fence is in the way!",
      askLine: "To climb up I need...",
      word: "STEPS", solutionEmoji: "🪜", solutionPlacement: "over",
      successLine: "Up and over!",
    },
    {
      sceneEmoji: "🦴", sky: sky.morning, ground: ground.grass,
      problemLine: "Puppy is sleepy!",
      askLine: "He needs a cozy...",
      word: "BED", solutionEmoji: "🛏️", solutionPlacement: "over",
      successLine: "Sweet dreams, puppy!",
    },
  ],
};

const W101_L5: PreKAdventure = {
  goal: "Pick berries with Benny!",
  endingEmoji: "🥧",
  endingLine: "Berry pie for everyone!",
  endingSky: sky.morning,
  obstacles: [
    {
      sceneEmoji: "🫐", sky: sky.forest, ground: ground.grass,
      problemLine: "So many berries!",
      askLine: "Put them in a...",
      word: "CUP", solutionEmoji: "🥤", solutionPlacement: "onNabu",
      successLine: "Plop plop! Berries inside!",
    },
    {
      sceneEmoji: "🌳", sky: sky.forest, ground: ground.grass,
      problemLine: "The best berries are up high!",
      askLine: "To go up I need...",
      word: "STEPS", solutionEmoji: "🪜", solutionPlacement: "over",
      successLine: "Up to the top!",
    },
    {
      sceneEmoji: "☀️", sky: sky.morning, ground: ground.grass,
      problemLine: "The sun is so hot!",
      askLine: "My head needs a...",
      word: "HAT", solutionEmoji: "👒", solutionPlacement: "onNabu",
      successLine: "Ahh, much cooler!",
    },
    {
      sceneEmoji: "🌊", sky: sky.meadow, ground: ground.grass,
      problemLine: "A stream is blocking us!",
      askLine: "Time to...",
      word: "JUMP", solutionEmoji: "💨", solutionPlacement: "over",
      successLine: "Big leap! We did it!",
    },
    {
      sceneEmoji: "🐝", sky: sky.forest, ground: ground.grass,
      problemLine: "Bees! Buzz buzz!",
      askLine: "Bees love sweet...",
      word: "HONEY", solutionEmoji: "🍯", solutionPlacement: "over",
      successLine: "The bees are happy!",
    },
    {
      sceneEmoji: "🍓", sky: sky.morning, ground: ground.grass,
      problemLine: "Time to bake!",
      askLine: "Mix them with a...",
      word: "SPOON", solutionEmoji: "🥄", solutionPlacement: "onNabu",
      successLine: "Stir stir stir!",
    },
  ],
};

// ============================================================================
// WORLD 102 — Sky adventures
// ============================================================================

const W102_L1: PreKAdventure = {
  goal: "Help Benny fly to the moon!",
  endingEmoji: "🌕",
  endingLine: "We made it to the moon!",
  endingSky: sky.night,
  obstacles: [
    {
      sceneEmoji: "☁️", sky: sky.sky, ground: ground.clouds,
      problemLine: "The clouds are high!",
      askLine: "Lift me with a...",
      word: "BALLOON", solutionEmoji: "🎈", solutionPlacement: "over",
      successLine: "Up up up!",
    },
    {
      sceneEmoji: "💨", sky: sky.sky, ground: ground.clouds,
      problemLine: "Wind blows me back!",
      askLine: "I need a super...",
      word: "CAPE", solutionEmoji: "🦸", solutionPlacement: "onNabu",
      successLine: "Whoosh! Super Benny!",
    },
    {
      sceneEmoji: "⭐", sky: sky.dusk, ground: ground.clouds,
      problemLine: "It's getting dark!",
      askLine: "Light the way with a...",
      word: "STAR", solutionEmoji: "⭐", solutionPlacement: "over",
      successLine: "A bright star!",
    },
    {
      sceneEmoji: "🌌", sky: sky.night, ground: ground.clouds,
      problemLine: "So far to the moon!",
      askLine: "We need a fast...",
      word: "ROCKET", solutionEmoji: "🚀", solutionPlacement: "onNabu",
      successLine: "3... 2... 1... BLAST OFF!",
    },
    {
      sceneEmoji: "🌑", sky: sky.night, ground: ground.clouds,
      problemLine: "The moon is hiding!",
      askLine: "Shine a...",
      word: "LAMP", solutionEmoji: "🏮", solutionPlacement: "onNabu",
      successLine: "There it is!",
    },
  ],
};

const W102_L2: PreKAdventure = {
  goal: "Catch a cloud with Benny!",
  endingEmoji: "☁️",
  endingLine: "A fluffy cloud friend!",
  endingSky: sky.sky,
  obstacles: [
    {
      sceneEmoji: "☁️", sky: sky.sky, ground: ground.grass,
      problemLine: "Clouds are floating away!",
      askLine: "Catch one with a...",
      word: "NET", solutionEmoji: "🥅", solutionPlacement: "onNabu",
      successLine: "Got one!",
    },
    {
      sceneEmoji: "🌬️", sky: sky.sky, ground: ground.grass,
      problemLine: "I'm not high enough!",
      askLine: "Send up a...",
      word: "KITE", solutionEmoji: "🪁", solutionPlacement: "over",
      successLine: "Up I go!",
    },
    {
      sceneEmoji: "💨", sky: sky.sky, ground: ground.clouds,
      problemLine: "No wind today!",
      askLine: "Turn on a...",
      word: "FAN", solutionEmoji: "🌬️", solutionPlacement: "over",
      successLine: "Whoosh! Wind!",
    },
    {
      sceneEmoji: "☁️", sky: sky.sky, ground: ground.clouds,
      problemLine: "Cloud is shy!",
      askLine: "Share a yummy...",
      word: "CAKE", solutionEmoji: "🍰", solutionPlacement: "over",
      successLine: "Cloud loves cake!",
    },
  ],
};

const W102_L3: PreKAdventure = {
  goal: "Help Benny through the storm!",
  endingEmoji: "🌈",
  endingLine: "Hello, rainbow!",
  endingSky: sky.morning,
  obstacles: [
    {
      sceneEmoji: "🌧️", sky: sky.storm, ground: ground.grass,
      problemLine: "Rain is pouring down!",
      askLine: "To stay dry I need a...",
      word: "HOOD", solutionEmoji: "🧥", solutionPlacement: "onNabu",
      successLine: "Pitter patter — but dry!",
    },
    {
      sceneEmoji: "🟫", sky: sky.storm, ground: ground.mud,
      problemLine: "Puddles everywhere!",
      askLine: "My feet need big...",
      word: "BOOTS", solutionEmoji: "🥾", solutionPlacement: "onNabu",
      successLine: "Splash splash!",
    },
    {
      sceneEmoji: "🌑", sky: sky.storm, ground: ground.grass,
      problemLine: "It's too dark!",
      askLine: "We need a...",
      word: "LAMP", solutionEmoji: "🏮", solutionPlacement: "onNabu",
      successLine: "I can see now!",
    },
    {
      sceneEmoji: "❄️", sky: sky.storm, ground: ground.grass,
      problemLine: "Brrr, so cold!",
      askLine: "Something warm — a...",
      word: "COAT", solutionEmoji: "🧥", solutionPlacement: "onNabu",
      successLine: "Toasty warm!",
    },
    {
      sceneEmoji: "⛈️", sky: sky.storm, ground: ground.grass,
      problemLine: "Thunder! BOOM!",
      askLine: "Hide inside a...",
      word: "TENT", solutionEmoji: "⛺", solutionPlacement: "over",
      successLine: "Safe and cozy!",
    },
  ],
};

const W102_L4: PreKAdventure = {
  goal: "Build a magic kite!",
  endingEmoji: "🪁",
  endingLine: "The kite flies so high!",
  endingSky: sky.sky,
  obstacles: [
    {
      sceneEmoji: "📄", sky: sky.sky, ground: ground.grass,
      problemLine: "Start the kite!",
      askLine: "Something flat — a piece of...",
      word: "PAPER", solutionEmoji: "📄", solutionPlacement: "over",
      successLine: "Perfect!",
    },
    {
      sceneEmoji: "🧵", sky: sky.sky, ground: ground.grass,
      problemLine: "It will fly away!",
      askLine: "Hold it with a long...",
      word: "STRING", solutionEmoji: "🧵", solutionPlacement: "over",
      successLine: "Now I can hold on!",
    },
    {
      sceneEmoji: "✂️", sky: sky.sky, ground: ground.grass,
      problemLine: "Paper is too big!",
      askLine: "Time to...",
      word: "CUT", solutionEmoji: "✂️", solutionPlacement: "onNabu",
      successLine: "Just the right size!",
    },
    {
      sceneEmoji: "💨", sky: sky.sky, ground: ground.grass,
      problemLine: "No wind!",
      askLine: "Time to...",
      word: "RUN", solutionEmoji: "💨", solutionPlacement: "onNabu",
      successLine: "Whoosh! Up it goes!",
    },
  ],
};

const W102_L5: PreKAdventure = {
  goal: "Space picnic with Benny!",
  endingEmoji: "🪐",
  endingLine: "Best picnic in space!",
  endingSky: sky.night,
  obstacles: [
    {
      sceneEmoji: "🚀", sky: sky.dusk, ground: ground.clouds,
      problemLine: "How do we get to space?",
      askLine: "Hop in the fast...",
      word: "ROCKET", solutionEmoji: "🚀", solutionPlacement: "over",
      successLine: "BLAST OFF!",
    },
    {
      sceneEmoji: "🌬️", sky: sky.night, ground: ground.clouds,
      problemLine: "No air in space!",
      askLine: "On my head, a...",
      word: "HAT", solutionEmoji: "🪖", solutionPlacement: "onNabu",
      successLine: "Now I can breathe!",
    },
    {
      sceneEmoji: "❓", sky: sky.night, ground: ground.clouds,
      problemLine: "Where is the spot?",
      askLine: "Find it on a...",
      word: "MAP", solutionEmoji: "🗺️", solutionPlacement: "onNabu",
      successLine: "Found it!",
    },
    {
      sceneEmoji: "😋", sky: sky.night, ground: ground.clouds,
      problemLine: "I'm hungry!",
      askLine: "Bring a yummy...",
      word: "SNACK", solutionEmoji: "🥪", solutionPlacement: "over",
      successLine: "Nom nom!",
    },
    {
      sceneEmoji: "🌑", sky: sky.night, ground: ground.clouds,
      problemLine: "It's so dark!",
      askLine: "We need a bright...",
      word: "STAR", solutionEmoji: "⭐", solutionPlacement: "over",
      successLine: "Sparkle sparkle!",
    },
    {
      sceneEmoji: "🪐", sky: sky.night, ground: ground.clouds,
      problemLine: "I want a souvenir!",
      askLine: "Grab a little...",
      word: "ROCK", solutionEmoji: "🪨", solutionPlacement: "onNabu",
      successLine: "A moon rock! Cool!",
    },
  ],
};

// ============================================================================
// WORLD 103 — Ocean adventures
// ============================================================================

const W103_L1: PreKAdventure = {
  goal: "Find treasure under the sea!",
  endingEmoji: "💎",
  endingLine: "Treasure! Wow!",
  endingSky: sky.ocean,
  obstacles: [
    {
      sceneEmoji: "🌊", sky: sky.ocean, ground: ground.sand,
      problemLine: "I can't swim across!",
      askLine: "Float in a...",
      word: "BOAT", solutionEmoji: "⛵", solutionPlacement: "over",
      successLine: "All aboard!",
    },
    {
      sceneEmoji: "💧", sky: sky.ocean, ground: ground.ocean,
      problemLine: "I need to look down!",
      askLine: "On my eyes — a...",
      word: "MASK", solutionEmoji: "🥽", solutionPlacement: "onNabu",
      successLine: "I can see fishies!",
    },
    {
      sceneEmoji: "❓", sky: sky.ocean, ground: ground.ocean,
      problemLine: "Where's the treasure?",
      askLine: "Read a...",
      word: "MAP", solutionEmoji: "🗺️", solutionPlacement: "onNabu",
      successLine: "X marks the spot!",
    },
    {
      sceneEmoji: "📦", sky: sky.ocean, ground: ground.sand,
      problemLine: "A locked chest!",
      askLine: "Open it with a...",
      word: "KEY", solutionEmoji: "🔑", solutionPlacement: "over",
      successLine: "Click! Open!",
    },
    {
      sceneEmoji: "✨", sky: sky.ocean, ground: ground.sand,
      problemLine: "It's shiny!",
      askLine: "Look at the...",
      word: "GOLD", solutionEmoji: "🪙", solutionPlacement: "over",
      successLine: "Gold coins! Hooray!",
    },
  ],
};

const W103_L2: PreKAdventure = {
  goal: "Help the sea turtle!",
  endingEmoji: "🐢",
  endingLine: "Turtle is happy and free!",
  endingSky: sky.ocean,
  obstacles: [
    {
      sceneEmoji: "🐢", sky: sky.ocean, ground: ground.sand,
      problemLine: "A turtle is stuck!",
      askLine: "Pull with a...",
      word: "ROPE", solutionEmoji: "🪢", solutionPlacement: "over",
      successLine: "Heave ho!",
    },
    {
      sceneEmoji: "🪨", sky: sky.ocean, ground: ground.sand,
      problemLine: "A big rock!",
      askLine: "Dig with a...",
      word: "SHOVEL", solutionEmoji: "🪏", solutionPlacement: "onNabu",
      successLine: "Dig dig dig!",
    },
    {
      sceneEmoji: "😢", sky: sky.ocean, ground: ground.sand,
      problemLine: "Turtle is thirsty!",
      askLine: "Splash some...",
      word: "WATER", solutionEmoji: "💧", solutionPlacement: "over",
      successLine: "Ahhh, much better!",
    },
    {
      sceneEmoji: "🌊", sky: sky.ocean, ground: ground.sand,
      problemLine: "Time to go home!",
      askLine: "Ride a big...",
      word: "WAVE", solutionEmoji: "🌊", solutionPlacement: "over",
      successLine: "Whee! Bye turtle!",
    },
  ],
};

const W103_L3: PreKAdventure = {
  goal: "Catch fish for dinner!",
  endingEmoji: "🍽️",
  endingLine: "Yummy fish dinner!",
  endingSky: sky.ocean,
  obstacles: [
    {
      sceneEmoji: "🐟", sky: sky.ocean, ground: ground.sand,
      problemLine: "Fish are quick!",
      askLine: "Grab the fishing...",
      word: "ROD", solutionEmoji: "🎣", solutionPlacement: "onNabu",
      successLine: "Ready to fish!",
    },
    {
      sceneEmoji: "🪱", sky: sky.ocean, ground: ground.sand,
      problemLine: "Fish won't bite!",
      askLine: "Use a wiggly...",
      word: "WORM", solutionEmoji: "🪱", solutionPlacement: "over",
      successLine: "Wiggly snack!",
    },
    {
      sceneEmoji: "🐠", sky: sky.ocean, ground: ground.sand,
      problemLine: "So many fish!",
      askLine: "Scoop with a...",
      word: "NET", solutionEmoji: "🥅", solutionPlacement: "onNabu",
      successLine: "Got them all!",
    },
    {
      sceneEmoji: "🔥", sky: sky.dusk, ground: ground.sand,
      problemLine: "Time to cook!",
      askLine: "Make a warm...",
      word: "FIRE", solutionEmoji: "🔥", solutionPlacement: "over",
      successLine: "Crackle pop!",
    },
    {
      sceneEmoji: "🍳", sky: sky.dusk, ground: ground.sand,
      problemLine: "Where do I cook it?",
      askLine: "Cook in a...",
      word: "PAN", solutionEmoji: "🍳", solutionPlacement: "over",
      successLine: "Sizzle sizzle!",
    },
  ],
};

const W103_L4: PreKAdventure = {
  goal: "Explore the deep cave!",
  endingEmoji: "💎",
  endingLine: "A sparkly gem!",
  endingSky: sky.cave,
  obstacles: [
    {
      sceneEmoji: "🌑", sky: sky.cave, ground: ground.rock,
      problemLine: "It's pitch dark!",
      askLine: "Light a...",
      word: "TORCH", solutionEmoji: "🔦", solutionPlacement: "onNabu",
      successLine: "Bright!",
    },
    {
      sceneEmoji: "⬇️", sky: sky.cave, ground: ground.rock,
      problemLine: "A big drop!",
      askLine: "Climb down a...",
      word: "ROPE", solutionEmoji: "🪢", solutionPlacement: "over",
      successLine: "Down I go!",
    },
    {
      sceneEmoji: "🦇", sky: sky.cave, ground: ground.rock,
      problemLine: "Bats! Eek!",
      askLine: "Cover my head with a...",
      word: "HAT", solutionEmoji: "🎩", solutionPlacement: "onNabu",
      successLine: "Safe now!",
    },
    {
      sceneEmoji: "🚧", sky: sky.cave, ground: ground.rock,
      problemLine: "A rock blocks the way!",
      askLine: "Break it — time to...",
      word: "BASH", solutionEmoji: "💥", solutionPlacement: "over",
      successLine: "Smash! Path open!",
    },
  ],
};

const W103_L5: PreKAdventure = {
  goal: "Save the coral reef!",
  endingEmoji: "🪸",
  endingLine: "The reef is happy again!",
  endingSky: sky.reef,
  obstacles: [
    {
      sceneEmoji: "🗑️", sky: sky.reef, ground: ground.ocean,
      problemLine: "Trash in the water!",
      askLine: "Scoop with a...",
      word: "NET", solutionEmoji: "🥅", solutionPlacement: "onNabu",
      successLine: "All cleaned up!",
    },
    {
      sceneEmoji: "🐠", sky: sky.reef, ground: ground.ocean,
      problemLine: "The fish are hungry!",
      askLine: "Feed them little...",
      word: "FOOD", solutionEmoji: "🍤", solutionPlacement: "over",
      successLine: "Nom nom!",
    },
    {
      sceneEmoji: "🪸", sky: sky.reef, ground: ground.ocean,
      problemLine: "Coral is thirsty!",
      askLine: "Give it fresh...",
      word: "WATER", solutionEmoji: "💧", solutionPlacement: "over",
      successLine: "Sparkly clean!",
    },
    {
      sceneEmoji: "🐚", sky: sky.reef, ground: ground.sand,
      problemLine: "I hear something!",
      askLine: "Hold up a...",
      word: "SHELL", solutionEmoji: "🐚", solutionPlacement: "onNabu",
      successLine: "Whoosh! The ocean sings!",
    },
    {
      sceneEmoji: "🦈", sky: sky.reef, ground: ground.ocean,
      problemLine: "A shark! Hide!",
      askLine: "Hide behind a big...",
      word: "ROCK", solutionEmoji: "🪨", solutionPlacement: "over",
      successLine: "Phew! Safe!",
    },
    {
      sceneEmoji: "💎", sky: sky.reef, ground: ground.ocean,
      problemLine: "A shiny treasure!",
      askLine: "Pick up the...",
      word: "PEARL", solutionEmoji: "🫧", solutionPlacement: "over",
      successLine: "So pretty!",
    },
  ],
};

const ADVENTURES: Record<number, Record<number, PreKAdventure>> = {
  101: { 1: W101_L1, 2: W101_L2, 3: W101_L3, 4: W101_L4, 5: W101_L5 },
  102: { 1: W102_L1, 2: W102_L2, 3: W102_L3, 4: W102_L4, 5: W102_L5 },
  103: { 1: W103_L1, 2: W103_L2, 3: W103_L3, 4: W103_L4, 5: W103_L5 },
};

export function getPreKAdventure(worldId: number, levelId: number): PreKAdventure | null {
  const w = ADVENTURES[worldId];
  if (!w) return null;
  return w[levelId] ?? w[1] ?? null;
}

export function isPreKAdventureWorld(worldId: number): boolean {
  return worldId === 101 || worldId === 102 || worldId === 103;
}
