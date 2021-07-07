autowatch=1;
sketch.default2d();
sketch.glloadidentity();
sketch.glortho(0., 1, -0.5, 0.5, -1,1.);
var pattern = [];

function draw()
{
  sketch.glclearcolor(1.0, 1.0, 1.0, 1.0);
  sketch.glclear();

  var maxMs = 0;
  var minNote = 0;
  var maxNote = 0;
  var minVelo = 0;
  var maxVelo = 0;
  var tap;
  var offset;
  var color;
  for (var i = 0; i < pattern.length; i++) {
    tap = pattern[i];
    //log(tap);
    if (tap.ms > maxMs) { maxMs = tap.ms; }
    if (tap.note_incr > maxNote) { maxNote = tap.note_incr; }
    if (tap.note_incr < minNote) { minNote = tap.note_incr; }
    if (tap.velocity_coeff > maxVelo) { maxVelo = tap.velocity_coeff; }
    if (tap.velocity_coeff < minVelo) { minVelo = tap.velocity_coeff; }
  }

  var noteRange = maxNote - minNote;
  var veloRange = maxVelo - minVelo;
  var hue;

  //log({
  //  MaxMS: maxMs,
  //  MinNote: minNote,
  //  MaxNote: maxNote,
  //  NoteRange: noteRange
  //});

  var brights   = scale(pattern.map( function (tap) { return tap.velocity_coeff; } ), 0.75, 0.25);
  var x_offsets = scale(pattern.map( function (tap) { return tap.ms; } ), -2.25, 3);
  var y_offsets = scale(pattern.map( function (tap) { return tap.level; } ), 0.26, -0.25);
  var durations = scale(pattern.map( function (tap) { return tap.duration; } ), .25, 0.5);

  for (var i = 0; i < pattern.length; i++) {
    tap = pattern[i];
    sketch.moveto(x_offsets[i], y_offsets[i]);
    // set foreground color
    hue = (360 + (30 * tap.note_incr) % 360) % 360;

    //log({
    //  note_incr: tap.note_incr,
    //  ms: tap.ms,
    //  offset: offset,
    //  hue: hue
    //});
    color = HSLToRGB(hue, 0.8, brights[i]);
    sketch.glcolor(color.r, color.g, color.b, 1.0);
    sketch.glrect(x_offsets[i], y_offsets[i], x_offsets[i] + durations[i], y_offsets[i] + 0.1);
  }
  sketch.glcolor(0, 0, 0, 1.0);
  sketch.moveto(0.5, -.4);
  if (pattern.length > 0) {
    sketch.textalign("center");
    sketch.text("<--- " + pattern.length + " Taps // Total " + parseInt(pattern[pattern.length - 1].ms)/1000 + " seconds --->");
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

  var coeff = newRange / parseFloat(range);

  var offset = newMin - (min * coeff)

  var returnArray = [];
  for (var i = 0; i < array.length; i++) {
    returnArray.push(array[i] * coeff + offset);
  }
  //log(returnArray);
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
