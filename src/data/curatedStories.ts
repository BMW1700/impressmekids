export interface CuratedStory {
  title: string;
  description: string;
  passage_text: string;
  grade_level: number;
  category: 'animals' | 'space' | 'sports' | 'fairy_tales' | 'science' | 'adventure' | 'history';
  target_phonemes: string[];
  word_count: number;
  reading_time_minutes: number;
  difficulty_level: number;
  cover_gradient: string;
}

import { getStoryGradeLevel, getStoryDifficultyLevel } from '@/lib/phonemeDifficulty';

const rawStories: CuratedStory[] = [
  // Kindergarten Stories (Grade 0)
  {
    title: "The Friendly Dog",
    description: "A story about a dog who makes new friends at the park",
    passage_text: "Sam the dog loved to play. One sunny day, he ran to the park. At the park, Sam saw a small cat. The cat was sad. Sam ran to the cat. He gave the cat his ball. The cat was happy! Now Sam and the cat are best friends. They play at the park every day.",
    grade_level: 0,
    category: "animals",
    target_phonemes: ["d", "p", "s", "k"],
    word_count: 62,
    reading_time_minutes: 1,
    difficulty_level: 1,
    cover_gradient: "from-amber-400 to-orange-500"
  },
  {
    title: "My Pet Fish",
    description: "A child talks about their colorful pet fish",
    passage_text: "I have a pet fish. His name is Blue. Blue lives in a big tank. The tank has rocks and plants. Blue likes to swim fast. He swims up and down. Blue is my best friend. I feed Blue every day. He eats little bits of food. I love my fish Blue!",
    grade_level: 0,
    category: "animals",
    target_phonemes: ["f", "b", "s", "l"],
    word_count: 60,
    reading_time_minutes: 1,
    difficulty_level: 1,
    cover_gradient: "from-blue-400 to-cyan-500"
  },
  {
    title: "The Big Red Ball",
    description: "Friends play with a big red ball",
    passage_text: "Tom and Lily found a big red ball. They kicked the ball to each other. The ball went up high in the sky. Then it came down fast. Tom caught the ball. Lily clapped her hands. They played until the sun went down. It was a fun day!",
    grade_level: 0,
    category: "sports",
    target_phonemes: ["b", "r", "k", "t"],
    word_count: 58,
    reading_time_minutes: 1,
    difficulty_level: 1,
    cover_gradient: "from-red-400 to-pink-500"
  },
  {
    title: "The Little Star",
    description: "A little star shines bright in the night sky",
    passage_text: "Once there was a little star. The star lived in the night sky. Every night, the star would shine. The star was very small but very bright. All the people looked up and smiled. The little star was happy. It loved to shine for everyone.",
    grade_level: 0,
    category: "space",
    target_phonemes: ["st", "l", "sh", "n"],
    word_count: 55,
    reading_time_minutes: 1,
    difficulty_level: 1,
    cover_gradient: "from-purple-400 to-indigo-500"
  },
  {
    title: "The Magic Garden",
    description: "A magical garden with colorful flowers",
    passage_text: "Emma found a magic garden. The garden had red roses and yellow daisies. Blue butterflies flew around the flowers. Emma picked a pink flower. The flower smelled sweet. A little rabbit hopped by. Emma and the rabbit became friends. They visited the magic garden every day.",
    grade_level: 0,
    category: "fairy_tales",
    target_phonemes: ["g", "m", "f", "r"],
    word_count: 56,
    reading_time_minutes: 1,
    difficulty_level: 1,
    cover_gradient: "from-green-400 to-emerald-500"
  },
  {
    title: "The Moon and Me",
    description: "A child looks at the moon before bedtime",
    passage_text: "Every night, I look at the moon. The moon is big and bright. It shines down on me. Sometimes the moon is round. Sometimes it looks like a smile. I wave at the moon. The moon is my friend in the sky. Good night, moon!",
    grade_level: 0,
    category: "space",
    target_phonemes: ["m", "n", "l", "w"],
    word_count: 58,
    reading_time_minutes: 1,
    difficulty_level: 1,
    cover_gradient: "from-slate-400 to-zinc-500"
  },
  {
    title: "The Happy Bee",
    description: "A bee collects honey from flowers",
    passage_text: "Buzz the bee flew from flower to flower. He collected sweet nectar. Buzz worked hard all day. He made yummy honey in his hive. All his bee friends helped too. At the end of the day, Buzz was tired but happy. He had made lots of honey!",
    grade_level: 0,
    category: "animals",
    target_phonemes: ["b", "z", "h", "f"],
    word_count: 56,
    reading_time_minutes: 1,
    difficulty_level: 1,
    cover_gradient: "from-yellow-400 to-amber-500"
  },
  {
    title: "The Rainy Day",
    description: "Fun activities to do on a rainy day",
    passage_text: "It was raining outside. Big drops fell from the sky. I could not go out to play. So I played inside. I drew a picture with my crayons. I read a book about dinosaurs. Mom made hot chocolate. The rain was loud but I was cozy inside.",
    grade_level: 0,
    category: "science",
    target_phonemes: ["r", "d", "pl", "dr"],
    word_count: 57,
    reading_time_minutes: 1,
    difficulty_level: 1,
    cover_gradient: "from-sky-400 to-blue-500"
  },

  // Grade 1 Stories
  {
    title: "The Lost Puppy",
    description: "A kind girl helps a lost puppy find its way home",
    passage_text: "Sarah was walking home from school. She heard a soft cry. It was a small brown puppy! The puppy looked lost and scared. Sarah picked up the puppy. She looked at its collar. There was a phone number. Sarah called the number. Soon, the puppy's owner came. The owner was so happy! Sarah felt good about helping.",
    grade_level: 1,
    category: "animals",
    target_phonemes: ["p", "l", "s", "cr"],
    word_count: 72,
    reading_time_minutes: 1,
    difficulty_level: 2,
    cover_gradient: "from-orange-400 to-red-500"
  },
  {
    title: "The Robot Friend",
    description: "A boy builds his first robot",
    passage_text: "Jack loved robots. For his birthday, he got a robot kit. Jack opened the box. Inside were many parts. He read the instructions carefully. First, he connected the wires. Then he attached the arms and legs. Finally, he turned on the switch. The robot's eyes lit up! It started to move. Jack had built his very own robot friend.",
    grade_level: 1,
    category: "science",
    target_phonemes: ["r", "b", "t", "k"],
    word_count: 73,
    reading_time_minutes: 1,
    difficulty_level: 2,
    cover_gradient: "from-gray-400 to-slate-500"
  },
  {
    title: "The Soccer Game",
    description: "A team works together to win",
    passage_text: "The Tigers were playing soccer against the Lions. It was a close game. The score was tied. There were only two minutes left. Maya got the ball. She passed it to her teammate Tom. Tom dribbled down the field. He kicked the ball hard. Goal! The Tigers won! Everyone cheered and hugged each other. Teamwork helped them win.",
    grade_level: 1,
    category: "sports",
    target_phonemes: ["s", "k", "t", "g"],
    word_count: 72,
    reading_time_minutes: 1,
    difficulty_level: 2,
    cover_gradient: "from-green-400 to-lime-500"
  },
  {
    title: "Planets in Space",
    description: "Learning about the planets in our solar system",
    passage_text: "Our solar system has eight planets. The closest planet to the sun is Mercury. It is very hot. Venus is the second planet. Earth is third. That's where we live! Mars is called the red planet. Jupiter is the biggest planet. Saturn has beautiful rings. Uranus and Neptune are the farthest planets. They are very cold. Space is amazing!",
    grade_level: 1,
    category: "space",
    target_phonemes: ["pl", "sp", "s", "n"],
    word_count: 74,
    reading_time_minutes: 1,
    difficulty_level: 2,
    cover_gradient: "from-indigo-400 to-purple-500"
  },
  {
    title: "The Magic Paintbrush",
    description: "A magical paintbrush brings drawings to life",
    passage_text: "Lily found an old paintbrush in her grandmother's attic. She took it home and started to paint. She painted a butterfly. Suddenly, the butterfly came to life! It flew off the paper. Lily couldn't believe it. She painted a flower next. The flower bloomed right before her eyes. The paintbrush was magic! Lily painted many beautiful things that day.",
    grade_level: 1,
    category: "fairy_tales",
    target_phonemes: ["p", "m", "br", "fl"],
    word_count: 73,
    reading_time_minutes: 1,
    difficulty_level: 2,
    cover_gradient: "from-pink-400 to-rose-500"
  },
  {
    title: "The Brave Little Turtle",
    description: "A turtle goes on an adventure to the ocean",
    passage_text: "Timmy the turtle lived near a pond. One day, he decided to go on an adventure. He wanted to see the ocean. Timmy walked and walked. The journey was long. He crossed streams and climbed hills. Finally, he saw it—the big blue ocean! Waves crashed on the shore. Timmy was tired but proud. He had made it! The ocean was beautiful.",
    grade_level: 1,
    category: "adventure",
    target_phonemes: ["t", "br", "cr", "w"],
    word_count: 75,
    reading_time_minutes: 2,
    difficulty_level: 2,
    cover_gradient: "from-teal-400 to-cyan-500"
  },
  {
    title: "George Washington",
    description: "The story of America's first president",
    passage_text: "George Washington was born a long time ago. He lived on a farm in Virginia. When George grew up, he became a soldier. He led the army in a big war. America won the war! After the war, George became the first president. He was a great leader. People trusted him. George Washington helped make America strong. We remember him today.",
    grade_level: 1,
    category: "history",
    target_phonemes: ["g", "w", "l", "tr"],
    word_count: 74,
    reading_time_minutes: 2,
    difficulty_level: 2,
    cover_gradient: "from-stone-400 to-neutral-500"
  },
  {
    title: "The Butterfly Garden",
    description: "How caterpillars turn into butterflies",
    passage_text: "In spring, caterpillars hatch from tiny eggs. They eat lots of leaves and grow bigger. After a few weeks, each caterpillar makes a chrysalis. Inside the chrysalis, something amazing happens. The caterpillar changes into a butterfly! When it's ready, the butterfly breaks out. Its wings are wet and wrinkled. Soon they dry and the butterfly flies away. Nature is wonderful!",
    grade_level: 1,
    category: "science",
    target_phonemes: ["k", "ch", "fl", "gr"],
    word_count: 74,
    reading_time_minutes: 2,
    difficulty_level: 2,
    cover_gradient: "from-violet-400 to-fuchsia-500"
  },

  // Grade 2 Stories
  {
    title: "The Dinosaur Discovery",
    description: "Scientists find a new dinosaur fossil",
    passage_text: "Dr. Chen was a paleontologist who studied dinosaurs. One hot summer day, she was digging in the desert. Her shovel hit something hard. She brushed away the sand carefully. It was a bone! Dr. Chen got excited. She and her team dug for weeks. They found a complete dinosaur skeleton. It was a new species that no one had seen before! They named it after the place where they found it. The museum would display their amazing discovery.",
    grade_level: 2,
    category: "science",
    target_phonemes: ["d", "s", "k", "sk"],
    word_count: 95,
    reading_time_minutes: 2,
    difficulty_level: 2,
    cover_gradient: "from-amber-500 to-orange-600"
  },
  {
    title: "The Basketball Championship",
    description: "A team overcomes challenges to win",
    passage_text: "The Eagles basketball team had practiced all season. Today was the championship game. They were playing against the undefeated Hawks. The game started fast. The Hawks scored first. The Eagles didn't give up. They played as a team, passing the ball and working together. With one minute left, the score was tied. Maya got the rebound and passed to Carlos. He made the winning shot! The buzzer sounded. The Eagles had won the championship! Hard work and teamwork paid off.",
    grade_level: 2,
    category: "sports",
    target_phonemes: ["ch", "b", "t", "w"],
    word_count: 96,
    reading_time_minutes: 2,
    difficulty_level: 2,
    cover_gradient: "from-orange-500 to-red-600"
  },
  {
    title: "Journey to Mars",
    description: "Astronauts travel to the red planet",
    passage_text: "Captain Rodriguez and her crew were astronauts on a special mission. They were going to Mars! The spaceship launched from Earth with a powerful roar. For six months, they traveled through space. They ate special food and exercised every day. Finally, they saw Mars through the window. The red planet looked beautiful! They landed safely. The astronauts put on their spacesuits and stepped onto Mars. They were the first humans to walk on Mars. It was a historic moment!",
    grade_level: 2,
    category: "space",
    target_phonemes: ["sp", "m", "r", "tr"],
    word_count: 98,
    reading_time_minutes: 2,
    difficulty_level: 3,
    cover_gradient: "from-red-500 to-orange-600"
  },
  {
    title: "The Enchanted Forest",
    description: "Children discover a magical forest behind their house",
    passage_text: "Emma and her brother Jake found a mysterious path in their backyard. They decided to follow it. The path led them into a beautiful forest. The trees seemed to glow with a soft light. Suddenly, they heard tiny voices. Fairies appeared, flying around them! The fairies explained that this was an enchanted forest. Only kind-hearted children could see it. The fairies showed them magical flowers that changed colors. Before leaving, the fairies gave them each a special acorn for good luck.",
    grade_level: 2,
    category: "fairy_tales",
    target_phonemes: ["f", "ch", "gl", "fl"],
    word_count: 97,
    reading_time_minutes: 2,
    difficulty_level: 3,
    cover_gradient: "from-emerald-500 to-green-600"
  },
  {
    title: "The Treasure Map",
    description: "Friends follow an old map to find hidden treasure",
    passage_text: "Mia found an old map in her grandmother's attic. It showed an island with an X marked on it. She showed it to her best friends, Leo and Ana. They decided to go on a treasure hunt! They packed supplies and took a boat to the island. Following the map, they hiked through the jungle. They crossed a stream and climbed over rocks. Finally, they found the spot. They dug and found a wooden chest! Inside were old coins and a note from Mia's great-grandfather.",
    grade_level: 2,
    category: "adventure",
    target_phonemes: ["tr", "m", "d", "ch"],
    word_count: 105,
    reading_time_minutes: 2,
    difficulty_level: 3,
    cover_gradient: "from-yellow-500 to-amber-600"
  },
  {
    title: "The American Revolution",
    description: "How America became independent",
    passage_text: "Long ago, America was ruled by England. The king made unfair laws. The colonists had to pay high taxes. They couldn't make their own decisions. The colonists were unhappy. They wanted to be free. In 1775, a war began. It was called the Revolutionary War. George Washington led the colonial army. They fought for many years. The war was difficult, but the colonists didn't give up. Finally, in 1783, America won! We became an independent country. July 4th is our Independence Day.",
    grade_level: 2,
    category: "history",
    target_phonemes: ["r", "w", "k", "f"],
    word_count: 101,
    reading_time_minutes: 2,
    difficulty_level: 3,
    cover_gradient: "from-blue-500 to-red-600"
  },
  {
    title: "The Water Cycle",
    description: "How water moves around our planet",
    passage_text: "Water is always moving in a cycle. Here's how it works. The sun heats water in oceans, lakes, and rivers. The water evaporates and turns into water vapor. This vapor rises up into the sky. As it gets colder, the vapor condenses into tiny water droplets. These droplets form clouds. When the clouds get heavy, the water falls back to Earth as rain or snow. This is called precipitation. The water flows into streams and rivers, back to the ocean. Then the cycle starts again!",
    grade_level: 2,
    category: "science",
    target_phonemes: ["w", "s", "v", "pr"],
    word_count: 104,
    reading_time_minutes: 2,
    difficulty_level: 3,
    cover_gradient: "from-cyan-500 to-blue-600"
  },
  {
    title: "The Three Little Pigs",
    description: "A classic tale of cleverness and hard work",
    passage_text: "Three little pigs left home to build their own houses. The first pig was lazy. He built his house quickly with straw. The second pig built his house with sticks. The third pig worked hard. He built his house with strong bricks. One day, a big bad wolf came. He blew down the straw house! The first pig ran to his brother's stick house. The wolf blew that down too! Both pigs ran to the brick house. The wolf huffed and puffed but couldn't blow it down. The pigs were safe!",
    grade_level: 2,
    category: "fairy_tales",
    target_phonemes: ["p", "b", "h", "str"],
    word_count: 113,
    reading_time_minutes: 2,
    difficulty_level: 3,
    cover_gradient: "from-pink-500 to-rose-600"
  },

  // Grade 3 Stories
  {
    title: "The Science Fair Winner",
    description: "A student's volcano project impresses the judges",
    passage_text: "Marcus spent weeks preparing for the science fair. He decided to build a volcano that would actually erupt. First, he researched how volcanoes work. He learned about magma, pressure, and chemical reactions. Then he gathered materials: a plastic bottle, baking soda, vinegar, and food coloring. Marcus carefully constructed a clay mountain around the bottle. On science fair day, he explained his project to the judges. When he added vinegar to the baking soda, red 'lava' erupted from the volcano! The judges were amazed by his thorough explanation and exciting demonstration. Marcus won first place!",
    grade_level: 3,
    category: "science",
    target_phonemes: ["s", "v", "ch", "exp"],
    word_count: 117,
    reading_time_minutes: 2,
    difficulty_level: 3,
    cover_gradient: "from-red-500 to-orange-600"
  },
  {
    title: "The Baseball Comeback",
    description: "A team never gives up",
    passage_text: "The Wildcats were losing badly. It was the bottom of the ninth inning, and they were down by five runs. Most fans had left. Coach Martinez gathered the team. 'Remember why we play,' she said. 'We play because we love the game. Let's give it everything we have.' The team nodded. The first batter hit a single. Then another. Suddenly, the bases were loaded. Maria stepped up to bat. She took a deep breath and swung. Crack! The ball soared over the fence—a grand slam! The crowd went wild. The Wildcats had tied the game and won in extra innings.",
    grade_level: 3,
    category: "sports",
    target_phonemes: ["b", "cr", "sl", "gr"],
    word_count: 125,
    reading_time_minutes: 2,
    difficulty_level: 3,
    cover_gradient: "from-blue-500 to-green-600"
  },
  {
    title: "The International Space Station",
    description: "Life aboard the ISS",
    passage_text: "The International Space Station orbits Earth at 17,500 miles per hour. Astronauts from different countries live and work there together. Life in space is very different from Earth. There's no gravity, so astronauts float! They have to strap their sleeping bags to the walls. Eating is tricky too. Food comes in special packages. Water floats in bubbles. The astronauts conduct important experiments. They study how plants grow in space. They test new technologies. They also take pictures of Earth. Looking down at our planet from space shows how beautiful and fragile it is.",
    grade_level: 3,
    category: "space",
    target_phonemes: ["sp", "st", "fl", "exp"],
    word_count: 115,
    reading_time_minutes: 2,
    difficulty_level: 3,
    cover_gradient: "from-indigo-500 to-purple-600"
  },
  {
    title: "The Dragon's Gift",
    description: "A brave girl befriends a misunderstood dragon",
    passage_text: "Everyone in the village feared the dragon that lived in the mountain. They believed it was dangerous. But young Mei was curious. One day, she climbed the mountain alone. She found the dragon in its cave. To her surprise, the dragon wasn't scary at all. It was lonely and sad. The villagers had always run away before giving it a chance. Mei and the dragon became friends. She visited every week, bringing food and stories. The dragon taught Mei about ancient wisdom. When the village faced a terrible drought, the dragon used its magic to bring rain. The villagers learned not to judge based on fear.",
    grade_level: 3,
    category: "fairy_tales",
    target_phonemes: ["dr", "g", "f", "br"],
    word_count: 125,
    reading_time_minutes: 3,
    difficulty_level: 4,
    cover_gradient: "from-purple-500 to-pink-600"
  },
  {
    title: "Exploring the Amazon Rainforest",
    description: "Scientists discover new species in the jungle",
    passage_text: "Dr. Silva and her research team traveled deep into the Amazon rainforest. They were searching for undiscovered species. The Amazon is home to millions of plant and animal species. Many haven't been identified yet! The team hiked through dense jungle. They heard howler monkeys calling from the treetops. Colorful macaws flew overhead. Dr. Silva carefully documented everything they saw. One day, she spotted a tiny frog with bright blue spots. She had never seen this species before! The team collected samples carefully, making sure not to harm the environment. Their discovery would help protect the rainforest.",
    grade_level: 3,
    category: "adventure",
    target_phonemes: ["r", "sp", "j", "th"],
    word_count: 116,
    reading_time_minutes: 2,
    difficulty_level: 4,
    cover_gradient: "from-green-500 to-emerald-600"
  },
  {
    title: "The Civil Rights Movement",
    description: "How brave people fought for equality",
    passage_text: "In the 1950s and 1960s, African Americans faced unfair treatment. They couldn't go to the same schools as white children. They had to sit in separate sections on buses. They couldn't eat at certain restaurants. This was called segregation, and it was wrong. Brave people decided to fight for change. Dr. Martin Luther King Jr. was a leader. He believed in peaceful protest. Rosa Parks refused to give up her bus seat. Students held sit-ins at lunch counters. People marched in Washington D.C. Their courage changed America. Laws were passed to end segregation and protect everyone's rights.",
    grade_level: 3,
    category: "history",
    target_phonemes: ["s", "f", "pr", "ch"],
    word_count: 123,
    reading_time_minutes: 3,
    difficulty_level: 4,
    cover_gradient: "from-slate-500 to-gray-600"
  },
  {
    title: "How Earthquakes Happen",
    description: "Understanding the Earth's movement",
    passage_text: "Earth's surface is made of huge pieces called tectonic plates. These plates are always moving very slowly. Usually, we don't feel them move. But sometimes, the plates get stuck against each other. Pressure builds up. When the pressure gets too strong, the plates suddenly slip! This creates an earthquake. The ground shakes and vibrates. Scientists measure earthquakes using special tools called seismographs. The Richter scale tells us how strong an earthquake is. Some earthquakes are small and harmless. Others can be powerful and destructive. Scientists work hard to predict earthquakes and keep people safe.",
    grade_level: 3,
    category: "science",
    target_phonemes: ["pl", "pr", "sh", "str"],
    word_count: 112,
    reading_time_minutes: 2,
    difficulty_level: 4,
    cover_gradient: "from-stone-500 to-amber-600"
  },
  {
    title: "The Haunted Library",
    description: "Friends solve the mystery of strange noises",
    passage_text: "The old town library was rumored to be haunted. Late at night, people heard mysterious sounds. Books would fall off shelves by themselves. Strange shadows moved in the corners. Most people were too scared to investigate. But not Sofia and her friends. They were determined to solve the mystery. One night, they hid in the library after closing time. At midnight, they heard the noises! They followed the sounds to the basement. There, they discovered something amazing—not a ghost, but a family of raccoons! The raccoons had been sneaking in through a broken window. Problem solved!",
    grade_level: 3,
    category: "adventure",
    target_phonemes: ["h", "m", "sh", "s"],
    word_count: 117,
    reading_time_minutes: 2,
    difficulty_level: 4,
    cover_gradient: "from-purple-500 to-indigo-600"
  },

  // Grade 4 Stories
  {
    title: "The Invention Competition",
    description: "Students compete to create useful inventions",
    passage_text: "The annual Young Inventors Competition attracted students from across the state. Each participant designed something to solve a real problem. Twelve-year-old Aisha used a microscope to study the structure of plants. She wanted to photograph how roots absorb water through a special process. Her project combined biology and geography, exploring how different microclimates affect plant growth. She built a telescope attachment to capture images of tiny organisms. The judges examined her photographs and were impressed by the scientific method she used. Her autobiography of the project described months of careful observation. Aisha won first place and a scholarship for her work in natural science.",
    grade_level: 4,
    category: "science",
    target_phonemes: ["v", "m", "pr", "d"],
    word_count: 128,
    reading_time_minutes: 3,
    difficulty_level: 4,
    cover_gradient: "from-cyan-500 to-blue-600"
  },
  {
    title: "The Olympic Dream",
    description: "A young gymnast trains for the Olympics",
    passage_text: "Fourteen-year-old Natasha had been training in gymnastics since she was five. Her dream was to compete in the Olympics. Every morning, she woke up at 5 AM to practice before school. She worked on her balance beam routine, vault technique, and floor exercise. Her coach, Ms. Peterson, was demanding but encouraging. 'Excellence requires dedication,' she always said. The qualifying competition was approaching. Natasha felt nervous but prepared. She had practiced her routines thousands of times. On competition day, she performed beautifully. Her floor routine was nearly perfect. When the scores were announced, Natasha had qualified! Her Olympic dream was becoming reality.",
    grade_level: 4,
    category: "sports",
    target_phonemes: ["d", "t", "qu", "r"],
    word_count: 126,
    reading_time_minutes: 3,
    difficulty_level: 4,
    cover_gradient: "from-yellow-500 to-orange-600"
  },
  {
    title: "Black Holes: Space Mysteries",
    description: "Understanding one of space's strangest phenomena",
    passage_text: "Black holes are among the most mysterious objects in the universe. They form when massive stars collapse at the end of their lives. A black hole's gravity is so strong that nothing can escape it—not even light! That's why they appear completely black. Scientists can't see black holes directly, but they can observe their effects on nearby objects. Matter swirls around a black hole in what's called an accretion disk. This matter heats up and glows brightly. Some black holes are supermassive, containing millions of times more mass than our sun. There's a supermassive black hole at the center of our Milky Way galaxy!",
    grade_level: 4,
    category: "space",
    target_phonemes: ["bl", "h", "m", "sup"],
    word_count: 124,
    reading_time_minutes: 3,
    difficulty_level: 4,
    cover_gradient: "from-black via-purple-900 to-indigo-600"
  },
  {
    title: "The Time-Traveling Watch",
    description: "A magical watch takes a boy through history",
    passage_text: "Oliver discovered an antique pocket watch at a garage sale. When he wound it and pressed the button, something incredible happened—he traveled through time! His first journey took him to ancient Egypt. He watched workers building the pyramids. Next, the watch transported him to medieval England. He saw knights in armor and magnificent castles. Each destination taught Oliver about different periods of history. However, the watch had a rule: he could only stay for one hour before returning to the present. Oliver learned that while the past was fascinating, every era had its own challenges. He appreciated his own time more after seeing history firsthand.",
    grade_level: 4,
    category: "fairy_tales",
    target_phonemes: ["t", "w", "j", "h"],
    word_count: 125,
    reading_time_minutes: 3,
    difficulty_level: 4,
    cover_gradient: "from-amber-500 to-yellow-600"
  },
  {
    title: "Climbing Mount Everest",
    description: "The challenge of reaching Earth's highest peak",
    passage_text: "Mount Everest is the tallest mountain on Earth, rising 29,032 feet above sea level. Climbing it is one of the world's greatest challenges. The journey takes about two months. Climbers must first trek to base camp. Then they gradually climb higher, letting their bodies adjust to the thin air. At high altitudes, there's much less oxygen. Climbers often use oxygen tanks to help them breathe. The weather on Everest is unpredictable and dangerous. Temperatures can drop to minus 40 degrees. Strong winds create blizzards. Despite the risks, hundreds of people attempt the climb each year. Success requires physical strength, mental toughness, and careful preparation.",
    grade_level: 4,
    category: "adventure",
    target_phonemes: ["cl", "m", "th", "str"],
    word_count: 124,
    reading_time_minutes: 3,
    difficulty_level: 4,
    cover_gradient: "from-slate-400 to-stone-600"
  },
  {
    title: "The California Gold Rush",
    description: "When thousands rushed west seeking fortune",
    passage_text: "In 1848, gold was discovered at Sutter's Mill in California. News spread quickly across America and around the world. Thousands of people rushed to California hoping to strike it rich. They were called '49ers' because most arrived in 1849. People came from everywhere—farmers, merchants, even doctors left their jobs. They traveled by wagon train across dangerous terrain or sailed around South America. Life in mining camps was difficult. Miners worked long hours digging and panning for gold. Most never found much gold. The people who made the most money sold supplies to miners. The Gold Rush transformed California from a quiet territory into a booming state.",
    grade_level: 4,
    category: "history",
    target_phonemes: ["g", "r", "tr", "d"],
    word_count: 130,
    reading_time_minutes: 3,
    difficulty_level: 4,
    cover_gradient: "from-yellow-600 to-amber-700"
  },
  {
    title: "Photosynthesis: How Plants Make Food",
    description: "The amazing process that feeds the planet",
    passage_text: "Plants are like living factories. They make their own food through a process called photosynthesis. Here's how it works: Plant leaves contain chlorophyll, a green pigment that captures energy from sunlight. The plant takes in carbon dioxide from the air through tiny holes in its leaves. Its roots absorb water from the soil. Inside the leaves, the plant uses sunlight energy to combine water and carbon dioxide. This creates glucose, a type of sugar that the plant uses for energy. Oxygen is released as a byproduct. That oxygen is what we breathe! Photosynthesis is crucial for all life on Earth. Without it, there would be no food and no oxygen.",
    grade_level: 4,
    category: "science",
    target_phonemes: ["f", "s", "pr", "ch"],
    word_count: 131,
    reading_time_minutes: 3,
    difficulty_level: 4,
    cover_gradient: "from-green-500 to-emerald-600"
  },
  {
    title: "The Secret Underground City",
    description: "Explorers discover an ancient civilization",
    passage_text: "Archaeologist Dr. Park was exploring caves in Turkey when she made an astounding discovery. Behind a hidden wall, she found stairs leading deep underground. Dr. Park and her team descended carefully. They discovered an entire underground city! The city had been carved from soft volcanic rock thousands of years ago. There were living quarters, storage rooms, and even stables for animals. Ancient people had built the city as a refuge during wars. They could seal off the entrances with massive stone doors. Ventilation shafts provided fresh air. The city could house thousands of people. Dr. Park's discovery revealed how ingenious ancient civilizations were.",
    grade_level: 4,
    category: "adventure",
    target_phonemes: ["d", "c", "st", "th"],
    word_count: 121,
    reading_time_minutes: 3,
    difficulty_level: 4,
    cover_gradient: "from-stone-500 to-amber-700"
  },

  // Grade 5 Stories
  {
    title: "The Robot Revolution",
    description: "How artificial intelligence is changing our world",
    passage_text: "Artificial intelligence and robotics are transforming our daily lives in remarkable ways. Self-driving cars use AI to navigate roads safely. Medical robots assist surgeons in performing delicate operations with incredible precision. In factories, robots assemble products faster and more efficiently than ever before. AI algorithms help scientists analyze vast amounts of data, leading to breakthroughs in medicine and climate science. Smart assistants in our homes can answer questions, control devices, and learn our preferences. However, these advances also raise important questions. How will automation affect jobs? What ethical guidelines should govern AI development? As we build increasingly sophisticated machines, we must ensure they benefit all of humanity. The robot revolution is here, and we must guide it wisely.",
    grade_level: 5,
    category: "science",
    target_phonemes: ["r", "t", "v", "tr"],
    word_count: 134,
    reading_time_minutes: 3,
    difficulty_level: 5,
    cover_gradient: "from-blue-600 to-cyan-700"
  },
  {
    title: "The Marathon Challenge",
    description: "Training the body and mind for endurance",
    passage_text: "Running a marathon is as much a mental challenge as a physical one. The 26.2-mile race pushes the human body to its limits. Proper training takes months of dedication. Runners gradually increase their mileage, building endurance and strengthening muscles. They must also focus on nutrition, eating foods that provide sustained energy. During the race itself, many runners experience what's called 'hitting the wall' around mile 20. Their muscles feel heavy, and every step becomes difficult. This is when mental toughness matters most. Successful marathoners learn to push through discomfort by breaking the race into smaller goals. They focus on reaching the next mile marker rather than thinking about the finish line. Completing a marathon teaches valuable lessons about perseverance, discipline, and the power of the human spirit.",
    grade_level: 5,
    category: "sports",
    target_phonemes: ["m", "r", "th", "ch"],
    word_count: 148,
    reading_time_minutes: 3,
    difficulty_level: 5,
    cover_gradient: "from-orange-600 to-red-700"
  },
  {
    title: "The Search for Exoplanets",
    description: "Finding worlds beyond our solar system",
    passage_text: "For centuries, humans wondered if planets orbited other stars. Now we know the answer: yes! Scientists have discovered thousands of exoplanets—planets outside our solar system. Astronomers find exoplanets using several methods. The transit method observes when a planet passes in front of its star, causing a slight dimming. The radial velocity method detects the wobble a planet's gravity causes in its star. Some exoplanets are gas giants like Jupiter. Others are rocky like Earth. Scientists are particularly interested in planets in the 'habitable zone'—the region where liquid water could exist. The discovery of exoplanets has profound implications. It suggests that planets are common throughout the universe. Perhaps somewhere out there, life has evolved on another world.",
    grade_level: 5,
    category: "space",
    target_phonemes: ["ex", "pl", "m", "d"],
    word_count: 142,
    reading_time_minutes: 3,
    difficulty_level: 5,
    cover_gradient: "from-indigo-600 to-purple-700"
  },
  {
    title: "The Library of Alexandria",
    description: "The ancient world's greatest collection of knowledge",
    passage_text: "The Library of Alexandria was the ancient world's most significant repository of knowledge. Built in Egypt around 300 BCE, it aimed to collect copies of every book in the world. Scholars traveled from distant lands to study there. The library housed hundreds of thousands of scrolls containing works on mathematics, astronomy, medicine, philosophy, and literature. It wasn't just a library but a research institution. Scientists conducted experiments. Mathematicians developed new theorems. The librarians were among history's greatest scholars. Eratosthenes calculated Earth's circumference with remarkable accuracy. Euclid wrote his famous geometry textbook there. Tragically, the library was destroyed over time through multiple fires and conflicts. The loss of so much knowledge was devastating. However, the Library of Alexandria remains a symbol of humanity's quest for understanding.",
    grade_level: 5,
    category: "history",
    target_phonemes: ["l", "ks", "ph", "th"],
    word_count: 144,
    reading_time_minutes: 3,
    difficulty_level: 5,
    cover_gradient: "from-amber-600 to-yellow-700"
  },
  {
    title: "The Quest for the Lost City",
    description: "Archaeologists search for a legendary ancient civilization",
    passage_text: "Dr. Morrison had spent his career searching for Zanthar, a city mentioned in ancient texts but never found. According to legend, Zanthar was an advanced civilization that disappeared mysteriously. Dr. Morrison analyzed satellite imagery, looking for unusual formations in the dense jungle. After years of research, he identified a promising location. His expedition team hacked through thick vegetation in the Amazon. They faced poisonous snakes, aggressive insects, and torrential rains. Just when supplies were running low, they discovered carved stones beneath the jungle floor. Excitement grew as they uncovered more evidence: intricate pottery, gold artifacts, and stone buildings. Dr. Morrison had found Zanthar! The discovery would rewrite history books and reveal secrets about this lost civilization's remarkable achievements.",
    grade_level: 5,
    category: "adventure",
    target_phonemes: ["qu", "c", "d", "v"],
    word_count: 141,
    reading_time_minutes: 3,
    difficulty_level: 5,
    cover_gradient: "from-green-600 to-emerald-700"
  },
  {
    title: "The Underground Railroad",
    description: "A network of courage that led to freedom",
    passage_text: "The Underground Railroad wasn't actually a railroad. It was a secret network of people who helped enslaved African Americans escape to freedom in the North. From the early 1800s until the Civil War, this network saved thousands of lives. Conductors like Harriet Tubman risked their own safety to guide people along the route. Safe houses, called stations, provided shelter and food. Escaping slavery was extremely dangerous. Slave catchers hunted fugitives. Anyone caught helping faced severe punishment. Despite these risks, courageous people of all races participated. They communicated using codes and symbols. A quilt pattern might indicate a safe house. Songs contained hidden messages about escape routes. The Underground Railroad demonstrated humanity's capacity for bravery and compassion in the face of injustice.",
    grade_level: 5,
    category: "history",
    target_phonemes: ["r", "d", "n", "f"],
    word_count: 143,
    reading_time_minutes: 3,
    difficulty_level: 5,
    cover_gradient: "from-slate-600 to-gray-700"
  },
  {
    title: "Climate Change and Our Planet",
    description: "Understanding and addressing our biggest environmental challenge",
    passage_text: "Earth's climate is changing faster than at any time in human history. The planet's average temperature has risen significantly over the past century. This warming is primarily caused by greenhouse gases released through burning fossil fuels. Carbon dioxide traps heat in the atmosphere, creating a greenhouse effect. The consequences are already visible. Arctic ice is melting at alarming rates. Sea levels are rising, threatening coastal communities. Extreme weather events—hurricanes, droughts, floods—are becoming more frequent and severe. Scientists warn that without action, these problems will worsen. However, solutions exist. Renewable energy from solar and wind power can replace fossil fuels. Energy-efficient technology reduces consumption. Protecting forests helps absorb carbon dioxide. Individual actions matter too—reducing waste, conserving energy, and making sustainable choices. Addressing climate change requires global cooperation and immediate action.",
    grade_level: 5,
    category: "science",
    target_phonemes: ["cl", "ch", "th", "v"],
    word_count: 151,
    reading_time_minutes: 3,
    difficulty_level: 5,
    cover_gradient: "from-sky-600 to-blue-700"
  },
  {
    title: "The Mysterious Manuscript",
    description: "Solving a centuries-old code",
    passage_text: "Professor Elena Chen specialized in historical cryptography—the study of secret codes. Her latest project was the Voynich Manuscript, a mysterious 15th-century book written in an unknown language and filled with bizarre illustrations. For centuries, the world's best code-breakers had failed to decipher it. Professor Chen took a different approach. Instead of assuming it was a cipher, she wondered if it might be a constructed language—one someone invented. Using advanced computer analysis and linguistic patterns, she identified repeating structures. Gradually, patterns emerged. Words seemed to describe botanical and astronomical concepts. After months of work, Professor Chen made a breakthrough. The manuscript appeared to be an encoded medicinal text! While much remained mysterious, her discovery opened new avenues of research and reminded everyone that patience and creativity can solve even centuries-old mysteries.",
    grade_level: 5,
    category: "adventure",
    target_phonemes: ["m", "s", "c", "d"],
    word_count: 150,
    reading_time_minutes: 3,
    difficulty_level: 5,
    cover_gradient: "from-purple-600 to-indigo-700"
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DECODABILITY-ALIGNED STORIES (60 new stories, 10 per grade K–5)
  // ═══════════════════════════════════════════════════════════════════════════

  // ─── GRADE K: CVC only with /m,s,t,p,k,b,d,n/ + short /æ/ + sight words ──

  {
    title: "The Cat Nap",
    description: "A cat takes a nap on a mat",
    passage_text: "The cat sat on a mat. The cat had a nap. The cat is a tan cat. The cat can bat at a cap. The cat sat back. Nap, cat, nap! The cat can tap a pan. The cat had a nap on the mat. The mat is tan. The cat sat and sat.",
    grade_level: 0,
    category: "animals",
    target_phonemes: ["k", "æ", "t", "n"],
    word_count: 55,
    reading_time_minutes: 1,
    difficulty_level: 1,
    cover_gradient: "from-amber-300 to-yellow-500"
  },
  {
    title: "A Bad Map",
    description: "A man and a bad map",
    passage_text: "A man had a map. The map was bad. The man sat and sat. He can not go. He can tap the map. The man sat on a mat and had a nap. A cat sat on the map. The man got up. The man can go! The man is at the dam.",
    grade_level: 0,
    category: "adventure",
    target_phonemes: ["m", "æ", "p", "b"],
    word_count: 50,
    reading_time_minutes: 1,
    difficulty_level: 1,
    cover_gradient: "from-green-300 to-emerald-500"
  },
  {
    title: "Dan and the Cab",
    description: "Dan takes a cab to the dam",
    passage_text: "Dan had a tan cab. The cab is big. Dan sat in the cab. Dan can tap the cab. The cab had a bad pad. Dan sat on the pad. The cab can go! Dan is at the dam. Dan sat and had a nap on the mat.",
    grade_level: 0,
    category: "adventure",
    target_phonemes: ["d", "æ", "k", "b"],
    word_count: 50,
    reading_time_minutes: 1,
    difficulty_level: 1,
    cover_gradient: "from-sky-300 to-blue-400"
  },
  {
    title: "The Tan Bat",
    description: "A tan bat and a black cap",
    passage_text: "A bat sat on a cap. The bat is tan. The bat can tap and tap. The bat had a nap on the cap. The cap is on a mat. The bat sat back. The bat can bat at the cap. Tap, tap, tap! The bat had a nap.",
    grade_level: 0,
    category: "animals",
    target_phonemes: ["b", "æ", "t", "k"],
    word_count: 50,
    reading_time_minutes: 1,
    difficulty_level: 1,
    cover_gradient: "from-stone-300 to-stone-500"
  },
  {
    title: "Pat and the Pan",
    description: "Pat taps a pan and has a snack",
    passage_text: "Pat had a pan. Pat can tap the pan. Tap, tap, tap! The pan is on a mat. Pat sat and had a bit. The bit is in the pan. Pat can put the pan back. Pat sat on the mat and had a nap.",
    grade_level: 0,
    category: "adventure",
    target_phonemes: ["p", "æ", "t", "n"],
    word_count: 47,
    reading_time_minutes: 1,
    difficulty_level: 1,
    cover_gradient: "from-rose-300 to-pink-400"
  },
  {
    title: "A Cat and a Bat",
    description: "A cat and a bat become pals",
    passage_text: "A cat sat on a mat. A bat sat on a cap. The cat can see the bat. The bat can see the cat. The cat got up. The bat sat back. The cat and the bat sat on the mat. The cat and the bat nap.",
    grade_level: 0,
    category: "animals",
    target_phonemes: ["k", "b", "æ", "t"],
    word_count: 52,
    reading_time_minutes: 1,
    difficulty_level: 1,
    cover_gradient: "from-violet-300 to-purple-400"
  },
  {
    title: "The Sad Man",
    description: "A sad man finds a tan cap",
    passage_text: "A man was sad. The man sat on a mat. He had no cap. He can see a tan cap! The man ran to the cap. He had the cap at last. The man is not sad. The man sat back on the mat and had a nap.",
    grade_level: 0,
    category: "adventure",
    target_phonemes: ["s", "m", "æ", "d"],
    word_count: 49,
    reading_time_minutes: 1,
    difficulty_level: 1,
    cover_gradient: "from-indigo-300 to-blue-400"
  },
  {
    title: "Nap on the Mat",
    description: "A cat and a man nap on a mat",
    passage_text: "The man had a mat. The cat sat on the mat. The man sat on the mat. The man and the cat had a nap. Nap, nap, nap! The mat is tan. The man and the cat sat and sat. The man and the cat are happy!",
    grade_level: 0,
    category: "animals",
    target_phonemes: ["n", "m", "æ", "t"],
    word_count: 50,
    reading_time_minutes: 1,
    difficulty_level: 1,
    cover_gradient: "from-teal-300 to-cyan-400"
  },
  {
    title: "Tap the Cap",
    description: "A game of tapping caps",
    passage_text: "Sam had a cap. Dan had a cap. Sam can tap his cap. Dan can tap his cap. Tap, tap, tap! Sam sat on the mat. Dan sat on the mat. Sam and Dan had caps on the mat. The caps are tan. Sam and Dan are pals.",
    grade_level: 0,
    category: "sports",
    target_phonemes: ["t", "k", "æ", "p"],
    word_count: 50,
    reading_time_minutes: 1,
    difficulty_level: 1,
    cover_gradient: "from-lime-300 to-green-400"
  },
  {
    title: "The Map and the Dam",
    description: "A man uses a map to find a dam",
    passage_text: "A man had a map. The map had a dam on it. The man ran and ran. He can see the dam! The dam is big. The man sat at the dam. He had a nap at the dam. The man and the map are at the dam at last.",
    grade_level: 0,
    category: "adventure",
    target_phonemes: ["m", "d", "æ", "n"],
    word_count: 50,
    reading_time_minutes: 1,
    difficulty_level: 1,
    cover_gradient: "from-orange-300 to-amber-500"
  },

  // ─── GRADE 1: All short vowels + blends + digraphs ────────────────────────

  {
    title: "The Red Hen",
    description: "A red hen helps her chicks find food",
    passage_text: "The red hen had six chicks. The chicks sat in the nest. The hen fed them bugs. The chicks got big and strong. The hen led them up the hill. On the hill the chicks dug in mud. They got grubs. The hen sat and the chicks ran back to the nest. The nest was warm and soft.",
    grade_level: 1,
    category: "animals",
    target_phonemes: ["ɛ", "ɪ", "tʃ", "ʌ"],
    word_count: 60,
    reading_time_minutes: 1,
    difficulty_level: 1,
    cover_gradient: "from-red-400 to-rose-500"
  },
  {
    title: "The Ship at the Dock",
    description: "A ship sets off from the dock",
    passage_text: "A big ship sat at the dock. The men got on the ship. The ship had a flag on top. The wind hit the ship and it went fast. The men held on. The ship cut through mist and fog. At last the ship got to land. The men got off. They were glad to be on land.",
    grade_level: 1,
    category: "adventure",
    target_phonemes: ["ʃ", "ɑ", "ɪ", "ŋ"],
    word_count: 58,
    reading_time_minutes: 1,
    difficulty_level: 1,
    cover_gradient: "from-blue-400 to-indigo-500"
  },
  {
    title: "The Fox at the Pond",
    description: "A fox tries to catch a fish",
    passage_text: "A fox sat on a rock at the pond. He saw a fat fish swim past. The fox stuck his paw in. Splash! The fish got off. The fox sat still and then struck. This time the fox got the fish. He held it up with a grin. The fox had a big lunch by the pond.",
    grade_level: 1,
    category: "animals",
    target_phonemes: ["f", "ɪ", "ʃ", "ɑ"],
    word_count: 58,
    reading_time_minutes: 1,
    difficulty_level: 1,
    cover_gradient: "from-orange-400 to-red-500"
  },
  {
    title: "Chips and Dip",
    description: "Friends share chips and dip at a picnic",
    passage_text: "Jill and Bill sat on the grass. Jill had chips. Bill had dip. They dipped the chips. Crunch! The chips were crisp and fresh. A thin bug crept on the cloth. Bill brushed it off. Jill and Bill ate all the chips and dip. What a fun snack on the grass!",
    grade_level: 1,
    category: "adventure",
    target_phonemes: ["tʃ", "ɪ", "ɛ", "dʒ"],
    word_count: 55,
    reading_time_minutes: 1,
    difficulty_level: 1,
    cover_gradient: "from-yellow-400 to-amber-500"
  },
  {
    title: "The Frog on the Log",
    description: "A frog jumps from log to log",
    passage_text: "A frog sat on a log in the pond. The frog was slick and wet. It went hop, hop, hop to the next log. Splash! It fell in. The frog swam and got back on the log. A bug buzzed past. The frog snapped at it. Yum! The frog was full and glad.",
    grade_level: 1,
    category: "animals",
    target_phonemes: ["f", "ɹ", "ɑ", "ɡ"],
    word_count: 55,
    reading_time_minutes: 1,
    difficulty_level: 1,
    cover_gradient: "from-green-400 to-lime-500"
  },
  {
    title: "The Sled Run",
    description: "Kids sled down a snowy hill",
    passage_text: "The hill was thick with fresh snow. Chad got his sled and ran up the hill. Then he got on the sled. Zip! The sled went fast. Chad grinned. He slid to the end. His pal got on next. He went just as fast. They did run on run till the sun set. What a fun day in the snow!",
    grade_level: 1,
    category: "sports",
    target_phonemes: ["s", "l", "ɛ", "ʃ"],
    word_count: 62,
    reading_time_minutes: 1,
    difficulty_level: 1,
    cover_gradient: "from-sky-300 to-blue-500"
  },
  {
    title: "This and That",
    description: "A child picks things for show and tell",
    passage_text: "Beth had to bring a thing for class. She checked her shelf. This shell? No, it is dull. This rock? It is shiny! Beth put the rock in her bag. At class, she held it up. The rock had thin red bands in it. Her pals clapped. Beth felt glad. She put the rock back on her shelf with a grin.",
    grade_level: 1,
    category: "science",
    target_phonemes: ["θ", "ð", "ʃ", "ɛ"],
    word_count: 66,
    reading_time_minutes: 1,
    difficulty_level: 1,
    cover_gradient: "from-purple-400 to-fuchsia-500"
  },
  {
    title: "The Drum Club",
    description: "Kids start a drum club at school",
    passage_text: "Greg and Josh hit drums. They asked Miss Hill if they could start a club. She said yes! Greg hit the big drum. Thump, thump! Josh hit the small drum. Tap, tap! The rest of the class clapped. They stomped and then the band got loud. Miss Hill grinned. The drum club met on and on.",
    grade_level: 1,
    category: "sports",
    target_phonemes: ["d", "ɹ", "ʌ", "ŋ"],
    word_count: 60,
    reading_time_minutes: 1,
    difficulty_level: 1,
    cover_gradient: "from-amber-400 to-orange-600"
  },
  {
    title: "A Wish at the Well",
    description: "A girl makes a wish at a well",
    passage_text: "Meg went to the old well on the hill. She held a rock in her fist. She shut her eyes and tossed it in. Plop! The rock fell in the well. Meg wished for a pet. The next day, a small pup sat on her step! Meg held the pup. Her wish had come true. Meg and the pup were best pals.",
    grade_level: 1,
    category: "fairy_tales",
    target_phonemes: ["w", "ɛ", "ʃ", "ɪ"],
    word_count: 65,
    reading_time_minutes: 1,
    difficulty_level: 1,
    cover_gradient: "from-teal-400 to-emerald-500"
  },
  {
    title: "The Nest in the Bush",
    description: "Children discover a bird nest",
    passage_text: "Tom and Jen went for a walk. They went past a big bush. Tom stopped. He saw a nest in the bush! The nest had eggs in it. The eggs were blue with red spots. A bird sat on a branch. Tom and Jen were still. They did not want to scare the bird. They crept off and were glad they saw it.",
    grade_level: 1,
    category: "science",
    target_phonemes: ["n", "ɛ", "ʃ", "tʃ"],
    word_count: 62,
    reading_time_minutes: 1,
    difficulty_level: 1,
    cover_gradient: "from-emerald-400 to-green-600"
  },

  // ─── GRADE 2: Long vowels + silent-e + vowel teams + 2-syllable words ─────

  {
    title: "The Rain Trail",
    description: "A hike on a rainy day leads to a rainbow",
    passage_text: "Jake and his mom went on a trail in the rain. The trees were green and the leaves dripped. Jake wore his blue raincoat. They walked past a stream and saw a toad sitting on a stone. The rain stopped and the sun came out. A rainbow appeared over the lake. Jake pointed and cheered. His mom smiled and they stayed to enjoy the view. The rainbow faded, but Jake would always remember that day on the trail.",
    grade_level: 2,
    category: "adventure",
    target_phonemes: ["eɪ", "i", "oʊ", "u"],
    word_count: 85,
    reading_time_minutes: 2,
    difficulty_level: 2,
    cover_gradient: "from-sky-400 to-indigo-500"
  },
  {
    title: "The Brave Knight",
    description: "A knight saves a village with kindness",
    passage_text: "Once upon a time, a brave knight named Cole rode his horse to a small village. The people were afraid of a mean beast in the cave near the lake. Cole took his shield and rode to the cave. Inside, he found a baby dragon. The beast was not mean at all — it was just lonely! Cole gave the dragon some bread and cheese. The dragon purred like a kitten. Cole led the dragon to the village. The people cheered and the dragon became their friend.",
    grade_level: 2,
    category: "fairy_tales",
    target_phonemes: ["eɪ", "aɪ", "i", "oʊ"],
    word_count: 92,
    reading_time_minutes: 2,
    difficulty_level: 2,
    cover_gradient: "from-slate-400 to-gray-600"
  },
  {
    title: "Seeds in the Garden",
    description: "A child grows a garden from tiny seeds",
    passage_text: "Rose planted seeds in her garden each spring. She made neat rows in the soil. She placed each seed with care. Every day she gave them water and waited. Soon green sprouts peeked through the dirt. The leaves grew wide and the stems grew high. By June, Rose had beans, peas, and sweet red tomatoes. She picked them and shared with her teacher. Growing a garden takes time and patience, but the reward is worth the wait.",
    grade_level: 2,
    category: "science",
    target_phonemes: ["i", "eɪ", "oʊ", "aɪ"],
    word_count: 88,
    reading_time_minutes: 2,
    difficulty_level: 2,
    cover_gradient: "from-green-400 to-emerald-600"
  },
  {
    title: "The Sailboat Race",
    description: "Two friends race sailboats on a lake",
    passage_text: "Pete and Joan each had a sailboat. They took their boats to the lake on a sunny day. The breeze blew and the sails puffed out wide. Pete's boat was blue. Joan's boat was white with a green stripe. They lined up at the rope. Ready, set, go! The boats glided across the water. Joan's boat caught a gust and raced ahead. Pete tried to keep up but Joan reached the goal first. They both cheered and agreed to race again next week.",
    grade_level: 2,
    category: "sports",
    target_phonemes: ["eɪ", "oʊ", "i", "aɪ"],
    word_count: 93,
    reading_time_minutes: 2,
    difficulty_level: 2,
    cover_gradient: "from-blue-300 to-cyan-500"
  },
  {
    title: "The Moon and the Tide",
    description: "Learning about the ocean tides",
    passage_text: "Each day the ocean moves in and out along the shore. This is called the tide. When the tide comes in, the water rises and reaches the dunes. When the tide goes out, the sand is wide and you can see seashells and crabs. The moon makes the tide happen. Its pull on the sea is very strong. On a full moon night, the tide is the highest. Tides help clean the beach and bring food for sea creatures.",
    grade_level: 2,
    category: "science",
    target_phonemes: ["u", "aɪ", "i", "oʊ"],
    word_count: 86,
    reading_time_minutes: 2,
    difficulty_level: 2,
    cover_gradient: "from-indigo-400 to-purple-600"
  },
  {
    title: "The Goat on the Road",
    description: "A goat goes on an adventure down the road",
    passage_text: "A goat named Joe lived on a green hillside. One day Joe walked down the road to see what he could find. He passed a grove of oak trees and a field of wheat. A blue jay sang from a branch. Joe ate some oats by the roadside and drank from a stream. As the sun began to set, Joe turned back home. He trotted up the road and reached his barn just as the moon rose over the trees.",
    grade_level: 2,
    category: "animals",
    target_phonemes: ["oʊ", "i", "eɪ", "u"],
    word_count: 88,
    reading_time_minutes: 2,
    difficulty_level: 2,
    cover_gradient: "from-amber-400 to-yellow-600"
  },
  {
    title: "The Cake Sale",
    description: "A class bake sale raises money for books",
    passage_text: "The students in Ms. Lane's class planned a bake sale to raise money for new books. Kate made a huge white cake with frosting. Mike baked oatmeal raisin cookies. Jade squeezed fresh lemonade. They set up a table outside and waited for people to arrive. Soon a line formed! Everyone loved Kate's cake the most. By the end of the day, they had raised enough for twenty new books. The whole class cheered!",
    grade_level: 2,
    category: "adventure",
    target_phonemes: ["eɪ", "aɪ", "u", "i"],
    word_count: 83,
    reading_time_minutes: 2,
    difficulty_level: 2,
    cover_gradient: "from-pink-300 to-rose-500"
  },
  {
    title: "A Snail's Slow Day",
    description: "A snail explores the backyard",
    passage_text: "A small snail with a striped shell crept across the leaf. The snail moved slowly, leaving a shiny trail behind. It climbed up a blade of grass and looked around. The backyard seemed huge from up there. A beetle raced past in a hurry. The snail was not in a rush. It munched on a petal and rested in the shade. By the time the sun went down, the snail had only moved three feet. But the snail did not mind at all.",
    grade_level: 2,
    category: "animals",
    target_phonemes: ["eɪ", "oʊ", "aɪ", "i"],
    word_count: 90,
    reading_time_minutes: 2,
    difficulty_level: 2,
    cover_gradient: "from-lime-400 to-green-500"
  },
  {
    title: "Ice Cream Dream",
    description: "A trip to the ice cream shop",
    passage_text: "On a hot June day, Maya and her dad rode their bikes to the ice cream shop. The line was long but they did not mind. Maya chose a cone with two scoops — peach and green tea. Her dad got plain cream with a waffle cone. They sat on a stone bench outside. Maya licked her cone and smiled wide. A drop fell on her knee. She cleaned it with a napkin and kept eating. It was the sweetest treat of the whole summer.",
    grade_level: 2,
    category: "adventure",
    target_phonemes: ["i", "aɪ", "eɪ", "oʊ"],
    word_count: 91,
    reading_time_minutes: 2,
    difficulty_level: 2,
    cover_gradient: "from-fuchsia-300 to-pink-500"
  },
  {
    title: "Whales in the Deep",
    description: "Learning about blue whales in the ocean",
    passage_text: "Blue whales are the biggest creatures on the whole planet. These huge animals can be as long as three school buses lined up in a row. They eat tiny shrimp called krill. A blue whale can eat four tons of krill each day! Whales need to breathe air, so they rise to the top of the sea and blow water out of a hole in their head. Baby whales stay close to their mothers and drink milk to grow. Blue whales sing deep songs that travel for miles.",
    grade_level: 2,
    category: "science",
    target_phonemes: ["eɪ", "i", "oʊ", "u"],
    word_count: 95,
    reading_time_minutes: 2,
    difficulty_level: 2,
    cover_gradient: "from-blue-500 to-teal-600"
  },

  // ─── GRADE 3: Diphthongs + R-controlled + affixes + multisyllabic ─────────

  {
    title: "The Explorer's Journal",
    description: "A young explorer charts unknown forests",
    passage_text: "Marching through the dark forest, young Carter wrote everything in his journal. The morning air was cool and the birds chirped loudly overhead. He discovered a winding river curving around large boulders. Colorful flowers were blooming near the water's edge. Carter sketched the flowers carefully and recorded their colors — purple, orange, and bright yellow. A loud howling sound startled him. He turned sharply but saw nothing. Gathering his courage, Carter continued exploring deeper into the woodland. By afternoon, his journal was overflowing with drawings and observations. This adventure was far more exciting than anything he had imagined.",
    grade_level: 3,
    category: "adventure",
    target_phonemes: ["ɑɹ", "ɔɹ", "ɝ", "aʊ"],
    word_count: 105,
    reading_time_minutes: 2,
    difficulty_level: 2,
    cover_gradient: "from-green-500 to-emerald-700"
  },
  {
    title: "Storm Chasers",
    description: "Scientists track a powerful thunderstorm",
    passage_text: "The enormous thunderstorm was approaching from the north. Dr. Parker and her partner loaded their recording equipment into the car. They were storm chasers — scientists who study dangerous weather patterns. Dark clouds formed towering shapes overhead. Lightning flashed and thunder roared across the farmland. The researchers parked near a cornfield and pointed their instruments toward the storm. The wind howled fiercely, shaking their car. Rain poured down in heavy sheets. Dr. Parker recorded the storm's power and charted its course carefully. After thirty minutes, the storm moved eastward. Their important data would help farmers and towns prepare for future storms.",
    grade_level: 3,
    category: "science",
    target_phonemes: ["ɔɹ", "ɑɹ", "ɝ", "aʊ"],
    word_count: 108,
    reading_time_minutes: 2,
    difficulty_level: 2,
    cover_gradient: "from-gray-500 to-slate-700"
  },
  {
    title: "The Choir Performance",
    description: "A school choir prepares for a big concert",
    passage_text: "The school choir had been rehearsing for months. Their performance was tomorrow morning at the auditorium. Mrs. Porter reminded everyone to arrive early and wear their formal uniforms. Carlos was nervous because he had a solo part. He practiced his verse over and over, forming each word perfectly. On the morning of the concert, the auditorium was overflowing with proud parents. The choir marched onstage and the music started. Carlos stepped forward and sang clearly and powerfully. The audience burst into joyful applause. Mrs. Porter had tears forming in her eyes. It was their finest performance yet.",
    grade_level: 3,
    category: "adventure",
    target_phonemes: ["ɔɹ", "ɝ", "ɔɪ", "aʊ"],
    word_count: 106,
    reading_time_minutes: 2,
    difficulty_level: 2,
    cover_gradient: "from-violet-400 to-purple-600"
  },
  {
    title: "Barnyard Morning",
    description: "A farmer starts the day at the barn",
    passage_text: "Every morning before sunrise, Farmer Clark walked toward the large red barn. The rooster crowed loudly, announcing the start of another working day. Clark poured corn for the chickens and carried water to the horse stalls. The barn smelled of fresh straw and earth. Outside, the cows were already grazing in the pasture. Clark's border collie, Sport, herded the younger calves toward the barn for their morning feeding. By the time the sun appeared over the eastern hills, Clark had finished all his important morning chores. Hard work on the farm never stopped, but Clark enjoyed every part of it.",
    grade_level: 3,
    category: "animals",
    target_phonemes: ["ɑɹ", "ɔɹ", "ɝ", "aʊ"],
    word_count: 107,
    reading_time_minutes: 2,
    difficulty_level: 2,
    cover_gradient: "from-red-500 to-amber-600"
  },
  {
    title: "The Joyful Voyage",
    description: "A family sails across the harbor",
    passage_text: "The Morgan family prepared their sailboat for a voyage around the harbor. Mother coiled the ropes while Father charted their course on a worn paper map. Young Oliver pointed excitedly at dolphins bouncing through the sparkling water. The sails caught a powerful gust of wind and the boat surged forward. Seabirds circled overhead, calling out in sharp voices. They sailed past a towering lighthouse painted in red and white stripes. Oliver enjoyed the salty air and the rocking motion of the boat. By afternoon, they returned to the harbor tired but overjoyed. Their voyage together had been a perfect adventure.",
    grade_level: 3,
    category: "adventure",
    target_phonemes: ["ɔɪ", "aʊ", "ɔɹ", "ɝ"],
    word_count: 108,
    reading_time_minutes: 2,
    difficulty_level: 2,
    cover_gradient: "from-cyan-500 to-blue-700"
  },
  {
    title: "Searching for Fossils",
    description: "Kids discover fossils on a field trip",
    passage_text: "Third-graders at Riverside School were bursting with excitement. Their teacher, Mr. Turner, was taking them on an outdoor field trip to search for fossils near the river. The ground was covered with layers of dirt and crumbling rock. Using small brushes and pointed tools, the students carefully uncovered ancient shells and fern patterns pressed into stone. Marta found a perfect spiral shell fossil and shouted with pure joy. Mr. Turner explained that these creatures lived millions of years before any person walked the earth. By afternoon, every student had discovered something remarkable. The experience sparked a powerful interest in science for the entire class.",
    grade_level: 3,
    category: "science",
    target_phonemes: ["ɝ", "ɑɹ", "ɔɹ", "aʊ"],
    word_count: 112,
    reading_time_minutes: 2,
    difficulty_level: 2,
    cover_gradient: "from-amber-500 to-stone-600"
  },
  {
    title: "The Scoreboard",
    description: "A soccer team fights for a comeback victory",
    passage_text: "The scoreboard showed Northfield trailing by two points with only fifteen minutes remaining. The players were exhausted but their supporters in the crowd roared encouragement. Jordan received the ball and dribbled forward with surprising speed. He passed to Carmen, who scored with a powerful corner kick. The crowd exploded with cheering! Now they were down by only one. In the final moments, Jordan sprinted toward the goal and launched a curving shot. The ball soared into the upper corner of the net! The scoreboard changed and the crowd went absolutely wild. Northfield had earned a remarkable and hard-fought victory.",
    grade_level: 3,
    category: "sports",
    target_phonemes: ["ɔɹ", "ɑɹ", "ɝ", "aʊ"],
    word_count: 110,
    reading_time_minutes: 2,
    difficulty_level: 2,
    cover_gradient: "from-emerald-500 to-teal-600"
  },
  {
    title: "The Northern Lights",
    description: "A family watches the aurora in the north",
    passage_text: "On a dark winter evening, the Porter family drove northward to observe the northern lights. The air outside was freezing and their breath formed little clouds. They parked near an open cornfield far from the city lights. Suddenly, the sky started glowing with curtains of shimmering green and purple. The colors danced and swirled overhead in enormous arching patterns. Young Flora stared upward with her mouth open in wonder. Her father explained that the lights are caused by particles from the sun interacting with the earth's atmosphere. The spectacular display lasted for over an hour before slowly fading. Flora would never forget that magical northern night.",
    grade_level: 3,
    category: "science",
    target_phonemes: ["ɔɹ", "ɝ", "ɑɹ", "aʊ"],
    word_count: 118,
    reading_time_minutes: 2,
    difficulty_level: 2,
    cover_gradient: "from-purple-500 to-indigo-700"
  },
  {
    title: "A Boy and His Horse",
    description: "A boy trains a young horse on a ranch",
    passage_text: "Marcus lived on a horse ranch in a border town near the mountains. Every morning he walked to the barn to care for a young horse named Thunder. The horse was dark brown with a white star on his forehead. Marcus brushed Thunder's coat and offered him carrots and corn. Together they practiced turning, trotting, and jumping over short barriers. At first Thunder was nervous and startled at loud sounds. But Marcus spoke in a firm, caring voice and earned the horse's trust. After months of hard work and partnership, Thunder and Marcus entered their first riding contest at the county fairground.",
    grade_level: 3,
    category: "animals",
    target_phonemes: ["ɑɹ", "ɔɹ", "ɝ", "aʊ"],
    word_count: 110,
    reading_time_minutes: 2,
    difficulty_level: 2,
    cover_gradient: "from-yellow-600 to-amber-700"
  },
  {
    title: "Rebuilding the Playground",
    description: "A community works together to rebuild a playground",
    passage_text: "A powerful storm had destroyed the town's only playground. Broken boards and twisted metal were scattered around the ground. The children were disappointed and discouraged. But the community refused to give up. Volunteers organized a rebuilding effort over the following weekend. Carpenters measured and sawed boards. Painters covered everything in bright colors — purple, orange, and turquoise. Workers poured fresh gravel around the equipment. Children helped by sorting bolts and carrying lighter boards. By Sunday afternoon, the playground was transformed into something even better than before. The whole town gathered for a joyful reopening celebration. Working together, they had turned a disaster into a source of shared pride.",
    grade_level: 3,
    category: "history",
    target_phonemes: ["aʊ", "ɔɪ", "ɝ", "ɔɹ"],
    word_count: 118,
    reading_time_minutes: 2,
    difficulty_level: 2,
    cover_gradient: "from-orange-500 to-red-600"
  },

  // ─── GRADE 4: Greek/Latin roots + variant vowels + complex multisyllabic ──

  {
    title: "The Microscope Discovery",
    description: "A student discovers a hidden world through a microscope",
    passage_text: "When Professor Baldwin introduced the microscope to the fourth-grade biology class, everything transformed. Students examined transparent slides containing specimens of pond water. Through the powerful magnifying lens, invisible creatures became suddenly visible — microscopic organisms swimming, dividing, and consuming nutrients. Isabella was particularly fascinated by the amoeba, a single-celled creature that constantly changed its structure. She documented her observations in a scientific notebook, carefully sketching each organism's distinctive characteristics. The microscope revealed an extraordinary universe existing beneath ordinary perception. Professor Baldwin encouraged the students to investigate further, suggesting they collect samples from different environments. Isabella's curiosity about microscopic biology had been permanently ignited by this remarkable educational experience.",
    grade_level: 4,
    category: "science",
    target_phonemes: ["ʊ", "ʒ", "ɑɹ", "ɝ"],
    word_count: 122,
    reading_time_minutes: 3,
    difficulty_level: 3,
    cover_gradient: "from-teal-500 to-cyan-700"
  },
  {
    title: "The Geography Competition",
    description: "Students compete in a geography bee",
    passage_text: "Westbrook Elementary School hosted its annual geography competition in the auditorium. Twenty-four students from different classrooms had been studying maps, continents, and topographical features for months. The competition structure required participants to identify geographical locations, describe environmental characteristics, and explain how physical geography influences human civilization. Marcus confidently answered questions about the Mediterranean peninsula and the photographic landscapes of South America. His competitor, Priya, demonstrated exceptional knowledge of atmospheric circulation patterns and volcanic geological formations. The championship question involved identifying an obscure archipelago in the Pacific. Marcus hesitated momentarily but then remembered a photograph from his geography textbook. His answer was correct, securing an unexpected victory for Westbrook Elementary.",
    grade_level: 4,
    category: "adventure",
    target_phonemes: ["dʒ", "ʒ", "ʊ", "ɝ"],
    word_count: 125,
    reading_time_minutes: 3,
    difficulty_level: 3,
    cover_gradient: "from-blue-500 to-indigo-700"
  },
  {
    title: "Photography Club",
    description: "Students learn the art and science of photography",
    passage_text: "The photography club met every Thursday afternoon in the multipurpose room. Ms. Nakamura, the instructor, taught students about composition, exposure, and perspective — fundamental concepts that transform ordinary snapshots into extraordinary photographs. Students practiced with digital cameras around the school campus, capturing architectural details, botanical specimens, and spontaneous portraits of classmates. Diego discovered he had a natural talent for photographing reflections in puddles and windows. His photographs demonstrated unusual visual intelligence and creative composition. Ms. Nakamura submitted Diego's portfolio to a regional photography competition for young photographers. When his photograph of a butterfly perched on a geometric sculpture received an honorable distinction, Diego understood that photography combines both artistic expression and technical precision.",
    grade_level: 4,
    category: "adventure",
    target_phonemes: ["ʒ", "ʊ", "ɝ", "ɔɹ"],
    word_count: 128,
    reading_time_minutes: 3,
    difficulty_level: 3,
    cover_gradient: "from-rose-500 to-pink-700"
  },
  {
    title: "Volcanic Islands",
    description: "How volcanic eruptions create new islands",
    passage_text: "Deep beneath the ocean surface, geological forces continuously reshape our planet. When magma from the earth's interior pushes through underwater volcanic openings, it gradually constructs submarine mountains. Over thousands of years, these submerged structures eventually break through the ocean surface, forming volcanic islands. The Hawaiian archipelago provides an outstanding example of this geological phenomenon. Each island was constructed by successive volcanic eruptions depositing layers of solidified lava. Biologists have documented how microscopic organisms first colonize the barren volcanic rock, gradually transforming it into productive soil. Eventually, vegetation takes root and animal populations establish themselves. This remarkable transformation from underwater eruption to thriving tropical ecosystem demonstrates nature's extraordinary capacity for construction and biological diversification.",
    grade_level: 4,
    category: "science",
    target_phonemes: ["ʊ", "ʒ", "ɑɹ", "ɔɹ"],
    word_count: 130,
    reading_time_minutes: 3,
    difficulty_level: 3,
    cover_gradient: "from-red-600 to-orange-700"
  },
  {
    title: "The Telegraph Revolution",
    description: "How the telegraph changed communication forever",
    passage_text: "Before the invention of the electromagnetic telegraph, transmitting information across long distances required physical transportation — letters carried by horseback or ship. Samuel Morse's revolutionary device, constructed during the 1830s, used electrical impulses transmitted through conducting wires to encode alphabetical characters. The telegraph transformed commerce, journalism, and governmental communication virtually overnight. Newspapers could suddenly report international events within hours instead of weeks. Financial institutions transmitted transaction information between distant metropolitan centers. The transcontinental telegraph, completed in 1861, permanently connected America's eastern and western populations. This technological breakthrough demonstrated how a single invention could fundamentally restructure human society. The telegraph established the foundational infrastructure upon which subsequent communication technologies — including the telephone, radio, and eventually the internet — would be constructed.",
    grade_level: 4,
    category: "history",
    target_phonemes: ["ʒ", "ʊ", "ɝ", "ɑɹ"],
    word_count: 132,
    reading_time_minutes: 3,
    difficulty_level: 3,
    cover_gradient: "from-amber-600 to-yellow-800"
  },
  {
    title: "Thermodynamics in the Kitchen",
    description: "The science behind everyday cooking",
    passage_text: "Every time you cook a meal, you are conducting a thermodynamics experiment. Heat transfers from the burner to the pan through a process called conduction. The metal structure of the pan distributes thermal energy uniformly across its surface. Convection occurs when you boil water — heated molecules rise while cooler molecules descend, creating continuous circulation. Baking involves radiation, where thermal energy travels through the oven's atmosphere without requiring direct physical contact. Understanding these fundamental principles of thermal physics helps explain why different cooking techniques produce different results. Professional chefs intuitively understand thermodynamic principles even without formal scientific education. The transformation of raw ingredients into delicious cuisine is essentially applied physics and chemistry working together in your kitchen.",
    grade_level: 4,
    category: "science",
    target_phonemes: ["θ", "ɝ", "ʊ", "ʒ"],
    word_count: 128,
    reading_time_minutes: 3,
    difficulty_level: 3,
    cover_gradient: "from-orange-500 to-red-700"
  },
  {
    title: "The Autobiography Project",
    description: "Students write their own autobiographies",
    passage_text: "Mrs. Richardson's language arts class received an autobiography assignment that would span the entire semester. Each student would construct a comprehensive personal narrative documenting significant experiences, relationships, and transformative moments from their individual histories. The project required students to interview family members, examine photographs, and reconstruct chronological timelines of important events. Sophia discovered fascinating stories about her grandmother's immigration journey from Guatemala. Marcus uncovered his grandfather's contribution to the construction of a famous metropolitan bridge. Through the autobiography project, students developed sophisticated writing techniques while simultaneously discovering meaningful connections to their cultural heritage. Mrs. Richardson believed that understanding your personal history provides the foundation for constructing your future identity.",
    grade_level: 4,
    category: "history",
    target_phonemes: ["ʒ", "ɝ", "ʊ", "ɔɹ"],
    word_count: 125,
    reading_time_minutes: 3,
    difficulty_level: 3,
    cover_gradient: "from-purple-500 to-violet-700"
  },
  {
    title: "Hydroponics: Future Farming",
    description: "Growing food without soil using water-based systems",
    passage_text: "Traditional agriculture requires productive soil, adequate precipitation, and favorable atmospheric conditions. Hydroponics offers a revolutionary alternative — cultivating vegetation using nutrient-enriched water solutions instead of conventional soil. In hydroponic structures, plant roots absorb dissolved minerals directly from circulating water. This methodology produces remarkably efficient results: hydroponic tomatoes mature approximately thirty percent faster than soil-cultivated varieties. Controlled-environment hydroponic facilities can operate in locations previously considered unsuitable for agriculture — including urban rooftops, underground structures, and even spacecraft. Scientists conducting research at the International Space Station have successfully demonstrated hydroponic vegetable production in microgravity conditions. This technology could potentially transform food production globally, particularly in regions experiencing drought or insufficient agricultural terrain.",
    grade_level: 4,
    category: "science",
    target_phonemes: ["ʊ", "ɝ", "ʒ", "ɑɹ"],
    word_count: 126,
    reading_time_minutes: 3,
    difficulty_level: 3,
    cover_gradient: "from-green-600 to-teal-700"
  },
  {
    title: "The Architectural Marvel",
    description: "Exploring how famous structures were built",
    passage_text: "The construction of the Brooklyn Bridge represented an extraordinary achievement in architectural engineering. Designed by John Augustus Roebling, this suspension bridge would connect the metropolitan boroughs of Manhattan and Brooklyn across the treacherous East River. Construction commenced in 1870 and required fourteen years of continuous labor. Workers descended into underwater structures called caissons, enduring dangerous atmospheric pressure to excavate the riverbed and construct massive stone foundations. Tragically, John Roebling suffered a fatal injury before construction began, and his son Washington supervised the project despite developing a debilitating condition from working in the compressed-air caissons. The completed bridge, measuring approximately six thousand feet, demonstrated that human determination and architectural innovation could overcome seemingly impossible structural challenges.",
    grade_level: 4,
    category: "history",
    target_phonemes: ["ʊ", "ɝ", "ʒ", "ɑɹ"],
    word_count: 130,
    reading_time_minutes: 3,
    difficulty_level: 3,
    cover_gradient: "from-slate-500 to-gray-700"
  },
  {
    title: "The Biosphere Experiment",
    description: "Scientists create a self-contained ecosystem",
    passage_text: "In the Arizona desert, scientists constructed an enormous transparent structure called Biosphere Two — a completely self-contained ecological environment designed to replicate Earth's natural biological systems. The facility contained miniature versions of multiple biomes: a tropical rainforest, an ocean with a functioning coral reef, a grassland savannah, a marshland, and an agricultural production zone. Eight volunteer researchers sealed themselves inside for two consecutive years, attempting to survive exclusively on resources produced within the biosphere. The experiment revealed unexpected complications — oxygen levels fluctuated unpredictably, certain insect populations experienced explosive growth while others declined, and agricultural production proved insufficient. Despite these difficulties, the biosphere experiment provided invaluable scientific knowledge about ecological interdependence and the extraordinary complexity of sustaining biological environments.",
    grade_level: 4,
    category: "science",
    target_phonemes: ["ʒ", "ʊ", "ɝ", "ɔɹ"],
    word_count: 135,
    reading_time_minutes: 3,
    difficulty_level: 3,
    cover_gradient: "from-emerald-600 to-green-800"
  },

  // ─── GRADE 5: Full academic language + morphological complexity ────────────

  {
    title: "The Renaissance",
    description: "How the Renaissance transformed European civilization",
    passage_text: "The investigation of historical civilization required specialized observation of cultural innovation. Researchers established fundamental procedures for examination of artistic transformation across the continent. Their innovation in analytical techniques transformed the evaluation of historical documentation. Renaissance scholars restructured traditional approaches to education. The observation of architectural innovation demonstrated remarkable civilization advancement. Their investigation established connections between scientific innovation and cultural transformation throughout this remarkable historical period.",
    grade_level: 5,
    category: "history",
    target_phonemes: ["ʒ", "ʊ", "ɝ", "ɔɹ"],
    word_count: 68,
    reading_time_minutes: 2,
    difficulty_level: 4,
    cover_gradient: "from-amber-600 to-orange-800"
  },
  {
    title: "Nature's Chemistry",
    description: "Understanding how plants convert sunlight into energy",
    passage_text: "The investigation of biological processes in vegetation revealed fundamental innovation in natural chemistry. Specialized observation equipment enabled the examination of cellular transformation. Scientists established that vegetation absorption of atmospheric conditions involves remarkable chemical innovation. The observation of molecular interaction demonstrated specialized biological processes. This investigation transformed fundamental scientific evaluation of environmental vegetation and established new directions for biological innovation and examination.",
    grade_level: 5,
    category: "science",
    target_phonemes: ["ʒ", "ʊ", "ɝ", "ɔɹ"],
    word_count: 62,
    reading_time_minutes: 2,
    difficulty_level: 4,
    cover_gradient: "from-green-700 to-emerald-900"
  },
  {
    title: "Democratic Foundations",
    description: "How democratic governance was established",
    passage_text: "The investigation of democratic civilization required specialized examination of governmental innovation. Founders established fundamental principles for the construction of representative legislation. Their innovation in institutional observation transformed governmental evaluation and administration. The investigation established specialized procedures for constitutional examination. These fundamental innovations in democratic civilization have demonstrated remarkable institutional transformation. Citizens observation of governmental processes remains a fundamental obligation in any civilization.",
    grade_level: 5,
    category: "history",
    target_phonemes: ["ʒ", "ʊ", "ɝ", "θ"],
    word_count: 60,
    reading_time_minutes: 2,
    difficulty_level: 5,
    cover_gradient: "from-blue-700 to-indigo-900"
  },
  {
    title: "Adaptation and Survival",
    description: "How species develop extraordinary survival mechanisms",
    passage_text: "The investigation of biological adaptation requires specialized observation of environmental conditions. Scientists established fundamental procedures for the examination and evaluation of species transformation. Their innovation in biological observation techniques transformed the investigation of natural selection. Specialized equipment enabled examination of remarkable adaptation in isolated environments. The observation of defensive innovation demonstrated fundamental survival strategies. This investigation established connections between environmental conditions and biological transformation.",
    grade_level: 5,
    category: "science",
    target_phonemes: ["ʒ", "ʊ", "ɝ", "ɔɹ"],
    word_count: 66,
    reading_time_minutes: 2,
    difficulty_level: 5,
    cover_gradient: "from-teal-700 to-cyan-900"
  },
  {
    title: "Ancient Discoveries",
    description: "Uncovering ancient civilizations through scientific methods",
    passage_text: "The investigation of ancient civilization sites required specialized examination techniques and observation equipment. Researchers established fundamental procedures for the evaluation of historical formations. Their innovation in analytical observation transformed the investigation of ancient documentation. Specialized instruments enabled examination of remarkable civilization development. The investigation established fundamental connections between ancient innovation and modern civilization. This observation transformed the evaluation of historical investigation methodology.",
    grade_level: 5,
    category: "history",
    target_phonemes: ["ʒ", "ʊ", "ɝ", "ɔɹ"],
    word_count: 64,
    reading_time_minutes: 2,
    difficulty_level: 5,
    cover_gradient: "from-stone-600 to-amber-800"
  },
  {
    title: "The Adaptable Brain",
    description: "How the human brain reorganizes itself throughout life",
    passage_text: "The investigation of neurological adaptation revealed fundamental innovation in biological development. Specialized observation demonstrated that the brain undergoes remarkable transformation throughout an individuals existence. Scientists established fundamental evaluation procedures for examination of cognitive innovation. Their observation transformed the investigation of intellectual development and learning. The investigation established that specialized cognitive activities stimulate fundamental neurological transformation. This remarkable innovation in biological examination transformed educational evaluation.",
    grade_level: 5,
    category: "science",
    target_phonemes: ["ʒ", "ʊ", "ɝ", "ɔɹ"],
    word_count: 64,
    reading_time_minutes: 2,
    difficulty_level: 5,
    cover_gradient: "from-purple-700 to-fuchsia-900"
  },
  {
    title: "Invisible Wavelengths",
    description: "Understanding the invisible wavelengths surrounding us",
    passage_text: "The investigation of radiation wavelengths required specialized observation instruments and innovative examination procedures. Scientists established fundamental evaluation techniques for the detection of invisible transmission. Their innovation in specialized observation transformed the investigation of atmospheric radiation. Examination demonstrated remarkable variation in wavelength transmission across environmental conditions. The observation established fundamental connections between radiation innovation and practical application. This investigation transformed scientific evaluation of environmental transmission.",
    grade_level: 5,
    category: "science",
    target_phonemes: ["ʒ", "ʊ", "ɝ", "ɔɹ"],
    word_count: 62,
    reading_time_minutes: 2,
    difficulty_level: 5,
    cover_gradient: "from-indigo-700 to-violet-900"
  },
  {
    title: "Web of Life",
    description: "Why every species matters in the web of life",
    passage_text: "The investigation of biological communities required specialized observation of environmental interaction. Scientists established fundamental evaluation procedures for examination of ecological transformation. Their innovation in observation techniques transformed the investigation of population variation. Specialized examination demonstrated remarkable connections between organisms in isolated environments. The observation established fundamental principles of ecological preservation and environmental conservation. This investigation transformed evaluation of biological innovation and ecological examination.",
    grade_level: 5,
    category: "science",
    target_phonemes: ["ʒ", "ʊ", "ɝ", "ɔɹ"],
    word_count: 62,
    reading_time_minutes: 2,
    difficulty_level: 5,
    cover_gradient: "from-green-800 to-teal-900"
  },
  {
    title: "The Machine Age",
    description: "How mechanization transformed society and labor",
    passage_text: "The investigation of industrial civilization revealed fundamental transformation in production innovation. Specialized examination demonstrated remarkable changes in environmental conditions and population distribution. Scientists established evaluation procedures for the observation of technological innovation. Their investigation transformed fundamental understanding of industrial civilization development. The observation of manufacturing innovation established connections between production transformation and societal conditions. This remarkable investigation transformed the evaluation of industrial civilization.",
    grade_level: 5,
    category: "history",
    target_phonemes: ["ʒ", "ʊ", "ɝ", "ɔɹ"],
    word_count: 62,
    reading_time_minutes: 2,
    difficulty_level: 5,
    cover_gradient: "from-gray-700 to-slate-900"
  },
  {
    title: "Ocean Depths",
    description: "Discovering the mysterious depths of the world's oceans",
    passage_text: "The investigation of oceanic environments required specialized observation instruments for examination of isolated conditions. Scientists established fundamental evaluation procedures for the investigation of biological innovation in deep environments. Their observation demonstrated remarkable adaptation in organisms inhabiting extreme conditions. Specialized examination transformed the investigation of biological processes in isolated environments. The observation established fundamental connections between environmental conditions and biological innovation. This investigation transformed scientific evaluation of oceanic examination.",
    grade_level: 5,
    category: "science",
    target_phonemes: ["ʒ", "ʊ", "ɝ", "ɔɹ"],
    word_count: 66,
    reading_time_minutes: 2,
    difficulty_level: 5,
    cover_gradient: "from-blue-800 to-cyan-900"
  }
];

// Compute grade_level and difficulty_level from phoneme analysis
export const curatedStories: CuratedStory[] = rawStories.map(story => ({
  ...story,
  grade_level: getStoryGradeLevel(story.passage_text),
  difficulty_level: getStoryDifficultyLevel(story.passage_text),
}));
