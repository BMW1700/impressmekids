/**
 * Castle Swarm — Story Bank
 *
 * Hand-written, perfectly-spelled, continuous stories used by the Castle Swarm
 * arena's StoryRunner. Each story is mapped (when possible) to a specific
 * campaign level id so reading content matches the level's arc and stakes.
 *
 * Authoring rules (also enforced by tests at runtime, see runner):
 *  - No double spaces, no tabs.
 *  - Every sentence ends with . ! or ?
 *  - ASCII letters + standard punctuation only.
 *  - K-5 voice = medieval fantasy. 6-12 voice = covert / insurgent ops.
 */

export type CastleGradeBand = "K-5" | "6-12";

export interface CastleStory {
  id: string;
  gradeBand: CastleGradeBand;
  title: string;
  /** 2-5 short paragraphs. Each paragraph is 2-5 sentences. */
  paragraphs: string[];
  /** Optional level id this story is tuned for. */
  levelId?: string;
  /** Optional arc id (for fallback selection by arc). */
  arcId?: string;
}

/* =========================================================================
 *  K-5 STORIES  (medieval fantasy voice)
 * ========================================================================= */

const K5_ARC1: CastleStory[] = [
  {
    id: "k5-arc1-1",
    levelId: "k5-arc1-1",
    arcId: "goblin_kings_return",
    gradeBand: "K-5",
    title: "The Burning Watchtower",
    paragraphs: [
      "Smoke rose from the watchtower on the hill. The goblin scouts had come back, and this time they brought fire. The captain rang the bell three times to call the knights.",
      "The first goblin reached the gate with a torch in its hand. A young knight stepped forward and raised a shield. The torch hit the shield and the spark died on the iron.",
      "More goblins came up the hill. The captain shouted, and the archers drew their bows. The arrows flew in a long, dark arc and the goblins fell back into the trees.",
      "The tower still burned, but the gate held. A small girl on the wall waved a banner so the people in the village would know the keep was safe.",
    ],
  },
  {
    id: "k5-arc1-2",
    levelId: "k5-arc1-2",
    arcId: "goblin_kings_return",
    gradeBand: "K-5",
    title: "Forest Ambush",
    paragraphs: [
      "The knights rode into the dark forest. The leaves were thick and the path was thin. Birds did not sing here, and the horses walked slowly.",
      "A snap of a stick. A flash of green skin. The berserkers burst from the bushes with axes raised. The young knight had to act fast.",
      "She slid off her horse and lifted her shield. The first axe rang against it like a bell. Her friends were beside her in a moment, and the goblins were soon running back into the trees.",
      "When the dust settled, the captain counted the squad. No one was lost. The forest still felt heavy, but the path was clear again.",
    ],
  },
  {
    id: "k5-arc1-3",
    levelId: "k5-arc1-3",
    arcId: "goblin_kings_return",
    gradeBand: "K-5",
    title: "The Iron Pass",
    paragraphs: [
      "The Iron Pass was a narrow road between two cliffs. The armored orcs marched in a long line and their shields locked together like the scales of a great snake.",
      "The captain knew a head-on fight would not work. She sent her smallest knight up the cliff with a rope and a bag of stones. From above, the knight let the stones roll down.",
      "The shield wall broke when the stones hit. The orcs scattered, and the rest of the squad pushed through the pass with a loud cheer.",
      "On the far side of the pass, the road opened to a wide green valley. The captain raised her sword and pointed at the next ridge. The Goblin King was close now.",
    ],
  },
  {
    id: "k5-arc1-4",
    levelId: "k5-arc1-4",
    arcId: "goblin_kings_return",
    gradeBand: "K-5",
    title: "Wyverns Overhead",
    paragraphs: [
      "Dark wings filled the sky above the valley. The wyverns were small dragons that the Goblin King had trained for war. They could dive faster than an arrow.",
      "The archers planted long spears in the ground and aimed them at the sky. When the first wyvern dropped, it landed right on a spear and tumbled to the grass.",
      "The other wyverns turned and climbed back into the clouds. The captain shouted to the knights to keep their helmets on and to watch the shadows on the ground.",
      "By night, the squad camped near a clear stream. They could see the lights of the Goblin King's fortress on the hill, and they knew the last fight was coming.",
    ],
  },
  {
    id: "k5-arc1-5",
    levelId: "k5-arc1-5",
    arcId: "goblin_kings_return",
    gradeBand: "K-5",
    title: "The Goblin King's Last Stand",
    paragraphs: [
      "The gates of the fortress were tall and black. The Goblin King stood at the top of the wall in a crown of bone and held a heavy iron mace.",
      "His personal guard came down the steps in a thunder of boots. Berserkers, armored orcs, and shamans all moved as one. It was the largest force the captain had ever seen.",
      "The captain raised her sword and shouted a word that her grandmother had taught her. The knights answered, and the line held. Every word the reader spoke struck like a hammer.",
      "When the dust cleared, the iron crown lay on the steps. The Goblin King was gone, and the horde melted into the forest. The bards would tell the story for a hundred years.",
    ],
  },
];

const K5_ARC2: CastleStory[] = [
  {
    id: "k5-arc2-1",
    levelId: "k5-arc2-1",
    arcId: "frost_invasion",
    gradeBand: "K-5",
    title: "The Frozen River",
    paragraphs: [
      "The river froze in one cold night. Where there had been water, now there was a wide white road. The dead came across it without making a sound.",
      "The knights set fires on the bank to warm their hands and to watch the ice. When the first skeleton stepped onto the snow, an archer let an arrow fly.",
      "The skeleton fell, but a hundred more came after it. The captain ordered the line to hold the bank no matter what. The fires made long shadows on the snow.",
    ],
  },
  {
    id: "k5-arc2-2",
    levelId: "k5-arc2-2",
    arcId: "frost_invasion",
    gradeBand: "K-5",
    title: "Glacier Hunters",
    paragraphs: [
      "High in the cliffs above the river, the wyverns made their nests in the ice. The knights had to climb in the cold wind with ropes and picks.",
      "A young knight slipped, but her friend caught her hand and pulled her back. They reached the ledge and surprised the nest before the wyverns could take to the sky.",
      "When they came down the cliff at dawn, the people in the valley cheered. The sky was empty for the first time in many days.",
    ],
  },
  {
    id: "k5-arc2-3",
    levelId: "k5-arc2-3",
    arcId: "frost_invasion",
    gradeBand: "K-5",
    title: "The Frost King's Vanguard",
    paragraphs: [
      "The Frost King sent his vanguard down the mountain. They wore boots of iron and they did not slip on the ice. The captain knew this was a hard fight.",
      "She placed her shield knights on the narrow bridge. The berserkers came in a rush, but the line held. Every reader's word warmed the steel and made the swords feel light.",
      "By the end of the day, the bridge was still ours. The vanguard fell back into the snow, and the Frost King's crown was not far away.",
    ],
  },
  {
    id: "k5-arc2-4",
    levelId: "k5-arc2-4",
    arcId: "frost_invasion",
    gradeBand: "K-5",
    title: "The Crown Fortress",
    paragraphs: [
      "The Crown Fortress was built into the side of a glacier. Its walls were ice and stone, and its banners were a deep blue. The Frost King sat in a tall throne of frost.",
      "The captain led the knights through a tunnel that an old fox had shown her. They came out behind the throne room and surprised the Frost King's guard.",
      "The fight was hard and the floor was cold. But when the captain reached the throne, she swung her sword and the crown of ice broke into a thousand pieces.",
      "Spring came back to the valley the next morning. Birds sang in the trees, and the river ran again like a quiet song.",
    ],
  },
];

const K5_ARC3: CastleStory[] = [
  {
    id: "k5-arc3-1",
    levelId: "k5-arc3-1",
    arcId: "sky_pirates",
    gradeBand: "K-5",
    title: "Black Sails",
    paragraphs: [
      "The sky pirates flew on the backs of wyverns with sails of black silk. They came down on the village like a storm and tried to take the grain.",
      "The captain rang the alarm bell. The knights ran to the rooftops with nets and long hooks. When the pirates dove in, the nets caught their wings.",
      "The grain stayed in the village. The children cheered from the windows, and the pirates flew back to the clouds with empty bags.",
    ],
  },
  {
    id: "k5-arc3-2",
    levelId: "k5-arc3-2",
    arcId: "sky_pirates",
    gradeBand: "K-5",
    title: "The Cloud Galleon",
    paragraphs: [
      "A great ship of wood and rope floated above the keep. It was the Cloud Galleon, the flagship of the sky pirates. Ropes came down its sides and raiders slid to the ground.",
      "The knights met them shield to shield in the courtyard. The reader's words cracked like thunder, and the raiders could not push past the line.",
      "When the galleon turned to flee, the archers cut its ropes and the great ship listed sideways into the clouds. The pirates would think twice before coming back.",
    ],
  },
  {
    id: "k5-arc3-3",
    levelId: "k5-arc3-3",
    arcId: "sky_pirates",
    gradeBand: "K-5",
    title: "Captain Vex",
    paragraphs: [
      "Captain Vex was the leader of the sky pirates. He wore a long red coat and his wyvern was the largest in the fleet. He did not know how to lose.",
      "He dove on the keep with his whole wing behind him. The captain met him on the wall with her sword raised and a steady voice.",
      "The duel rang across the courtyard. Step by step, word by word, Captain Vex was pushed back to the edge of the wall. With a final shout, the capt