// TEMPORARY diagnostic route — mounts RPGBattleArena directly so runtime crashes
// surface without needing an authenticated student session.
import { RPGBattleArena } from '@/components/aura/game/rpg/RPGBattleArena';
import { curatedStories } from '@/data/curatedStories';

export default function DevRPGSmoke() {
  const story = curatedStories[0];
  return (
    <RPGBattleArena
      story={story}
      enemyType="minion"
      studentId="00000000-0000-0000-0000-000000000000"
      battleMode="classic"
      worldNumber={1}
      gradeMode="k5"
      onBack={() => {}}
      onComplete={() => {}}
    />
  );
}
