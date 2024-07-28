autowatch = 1;
inlets = 1;
outlets = 1;
var INLET_FOO = 0;
var OUTLET_FOO = 0;
setinletassist(INLET_FOO, 'Description of Inlet');
setoutletassist(OUTLET_FOO, 'Description of Outlet');
var debugLog = true;
function debug(_) {
    if (debugLog) {
        post(
        //'[' + debug.caller ? debug.caller.name : 'ROOT' + ']',
        Array.prototype.slice.call(arguments).join(' '), '\n');
    }
}
debug('reloaded');
