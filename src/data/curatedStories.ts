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
    passage_text: "The annual Young Inventors Competition attracted students from all over the state. Each participant had to design and build something original that solved a real problem. Twelve-year-old Aisha noticed that her elderly neighbor had trouble reaching items on high shelves. This inspired her invention: a voice-activated mechanical arm that could be mounted on a walker. When her neighbor said 'reach,' the arm would extend upward. Aisha spent months perfecting her design, learning about motors, circuits, and programming. On competition day, she demonstrated her invention. The judges were impressed by how she identified a real need and created a practical solution. Aisha won first place and a scholarship.",
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
  }
];
