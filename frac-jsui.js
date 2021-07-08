autowatch=1;
sketch.default2d();
sketch.glloadidentity();
sketch.glortho(0., 1, -0.5, 0.5, -1,1.);
var pattern = [];
var utils = require("utils.js");

function draw()
{
  var tap;
  var offset;
  var color;
  var hue;
  var thick_coeff = 10;

  var xs = scaleNotes(pattern, -2.25, 3.25);
  var ys = utils.scale(pattern.map( function (tap) { return tap.level; } ), 0.26, -0.20);
  var durations = utils.scale(pattern.map( function (tap) { return tap.duration; } ), .25, 0.5);

  // start drawing
  sketch.glclearcolor(1.0, 1.0, 1.0, 1.0);
  sketch.glclear();

  for (var i = 0; i < pattern.length; i++) {
    tap = pattern[i];

    // set foreground color
    hue = (360 + (30 * tap.note_incr) % 360) % 360;

    //utils.log({
    //  tap: tap,
    //  x1: xs.start[i],
    //  x2: xs.end[i],
    //  y: ys[i],
    //  hue: hue
    //});

    color = utils.HSLToRGB(hue, 0.9, 0.6);
    sketch.glcolor(color.r, color.g, color.b, 1.0);
    sketch.glrect(xs.start[i], ys[i] - (tap.velocity_coeff / thick_coeff), xs.end[i], ys[i] + (tap.velocity_coeff / thick_coeff));
    sketch.glcolor(0,0,0,1); // black dot to indicate beginning of note
    sketch.glrect(xs.start[i], ys[i] - (tap.velocity_coeff / thick_coeff * 1.1), xs.start[i] + 0.05, ys[i] + (tap.velocity_coeff / thick_coeff * 1.1));
  }
  sketch.glcolor(0, 0, 0, 1.0);
  sketch.moveto(0.5, -.4);
  if (pattern.length > 0) {
    sketch.textalign("center");
    var lastTap = pattern[pattern.length - 1];
    sketch.text("<--- " + pattern.length + " Taps // Total " + parseInt(lastTap.ms + lastTap.duration)/1000 + " seconds --->");
  }
}


function repeats(data) {
  pattern = arrayfromargs(arguments);
  //utils.log("Received: " + JSON.stringify(pattern));
  draw();
  refresh();
}

function onresize(w,h)
{
  //utils.log(w,h);
  draw();
  refresh();
}

function forcesize(w,h)
{
  var aspect = 6;
  if (w!=h*aspect) {
    h = Math.floor(w/aspect);
    w = h*aspect;
    box.size(w,h);
  }
}
forcesize.local = 1; //private

function onresize(w,h)
{
  forcesize(w,h);
  draw();
  refresh();
}
onresize.local = 1; //private

draw();

//////
////// UTILS BELOW
//////

// scale the note starts and ends in the pattern
function scaleNotes(pattern, newMin, newMax) {
  // get range
  var min = null
  var max = null;
  for (var i = 0; i < pattern.length; i++) {
    var noteStart = pattern[i].ms;
    var noteEnd = noteStart + pattern[i].duration;
    if (min === null || noteStart < min) { min = noteStart; }
    if (max === null || noteEnd > max) { max = noteEnd; }
  }
  var range = max - min;

  var newRange = newMax - newMin;

  var coeff = range ? newRange / parseFloat(range) : 0.0;

  var offset = newMin - (min * coeff)

  var returnObj = {
    start: [],
    end: []
  };
  for (var i = 0; i < pattern.length; i++) {
    returnObj.start.push(pattern[i].ms * coeff + offset);
    returnObj.end.push((pattern[i].ms + pattern[i].duration) * coeff + offset);
  }
  //utils.log(returnArray);
  return returnObj;
}
