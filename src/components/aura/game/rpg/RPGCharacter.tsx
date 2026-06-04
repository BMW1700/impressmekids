import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Shield } from "lucide-react";
import { RPGCharacter as RPGCharacterType, RPGEnemy } from "@/lib/rpgBattleData";
import { RPGCharacterSprite } from "./RPGCharacterSprite";
import { GoblinGuard, GoblinState } from "../characters/GoblinGuard";
import { GrogTheKing, GrogState } from "../characters/GrogTheKing";
import { SirValor, KnightState } from "../characters/SirValor";
import { SirValorVideo } from "../characters/SirValorVideo";
import { Elara, WizardState } from "../characters/Elara";
import { PrincessElla, PrincessState } from "../characters/PrincessElla";
import { DrakeTheDragon, DragonState } from "../characters/DrakeTheDragon";
import { IceGolem, IceGolemState } from "../characters/IceGolem";
import { ShadowWraith, WraithState } from "../characters/ShadowWraith";
import { StoneGuardian, GuardianState } from "../characters/StoneGuardian";
import { CaveTroll, CaveTrollState } from "../characters/CaveTroll";
import { CrystalSpider, CrystalSpiderState } from "../characters/CrystalSpider";
import { StormHarpy, StormHarpyState } from "../characters/StormHarpy";
import { CloudGiant, CloudGiantState } from "../characters/CloudGiant";
import { WindLord, WindLordState } from "../characters/WindLord";
import { InkKraken, InkKrakenState } from "../characters/InkKraken";
import { ReefGuardian, ReefGuardianState } from "../characters/ReefGuardian";
import { Leviathan, LeviathanState } from "../characters/Leviathan";
import { VoidPhantom, VoidPhantomState } from "../characters/VoidPhantom";
import { RealityShifter, RealityShifterState } from "../characters/RealityShifter";
import { WordEater, WordEaterState } from "../characters/WordEater";
import { EchoWraith, EchoWraithState } from "../characters/EchoWraith";
import { FireElemental, FireElementalState } from "../characters/FireElemental";
import { LavaHound, LavaHoundState } from "../characters/LavaHound";
import { EmberDrake, EmberDrakeState } from "../characters/EmberDrake";
import { CrystalKnight, CrystalKnightState } from "../characters/CrystalKnight";
import { PrismMage, PrismMageState } from "../characters/PrismMage";
import { CrystalQueen, CrystalQueenState } from "../characters/CrystalQueen";
import { StarSprite, StarSpriteState } from "../characters/StarSprite";
import { CometWolf, CometWolfState } from "../characters/CometWolf";
import { NovaTitan, NovaTitanState } from "../characters/NovaTitan";
import { TomeGolem, TomeGolemState } from "../characters/TomeGolem";
import { PageWraith, PageWraithState } from "../characters/PageWraith";
import { TheLibrarian, TheLibrarianState } from "../characters/TheLibrarian";
import { AgentX, AgentXState } from "../characters/AgentX";
import { Cipher, CipherState } from "../characters/Cipher";
import { Shadow, ShadowState } from "../characters/Shadow";
import { StreetThug, StreetThugState } from "../characters/StreetThug";
import { HiredGun, HiredGunState } from "../characters/HiredGun";
import { CyberHacker, CyberHackerState } from "../characters/CyberHacker";
import { TheBroker, TheBrokerState } from "../characters/TheBroker";
import { TheDirector, TheDirectorState } from "../characters/TheDirector";
import { DroneSentry, DroneSentryState } from "../characters/DroneSentry";
import { RogueAgent, RogueAgentState } from "../characters/RogueAgent";
import { Bodyguard, BodyguardState } from "../characters/Bodyguard";
import { TheArchitect, TheArchitectState } from "../characters/TheArchitect";
import { Operative, OperativeState } from "../characters/Operative";
import { Enforcer, EnforcerState } from "../characters/Enforcer";
import { TheDoubleAgent, TheDoubleAgentState } from "../characters/TheDoubleAgent";
import { TheWarden, TheWardenState } from "../characters/TheWarden";
import { TheCommander, TheCommanderState } from "../characters/TheCommander";
import { ThePhantom, ThePhantomState } from "../characters/ThePhantom";
import { TheOverseer, TheOverseerState } from "../characters/TheOverseer";
import { VaultSentinel, VaultSentinelState } from "../characters/VaultSentinel";
import { VaultDrone, VaultDroneState } from "../characters/VaultDrone";
import { TheVaultKeeper, TheVaultKeeperState } from "../characters/TheVaultKeeper";
import { ShadowOperative, ShadowOperativeState } from "../characters/ShadowOperative";
import { ShadowDrone, ShadowDroneState } from "../characters/ShadowDrone";
import { TheShadowBroker, TheShadowBrokerState } from "../characters/TheShadowBroker";
import { FrostTrooper, FrostTrooperState } from "../characters/FrostTrooper";
import { IceDrone, IceDroneState } from "../characters/IceDrone";
import { TheFrostbite, TheFrostbiteState } from "../characters/TheFrostbite";
import { MazeRunner, MazeRunnerState } from "../characters/MazeRunner";
import { TunnelRat, TunnelRatState } from "../characters/TunnelRat";
import { TheMinotaur, TheMinotaurState } from "../characters/TheMinotaur";
import { LabGuard, LabGuardState } from "../characters/LabGuard";
import { BioDrone, BioDroneState } from "../characters/BioDrone";
import { TheCatalyst, TheCatalystState } from "../characters/TheCatalyst";
import { OmegaSoldier, OmegaSoldierState } from "../characters/OmegaSoldier";
import { OmegaElite, OmegaEliteState } from "../characters/OmegaElite";
import { TheOmega, TheOmegaState } from "../characters/TheOmega";
import { getStoredTheme } from "@/lib/gameTheme";

interface RPGCharacterProps {
  character: RPGCharacterType | RPGEnemy;
  currentHp: number;
  isEnemy?: boolean;
  isAttacking?: boolean;
  isTakingDamage?: boolean;
  damageNumber?: number;
  showDamage?: boolean;
  isDefending?: boolean;
  showSprite?: boolean;
  usePremiumSprites?: boolean;
  currentStreak?: number;
  showHealthBar?: boolean;
  skinVariant?: string;
}

// Map character/enemy types to sprite types - EXTENDED with all new enemies
type SpriteType = 'knight' | 'wizard' | 'princess' | 'goblin' | 'boss' | 'sorcerer' | 'dragon' | 'ice_golem' | 'shadow_wraith' | 'stone_guardian' | 'grog_king' | 'cave_troll' | 'crystal_spider' | 'storm_harpy' | 'cloud_giant' | 'wind_lord' | 'ink_kraken' | 'reef_guardian' | 'leviathan' | 'void_phantom' | 'reality_shifter' | 'word_eater' | 'echo_wraith' | 'agent_x' | 'cipher' | 'shadow_agent' | 'street_thug_agent' | 'hired_gun_agent' | 'cyber_hacker_agent' | 'the_broker_agent' | 'the_director_agent' | 'drone_sentry_agent' | 'rogue_agent_agent' | 'bodyguard_agent' | 'the_architect_agent' | 'operative_agent' | 'enforcer_agent' | 'the_double_agent_agent' | 'the_warden_agent' | 'the_commander_agent' | 'the_phantom_agent' | 'the_overseer_agent' | 'fire_elemental' | 'lava_hound' | 'ember_drake' | 'crystal_knight' | 'prism_mage' | 'crystal_queen' | 'star_sprite' | 'comet_wolf' | 'nova_titan' | 'tome_golem' | 'page_wraith' | 'the_librarian' | 'vault_sentinel_agent' | 'vault_drone_agent' | 'the_vault_keeper_agent' | 'shadow_operative_agent' | 'shadow_drone_agent' | 'the_shadow_broker_agent' | 'frost_trooper_agent' | 'ice_drone_agent' | 'the_frostbite_agent' | 'maze_runner_agent' | 'tunnel_rat_agent' | 'the_minotaur_agent' | 'lab_guard_agent' | 'bio_drone_agent' | 'the_catalyst_agent' | 'omega_soldier_agent' | 'omega_elite_agent' | 'the_omega_agent';

const getSpriteType = (character: RPGCharacterType | RPGEnemy, isEnemy: boolean): SpriteType => {
  if (isEnemy) {
    const enemy = character as RPGEnemy;
    // Map by enemy ID first (most specific)
    const idMap: Record<string, SpriteType> = {
      'grog': 'grog_king',
      'cave_troll': 'cave_troll',
      'crystal_spider': 'crystal_spider',
      'storm_harpy': 'storm_harpy',
      'cloud_giant': 'cloud_giant',
      'zephyr': 'wind_lord',
      'ink_kraken': 'ink_kraken',
      'reef_guardian': 'reef_guardian',
      'leviathan': 'leviathan',
      'void_phantom': 'void_phantom',
      'reality_shifter': 'reality_shifter',
      'word_eater': 'word_eater',
      'echo_wraith': 'echo_wraith',
      'fire_elemental': 'fire_elemental',
      'lava_hound': 'lava_hound',
      'ember_drake': 'ember_drake',
      'crystal_knight': 'crystal_knight',
      'prism_mage': 'prism_mage',
      'crystal_queen': 'crystal_queen',
      'star_sprite': 'star_sprite',
      'comet_wolf': 'comet_wolf',
      'nova_titan': 'nova_titan',
      'tome_golem': 'tome_golem',
      'page_wraith': 'page_wraith',
      'the_librarian': 'the_librarian',
      // Agent mode enemies - unique agent sprites
      'street_thug': 'street_thug_agent',
      'hired_gun': 'hired_gun_agent',
      'cyber_hacker': 'cyber_hacker_agent',
      'drone_sentry': 'drone_sentry_agent',
      'rogue_agent': 'rogue_agent_agent',
      'bodyguard': 'bodyguard_agent',
      'operative': 'operative_agent',
      'enforcer': 'enforcer_agent',
      'the_broker': 'the_broker_agent',
      'the_architect': 'the_architect_agent',
      'the_double_agent': 'the_double_agent_agent',
      'the_director': 'the_director_agent',
      'the_warden': 'the_warden_agent',
      'the_commander': 'the_commander_agent',
      'the_phantom': 'the_phantom_agent',
      'the_overseer': 'the_overseer_agent',
      'vault_sentinel': 'vault_sentinel_agent',
      'vault_drone': 'vault_drone_agent',
      'the_vault_keeper': 'the_vault_keeper_agent',
      'shadow_operative': 'shadow_operative_agent',
      'shadow_drone': 'shadow_drone_agent',
      'the_shadow_broker': 'the_shadow_broker_agent',
      'frost_trooper': 'frost_trooper_agent',
      'ice_drone': 'ice_drone_agent',
      'the_frostbite': 'the_frostbite_agent',
      'maze_runner': 'maze_runner_agent',
      'tunnel_rat': 'tunnel_rat_agent',
      'the_minotaur': 'the_minotaur_agent',
      'lab_guard': 'lab_guard_agent',
      'bio_drone': 'bio_drone_agent',
      'the_catalyst': 'the_catalyst_agent',
      'omega_soldier': 'omega_soldier_agent',
      'omega_elite': 'omega_elite_agent',
      'the_omega': 'the_omega_agent',
    };
    if (idMap[enemy.id]) return idMap[enemy.id];
    
    // Then by type - match to closest sprite
    const typeStr = enemy.type as string;
    if (typeStr.includes('dragon')) return 'dragon';
    if (typeStr.includes('golem')) return 'ice_golem';
    if (typeStr.includes('wraith')) return 'shadow_wraith';
    if (typeStr.includes('guardian')) return 'stone_guardian';
    if (typeStr.includes('troll')) return 'cave_troll';
    if (typeStr.includes('spider')) return 'crystal_spider';
    if (typeStr.includes('harpy')) return 'storm_harpy';
    if (typeStr.includes('giant')) return 'cloud_giant';
    if (typeStr.includes('kraken')) return 'ink_kraken';
    if (typeStr.includes('leviathan')) return 'leviathan';
    if (typeStr.includes('phantom')) return 'void_phantom';
    if (typeStr.includes('shifter')) return 'reality_shifter';
    if (typeStr.includes('eater')) return 'word_eater';
    if (typeStr === 'final_boss') return 'word_eater';
    if (typeStr === 'boss') return 'grog_king';
    return 'goblin';
  }
  // Check by character ID for heroes
  const hero = character as RPGCharacterType;
  const theme = getStoredTheme();
  if (theme === 'agent') {
    if (hero.id === 'knight') return 'agent_x';
    if (hero.id === 'wizard') return 'cipher';
    if (hero.id === 'ella') return 'shadow_agent';
  }
  if (hero.id === 'wizard') return 'wizard';
  if (hero.id === 'ella') return 'princess';
  return 'knight';
};

// Get Grog state
const getGrogState = (isAttacking: boolean, isTakingDamage: boolean, currentHp: number, maxHp: number): GrogState => {
  if (currentHp <= 0) return 'defeated';
  if (isTakingDamage) return 'hit';
  if (isAttacking) return 'ground_slam'; // Grog's signature attack
  return 'idle';
};

// Get state for premium characters
const getGoblinState = (isAttacking: boolean, isTakingDamage: boolean, currentHp: number, maxHp: number): GoblinState => {
  if (currentHp <= 0) return 'defeated';
  if (isTakingDamage) return 'hit';
  if (isAttacking) return 'attacking';
  return 'idle';
};

const getKnightState = (isAttacking: boolean, isTakingDamage: boolean, isDefending: boolean, currentHp: number, maxHp: number): KnightState => {
  if (currentHp <= 0) return 'defeated';
  if (isTakingDamage) return 'hit';
  if (isDefending) return 'blocking';
  if (isAttacking) return 'attacking';
  return 'idle';
};

const getWizardState = (isAttacking: boolean, isTakingDamage: boolean, currentHp: number, maxHp: number): WizardState => {
  if (currentHp <= 0) return 'defeated';
  if (isTakingDamage) return 'hit';
  if (isAttacking) return 'casting';
  return 'idle';
};

const getPrincessState = (isAttacking: boolean, isTakingDamage: boolean, isDefending: boolean, currentHp: number, maxHp: number): PrincessState => {
  if (currentHp <= 0) return 'defeated';
  if (isTakingDamage) return 'hit';
  if (isDefending) return 'casting'; // Use casting for defend stance
  if (isAttacking) return 'attacking';
  return 'idle';
};

export const RPGCharacter = ({
  character,
  currentHp,
  isEnemy = false,
  isAttacking = false,
  isTakingDamage = false,
  damageNumber = 0,
  showDamage = false,
  isDefending = false,
  showSprite = true,
  usePremiumSprites = true,
  currentStreak = 0,
  showHealthBar = true,
  skinVariant,
}: RPGCharacterProps) => {
  const hpPercentage = (currentHp / character.maxHp) * 100;
  const hpColor = hpPercentage > 50 ? 'from-emerald-400 to-green-500' : 
                  hpPercentage > 25 ? 'from-yellow-400 to-amber-500' : 
                  'from-red-400 to-rose-500';

  const spriteType = getSpriteType(character, isEnemy);

  // Skin variant color overrides via CSS filter — ONLY for hero sprites that don't
  // have their own real palette swap (Agent X / Cipher / Shadow). Classic heroes
  // (Sir Valor / Elara / Princess Ella) get their proper colors from skinVariant prop.
  const skinColorStyle = useMemo(() => {
    if (!skinVariant || isEnemy) return {};
    const heroHasPalette = spriteType === 'knight' || spriteType === 'wizard' || spriteType === 'princess';
    if (heroHasPalette) return {};
    const skinStyles: Record<string, React.CSSProperties> = {
      golden: { filter: 'sepia(0.6) saturate(2) hue-rotate(-10deg) brightness(1.2)' },
      shadow: { filter: 'brightness(0.6) contrast(1.3) saturate(0.8)' },
      stealth: { filter: 'brightness(0.55) saturate(0.3) contrast(1.3)' },
      arctic: { filter: 'saturate(0.4) brightness(1.25) hue-rotate(180deg)' },
      desert: { filter: 'sepia(0.7) saturate(1.4) hue-rotate(-20deg) brightness(1.1)' },
      nightfall: { filter: 'brightness(0.65) saturate(1.4) hue-rotate(220deg)' },
      holo: { filter: 'saturate(1.8) brightness(1.25) hue-rotate(40deg)' },
      neon: { filter: 'saturate(2.2) brightness(1.3) contrast(1.15) hue-rotate(280deg)' },
      chrome: { filter: 'saturate(0.2) brightness(1.4) contrast(1.3)' },
      quantum: { filter: 'saturate(1.6) brightness(1.2) hue-rotate(180deg)' },
      cloak: { filter: 'brightness(0.45) saturate(0.4) contrast(1.4)' },
      phantom: { filter: 'opacity(0.85) brightness(1.3) saturate(0.5)' },
      midnight: { filter: 'brightness(0.5) saturate(1.3) hue-rotate(260deg)' },
      urban: { filter: 'saturate(0.6) brightness(0.9) contrast(1.2)' },
    };
    return skinStyles[skinVariant] || {};
  }, [skinVariant, isEnemy, spriteType]);

  // Render premium sprite based on type
  const renderPremiumSprite = () => {
    const commonState = currentHp <= 0 ? 'defeated' : isTakingDamage ? 'hit' : isAttacking ? 'attacking' : 'idle';
    
    if (isEnemy) {
      // GROG THE GOBLIN KING - Special menacing boss sprite
      if (spriteType === 'grog_king') {
        return (
          <GrogTheKing
            state={getGrogState(isAttacking, isTakingDamage, currentHp, character.maxHp)}
            healthPercent={hpPercentage}
            currentHp={currentHp}
            maxHp={character.maxHp}
            size="large"
            showHealthBar={true}
          />
        );
      }
      if (spriteType === 'dragon') {
        return (
          <DrakeTheDragon
            state={commonState as DragonState}
            healthPercent={hpPercentage}
            currentHp={currentHp}
            maxHp={character.maxHp}
            size="medium"
          />
        );
      }
      if (spriteType === 'ice_golem') {
        return (
          <IceGolem
            state={commonState as IceGolemState}
            healthPercent={hpPercentage}
            currentHp={currentHp}
            maxHp={character.maxHp}
            size="medium"
          />
        );
      }
      if (spriteType === 'shadow_wraith') {
        return (
          <ShadowWraith
            state={commonState as WraithState}
            healthPercent={hpPercentage}
            currentHp={currentHp}
            maxHp={character.maxHp}
            size="medium"
          />
        );
      }
      if (spriteType === 'stone_guardian') {
        return (
          <StoneGuardian
            state={commonState as GuardianState}
            healthPercent={hpPercentage}
            currentHp={currentHp}
            maxHp={character.maxHp}
            size="medium"
          />
        );
      }
      if (spriteType === 'cave_troll') {
        return (
          <CaveTroll
            state={commonState as CaveTrollState}
            healthPercent={hpPercentage}
            currentHp={currentHp}
            maxHp={character.maxHp}
            size="medium"
          />
        );
      }
      if (spriteType === 'crystal_spider') {
        return (
          <CrystalSpider
            state={commonState as CrystalSpiderState}
            healthPercent={hpPercentage}
            currentHp={currentHp}
            maxHp={character.maxHp}
            size="medium"
          />
        );
      }
      if (spriteType === 'storm_harpy') {
        return (
          <StormHarpy
            state={commonState as StormHarpyState}
            healthPercent={hpPercentage}
            currentHp={currentHp}
            maxHp={character.maxHp}
            size="medium"
          />
        );
      }
      if (spriteType === 'cloud_giant') {
        return (
          <CloudGiant
            state={commonState as CloudGiantState}
            healthPercent={hpPercentage}
            currentHp={currentHp}
            maxHp={character.maxHp}
            size="medium"
          />
        );
      }
      if (spriteType === 'wind_lord') {
        return (
          <WindLord
            state={commonState as WindLordState}
            healthPercent={hpPercentage}
            currentHp={currentHp}
            maxHp={character.maxHp}
            size="medium"
          />
        );
      }
      if (spriteType === 'ink_kraken') {
        return (
          <InkKraken
            state={commonState as InkKrakenState}
            healthPercent={hpPercentage}
            currentHp={currentHp}
            maxHp={character.maxHp}
            size="medium"
          />
        );
      }
      if (spriteType === 'reef_guardian') {
        return (
          <ReefGuardian
            state={commonState as ReefGuardianState}
            healthPercent={hpPercentage}
            currentHp={currentHp}
            maxHp={character.maxHp}
            size="medium"
          />
        );
      }
      if (spriteType === 'leviathan') {
        return (
          <Leviathan
            state={commonState as LeviathanState}
            healthPercent={hpPercentage}
            currentHp={currentHp}
            maxHp={character.maxHp}
            size="medium"
          />
        );
      }
      if (spriteType === 'void_phantom') {
        return (
          <VoidPhantom
            state={commonState as VoidPhantomState}
            healthPercent={hpPercentage}
            currentHp={currentHp}
            maxHp={character.maxHp}
            size="medium"
          />
        );
      }
      if (spriteType === 'reality_shifter') {
        return (
          <RealityShifter
            state={commonState as RealityShifterState}
            healthPercent={hpPercentage}
            currentHp={currentHp}
            maxHp={character.maxHp}
            size="medium"
          />
        );
      }
      if (spriteType === 'word_eater') {
        return (
          <WordEater
            state={commonState as WordEaterState}
            healthPercent={hpPercentage}
            currentHp={currentHp}
            maxHp={character.maxHp}
            size="medium"
          />
        );
      }
      if (spriteType === 'echo_wraith') {
        return (
          <EchoWraith
            state={commonState as EchoWraithState}
            healthPercent={hpPercentage}
            currentHp={currentHp}
            maxHp={character.maxHp}
            size="medium"
          />
        );
      }
      // World 9-12 enemy sprites
      if (spriteType === 'fire_elemental') {
        return <FireElemental state={commonState as FireElementalState} healthPercent={hpPercentage} currentHp={currentHp} maxHp={character.maxHp} size="medium" />;
      }
      if (spriteType === 'lava_hound') {
        return <LavaHound state={commonState as LavaHoundState} healthPercent={hpPercentage} currentHp={currentHp} maxHp={character.maxHp} size="medium" />;
      }
      if (spriteType === 'ember_drake') {
        return <EmberDrake state={commonState as EmberDrakeState} healthPercent={hpPercentage} currentHp={currentHp} maxHp={character.maxHp} size="large" />;
      }
      if (spriteType === 'crystal_knight') {
        return <CrystalKnight state={commonState as CrystalKnightState} healthPercent={hpPercentage} currentHp={currentHp} maxHp={character.maxHp} size="medium" />;
      }
      if (spriteType === 'prism_mage') {
        return <PrismMage state={commonState as PrismMageState} healthPercent={hpPercentage} currentHp={currentHp} maxHp={character.maxHp} size="medium" />;
      }
      if (spriteType === 'crystal_queen') {
        return <CrystalQueen state={commonState as CrystalQueenState} healthPercent={hpPercentage} currentHp={currentHp} maxHp={character.maxHp} size="large" />;
      }
      if (spriteType === 'star_sprite') {
        return <StarSprite state={commonState as StarSpriteState} healthPercent={hpPercentage} currentHp={currentHp} maxHp={character.maxHp} size="medium" />;
      }
      if (spriteType === 'comet_wolf') {
        return <CometWolf state={commonState as CometWolfState} healthPercent={hpPercentage} currentHp={currentHp} maxHp={character.maxHp} size="medium" />;
      }
      if (spriteType === 'nova_titan') {
        return <NovaTitan state={commonState as NovaTitanState} healthPercent={hpPercentage} currentHp={currentHp} maxHp={character.maxHp} size="large" />;
      }
      if (spriteType === 'tome_golem') {
        return <TomeGolem state={commonState as TomeGolemState} healthPercent={hpPercentage} currentHp={currentHp} maxHp={character.maxHp} size="medium" />;
      }
      if (spriteType === 'page_wraith') {
        return <PageWraith state={commonState as PageWraithState} healthPercent={hpPercentage} currentHp={currentHp} maxHp={character.maxHp} size="medium" />;
      }
      if (spriteType === 'the_librarian') {
        return <TheLibrarian state={commonState as TheLibrarianState} healthPercent={hpPercentage} currentHp={currentHp} maxHp={character.maxHp} size="large" />;
      }
      // Agent mode enemy sprites
      if (spriteType === 'street_thug_agent') {
        return (
          <StreetThug
            state={commonState as StreetThugState}
            healthPercent={hpPercentage}
            currentHp={currentHp}
            maxHp={character.maxHp}
            size="medium"
          />
        );
      }
      if (spriteType === 'hired_gun_agent') {
        return (
          <HiredGun
            state={commonState as HiredGunState}
            healthPercent={hpPercentage}
            currentHp={currentHp}
            maxHp={character.maxHp}
            size="medium"
          />
        );
      }
      if (spriteType === 'cyber_hacker_agent') {
        return (
          <CyberHacker
            state={commonState as CyberHackerState}
            healthPercent={hpPercentage}
            currentHp={currentHp}
            maxHp={character.maxHp}
            size="medium"
          />
        );
      }
      if (spriteType === 'the_broker_agent') {
        return (
          <TheBroker
            state={commonState as TheBrokerState}
            healthPercent={hpPercentage}
            currentHp={currentHp}
            maxHp={character.maxHp}
            size="large"
            showHealthBar={true}
          />
        );
      }
      if (spriteType === 'the_director_agent') {
        return (
          <TheDirector
            state={commonState as TheDirectorState}
            healthPercent={hpPercentage}
            currentHp={currentHp}
            maxHp={character.maxHp}
            size="large"
            showHealthBar={true}
          />
        );
      }
      if (spriteType === 'drone_sentry_agent') {
        return (
          <DroneSentry
            state={commonState as DroneSentryState}
            healthPercent={hpPercentage}
            currentHp={currentHp}
            maxHp={character.maxHp}
            size="medium"
          />
        );
      }
      if (spriteType === 'rogue_agent_agent') {
        return (
          <RogueAgent
            state={commonState as RogueAgentState}
            healthPercent={hpPercentage}
            currentHp={currentHp}
            maxHp={character.maxHp}
            size="medium"
          />
        );
      }
      if (spriteType === 'bodyguard_agent') {
        return (
          <Bodyguard
            state={commonState as BodyguardState}
            healthPercent={hpPercentage}
            currentHp={currentHp}
            maxHp={character.maxHp}
            size="medium"
          />
        );
      }
      if (spriteType === 'the_architect_agent') {
        return (
          <TheArchitect
            state={commonState as TheArchitectState}
            healthPercent={hpPercentage}
            currentHp={currentHp}
            maxHp={character.maxHp}
            size="large"
            showHealthBar={true}
          />
        );
      }
      if (spriteType === 'operative_agent') {
        return (
          <Operative
            state={commonState as OperativeState}
            healthPercent={hpPercentage}
            currentHp={currentHp}
            maxHp={character.maxHp}
            size="medium"
          />
        );
      }
      if (spriteType === 'enforcer_agent') {
        return (
          <Enforcer
            state={commonState as EnforcerState}
            healthPercent={hpPercentage}
            currentHp={currentHp}
            maxHp={character.maxHp}
            size="medium"
          />
        );
      }
      if (spriteType === 'the_double_agent_agent') {
        return (
          <TheDoubleAgent
            state={commonState as TheDoubleAgentState}
            healthPercent={hpPercentage}
            currentHp={currentHp}
            maxHp={character.maxHp}
            size="large"
          />
        );
      }
      if (spriteType === 'the_warden_agent') {
        return (
          <TheWarden
            state={commonState as TheWardenState}
            healthPercent={hpPercentage}
            currentHp={currentHp}
            maxHp={character.maxHp}
            size="large"
          />
        );
      }
      if (spriteType === 'the_commander_agent') {
        return (
          <TheCommander
            state={commonState as TheCommanderState}
            healthPercent={hpPercentage}
            currentHp={currentHp}
            maxHp={character.maxHp}
            size="large"
          />
        );
      }
      if (spriteType === 'the_phantom_agent') {
        return (
          <ThePhantom
            state={commonState as ThePhantomState}
            healthPercent={hpPercentage}
            currentHp={currentHp}
            maxHp={character.maxHp}
            size="large"
          />
        );
      }
      if (spriteType === 'the_overseer_agent') {
        return (
          <TheOverseer
            state={commonState as TheOverseerState}
            healthPercent={hpPercentage}
            currentHp={currentHp}
            maxHp={character.maxHp}
            size="large"
          />
        );
      }
      // Agent Worlds 9-14 enemy sprites
      if (spriteType === 'vault_sentinel_agent') {
        return <VaultSentinel state={commonState as VaultSentinelState} healthPercent={hpPercentage} currentHp={currentHp} maxHp={character.maxHp} size="medium" />;
      }
      if (spriteType === 'vault_drone_agent') {
        return <VaultDrone state={commonState as VaultDroneState} healthPercent={hpPercentage} currentHp={currentHp} maxHp={character.maxHp} size="medium" />;
      }
      if (spriteType === 'the_vault_keeper_agent') {
        return <TheVaultKeeper state={commonState as TheVaultKeeperState} healthPercent={hpPercentage} currentHp={currentHp} maxHp={character.maxHp} size="large" />;
      }
      if (spriteType === 'shadow_operative_agent') {
        return <ShadowOperative state={commonState as ShadowOperativeState} healthPercent={hpPercentage} currentHp={currentHp} maxHp={character.maxHp} size="medium" />;
      }
      if (spriteType === 'shadow_drone_agent') {
        return <ShadowDrone state={commonState as ShadowDroneState} healthPercent={hpPercentage} currentHp={currentHp} maxHp={character.maxHp} size="medium" />;
      }
      if (spriteType === 'the_shadow_broker_agent') {
        return <TheShadowBroker state={commonState as TheShadowBrokerState} healthPercent={hpPercentage} currentHp={currentHp} maxHp={character.maxHp} size="large" />;
      }
      if (spriteType === 'frost_trooper_agent') {
        return <FrostTrooper state={commonState as FrostTrooperState} healthPercent={hpPercentage} currentHp={currentHp} maxHp={character.maxHp} size="medium" />;
      }
      if (spriteType === 'ice_drone_agent') {
        return <IceDrone state={commonState as IceDroneState} healthPercent={hpPercentage} currentHp={currentHp} maxHp={character.maxHp} size="medium" />;
      }
      if (spriteType === 'the_frostbite_agent') {
        return <TheFrostbite state={commonState as TheFrostbiteState} healthPercent={hpPercentage} currentHp={currentHp} maxHp={character.maxHp} size="large" />;
      }
      if (spriteType === 'maze_runner_agent') {
        return <MazeRunner state={commonState as MazeRunnerState} healthPercent={hpPercentage} currentHp={currentHp} maxHp={character.maxHp} size="medium" />;
      }
      if (spriteType === 'tunnel_rat_agent') {
        return <TunnelRat state={commonState as TunnelRatState} healthPercent={hpPercentage} currentHp={currentHp} maxHp={character.maxHp} size="medium" />;
      }
      if (spriteType === 'the_minotaur_agent') {
        return <TheMinotaur state={commonState as TheMinotaurState} healthPercent={hpPercentage} currentHp={currentHp} maxHp={character.maxHp} size="large" />;
      }
      if (spriteType === 'lab_guard_agent') {
        return <LabGuard state={commonState as LabGuardState} healthPercent={hpPercentage} currentHp={currentHp} maxHp={character.maxHp} size="medium" />;
      }
      if (spriteType === 'bio_drone_agent') {
        return <BioDrone state={commonState as BioDroneState} healthPercent={hpPercentage} currentHp={currentHp} maxHp={character.maxHp} size="medium" />;
      }
      if (spriteType === 'the_catalyst_agent') {
        return <TheCatalyst state={commonState as TheCatalystState} healthPercent={hpPercentage} currentHp={currentHp} maxHp={character.maxHp} size="large" />;
      }
      if (spriteType === 'omega_soldier_agent') {
        return <OmegaSoldier state={commonState as OmegaSoldierState} healthPercent={hpPercentage} currentHp={currentHp} maxHp={character.maxHp} size="medium" />;
      }
      if (spriteType === 'omega_elite_agent') {
        return <OmegaElite state={commonState as OmegaEliteState} healthPercent={hpPercentage} currentHp={currentHp} maxHp={character.maxHp} size="medium" />;
      }
      if (spriteType === 'the_omega_agent') {
        return <TheOmega state={commonState as TheOmegaState} healthPercent={hpPercentage} currentHp={currentHp} maxHp={character.maxHp} size="large" />;
      }
      // Goblin types - fallback
      return (
        <GoblinGuard
          state={getGoblinState(isAttacking, isTakingDamage, currentHp, character.maxHp)}
          healthPercent={hpPercentage}
          currentHp={currentHp}
          maxHp={character.maxHp}
          size="medium"
        />
      );
    }
    
    // For heroes — Sir Valor uses video-driven sprites.
    if (spriteType === 'knight') {
      const ks = getKnightState(isAttacking, isTakingDamage, isDefending, currentHp, character.maxHp);
      const valorMood: 'idle' | 'attack' | 'hit' =
        ks === 'attacking' ? 'attack' : ks === 'hit' ? 'hit' : 'idle';
      return (
        <SirValorVideo mood={valorMood} size={220} variant={(skinVariant as string) || 'default'} />
      );
    }
    
    if (spriteType === 'wizard') {
      return (
        <Elara
          state={getWizardState(isAttacking, isTakingDamage, currentHp, character.maxHp)}
          healthPercent={hpPercentage}
          currentHp={currentHp}
          maxHp={character.maxHp}
          size="medium"
          showHealthBar={showHealthBar}
          skinVariant={skinVariant as any}
        />
      );
    }
    
    if (spriteType === 'princess') {
      return (
        <PrincessElla
          state={getPrincessState(isAttacking, isTakingDamage, isDefending, currentHp, character.maxHp)}
          healthPercent={hpPercentage}
          currentHp={currentHp}
          maxHp={character.maxHp}
          size="medium"
          showHealthBar={showHealthBar}
          skinVariant={skinVariant as any}
        />
      );
    }

    // Agent heroes
    if (spriteType === 'agent_x') {
      const agentState: AgentXState = currentHp <= 0 ? 'defeated' : isTakingDamage ? 'hit' : isDefending ? 'blocking' : isAttacking ? 'attacking' : 'idle';
      return (
        <AgentX
          state={agentState}
          healthPercent={hpPercentage}
          currentHp={currentHp}
          maxHp={character.maxHp}
          size="medium"
          currentStreak={currentStreak}
          showHealthBar={showHealthBar}
        />
      );
    }

    if (spriteType === 'cipher') {
      const cipherState: CipherState = currentHp <= 0 ? 'defeated' : isTakingDamage ? 'hit' : isAttacking ? 'casting' : 'idle';
      return (
        <Cipher
          state={cipherState}
          healthPercent={hpPercentage}
          currentHp={currentHp}
          maxHp={character.maxHp}
          size="medium"
          showHealthBar={showHealthBar}
        />
      );
    }

    if (spriteType === 'shadow_agent') {
      const shadowState: ShadowState = currentHp <= 0 ? 'defeated' : isTakingDamage ? 'hit' : isAttacking ? 'attacking' : 'idle';
      return (
        <Shadow
          state={shadowState}
          healthPercent={hpPercentage}
          currentHp={currentHp}
          maxHp={character.maxHp}
          size="medium"
          showHealthBar={showHealthBar}
        />
      );
    }

    // Fallback - use knight for any unhandled hero types
    const fallbackType = spriteType as 'knight' | 'wizard' | 'goblin' | 'boss' | 'sorcerer' | 'dragon' | 'ice_golem' | 'shadow_wraith' | 'stone_guardian';
    return (
      <RPGCharacterSprite
        type={fallbackType}
        isEnemy={isEnemy}
        isAttacking={isAttacking}
        isTakingDamage={isTakingDamage}
        isDefending={isDefending}
        size="lg"
      />
    );
  };

  return (
    <div className={`relative flex flex-col items-center ${isEnemy ? '' : ''}`}>
      {/* Damage Number - Floats up (only for non-premium or when premium doesn't handle it) */}
      {!usePremiumSprites && (
        <AnimatePresence>
          {showDamage && damageNumber > 0 && (
            <motion.div
              initial={{ opacity: 1, y: 0, scale: 1.5 }}
              animate={{ opacity: 0, y: -80, scale: 2 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              className="absolute -top-4 z-30 pointer-events-none"
            >
              <span 
                className="text-3xl md:text-4xl font-black text-red-500"
                style={{ 
                  textShadow: '2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000',
                  WebkitTextStroke: '1px black',
                }}
              >
                -{damageNumber}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Critical Hit Effect */}
      <AnimatePresence>
        {showDamage && damageNumber >= 20 && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute -top-8 z-30 text-yellow-400 font-black text-sm"
          >
            ⚡ CRITICAL! ⚡
          </motion.div>
        )}
      </AnimatePresence>

      {/* Name Plate */}
      <motion.div 
        className="mb-2 text-center"
        animate={isTakingDamage ? { x: [-3, 3, -3, 3, 0] } : {}}
        transition={{ duration: 0.3 }}
      >
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg
          bg-gradient-to-r ${character.color} shadow-lg`}>
          <span className="font-bold text-sm text-white tracking-wide drop-shadow-md">
            {character.name}
          </span>
          {isDefending && <Shield className="h-3 w-3 text-blue-200" />}
        </div>
        
        {'title' in character && character.title && (
          <p className="text-xs text-slate-400 mt-0.5">{character.title}</p>
        )}

        {/* HP Bar - Only show if not using premium sprites (they have built-in HP bars) */}
        {!usePremiumSprites && (
          <div className="mt-2 flex items-center gap-2">
            <Heart className="h-3 w-3 text-red-400" />
            <div className="relative w-28 h-3 bg-slate-800/80 rounded-full overflow-hidden border border-slate-700">
              <motion.div
                className={`absolute inset-y-0 left-0 bg-gradient-to-r ${hpColor} rounded-full`}
                initial={{ width: '100%' }}
                animate={{ width: `${hpPercentage}%` }}
                transition={{ type: 'spring', stiffness: 100, damping: 15 }}
              />
              {/* Shine */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/25 to-transparent h-1/2 rounded-full" />
            </div>
            <span className="text-xs font-mono text-slate-300 w-14 text-right">
              {currentHp}/{character.maxHp}
            </span>
          </div>
        )}
      </motion.div>

      {/* Character Sprite — with optional skin color override */}
      {showSprite && (
        <div style={skinColorStyle}>
          {usePremiumSprites ? renderPremiumSprite() : (
            <RPGCharacterSprite
              type={(['princess', 'agent_x', 'cipher', 'shadow_agent'].includes(spriteType)) ? 'knight' : spriteType as 'knight' | 'wizard' | 'goblin' | 'boss' | 'sorcerer' | 'dragon' | 'ice_golem' | 'shadow_wraith' | 'stone_guardian'}
              isEnemy={isEnemy}
              isAttacking={isAttacking}
              isTakingDamage={isTakingDamage}
              isDefending={isDefending}
              size="lg"
            />
          )}
        </div>
      )}

      {/* Magical particles for boss enemies */}
      {isEnemy && (character as RPGEnemy).type === 'final_boss' && showSprite && !usePremiumSprites && (
        <div className="absolute top-20 inset-x-0 overflow-hidden pointer-events-none">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-purple-400 rounded-full"
              style={{
                left: `${20 + i * 15}%`,
                bottom: '10%',
              }}
              animate={{
                y: [0, -60, 0],
                opacity: [0, 1, 0],
                scale: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2,
                delay: i * 0.3,
                repeat: Infinity,
                ease: "easeOut",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};
