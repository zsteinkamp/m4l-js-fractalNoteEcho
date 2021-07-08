autowatch=1;
inlets=12;
outlets=4;

var utils = require("utils.js");

// inlets
var INLET_NOTE = 0;
var INLET_VELOCITY = 1;
var INLET_ITERATIONS = 2;
var INLET_STRETCH = 3;
var INLET_DECAY = 4;
var INLET_NOTEINCR = 5;
var INLET_BASE1 = 6;
var INLET_BASE2 = 7;
var INLET_BASE3 = 8;
var INLET_BASE4 = 9;
var INLET_DUR_BASE = 10;
var INLET_DUR_DECAY = 11;

// outlets
var OUTLET_NOTE = 0;
var OUTLET_VELOCITY = 1;
var OUTLET_DURATION = 2;
var OUTLET_JSUI = 3;

// eventually hold arrays
var pattern; // tap pattern
var repeats; // repeats obj arr

var options = [
  0,     // INLET_NOTE
  0,     // INLET_VELOCITY
  2,     // INLET_ITERATIONS
  0.75,  // INLET_STRETCH
  0.66,  // INLET_DECAY
  0,     // INLET_NOTEINCR
  500,   // INLET_BASE1
  1000,  // INLET_BASE2
  0,     // INLET_BASE3
  0,     // INLET_BASE4
  100,   // INLET_DUR_BASE
  0.5    // INLET_DUR_DECAY
];

setupRepeats();

function setupRepeats() {
  // set up pattern
  pattern = [0];
  options[INLET_BASE1] && pattern.push(parseInt(options[INLET_BASE1]));
  options[INLET_BASE2] && pattern.push(parseInt(options[INLET_BASE2]));
  options[INLET_BASE3] && pattern.push(parseInt(options[INLET_BASE3]));
  options[INLET_BASE4] && pattern.push(parseInt(options[INLET_BASE4]));

  repeats = [];
  iterRepeats(options[INLET_ITERATIONS], 0);
  repeats = repeats.sort( function(a, b) { return a.ms - b.ms; } );
  //utils.log(repeats);
  outlet(OUTLET_JSUI, ['repeats'].concat(repeats));
}

function iterRepeats(togo, offsetMs) {
  for (var idx = 0; idx < pattern.length; idx++) {
    var level = options[INLET_ITERATIONS] - togo;
    var ms = pattern[idx] * Math.pow(options[INLET_STRETCH], level);
    if (level > 0 && pattern[idx] === 0) {
      continue;
    }
    repeats.push({
      ms: parseInt(ms + offsetMs),
      level: level,
      velocity_coeff: Math.pow(options[INLET_DECAY], level + (idx / 4.0)),
      note_incr: options[INLET_NOTEINCR] * level,
      duration: parseInt(options[INLET_DUR_BASE] * Math.pow(options[INLET_DUR_DECAY], level + (idx / 4.0)))
    });
    if (togo > 1 && ms > 0) {
      iterRepeats(togo - 1, parseInt(ms + offsetMs));
    }
  }
}

function makeTask(r, n, v) {
  //utils.log( {
  //     arr: r,
  //     enn: n,
  //     enn2: n + r.note_incr,
  //     vee: v,
  //     vee2: v * r.velocity_coeff
  //});
  return function() {
    n = parseInt(n + r.note_incr);
    v = parseInt(v * r.velocity_coeff);
    d = r.duration;

    //utils.log({
    //  n: n,
    //  v: v,
    //  d: d,
    //});

    outlet(OUTLET_DURATION, r.duration);
    outlet(OUTLET_VELOCITY, v);
    outlet(OUTLET_NOTE, n);
  }
}

function msg_int(i) {
  handleMessage(i);
}
function msg_float(i) {
  handleMessage(i);
}

function handleMessage(i) {
  options[inlet] = i;

  if (inlet > INLET_VELOCITY) {
    setupRepeats();
  }

  if (inlet === INLET_NOTE && options[INLET_VELOCITY] > 0) {
    //utils.log("=================================");
    for (var idx = 0; idx < repeats.length; idx++) {
      var t = new Task( makeTask(repeats[idx], options[INLET_NOTE], options[INLET_VELOCITY]) );
      t.schedule(repeats[idx].ms);
    }
  }
}
