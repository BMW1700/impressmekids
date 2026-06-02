/**
 * Castle Swarm — Story Bank
 *
 * Hand-written, perfectly-spelled, continuous stories used by the Castle Swarm
 * arena's StoryRunner. Each story is mapped (when possible) to a specific
 * campaign level id so reading content matches the level's arc and stakes.
 *
 * Authoring rules:
 *  - No double spaces.
 *  - Every sentence ends with . ! or ?
 *  - ASCII letters + standard punctuation only.
 *  - K-5 voice = medieval fantasy. 6-12 voice = covert / insurgent ops.
 */

export type CastleGradeBand = "K-5" | "6-12";

export interface CastleStory {
  id: string;
  gradeBand: CastleGradeBand;
  title: string;
  paragraphs: string[];
  levelId?: string;
  arcId?: string;
}

/* =========================================================================
 *  K-5 STORIES  (medieval fantasy voice)
 * ========================================================================= */

const K5: CastleStory[] = [
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
      "By night, the squad camped near a clear stream. They could see the lights of the fortress on the hill, and they knew the last fight was coming.",
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
      "The Crown Fortress was built into the side of a glacier. Its walls were ice and stone, and its banners were a deep blue. The Frost King sat on a tall throne of frost.",
      "The captain led the knights through a tunnel that an old fox had shown her. They came out behind the throne room and surprised the Frost King's guard.",
      "The fight was hard and the floor was cold. But when the captain reached the throne, she swung her sword and the crown of ice broke into a thousand pieces.",
      "Spring came back to the valley the next morning. Birds sang in the trees, and the river ran again like a quiet song.",
    ],
  },
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
      "Captain Vex was the leader of the sky pirates. He wore a long red coat, and his wyvern was the largest in the fleet. He did not know how to lose.",
      "He dove on the keep with his whole wing behind him. The captain met him on the wall with her sword raised and a steady voice.",
      "The duel rang across the courtyard. Step by step, word by word, Captain Vex was pushed back to the edge of the wall. With a final shout, the captain knocked his sword from his hand.",
      "Vex bowed and offered a deal. The captain shook her head. The keep did not bargain with thieves. The pirates flew home, and the sky was bright again.",
    ],
  },
  {
    id: "k5-arc4-1",
    levelId: "k5-arc4-1",
    arcId: "necromancers_tower",
    gradeBand: "K-5",
    title: "Marsh of Whispers",
    paragraphs: [
      "The marsh was full of low fog and quiet voices. Every skeleton the knights cut down stood right back up. A necromancer was hidden somewhere close.",
      "The captain told the squad to fan out and to listen for the chant. A young scout heard a soft song behind a wall of reeds.",
      "When the knights pushed through the reeds, the necromancer dropped his bone staff and ran. The skeletons fell where they stood, and the marsh was quiet at last.",
    ],
  },
  {
    id: "k5-arc4-2",
    levelId: "k5-arc4-2",
    arcId: "necromancers_tower",
    gradeBand: "K-5",
    title: "The Black Spire",
    paragraphs: [
      "The Black Spire rose from the marsh like a thorn. Two necromancers stood at its base, chanting in turn so the spell never broke.",
      "The captain split her squad in two. The first group held the front, and the second group climbed the wall on the far side. They had to strike at the same moment.",
      "When the signal came, both squads charged. The chant broke into pieces, and the spire shook from base to tip. The path to the Lich Lord was open.",
    ],
  },
  {
    id: "k5-arc4-3",
    levelId: "k5-arc4-3",
    arcId: "necromancers_tower",
    gradeBand: "K-5",
    title: "The Lich Lord",
    paragraphs: [
      "The Lich Lord sat in a throne of bone at the top of the spire. He held a green flame in one hand and a heavy book in the other. He smiled when the knights walked in.",
      "He called the dead to rise again, and the room filled with a clatter of bones. The captain shouted to the reader to keep going, no matter how loud it got.",
      "Each word the reader spoke pulled a page from the book and burned it to ash. The Lich Lord's flame grew small and then went out. He crumbled into dust on his own throne.",
      "The knights walked out into the morning light. The marsh was already drying. Birds returned to the trees as if nothing had ever lived here.",
    ],
  },
  {
    id: "k5-arc5-1",
    levelId: "k5-arc5-1",
    arcId: "the_final_siege",
    gradeBand: "K-5",
    title: "Outer Wall",
    paragraphs: [
      "Every enemy the keep had ever fought came back at once. Goblins, skeletons, wyverns, berserkers, and shadows from the marsh all met on the field outside the outer wall.",
      "The captain stood on the gate tower and looked at the line. It was so long it touched both edges of the world. She took a slow breath and raised her sword.",
      "The reader began the first sentence, and the knights answered with a great shout. The outer wall held through the whole long day, and the sun set on a field of broken banners.",
    ],
  },
  {
    id: "k5-arc5-2",
    levelId: "k5-arc5-2",
    arcId: "the_final_siege",
    gradeBand: "K-5",
    title: "Inner Keep",
    paragraphs: [
      "In the night, the enemies broke through and reached the inner keep. The captain pulled the knights into the great hall and slammed the heavy doors shut.",
      "The doors shook with every hit, but the reader's voice was steady. Each word made the wood grow stronger, and each sentence pushed the enemies back one more step.",
      "By morning, the hall was still standing. The captain opened the doors and saw the courtyard littered with dropped weapons. The line had held.",
    ],
  },
  {
    id: "k5-arc5-3",
    levelId: "k5-arc5-3",
    arcId: "the_final_siege",
    gradeBand: "K-5",
    title: "The Throne Room",
    paragraphs: [
      "Three liches stood in the throne room of the keep. They had taken the throne while the knights fought below. They thought the day was theirs.",
      "The captain walked in alone with her sword in one hand and a small book in the other. She read the first line out loud, and the room filled with a warm gold light.",
      "The liches stepped back. The reader kept going. With every word, the gold light grew brighter, and the shadows in the corners shrank to nothing.",
      "When the last sentence ended, the three liches were gone, and the throne was empty and quiet. The captain set the book down on the seat and walked out into the dawn.",
    ],
  },
  /* ---- Legacy K-5 stories (cover k5-1 through k5-10) ---- */
  {
    id: "k5-legacy-1",
    levelId: "k5-1",
    gradeBand: "K-5",
    title: "Goblin Patrol",
    paragraphs: [
      "A small band of goblins came out of the woods at sunset. They wanted to see if the keep was awake. The captain made sure that it was.",
      "Two knights stood at the gate with bright lanterns. When the first goblin came close, the lantern light bounced off its eyes and the goblin froze.",
      "The other goblins turned around and ran. The captain laughed and clapped her hands. It was a good night for a quiet win.",
    ],
  },
  {
    id: "k5-legacy-2",
    levelId: "k5-2",
    gradeBand: "K-5",
    title: "Bone Yard",
    paragraphs: [
      "Behind the keep there was an old bone yard with low fences. Tonight the bones started to move. Skeletons climbed out of the dirt and walked toward the wall.",
      "The captain told her knights that frost magic would not work on bones. They picked up heavy hammers instead. Every word the reader spoke made the hammers swing.",
      "By morning the yard was quiet again. The keep was safe, and the captain sent word to the next village to keep watch.",
    ],
  },
  {
    id: "k5-legacy-3",
    levelId: "k5-3",
    gradeBand: "K-5",
    title: "Night Flight",
    paragraphs: [
      "Bats flew over the gate in a long dark line. They were fast and small, and they slipped past the swords of the knights. The captain knew this would be a long night.",
      "She put torches on the wall so the bats had to fly higher. The archers waited until the bats were in the light, and then they let the arrows go.",
      "When the last bat fell, the captain put out the torches and let the knights rest. A long night was over, and the sky was empty again.",
    ],
  },
  {
    id: "k5-legacy-4",
    levelId: "k5-4",
    gradeBand: "K-5",
    title: "Witch Doctor",
    paragraphs: [
      "A goblin shaman came out of the trees in a cloak of feathers. Wherever he raised his hands, a goblin would stand back up as if it had not been hit.",
      "The captain pointed at the shaman with her sword. Take him down first, she said. The reader spoke a long word, and an arrow flew straight and true.",
      "The shaman fell, and his magic broke. The other goblins ran back into the woods. The keep was safe again, and the captain saved her thanks for the reader.",
    ],
  },
  {
    id: "k5-legacy-5",
    levelId: "k5-5",
    gradeBand: "K-5",
    title: "Brute Force",
    paragraphs: [
      "An orc the size of a small cart led the charge. His armor was iron, and his hammer was as long as a knight. He swung at the gate and the wood cracked.",
      "The captain called for the shield knights to lock their shields. The reader took a deep breath and started a long sentence. With each word, the line pushed back one foot.",
      "The orc lifted his hammer for one more swing, but the captain stepped under it and struck. The hammer dropped to the dirt. The orc bowed and walked back into the trees.",
    ],
  },
  {
    id: "k5-legacy-6",
    levelId: "k5-6",
    gradeBand: "K-5",
    title: "Twin Towers",
    paragraphs: [
      "Two towers of the keep had been left unguarded after the last fight. A pack of bats and a band of goblins took notice and came at them both at once.",
      "The captain split her knights into two small groups. Each group climbed a tower and held the top with shields. The reader's voice rang in both towers like a bell.",
      "By dawn, both towers were still ours. The captain ordered new guards to the towers and went down to the kitchen for a slow, warm breakfast.",
    ],
  },
  {
    id: "k5-legacy-7",
    levelId: "k5-7",
    gradeBand: "K-5",
    title: "Shaman Coven",
    paragraphs: [
      "Three shamans came together in the woods and made a circle of fire. Every goblin that fell inside the circle stood right back up. The keep had to break the circle.",
      "The captain sent her fastest knight with a long jump. The knight landed inside the circle and broke one of the small fires with her boot.",
      "The circle cracked open like an egg. The shamans ran in three different ways, and the goblins they had been healing fell down for good.",
    ],
  },
  {
    id: "k5-legacy-8",
    levelId: "k5-8",
    gradeBand: "K-5",
    title: "Iron Legion",
    paragraphs: [
      "An iron legion of orcs marched up the long road. Their armor caught the sun and the road shone like a river of silver. The captain whistled at the sight.",
      "She told the reader that a strong voice would matter today. The reader read a steady sentence, and the supers built fast. Fireballs flew, ice rang, and lightning cracked.",
      "By the end of the morning, the road was empty, and the silver river was gone. The captain told a small joke, and even the tired knights smiled.",
    ],
  },
  {
    id: "k5-legacy-9",
    levelId: "k5-9",
    gradeBand: "K-5",
    title: "Sky Assault",
    paragraphs: [
      "Wave after wave of bats and wyverns rolled in from the south. They flew low and fast, and the knights had to look up to find them.",
      "The captain ordered the long spears planted, the nets thrown wide, and the reader's voice held strong. Each word in the air pushed a wing back.",
      "When the last shadow left the sky, the knights cheered. The keep was safe, and the south wind smelled like rain.",
    ],
  },
  {
    id: "k5-legacy-10",
    levelId: "k5-10",
    gradeBand: "K-5",
    title: "Goblin King",
    paragraphs: [
      "The Goblin King brought his whole horde to the gate. He was tired of small raids. He wanted the keep to fall.",
      "The captain stood on the wall and waved her sword in a slow circle. The reader took a long breath and began. Every word lifted a shield, and every sentence dropped a goblin.",
      "After many waves, the King himself stepped to the front. The captain came down to meet him. Two swords rang once, and the King knelt to the dirt.",
      "The horde turned and ran. The keep stood tall, and the sun rose on a quiet morning.",
    ],
  },
];

/* =========================================================================
 *  6-12 STORIES  (covert / insurgent ops voice)
 * ========================================================================= */

const T12: CastleStory[] = [
  {
    id: "t12-arc1-1",
    levelId: "t12-arc1-1",
    arcId: "goblin_kings_return",
    gradeBand: "6-12",
    title: "Border Sweep",
    paragraphs: [
      "Agent X moved along the perimeter with a small drone humming over her shoulder. The thermal feed showed three insurgent cells probing the eastern checkpoint. Command had warned her this would happen.",
      "She marked each contact on the shared map and waited for the squad to close the gap. The first insurgent broke cover with a flash grenade, but Agent X had already stepped behind the concrete wall.",
      "When the smoke cleared, the squad had the perimeter secured. The drones tagged the survivors and tracked them back to the treeline. The eastern checkpoint held for another night.",
    ],
  },
  {
    id: "t12-arc1-2",
    levelId: "t12-arc1-2",
    arcId: "goblin_kings_return",
    gradeBand: "6-12",
    title: "Forest Ambush",
    paragraphs: [
      "The convoy was three hours into the forest when the first round struck the lead vehicle. Berserker squads had ranged the road from the ridge, and they intended to break the column in half.",
      "Agent X dismounted and pushed a flanking team uphill through the brush. Her squad moved on her cadence, and the insurgents were too focused on the road to see the second front.",
      "Within ten minutes the ridge was cleared and the convoy was rolling again. The agent logged the contact and uploaded coordinates so that command could route the next convoy a different way.",
    ],
  },
  {
    id: "t12-arc1-3",
    levelId: "t12-arc1-3",
    arcId: "goblin_kings_return",
    gradeBand: "6-12",
    title: "The Iron Pass",
    paragraphs: [
      "The Iron Pass was a narrow canyon road with rock walls on both sides. The armored convoy below moved in a tight formation, and air cover circled above. A direct approach would be a disaster.",
      "Agent X repositioned her team to the cliff and dropped a string of small charges in the rock above the convoy. When the charges blew, the rock slide split the formation in two.",
      "Her squad rappelled into the canyon and took the broken column piece by piece. By the time air cover came back around, the road was hers and the wreckage was already cooling.",
    ],
  },
  {
    id: "t12-arc1-4",
    levelId: "t12-arc1-4",
    arcId: "goblin_kings_return",
    gradeBand: "6-12",
    title: "Air Cavalry",
    paragraphs: [
      "Insurgent wyverns flew low over the valley with drone escorts in tight formation. The radar net could not lock on at that altitude, and the squad had to fight by eye.",
      "Agent X called for the long-range tripods and assigned each gunner a quadrant of the sky. The squad fired in rotating bursts so the wyverns never found a quiet pocket to dive through.",
      "By dusk, the valley floor was littered with downed drones and the squad was already loading the next belt of rounds. Command sent congratulations, but Agent X stayed on the line.",
    ],
  },
  {
    id: "t12-arc1-5",
    levelId: "t12-arc1-5",
    arcId: "goblin_kings_return",
    gradeBand: "6-12",
    title: "The Commander's Stand",
    paragraphs: [
      "The insurgent warlord had refused every offer of withdrawal. He had pulled his last battalion into a ruined fortress and intended to fight until the structure fell on top of him.",
      "Agent X led the breach team through the breach in the north wall. The warlord's personal guard met them with armored orcs at the front and necromancer support drones in the back.",
      "The squad pushed room by room with disciplined fire. The reader's voice over the comms set the rhythm, and the warlord's last guards fell one after another in the long corridor.",
      "When the agent stepped into the throne room, the warlord lowered his weapon. The campaign ended without another shot, and command logged the operation as a success.",
    ],
  },
  {
    id: "t12-arc2-1",
    levelId: "t12-arc2-1",
    arcId: "frost_invasion",
    gradeBand: "6-12",
    title: "Frozen Frontier",
    paragraphs: [
      "Agent X traced her boot prints on the frozen river and confirmed that the ice would hold heavy weight. Cold-resistant infantry had crossed here in the night and pressed into the valley.",
      "She set up an observation post in the trees and called in a long-range strike on the staging area. The strike landed clean, and the infantry pulled back to regroup behind the ridge.",
      "Her squad moved up the river on snow shoes and took the staging area without a single contact. The frontier was sealed by morning, and the cold wind blew the smoke north.",
    ],
  },
  {
    id: "t12-arc2-2",
    levelId: "t12-arc2-2",
    arcId: "frost_invasion",
    gradeBand: "6-12",
    title: "Glacier Wyverns",
    paragraphs: [
      "Wyverns nested in the cliffs above the glacier and patrolled in pairs. Air superiority over the valley belonged to them, and the squad could not move openly until that changed.",
      "Agent X requested a covert drop on the upper ridge. Two members of her squad climbed in the dark and rigged the nests with shaped charges. They were back at base before sunrise.",
      "At first light, the charges blew. The wyverns scattered into the wind with no nests to return to, and the squad finally had quiet sky over the valley.",
    ],
  },
  {
    id: "t12-arc2-3",
    levelId: "t12-arc2-3",
    arcId: "frost_invasion",
    gradeBand: "6-12",
    title: "Vanguard Push",
    paragraphs: [
      "Heavy infantry pushed in coordinated waves through the snow. They wore frost armor and they did not slow for the cold. Agent X knew that a long line would break if she hit the seams.",
      "She broke her squad into three small fire teams and assigned each team a seam in the enemy line. The reader's cadence on the comm channel kept the teams in time with each other.",
      "Within an hour, the enemy line had cracked into three separate fights, and each fight was one the squad could win. By the end of the day, the vanguard was pulling back to the high ground.",
    ],
  },
  {
    id: "t12-arc2-4",
    levelId: "t12-arc2-4",
    arcId: "frost_invasion",
    gradeBand: "6-12",
    title: "The Crown Fortress",
    paragraphs: [
      "The Crown Fortress sat in the heart of the icebound plain like a black star on a field of white. Its outer walls were ringed by sensor towers, and its inner keep held the last command staff.",
      "Agent X led the assault team through a service tunnel that an old map had revealed. The tunnel was tight and cold, but it bypassed every sensor and put the team inside the inner ring.",
      "The assault was loud and brief. The command staff surrendered in less than ten minutes, and the agent radioed the all clear. The crown was off the board, and the campaign moved on.",
    ],
  },
  {
    id: "t12-arc3-1",
    levelId: "t12-arc3-1",
    arcId: "sky_pirates",
    gradeBand: "6-12",
    title: "Black Sails",
    paragraphs: [
      "The sky pirates flew on stealth wings with the black silk camouflage of a moonless night. Their target was the supply warehouse on the outskirts of the city.",
      "Agent X had set up an ambush on the warehouse roof three hours before the strike. When the first wing dropped to deck height, she triggered the net launchers and pinned them in place.",
      "The rest of the wing peeled away. The warehouse stood, the supplies stayed, and the agent watched the silk sails disappear into the clouds.",
    ],
  },
  {
    id: "t12-arc3-2",
    levelId: "t12-arc3-2",
    arcId: "sky_pirates",
    gradeBand: "6-12",
    title: "The Cloud Galleon",
    paragraphs: [
      "The Cloud Galleon was an airborne carrier the size of a small city block. It launched its raiders in waves and pulled them back behind a curtain of flares.",
      "Agent X tagged the galleon with a tracker round and called in a fighter wing of her own. The fighters punched through the flare curtain and cracked the carrier's stabilizers.",
      "The galleon listed sideways and limped back into the clouds. Its raiders, cut off from the carrier, surrendered to the squad on the ground.",
    ],
  },
  {
    id: "t12-arc3-3",
    levelId: "t12-arc3-3",
    arcId: "sky_pirates",
    gradeBand: "6-12",
    title: "Captain Vex",
    paragraphs: [
      "Captain Vex flew at the head of his last wing in a custom interceptor painted blood red. He had refused every offer of safe passage, and command had run out of patience.",
      "Agent X waited for him on a rooftop with a coil rifle braced against a chimney. She let him pass once and tracked his arc, then waited for his second run.",
      "On the second pass, she fired one round. The interceptor's tail crumpled and Vex ejected over the city. The squad recovered him on the river bank, and the sky pirate threat was finished.",
    ],
  },
  {
    id: "t12-arc4-1",
    levelId: "t12-arc4-1",
    arcId: "necromancers_tower",
    gradeBand: "6-12",
    title: "Marsh of Whispers",
    paragraphs: [
      "The marsh swallowed sound and gave it back wrong. Agent X had heard the briefing many times, but standing in the fog she finally understood what the survivors had meant.",
      "Her squad moved in line abreast with motion sensors on every flank. When the first reanimation pulse hit, the sensors lit up in every direction at once.",
      "She located the caster by triangulating the pulse and put two rounds through his core. The pulses stopped, and the marsh fell into a more honest kind of silence.",
    ],
  },
  {
    id: "t12-arc4-2",
    levelId: "t12-arc4-2",
    arcId: "necromancers_tower",
    gradeBand: "6-12",
    title: "The Black Spire",
    paragraphs: [
      "The Black Spire was a relay tower built on a layer of reanimation engines. Twin casters kept the engines humming, and breaking even one of them would not be enough.",
      "Agent X split her assault team and assigned a caster to each half. The two halves climbed the spire on opposite sides and timed their breach to the second.",
      "The casters dropped at almost the same instant. The engines whined down, and the spire lost its hum. The squad regrouped on the roof and prepared for the next stage.",
    ],
  },
  {
    id: "t12-arc4-3",
    levelId: "t12-arc4-3",
    arcId: "necromancers_tower",
    gradeBand: "6-12",
    title: "The Lich Lord",
    paragraphs: [
      "The Lich Lord ran the entire reanimation program from a fortified command center. He had not left the room in years, and he had built every kind of defense he could think of.",
      "Agent X led the breach with a team that had trained for this room for six months. They moved through the layers of defense one at a time, and the reader's cadence on the comms held them in line.",
      "The Lich Lord stood when the agent reached his desk. He raised one hand, but it never finished the gesture. The program ended that day, and the engines went dark for good.",
    ],
  },
  {
    id: "t12-arc5-1",
    levelId: "t12-arc5-1",
    arcId: "the_final_siege",
    gradeBand: "6-12",
    title: "Outer Wall",
    paragraphs: [
      "Every cell from every campaign converged on the city outer wall at once. The board had never looked this bad. Agent X had never had so many friends on the line either.",
      "She took her place at the southern bastion and opened the comm channel to every team she had ever trained. The reader began a long sentence, and the wall answered as one.",
      "By the end of the day, the outer wall still stood. The agent counted her squads, found them all alive, and ordered fresh ammunition for the night that was coming.",
    ],
  },
  {
    id: "t12-arc5-2",
    levelId: "t12-arc5-2",
    arcId: "the_final_siege",
    gradeBand: "6-12",
    title: "Inner Keep",
    paragraphs: [
      "The wall fell in the early morning hours. Agent X pulled her teams back into the inner keep and sealed the heavy security doors behind them. The keep was built for exactly this.",
      "Wave after wave hit the doors. The reader's voice on the comms never wavered, and the squad fired in disciplined bursts that kept the corridors clean.",
      "By dawn, the inner keep still held. The agent opened the door to the courtyard and saw the city's defenders gathering for the last counterattack.",
    ],
  },
  {
    id: "t12-arc5-3",
    levelId: "t12-arc5-3",
    arcId: "the_final_siege",
    gradeBand: "6-12",
    title: "The Throne Room",
    paragraphs: [
      "Three command liches had taken the central server room and were broadcasting orders to every enemy unit still in the field. Agent X had to take that room or the city would not last another night.",
      "She went in alone with a quiet rifle and a clean signal jammer. The reader's voice in her ear set the rhythm of every step, and the agent moved through the building without firing a shot.",
      "When she reached the server room, she set the jammer down on the table and activated it. The three liches went quiet at the same time, and every enemy unit in the city lost its orders.",
      "The agent walked out into the morning. The city was bruised and tired, but it was still standing. Command logged the campaign as a win and called the squad home.",
    ],
  },
  /* ---- Legacy 6-12 stories (cover t12-1 through t12-10) ---- */
  {
    id: "t12-legacy-1",
    levelId: "t12-1",
    gradeBand: "6-12",
    title: "Recon Sweep",
    paragraphs: [
      "Agent X swept the perimeter with a thermal scope and tagged the drone scouts one by one. The drones were on a standard patrol pattern, and the pattern was easy to read once she watched it twice.",
      "She called the strike when the drones were bunched at the south corner. The strike landed clean, and the perimeter went quiet in the same minute.",
    ],
  },
  {
    id: "t12-legacy-2",
    levelId: "t12-2",
    gradeBand: "6-12",
    title: "Cold Storage",
    paragraphs: [
      "The cold storage facility had been overrun by reanimated guards. Frost weapons had no effect on the targets, and the squad would have to fight at room temperature.",
      "Agent X led with a heavy rifle and the squad cleared the racks one aisle at a time. By the end of the sweep, the facility was secure and the lights were back on.",
    ],
  },
  {
    id: "t12-legacy-3",
    levelId: "t12-3",
    gradeBand: "6-12",
    title: "Stealth Strike",
    paragraphs: [
      "A flight of surveillance drones bypassed the ground units and pushed into the city center. They moved without lights and without sound, and only the rooftop sensors picked them up in time.",
      "Agent X took the rooftop with a pair of long-range rifles. The squad dropped the drones in quick pairs, and the city center kept on going as if nothing had happened.",
    ],
  },
  {
    id: "t12-legacy-4",
    levelId: "t12-4",
    gradeBand: "6-12",
    title: "Field Medic",
    paragraphs: [
      "The enemy field medics were pulling wounded assets off the line and putting them right back into the fight. Agent X assigned each medic to a sniper.",
      "When the medics dropped, the line broke for good. The squad took the field by sundown and the casualty count stayed low.",
    ],
  },
  {
    id: "t12-legacy-5",
    levelId: "t12-5",
    gradeBand: "6-12",
    title: "Heavy Armor",
    paragraphs: [
      "Mech-suited brutes came up the boulevard in a single column. Their armor shrugged off small arms, and the squad needed to think bigger.",
      "Agent X called for the launcher team and routed them to a rooftop. The launchers cracked the column in two, and the squad pushed through the gap before the brutes could close it.",
    ],
  },
  {
    id: "t12-legacy-6",
    levelId: "t12-6",
    gradeBand: "6-12",
    title: "Air and Ground",
    paragraphs: [
      "The enemy ran a combined operation with drones in the sky and infantry on the street. The squad had to keep its eyes on both at the same time.",
      "Agent X paired each ground gunner with a sky spotter. The reader's voice kept the rhythm steady, and by the end of the hour both fronts had collapsed.",
    ],
  },
  {
    id: "t12-legacy-7",
    levelId: "t12-7",
    gradeBand: "6-12",
    title: "Healer Cluster",
    paragraphs: [
      "An enemy command cluster was traveling with three field medics and could put any unit it had lost right back into the fight. The squad would have to take the whole cluster at once.",
      "Agent X tagged each member of the cluster and assigned a sniper to each tag. The shots came on a single count, and the cluster dropped together. The fight ended ten minutes later.",
    ],
  },
  {
    id: "t12-legacy-8",
    levelId: "t12-8",
    gradeBand: "6-12",
    title: "Armored Convoy",
    paragraphs: [
      "The armored convoy rolled out of the depot in a long line and turned onto the main road. Agent X had set up the strike point two kilometers ahead at a narrow bridge.",
      "When the lead vehicle reached the bridge, the squad dropped the bridge from above. The convoy was stranded, and the squad cleaned it up at its own pace.",
    ],
  },
  {
    id: "t12-legacy-9",
    levelId: "t12-9",
    gradeBand: "6-12",
    title: "Dark Skies",
    paragraphs: [
      "Air superiority belonged to the enemy for the first half of the day. The squad could not move openly in the streets without drawing a strike from above.",
      "Agent X coordinated a rooftop campaign of small surface-to-air launchers. By the end of the day the squad had taken back the sky and the streets opened again.",
    ],
  },
  {
    id: "t12-legacy-10",
    levelId: "t12-10",
    gradeBand: "6-12",
    title: "The Director's Vault",
    paragraphs: [
      "The Director ran her command from a vault three floors below the federal building. Agent X had spent two months planning the entry, and she walked in with a calm step.",
      "The breach went quiet. The squad cleared each floor in order, and the Director surrendered at her desk without raising a hand. The campaign closed with a clean ledger.",
    ],
  },
];

/* ========================================================================= */

const ALL_STORIES: CastleStory[] = [...K5, ...T12];

const BY_LEVEL: Map<string, CastleStory> = new Map();
const BY_ARC: Map<string, CastleStory[]> = new Map();
const BY_BAND: Record<CastleGradeBand, CastleStory[]> = { "K-5": K5, "6-12": T12 };

for (const s of ALL_STORIES) {
  if (s.levelId) BY_LEVEL.set(s.levelId, s);
  if (s.arcId) {
    if (!BY_ARC.has(s.arcId)) BY_ARC.set(s.arcId, []);
    BY_ARC.get(s.arcId)!.push(s);
  }
}

/** Pick the best story bundle for a given context. */
export function pickStoriesForContext(opts: {
  gradeBand: CastleGradeBand;
  levelId?: string;
  arcId?: string;
}): CastleStory[] {
  if (opts.levelId) {
    const exact = BY_LEVEL.get(opts.levelId);
    if (exact) return [exact];
  }
  if (opts.arcId) {
    const arc = (BY_ARC.get(opts.arcId) || []).filter(s => s.gradeBand === opts.gradeBand);
    if (arc.length) return arc;
  }
  return BY_BAND[opts.gradeBand];
}

export const CASTLE_STORIES = { all: ALL_STORIES, byBand: BY_BAND };
