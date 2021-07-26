autowatch=1;
inlets=12;
outlets=3;

// set up sketch canvas
sketch.default2d();
sketch.glloadidentity();

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

// eventually hold arrays
var pattern; // base tap pattern
var noteRepeats = []; // flat repeats array for scheduling notes
var vizRepeats = []; // array to hold repeats for visualization

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

  pattern = pattern.sort(function(a, b) { return a - b; });

  var numVizRows = Math.pow((pattern.length - 1), options[INLET_ITERATIONS]) - 1;
  if (numVizRows < 1) { numVizRows = 1; }

  //utils.log('numVizRows: ' + numVizRows);
  //utils.log('pattern len: ' + (pattern.length - 1));

  vizRepeats = [];
  noteRepeats = [];

  // populates noteRepeats and vizRepeats
  iterRepeats(options[INLET_ITERATIONS], 0, 0);
  noteRepeats = noteRepeats.sort( function(a, b) { return a.ms - b.ms; } );


  //utils.log(noteRepeats);
  // redraw the visualization
  draw();
  refresh();
}

function iterRepeats(togo, offsetMs, parentIdx) {
  vizIdx = vizRepeats.length;
  var thisLane = [];
  if (offsetMs > 0) {
    thisLane.push({ start: true, ms: offsetMs, parent: parentIdx });
  }
  for (var idx = 0; idx < pattern.length; idx++) {
    var level = options[INLET_ITERATIONS] - togo;
    var ms = pattern[idx] * Math.pow(options[INLET_STRETCH], level);
    if (level > 0 && pattern[idx] === 0) {
      continue;
    }
    var noteMeta = {
      ms: parseInt(ms + offsetMs),
      level: level,
      velocity_coeff: Math.pow(options[INLET_DECAY], level + (idx / 4.0)),
      note_incr: options[INLET_NOTEINCR] * level,
      duration: parseInt(options[INLET_DUR_BASE] * Math.pow(options[INLET_DUR_DECAY], level + (idx / 4.0)))
    };
    noteRepeats.push(noteMeta);

    thisLane.push(noteMeta);
  }

  vizRepeats.push(thisLane);
  var thisLaneIdx = vizRepeats.length - 1;

  for (var idx = 0; idx < pattern.length; idx++) {
    var level = options[INLET_ITERATIONS] - togo;
    var ms = pattern[idx] * Math.pow(options[INLET_STRETCH], level);
    if (togo > 1 && ms > 0) {
      iterRepeats(togo - 1, parseInt(ms + offsetMs), thisLaneIdx);
    }
  }
}

function makeTask(r, n, v) {
  return function() {
    n = parseInt(n + r.note_incr);
    v = parseInt(v * r.velocity_coeff);

    //utils.log({
    //  n: n,
    //  v: v,
    //  d: r.duration,
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
    for (var idx = 0; idx < noteRepeats.length; idx++) {
      var t = new Task( makeTask(noteRepeats[idx], options[INLET_NOTE], options[INLET_VELOCITY]) );
      t.schedule(noteRepeats[idx].ms);
    }
  }
}

function draw() {
  // start drawing
  sketch.glclearcolor(1.0, 1.0, 1.0, 0.0); // transparent
  sketch.glclear();

  var lastRepeat = vizRepeats[vizRepeats.length - 1];
  var maxMs = lastRepeat[lastRepeat.length - 1].ms;
  var numTaps = 0;

  var xMin = -5.5;
  var xMax = 5.5;
  var yMin = -0.7;
  var yMax = 0.8;

  for (var vizIdx = vizRepeats.length - 1; vizIdx >= 0; vizIdx--) {
    var vizLane = vizRepeats[vizIdx];
    //utils.log(vizLane);

    if (vizIdx > 0) {
      // vertical line to connect to the parent bar
      sketch.glcolor(0,0,0,0.8);
      sketch.glrect(
        scale(vizLane[0].ms, 0, maxMs, xMin, xMax),                  // x0
        scale(vizIdx, 1, vizRepeats.length, yMin, yMax),      // y0
        scale(vizLane[0].ms, 0, maxMs, xMin, xMax) + 0.02,           // x1
        scale(vizLane[0].parent, 1, vizRepeats.length, yMin, yMax) + 0.02       // y1
      );
    }

    // lane bar
    var hue = (360 + (30 * vizLane[1].note_incr) % 360) % 360;
    var color = utils.HSLToRGB(hue, 0.9, 0.6);
    sketch.glcolor(color.r, color.g, color.b, 0.6);
    sketch.glrect(
      scale(vizLane[0].ms, 0, maxMs, xMin, xMax),                  // x0
      scale(vizIdx, 1, vizRepeats.length, yMin, yMax) - 0.02,      // y0
      scale(vizLane[vizLane.length - 1].ms, 0, maxMs, xMin, xMax), // x1
      scale(vizIdx, 1, vizRepeats.length, yMin, yMax) + 0.02       // y1
    );

    for (var rpt = 0; rpt < vizLane.length; rpt++) {
      var xPos = scale(vizLane[rpt].ms, 0, maxMs, xMin, xMax)
      var yPos = scale(vizIdx, 1, vizRepeats.length, yMin, yMax);
      //utils.log('ms: ' + vizLane[rpt].ms + ' scaled: ' + scale(vizLane[rpt].ms, 0, maxMs, -2.25, 3.25));
      sketch.glcolor(0,0,0,1); // black dot to indicate beginning of note

      sketch.glcolor(color.r, color.g, color.b, 1.0);
      sketch.moveto(xPos, yPos);
      sketch.circle(vizLane[rpt].velocity_coeff * 0.25);
      numTaps++;
    }
  }
  if (noteRepeats.length > 0) {
    sketch.moveto(xMin - 0.25, yMax);
    sketch.textalign("left");
    var lastTap = noteRepeats[noteRepeats.length - 1];
    sketch.glcolor(1,1,1,1); // white text
    sketch.text(noteRepeats.length + " Notes // Total " + parseInt(lastTap.ms + lastTap.duration)/1000 + " seconds");
  }
}

function scale(val, valMin, valMax, outMin, outMax) {
  var valRange = valMax - valMin;
  if (valRange === 0) { return outMin; }

  var outRange = outMax - outMin;

  var scaler = outRange / valRange;

  return (val * scaler) + outMin;
}
