// Curated competitive notes, keyed by display name, merged into the generated
// movedex / itemdex by the ETLs.
//
// PokéAPI's effect text is accurate but often frozen to an older generation's
// wording and silent on interactions that matter in VGC. Anything here is a
// hand-authored addition — keep each note factual and specific, and cite the
// mechanic, not a matchup opinion. Extend freely; the ETLs attach `notes` only
// when a name appears below.

export const MOVE_NOTES = {
  'Triple Axel': [
    'Ramps in power across its three hits: 20 BP, then 40, then 60 (120 total if all land).',
    'Each hit rolls its own 90% accuracy check and the move stops at the first miss. Loaded Dice removes the accuracy check on the 2nd and 3rd hits; Skill Link does not force all three.',
    'Every hit is boosted (or resisted) independently, so it can break a Focus Sash or Substitute on an earlier hit and still KO.',
  ],
  'Knock Off': [
    "Deals 1.5× damage on the hit that removes the target's held item.",
    'Cannot remove a Mega Stone from the Pokémon it belongs to, a Z-Crystal, or a form-defining item (e.g. Griseous Orb, Booster Energy is removable).',
    'The item is only knocked off if the target survives the hit and Knock Off connects (blocked by Protect, Substitute, and by the ability Sticky Hold).',
  ],
  'Fake Out': [
    "Only selectable on the user's first turn after switching in.",
    'Flinch only lands on a target that has not moved yet this turn, so it does nothing into a faster foe.',
    'Makes contact — triggers Rocky Helmet, Static, Flame Body, Rough Skin, etc.',
  ],
  Protect: [
    'Consecutive protection moves share a success counter: the chance to succeed is 1, then 1/3, then 1/9, … halving-ish each turn, and resets when the user does anything else.',
    'Does not block Feint, Shadow Force / Phantom Force, ally moves, or field effects like Perish Song and entry hazards.',
  ],
  'Rage Powder': [
    'Redirects single-target moves from opponents to the user in doubles.',
    'Has no effect on Grass-type Pokémon, or on holders of Safety Goggles, or on users of Overcoat — those ignore the redirection.',
  ],
  'Follow Me': [
    'Redirects opponents’ single-target moves to the user; unlike Rage Powder it works on Grass types and Safety Goggles holders.',
  ],
  Encore: [
    'Locks the target into its last move for 3 turns.',
    'Fails if the target has not moved yet, or is already locked (Bide, Outrage), or if the move has 0 PP left.',
    'From a Prankster user the +1 priority does not apply against Dark-type targets (see the ability note).',
  ],
  Taunt: [
    'Stops the target selecting status moves for 3 turns.',
    'From a Prankster user it does not gain priority against Dark-type targets.',
  ],
  'Will-O-Wisp': [
    'Burn halves physical damage and chips 1/16 max HP per turn.',
    'Fails into Fire types, Comatose, and holders of certain abilities (Water Veil, Thermal Exchange, Water Bubble). 85% accuracy — it can miss.',
  ],
  'Draco Meteor': [
    "Lowers the user's Special Attack by two stages after damage; chain it with a switch or use once off a Choice item.",
  ],
  Overheat: [
    "Lowers the user's Special Attack by two stages after damage.",
  ],
  'Make It Rain': [
    "Hits both opponents in doubles and lowers the user's Special Attack by one stage.",
  ],
}

export const ABILITY_NOTES = {
  Prankster: [
    'Gives +1 priority to the holder’s status (non-damaging) moves.',
    'Since Gen 7, a Prankster-boosted status move fails outright against Dark-type Pokémon — a Prankster user cannot Encore, Taunt, Thunder Wave, Spore, etc. a Dark type by way of the priority. Using the same move without the priority boost (e.g. a Dark type ignoring Prankster) still works.',
    'The boosted move is also stopped by an opponent’s Psychic Terrain if the target is grounded.',
  ],
  Intimidate: [
    "Lowers the Attack of both opposing Pokémon by one stage on switch-in.",
    'Blocked or punished by Clear Body, Hyper Cutter, White Smoke, Full Metal Body, Inner Focus, Oblivious, Own Tempo, Scrappy (Gen 8+), Guard Dog (raises Attack instead), Rattled (raises Speed), and Defiant / Competitive (sharp offensive boost). Mirror Armor reflects the drop back onto the Intimidate user.',
  ],
  'Good as Gold': [
    'The holder is immune to status moves targeted at it — Will-O-Wisp, Thunder Wave, Spore, Parting Shot, Toxic, Encore, Trick, etc.',
    'Does not block Intimidate, entry hazards, weather, Terrain, or damaging moves with secondary effects.',
  ],
  'Storm Drain': [
    'Draws all single-target Water moves in doubles (even those aimed at the ally) and raises the holder’s Special Attack one stage instead of taking damage.',
  ],
  'Flame Body': [
    '30% chance to burn a Pokémon that hits the holder with a contact move.',
  ],
  Regenerator: [
    'Restores 1/3 of max HP whenever the holder switches out.',
  ],
  Unnerve: [
    'Opposing Pokémon cannot eat their Berries while the Unnerve user is on the field (also suppresses Booster Energy on switch-in for the turn it matters, and pairs with Neutralizing Gas discussions — but Unnerve only touches Berries).',
  ],
  'Grassy Surge': [
    'Sets Grassy Terrain for 5 turns (8 with Terrain Extender): grounded Pokémon heal 1/16 max HP per turn, Grass moves are boosted 1.3×, and Earthquake / Bulldoze / Magnitude are halved.',
  ],
}

export const ITEM_NOTES = {
  'Life Orb': [
    'Damage multiplier is 1.3× (5324⁄4096).',
    'Costs 10% of max HP after any damaging move the holder uses, even one that misses or is protected. Magic Guard removes the recoil; on a Sheer Force move the boost is lost but so is the recoil.',
  ],
  'Choice Specs': [
    '1.5× Special Attack, but the holder is locked into the first move it picks until it switches out.',
    'Selecting a move the holder cannot use afterwards (0 PP, disabled) leaves it Struggling — bring Protect coverage on a teammate, not the Choice user.',
  ],
  'Choice Band': ['1.5× Attack, locked into the first move picked until switch-out.'],
  'Choice Scarf': ['1.5× Speed, locked into the first move picked until switch-out.'],
  'Assault Vest': [
    '1.5× Special Defense.',
    'The holder cannot select status moves at all — including Protect, Substitute, Fake Out, Trick Room, Tailwind, Will-O-Wisp.',
  ],
  'Rocky Helmet': [
    'A Pokémon that hits the holder with a contact move loses 1/6 of its max HP.',
    'Stacks with Rough Skin / Iron Barbs and with Life Orb recoil on the attacker.',
  ],
  'Sitrus Berry': [
    'Restores 25% of max HP once, automatically, when the holder drops to 50% HP or below.',
    'Consumed by Bug Bite / Pluck, tossed by Fling, and recyclable with Recycle; eaten earlier (75% HP) if the holder has Gluttony.',
  ],
  Leftovers: ['Restores 1/16 (6.25%) of max HP at the end of every turn the holder is in.'],
  'Safety Goggles': [
    'Blocks powder and spore moves (Spore, Rage Powder, Sleep Powder, Powder) and prevents Sand / Hail chip damage.',
    'Does not stop weather-based abilities such as Slush Rush or Sand Rush from activating.',
  ],
  'Covert Cloak': [
    'The holder is immune to the additional effects of attacking moves — no flinch from Rock Slide / Fake Out, no burn from Scald, no drops from Make It Rain, no Salt Cure residual, etc.',
    'Does not block the primary effect of a status move (Thunder Wave still paralyses).',
  ],
  'Clear Amulet': [
    "Prevents the holder's stats from being lowered by any other Pokémon — Intimidate, Snarl, Icy Wind, Parting Shot, sticky-web-style drops.",
    'Does not stop self-inflicted drops (Draco Meteor, Close Combat, Overheat).',
  ],
  'Mental Herb': [
    'Single use: cures infatuation, Taunt, Encore, Torment, Disable and Heal Block the moment one is applied, then the herb is gone.',
  ],
  'Light Clay': ['Reflect, Light Screen and Aurora Veil set by the holder last 8 turns instead of 5.'],
  'Weakness Policy': [
    'When the holder is hit by a super-effective move it gains +2 Attack and +2 Special Attack, then the item is consumed.',
    'Triggers even on a hit that would not KO — pair with Substitute, a defensive spread, or a Sash. No effect on status or non-super-effective hits.',
  ],
  'Mystic Water': ['Water-type moves used by the holder deal 1.2× damage. No downside, no lock-in.'],
  'Black Glasses': ['Dark-type moves used by the holder deal 1.2× damage.'],
  'Miracle Seed': ['Grass-type moves used by the holder deal 1.2× damage.'],
  'Sharp Beak': ['Flying-type moves used by the holder deal 1.2× damage.'],
  'Loaded Dice': [
    'Multi-hit moves that roll 2–5 hits (Bullet Seed, Rock Blast, Scale Shot, Bone Rush) always hit at least 4 times.',
    'For Triple Axel / Triple Kick it removes the accuracy check on the later hits instead.',
  ],
}
