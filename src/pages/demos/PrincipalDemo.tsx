import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

// Seeded 6-week growth data for a demo Kindergarten classroom.
const growthData = [
  { week: 'Wk 1', wcpm: 12, decoding: 42, comprehension: 38 },
  { week: 'Wk 2', wcpm: 15, decoding: 48, comprehension: 41 },
  { week: 'Wk 3', wcpm: 19, decoding: 55, comprehension: 46 },
  { week: 'Wk 4', wcpm: 24, decoding: 62, comprehension: 52 },
  { week: 'Wk 5', wcpm: 29, decoding: 69, comprehension: 58 },
  { week: 'Wk 6', wcpm: 34, decoding: 76, comprehension: 64 },
];

const tierGroups = [
  {
    tier: 'Tier 1',
    count: 12,
    color: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
    note: 'On grade level. Continue Tier-1 core instruction.',
  },
  {
    tier: 'Tier 2',
    count: 4,
    color: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
    note: 'Small-group intervention 3×/week. Focus: CVC blending, digraphs.',
  },
  {
    tier: 'Tier 3',
    count: 2,
    color: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
    note: '1:1 intervention. Refer for full literacy screening.',
  },
];

const roster = [
  { name: 'Amelia R.', level: 'Approaching', wcpm: 41, growth: '+22', tier: 'Tier 1' },
  { name: 'Benji K.', level: 'On Level', wcpm: 48, growth: '+27', tier: 'Tier 1' },
  { name: 'Carla M.', level: 'Below', wcpm: 18, growth: '+8', tier: 'Tier 2' },
  { name: 'Daniel P.', level: 'On Level', wcpm: 44, growth: '+19', tier: 'Tier 1' },
  { name: 'Elena V.', level: 'Well Below', wcpm: 10, growth: '+4', tier: 'Tier 3' },
  { name: 'Faisal T.', level: 'Approaching', wcpm: 36, growth: '+21', tier: 'Tier 1' },
];

export default function PrincipalDemo() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-sm font-medium text-primary">Principal Demo — Ms. Rivera's Kindergarten</div>
            <h1 className="mt-2 text-3xl font-bold">Six weeks of growth, one screen.</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Seeded demo data — 18 students, 6 weeks of practice, printable teacher reports. Every metric
              maps to CCSS Foundational Reading standards.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to="/curriculum-alignment">See curriculum alignment</Link>
            </Button>
            <Button asChild>
              <Link to="/pilot-packet">Pilot packet</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {tierGroups.map((g) => (
            <Card key={g.tier}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{g.tier}</span>
                  <Badge className={g.color}>{g.count} students</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{g.note}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Class growth over 6 weeks</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="wcpm" stroke="#3b82f6" strokeWidth={2} name="WCPM" />
                <Line type="monotone" dataKey="decoding" stroke="#10b981" strokeWidth={2} name="Decoding %" />
                <Line type="monotone" dataKey="comprehension" stroke="#f59e0b" strokeWidth={2} name="Comprehension %" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Sample roster snapshot</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 pr-4">Student</th>
                  <th className="py-2 pr-4">Benchmark</th>
                  <th className="py-2 pr-4">WCPM</th>
                  <th className="py-2 pr-4">6-wk growth</th>
                  <th className="py-2">Tier</th>
                </tr>
              </thead>
              <tbody>
                {roster.map((r) => (
                  <tr key={r.name} className="border-b">
                    <td className="py-2 pr-4 font-medium">{r.name}</td>
                    <td className="py-2 pr-4">{r.level}</td>
                    <td className="py-2 pr-4">{r.wcpm}</td>
                    <td className="py-2 pr-4 text-emerald-600 dark:text-emerald-400">{r.growth}</td>
                    <td className="py-2">{r.tier}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-4 text-xs text-muted-foreground">
              Demo data only. Live classrooms show real WCPM (words correct per minute), NAEP prosody,
              and DIBELS-comparable metrics — plus printable Day-30 and Day-60 pilot reports.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
