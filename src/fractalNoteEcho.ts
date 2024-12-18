autowatch = 1
inlets = 13
outlets = 5

// inlets
const INLET_NOTE = 0
const INLET_VELOCITY = 1
const INLET_ITERATIONS = 2
const INLET_STRETCH = 3
const INLET_DECAY = 4
const INLET_NOTEINCR = 5
const INLET_BASE1 = 6
const INLET_BASE2 = 7
const INLET_BASE3 = 8
const INLET_BASE4 = 9
const INLET_DUR_BASE = 10
const INLET_DUR_DECAY = 11
const INLET_SCALE_AWARE = 12

// outlets
const OUTLET_NOTE = 0
const OUTLET_VELOCITY = 1
const OUTLET_DURATION = 2
const OUTLET_TOTAL_NOTES = 3
const OUTLET_TOTAL_DURATION = 4

setinletassist(INLET_NOTE, 'Note Number (int)')
setinletassist(INLET_VELOCITY, 'Note Velocity (int)')
setinletassist(INLET_ITERATIONS, 'Iterations (int)')
setinletassist(INLET_STRETCH, 'Duration Stretch (float)')
setinletassist(INLET_DECAY, 'Velocity Decay (float)')
setinletassist(INLET_NOTEINCR, 'Note Increment (int)')
setinletassist(INLET_BASE1, 'Tap 1')
setinletassist(INLET_BASE2, 'Tap 2')
setinletassist(INLET_BASE3, 'Tap 3')
setinletassist(INLET_BASE4, 'Tap 4')
setinletassist(INLET_DUR_BASE, 'Duration Base (float)')
setinletassist(INLET_DUR_DECAY, 'Duration Decay (float)')
setinletassist(INLET_SCALE_AWARE, 'Scale Aware (1|0)')

// outlets
setoutletassist(OUTLET_NOTE, 'Note Number (int)')
setoutletassist(OUTLET_VELOCITY, 'Note Velocity (int)')
setoutletassist(OUTLET_DURATION, 'Note Duration (ms)')
setoutletassist(OUTLET_TOTAL_NOTES, 'Number of notes (int)')
setoutletassist(OUTLET_TOTAL_DURATION, 'Pattern Duration (ms)')

const colors: Color[] = [
  // generated at https://supercolorpalette.com/?scp=G0-lch-FF6561-F58126-C49C00-84AE04-00B950-00BE93-00BFD5-00BAFF-00AEFF-7397FF-DA79F8-FF5DBC
  // using the 'LCH' color model, since HSB generates colors of varying brightness
  '#FF6561',
  '#F58126',
  '#C49C00',
  '#84AE04',
  '#00B950',
  '#00BE93',
  '#00BFD5',
  '#00BAFF',
  '#00AEFF',
  '#7397FF',
  '#DA79F8',
  '#FF5DBC',
].map((hex: string) => {
  const matches = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return matches
    ? [
        parseInt(matches[1], 16) / 255.0,
        parseInt(matches[2], 16) / 255.0,
        parseInt(matches[3], 16) / 255.0,
        1,
      ]
    : [0, 0, 0, 1]
})

// set up sketch canvas
sketch.default2d()
sketch.glloadidentity()

const utils = {
  // scale the values in a numeric array to the bounds specified in newMin, newMax
  scale: function (array: number[], newMin: number, newMax: number) {
    // get range
    let min = null
    let max = null
    for (let i = 0; i < array.length; i++) {
      if (min === null || array[i] < min) {
        min = array[i]
      }
      if (max === null || array[i] > max) {
        max = array[i]
      }
    }
    const range = max - min
    const newRange = newMax - newMin
    const coeff = range ? newRange / range : 0.0
    const offset = newMin - min * coeff
    const returnArray = []

    for (let i = 0; i < array.length; i++) {
      returnArray.push(array[i] * coeff + offset)
    }

    return returnArray
  },

  log: function (p0: string) {
    for (let i = 0, len = arguments.length; i < len; i++) {
      const message = arguments[i]
      if (message && message.toString) {
        let s = message.toString()
        if (s.indexOf('[object ') >= 0) {
          s = JSON.stringify(message)
        }
        post(s)
      } else if (message === null) {
        post('<null>')
      } else {
        post(message)
      }
    }
    post('\n')
  },
}

// state arrays
let pattern: TapMeta[] = [] // base tap pattern
let noteRepeats: NoteMeta[] = [] // flat repeats array for scheduling notes
let vizRepeats: (LaneMeta | NoteMeta)[][] = [] // array to hold repeats for visualization

// set defaults
const options = [
  0, // INLET_NOTE
  0, // INLET_VELOCITY
  2, // INLET_ITERATIONS
  0.75, // INLET_STRETCH
  0.66, // INLET_DECAY
  0, // INLET_NOTEINCR
  500, // INLET_BASE1
  1000, // INLET_BASE2
  0, // INLET_BASE3
  0, // INLET_BASE4
  100, // INLET_DUR_BASE
  0.5, // INLET_DUR_DECAY
  1, // INLET_SCALE_AWARE
]

// initialize
//setupRepeats();
type ScaleType = {
  notes: number[]
  watchers: {
    root: LiveAPI
    int: LiveAPI
    mode: LiveAPI
  }
}
const scaleMeta: ScaleType = {
  notes: [],
  watchers: {
    root: null,
    int: null,
    mode: null,
  },
}

function init() {
  if (!scaleMeta.watchers.root) {
    scaleMeta.watchers.root = new LiveAPI(updateScales, 'live_set')
    scaleMeta.watchers.root.property = 'root_note'

    scaleMeta.watchers.int = new LiveAPI(updateScales, 'live_set')
    scaleMeta.watchers.int.property = 'scale_intervals'

    scaleMeta.watchers.mode = new LiveAPI(updateScales, 'live_set')
    scaleMeta.watchers.mode.property = 'scale_mode'
  }
}

function updateScales() {
  if (!scaleMeta.watchers.root) {
    //log('early')
    return
  }
  const api = new LiveAPI(() => {}, 'live_set')
  const root = api.get('root_note')
  const intervals = api.get('scale_intervals')
  scaleMeta.notes = []

  let root_note = root - 12
  let note = root_note

  while (note <= 127) {
    for (const interval of intervals) {
      note = root_note + interval
      if (note >= 0 && note <= 127) {
        scaleMeta.notes.push(note)
      }
    }
    root_note += 12
    note = root_note
  }
  //log(
  //  'ROOT=' +
  //    root +
  //    ' INT=' +
  //    intervals +
  //    ' MODE=' +
  //    state.scale_mode +
  //    ' NAME=' +
  //    state.scale_name +
  //    ' AWARE=' +
  //    state.scale_aware +
  //    ' NOTES=' +
  //    state.scale_notes
}

function setupRepeats() {
  if (options[INLET_SCALE_AWARE]) {
    updateScales()
  }
  // set up base pattern
  pattern = [{ origTap: 0, ms: 0 }]
  options[INLET_BASE1] &&
    pattern.push({ origTap: 1, ms: Math.floor(options[INLET_BASE1]) })
  options[INLET_BASE2] &&
    pattern.push({ origTap: 2, ms: Math.floor(options[INLET_BASE2]) })
  options[INLET_BASE3] &&
    pattern.push({ origTap: 3, ms: Math.floor(options[INLET_BASE3]) })
  options[INLET_BASE4] &&
    pattern.push({ origTap: 4, ms: Math.floor(options[INLET_BASE4]) })

  // ensure pattern is in sorted time order
  pattern = pattern.sort(function (a, b) {
    return a.ms - b.ms
  })

  // re-initialize repeats arrays
  vizRepeats = [] // structure optimized for the visualization
  noteRepeats = [] // structure optimized for playing notes

  // populates noteRepeats and vizRepeats
  iterRepeats(options[INLET_ITERATIONS], 0, 0)
  // sort the note repeats from earliest to latest
  noteRepeats = noteRepeats.sort(function (a, b) {
    return a.ms - b.ms
  })
  //utils.log(noteRepeats);

  // redraw the visualization
  draw()
  refresh()
}

function iterRepeats(togo: number, offsetMs: number, parentIdx: number) {
  // Initialize an array to hold information for the current visualization lane.
  // Each call to iterRepeats() will result in a new visualization lane.
  const thisLane: (LaneMeta | NoteMeta)[] = []

  if (offsetMs > 0) {
    // not the base lane, so begin with a special node to link back to the parent
    thisLane.push({ start: true, ms: offsetMs, parent: parentIdx })
  }

  for (let idx = 0; idx < pattern.length; idx++) {
    const level = options[INLET_ITERATIONS] - togo
    const ms = pattern[idx].ms * Math.pow(options[INLET_STRETCH], level)
    if (level > 0 && pattern[idx].ms === 0) {
      continue
    }
    const noteMeta: NoteMeta = {
      ms: Math.floor(ms + offsetMs),
      origTap: pattern[idx].origTap,
      level: level,
      velocity_coeff: Math.pow(options[INLET_DECAY], level + idx / 4.0),
      note_incr: options[INLET_NOTEINCR] * level,
      duration: Math.floor(
        options[INLET_DUR_BASE] *
          Math.pow(options[INLET_DUR_DECAY], level + idx / 4.0)
      ),
    }
    noteRepeats.push(noteMeta)

    thisLane.push(noteMeta)
  }

  // add this lane to the visualization array
  vizRepeats.push(thisLane)

  // get this lane's index to pass to iterRepeats below as the parent index
  const thisLaneIdx = vizRepeats.length - 1

  // loop through the pattern once more to recurse into iterRepeats()
  for (let idx = 0; idx < pattern.length; idx++) {
    const level = options[INLET_ITERATIONS] - togo
    const ms = pattern[idx].ms * Math.pow(options[INLET_STRETCH], level)
    if (togo > 1 && ms > 0) {
      // recurse
      iterRepeats(togo - 1, Math.floor(ms + offsetMs), thisLaneIdx)
    }
  }
}

// utility to return a function that will be used to create a note-playing task
function makeTask(r: NoteMeta, n: number, v: number) {
  return function () {
    if (options[INLET_SCALE_AWARE]) {
      // get base note, look up
      const baseIdx = scaleMeta.notes.indexOf(n)
      const newIdx = baseIdx + r.note_incr
      n = scaleMeta.notes[newIdx]
      //log('NOTE: ' + n + ' base:' + baseIdx + ' new:' + newIdx)
      if (!n) {
        // invalid note
        return
      }
    } else {
      n = Math.floor(n + r.note_incr)
    }

    v = Math.floor(v * r.velocity_coeff)

    //utils.log({
    //  n: n,
    //  v: v,
    //  d: r.duration,
    //});

    outlet(OUTLET_DURATION, r.duration)
    outlet(OUTLET_VELOCITY, v)
    outlet(OUTLET_NOTE, n)

    // Flash the bubble
    r.is_on = true
    draw()
    refresh()
    const t = new Task(() => {
      r.is_on = false
      draw()
      refresh()
    })
    t.schedule(r.duration)
  }
}

// handle int messages
function msg_int(i: number) {
  handleMessage(i)
}
// handle float messages
function msg_float(i: number) {
  handleMessage(i)
}

// method that is called when any input is received on an inlet
function handleMessage(i: any) {
  // 'inlet' is a magic M4L variable to indicate which inlet received the last message
  options[inlet] = i

  if (inlet > INLET_VELOCITY) {
    // one of the knobs was turned, so adjust the pattern and visualization
    setupRepeats()
  }

  if (inlet === INLET_NOTE && options[INLET_VELOCITY] > 0) {
    // note played, so schedule tasks to play notes in the future
    for (let idx = 0; idx < noteRepeats.length; idx++) {
      const t = new Task(
        makeTask(noteRepeats[idx], options[INLET_NOTE], options[INLET_VELOCITY])
      )
      t.schedule(noteRepeats[idx].ms)
    }
  }
}

const COLOR_BG = max.getcolor('live_lcd_bg')
const COLOR_TITLE = max.getcolor('live_lcd_title')

function draw() {
  // clear the jsui area
  sketch.glclearcolor(COLOR_BG)
  sketch.glclear()

  const lastRepeat = vizRepeats[vizRepeats.length - 1]
  const maxMs = lastRepeat[lastRepeat.length - 1].ms

  // Our jsui drawing boundaries.
  // Vertically it can go from -1 to 1, and horizontally from -aspect to aspect.
  // Interestingly, it's the *patcher* aspect ratio (not presentation) that matters.
  const WIDTH = 600
  const HEIGHT = 111
  const ASPECT = (WIDTH - 40) / HEIGHT
  const xMin = -ASPECT
  const xMax = ASPECT
  const yMin = -0.65
  const yMax = 0.8
  const lineWidth = 0.02
  const baseDia = 0.25 // note circle diameter

  // Go backwards through the lanes to build up the visualization from the
  // leaves of the tree to the trunk. This avoids overlapping line issues.
  for (let vizIdx = vizRepeats.length - 1; vizIdx >= 0; vizIdx--) {
    const vizLane = vizRepeats[vizIdx]
    //utils.log(vizLane);

    // All notes in a lane have the same offset, so set up a color for them.
    const color =
      colors[(36 + (vizLane[1] as NoteMeta).note_incr) % colors.length]
    //utils.log('COLOR: ' + color.join(', '))

    const barColor = [...color] as Color
    barColor[3] = 0.6

    if (vizIdx > 0) {
      // vertical line to connect to the parent bar
      //sketch.glcolor(0, 0, 0, 0.8);
      sketch.glcolor(barColor)
      sketch.glrect(
        scale(vizLane[0].ms, 0, maxMs, xMin, xMax), // x0
        scale(vizIdx, 1, vizRepeats.length, yMin, yMax), // y0
        scale(vizLane[0].ms, 0, maxMs, xMin, xMax) + lineWidth, // x1
        scale(
          (vizLane[0] as LaneMeta).parent,
          1,
          vizRepeats.length,
          yMin,
          yMax
        ) + lineWidth // y1
      )
    }

    // Lane bar
    sketch.glcolor(barColor)
    sketch.glrect(
      scale(vizLane[0].ms, 0, maxMs, xMin, xMax), // x0
      scale(vizIdx, 1, vizRepeats.length, yMin, yMax) - lineWidth, // y0
      scale(vizLane[vizLane.length - 1].ms, 0, maxMs, xMin, xMax), // x1
      scale(vizIdx, 1, vizRepeats.length, yMin, yMax) + lineWidth // y1
    )

    // Note circles
    for (let rpt = 0; rpt < vizLane.length; rpt++) {
      const xPos = scale(vizLane[rpt].ms, 0, maxMs, xMin, xMax)
      const yPos = scale(vizIdx, 1, vizRepeats.length, yMin, yMax)
      //utils.log('ms: ' + vizLane[rpt].ms + ' scaled: ' + scale(vizLane[rpt].ms, 0, maxMs, -2.25, 3.25));

      sketch.moveto(xPos, yPos)

      let borderColor = COLOR_BG
      if ((vizLane[rpt] as NoteMeta).is_on) {
        borderColor = COLOR_TITLE
      }
      // outer black circle
      sketch.glcolor(borderColor)
      sketch.circle(
        (baseDia + 0.03) * (vizLane[rpt] as NoteMeta).velocity_coeff,
        0,
        360
      )
      // inner colored circle
      sketch.glcolor(color)
      sketch.circle((vizLane[rpt] as NoteMeta).velocity_coeff * baseDia, 0, 360)
      if (vizIdx === 0) {
        sketch.glcolor(COLOR_BG)
        sketch.textalign('center', 'center')
        sketch.text((vizLane[rpt] as NoteMeta).origTap.toString())
      }
    }
  }

  // Add some informational text
  const lastTap = noteRepeats[noteRepeats.length - 1]
  outlet(OUTLET_TOTAL_NOTES, noteRepeats.length)

  let maxDur = 0
  for (const nr of noteRepeats) {
    const dur = nr.ms + nr.duration
    if (dur > maxDur) {
      maxDur = dur
    }
  }
  outlet(OUTLET_TOTAL_DURATION, Math.floor(maxDur))

  //if (noteRepeats.length > 0) {
  //  sketch.moveto(xMin - baseDia, yMax);
  //  sketch.textalign("left");
  //
  //  sketch.glcolor(1,1,1,1); // white text
  //  sketch.text(noteRepeats.length + " Notes // Total " + parseInt(lastTap.ms + lastTap.duration)/1000 + " seconds");
  //}
}

// Utility to scale a value from one range to another
function scale(
  val: number,
  valMin: number,
  valMax: number,
  outMin: number,
  outMax: number
) {
  const valRange = valMax - valMin

  // if there is no input range, then return the output minimum
  if (valRange === 0) {
    return outMin
  }

  const outRange = outMax - outMin
  const scaler = outRange / valRange

  // y = mx + b, yo
  return scaler * val + outMin
}
