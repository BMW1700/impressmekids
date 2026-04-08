import { curatedStories } from '@/data/curatedStories';

const gradeMap: Record<number, number[]> = {};
curatedStories.forEach((s, i) => {
  const g = s.grade_level;
  if (!gradeMap[g]) gradeMap[g] = [];
  gradeMap[g].push(i);
});

for (const [grade, indices] of Object.entries(gradeMap).sort((a,b) => Number(a[0]) - Number(b[0]))) {
  console.log(`Grade ${grade} (${indices.length} stories): [${indices.join(', ')}]`);
}
