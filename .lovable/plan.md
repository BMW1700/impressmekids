## What to click, right now

You're on the right screen. Two separate controls — do **both**, in this order.

### 1. Disk size (the box you already have open)

You're at **5.45 GB / 8 GB used (68%)**. That's already in the danger zone for autovacuum + WAL headroom.

- **Bump "New disk size" from 11 → 32 GB**, then click **Increase disk size**.
- Why 32 and not 11: disk can only be resized **once every 4 hours** and **can never be decreased**. Jumping to 11 GB buys you a few weeks and then you're back here. 32 GB gives you real runway through pilots without paying for 100 GB you don't need yet. You can always go bigger later.

### 2. Compute instance (the dropdown above it — currently "Mini")

Mini is "reliable for early projects" — it is the **60-max-connections / small-RAM** tier that the audit flagged as the ceiling at ~5k DAU. For the scale conversation we just had, this is the single biggest lever.

- Open **"Select an instance size"** → pick **Small** (one tier up from Mini).
- Click **Upgrade instance**.
- Why not jump straight to Medium/Large: Small roughly doubles RAM + connections vs Mini and is the right step for your current 26-user → pilot phase. Medium/Large make sense once you cross ~10k DAU. You can resize compute again without the 4-hour disk lockout.

### Order matters

Do **disk first** (it's the more urgent one — you're at 68%), then **compute**. Don't do them simultaneously; let the disk resize finish (a few minutes, the UI will show progress) before kicking off the compute upgrade, otherwise the second one will be blocked.

### What I'll do on my side after both finish

Nothing required from me to make the resize work — Phase 1 migrations I already shipped (indexes, realtime trim, RPC) are independent of instance size and are already live. Once you confirm both upgrades are done, I'll re-pull `db_health` to verify the new ceilings and then we can decide whether to start Phase 2 (read replica + RLS flatten pass #2) this week or next.

### TL;DR

1. Change **11 → 32**, click **Increase disk size**.
2. Wait for it to finish.
3. Open the instance dropdown, pick **Small**, click **Upgrade instance**.
4. Tell me when both are green and I'll re-audit.
