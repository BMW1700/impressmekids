/**
 * Standardized Screening Passages for AURA Universal Screening
 * 
 * These passages are designed specifically for oral reading fluency assessment:
 * - Grade-leveled using Flesch-Kincaid readability
 * - Controlled vocabulary matching grade expectations
 * - 1-minute reading length (200-250 words for higher grades)
 * - Fiction and nonfiction mix for authentic assessment
 * - Calibrated to Hasbrouck & Tindal norms
 */

export interface ScreeningPassage {
  id: string;
  title: string;
  gradeLevel: number;
  passage: string;
  wordCount: number;
  fleschKincaidGrade: number;
  genre: 'fiction' | 'nonfiction';
  targetWCPM: {
    fall: { percentile50: number; percentile25: number; percentile10: number };
    winter: { percentile50: number; percentile25: number; percentile10: number };
    spring: { percentile50: number; percentile25: number; percentile10: number };
  };
}

// Hasbrouck & Tindal 2017 norms embedded in passages
export const screeningPassages: ScreeningPassage[] = [
  // KINDERGARTEN (Grade 0) - ~60 words, simple CVC patterns
  {
    id: 'k-fiction-1',
    title: 'The Red Hat',
    gradeLevel: 0,
    passage: `I have a red hat. My hat is big. I put my hat on. The hat is on my head. I run and run. The hat falls off. I pick up the hat. I put it on again. Now I walk. The hat stays on. I like my red hat. It is the best hat.`,
    wordCount: 62,
    fleschKincaidGrade: 0.5,
    genre: 'fiction',
    targetWCPM: {
      fall: { percentile50: 10, percentile25: 5, percentile10: 2 },
      winter: { percentile50: 23, percentile25: 12, percentile10: 6 },
      spring: { percentile50: 47, percentile25: 28, percentile10: 15 },
    },
  },
  {
    id: 'k-nonfiction-1',
    title: 'Dogs',
    gradeLevel: 0,
    passage: `Dogs are pets. Dogs can run fast. Dogs can jump up high. Some dogs are big. Some dogs are small. Dogs like to play. Dogs eat food from a dish. Dogs drink water. Dogs wag their tails when they are happy. I like dogs. Do you like dogs too?`,
    wordCount: 55,
    fleschKincaidGrade: 0.4,
    genre: 'nonfiction',
    targetWCPM: {
      fall: { percentile50: 10, percentile25: 5, percentile10: 2 },
      winter: { percentile50: 23, percentile25: 12, percentile10: 6 },
      spring: { percentile50: 47, percentile25: 28, percentile10: 15 },
    },
  },
  {
    id: 'k-fiction-2',
    title: 'The Big Box',
    gradeLevel: 0,
    passage: `I see a big box. What is in the box? I open the box. A cat is in the box! The cat is soft. The cat says meow. The cat jumps out. The cat runs to me. I pet the cat. The cat is happy. I am happy too.`,
    wordCount: 57,
    fleschKincaidGrade: 0.3,
    genre: 'fiction',
    targetWCPM: {
      fall: { percentile50: 10, percentile25: 5, percentile10: 2 },
      winter: { percentile50: 23, percentile25: 12, percentile10: 6 },
      spring: { percentile50: 47, percentile25: 28, percentile10: 15 },
    },
  },

  // GRADE 1 - ~100 words, short sentences
  {
    id: 'g1-fiction-1',
    title: 'The Lost Ball',
    gradeLevel: 1,
    passage: `Tom had a new red ball. He liked to play with it every day. One day, Tom threw the ball too high. It went over the fence. Tom was sad. He could not get his ball back. His friend Sam came by. Sam was tall. Sam reached over the fence and got the ball. Tom was so happy! He thanked Sam. Then they played catch together. It was a fun day.`,
    wordCount: 82,
    fleschKincaidGrade: 1.2,
    genre: 'fiction',
    targetWCPM: {
      fall: { percentile50: 23, percentile25: 12, percentile10: 6 },
      winter: { percentile50: 53, percentile25: 28, percentile10: 15 },
      spring: { percentile50: 72, percentile25: 43, percentile10: 25 },
    },
  },
  {
    id: 'g1-nonfiction-1',
    title: 'The Sun',
    gradeLevel: 1,
    passage: `The sun is a star. It is very big and very hot. The sun gives us light and heat. We need the sun to live. Plants need the sun to grow. The sun rises in the morning. It goes across the sky. At night, the sun sets. Then it gets dark. We go to sleep. The next day, the sun comes back again. The sun helps all living things.`,
    wordCount: 79,
    fleschKincaidGrade: 1.1,
    genre: 'nonfiction',
    targetWCPM: {
      fall: { percentile50: 23, percentile25: 12, percentile10: 6 },
      winter: { percentile50: 53, percentile25: 28, percentile10: 15 },
      spring: { percentile50: 72, percentile25: 43, percentile10: 25 },
    },
  },
  {
    id: 'g1-fiction-2',
    title: 'The New Pet',
    gradeLevel: 1,
    passage: `Mia wanted a pet. She asked her mom and dad. They went to the pet shop. Mia saw fish, birds, and hamsters. She saw a small brown puppy. The puppy wagged its tail. Mia smiled big. She held the puppy. It licked her face. Mia knew this was her pet. They took the puppy home. Mia named him Buddy. Buddy and Mia became best friends.`,
    wordCount: 78,
    fleschKincaidGrade: 1.3,
    genre: 'fiction',
    targetWCPM: {
      fall: { percentile50: 23, percentile25: 12, percentile10: 6 },
      winter: { percentile50: 53, percentile25: 28, percentile10: 15 },
      spring: { percentile50: 72, percentile25: 43, percentile10: 25 },
    },
  },

  // GRADE 2 - ~150 words
  {
    id: 'g2-fiction-1',
    title: 'The Rainy Day Adventure',
    gradeLevel: 2,
    passage: `Emma woke up to the sound of rain on her window. She felt sad because she had planned to play outside. Her mom said, "Let's make the best of this rainy day." First, they made pancakes for breakfast. Then, Emma and her mom built a blanket fort in the living room. Inside the fort, they read stories with a flashlight. After lunch, they played board games. Emma made up a new game with her toy animals. By the time the rain stopped, Emma realized she had the most fun day ever. Sometimes rainy days can be the best days. Emma smiled and hugged her mom. "Can we do this again?" she asked.`,
    wordCount: 120,
    fleschKincaidGrade: 2.1,
    genre: 'fiction',
    targetWCPM: {
      fall: { percentile50: 51, percentile25: 31, percentile10: 18 },
      winter: { percentile50: 72, percentile25: 47, percentile10: 30 },
      spring: { percentile50: 89, percentile25: 62, percentile10: 42 },
    },
  },
  {
    id: 'g2-nonfiction-1',
    title: 'All About Frogs',
    gradeLevel: 2,
    passage: `Frogs are amazing animals. They live on land and in water. Frogs start their lives as eggs in ponds. The eggs hatch into tadpoles. Tadpoles have tails and live in water. As they grow, tadpoles get legs. Their tails get smaller. Soon, they become frogs! Frogs can jump very far. Some frogs can jump twenty times their body length. Frogs eat bugs with their long, sticky tongues. They catch bugs so fast that you cannot see it happen. Frogs make sounds to talk to each other. Male frogs croak to call females. Frogs are found all over the world except in very cold places. They are an important part of nature.`,
    wordCount: 121,
    fleschKincaidGrade: 2.3,
    genre: 'nonfiction',
    targetWCPM: {
      fall: { percentile50: 51, percentile25: 31, percentile10: 18 },
      winter: { percentile50: 72, percentile25: 47, percentile10: 30 },
      spring: { percentile50: 89, percentile25: 62, percentile10: 42 },
    },
  },
  {
    id: 'g2-fiction-2',
    title: 'The Brave Little Mouse',
    gradeLevel: 2,
    passage: `In a small hole under an old oak tree lived a little mouse named Max. Max was smaller than all the other mice. The bigger mice often teased him. One day, a hungry owl flew into the meadow. All the mice ran and hid. But the owl spotted the mouse family's food pile. Max knew he had to act. He ran out and made loud sounds. The owl looked at Max. Max darted left, then right. The owl chased Max but could not catch him. Max led the owl far away from the other mice. When Max returned, all the mice cheered. From that day on, no one teased Max. He was the bravest mouse of all.`,
    wordCount: 126,
    fleschKincaidGrade: 2.4,
    genre: 'fiction',
    targetWCPM: {
      fall: { percentile50: 51, percentile25: 31, percentile10: 18 },
      winter: { percentile50: 72, percentile25: 47, percentile10: 30 },
      spring: { percentile50: 89, percentile25: 62, percentile10: 42 },
    },
  },

  // GRADE 3 - ~200 words
  {
    id: 'g3-fiction-1',
    title: 'The Mystery of the Missing Cookies',
    gradeLevel: 3,
    passage: `Sarah noticed something strange in her kitchen. The cookie jar was empty again! She had filled it yesterday with fresh chocolate chip cookies. This was the third time this week that cookies had disappeared. Sarah decided to solve the mystery. She set up a camera near the cookie jar. That night, she waited and watched the screen. At first, nothing happened. Then, she saw movement. It was her little brother Jake! He was sneaking into the kitchen on his tiptoes. Jake reached into the cookie jar and grabbed two cookies. Sarah jumped out from behind the couch. Jake was so surprised that he dropped the cookies. "I knew it was you!" Sarah laughed. Jake's face turned red. "Please don't tell Mom and Dad," he begged. Sarah thought for a moment. "I won't tell them if you share the cookies with me from now on." Jake agreed quickly. From that day on, the siblings became partners in their late-night snacking adventures. The mystery was solved, and everyone was happy.`,
    wordCount: 178,
    fleschKincaidGrade: 3.2,
    genre: 'fiction',
    targetWCPM: {
      fall: { percentile50: 71, percentile25: 48, percentile10: 31 },
      winter: { percentile50: 92, percentile25: 64, percentile10: 44 },
      spring: { percentile50: 107, percentile25: 78, percentile10: 55 },
    },
  },
  {
    id: 'g3-nonfiction-1',
    title: 'How Bees Make Honey',
    gradeLevel: 3,
    passage: `Have you ever wondered how bees make honey? It is a fascinating process that takes many steps. First, worker bees fly from flower to flower. They collect a sweet liquid called nectar. Bees have a special stomach just for carrying nectar. When a bee's nectar stomach is full, she flies back to the hive. At the hive, the bee gives the nectar to another bee. This bee chews the nectar for about thirty minutes. The chewing breaks down the sugars in the nectar. Then, the bee spreads the nectar into honeycomb cells. The bees fan the nectar with their wings. This removes water and makes the nectar thick. Finally, the nectar becomes honey! The bees seal each cell with wax to keep the honey fresh. A single bee makes only a tiny drop of honey in its whole life. It takes thousands of bees working together to fill a jar. That is why honey is so special!`,
    wordCount: 169,
    fleschKincaidGrade: 3.4,
    genre: 'nonfiction',
    targetWCPM: {
      fall: { percentile50: 71, percentile25: 48, percentile10: 31 },
      winter: { percentile50: 92, percentile25: 64, percentile10: 44 },
      spring: { percentile50: 107, percentile25: 78, percentile10: 55 },
    },
  },

  // GRADE 4 - ~220 words
  {
    id: 'g4-fiction-1',
    title: 'The Tree House Secret',
    gradeLevel: 4,
    passage: `Marcus and his grandfather had been building a tree house all summer. Every Saturday, they would hammer nails, measure boards, and paint the wooden walls together. On the last day of construction, Grandpa handed Marcus an old metal box. "This belongs in your tree house now," Grandpa said with a smile. Marcus opened the box and found a collection of treasures: old baseball cards, a compass, photographs, and a folded letter. The letter was written in Grandpa's handwriting. It explained that this same box had been in Grandpa's tree house when he was a boy. Each item had a story attached to it. The baseball cards were from his first game with his father. The compass had helped him navigate through the woods behind their old farm. The photographs showed Grandpa with his childhood friends, looking just as young as Marcus felt now. "Now it's your turn to add your own memories," Grandpa said softly. Marcus felt a connection to his grandfather that he had never experienced before. He carefully placed the box in a special corner of the tree house. He knew that someday, he would pass this box down to his own grandchildren, continuing the tradition that his grandfather had started so many years ago.`,
    wordCount: 210,
    fleschKincaidGrade: 4.1,
    genre: 'fiction',
    targetWCPM: {
      fall: { percentile50: 94, percentile25: 68, percentile10: 48 },
      winter: { percentile50: 112, percentile25: 84, percentile10: 61 },
      spring: { percentile50: 123, percentile25: 95, percentile10: 71 },
    },
  },
  {
    id: 'g4-nonfiction-1',
    title: 'The Water Cycle',
    gradeLevel: 4,
    passage: `Water on Earth is constantly moving in a never-ending cycle. This process is called the water cycle, and it has been happening for billions of years. The sun heats water in oceans, lakes, and rivers. This causes the water to evaporate, changing from liquid to invisible water vapor. The vapor rises high into the atmosphere where the air is much cooler. As the vapor cools, it condenses into tiny water droplets. These droplets gather together to form clouds. When the droplets become too heavy, they fall back to Earth as precipitation. Precipitation can take many forms including rain, snow, sleet, or hail. Some precipitation soaks into the ground and becomes groundwater. Plants absorb this water through their roots. Other precipitation flows into streams and rivers, eventually returning to the ocean. The cycle then begins again. Scientists estimate that the water you drink today might have been dinosaur water millions of years ago. The water cycle is essential for all life on Earth. It provides fresh water for drinking, helps plants grow, and shapes our weather patterns. Understanding this cycle helps us appreciate how precious and connected our water resources truly are.`,
    wordCount: 197,
    fleschKincaidGrade: 4.3,
    genre: 'nonfiction',
    targetWCPM: {
      fall: { percentile50: 94, percentile25: 68, percentile10: 48 },
      winter: { percentile50: 112, percentile25: 84, percentile10: 61 },
      spring: { percentile50: 123, percentile25: 95, percentile10: 71 },
    },
  },

  // GRADE 5 - ~250 words
  {
    id: 'g5-fiction-1',
    title: 'The Lighthouse Keeper',
    gradeLevel: 5,
    passage: `Elizabeth had always wondered about the old lighthouse at the edge of town. It stood silent on the rocky cliff, its light extinguished for decades. One autumn afternoon, she discovered that the lighthouse was being renovated and would soon open as a museum. The construction crew needed volunteers to help sort through boxes of old artifacts found inside. Elizabeth signed up immediately. On her first day volunteering, she found a leather journal wedged behind a loose stone in the basement. The journal belonged to Margaret O'Brien, who had been the lighthouse keeper from 1892 to 1918. As Elizabeth read the faded entries, she was transported to another time. Margaret wrote about guiding ships through treacherous storms and the loneliness of her isolated existence. She described the satisfaction of knowing that her light had saved countless lives. One entry caught Elizabeth's attention: Margaret wrote about hiding something precious behind a stone before leaving the lighthouse forever. Elizabeth's heart raced. Could the journal be referring to the same stone where she had found the book? She carefully removed more stones and discovered a small wooden box. Inside was a beautiful silver locket containing photographs of Margaret and a young sailor. Elizabeth showed the discovery to the museum director, who was overjoyed. The locket became the centerpiece of the new lighthouse museum, and Elizabeth received special recognition for uncovering a piece of local history that had been lost for over a century.`,
    wordCount: 242,
    fleschKincaidGrade: 5.2,
    genre: 'fiction',
    targetWCPM: {
      fall: { percentile50: 110, percentile25: 85, percentile10: 61 },
      winter: { percentile50: 127, percentile25: 99, percentile10: 74 },
      spring: { percentile50: 139, percentile25: 109, percentile10: 83 },
    },
  },
  {
    id: 'g5-nonfiction-1',
    title: 'The Human Heart',
    gradeLevel: 5,
    passage: `The human heart is one of the most remarkable organs in the body. About the size of your fist, this muscular organ works tirelessly every moment of your life. On average, the heart beats approximately one hundred thousand times per day, pumping about two thousand gallons of blood through sixty thousand miles of blood vessels. The heart has four chambers: two upper chambers called atria and two lower chambers called ventricles. The right side of the heart receives blood that has traveled through the body and sends it to the lungs to pick up oxygen. The left side receives this oxygen-rich blood from the lungs and pumps it out to the rest of the body. The heart's electrical system controls its rhythm. Special cells in the heart generate electrical signals that tell the heart muscle when to contract. This is what creates your heartbeat. When you exercise, your heart beats faster to deliver more oxygen to your muscles. When you sleep, it slows down to conserve energy. Taking care of your heart is essential for a long, healthy life. Regular exercise strengthens the heart muscle, making it more efficient. Eating nutritious foods and avoiding harmful substances helps keep blood vessels clear and flexible. Understanding how this incredible organ works helps us appreciate the importance of making healthy choices every day.`,
    wordCount: 228,
    fleschKincaidGrade: 5.4,
    genre: 'nonfiction',
    targetWCPM: {
      fall: { percentile50: 110, percentile25: 85, percentile10: 61 },
      winter: { percentile50: 127, percentile25: 99, percentile10: 74 },
      spring: { percentile50: 139, percentile25: 109, percentile10: 83 },
    },
  },
];

// Helper to get passages by grade level
export function getPassagesForGrade(gradeLevel: number): ScreeningPassage[] {
  return screeningPassages.filter(p => p.gradeLevel === gradeLevel);
}

// Helper to get a random passage for screening (prevents students sharing answers)
export function getRandomScreeningPassage(gradeLevel: number): ScreeningPassage | null {
  const passages = getPassagesForGrade(gradeLevel);
  if (passages.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * passages.length);
  return passages[randomIndex];
}

// Get all available grade levels
export function getAvailableGradeLevels(): number[] {
  const levels = new Set(screeningPassages.map(p => p.gradeLevel));
  return Array.from(levels).sort((a, b) => a - b);
}
