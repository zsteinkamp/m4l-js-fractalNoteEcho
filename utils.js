// scale the values in a numeric array to the bounds specified in newMin, newMax
exports.scale = function(array, newMin, newMax) {
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

  //exports.log({
  //    min: min,
  //    max: max,
  //    range: range,
  //    newRange: newRange,
  //    coeff: coeff,
  //    offset: offset,
  //    return: returnArray
  //});

  return returnArray;
};

exports.HSLToRGB = function(h,s,l) {
  //exports.log({ h: h, s: s, l: l });

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
};

exports.log = function() {
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
};
