/* =====================================================================
   Violent Bot — channel demos.

   Everything a visitor sees in the mock Discord client. The message
   shapes are transcribed from the bot itself (tibia-bot @ dev); each
   block cites the file it came from so the two can be compared when the
   bot changes.

   The data is NOT live. It is a defined pool recombined into a rotation
   long enough that a reader will not catch it repeating — see ROTATION.
   ===================================================================== */
(function () {
'use strict';

/* =====================================================================
   1. EMOJI
   ===================================================================== */

/* Discord renders Unicode emoji as Twemoji, so a system font would look
   wrong on Windows in particular. Vendored under assets/img/twemoji/. */
var TW = 'assets/img/twemoji/';
var UNI = {
  shield:         ['1f6e1', '🛡️'],
  snowflake:      ['2744',  '❄️'],
  fire:           ['1f525', '🔥'],
  bow_and_arrow:  ['1f3f9', '🏹'],
  fist:           ['1f44a-1f3fd', '👊🏽'],
  hatching_chick: ['1f423', '🐣'],
  zap:            ['26a1',  '⚡'],
  zzz:            ['1f4a4', '💤'],
  gear:           ['2699',  '⚙️'],
  robot:          ['1f916', '🤖'],
  dagger:         ['1f5e1', '🗡️'],
  crossed_swords: ['2694',  '⚔️'],
  link:           ['1f517', '🔗'],
  green_circle:   ['1f7e2', '🟢'],
  yellow_circle:  ['1f7e1', '🟡'],
  scissors:       ['2702',  '✂️']
};

/* Custom server emoji, ids verbatim from
   tibia-bot/src/main/resources/discord.conf (the "Custom Emojis" block).
   Vendored from tibia-bot/src/main/resources/discord emojis/. */
var CUSTOM = {
  guild:      'allyguild',    /* <:guild:1077165703473418290>      */
  otherguild: 'neutralguild', /* <:otherguild:1077165707025985646> */
  enemyguild: 'enemyguild',   /* <:enemyguild:1153668299310252032> */
  ally:       'ally',         /* <:ally:1191747022043234445>       */
  enemy:      'enemy',        /* <:enemy:1153654156423336066>      */
  exiva:      'exiva',        /* <:exiva:1025866744918716416>      */
  indent:     'indent',       /* <:indent:1025915320285798451>     */
  nemesis:    'nemesis',      /* <:nemesis:1024708740810821662>    */
  levelup:    'levelup',      /* <:levelup:1075222553624326164>    */
  daily:      'daily',        /* <:daily:1133349016814485584>      */
  satchel:    'satchel',      /* <:satchel:1030348072577945651>    */
  letter:     'letter',       /* <:letter:1195388031755096114>     */
  gold:       'gold',         /* <:gold:1133502093039251486>       */
  boss:       'boss',         /* <:boss:1195770698401075281>       */
  creature:   'creature',     /* <:creature:1548349730650591233>   */
  masslog:    'masslog',      /* <:masslog:1505437547717988503>    */
  /* The notifications channel's five role icons and the server-save block. */
  inq:        'inq',          /* <:inq:1025103806851199078>        */
  hazard:     'hazard',       /* <:hazard:1148373566077816922>     */
  bounty:     'bounty',       /* <:bounty:1537339697624256524>     */
  archfoe:    'archfoe',      /* <:archfoe:1024710113728155738>    */
  drome:      'drome',        /* <:drome:1507620940278923294>      */
  dreamscar:  'dreamscar.gif', /* <a:dreamscar:1504728980010438717> */
  /* The statistics post. `news` leads the date, `lvldown` is experience
     LOST (the board uses a different icon from the one for gained, which
     is what lets the direction read before the number does), and
     `skillshield` is SkillEmojis.icon for a Shielding advance. */
  news:        'news.gif',      /* <a:news:1547509125951389727>      */
  lvldown:     'lvldown',       /* <:lvldown:1547314973213196289>    */
  skillshield: 'skillshield.gif', /* <a:shield:1546168089207373856>  */
  /* Bar segments. Discord leaves a gap between adjacent custom emoji, so
     a bar cannot be tiled from one piece — it needs a rounded start,
     square middles and a rounded end, three shapes per colour. */
  green_start: 'green_start', green_mid: 'green_mid', green_end: 'green_end',
  red_start:   'red_start',   red_mid:   'red_mid',   red_end:   'red_end',
  empty_start: 'empty_start', empty_mid: 'empty_mid', empty_end: 'empty_end'
};
var EMOJI_DIR = 'assets/img/emoji/';

function uni(name, big) {
  var m = UNI[name];
  if (!m) return '';
  return '<img class="e' + (big ? ' big' : '') + '" src="' + TW + m[0] + '.svg" alt="" data-fb="' + m[1] + '">';
}
function custom(name) {
  var f = CUSTOM[name];
  if (!f) return '';
  /* Animated server emoji keep their own extension; everything else is a png. */
  var file = f.indexOf('.') > -1 ? f : f + '.png';
  return '<img class="e" src="' + EMOJI_DIR + file + '" alt="" data-fb="">';
}

/* presentation/Emojis.scala — vocation resolved by its last word, so
   "Elite Knight" and "Exalted Monk" reach the base vocation. */
var VOC_EMOJI = {
  knight: 'shield', druid: 'snowflake', sorcerer: 'fire',
  paladin: 'bow_and_arrow', monk: 'fist', none: 'hatching_chick'
};
/* The shortcode form, for anything that will pass through md(). The bot
   emits exactly this (presentation/Emojis.vocEmoji), and rendering the
   <img> early would only get escaped again on the way through. */
function vc(v) { return ':' + (VOC_EMOJI[v] || 'hatching_chick') + ':'; }

/* =====================================================================
   2. MARKDOWN
   Fixtures hold the literal strings the bot emits, so this has to
   understand what Discord understands.
   ===================================================================== */

function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

function rel(sec) {
  var a = Math.max(1, Math.round(sec));
  if (a < 60) return a + ' second' + (a === 1 ? '' : 's') + ' ago';
  var m = Math.round(a / 60);
  if (m < 60) return m + ' minute' + (m === 1 ? '' : 's') + ' ago';
  var h = Math.round(m / 60);
  if (h < 24) return h + ' hour' + (h === 1 ? '' : 's') + ' ago';
  var d = Math.round(h / 24);
  return d + ' day' + (d === 1 ? '' : 's') + ' ago';
}
function relFuture(sec) {
  var a = Math.max(1, Math.round(sec));
  if (a < 60) return 'in ' + a + ' second' + (a === 1 ? '' : 's');
  var m = Math.round(a / 60);
  if (m < 60) return 'in ' + m + ' minute' + (m === 1 ? '' : 's');
  var h = Math.round(m / 60);
  if (h < 24) return 'in ' + h + ' hour' + (h === 1 ? '' : 's');
  var d = Math.round(h / 24);
  return 'in ' + d + ' day' + (d === 1 ? '' : 's');
}

function md(text, ago) {
  var s = esc(text);
  /* <t:N:R> where N is an OFFSET, not an epoch:
       0        the message's own age (every death and level line)
       positive that far ahead   -> "in 2 days"
       negative that far behind  -> "3 hours ago" */
  s = s.replace(/&lt;t:(-?\d+):R&gt;/g, function (_, n) {
    var off = parseInt(n, 10);
    if (off > 0) return relFuture(off);
    if (off < 0) return rel(-off);
    return rel(ago);
  });
  s = s.replace(/&lt;a?:([a-z_]+):\d*&gt;/g, function (_, n) { return custom(n); });
  s = s.replace(/:([a-z_]+):/g, function (m0, n) { return UNI[n] ? uni(n) : m0; });
  /* Link text may itself contain one bracketed pair: the bot appends a
     killer's level as "[498]", giving "[Kenn Doll [498]](url)". */
  s = s.replace(/\[((?:[^[\]]|\[[^\]]*\])+)\]\(([^)]+)\)/g,
                '<a href="$2" target="_blank" rel="noopener">$1</a>');
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  s = s.replace(/@([A-Za-z ]+)@/g, '<span class="dc-mention">@$1</span>');
  /* ## and ### headings, line-scoped.

     The surrounding text is white-space: pre-wrap, so a newline left on
     either side of a heading renders as a line break ON TOP of the
     heading's own block margin. Blocks therefore absorb their own
     separators, and only two consecutive plain lines are rejoined with a
     newline. */
  var lines = s.split('\n');
  var out = '';
  var prevBlock = true;
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i], block = false, html;
    /* `first` rather than :first-child — a heading preceded only by a TEXT
       node is still the first ELEMENT child, so :first-child was zeroing the
       top margin of headings that do have text above them (every boosted
       post). Only a heading that truly opens the description gets it. */
    var lead = i === 0 ? ' first' : '';
    if (line.indexOf('### ') === 0) { html = '<div class="h3' + lead + '">' + line.slice(4) + '</div>'; block = true; }
    else if (line.indexOf('## ') === 0) { html = '<div class="h2' + lead + '">' + line.slice(3) + '</div>'; block = true; }
    else html = line;
    if (i > 0 && !block && !prevBlock) out += '\n';
    out += html;
    prevBlock = block;
  }
  return out;
}

/* =====================================================================
   3. COLOURS
   The literal ints the bot sets, from presentation/Embeds.scala,
   DeathEmbeds.scala, GuildActivity.scala and RespawnEmbeds.scala.
   ===================================================================== */
var C = {
  brand:    '#2F3136', /* 3092790  BrandColor / neutral death default */
  greyGuild:'#45474D', /* 4540237  neutral, untracked guild, PvE      */
  bone:     '#E2E2E2', /* 14869218 neutral killed by a player         */
  red:      '#D22929', /* 13773097 EnemyRed / an ALLY died            */
  green:    '#00904D', /* 36941    AllyGreen / an ENEMY died          */
  purple:   '#B072FF', /* 11563775 NemesisPurple                      */
  yellow:   '#DBAF48', /* 14397256 AutomaticColor / neutral activity  */
  free:     '#2ECC71'  /* 3066993  RespawnEmbeds.FreeColor            */
};

/* =====================================================================
   4. DATA POOLS
   ===================================================================== */

var VOCS = ['knight', 'druid', 'sorcerer', 'paladin', 'monk'];

var NAMES = [
  'Meudruid Eousado', 'Compa Bombbinha', 'Geraverunt', 'Gilgaladx', 'Yieck Juarez',
  'Forny Talthoril', 'Chukky Mage', 'Bari Azarde', 'Mad Grunhol', 'Tony Joeru',
  'Rockstar Palo', 'Futellozky', 'Fivio Mortxl', 'Litana Lights', 'Highflyerk',
  'Eternal Aryzita', 'Mictlan Tlatoani', 'Eternal Borbo', 'Nohelle Knight',
  'Romeu Semjuliet', 'Mad Chelsea', 'Trackzero', 'Kenn Doll', 'Luisa Ackerman',
  'Useless Flamingo', 'Elistan Longbow', 'Killa Blob', 'Simple Codee', 'Diz zles',
  'Frankirivers', 'Skull Cupcake', 'Macky Daemon', 'Soul Naga', 'Compa Joselii',
  'Chapitoo Raton', 'Welloxide', 'Jazz Ysoler', 'Pochita Milei', 'Chukky Sorc',
  'Enrryk', 'Streth Wuel', 'Lucychild', 'Patow Saints', 'Princesita Phriana',
  'Mad Lottie', 'Activvist', 'Eazssy', 'Mago Torpe', 'Tonyrgv', 'Thurianx',
  'Borreverunt', 'Kaladin Storm', 'Vexor Nightfall', 'Ruby Ashfell',
  'Grim Halloway', 'Silent Brann', 'Oda Nobunata', 'Pyre Velasques',
  'Neko Bandit', 'Iron Wolfsson', 'Salty Dredge', 'Mira Vantas'
];

var GUILDS = {
  ally:    ['Loyalty', 'Bright Side', 'Sanctuary'],
  enemy:   ['Flawless Victory', 'Nopalovers', 'Mortal Kombat'],
  neutral: ['Red Rose', 'Wanderers', 'The Kingsmen', 'Silent Order']
};
var RANKS = ['Leader', 'Vice Leader', 'Warloyal', 'One', 'Veteran', 'Recruit', 'Member', 'Elite'];

/* Creature sprites. `f` is the TibiaWiki file name the bot would build
   via Urls.creatureFileName; the site serves a vendored copy of it from
   assets/img/creatures/. `lo`/`hi` band the levels it plausibly kills,
   so a generated death never reads as nonsense (a level-8 druid is not
   killed by a Juggernaut). */
var CREATURES = [
  { n: 'rotworm',              f: 'Rotworm',              lo: 8,   hi: 45 },
  { n: 'wasp',                 f: 'Wasp',                 lo: 8,   hi: 40 },
  { n: 'cyclops',              f: 'Cyclops',              lo: 15,  hi: 60 },
  { n: 'orc berserker',        f: 'Orc_Berserker',        lo: 15,  hi: 60 },
  { n: 'ghoul',                f: 'Ghoul',                lo: 20,  hi: 70 },
  { n: 'minotaur mage',        f: 'Minotaur_Mage',        lo: 20,  hi: 70 },
  { n: 'mutated rat',          f: 'Mutated_Rat',          lo: 40,  hi: 110 },
  { n: 'demon skeleton',       f: 'Demon_Skeleton',       lo: 40,  hi: 120 },
  { n: 'giant spider',         f: 'Giant_Spider',         lo: 50,  hi: 130 },
  { n: 'dragon lord',          f: 'Dragon_Lord',          lo: 60,  hi: 150 },
  { n: 'blood beast',          f: 'Blood_Beast',          lo: 80,  hi: 200 },
  { n: 'hydra',                f: 'Hydra',                lo: 80,  hi: 180 },
  { n: 'serpent spawn',        f: 'Serpent_Spawn',        lo: 90,  hi: 200 },
  { n: 'medusa',               f: 'Medusa',               lo: 90,  hi: 200 },
  { n: 'frost dragon',         f: 'Frost_Dragon',         lo: 100, hi: 220 },
  { n: 'nightmare',            f: 'Nightmare',            lo: 100, hi: 220 },
  { n: 'behemoth',             f: 'Behemoth',             lo: 120, hi: 260 },
  { n: 'undead dragon',        f: 'Undead_Dragon',        lo: 140, hi: 300 },
  { n: 'destroyer',            f: 'Destroyer',            lo: 140, hi: 280 },
  { n: 'warlock',              f: 'Warlock',              lo: 140, hi: 280 },
  { n: 'cursed book',          f: 'Cursed_Book',          lo: 180, hi: 400 },
  { n: 'burning book',         f: 'Burning_Book',         lo: 180, hi: 400 },
  { n: 'weakened frazzlemaw',  f: 'Weakened_Frazzlemaw',  lo: 180, hi: 380 },
  { n: 'lizard chosen',        f: 'Lizard_Chosen',        lo: 180, hi: 360 },
  { n: 'grim reaper',          f: 'Grim_Reaper',          lo: 200, hi: 420 },
  { n: 'juggernaut',           f: 'Juggernaut',           lo: 220, hi: 460 },
  { n: 'dark torturer',        f: 'Dark_Torturer',        lo: 200, hi: 420 },
  { n: 'guzzlemaw',            f: 'Guzzlemaw',            lo: 250, hi: 500 },
  { n: 'choking fear',         f: 'Choking_Fear',         lo: 250, hi: 500 },
  { n: 'silencer',             f: 'Silencer',             lo: 250, hi: 500 },
  { n: 'vexclaw',              f: 'Vexclaw',              lo: 280, hi: 560 },
  { n: 'hellflayer',           f: 'Hellflayer',           lo: 280, hi: 560 },
  { n: 'lava golem',           f: 'Lava_Golem',           lo: 300, hi: 600 },
  { n: 'cobra assassin',       f: 'Cobra_Assassin',       lo: 300, hi: 700 },
  { n: 'werelioness',          f: 'Werelioness',          lo: 200, hi: 450 },
  { n: 'true dawnfire asura',  f: 'True_Dawnfire_Asura',  lo: 300, hi: 700 },
  { n: 'falcon knight',        f: 'Falcon_Knight',        lo: 320, hi: 700 },
  { n: 'burster spectre',      f: 'Burster_Spectre',      lo: 320, hi: 700 }
];

/* Bosses in Config.notableCreatures — these turn a death purple and
   fire the nemesis poke (TibiaBot.scala:1147-1151). */
var BOSSES = [
  { n: 'Ferumbras',             f: 'Ferumbras' },
  { n: 'Morgaroth',             f: 'Morgaroth' },
  { n: 'Ghazbaran',             f: 'Ghazbaran' },
  { n: 'Orshabaal',             f: 'Orshabaal' },
  { n: 'Zulazza the Corruptor', f: 'Zulazza_the_Corruptor' }
];

/* Environmental damage types, keyed exactly as presentation/DeathEffect
   keys them — and every one of these GIFs is already in this repo. */
var EFFECTS = [
  { n: 'fire',       f: 'Fire.gif' },
  { n: 'energy',     f: 'Red_Sparkles_Effect.gif' },
  { n: 'drowning',   f: 'Reaper_Effect.gif' },
  { n: 'ice',        f: 'Ice_Explosion_Effect.gif' },
  { n: 'life drain', f: 'Red_Sparkles_Effect.gif' },
  { n: 'death',      f: 'Death_Effect.gif' }
];
var PVP_GIF = 'Phantasmal_Ooze.gif';
var SUICIDE_GIF = 'Ghost_Smoke_Effect.gif';

function creatureImg(f) { return 'assets/img/creatures/' + f + '.gif'; }

/* Respawns, verbatim rows from tibia-bot/src/main/resources/respawns.json.
   displayName is "{code} — {name}" (RespawnEmbeds.claimCard). */
var SPAWNS = [
  { code: '901',   region: 'Liberty Bay', name: 'Crystal Gardens',                 creature: 'Pirate_Ghost' },
  { code: '509',   region: 'Venore',      name: 'Venore Flimsies',                 creature: 'Flimsy_Lost_Soul' },
  { code: '1102',  region: 'Yalahar',     name: 'Cemetery Quarter Grim Reapers',   creature: 'Grim_Reaper' },
  { code: '408',   region: 'Edron',       name: 'Inquisition - Blood Halls',       creature: 'Dark_Torturer' },
  { code: '1211',  region: 'Farmine',     name: 'Inner Sanctum (Undead Dragons)',  creature: 'Undead_Dragon' },
  { code: '1421',  region: 'Rathleton',   name: 'Quaras (Podzilla)',               creature: 'Quara_Raider' },
  { code: '410',   region: 'Edron',       name: 'Inquisition - The Battlefields',  creature: 'Hellhound' },
  { code: '1514',  region: 'Roshamuul',   name: 'Ingol -2',                        creature: 'Harpy' },
  { code: '414',   region: 'Edron',       name: 'Edron Vampire Crypt',             creature: 'Vampire_Viscount' },
  { code: '1115',  region: 'Yalahar',     name: 'Magician Quarter',                creature: 'Infernalist' },
  { code: '312',   region: 'Kazordoon',   name: 'Warzone 8',                       creature: 'Lavafungus' },
  { code: '1708a', region: 'Issavi',      name: 'Rotten Wasteland North (Soulwar)', creature: 'Rotten_Golem' }
];

var WORLD = 'Antica';
var MEMBERS = ['najimabased', 'fausto2605', 'arkindrakin', 'lipegarcia', 'thiagobrcn', 'violentbeams', 'kaladin_s'];

/* =====================================================================
   5. DETERMINISTIC ROTATION
   A seeded PRNG, so the "random" feed is the same on every load and can
   be reasoned about — and so a long session keeps producing fresh
   combinations rather than looping a short fixed list.
   ===================================================================== */
var ROTATION = 0;
function rng(seed) {
  var s = seed >>> 0 || 1;
  return function () {
    s ^= s << 13; s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5;  s >>>= 0;
    return s / 4294967296;
  };
}
function pick(r, arr) { return arr[Math.floor(r() * arr.length) % arr.length]; }
function between(r, lo, hi) { return lo + Math.floor(r() * (hi - lo + 1)); }

/* ---------------------------------------------------------------------
   THE SERVER'S POPULATION

   One fixed roster that every channel draws from, rather than each demo
   inventing people independently. Without it the same name turns up as
   an ally in #deaths and an enemy in #levels, which is the one thing a
   Tibia player would notice immediately — and characters recurring
   across channels is what makes the shared client read as one server
   rather than eight unrelated screenshots.
   ------------------------------------------------------------------ */
var ROSTER = (function () {
  var r = rng(20260915);
  return NAMES.map(function (name, i) {
    var side = i < 14 ? 'ally' : i < 27 ? 'enemy' : 'neutral';
    return {
      name: name,
      voc: pick(r, VOCS),
      side: side,
      guild: side === 'ally' ? pick(r, GUILDS.ally)
           : side === 'enemy' ? pick(r, GUILDS.enemy)
           : (r() < 0.55 ? pick(r, GUILDS.neutral) : ''),
      rank: pick(r, RANKS),
      level: between(r, 20, 780)
    };
  });
})();
function charAt(i) { return ROSTER[((i % ROSTER.length) + ROSTER.length) % ROSTER.length]; }

/* Walking the roster by a stride coprime with its length visits every
   character exactly once before any repeat — 62 rows before a familiar
   name comes round again, instead of the clusters a uniform random pick
   produces (three of fourteen being the same person, in testing). Each
   channel uses its own stride so they do not march in lockstep. */
var STRIDE = { deaths: 23, levels: 17, activity: 29 };
function someone(r) { return ROSTER[Math.floor(r() * ROSTER.length) % ROSTER.length]; }

/* The allied slice, walked the same way, for the "one of ours just died"
   case the deaths feed is built around. */
var ALLIES = ROSTER.filter(function (c) { return c.side === 'ally'; });
function allyAt(i) { return ALLIES[((i * 5) % ALLIES.length + ALLIES.length) % ALLIES.length]; }

/* The guild icon a character wears, per presentation/GuildIcons.classify. */
function sideIcon(c) {
  if (c.side === 'ally') return c.guild ? '<:guild:>' : '<:ally:>';
  if (c.side === 'enemy') return c.guild ? '<:enemyguild:>' : '<:enemy:>';
  return c.guild ? '<:otherguild:>' : '';
}

/* The guild line a death embed opens with (TibiaBot.scala:1124). */
function guildLine(c) {
  if (!c.guild) return '';
  return sideIcon(c) + ' *' + c.rank + '* of the [' + c.guild + '](#)\n';
}

/* A killer's level, banded around the victim's. A level-57 victim killed
   by a 604 reads as nonsense even though nothing forbids it. */
function killerLevel(r, victimLevel) {
  var lo = Math.max(8, Math.round(victimLevel * 0.55));
  var hi = Math.min(820, Math.round(victimLevel * 1.75) + 25);
  return between(r, lo, hi);
}

/* =====================================================================
   6. RENDERER
   ===================================================================== */

function clock(ago) {
  var d = new Date(Date.now() - ago * 1000);
  var h = d.getHours(), m = d.getMinutes();
  var ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  var time = h + ':' + (m < 10 ? '0' : '') + m + ' ' + ap;
  var days = Math.floor((new Date().setHours(0, 0, 0, 0) - new Date(d).setHours(0, 0, 0, 0)) / 86400000);
  if (days === 0) return 'Today at ' + time;
  if (days === 1) return 'Yesterday at ' + time;
  return ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2) + '/' + d.getFullYear() + ' ' + time;
}

function embedHTML(e, ago) {
  var body = '';
  if (e.title) {
    body += '<div class="etitle' + (e.plain ? ' plain' : '') + '">' + md(e.title, ago) + '</div>';
  }
  if (e.desc) body += '<div class="de">' + md(e.desc, ago) + '</div>';

  var right = e.thumb ? '<img class="th" src="' + e.thumb + '" alt="" data-fb="">' : '<span></span>';

  var extra = '';
  if (e.fields && e.fields.length) {
    extra += '<div class="fields">' + e.fields.map(function (f) {
      return '<div class="fld' + (f.inline ? '' : ' wide') + '">' +
               '<div class="fn">' + md(f.n, ago) + '</div>' +
               '<div class="fv">' + md(f.v, ago) + '</div>' +
             '</div>';
    }).join('') + '</div>';
  }
  if (e.image) extra += '<img class="big-img" src="' + e.image + '" alt="" data-fb="">';
  if (e.footer) extra += '<div class="foot">' + esc(e.footer) + '</div>';

  return '<div class="emb">' +
           '<div style="background:' + e.color + '"></div>' +
           '<div class="in">' +
             '<div class="body">' + body + '</div>' +
             right + extra +
           '</div>' +
         '</div>';
}

function buttonsHTML(row) {
  return '<div class="dc-row">' + row.map(function (b) {
    /* A label of "" is deliberate: the notifications row is five emoji-only
       buttons (ChannelService.fullblessRoleButtons passes " " as the label). */
    var bare = !b.label;
    return '<button class="dc-btn ' + (b.style || 'secondary') + (bare ? ' bare' : '') + '"' +
           (b.disabled ? ' disabled' : '') +
           (b.act ? ' data-act="' + b.act + '"' : '') + '>' +
           (b.emoji ? (UNI[b.emoji] ? uni(b.emoji) : custom(b.emoji)) : '') +
           (bare ? '' : ' ' + esc(b.label)) + '</button>';
  }).join('') + '</div>';
}

/* Discord answers a button press with an ephemeral message — visible only to
   whoever pressed, and labelled as such. That is the real feedback for a role
   button, which is why the demo shows one instead of inventing a state marker
   on the embed (the embed does not change in Discord either). */
function ephemeralHTML(text) {
  return '<div class="dc-eph"><div class="body">' + md(text, 0) + '</div>' +
         '<div class="tag">Only you can see this · <span>Dismiss message</span></div></div>';
}

/* A message is one avatar+header block plus its embeds/text/buttons.
   Discord groups consecutive posts by the same author, which the demos
   reproduce by marking a message `join: true`. */
function messageHTML(m, flash) {
  var h = '<div class="msg' + (flash ? ' new' : '') + '">' +
            '<img class="av" src="assets/img/avatar.png" alt="" data-fb="">' +
            '<div class="hd">' +
              '<span class="who">Violent Bot</span>' +
              '<span class="bot">&#10003; BOT</span>' +
              '<span class="ts">' + clock(m.ago) + '</span>' +
            '</div>';
  if (m.text) h += '<div class="dc-md">' + md(m.text, m.ago) + '</div>';
  (m.embeds || []).forEach(function (e) { h += embedHTML(e, m.ago); });
  if (m.buttons) h += buttonsHTML(m.buttons);
  if (m.ephemeral) h += ephemeralHTML(m.ephemeral);
  return h + '</div>';
}

function messagesHTML(list, flashLast) {
  return list.map(function (m, i) {
    return messageHTML(m, flashLast && i === list.length - 1);
  }).join('');
}

/* =====================================================================
   7. CHANNEL DEFINITIONS
   Names verbatim from tibia-bot @ dev:
     setup/ChannelService.scala  — every text channel and both categories
     respawn/RespawnThreads.scala:33 — the spawns forum
   ===================================================================== */
var CH = {
  online:   { icon: '📈', nm: 'ᴏɴʟɪɴᴇ',
              topic: 'Who is on right now, and whose side they are on.' },
  allies:   { icon: '🤍', nm: 'ᴀʟʟɪᴇs', hidden: true,
              topic: 'Allies online.' },
  enemies:  { icon: '☠️', nm: 'ᴇɴᴇᴍɪᴇs', hidden: true,
              topic: 'Enemies online.' },
  neutrals: { icon: '📈', nm: 'ɴᴇᴜᴛʀᴀʟs', hidden: true,
              topic: 'Everybody else online.' },
  deaths:   { icon: '💀', nm: 'ᴅᴇᴀᴛʜs',
              topic: 'Every death on the server, coloured by whose side they were on.' },
  levels:   { icon: '💖', nm: 'ʟᴇᴠᴇʟs',
              topic: 'Every advancement on the server.' },
  activity: { icon: '📝', nm: 'ᴀᴄᴛɪᴠɪᴛʏ',
              topic: 'Guild joins, leaves, swaps, renames and world transfers.' },
  stats:    { icon: '📊', nm: 'sᴛᴀᴛɪsᴛɪᴄs',
              topic: 'What the world did yesterday, posted after server save.' },
  log:      { icon: '🖥️', nm: 'ᴄᴏᴍᴍᴀɴᴅ ʟᴏɢ',
              topic: 'Every command run, and every enemy the bot found on its own.' },
  notify:   { icon: '👑', nm: 'ɴᴏᴛɪғɪᴄᴀᴛɪᴏɴs',
              topic: 'Roles, boosted boss and creature, satchel cooldowns.' },
  spawns:   { icon: '📅', nm: 'sᴘᴀᴡɴs', forum: true,
              topic: 'One post per respawn, showing who is on it and who is next.' }
};

/* =====================================================================
   7b. PITCH COPY

   The blurb and paragraph index.html currently carries on each accordion
   row. Kept here rather than in the page so the copy follows whichever
   channel is selected; the shell writes it into #chanBlurb / #chanCopy
   when those elements exist, and does nothing when they do not (the lab
   has no such elements).
   ===================================================================== */
var COPY = {
  online: {
    blurb: 'Who’s on, right now',
    body: 'Run it <code>combined</code> for a single online channel, or <code>separate</code> for dedicated ' +
          'channels for <b class="good">allies</b>, <b class="bad">enemies</b> and <b class="mute">neutrals</b>. ' +
          'The channel name carries the headcount, so the sidebar is a dashboard.'
  },
  deaths: {
    blurb: 'The one you’ll actually watch',
    body: 'Every death on the server, marked by whether the character was an <b class="bad">enemy</b>, an ' +
          '<b class="good">ally</b> or a <b class="mute">neutral</b>, and whether it was a PvE death or a PvP kill. ' +
          'The colour is the news, not the allegiance — an enemy dying is good news, so it is green. ' +
          'When one of yours is killed, <code>/exiva</code> lists the killers underneath, ready to copy ' +
          'straight into the client.'
  },
  levels: {
    blurb: 'Every advancement on the server',
    body: 'A channel that shows all level advancements on the server. Use <code>/filter</code> to put a floor ' +
          'under it and keep the low-level churn out.'
  },
  activity: {
    blurb: 'Guild joins, leaves, name changes',
    body: 'Tracks who joined which guild, who left, who swapped, who transferred in from another server and ' +
          'who changed their name. Here the colour <em>is</em> the allegiance — the reverse of the deaths feed.'
  },
  stats: {
    blurb: 'What the world did yesterday',
    body: 'After every server save the bot posts the day’s top experience gained and lost, the best skill ' +
          'advance, the PVP tally with who killed whom, and what the world killed most of.'
  },
  spawns: {
    blurb: 'Book a respawn before someone else does',
    body: 'Set up respawn claims for your server so everyone can schedule hunts ahead of time. Every respawn ' +
          'gets its own post, showing at a glance whether it is <b class="good">free</b> or ' +
          '<b class="bad">claimed</b>, who has it and when they finish. There is a web dashboard too.'
  },
  notify: {
    blurb: 'Only the events you ask for',
    body: 'Five things you can subscribe to: an enemy dying <code>fullbless</code>, anyone dying to a rare ' +
          '<code class="purple">nemesis boss</code>, an ally getting pked, a mass log on your world, and a ' +
          'character you are watching logging in. The last two message you directly instead of pinging a channel.'
  },
  log: {
    blurb: 'Commands + automatic enemy detection',
    body: 'Every command run through the bot is logged here — as is every enemy the bot detected on its ' +
          'own. Kill an ally and the bot adds you to the hunted list without anybody lifting a finger.'
  }
};
/* The three online sub-channels share the combined channel's pitch. */
COPY.allies = COPY.enemies = COPY.neutrals = COPY.online;

/* =====================================================================
   8. DEMOS
   Each demo exposes:
     build()   -> the messages currently visible, given its own state
     controls  -> the control strip HTML (site language, not Discord's)
     wire(el)  -> bind those controls
     tick()    -> one autoplay step, or null for a channel that is not a feed
   ===================================================================== */
var Demos = {};

/* ---------------------------------------------------------------------
   #deaths — TibiaBot.scala:1078-1325, presentation/DeathEmbeds.scala
   ------------------------------------------------------------------ */
Demos.deaths = (function () {
  /* No control strip any more, so these are what the channel shows.
     exiva is on because the block is worth seeing; 20 is the bot's own
     default for deaths_min. */
  var st = { min: 20, exiva: true, neutral: 'show' };
  var pool = [], cursor = 0;

  function make(i) {
    var r = rng(i * 7919 + 13);

    /* Every sixth death is one of yours, killed by players. Left to chance
       that case is about one row in thirteen, so a ten-row window often
       showed none of it — and it is the case the channel exists for: the
       red embed, the list of who did it, and the exiva block under it. */
    var allyPk = i % 6 === 2;
    var c = allyPk ? allyAt(i) : charAt(i * STRIDE.deaths);

    /* The character's own level drifts a little each appearance, so a
       familiar name is not frozen at one number all session. */
    var lvl = Math.max(8, c.level + between(r, -6, 6));
    var pvp = allyPk || r() < 0.34;
    var boss = !pvp && r() < 0.08;
    var envr = !pvp && !boss && r() < 0.12;
    var suicide = !pvp && !boss && !envr && r() < 0.05;

    /* DeathEmbeds colours. Note these are the INVERSE of the activity
       channel's: here the colour is the news, so an enemy dying is green.
       TibiaBot.scala:1113-1119. */
    var col = c.side === 'ally' ? C.red
            : c.side === 'enemy' ? C.green
            : (c.guild ? C.greyGuild : C.brand);

    var verb = pvp ? 'Killed' : 'Died';
    var killers, thumb, exiva = null;

    if (pvp) {
      var n = 1 + Math.floor(r() * r() * 5);
      var ks = [];
      for (var k = 0; k < n; k++) {
        var other = charAt(i * STRIDE.deaths + 1 + k * 7);
        if (other.name !== c.name && ks.indexOf(other) < 0) ks.push(other);
      }
      if (!ks.length) ks.push(charAt(i + 3));
      var parts = ks.map(function (x) {
        return '**[' + x.name + ' [' + killerLevel(r, lvl) + ']](#)**';
      });
      killers = parts.length === 1 ? parts[0]
              : parts.slice(0, -1).join(', ') + ' and ' + parts[parts.length - 1];
      thumb = PVP_GIF;
      exiva = ks.slice(0, 3).map(function (x) { return x.name; });
      /* A neutral killed by a player goes bone white (TibiaBot.scala:1166). */
      if (c.side === 'neutral') col = C.bone;
    } else if (boss) {
      var b = pick(r, BOSSES);
      killers = '<:nemesis:>**' + b.n + '**';
      thumb = creatureImg(b.f);
      col = C.purple;
    } else if (suicide) {
      killers = '`suicide`';
      thumb = SUICIDE_GIF;
    } else if (envr) {
      var ef = pick(r, EFFECTS);
      killers = '**' + ef.n + '**';
      thumb = ef.f;
    } else {
      var fits = CREATURES.filter(function (x) { return lvl >= x.lo && lvl <= x.hi; });
      var cr = pick(r, fits.length ? fits : CREATURES);
      killers = (/^[aeiou]/.test(cr.n) ? 'an ' : 'a ') + '**' + cr.n + '**';
      thumb = creatureImg(cr.f);
    }

    return {
      side: c.side, lvl: lvl, col: col, voc: c.voc, name: c.name, thumb: thumb, exiva: exiva,
      desc: guildLine(c) + verb + ' <t:0:R> at level ' + lvl + '\nby ' + killers + '.'
    };
  }

  function fx(i) { if (!pool[i]) pool[i] = make(i); return pool[i]; }

  var posted = [];
  (function seed() {
    var t = 5400;
    for (var i = 0; i < 11; i++) { posted.push({ i: i, ago: t }); t -= Math.round(t * 0.19) + 90; }
    cursor = 11;
  })();

  function visible(p) {
    var f = fx(p.i);
    if (f.lvl < st.min) return false;
    if (f.side === 'neutral' && st.neutral === 'hide') return false;
    return true;
  }

  return {
    ch: 'deaths',
    build: function () {
      var shown = posted.filter(visible);
      if (!shown.length) return null;
      var out = [], last = null, count = 0;
      shown.forEach(function (p) {
        var f = fx(p.i);
        var d = f.desc;
        if (st.exiva && f.side === 'ally' && f.exiva) {
          f.exiva.forEach(function (n, k) {
            d += '\n' + (k === 0 ? '<:exiva:>' : '<:indent:>') + ' `exiva "' + n + '"`';
          });
        }
        var e = {
          color: f.col, title: vc(f.voc) + ' ' + f.name + ' ' + vc(f.voc),
          desc: d, thumb: f.thumb
        };
        if (last && count < 3 && Math.abs(last.ago - p.ago) < 420) { last.embeds.push(e); count++; }
        else { last = { ago: p.ago, embeds: [e] }; out.push(last); count = 1; }
      });
      return out;
    },
    empty: function () {
      return '<div class="dc-empty"><b>Nothing gets past your filters.</b><br>' +
             'Every death on the server right now is below level ' + st.min + '.</div>';
    },
    tick: function () {
      posted.forEach(function (p) { p.ago += 6; });
      posted.push({ i: cursor++, ago: 2 });
      if (posted.length > 15) posted.shift();
    }
  };
})();

/* ---------------------------------------------------------------------
   #levels — TibiaBot.scala:814
     "{voc} **[name](url)** advanced to {levelup} level **{n}** {guildIcon}"
   ------------------------------------------------------------------ */
Demos.levels = (function () {
  var st = { min: 8, neutral: 'show' };
  var pool = [], cursor = 0;

  function make(i) {
    var r = rng(i * 6151 + 97);
    var c = charAt(i * STRIDE.levels);
    return {
      side: c.side,
      lvl: Math.max(8, c.level + between(r, 1, 9)),
      voc: c.voc,
      name: c.name,
      icon: sideIcon(c)
    };
  }

  function fx(i) { if (!pool[i]) pool[i] = make(i); return pool[i]; }

  var posted = [];
  (function seed() {
    var t = 4200;
    for (var i = 0; i < 16; i++) { posted.push({ i: i, ago: t }); t -= Math.round(t * 0.15) + 60; }
    cursor = 16;
  })();

  function visible(p) {
    var f = fx(p.i);
    if (f.lvl < st.min) return false;
    if (f.side === 'neutral' && st.neutral === 'hide') return false;
    return true;
  }

  return {
    ch: 'levels',
    build: function () {
      var shown = posted.filter(visible);
      if (!shown.length) return null;
      var out = [], last = null, count = 0;
      shown.forEach(function (p) {
        var f = fx(p.i);
        var line = vc(f.voc) + ' **[' + f.name + '](#)** advanced to <:levelup:> level **' +
                   f.lvl + '**' + (f.icon ? ' ' + f.icon : '');
        if (last && count < 7 && Math.abs(last.ago - p.ago) < 400) {
          last.text += '\n' + line; count++;
        } else {
          last = { ago: p.ago, text: line }; out.push(last); count = 1;
        }
      });
      return out;
    },
    empty: function () {
      return '<div class="dc-empty"><b>Quiet.</b><br>Nobody on the server has advanced past level ' +
             st.min + ' lately.</div>';
    },
    tick: function () {
      posted.forEach(function (p) { p.ago += 6; });
      posted.push({ i: cursor++, ago: 2 });
      if (posted.length > 22) posted.shift();
    }
  };
})();

/* ---------------------------------------------------------------------
   #activity — TibiaBot.scala:412, 520, 567, 583, 683
   Five event types. Every thumbnail is already in this repo, and the
   colours come from presentation/GuildActivity.activityColor.
   ------------------------------------------------------------------ */
Demos.activity = (function () {
  var st = { kinds: { join: 1, leave: 1, swap: 1, rename: 1, transfer: 1 } };
  var pool = [], cursor = 0;

  var THUMB = {
    join:     { ally: 'guildjoingreen.png',  enemy: 'guildjoinred.png',  neutral: 'guildjoingrey.png' },
    swap:     { ally: 'guildswapgreen.png',  enemy: 'guildswapred.png',  neutral: 'guildswapgrey.png' },
    leave:    { ally: 'guildleaveyellow.png', enemy: 'guildleaveyellow.png', neutral: 'guildleaveyellow.png' },
    rename:   { ally: 'namechange.png',      enemy: 'namechange.png',    neutral: 'namechange.png' },
    transfer: { ally: 'worldtransfergreen.png', enemy: 'worldtransferred.png', neutral: 'worldtransfergrey.png' }
  };
  /* Rename targets. Deliberately outside ROSTER: renaming onto a name
     another character already holds would show two of the same person
     across the client. */
  var NEW_NAMES = ['Vanta Kess', 'Nyx Ravencourt', 'Sable Orin',
                   'Quill Marrow', 'Zeph Ardent', 'Wren Halcyon', 'Bramble Coe'];
  var OTHER_WORLDS = ['Pulsera', 'Flamera', 'Secura', 'Monza', 'Vunira', 'Harmonia'];

  function make(i) {
    var r = rng(i * 4099 + 31);
    var kind = pick(r, ['join', 'join', 'leave', 'swap', 'rename', 'transfer']);
    var c = charAt(i * STRIDE.activity);
    var lvl = Math.max(20, c.level + between(r, -4, 4));

    /* GuildActivity.activityColor — hunted red, allied green, else yellow.
       The OPPOSITE pairing to #deaths, where the colour is the news. */
    var col = c.side === 'enemy' ? C.red : c.side === 'ally' ? C.green : C.yellow;
    var label = c.side === 'ally' ? 'allied' : c.side === 'enemy' ? 'hunted' : 'neutral';
    var g = c.guild || pick(r, GUILDS.neutral);

    var lead = vc(c.voc) + ' **' + lvl + '** — **[' + c.name + '](#)**';
    var desc;
    if (kind === 'join')       desc = lead + ' joined the **' + label + '** guild **[' + g + '](#)**.';
    else if (kind === 'leave') desc = lead + ' has left the **' + label + '** guild **[' + g + '](#)**.';
    else if (kind === 'swap')  desc = lead + ' has left the **' + label + '** guild **[' + g +
                                      '](#)** and joined the guild **[' + pick(r, GUILDS.neutral) + '](#)**.';
    else if (kind === 'rename') {
      desc = lead + ' changed their **name** to **[' + pick(r, NEW_NAMES) + '](#)**.';
    } else {
      desc = lead + ' transferred in from **' + pick(r, OTHER_WORLDS) + '**.';
    }
    return { kind: kind, side: c.side, col: col, desc: desc, thumb: THUMB[kind][c.side] };
  }

  function fx(i) { if (!pool[i]) pool[i] = make(i); return pool[i]; }

  var posted = [];
  (function seed() {
    var t = 21000;
    for (var i = 0; i < 10; i++) { posted.push({ i: i, ago: t }); t -= Math.round(t * 0.22) + 300; }
    cursor = 10;
  })();

  return {
    ch: 'activity',
    build: function () {
      var shown = posted.filter(function (p) { return st.kinds[fx(p.i).kind]; });
      if (!shown.length) return null;
      var out = [], last = null, count = 0;
      shown.forEach(function (p) {
        var f = fx(p.i);
        var e = { color: f.col, desc: f.desc, thumb: f.thumb };
        if (last && count < 3 && Math.abs(last.ago - p.ago) < 900) { last.embeds.push(e); count++; }
        else { last = { ago: p.ago, embeds: [e] }; out.push(last); count = 1; }
      });
      return out;
    },
    empty: function () {
      return '<div class="dc-empty"><b>No events of that kind.</b><br>Turn a filter back on above.</div>';
    },
    tick: function () {
      posted.forEach(function (p) { p.ago += 12; });
      posted.push({ i: cursor++, ago: 4 });
      if (posted.length > 13) posted.shift();
    }
  };
})();

/* ---------------------------------------------------------------------
   #online — TibiaBot.scala:1531 (the row), presentation/
   OnlineListGrouping.scala (the headers and the combined body)
   ------------------------------------------------------------------ */
Demos.online = (function () {
  var st = { mode: 'combined', view: 'online' };
  var roster = [];

  /* Who happens to be online: a slice of the same roster every other
     channel uses, so a name in #deaths is a name you can find here. */
  (function seed() {
    var r = rng(31337);
    ROSTER.forEach(function (c) {
      if (r() < 0.78) {
        roster.push({
          name: c.name, voc: c.voc, lvl: c.level, side: c.side, guild: c.guild,
          dur: between(r, 60, 21000),
          levelled: r() < 0.16
        });
      }
    });
    roster.sort(function (x, y) { return y.lvl - x.lvl; });
  })();

  /* presentation/OnlineListEmbeds.durationString */
  function duration(sec) {
    var m = Math.floor(sec / 60);
    return '`' + (m >= 60 ? Math.floor(m / 60) + 'hr ' + (m % 60) + 'min' : m + 'min') + '`';
  }
  function line(p) {
    var masslog = p.side === 'enemy' && p.dur < 600 ? ' :zap:'
                : p.side === 'enemy' && p.dur > 18000 ? ' :zzz:' : '';
    return vc(p.voc) + ' **' + p.lvl + '** — **[' + p.name + '](#)** ' +
           sideIcon(p) + ' ' + duration(p.dur) +
           (p.levelled ? ' <:levelup:>' : '') + masslog;
  }
  function of(side) { return roster.filter(function (p) { return p.side === side; }); }

  function counts() { return { a: of('ally').length, e: of('enemy').length, n: of('neutral').length }; }

  return {
    ch: 'online',
    fromTop: true,
    counts: counts,
    mode: function () { return st.mode; },
    setView: function (v) { st.view = v; },
    build: function () {
      var a = of('ally'), e = of('enemy'), n = of('neutral');
      var body;

      if (st.mode === 'separate') {
        var grp = st.view === 'allies' ? a : st.view === 'enemies' ? e : n;
        if (!grp.length) return null;
        body = grp.map(line).join('\n');
      } else {
        /* OnlineListGrouping.combinedChannelBody + withHeaders */
        var parts = [];
        parts.push('### <:ally:> **Allies** <:ally:> ' + a.length);
        parts = parts.concat(a.map(line));
        parts.push('### <:enemy:> **Enemies** <:enemy:> ' + e.length);
        parts = parts.concat(e.map(line));

        var byGuild = {};
        n.forEach(function (p) { (byGuild[p.guild] = byGuild[p.guild] || []).push(p); });
        var named = Object.keys(byGuild).filter(function (g) { return g && byGuild[g].length >= 3; });
        named.sort(function (x, y) { return byGuild[y].length - byGuild[x].length; });
        var loose = [];
        Object.keys(byGuild).forEach(function (g) {
          if (named.indexOf(g) < 0) loose = loose.concat(byGuild[g]);
        });
        named.forEach(function (g) {
          parts.push('### [' + g + '](#) ' + byGuild[g].length);
          parts = parts.concat(byGuild[g].map(line));
        });
        if (loose.length) {
          parts.push('### Others ' + loose.length);
          parts = parts.concat(loose.map(line));
        }
        body = parts.join('\n');
      }
      return [{ ago: 40, text: body }];
    },
    empty: function () { return '<div class="dc-empty"><em>Nobody is online right now.</em></div>'; },
    tick: function () {
      /* Durations tick, and now and then somebody logs in or out. */
      roster.forEach(function (p) { p.dur += 60; });
      var r = rng((ROTATION += 1) * 104729);
      if (r() < 0.5) {
        var p = roster[Math.floor(r() * roster.length)];
        if (p) p.dur = between(r, 30, 200);
      }
      return true;
    }
  };
})();

/* ---------------------------------------------------------------------
   #statistics — presentation/StatisticsEmbeds.scala + PvpEmbeds.scala
   One daily post, not a feed: three embeds sent after server save.
   ------------------------------------------------------------------ */
Demos.stats = (function () {
  /* presentation/StatLines.who — vocation, linked name, side icon. */
  function who(c) {
    var icon = sideIcon(c);
    return vc(c.voc) + ' **[' + c.name + '](#)**' + (icon ? ' ' + icon : '');
  }
  /* presentation/StatLines.Dot */
  var DOT = ' · ';
  function cells() {
    return [].slice.call(arguments).filter(Boolean).join(DOT);
  }
  /* Two DIFFERENT icons. The board shows no sign on the figure — the
     rising and falling icons are what say which direction it went, so
     using levelup for both made every loss read as a gain. */
  var XP_UP = '<:levelup:>', XP_DOWN = '<:lvldown:>';

  var day = (function () {
    var d = new Date(Date.now() - 86400000);
    return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  })();

  /* Drawn from the shared roster, so a name here carries the same
     vocation and the same side it carries in every other channel. */
  var board = (function () {
    var r = rng(77003);
    var used = {};
    /* Only characters who could plausibly post these figures. A level-25
       druid has under 20k experience to its name, so putting one at the
       top of a 33-million-experience board is the kind of detail a Tibia
       player spots instantly. */
    function take(minLevel) {
      var eligible = ROSTER.filter(function (c) {
        return !used[c.name] && c.level >= (minLevel || 0);
      });
      var c = eligible.length ? eligible[Math.floor(r() * eligible.length)] : someone(r);
      used[c.name] = 1;
      return c;
    }
    var gains = [], losses = [];
    var xp = 44000000;
    for (var i = 0; i < 8; i++) {
      gains.push({ c: take(300), xp: xp });
      xp = Math.round(xp * (0.82 + r() * 0.1));
    }
    /* Experience lost is a death, so it has to be a fraction of what the
       character actually holds rather than a number picked in a vacuum. */
    var lost = 11000000;
    for (var j = 0; j < 3; j++) {
      losses.push({ c: take(350), xp: lost });
      lost = Math.round(lost * 0.45);
    }
    return { gains: gains, losses: losses, skill: take(300),
             fraggers: [take(250), take(250), take(250)],
             repeat: take(250), topKill: take(400) };
  })();

  /* The day's frags, as presentation/Bars reads them: each side's summed
     victim levels and its body count, against what an ordinary character
     on this world is worth and what a full bar costs. */
  var FRAGS = {
    enemiesKilled: 14, enemyLevels: 5600,
    alliesKilled: 6,   allyLevels: 2100,
    referenceLevel: 250,  /* the world's average level      */
    ceiling: 110          /* Bars.ceilingFor(~1100 online)  */
  };

  /* presentation/Bars.split, ported.

     Twelve segments. How much is coloured says how big the day was on a
     log scale — a handful of frags is a real day and should look like
     one, while forty versus fifty is worth almost nothing. Where the
     colour changes says who won: green is enemies killed, red is allies.
     Neither side vanishes while it has anything at all, because a bar
     that reads as a clean sweep on a day somebody died is a lie. */
  function weigh(levels, deaths, reference) {
    return levels > 0 ? levels / Math.max(1, reference) : deaths;
  }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function bar(f, segments) {
    segments = segments || 12;
    var left = weigh(f.enemyLevels, f.enemiesKilled, f.referenceLevel);
    var right = weigh(f.allyLevels, f.alliesKilled, f.referenceLevel);
    var total = left + right;
    var filled = total <= 0 ? 0
      : clamp(Math.round(Math.log(1 + total) / Math.log(1 + Math.max(2, f.ceiling)) * segments), 1, segments);
    var leftSegments = total <= 0 ? 0
      : clamp(Math.round(left / total * filled), left > 0 ? 1 : 0, filled - (right > 0 ? 1 : 0));
    var out = '';
    for (var i = 0; i < segments; i++) {
      var colour = i < leftSegments ? 'green' : i < filled ? 'red' : 'empty';
      var shape = i === 0 ? 'start' : i === segments - 1 ? 'end' : 'mid';
      out += '<:' + colour + '_' + shape + ':>';
    }
    return out;
  }

  function build() {
    var lines = ['## <a:news:> [' + day + '](#)', '### Top Experience Gained'];
    board.gains.forEach(function (g) {
      lines.push(cells(who(g.c), '*' + g.c.level + '*',
                       XP_UP + ' **' + g.xp.toLocaleString('en-US') + '**'));
    });
    lines.push('### Top Experience Lost');
    board.losses.forEach(function (g) {
      lines.push(cells(who(g.c), '*' + g.c.level + '*',
                       XP_DOWN + ' **' + g.xp.toLocaleString('en-US') + '**'));
    });
    lines.push('### Top Skill Advancement');
    /* HighscoreCategory.advancement: "{label} level **{score}**",
       led by SkillEmojis.icon for the category. */
    lines.push(cells(who(board.skill), '*' + board.skill.level + '*',
                     '<a:skillshield:> Shielding level **121**'));

    var pvp = [
      '## :dagger: PVP',
      bar(FRAGS),
      '**' + FRAGS.enemiesKilled + '** enemies killed vs **' + FRAGS.alliesKilled + '** allies killed',
      '### Most Kills'
    ];
    [5, 4, 3].forEach(function (n, i) {
      pvp.push(cells(who(board.fraggers[i]), '**' + n + ' kills**'));
    });
    pvp.push('### Most Deaths');
    pvp.push(cells(who(board.repeat), '*' + board.repeat.level + '*', '**3 deaths**'));
    pvp.push('### Top Enemy Killed');
    pvp.push(cells(who(board.topKill), '*' + board.topKill.level + '*', '[:link:](#)'));

    var creatures = [
      '## <:creature:> Creature Kills',
      '**184,207** [Flimsy Lost Souls](#)',
      '**91,442** [Cobra Assassins](#)',
      '**64,018** [Burster Spectres](#)',
      '**41,330** [Grim Reapers](#)',
      '## <:gold:> Special Kills',
      '**12** [Soul War bosses](#)',
      '**3** [Plunder Patriarchs](#)'
    ];

    /* presentation/BossPredictionEmbeds — which bosses history says could
       be up today. A green dot is a high chance, yellow a maybe; the count
       after a name is how many of that boss's spawn points are due, since
       "two of four Rotworm Queens" is a different trip from one. */
    var bosses = [
      '## <:boss:> Bosses Due',
      ':green_circle: <:nemesis:> **Ferumbras**' + DOT + 'window closes <t:172800:R>',
      ':green_circle: <:nemesis:> **Zulazza the Corruptor**' + DOT + 'overdue since <t:-10800:R>',
      ':yellow_circle: <:nemesis:> **Rotworm Queen** ×2' + DOT + 'opens <t:86400:R>',
      ':yellow_circle: <:nemesis:> **Ghazbaran**' + DOT + 'opens <t:259200:R>'
    ];

    return [{
      ago: 7400,
      embeds: [
        { color: C.green,  desc: lines.join('\n') },
        { color: C.red,    desc: pvp.join('\n') },
        { color: C.yellow, desc: creatures.join('\n') },
        { color: C.purple, desc: bosses.join('\n'), footer: '3 boss(es) not yet predicted' }
      ]
    }];
  }

  return {
    ch: 'stats',
    fromTop: true,
    build: build,
    tick: null
  };
})();

/* ---------------------------------------------------------------------
   #notifications

   Exactly two things live here, and nothing else:

   1. The role-subscription embed, ONE PER WORLD, posted by /setup and
      edited by /fullbless — setup/ChannelService.scala:350 for the text
      and :335 for the buttons. Five buttons in one row, all emoji and no
      label. The first three toggle a role that gets pinged in a channel;
      the last two open a form for a standing DM subscription instead,
      which is why the footer does not say "add or remove yourself".

   2. The server-save message, ONE PER GUILD, deleted and re-posted every
      save (BotApp.repostBoostedMessages): boosted boss, boosted creature,
      Rashid, that guild's Dream Courts boss, and the Drome cycle when it
      is due — five embeds on one message under a single button.
   ------------------------------------------------------------------ */
Demos.notify = (function () {
  /* Which roles this viewer holds. The three channel-ping roles toggle on
     the spot; masslog and bounty are DM subscriptions and open a form, so
     they are shown as opening something rather than as toggling. */
  var st = { roles: {}, opened: null };

  /* Order, emoji and wording all from fullblessRoleEmbed. */
  var ROLES = [
    { id: 'fullbless', emoji: 'inq',     name: 'Fullbless',
      line: 'If an enemy fullblesses and is over level `250`', kind: 'role', style: 'success' },
    { id: 'nemesis',   emoji: 'boss',    name: 'Nemesis',
      line: 'If anyone dies to a rare boss', kind: 'role', style: 'primary' },
    { id: 'allypk',    emoji: 'hazard',  name: 'Ally PK',
      line: 'If an ally gets pked', kind: 'role', style: 'danger' },
    { id: 'masslog',   emoji: 'masslog', name: 'Mass Log',
      line: 'If enough enemies log in at once on **' + WORLD + '**', kind: 'dm', style: 'secondary' },
    { id: 'bounty',    emoji: 'bounty',  name: 'Bounty',
      line: "If a character you're watching `logs in` on **" + WORLD + '**', kind: 'dm', style: 'secondary' }
  ];

  return {
    ch: 'notify',
    /* Only two messages live here, and the role row is the one worth
       reaching first, so the channel opens on it rather than on the
       server-save block below. */
    fromTop: true,
    build: function () {
      var msgs = [];

      /* ---- 1. the role embed, one per world ---- */
      msgs.push({
        ago: 92000,
        embeds: [{
          color: C.brand,
          title: ':crossed_swords: ' + WORLD + ' :crossed_swords:',
          desc: ROLES.map(function (r) {
            return '<:' + r.emoji + ':>@' + r.name + '@ ' + r.line;
          }).join('\n'),
          thumb: 'Phantasmal_Ooze.gif',
          footer: 'Use the buttons below to set these up:'
        }],
        buttons: ROLES.map(function (r) {
          return { style: r.style, label: '', emoji: r.emoji, act: 'role-' + r.id };
        }),
        ephemeral: st.reply
      });

      /* ---- 2. the server-save message, five embeds, one button ---- */
      msgs.push({
        ago: 41000,
        embeds: [
          { color: C.brand, thumb: creatureImg('The_Sandking'),
            desc: 'The boosted boss today is:\n### <:indent:><:archfoe:> **[The Sandking](#)**' },
          { color: C.brand, thumb: creatureImg('Death_Blob'),
            desc: 'The boosted creature today is:\n### <:indent:><:levelup:> **[Death Blob](#)**' },
          { color: C.brand, thumb: creatureImg('Rashid'),
            desc: 'Today Rashid can be found in:\n### <:indent:><:gold:> **[Carlin](#)**' },
          { color: C.brand, thumb: creatureImg('Izcandar_the_Banished'),
            desc: 'The Dream Courts boss for **' + WORLD + '** is:\n### <:indent:><a:dreamscar:> **[Izcandar the Banished](#)**' },
          { color: C.brand, thumb: creatureImg('Phant'),
            desc: 'The current Drome cycle will end:\n### <:indent:><:drome:> <t:190000:R>' }
        ],
        buttons: [{ style: 'primary', label: 'Server Save Notifications', emoji: 'letter' }]
      });

      return msgs;
    },
    tick: null,
    act: function (a) {
      if (a.indexOf('role-') !== 0) return false;
      var id = a.slice(5);
      var role = ROLES.filter(function (r) { return r.id === id; })[0];
      if (!role) return false;

      if (role.kind === 'dm') {
        /* Masslog and Bounty open a modal rather than toggling on the spot;
           the role follows whatever the form settles on. A real modal would
           cover the client and hide the thing being demonstrated, so the
           demo says what the form is for instead. */
        st.reply = '<:' + role.emoji + ':> **' + role.name + '** opens a form: pick a threshold, ' +
                   'and the bot DMs you instead of pinging a channel.';
      } else {
        st.roles[id] = !st.roles[id];
        st.reply = st.roles[id]
          ? '<:' + role.emoji + ':> You now have the @' + role.name + '@ role. ' +
            'You will be pinged ' + role.line.charAt(0).toLowerCase() + role.line.slice(1)
          : '<:' + role.emoji + ':> Removed the @' + role.name + '@ role.';
      }
      return true;
    }
  };
})();

/* ---------------------------------------------------------------------
   #command-log — AdminLog.scala, TibiaBot.scala:1364
   The replay is the demo: an ally dies, and the killer is added to the
   hunted list without anybody running a command.
   ------------------------------------------------------------------ */
Demos.log = (function () {
  var st = { step: 0 };

  /* Cast drawn from the shared roster, so the people in this story carry
     the same vocation and side they carry in every other channel. */
  function firstOf(side, n, skip) {
    return ROSTER.filter(function (c) { return c.side === side && c !== skip; }).slice(0, n);
  }
  var VICTIM = firstOf('ally', 1)[0];
  var KILLERS = firstOf('enemy', 3);
  var EARLIER_VICTIM = firstOf('ally', 2)[1];
  var EARLIER_KILLER = firstOf('enemy', 4)[3];
  var OPERATOR = 'Violent Beams';

  var HISTORY = [
    { ago: 30000, title: ':gear: a command was run:',
      desc: '@' + OPERATOR + '@ added the guild' + '\n' + '**[' + KILLERS[0].guild + '](#)**' + '\n' +
            'to the hunted list for **' + WORLD + '**.',
      col: C.brand },
    { ago: 24000, title: ':gear: a command was run:',
      desc: '@' + OPERATOR + '@ set the minimum level for the **deaths** channel to **20** for **' + WORLD + '**.',
      col: C.brand },
    { ago: 17000, title: ':robot: enemy automatically detected:',
      desc: '@Violent Bot@ added the player' + '\n' + vc(EARLIER_KILLER.voc) + ' **' + EARLIER_KILLER.level +
            '** — **[' + EARLIER_KILLER.name + '](#)**' + '\n' +
            'to the hunted list for **' + WORLD + '**.' + '\n' +
            '*(they killed the allied player **[' + EARLIER_VICTIM.name + '](#)***.',
      col: C.yellow }
  ];

  return {
    ch: 'log',
    build: function () {
      var msgs = HISTORY.map(function (h) {
        return { ago: h.ago, embeds: [{ color: h.col, title: h.title, plain: true, desc: h.desc,
                                        thumb: creatureImg('Dark_Mage_Statue') }] };
      });

      if (st.step >= 1) {
        msgs.push({
          ago: 40, replay: true,
          embeds: [{
            color: C.red,
            title: vc(VICTIM.voc) + ' ' + VICTIM.name + ' ' + vc(VICTIM.voc),
            desc: guildLine(VICTIM).slice(0, -1) + '\nKilled <t:0:R> at level ' + VICTIM.level +
                  '\nby ' + KILLERS.map(function (k) { return '**[' + k.name + ' [' + k.level + ']](#)**'; })
                    .slice(0, -1).join(', ') + ' and **[' + KILLERS[KILLERS.length - 1].name +
                  ' [' + KILLERS[KILLERS.length - 1].level + ']](#)**.',
            thumb: PVP_GIF
          }]
        });
      }
      if (st.step >= 2) {
        KILLERS.forEach(function (k, i) {
          msgs.push({
            ago: 20 - i * 4,
            embeds: [{
              color: C.yellow, title: ':robot: enemy automatically detected:', plain: true,
              desc: '@Violent Bot@ added the player\n' + vc(k.voc) + ' **' + k.level + '** — **[' + k.name + '](#)**\n' +
                    'to the hunted list for **' + WORLD + '**.\n*(they killed the allied player **[' +
                    VICTIM.name + '](#)***.',
              thumb: creatureImg('Dark_Mage_Statue')
            }]
          });
        });
      }
      return msgs;
    },
    tick: null,
    /* Opening the channel plays the chain: an ally is killed, and a beat
       later the bot adds every killer to the hunted list on its own. It
       used to be behind a Play button in the control strip; with that gone
       the channel tells its own story instead of sitting still. */
    onEnter: function (step) {
      st.step = 0;
      step(0);
      setTimeout(function () { step(1); }, 900);
      setTimeout(function () { step(2); }, 2800);
    },
    setStep: function (n) { st.step = n; }
  };
})();

/* ---------------------------------------------------------------------
   #spawns — respawn/RespawnThreads.scala (forum, tags, buttons),
   presentation/RespawnEmbeds.claimCard (the card itself)
   ------------------------------------------------------------------ */
Demos.spawns = (function () {
  var st = { filter: 'all', open: null, claims: {} };

  (function seed() {
    var r = rng(4242);
    SPAWNS.forEach(function (s, i) {
      if (i % 3 !== 0) {
        st.claims[s.code] = {
          /* Strided, not random: a uniform pick kept handing consecutive
             spawns to the same member, which reads as one person holding
             the whole board. */
          who: MEMBERS[(i * 3 + 1) % MEMBERS.length],
          start: between(r, 0, 20) * 30,
          mins: pick(r, [120, 180, 240]),
          left: between(r, 400, 7000),
          mine: false
        };
      }
    });
  })();

  function clockTime(mins) {
    var h = Math.floor(mins / 60) % 24, m = mins % 60;
    var ap = h >= 12 ? 'pm' : 'am';
    return (h % 12 || 12) + ':' + (m < 10 ? '0' : '') + m + ap;
  }

  return {
    ch: 'spawns',
    forum: true,
    fromTop: true,
    build: function () {
      var free = SPAWNS.filter(function (s) { return !st.claims[s.code]; }).length;
      var shown = SPAWNS.filter(function (s) {
        var c = !!st.claims[s.code];
        return st.filter === 'all' || (st.filter === 'free' ? !c : c);
      });

      /* Claimed first, free below. A respawn board is read to answer "is
         anyone on this, and when do they finish" — the taken ones carry
         that answer and the free ones are a flat list underneath. Within
         each group the catalogue order is kept, so a spawn does not move
         around under the reader between renders. */
      shown = shown.slice().sort(function (x, y) {
        var cx = st.claims[x.code] ? 0 : 1, cy = st.claims[y.code] ? 0 : 1;
        if (cx !== cy) return cx - cy;
        return SPAWNS.indexOf(x) - SPAWNS.indexOf(y);
      });

      var bar = '<div class="fr-bar">' +
        '<button class="fr-tag" data-tag="all" aria-pressed="' + (st.filter === 'all') + '">All</button>' +
        '<button class="fr-tag" data-tag="free" aria-pressed="' + (st.filter === 'free') + '">' +
          '<span class="dot" style="background:#2ecc71"></span>Free</button>' +
        '<button class="fr-tag" data-tag="claimed" aria-pressed="' + (st.filter === 'claimed') + '">' +
          '<span class="dot" style="background:#da373c"></span>Claimed</button>' +
        '<span class="fr-count">' + free + ' free of ' + SPAWNS.length + '</span></div>';

      var list = shown.map(function (s) {
        var c = st.claims[s.code];
        var open = st.open === s.code;
        var h = '<div class="fr-post" data-spawn="' + s.code + '" aria-expanded="' + open + '">' +
          '<div>' +
            '<span class="pill ' + (c ? 'claimed' : 'free') + '">' +
              '<span class="dot" style="background:' + (c ? '#da373c' : '#2ecc71') + '"></span>' +
              (c ? 'Claimed' : 'Free') + '</span>' +
            '<div class="pt">' + esc(s.code + ' — ' + s.name) + '</div>' +
            '<div class="pm">' + (c
              ? '<b>' + esc(c.who) + '</b> booked · ' + clockTime(c.start) + ' → ' + clockTime(c.start + c.mins)
              : s.region) + '</div>' +
          '</div>' +
          '<img class="pic" src="' + creatureImg(s.creature) + '" alt="" data-fb="">';

        if (open) {
          /* RespawnEmbeds.claimCard, and RespawnThreads.claimRow for the buttons */
          var card = {
            color: c ? C.red : C.free,
            title: s.code + ' — ' + s.name,
            plain: true,
            desc: c ? 'This respawn is currently being used by **' + c.who + '**.'
                    : 'This respawn is **free**.',
            footer: s.region
          };
          if (c) {
            card.fields = [
              { n: 'Hunt start', v: clockTime(c.start), inline: true },
              { n: 'Hunt end', v: clockTime(c.start + c.mins), inline: true },
              { n: 'Time left', v: '<t:' + c.left + ':R>', inline: true }
            ];
          }
          h += '<div class="fr-open">' + embedHTML(card, 0) + buttonsHTML(
            c ? [
              { style: 'primary', label: 'Next', emoji: 'zap' },
              { style: 'secondary', label: 'Bookings' },
              { style: 'secondary', label: 'Config' },
              { style: 'danger', label: 'Leave', act: 'leave-' + s.code }
            ] : [
              { style: 'success', label: 'Claim', emoji: 'daily', act: 'claim-' + s.code },
              { style: 'secondary', label: 'Bookings' },
              { style: 'secondary', label: 'Config' }
            ]) + '</div>';
        }
        return h + '</div>';
      }).join('');

      if (!shown.length) {
        list = '<div class="dc-empty"><b>Nothing here.</b><br>No respawn matches that tag right now.</div>';
      }
      return bar + '<div class="fr-list">' + list + '</div>';
    },
    tick: null,
    act: function (a) {
      if (a.indexOf('claim-') === 0) {
        var code = a.slice(6);
        var now = new Date();
        st.claims[code] = {
          who: 'you', mine: true,
          start: now.getHours() * 60 + now.getMinutes(),
          mins: 180, left: 10800
        };
        return true;
      }
      if (a.indexOf('leave-') === 0) { delete st.claims[a.slice(6)]; return true; }
      return false;
    },
    setFilter: function (f) { st.filter = f; },
    toggleOpen: function (code) { st.open = st.open === code ? null : code; }
  };
})();

/* =====================================================================
   9. SHELL
   ===================================================================== */
var Shell = (function () {
  var el = {}, active = 'deaths', timer = null, live = true, atBottom = true;

  var ORDER = [
    { cat: function () {
        var c = Demos.online.counts();
        return WORLD + '・🤍' + c.a + '💀' + c.e;
      } },
    'online', 'allies', 'enemies', 'neutrals',
    'deaths', 'levels', 'activity', 'stats',
    { cat: function () { return 'Violent Bot'; } },
    'log', 'notify', 'spawns'
  ];

  function chanName(id) {
    var c = CH[id], n = Demos.online.counts();
    var suffix = '';
    if (id === 'online') suffix = '-' + (n.a + n.e + n.n);
    if (id === 'allies') suffix = '-' + n.a;
    if (id === 'enemies') suffix = '-' + n.e;
    if (id === 'neutrals') suffix = '-' + n.n;
    return c.icon + '・' + c.nm + suffix;
  }

  function visibleChannels() {
    var sep = Demos.online.mode() === 'separate';
    return ORDER.filter(function (x) {
      if (typeof x !== 'string') return true;
      if (x === 'online') return !sep;
      if (x === 'allies' || x === 'enemies' || x === 'neutrals') return sep;
      return true;
    });
  }

  function sidebar() {
    el.chans.innerHTML = visibleChannels().map(function (x) {
      if (typeof x !== 'string') {
        return '<div class="dc-cat"><span class="arrow">▼</span>' + esc(x.cat()) + '</div>';
      }
      return '<button class="dc-chan" data-id="' + x + '" aria-current="' + (x === active) + '">' +
               '<span class="h">' + (CH[x].forum ? '≡' : '#') + '</span>' +
               '<span class="nm">' + esc(chanName(x)) + '</span></button>';
    }).join('');

    el.strip.innerHTML = visibleChannels().filter(function (x) { return typeof x === 'string'; })
      .map(function (x) {
        return '<button data-id="' + x + '" aria-current="' + (x === active) + '">' +
               esc(CH[x].icon + '・' + CH[x].nm) + '</button>';
      }).join('');
  }

  function demoFor(id) {
    if (id === 'allies' || id === 'enemies' || id === 'neutrals') return Demos.online;
    return Demos[id];
  }

  function render(flash) {
    var d = demoFor(active);
    el.name.textContent = chanName(active);
    el.topic.textContent = CH[active].topic;
    el.hash.textContent = CH[active].forum ? '≡' : '#';

    /* Only the integrated page has these; the lab does not. */
    var copy = COPY[active];
    if (copy) {
      if (el.blurb) el.blurb.textContent = copy.blurb;
      if (el.copy) el.copy.innerHTML = copy.body;
    }

    if (d.forum) {
      el.feed.innerHTML = d.build();
    } else {
      if (active === 'allies') Demos.online.setView('allies');
      if (active === 'enemies') Demos.online.setView('enemies');
      if (active === 'neutrals') Demos.online.setView('neutrals');
      var msgs = d.build();
      el.feed.innerHTML = msgs && msgs.length ? messagesHTML(msgs, flash) : d.empty();
    }
    fallbacks();
  }

  function fallbacks() {
    [].forEach.call(el.feed.querySelectorAll('img[data-fb]'), function (img) {
      img.onerror = function () {
        var fb = img.getAttribute('data-fb');
        if (fb) img.outerHTML = fb; else img.style.visibility = 'hidden';
      };
      img.onload = function () { if (atBottom && !demoFor(active).forum) bottom(); };
      if (img.complete && img.naturalWidth === 0) img.onerror();
    });
  }

  function bottom() { el.feed.scrollTop = el.feed.scrollHeight; atBottom = true; }

  function setLive(on) {
    live = on;
    if (timer) { clearInterval(timer); timer = null; }
    var d = demoFor(active);
    if (on && d.tick && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      timer = setInterval(function () {
        d.tick();
        var follow = atBottom, keep = el.feed.scrollTop;
        render(!d.fromTop);
        if (follow) bottom(); else el.feed.scrollTop = keep;
        if (active.indexOf('online') === 0 || CH[active].nm) sidebar();
      }, active === 'online' || active === 'allies' ? 4000 : 6000);
    }
  }

  function select(id) {
    if (!CH[id]) return;
    active = id;
    sidebar();
    render(false);
    if (demoFor(id).fromTop) { el.feed.scrollTop = 0; atBottom = false; }
    else { atBottom = true; bottom(); }
    setLive(true);

    var d = demoFor(id);
    if (d.onEnter) {
      d.onEnter(function (n) {
        if (active !== id) return;   /* they navigated away mid-sequence */
        d.setStep(n);
        render(n > 0);
        bottom();
      });
    }
  }

  return {
    init: function () {
      el.chans = document.getElementById('chans');
      el.strip = document.getElementById('strip');
      el.feed = document.getElementById('feed');
      el.name = document.getElementById('chName');
      el.topic = document.getElementById('chTopic');
      el.hash = document.getElementById('chHash');
      el.blurb = document.getElementById('chanBlurb');
      el.copy = document.getElementById('chanCopy');

      el.feed.addEventListener('scroll', function () {
        atBottom = el.feed.scrollHeight - el.feed.scrollTop - el.feed.clientHeight < 40;
      });

      [el.chans, el.strip].forEach(function (host) {
        host.addEventListener('click', function (ev) {
          var b = ev.target.closest('[data-id]');
          if (b) select(b.dataset.id);
        });
      });

      /* Discord components inside the feed */
      el.feed.addEventListener('click', function (ev) {
        var b = ev.target.closest('[data-act]');
        if (b && !b.disabled) {
          var d = demoFor(active);
          if (d.act && d.act(b.dataset.act)) { render(false); return; }
        }
        var tag = ev.target.closest('.fr-tag');
        if (tag) { Demos.spawns.setFilter(tag.dataset.tag); render(false); return; }
        var post = ev.target.closest('.fr-post');
        if (post && !ev.target.closest('.fr-open')) {
          Demos.spawns.toggleOpen(post.dataset.spawn);
          render(false);
        }
      });

      select('deaths');
    }
  };

})();

document.addEventListener('DOMContentLoaded', function () { Shell.init(); });
})();
