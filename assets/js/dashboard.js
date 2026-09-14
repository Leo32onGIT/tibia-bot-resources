/* =====================================================================
   The respawn dashboard, as the bot serves it at /dashboard.

   Ported from tibia-bot/src/main/resources/web/board.html.

   Display only. Every button here is a button the real page has, doing
   nothing — claiming and booking need a booking model behind them, and
   the round trip is already proved in #spawns above. The board is still
   READ from the shared SpawnState, so a claim made in Discord shows here.

   Where the two surfaces disagree is the point: Discord forum tags can
   only say Free or Claimed, so a spawn booked for tonight is tagged Free
   up there with the booking relegated to a field. Down here it is a blue
   card, and the week says exactly which evening it is.
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

/* How long is left, at the coarseness worth reading it at — board.html's
   fmtDur. "3hr9m left" and "in 3hr9m" are the same measurement seen from
   two sides, so they are spelled the same way. */
function fmtDur(mins) {
  if (mins < 1) return 'now';
  if (mins < 60) return mins + 'm';
  var h = Math.floor(mins / 60), m = mins % 60;
  return h + 'hr' + (m ? m + 'm' : '');
}

/* Somebody as this page names them: the one Discord name they answer to,
   written @name — the same shape the bot uses on the spawn card in the
   thread. The @ is written here, so a name travels as a name and the
   punctuation around it stays the page's business. */
function atName(row) {
  return DISCORD_MARK + '<b class="at-name">@' + esc(row.who) + '</b>';
}

/* board.html's STATE_TEXT. A claim says how long is LEFT rather than when
   it ends: what a board is read to answer is whether it is worth waiting,
   and a clock time makes the reader do that subtraction themselves. */
function stateLine(row) {
  if (row.state === 'free') return 'free';
  if (row.state === 'claimed') {
    return atName(row) + ' ' + DOT + ' ' + fmtDur(Math.round(row.left / 60)) + ' left';
  }
  if (row.state === 'booked') return atName(row) + ' booked ' + DOT + ' ' + clockTime(row.start);
  if (row.state === 'confirmed') return atName(row) + ' confirmed ' + DOT + ' ' + clockTime(row.start);
  return atName(row) + ' asked ' + DOT + ' ' + clockTime(row.start);
}

function cardHTML(s) {
  var row = SpawnState.get(s.code);
  var live = row.state === 'claimed';
  var done = live ? Math.min(1, Math.max(0, 1 - row.left / Math.max(1, row.mins * 60))) : 0;
  var art = s.creature ? '<img class="sprite" src="' + creatureImg(s.creature) + '" alt="">' : '';
  var tick = row.state === 'confirmed' ? '<i class="ti ti-check tick" aria-hidden="true"></i>' : '';
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

/* =====================================================================
   THE WEEK
   ===================================================================== */

/* Monday-first, and indexed the way board.html indexes it:
   DAY_NAMES[(getDay()+6)%7]. The first column is today, not Monday. */
var DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function pad(n) { return String(n).length < 2 ? '0' + n : String(n); }

/* Midnight and noon are 12, not 0 — "0am" is not a time anybody writes. */
function twelveHour(h) { return (h % 12 === 0 ? 12 : h % 12) + (h < 12 ? 'am' : 'pm'); }

/* An hour-with-fraction as a clock reads it, wrapping past midnight. */
function hhmm(hours) {
  var total = Math.round(hours * 60) % 1440;
  return pad(Math.floor(total / 60)) + ':' + pad(total % 60);
}

/* Tibia's server save: 10:00 in Berlin, wherever the reader happens to
   be. Drawn where that instant actually falls on their own day, because a
   booking either side of it is a different night — and a fixed 10:00 on a
   local axis is simply the wrong line for everyone outside one timezone. */
var SERVER_TZ = 'Europe/Berlin';
var SERVER_SAVE_HOUR = 10;

/* How far ahead of UTC the server's clock is at a given instant, which
   changes twice a year. Read out of Intl rather than assumed, so the line
   moves with Berlin's own daylight saving rather than with a constant. */
function serverOffsetMinutes(date) {
  var parts = {};
  new Intl.DateTimeFormat('en-US', {
    timeZone: SERVER_TZ, hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  }).formatToParts(date).forEach(function (x) { parts[x.type] = x.value; });
  var asUTC = Date.UTC(+parts.year, +parts.month - 1, +parts.day,
                       +parts.hour % 24, +parts.minute, +parts.second);
  return (asUTC - Math.floor(date.getTime() / 1000) * 1000) / 60000;
}

/* The instant at which the server's clock reads this wall time. Two passes,
   because the offset that answers the question depends on the answer. */
function serverToInstant(y, mo, d, h, mi) {
  var guess = new Date(Date.UTC(y, mo, d, h, mi));
  for (var i = 0; i < 2; i++) {
    guess = new Date(Date.UTC(y, mo, d, h, mi) - serverOffsetMinutes(guess) * 60000);
  }
  return guess;
}

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

  /* The spawn's own block, on the day its start actually falls on —
     row.start is minutes from midnight TODAY and may run past 1440 into
     tomorrow, so the day comes off the same number the card reads. */
  if (row.state !== 'free') {
    out.push({
      day: Math.floor(row.start / 1440),
      at: (row.start % 1440) / 60,
      len: row.mins / 60,
      state: row.state, who: row.who, mine: !!row.mine
    });
  }

  var members = D.MEMBERS;
  for (var d = 0; d < 7; d++) {
    var count = d === 0 ? 1 : (n() < 0.55 ? 1 : (n() < 0.5 ? 2 : 0));
    for (var k = 0; k < count; k++) {
      var at = 16 + Math.floor(n() * 7);
      if (k === 1) at = 8 + Math.floor(n() * 5);
      var len = [2, 3, 4][Math.floor(n() * 3)];
      out.push({
        day: d, at: at, len: len,
        state: n() < 0.45 ? 'confirmed' : 'booked',
        who: members[Math.floor(n() * members.length)], mine: false
      });
    }
  }
  return out;
}

/* Two grids of identical shape stacked — .wk-headrow and .wk-rows — so
   everything absolutely placed on the week (the now line, server save)
   keeps coordinates measured from midnight and owes nothing to how tall
   the headings happen to be.

   Blocks are placed against the hour rather than in pixels: --at is hours
   from midnight and --len is how many it runs for, so the CSS does the
   arithmetic exactly as the real grid does. */
/* board.html opens on OPEN_FROM = -1 through OPEN_TO = 13 — yesterday and
   a fortnight ahead, fifteen columns. Seven filled about half the panel
   and left the rest empty; the strip is meant to run on past the edge and
   be scrolled, which is the whole reason a day is a fixed width rather
   than a seventh of the panel. */
var OPEN_FROM = -1, OPEN_TO = 13;

function weekHTML(s, row) {
  var now = new Date();
  var days = [];
  for (var d = OPEN_FROM; d <= OPEN_TO; d++) {
    var date = new Date(now.getTime() + d * 86400000);
    days.push({
      name: DAY_NAMES[(date.getDay() + 6) % 7],
      num: date.getDate(),
      /* The first of a month says which month, so a strip scrolled a long
         way forward is never a run of bare numbers. */
      month: date.getDate() === 1 ? date.toLocaleDateString(undefined, { month: 'short' }) : '',
      today: d === 0,
      offset: d
    });
  }

  var heads = days.map(function (day) {
    return '<div class="wk-head ' + (day.today ? 'today' : '') + '">' + day.name +
           '<span class="dnum">' + day.num + (day.month ? ' ' + day.month : '') + '</span></div>';
  }).join('');

  /* The same local hour said twice, twelve-hour over twenty-four: which of
     the two ways of writing it people think in is the thing that actually
     varies between readers. */
  var hourRows = '';
  for (var h = 0; h < 24; h++) {
    hourRows += '<div class="wk-hour">' + twelveHour(h) +
                '<span class="srv">' + pad(h) + ':00</span></div>';
  }

  var blocks = bookingsFor(s.code, row);
  var cols = days.map(function (day) {
    var dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + day.offset);
    var colStart = dayStart.getTime(), colEnd = colStart + 86400000;

    var cells = '';
    for (var c = 0; c < 24; c++) {
      var past = colStart + (c + 1) * 3600000 <= Date.now();
      cells += '<div class="wk-cell' + (past ? ' past' : '') + '"></div>';
    }

    /* Server save, drawn where the server's 10:00 actually falls on this
       local day — which is a different hour, and occasionally a different
       day, depending on where the reader is. */
    var ss = serverToInstant(dayStart.getFullYear(), dayStart.getMonth(), dayStart.getDate(),
                             SERVER_SAVE_HOUR, 0);
    var ssMark = '';
    if (ss.getTime() >= colStart && ss.getTime() < colEnd) {
      var ssAt = (ss.getTime() - colStart) / 3600000;
      ssMark = '<div class="ss-line" style="--at:' + ssAt + '"></div>' +
               '<div class="ss-label" style="--at:' + ssAt + '">SS ' +
                 pad(ss.getHours()) + ':' + pad(ss.getMinutes()) + '</div>';
    }

    var placed = blocks.filter(function (b) { return b.day === day.offset; }).map(function (b) {
      /* HH:MM either side, as board.html writes it. Flooring to the hour
         labelled a 5:41-to-7:41 hunt "5am to 7am" — a block drawn in the
         right place saying the wrong time. */
      var from = hhmm(b.at);
      var to = hhmm(b.at + b.len);
      return '<div class="wk-block b-' + b.state + (b.mine ? ' b-mine' : '') +
             '" style="--at:' + b.at + ';--len:' + b.len + '">' +
               '<span class="who">@' + esc(b.who) + '</span>' +
               '<span class="tm">' + from + '–' + to + '</span>' +
             '</div>';
    }).join('');
    return '<div class="wk-col">' + cells + ssMark + placed + '</div>';
  }).join('');

  var nowAt = now.getHours() + now.getMinutes() / 60;

  return '<div class="cal">' +
      '<div class="strip cal-controls">' +
        '<span class="cc-row cc-repeat">' +
          '<span class="field-label">Book</span>' +
          '<span class="seg"><button class="on">Once</button><button>Weekly</button></span>' +
        '</span>' +
        '<span class="cc-row cc-week">' +
          '<span class="seg">' +
            '<button aria-label="Back a week">&lsaquo;</button>' +
            '<button>This week</button>' +
            '<button aria-label="Forward a week">&rsaquo;</button>' +
          '</span>' +
          '<button class="btn-ghost"><i class="ti ti-crosshair" aria-hidden="true"></i> Now</button>' +
        '</span>' +
      '</div>' +
      '<div class="cal-legend">' +
        '<span><i class="swatch sw-claimed"></i>Being hunted</span>' +
        '<span><i class="swatch sw-booked"></i>Booked</span>' +
        '<span><i class="swatch sw-confirmed"></i>Booked &amp; confirmed</span>' +
        '<span><i class="swatch sw-asked"></i>Asked</span>' +
        '<span><i class="swatch sw-pick"></i>Your selection</span>' +
        '<span class="lg-end"><i class="swatch line-now"></i>Now</span>' +
        '<span><i class="swatch line-ss"></i>Server save</span>' +
      '</div>' +
      '<div class="wk-body" id="db-week">' +
        '<div class="wk-grid">' +
          '<div class="wk-headrow"><div class="wk-corner"></div>' + heads + '</div>' +
          '<div class="wk-rows">' +
            '<div class="wk-hours">' + hourRows +
              '<span class="now-flag" style="--at:' + nowAt + '">' +
                pad(now.getHours()) + ':' + pad(now.getMinutes()) + '</span>' +
            '</div>' + cols +
            '<div class="now-line" style="--at:' + nowAt + '"></div>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
}

/* ---------------------------------------------------------------------
   The spawn window. One window per spawn, holding the whole decision:
   what is happening on it now, and the week it is booked into. Booking
   used to be a link somewhere else, which made planning a hunt feel like
   a separate errand from taking one — they are the same thought, so they
   are one window.
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

  var summary;
  if (live) {
    summary = 'ends ' + clockTime(row.start + row.mins);
  } else if (row.state === 'free') {
    summary = 'nothing booked today';
  } else {
    summary = 'booked from ' + clockTime(row.start);
  }

  el.winBody.innerHTML =
    '<div class="strip cal-head">' +
      '<span class="dot ' + row.state + '"></span>' +
      '<span class="who' + (row.state === 'free' ? ' free' : '') + '">' + stateLine(row) + '</span>' +
      '<span class="fold-title">Book a time</span>' +
      '<span class="muted">' + summary + '</span>' +
    '</div>' +
    weekHTML(s, row);

  /* Opens on the spawn's own block where it has one, and on the evening
     otherwise. Midnight is the top of the grid and nothing happens there
     — and a window that opens on an empty 3am while the card above it
     says "being hunted now" reads as two views of different spawns. */
  var week = document.getElementById('db-week');
  if (week) {
    var at = row.state === 'free' ? 16 : (row.start % 1440) / 60;
    week.scrollTop = Math.max(0, (at - 1.5) * 28);
    /* Sideways: open on yesterday, so the days in view are the one just
       gone, today, and the ones anybody is actually planning into. Today's
       column is at -OPEN_FROM, the strip being measured in offsets from
       today; the column before it is where the scroll goes. Scrolling to
       today itself would put it under the hour gutter, which is stuck to
       the left edge with the days sliding behind it — a third of a column
       on a phone. */
    /* Measured, not read off --daycol: on a phone that property is a calc()
       over viewport units, and getComputedStyle hands back the expression
       rather than a length. parseFloat made it NaN, which fell through to
       the desktop number and scrolled a phone twice as far as it meant to. */
    var firstCol = week.querySelector('.wk-col');
    var col = firstCol ? firstCol.offsetWidth : 150;
    week.scrollLeft = Math.max(0, (-OPEN_FROM - 1) * col);
  }

  /* board.html's readout: the length on the left, the one action on the
     right. Not a row of buttons — the panel offers exactly one thing to
     press at a time, and which one it is follows what pressing it would
     actually do (primaryAction).

       your own running hunt   Leave
       somebody else's         Book next   (claiming a held spawn books
                                            the first free window, which
                                            is Book's outcome by another
                                            route, so it wears Book's face)
       anything else           Claim       (booked and confirmed both mean
                                            nobody is on it right now) */
  var label, cls;
  if (live && row.mine) { label = 'Leave'; cls = 'btn'; }
  else if (live) { label = 'Book next'; cls = 'btn'; }
  else { label = 'Claim'; cls = 'btn claim'; }

  /* How long the hunt would run. The real tank also shades off what today's
     stamina has already gone on, and closes with what would be left after;
     here the reader has spent none, so neither has anything to say and the
     control is left to the one thing it is being shown for. */
  var hunt = 46;
  el.winFoot.innerHTML =
    '<div class="readout">' +
      '<div class="foot-dur">' +
        '<span class="field-label">For</span>' +
        '<span class="tank" role="slider" tabindex="0" aria-label="How long">' +
          '<span class="tank-zones">' +
            '<span class="tank-hunt" style="width:' + hunt + '%"></span>' +
          '</span>' +
          '<span class="tank-edge" style="left:' + hunt + '%"></span>' +
          '<span class="tank-in" style="left:4%">3hr</span>' +
        '</span>' +
      '</div>' +
      '<div class="readout-actions">' +
        '<button class="' + cls + '"><i class="ti ti-' +
          (label === 'Claim' ? 'flag' : label === 'Leave' ? 'door-exit' : 'calendar-plus') +
        '" aria-hidden="true"></i>' + label + '</button>' +
      '</div>' +
    '</div>';
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
      var r = rows[code];
      if (r.state === 'claimed' && r.left > 0) { r.left = Math.max(0, r.left - 6); moved = true; }
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
