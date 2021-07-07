autowatch=1;
sketch.default2d();
sketch.glloadidentity();
sketch.glortho(0., 1, -0.5, 0.5, -1,1.);
var pattern = [];

function draw()
{
  var tap;
  var offset;
  var color;
  var hue;
  var thick_coeff = 10;

  var xs = scaleNotes(pattern, -2.25, 3.25);
  var ys = scale(pattern.map( function (tap) { return tap.level; } ), 0.26, -0.20);
  var durations = scale(pattern.map( function (tap) { return tap.duration; } ), .25, 0.5);

  // start drawing
  sketch.glclearcolor(1.0, 1.0, 1.0, 1.0);
  sketch.glclear();

  for (var i = 0; i < pattern.length; i++) {
    tap = pattern[i];

    // set foreground color
    hue = (360 + (30 * tap.note_incr) % 360) % 360;

    //log({
    //  tap: tap,
    //  x1: xs.start[i],
    //  x2: xs.end[i],
    //  y: ys[i],
    //  hue: hue
    //});

    color = HSLToRGB(hue, 0.9, 0.6);
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
  //log("Received: " + JSON.stringify(pattern));
  draw();
  refresh();
}

function onresize(w,h)
{
  //log(w,h);
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
  //log(returnArray);
  return returnObj;
}
// scale the values in a numeric array to the bounds specified in newMin, newMax
function scale(array, newMin, newMax) {
  // get range
  var min = null
  var max = null;
  for (var i = 0; i < array.length; i++) {
    if (min === null || array[i] < min) { min = array[i]; }
    if (max === null || array[i] > max) { max = array[i]; }
  }
  var range = max - min;

  var newRange = newMax - newMin;

  var coeff = range ? newRange / parseFloat(range) : 0.0;

  var offset = newMin - (min * coeff);

  var returnArray = [];
  for (var i = 0; i < array.length; i++) {
    returnArray.push(array[i] * coeff + offset);
  }

  //log({
  //    min: min,
  //    max: max,
  //    range: range,
  //    newRange: newRange,
  //    coeff: coeff,
  //    offset: offset,
  //    return: returnArray
  //});

  return returnArray;
}

function HSLToRGB(h,s,l) {
  //log({ h: h, s: s, l: l });

  var c = (1 - Math.abs(2 * l - 1)) * s,
      x = c * (1 - Math.abs((h / 60) % 2 - 1)),
      m = l - c/2,
      r = 0,
      g = 0,
      b = 0;
  if (0 <= h && h < 60) {
    r = c; g = x; b = 0;
  } else if (60 <= h && h < 120) {
    r = x; g = c; b = 0;
  } else if (120 <= h && h < 180) {
    r = 0; g = c; b = x;
  } else if (180 <= h && h < 240) {
    r = 0; g = x; b = c;
  } else if (240 <= h && h < 300) {
    r = x; g = 0; b = c;
  } else if (300 <= h && h < 360) {
    r = c; g = 0; b = x;
  }
  return {
    r: r + m,
    g: g + m,
    b: b + m
  };
}

function log() {
  for(var i=0,len=arguments.length; i<len; i++) {
    var message = arguments[i];
    if(message && message.toString) {
      var s = message.toString();
      if(s.indexOf("[object ") >= 0) {
        s = JSON.stringify(message);
      }
      post(s);
    }
    else if(message === null) {
      post("<null>");
    }
    else {
      post(message);
    }
  }
  post("\n");
}
