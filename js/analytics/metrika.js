window.MetrikaSentEvents = [];

function reachMetrikaGoal(event, once = false, params = {}) {
    if (once && MetrikaSentEvents.includes(event)) {
        return;
    }

    console.info('Sending', event, 'event to Metrika');

    MetrikaSentEvents.push(event);
    ym(78818886, 'reachGoal', event, params);
}
