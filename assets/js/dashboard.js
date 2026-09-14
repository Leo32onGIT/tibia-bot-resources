/* =====================================================================
   The respawn dashboard, as the bot serves it at /dashboard.

   Ported from tibia-bot/src/main/resources/web/board.html.

   It reads the same SpawnState that #spawns writes to, so a claim made in
   either place shows up in the other. That is the whole argument for the
   web view existing, and it is the one thing a screenshot of it could
   never say.

   Where the two disagree is the point: Discord forum tags can only say
   Free or Claimed, so a spawn booked for tonight is tagged Free up there
   with the booking relegated to a field. Down here it is a blue card.
   ===================================================================== */
(function () {
'use strict';

var D = window.VBDemo;
if (!D) return;

var SpawnState = D.SpawnState, SPAWNS = D.SPAWNS;
var creatureImg = D.creatureImg, clockTime = D.clockTime, esc = D.esc;

var DOT = '·', ARROW = '→';

/* The Discord mark, verbatim from board.html. A claimant is a Discord
   account rather than a Tibia character, and on a board where every other
   name is a character that distinction has to be visible. Filled with the
   claimant colour rather than currentColor: the mark sits outside the
   name plate, where currentColor is the muted grey of the line. */
var DISCORD_MARK = '<svg class="d-mark" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/></svg>';

var el = {}, filter = '', open = null, timer = null;

/* ---------------------------------------------------------------------
   board.html's shownSpawns: what is happening now first, ordered by when
   it stops happening; then what is about to happen, ordered by when it
   starts; then everything else. The top of the board is for what is
   changing, not for who was last to touch something.

   Deliberately NOT the forum's order, which is claimed-first and then
   catalogue order. The two surfaces answer different questions — the
   forum is a list of posts, this is a board you scan.
   ------------------------------------------------------------------ */
function tier(row) {
  if (row.state === 'claimed') return 0;
  return row.state === 'free' ? 2 : 1;
}

function shown() {
  var q = filter.toLowerCase();
  var list = SPAWNS.filter(function (s) {
    if (!q) return true;
    var hay = (s.code + ' ' + s.name + ' ' + s.creature.replace(/_/g, ' ')).toLowerCase();
    return hay.indexOf(q) > -1;
  });
  return list.slice().sort(function (a, b) {
    var ra = SpawnState.get(a.code), rb = SpawnState.get(b.code);
    var ta = tier(ra), tb = tier(rb);
    if (ta !== tb) return ta - tb;
    if (ta === 0) return ra.left - rb.left;
    if (ta === 1) return ra.start - rb.start;
    return SPAWNS.indexOf(a) - SPAWNS.indexOf(b);
  });
}

/* The state line, as board.html's stateHtml writes it. A state line is
   mostly punctuation and clock times, and the one word in it worth
   finding at a glance is the person — so that is the one word set apart. */
function stateLine(row) {
  if (row.state === 'free') return 'free';
  var who = DISCORD_MARK + '<span class="at-name">' + esc(row.who) + '</span>';
  if (row.state === 'claimed') return who + ' until ' + clockTime(row.start + row.mins);
  if (row.state === 'asked') return who + ' offered ' + clockTime(row.start);
  return who + ' booked ' + clockTime(row.start);
}

function cardHTML(s) {
  var row = SpawnState.get(s.code);
  var live = row.state === 'claimed';
  var done = live ? Math.min(1, Math.max(0, 1 - row.left / Math.max(1, row.mins * 60))) : 0;
  var art = s.creature
    ? '<img class="sprite" src="' + creatureImg(s.creature) + '" alt="">'
    : '';
  var tick = row.state === 'confirmed'
    ? '<i class="ti ti-check tick" aria-hidden="true"></i>' : '';
  var queue = row.queue ? '<span class="queue">+' + row.queue + ' queued</span>' : '';
  var bar = live
    ? '<div class="card-bar"><span style="width:' + (done * 100).toFixed(1) + '%"></span></div>'
    : '';

  return '<button class="db-card" type="button" data-code="' + s.code +
           '" style="--edge: var(--st-' + row.state + ')">' +
           art +
           '<div class="body">' +
             '<div class="top">' +
               '<span class="code-chip' + (live ? ' live' : '') + '">' + esc(s.code) + '</span>' +
               '<span class="spawn-name">' + esc(s.name) + '</span>' +
             '</div>' +
             '<div class="card-state">' +
               '<span class="dot ' + row.state + '"></span>' +
               '<span class="who' + (row.state === 'free' ? ' free' : '') + '">' + stateLine(row) + '</span>' +
               tick + queue +
             '</div>' +
             bar +
           '</div>' +
         '</button>';
}

function render() {
  var list = shown();
  el.cards.innerHTML = list.length
    ? list.map(cardHTML).join('')
    : '<div class="db-empty">No spawn here matches <b>' + esc(filter) + '</b>.</div>';
  el.sub.textContent = SpawnState.freeCount() + ' of ' + SPAWNS.length + ' free ' +
                       DOT + ' 328 in the catalogue';
  if (open) renderWindow();
}

/* ---------------------------------------------------------------------
   The week.

   Booking used to be a link somewhere else, which made planning a hunt
   feel like a separate errand from taking one — they are the same
   thought, so they are one window.

   Display only here. Everything the real grid does on top of this is
   about putting a booking somewhere: dragging a block, pinching the zoom,
   clicking an empty hour. None of that is worth reproducing on a landing
   page, and all of it would need a booking model behind it. What the page
   has to show is the shape of the answer — a week with other people's
   evenings already on it.

   Blocks are placed against the hour rather than in pixels: --at is hours
   from midnight and --len is how many it runs for, so the CSS does the
   arithmetic and a zoom would be a reflow rather than a redraw.
   ------------------------------------------------------------------ */
var DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/* A deterministic evening. Hunts cluster where people are awake, so a
   week of uniformly random blocks reads as noise rather than as a rota. */
function bookingsFor(code, row) {
  var seed = 0;
  for (var i = 0; i < code.length; i++) seed = (seed * 31 + code.charCodeAt(i)) >>> 0;
  var n = function () {
    seed ^= seed << 13; seed >>>= 0;
    seed ^= seed >> 17;
    seed ^= seed << 5; seed >>>= 0;
    return seed / 4294967296;
  };
  var out = [];

  /* Today's block is whatever the card already says, so the week and the
     state line cannot disagree about the same spawn. */
  if (row.state !== 'free') {
    out.push({
      day: 0, at: row.start / 60, len: row.mins / 60,
      state: row.state, who: row.who, mine: !!row.mine
    });
  }

  var members = D.MEMBERS;
  for (var d = 0; d < 7; d++) {
    var count = d === 0 ? 1 : (n() < 0.55 ? 1 : (n() < 0.5 ? 2 : 0));
    for (var k = 0; k < count; k++) {
      var at = 16 + Math.floor(n() * 7);          /* evenings, 16:00-22:00 */
      if (k === 1) at = 8 + Math.floor(n() * 5);  /* the odd morning slot  */
      var len = [2, 3, 4][Math.floor(n() * 3)];
      var state = n() < 0.45 ? 'confirmed' : 'booked';
      out.push({
        day: d, at: at, len: len, state: state,
        who: members[Math.floor(n() * members.length)], mine: false
      });
    }
  }
  return out;
}

function weekHTML(s, row) {
  var today = new Date();
  var days = [];
  for (var d = 0; d < 7; d++) {
    var date = new Date(today.getTime() + d * 86400000);
    days.push({ name: DAY_NAMES[date.getDay()], num: date.getDate(), today: d === 0 });
  }

  var head = '<div class="wk-corner"></div>' + days.map(function (day) {
    return '<div class="wk-head' + (day.today ? ' today' : '') + '">' +
           day.name + '<span class="dnum">' + day.num + '</span></div>';
  }).join('');

  var hours = '';
  for (var h = 0; h < 24; h++) {
    hours += '<div class="wk-hour">' + (h < 10 ? '0' + h : h) + ':00</div>';
  }

  var blocks = bookingsFor(s.code, row);
  var cols = days.map(function (day, index) {
    var cells = '';
    for (var c = 0; c < 24; c++) cells += '<div class="wk-cell"></div>';
    var placed = blocks.filter(function (b) { return b.day === index; }).map(function (b) {
      var from = Math.floor(b.at) + ':' + (b.at % 1 ? '30' : '00');
      var to = (Math.floor(b.at + b.len) % 24) + ':' + ((b.at + b.len) % 1 ? '30' : '00');
      return '<div class="wk-block b-' + b.state + (b.mine ? ' b-mine' : '') +
             '" style="--at:' + b.at + ';--len:' + b.len + '">' +
               '<span class="who">' + esc(b.who) + '</span>' +
               '<span class="tm">' + from + ARROW + to + '</span>' +
             '</div>';
    }).join('');
    return '<div class="wk-col">' + cells + placed + '</div>';
  }).join('');

  return '<div class="cal-legend">' +
      '<span><i class="swatch b-claimed"></i>being hunted</span>' +
      '<span><i class="swatch b-booked"></i>booked</span>' +
      '<span><i class="swatch b-confirmed"></i>confirmed</span>' +
      '<span><i class="swatch b-asked"></i>offered</span>' +
    '</div>' +
    '<div class="wk-body" id="db-week">' +
      '<div class="wk-grid">' + head +
        '<div class="wk-hours">' + hours + '</div>' + cols +
      '</div>' +
    '</div>';
}

/* ---------------------------------------------------------------------
   The spawn window. One window per spawn, holding the whole decision:
   what is happening on it now, and the week it is booked into.
   ------------------------------------------------------------------ */
function renderWindow() {
  var s = SPAWNS.filter(function (x) { return x.code === open; })[0];
  if (!s) return;
  var row = SpawnState.get(s.code);
  var live = row.state === 'claimed';

  el.winCode.textContent = s.code;
  el.winTitle.textContent = s.name;
  el.winRegion.textContent = s.region;
  el.watermark.src = creatureImg(s.creature);

  var sub;
  if (live) {
    sub = 'Being hunted now ' + DOT + ' ' + clockTime(row.start) + ' ' + ARROW + ' ' +
          clockTime(row.start + row.mins);
  } else if (row.state === 'free') {
    sub = 'Nobody is on this respawn right now.';
  } else if (row.state === 'asked') {
    sub = 'A handover has been offered and is waiting on an answer.';
  } else {
    sub = 'Free right now — the window below is already spoken for.';
  }

  var body = '<div class="strip">' +
      '<span class="dot ' + row.state + '"></span>' +
      '<span class="who' + (row.state === 'free' ? ' free' : '') + '">' + stateLine(row) + '</span>' +
    '</div>' +
    '<p class="win-sub">' + sub + '</p>';

  if (row.queue) {
    body += '<div class="up-next"><div class="up-row queued"><span class="up-pip"></span>' +
            '<span>' + row.queue + ' waiting behind</span>' +
            '<span class="up-when">after this</span></div></div>';
  }
  body += weekHTML(s, row);
  el.winBody.innerHTML = body;

  /* Opens on this spawn's own block where it has one, and on the evening
     otherwise. Midnight is the top of the grid and nothing happens there
     — and a window that opens on an empty 3am while the card above it
     says "being hunted now" reads as two views of different spawns. */
  var week = document.getElementById('db-week');
  if (week) {
    var at = row.state === 'free' ? 16 : row.start / 60;
    week.scrollTop = Math.max(0, (at - 1.5) * 28);
  }

  /* The real footer acts; this one only says what the real one offers.
     Claiming and booking need a booking model behind them, and the page
     already proves the round trip in #spawns above — repeating it here
     would buy a second way to do the same thing. */
  el.winFoot.innerHTML = live
    ? (row.mine
        ? '<button class="db-btn danger">Leave</button>' +
          '<button class="db-btn">Book</button><button class="db-btn">Config</button>'
        : '<button class="db-btn">Join queue</button>' +
          '<button class="db-btn">Book</button><button class="db-btn">Config</button>')
    : '<button class="db-btn claim">Claim</button>' +
      '<button class="db-btn">Book</button><button class="db-btn">Config</button>';
}

function openWindow(code) {
  open = code;
  el.veil.classList.add('open');
  el.window.classList.add('open');
  renderWindow();
}

function closeWindow() {
  open = null;
  el.veil.classList.remove('open');
  el.window.classList.remove('open');
}

/* The claim countdown. Only runs while the section is actually on screen:
   the Discord client above already has a timer, and the one nobody is
   looking at should not be the second. */
function setLive(on) {
  if (timer) { clearInterval(timer); timer = null; }
  if (!on) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  timer = setInterval(function () {
    var rows = SpawnState.all(), moved = false;
    Object.keys(rows).forEach(function (code) {
      var row = rows[code];
      if (row.state === 'claimed' && row.left > 0) {
        row.left = Math.max(0, row.left - 6);
        moved = true;
      }
    });
    if (moved) render();
  }, 6000);
}

function init() {
  el.cards = document.getElementById('db-cards');
  if (!el.cards) return;
  el.sub = document.getElementById('db-sub');
  el.veil = document.getElementById('db-veil');
  el.window = document.getElementById('db-window');
  el.winCode = document.getElementById('db-win-code');
  el.winTitle = document.getElementById('db-win-title');
  el.winRegion = document.getElementById('db-win-region');
  el.winBody = document.getElementById('db-win-body');
  el.winFoot = document.getElementById('db-win-foot');
  el.watermark = document.getElementById('db-watermark');

  el.cards.addEventListener('click', function (ev) {
    var card = ev.target.closest('.db-card');
    if (card) openWindow(card.dataset.code);
  });

  document.getElementById('db-filter').addEventListener('input', function (ev) {
    filter = ev.target.value.trim();
    render();
  });

  var fold = document.getElementById('db-mod');
  var head = fold.querySelector('.db-fold');
  head.addEventListener('click', function () {
    var on = fold.classList.toggle('open');
    head.setAttribute('aria-expanded', String(on));
  });

  el.veil.addEventListener('click', closeWindow);
  document.getElementById('db-win-close').addEventListener('click', closeWindow);
  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape' && open) closeWindow();
  });

  render();

  /* Redraw when the board changes anywhere — a claim made in the Discord
     forum above is a change to this board too. */
  SpawnState.subscribe(render);

  /* Two live demos on one page is two timers. Only the visible one runs. */
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      setLive(entries.some(function (e) { return e.isIntersecting; }));
    }, { rootMargin: '120px' }).observe(el.cards);
  } else {
    setLive(true);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
})();
