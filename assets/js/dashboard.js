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
  var who = '<span class="at-name">' + esc(row.who) + '</span>';
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
   The spawn window. One window per spawn, holding the whole decision:
   what is happening on it now, and who is behind that.
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

  if (row.state !== 'free') {
    body += '<div class="up-next"><div class="up-title">Up next</div>' +
      '<div class="up-row"><span class="up-pip"></span><span>' + esc(row.who) + '</span>' +
        '<span class="up-when">' + clockTime(row.start) + ' ' + ARROW + ' ' +
        clockTime(row.start + row.mins) + '</span></div>';
    if (row.queue) {
      body += '<div class="up-row queued"><span class="up-pip"></span>' +
              '<span>' + row.queue + ' waiting behind</span>' +
              '<span class="up-when">after this</span></div>';
    }
    body += '</div>';
  }
  el.winBody.innerHTML = body;

  /* Claim is offered on anything not being hunted this minute, including a
     spawn booked for later — taking it now and booking it for tonight are
     different things, and the board lets you do both. */
  if (live && row.mine) {
    el.winFoot.innerHTML =
      '<button class="db-btn danger" data-act="leave">Leave</button>' +
      '<button class="db-btn" data-act="book">Book</button>' +
      '<button class="db-btn" data-act="config">Config</button>';
  } else if (live) {
    el.winFoot.innerHTML =
      '<button class="db-btn" data-act="queue">Join queue</button>' +
      '<button class="db-btn" data-act="book">Book</button>' +
      '<button class="db-btn" data-act="config">Config</button>';
  } else {
    el.winFoot.innerHTML =
      '<button class="db-btn claim" data-act="claim">Claim</button>' +
      '<button class="db-btn" data-act="book">Book</button>' +
      '<button class="db-btn" data-act="config">Config</button>';
  }
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

  el.winFoot.addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-act]');
    if (!b) return;
    if (b.dataset.act === 'claim') SpawnState.claim(open);
    else if (b.dataset.act === 'leave') SpawnState.release(open);
    else return;
    render();
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
