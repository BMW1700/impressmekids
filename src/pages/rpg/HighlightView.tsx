import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Trophy, Zap, Timer, Shield, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

interface Highlight {
  enemy_name: string | null;
  world_number: number | null;
  damage_dealt: number;
  turns_taken: number;
  perfect_blocks: number;
  created_at: string;
}

/**
 * Public share page for RPG Battle Highlights.
 * Uses rpg_get_highlight_by_slug (SECURITY DEFINER) so no auth is required.
 */
const HighlightView = () => {
  const { slug } = useParams<{ slug: string }>();
  const [card, setCard] = useState<Highlight | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data, error } = await supabase.rpc('rpg_get_highlight_by_slug', { _slug: slug });
      if (error) console.error(error);
      const row = Array.isArray(data) ? data[0] : data;
      if (!row) setNotFound(true);
      else setCard(row as Highlight);
      setLoading(false);
    })();
  }, [slug]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-amber-950 to-slate-950 flex flex-col items-center justify-center p-4">
      <Link to="/" className="absolute top-4 left-4">
        <Button variant="ghost" size="sm" className="text-white/70 hover:text-white">
          <ArrowLeft className="h-4 w-4 mr-1" /> YubiLearn
        </Button>
      </Link>

      {loading ? (
        <div className="text-white/60">Loading highlight…</div>
      ) : notFound || !card ? (
        <div className="text-center text-white/80 max-w-sm">
          <Trophy className="h-16 w-16 text-amber-400/40 mx-auto mb-4" />
          <div className="text-xl font-bold mb-2">Highlight not found</div>
          <div className="text-sm text-white/50">This link may have expired or been removed.</div>
        </div>
      ) : (
        <div className="w-full max-w-md rounded-2xl border-2 border-amber-400/60 bg-gradient-to-br from-amber-950 via-orange-950 to-slate-950 p-8 shadow-2xl"
             style={{ boxShadow: '0 0 60px rgba(251,191,36,0.4)' }}>
          <div className="text-center mb-6">
            <Trophy className="h-20 w-20 text-amber-400 mx-auto drop-shadow-[0_0_20px_rgba(251,191,36,0.7)]" />
            <div className="text-xs font-black text-amber-300 tracking-[0.3em] uppercase mt-2">
              Battle Highlight
            </div>
            <h1 className="text-3xl font-black text-white mt-2">
              {card.enemy_name ?? 'Boss'} DEFEATED
            </h1>
            {card.world_number != null && (
              <div className="text-sm text-amber-200/70 mt-1">World {card.world_number}</div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3 mb-6">
            <Stat icon={<Zap className="h-5 w-5 text-orange-400" />} label="Damage" value={card.damage_dealt} />
            <Stat icon={<Timer className="h-5 w-5 text-cyan-400" />} label="Turns" value={card.turns_taken} />
            <Stat icon={<Shield className="h-5 w-5 text-blue-400" />} label="Blocks" value={card.perfect_blocks} />
          </div>

          <Link to="/game">
            <Button className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold">
              Play YubiLearn RPG
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
};

const Stat = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) => (
  <div className="rounded-lg border border-amber-500/20 bg-black/40 p-3 text-center">
    <div className="flex justify-center mb-1">{icon}</div>
    <div className="text-2xl font-black text-white">{value}</div>
    <div className="text-[10px] uppercase tracking-wider text-slate-400">{label}</div>
  </div>
);

export default HighlightView;
