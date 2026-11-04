// Puzzler rules and rooms. Shared by the game page (and by a solver used to check every room can be beaten).
//
// Map key:
//   #  wall          .  floor        P  start
//   B  push block    _  floor switch G  gate (opens when every switch is pressed)
//   K  key           L  locked door  O  pit (push a block in to fill it)
//   *  ice (you slide until something stops you)
//   C  crystal (reach it to win)
(function (root) {
  const ROOMS = [
    {
      name: 'The Gate',
      hint: 'Push the block onto the switch to open the gate.',
      map: [
        '###########',
        '#.....#...#',
        '#.P.B.G.C.#',
        '#.....#...#',
        '#..._.#...#',
        '###########',
      ],
    },
    {
      name: 'Mind the Gap',
      hint: 'Blocks can fill pits so you can walk across.',
      map: [
        '###########',
        '#P..#....C#',
        '#.B.O.....#',
        '#...#.....#',
        '###########',
      ],
    },
    {
      name: 'Locked In',
      hint: 'Open the gate, grab the key, then unlock the door.',
      map: [
        '#############',
        '#P..#K..#...#',
        '#...#...L.C.#',
        '#.B.G...#...#',
        '#...#...#...#',
        '#._.#####...#',
        '#############',
      ],
    },
    {
      name: 'Two Switches',
      hint: 'The gate only opens when BOTH switches are pressed.',
      map: [
        '#############',
        '#P....#.....#',
        '#.B.B.#..C..#',
        '#.....G.....#',
        '#_...._#....#',
        '#############',
      ],
    },
    {
      name: 'Slippery Floor',
      hint: 'On ice you slide until something stops you. Walls can stop you!',
      map: [
        '###########',
        '#P...#....#',
        '#.*******.#',
        '#.*******.#',
        '#.*****#*.#',
        '######C####',
        '###########',
      ],
    },
    {
      name: 'Ice Push',
      hint: 'A block slides on ice too. Use the wall to stop it on the switch.',
      map: [
        '#############',
        '#P....#.....#',
        '#.....G..C..#',
        '#.....#.....#',
        '#.*****######',
        '#.**B*_######',
        '#.*****######',
        '#############',
      ],
    },
    {
      name: 'Key Run',
      hint: 'Fill a pit to reach the key.',
      map: [
        '#############',
        '#P.B..O..K..#',
        '#.....#.....#',
        '#.....#.###L#',
        '#.....#.#C..#',
        '#############',
      ],
    },
    {
      name: 'Tight Squeeze',
      hint: 'Think before you push. You can always undo!',
      map: [
        '##########',
        '#P.....###',
        '#..B.B...#',
        '#.#...#..#',
        '#._..._..#',
        '####G#####',
        '####C#####',
        '##########',
      ],
    },
    {
      name: 'Frozen Lock',
      hint: 'Slide to the key, then find a way to stop next to the door.',
      map: [
        '#############',
        '#P..*****#..#',
        '#...*****L.C#',
        '#...*****#..#',
        '#...****K#..#',
        '#############',
      ],
    },
    {
      name: 'Bridge Builder',
      hint: 'You will need both blocks. One for the pit, one for the switch.',
      map: [
        '##############',
        '#P...#.......#',
        '#.B..O...._..#',
        '#..B.#.......#',
        '#....####G####',
        '#....#...C...#',
        '##############',
      ],
    },
    {
      name: 'Crystal Vault',
      hint: 'Everything you have learned! Switch, ice, pit, and key.',
      map: [
        '###############',
        '#P..#.....#...#',
        '#.B.G..B..O.K.#',
        '#...#.....#...#',
        '#._.#.*****####',
        '#...#.******L.#',
        '#####.*****#C.#',
        '###############',
      ],
    },
  ];

  const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

  function parse(room) {
    const map = room.map;
    const h = map.length, w = Math.max(...map.map(r => r.length));
    const tiles = [], blocks = [], keys = [], plates = [], doors = [], pits = [];
    let player = 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x;
      let c = map[y][x] || '#';
      if (c === 'P') { player = i; c = '.'; }
      if (c === 'B') { blocks.push(i); c = '.'; }
      if (c === 'K') { keys.push(i); c = '.'; }
      if (c === '_') plates.push(i);
      if (c === 'L') doors.push(i);
      if (c === 'O') pits.push(i);
      tiles.push(c);
    }
    return {
      w, h, tiles, plates, doors, pits, keyCells: keys.slice(),
      start: { p: player, blocks: blocks.sort((a, b) => a - b), keys: keys.slice(), held: 0, open: 0, filled: 0, won: false },
    };
  }

  function tileAt(lv, st, i) {
    const t = lv.tiles[i];
    if (t === 'O' && (st.filled >> lv.pits.indexOf(i)) & 1) return '.';
    if (t === 'L' && (st.open >> lv.doors.indexOf(i)) & 1) return '.';
    return t;
  }
  function gateOpen(lv, blocks, p) {
    return lv.plates.every(pl => pl === p || blocks.includes(pl));
  }
  function step(lv, i, d) {
    const x = i % lv.w + d[0], y = Math.floor(i / lv.w) + d[1];
    if (x < 0 || y < 0 || x >= lv.w || y >= lv.h) return -1;
    return y * lv.w + x;
  }

  // Can a block go into cell m?
  function blockCanEnter(lv, st, blocks, m) {
    if (m < 0 || blocks.includes(m) || st.keys.includes(m)) return false;
    const t = tileAt(lv, st, m);
    return t === '.' || t === '_' || t === '*' || t === 'O';
  }

  // Try to move. Returns { st, events } or null if you can't go that way.
  function move(lv, st, dirName) {
    if (st.won) return null;
    const d = DIRS[dirName];
    const events = [];
    let blocks = st.blocks.slice(), keys = st.keys.slice();
    let { held, open, filled } = st;
    const S = () => ({ p, blocks, keys, held, open, filled, won: false });
    let p = st.p;
    const n = step(lv, p, d);
    if (n < 0) return null;
    let t = tileAt(lv, S(), n);
    if (t === '#') return null;

    if (blocks.includes(n)) {
      // push the block
      let m = step(lv, n, d);
      if (!blockCanEnter(lv, S(), blocks, m)) return null;
      blocks = blocks.filter(b => b !== n);
      let bpos = m;
      const fall = pos => {
        const pi = lv.pits.indexOf(pos);
        if (lv.tiles[pos] === 'O' && !((filled >> pi) & 1)) { filled |= 1 << pi; events.push('fill'); return true; }
        return false;
      };
      if (!fall(bpos)) {
        // slide on ice
        while (tileAt(lv, S(), bpos) === '*') {
          const nx = step(lv, bpos, d);
          if (nx === p || nx === n || !blockCanEnter(lv, S(), blocks, nx)) break;
          bpos = nx;
          if (fall(bpos)) { bpos = -1; break; }
        }
        if (bpos >= 0) blocks.push(bpos);
      }
      blocks.sort((a, b) => a - b);
      events.push('push');
      p = n;
      t = tileAt(lv, S(), p);
      const out = S();
      out.won = t === 'C';
      if (out.won) events.push('win');
      return { st: out, events };
    }

    const canStep = (to, sliding) => {
      if (to < 0) return false;
      const tt = tileAt(lv, S(), to);
      if (tt === '#' || tt === 'O') return false;
      if (blocks.includes(to)) return false;
      if (tt === 'G' && !gateOpen(lv, blocks, to)) return false;
      if (tt === 'L') return !sliding && held > 0;
      return true;
    };
    if (!canStep(n, false)) return null;
    const enter = to => {
      const tt = tileAt(lv, S(), to);
      if (tt === 'L') { open |= 1 << lv.doors.indexOf(to); held--; events.push('unlock'); }
      p = to;
      if (keys.includes(p)) { keys = keys.filter(k => k !== p); held++; events.push('key'); }
      return tileAt(lv, S(), p) === 'C';
    };
    if (enter(n)) { const o = S(); o.won = true; events.push('win'); return { st: o, events }; }
    // slide on ice
    let slid = false;
    while (tileAt(lv, S(), p) === '*') {
      const nx = step(lv, p, d);
      if (!canStep(nx, true)) break;
      slid = true;
      if (enter(nx)) { const o = S(); o.won = true; events.push('win'); return { st: o, events }; }
    }
    if (slid) events.push('slide');
    return { st: S(), events };
  }

  const api = { ROOMS, DIRS, parse, move, tileAt, gateOpen };
  if (typeof module !== 'undefined') module.exports = api;
  else root.Puzzler = api;
})(this);
