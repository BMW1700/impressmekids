import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Coins, Lock, Sparkles, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  useVillageZones,
  useVillageItems,
  usePlayerVillageState,
  usePurchaseVillageItem,
  usePlaceVillageItem,
  type VillageItem,
} from "@/hooks/useVillage";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BennyStanding } from "@/components/aura/game/rpg/BennyStanding";
import prekBedroomBg from "@/assets/prek-bedroom-bg.png.asset.json";

const SLOTS_PER_ZONE = 6;

export default function NabuVillage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: zones = [] } = useVillageZones();
  const { data: items = [] } = useVillageItems();
  const { data: state } = usePlayerVillageState(user?.id);
  const purchase = usePurchaseVillageItem(user?.id);
  const place = usePlaceVillageItem(user?.id);

  const [activeZoneId, setActiveZoneId] = useState<string | null>(null);
  const [shopOpen, setShopOpen] = useState(false);
  const [slotPicker, setSlotPicker] = useState<string | null>(null);

  const sortedZones = useMemo(
    () => [...zones].sort((a, b) => a.sort_order - b.sort_order),
    [zones],
  );

  const currentZone = activeZoneId
    ? sortedZones.find((z) => z.id === activeZoneId)
    : sortedZones[0];

  const unlockedZoneIds = state?.unlocked_zone_ids ?? [];
  const ownedItemIds = state?.owned_item_ids ?? [];
  const placedItems = state?.placed_items ?? {};
  const tokens = state?.tokens ?? 0;

  const itemsForZone = useMemo(
    () => items.filter((i) => i.zone_id === currentZone?.id),
    [items, currentZone],
  );

  const ownedItemsInZone = itemsForZone.filter((i) => ownedItemIds.includes(i.id));

  const rarityRing: Record<string, string> = {
    common: "ring-slate-400/50",
    uncommon: "ring-emerald-400/70",
    rare: "ring-amber-400/80",
  };

  const handlePurchase = (item: VillageItem) => {
    purchase.mutate({
      item,
      currentTokens: tokens,
      currentGold: 9999, // gold gate disabled in v1
      ownedIds: ownedItemIds,
    });
  };

  const handlePlace = (slotId: string, itemId: string | null) => {
    place.mutate({ slotId, itemId, currentPlaced: placedItems });
    setSlotPicker(null);
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950 text-white">
      {/* Background */}
      <img
        src={prekBedroomBg.url}
        alt=""
        aria-hidden
        className="fixed inset-0 w-screen h-screen object-cover object-center pointer-events-none select-none z-0"
      />
      <div className="fixed inset-0 bg-slate-950/55 pointer-events-none z-0" aria-hidden />

      {/* Benny */}
      <div className="hidden lg:block fixed left-[-160px] bottom-[-200px] z-[1] pointer-events-none">
        <BennyStanding size={680} />
      </div>

      {/* Header bar */}
      <header className="relative z-10 flex items-center justify-between px-4 py-3 sm:px-6">
        <Button
          variant="ghost"
          className="text-white hover:bg-white/10"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-full bg-amber-500/20 border border-amber-300/40 px-3 py-1.5">
            <Sparkles className="h-4 w-4 text-amber-300" />
            <span className="font-bold text-amber-100">{tokens}</span>
            <span className="text-xs text-amber-200/80">Village Tokens</span>
          </div>
          <Button
            onClick={() => setShopOpen(true)}
            className="bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            <Coins className="h-4 w-4 mr-2" /> Shop
          </Button>
        </div>
      </header>

      <main className="relative z-10 px-4 sm:px-6 pb-12 lg:pl-[280px]">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Benny's Village
          </h1>
          <p className="text-white/70 mt-1 mb-6">
            Read levels to earn Village Tokens and unlock new zones & decorations.
          </p>

          {/* Zone tabs */}
          <div className="flex flex-wrap gap-2 mb-5">
            {sortedZones.map((z) => {
              const unlocked = unlockedZoneIds.includes(z.id);
              const active = currentZone?.id === z.id;
              return (
                <button
                  key={z.id}
                  onClick={() => setActiveZoneId(z.id)}
                  className={`px-4 py-2 rounded-full border text-sm font-semibold transition ${
                    active
                      ? "bg-white text-slate-900 border-white"
                      : "bg-white/10 border-white/20 text-white hover:bg-white/20"
                  }`}
                >
                  {!unlocked && <Lock className="inline h-3 w-3 mr-1 -mt-0.5" />}
                  {z.name}
                </button>
              );
            })}
          </div>

          {/* Active zone */}
          {currentZone && (
            <div className="rounded-3xl bg-slate-900/60 backdrop-blur-md border border-white/10 p-5 sm:p-6 shadow-2xl">
              <div className="flex items-baseline justify-between mb-3">
                <div>
                  <h2 className="text-2xl font-bold">{currentZone.name}</h2>
                  {currentZone.description && (
                    <p className="text-sm text-white/60">{currentZone.description}</p>
                  )}
                </div>
                {!unlockedZoneIds.includes(currentZone.id) && (
                  <Badge variant="outline" className="border-amber-400/60 text-amber-200">
                    <Lock className="h-3 w-3 mr-1" /> Locked
                  </Badge>
                )}
              </div>

              {!unlockedZoneIds.includes(currentZone.id) ? (
                <div className="text-center py-12 text-white/70">
                  <Lock className="h-10 w-10 mx-auto mb-3 opacity-60" />
                  <p className="font-semibold">Keep reading to unlock!</p>
                  <p className="text-sm mt-1">
                    Complete more Pre-K levels to open up this zone.
                  </p>
                  <Button
                    className="mt-4"
                    onClick={() => navigate("/game/play?tab=rpg")}
                  >
                    Go read a level
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Array.from({ length: SLOTS_PER_ZONE }).map((_, idx) => {
                    const slotId = `${currentZone.slug}:${idx}`;
                    const placedItemId = placedItems[slotId];
                    const placedItem = items.find((i) => i.id === placedItemId);
                    return (
                      <button
                        key={slotId}
                        onClick={() => setSlotPicker(slotId)}
                        className={`aspect-square rounded-2xl border-2 border-dashed transition flex items-center justify-center text-center p-2 ${
                          placedItem
                            ? `border-white/30 bg-white/10 ring-2 ${rarityRing[placedItem.rarity] ?? ""}`
                            : "border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/40"
                        }`}
                      >
                        {placedItem ? (
                          <div>
                            {placedItem.image_url ? (
                              <img
                                src={placedItem.image_url}
                                alt={placedItem.name}
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <div className="text-3xl">🎁</div>
                            )}
                            <div className="text-xs font-semibold mt-1">
                              {placedItem.name}
                            </div>
                          </div>
                        ) : (
                          <span className="text-white/50 text-xs">+ Place item</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {ownedItemsInZone.length > 0 && unlockedZoneIds.includes(currentZone.id) && (
                <p className="text-xs text-white/60 mt-4">
                  You own {ownedItemsInZone.length} of {itemsForZone.length} items here.
                </p>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Shop */}
      <Dialog open={shopOpen} onOpenChange={setShopOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5" /> Village Shop
              <span className="ml-auto flex items-center gap-1 text-sm font-normal">
                <Sparkles className="h-4 w-4 text-amber-500" /> {tokens} tokens
              </span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            {sortedZones.map((z) => {
              const zoneItems = items.filter((i) => i.zone_id === z.id);
              const zoneUnlocked = unlockedZoneIds.includes(z.id);
              return (
                <div key={z.id}>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-bold">{z.name}</h3>
                    {!zoneUnlocked && (
                      <Badge variant="outline" className="text-xs">
                        <Lock className="h-3 w-3 mr-1" /> Zone locked
                      </Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {zoneItems.map((item) => {
                      const owned = ownedItemIds.includes(item.id);
                      const canAfford = tokens >= item.token_cost;
                      return (
                        <div
                          key={item.id}
                          className={`rounded-xl border p-3 text-center ${
                            owned ? "bg-emerald-50 border-emerald-300" : "bg-card"
                          }`}
                        >
                          <div className="text-3xl mb-1">🎁</div>
                          <div className="text-sm font-semibold">{item.name}</div>
                          <div className="text-xs text-muted-foreground mb-2 capitalize">
                            {item.rarity}
                          </div>
                          {owned ? (
                            <Badge className="bg-emerald-500">Owned</Badge>
                          ) : (
                            <Button
                              size="sm"
                              className="w-full"
                              disabled={
                                !zoneUnlocked || !canAfford || purchase.isPending
                              }
                              onClick={() => handlePurchase(item)}
                            >
                              <Sparkles className="h-3 w-3 mr-1" />
                              {item.token_cost > 0 ? item.token_cost : "Free"}
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Slot picker */}
      <Dialog open={!!slotPicker} onOpenChange={(o) => !o && setSlotPicker(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Place an item</DialogTitle>
          </DialogHeader>
          {slotPicker && placedItems[slotPicker] && (
            <Button
              variant="outline"
              className="w-full mb-2"
              onClick={() => handlePlace(slotPicker, null)}
            >
              <X className="h-4 w-4 mr-2" /> Remove current item
            </Button>
          )}
          <div className="grid grid-cols-3 gap-2">
            {ownedItemsInZone.length === 0 && (
              <p className="col-span-3 text-sm text-muted-foreground text-center py-4">
                No items yet for this zone.{" "}
                <button
                  className="underline"
                  onClick={() => {
                    setSlotPicker(null);
                    setShopOpen(true);
                  }}
                >
                  Visit the Shop
                </button>
              </p>
            )}
            {ownedItemsInZone.map((item) => (
              <button
                key={item.id}
                onClick={() => slotPicker && handlePlace(slotPicker, item.id)}
                className="rounded-xl border p-2 hover:bg-accent text-center"
              >
                <div className="text-2xl">🎁</div>
                <div className="text-xs font-semibold mt-1">{item.name}</div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Link
        to="/game/play?tab=rpg"
        className="fixed bottom-4 right-4 z-20 rounded-full bg-white text-slate-900 px-4 py-2 text-sm font-bold shadow-lg hover:bg-white/90"
      >
        Read to earn →
      </Link>
    </div>
  );
}
