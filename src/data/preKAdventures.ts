// Pre-K Adventures: continuous, Dora-style obstacle → word → solution stories.
// Each level is a small mission for Nabu the Owl. The CHILD reads the word
// that names the tool Nabu needs to solve the obstacle in front of him.
//
// Rules for authors (kept tight on purpose):
//  - Every word must be the literal SOLUTION to a visible obstacle.
//  - Every word must map to a single, picturable noun (emoji-friendly).
//  - 4–6 obstacles per level. One ending celebration.
//  - Keep Nabu's lines under ~8 words each — these are 3–4 year olds.

export interface PreKObstacle {
  /** Short scene description for the visual. */
  sceneEmoji: string;            // big visual representing the obstacle (e.g. 🌊 river)
  /** Friendly background color tokens (Tailwind classes). */
  sky: string;                   // e.g. "from-sky-200 via-cyan-200 to-emerald-200"
  ground: string;                // e.g. "from-emerald-300 to-emerald-500"
  /** What Nabu sees / why he's stuck — spoken aloud. */
  problemLine: string;           // "Oh no! A river! I can't cross!"
  /** The hint that prompts the child to help. */
  askLine: string;               // "I need something to cross with..."
  /** The single word the child must read. */
  word: string;                  // "BRIDGE"
  /** Emoji for the solution that appears after the word is read. */
  solutionEmoji: string;         // "🌉"
  /** Where the solution sits relative to the obstacle. */
  solutionPlacement?: "over" | "replace" | "onNabu";
  /** Nabu's cheer after success. */
  successLine: string;           // "We did it! Thank you!"
}

export interface PreKAdventure {
  /** Big mission goal — shown in header + spoken at start. */
  goal: string;                  // "Help Nabu get to Grandma's house!"
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
  goal: "Help Nabu visit Grandma!",
  endingEmoji: "🏡",
  endingLine: "We made it to Grandma's!",
  endingSky: sky.morning,
  obstacles: [
    {
      sceneEmoji: "🌊", sky: sky.meadow, ground: ground.grass,
      problemLine: "Oh no! A river is in the way!",
      askLine: "I need to leap over it...",
      word: "JUMP", solutionEmoji: "💨", solutionPlacement: "over",
      successLine: "Whoosh! Over we go!",
    },
    {
      sceneEmoji: "🟫", sky: sky.meadow, ground: ground.mud,
      problemLine: "Ew! Squishy mud everywhere!",
      askLine: "My feet need help...",
      word: "BOOTS", solutionEmoji: "🥾", solutionPlacement: "onNabu",
      successLine: "Big boots! Splish splash!",
    },
    {
      sceneEmoji: "🚪", sky: sky.forest, ground: ground.dirt,
      problemLine: "A locked gate! Hmm...",
      askLine: "I need something to open it...",
      word: "KEY", solutionEmoji: "🔑", solutionPlacement: "over",
      successLine: "Click! The gate is open!",
    },
    {
      sceneEmoji: "🌳", sky: sky.forest, ground: ground.grass,
      problemLine: "A tree is blocking the path!",
      askLine: "We need to chop it...",
      word: "AXE", solutionEmoji: "🪓", solutionPlacement: "onNabu",
      successLine: "Chop chop! Path is clear!",
    },
    {
      sceneEmoji: "🐶", sky: sky.morning, ground: ground.grass,
      problemLine: "A puppy won't move!",
      askLine: "Maybe a yummy treat?",
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
      askLine: "It needs a cozy home...",
      word: "NEST", solutionEmoji: "🪺", solutionPlacement: "over",
      successLine: "A soft nest! So cozy!",
    },
    {
      sceneEmoji: "😢", sky: sky.morning, ground: ground.grass,
      problemLine: "Baby bird is hungry!",
      askLine: "Birds love wiggly snacks...",
      word: "WORM", solutionEmoji: "🪱", solutionPlacement: "over",
      successLine: "Yum! All gone!",
    },
    {
      sceneEmoji: "🌳", sky: sky.forest, ground: ground.grass,
      problemLine: "The nest goes way up high!",
      askLine: "I need a long way up...",
      word: "LADDER", solutionEmoji: "🪜", solutionPlacement: "over",
      successLine: "Up we go!",
    },
    {
      sceneEmoji: "💧", sky: sky.storm, ground: ground.grass,
      problemLine: "Rain! Baby bird is cold!",
      askLine: "We need to stay dry...",
      word: "UMBRELLA", solutionEmoji: "☂️", solutionPlacement: "onNabu",
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
  goal: "Wake up Nabu Village!",
  endingEmoji: "🌅",
  endingLine: "Good morning, village!",
  endingSky: sky.morning,
  obstacles: [
    {
      sceneEmoji: "🌑", sky: sky.night, ground: ground.grass,
      problemLine: "It's too dark to see!",
      askLine: "We need a light in the sky...",
      word: "SUN", solutionEmoji: "☀️", solutionPlacement: "over",
      successLine: "Sunrise! So warm!",
    },
    {
      sceneEmoji: "💤", sky: sky.morning, ground: ground.grass,
      problemLine: "Everyone is still sleeping!",
      askLine: "A loud bird can wake them...",
      word: "ROOSTER", solutionEmoji: "🐓", solutionPlacement: "over",
      successLine: "Cock-a-doodle-doo!",
    },
    {
      sceneEmoji: "🏠", sky: sky.morning, ground: ground.grass,
      problemLine: "The houses are still quiet!",
      askLine: "Ding ding ding...",
      word: "BELL", solutionEmoji: "🔔", solutionPlacement: "over",
      successLine: "The bell rings out!",
    },
    {
      sceneEmoji: "🥱", sky: sky.morning, ground: ground.grass,
      problemLine: "Villagers are sleepy!",
      askLine: "Time for a yummy drink...",
      word: "JUICE", solutionEmoji: "🧃", solutionPlacement: "over",
      successLine: "Slurp! Wide awake!",
    },
    {
      sceneEmoji: "🎵", sky: sky.morning, ground: ground.grass,
      problemLine: "Let's celebrate the morning!",
      askLine: "Bang it to make music...",
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
      askLine: "I need to hold onto him...",
      word: "LEASH", solutionEmoji: "🪢", solutionPlacement: "over",
      successLine: "Got him! Good puppy!",
    },
    {
      sceneEmoji: "😋", sky: sky.meadow, ground: ground.grass,
      problemLine: "Puppy is hungry!",
      askLine: "Dogs love...",
      word: "BONE", solutionEmoji: "🦴", solutionPlacement: "over",
      successLine: "Chomp chomp! Yummy!",
    },
    {
      sceneEmoji: "🚧", sky: sky.meadow, ground: ground.dirt,
      problemLine: "A fence is in the way!",
      askLine: "Time to climb...",
      word: "LADDER", solutionEmoji: "🪜", solutionPlacement: "over",
      successLine: "Up and over!",
    },
    {
      sceneEmoji: "🦴", sky: sky.morning, ground: ground.grass,
      problemLine: "Puppy is sleepy now!",
      askLine: "He needs a cozy spot...",
      word: "BED", solutionEmoji: "🛏️", solutionPlacement: "over",
      successLine: "Sweet dreams, puppy!",
    },
  ],
};

const W101_L5: PreKAdventure = {
  goal: "Pick berries with Nabu!",
  endingEmoji: "🥧",
  endingLine: "Berry pie for everyone!",
  endingSky: sky.morning,
  obstacles: [
    {
      sceneEmoji: "🫐", sky: sky.forest, ground: ground.grass,
      problemLine: "So many berries! Where to put them?",
      askLine: "We need to carry them...",
      word: "BASKET", solutionEmoji: "🧺", solutionPlacement: "onNabu",
      successLine: "Plop plop! Berries inside!",
    },
    {
      sceneEmoji: "🌳", sky: sky.forest, ground: ground.grass,
      problemLine: "The best berries are high up!",
      askLine: "We need to climb...",
      word: "LADDER", solutionEmoji: "🪜", solutionPlacement: "over",
      successLine: "Up to the top!",
    },
    {
      sceneEmoji: "☀️", sky: sky.morning, ground: ground.grass,
      problemLine: "The sun is so hot!",
      askLine: "My head needs shade...",
      word: "HAT", solutionEmoji: "👒", solutionPlacement: "onNabu",
      successLine: "Ahh, much cooler!",
    },
    {
      sceneEmoji: "🌊", sky: sky.meadow, ground: ground.grass,
      problemLine: "A stream is blocking us!",
      askLine: "Let's leap across...",
      word: "JUMP", solutionEmoji: "💨", solutionPlacement: "over",
      successLine: "Big leap! We did it!",
    },
    {
      sceneEmoji: "🐝", sky: sky.forest, ground: ground.grass,
      problemLine: "Bees! Buzz buzz!",
      askLine: "Bees love sweet things, not us...",
      word: "HONEY", solutionEmoji: "🍯", solutionPlacement: "over",
      successLine: "The bees are happy!",
    },
    {
      sceneEmoji: "🍓", sky: sky.morning, ground: ground.grass,
      problemLine: "Berries everywhere!",
      askLine: "Let's mix them up to bake...",
      word: "SPOON", solutionEmoji: "🥄", solutionPlacement: "onNabu",
      successLine: "Stir stir stir!",
    },
  ],
};

// ============================================================================
// WORLD 102 — Sky adventures
// ============================================================================

const W102_L1: PreKAdventure = {
  goal: "Help Nabu fly to the moon!",
  endingEmoji: "🌕",
  endingLine: "We made it to the moon!",
  endingSky: sky.night,
  obstacles: [
    {
      sceneEmoji: "☁️", sky: sky.sky, ground: ground.clouds,
      problemLine: "The clouds are too high!",
      askLine: "Something to lift me up...",
      word: "BALLOON", solutionEmoji: "🎈", solutionPlacement: "over",
      successLine: "Up up up!",
    },
    {
      sceneEmoji: "💨", sky: sky.sky, ground: ground.clouds,
      problemLine: "Wind is blowing me back!",
      askLine: "I need wings...",
      word: "CAPE", solutionEmoji: "🦸", solutionPlacement: "onNabu",
      successLine: "Whoosh! Super Nabu!",
    },
    {
      sceneEmoji: "⭐", sky: sky.dusk, ground: ground.clouds,
      problemLine: "It's getting dark!",
      askLine: "Something shiny to guide us...",
      word: "STAR", solutionEmoji: "⭐", solutionPlacement: "over",
      successLine: "A bright star!",
    },
    {
      sceneEmoji: "🌌", sky: sky.night, ground: ground.clouds,
      problemLine: "So far to the moon!",
      askLine: "We need a fast ride...",
      word: "ROCKET", solutionEmoji: "🚀", solutionPlacement: "onNabu",
      successLine: "3... 2... 1... BLAST OFF!",
    },
    {
      sceneEmoji: "🌑", sky: sky.night, ground: ground.clouds,
      problemLine: "The moon is hiding!",
      askLine: "Shine a light on it...",
      word: "LAMP", solutionEmoji: "🏮", solutionPlacement: "onNabu",
      successLine: "There it is!",
    },
  ],
};

const W102_L2: PreKAdventure = {
  goal: "Catch a cloud with Nabu!",
  endingEmoji: "☁️",
  endingLine: "A fluffy cloud friend!",
  endingSky: sky.sky,
  obstacles: [
    {
      sceneEmoji: "☁️", sky: sky.sky, ground: ground.grass,
      problemLine: "Clouds are floating away!",
      askLine: "I need to catch one...",
      word: "NET", solutionEmoji: "🥅", solutionPlacement: "onNabu",
      successLine: "Got one!",
    },
    {
      sceneEmoji: "🌬️", sky: sky.sky, ground: ground.grass,
      problemLine: "I'm not high enough!",
      askLine: "Something that flies on a string...",
      word: "KITE", solutionEmoji: "🪁", solutionPlacement: "over",
      successLine: "Up I go!",
    },
    {
      sceneEmoji: "💨", sky: sky.sky, ground: ground.clouds,
      problemLine: "No wind today!",
      askLine: "Something to blow...",
      word: "FAN", solutionEmoji: "🌬️", solutionPlacement: "over",
      successLine: "Whoosh! Wind!",
    },
    {
      sceneEmoji: "☁️", sky: sky.sky, ground: ground.clouds,
      problemLine: "Cloud is shy!",
      askLine: "A treat to share...",
      word: "CAKE", solutionEmoji: "🍰", solutionPlacement: "over",
      successLine: "Cloud loves cake!",
    },
  ],
};

const W102_L3: PreKAdventure = {
  goal: "Help Nabu through the storm!",
  endingEmoji: "🌈",
  endingLine: "Hello, rainbow!",
  endingSky: sky.morning,
  obstacles: [
    {
      sceneEmoji: "🌧️", sky: sky.storm, ground: ground.grass,
      problemLine: "Rain is pouring down!",
      askLine: "I need to stay dry...",
      word: "UMBRELLA", solutionEmoji: "☂️", solutionPlacement: "onNabu",
      successLine: "Pitter patter — but dry!",
    },
    {
      sceneEmoji: "🟫", sky: sky.storm, ground: ground.mud,
      problemLine: "Puddles everywhere!",
      askLine: "My feet need help...",
      word: "BOOTS", solutionEmoji: "🥾", solutionPlacement: "onNabu",
      successLine: "Splash splash!",
    },
    {
      sceneEmoji: "🌑", sky: sky.storm, ground: ground.grass,
      problemLine: "It's too dark!",
      askLine: "We need light...",
      word: "LAMP", solutionEmoji: "🏮", solutionPlacement: "onNabu",
      successLine: "I can see now!",
    },
    {
      sceneEmoji: "❄️", sky: sky.storm, ground: ground.grass,
      problemLine: "Brrr, so cold!",
      askLine: "Something warm and soft...",
      word: "BLANKET", solutionEmoji: "🧣", solutionPlacement: "onNabu",
      successLine: "Toasty warm!",
    },
    {
      sceneEmoji: "⛈️", sky: sky.storm, ground: ground.grass,
      problemLine: "Thunder! BOOM!",
      askLine: "A safe place to hide...",
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
      problemLine: "I need to start the kite!",
      askLine: "Something flat and light...",
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
      askLine: "Snip snip...",
      word: "SCISSORS", solutionEmoji: "✂️", solutionPlacement: "onNabu",
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
  goal: "Space picnic with Nabu!",
  endingEmoji: "🪐",
  endingLine: "Best picnic in space!",
  endingSky: sky.night,
  obstacles: [
    {
      sceneEmoji: "🚀", sky: sky.dusk, ground: ground.clouds,
      problemLine: "How do we get to space?",
      askLine: "Something fast and zoomy...",
      word: "ROCKET", solutionEmoji: "🚀", solutionPlacement: "over",
      successLine: "BLAST OFF!",
    },
    {
      sceneEmoji: "🌬️", sky: sky.night, ground: ground.clouds,
      problemLine: "No air in space!",
      askLine: "Something for my head...",
      word: "HELMET", solutionEmoji: "🪖", solutionPlacement: "onNabu",
      successLine: "Now I can breathe!",
    },
    {
      sceneEmoji: "❓", sky: sky.night, ground: ground.clouds,
      problemLine: "Where is the picnic spot?",
      askLine: "We need directions...",
      word: "MAP", solutionEmoji: "🗺️", solutionPlacement: "onNabu",
      successLine: "Found it!",
    },
    {
      sceneEmoji: "😋", sky: sky.night, ground: ground.clouds,
      problemLine: "I'm hungry!",
      askLine: "Bring a yummy...",
      word: "SANDWICH", solutionEmoji: "🥪", solutionPlacement: "over",
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
      problemLine: "I can't swim across the sea!",
      askLine: "Something that floats...",
      word: "BOAT", solutionEmoji: "⛵", solutionPlacement: "over",
      successLine: "All aboard!",
    },
    {
      sceneEmoji: "💧", sky: sky.ocean, ground: ground.ocean,
      problemLine: "I need to look underwater!",
      askLine: "Goggles for my eyes...",
      word: "MASK", solutionEmoji: "🥽", solutionPlacement: "onNabu",
      successLine: "I can see fishies!",
    },
    {
      sceneEmoji: "❓", sky: sky.ocean, ground: ground.ocean,
      problemLine: "Where's the treasure?",
      askLine: "Time to read a...",
      word: "MAP", solutionEmoji: "🗺️", solutionPlacement: "onNabu",
      successLine: "X marks the spot!",
    },
    {
      sceneEmoji: "📦", sky: sky.ocean, ground: ground.sand,
      problemLine: "A locked chest!",
      askLine: "I need to open it...",
      word: "KEY", solutionEmoji: "🔑", solutionPlacement: "over",
      successLine: "Click! Open!",
    },
    {
      sceneEmoji: "✨", sky: sky.ocean, ground: ground.sand,
      problemLine: "What's inside? It's shiny!",
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
      askLine: "I need to pull it...",
      word: "ROPE", solutionEmoji: "🪢", solutionPlacement: "over",
      successLine: "Heave ho!",
    },
    {
      sceneEmoji: "🪨", sky: sky.ocean, ground: ground.sand,
      problemLine: "A big rock is in the way!",
      askLine: "Help me dig around it...",
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
      problemLine: "Time to go back to the sea!",
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
      problemLine: "Fish are too quick to grab!",
      askLine: "I need a long stick...",
      word: "ROD", solutionEmoji: "🎣", solutionPlacement: "onNabu",
      successLine: "Ready to fish!",
    },
    {
      sceneEmoji: "🪱", sky: sky.ocean, ground: ground.sand,
      problemLine: "Fish won't bite!",
      askLine: "I need yummy bait...",
      word: "WORM", solutionEmoji: "🪱", solutionPlacement: "over",
      successLine: "Wiggly snack!",
    },
    {
      sceneEmoji: "🐠", sky: sky.ocean, ground: ground.sand,
      problemLine: "So many fish! Hard to catch!",
      askLine: "Scoop them with a...",
      word: "NET", solutionEmoji: "🥅", solutionPlacement: "onNabu",
      successLine: "Got them all!",
    },
    {
      sceneEmoji: "🔥", sky: sky.dusk, ground: ground.sand,
      problemLine: "Fish needs to cook!",
      askLine: "Make a warm...",
      word: "FIRE", solutionEmoji: "🔥", solutionPlacement: "over",
      successLine: "Crackle pop!",
    },
    {
      sceneEmoji: "🍳", sky: sky.dusk, ground: ground.sand,
      problemLine: "Where do I cook it?",
      askLine: "We need a...",
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
      problemLine: "It's pitch dark in here!",
      askLine: "I need a flame...",
      word: "TORCH", solutionEmoji: "🔦", solutionPlacement: "onNabu",
      successLine: "Bright!",
    },
    {
      sceneEmoji: "⬇️", sky: sky.cave, ground: ground.rock,
      problemLine: "A big drop! Yikes!",
      askLine: "I need to climb down...",
      word: "ROPE", solutionEmoji: "🪢", solutionPlacement: "over",
      successLine: "Down I go!",
    },
    {
      sceneEmoji: "🦇", sky: sky.cave, ground: ground.rock,
      problemLine: "Bats! Eek!",
      askLine: "Cover my head...",
      word: "HAT", solutionEmoji: "🎩", solutionPlacement: "onNabu",
      successLine: "Safe now!",
    },
    {
      sceneEmoji: "🚧", sky: sky.cave, ground: ground.rock,
      problemLine: "A big rock blocks the way!",
      askLine: "Break it with a...",
      word: "PICK", solutionEmoji: "⛏️", solutionPlacement: "onNabu",
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
      askLine: "Scoop it with a...",
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
      askLine: "Pick up the pretty...",
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
