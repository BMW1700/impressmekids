-- Create player_inventory table to track owned items
CREATE TABLE public.player_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  item_id TEXT NOT NULL,
  item_category TEXT NOT NULL CHECK (item_category IN ('power', 'skin', 'potion', 'upgrade')),
  quantity INTEGER DEFAULT 1,
  is_equipped BOOLEAN DEFAULT false,
  purchased_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, item_id)
);

-- Enable RLS
ALTER TABLE public.player_inventory ENABLE ROW LEVEL SECURITY;

-- Students can view their own inventory
CREATE POLICY "Students can view own inventory"
ON public.player_inventory
FOR SELECT
USING (student_id = auth.uid());

-- Students can insert into their own inventory
CREATE POLICY "Students can add to own inventory"
ON public.player_inventory
FOR INSERT
WITH CHECK (student_id = auth.uid());

-- Students can update their own inventory (equip/unequip, reduce quantity)
CREATE POLICY "Students can update own inventory"
ON public.player_inventory
FOR UPDATE
USING (student_id = auth.uid());

-- Students can delete from their own inventory
CREATE POLICY "Students can delete from own inventory"
ON public.player_inventory
FOR DELETE
USING (student_id = auth.uid());

-- Create index for fast lookups
CREATE INDEX idx_player_inventory_student ON public.player_inventory(student_id);
CREATE INDEX idx_player_inventory_item ON public.player_inventory(item_id);
CREATE INDEX idx_player_inventory_equipped ON public.player_inventory(student_id, is_equipped) WHERE is_equipped = true;