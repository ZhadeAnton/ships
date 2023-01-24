window.VKAnalyticsStatus = null;
window.VKAnalyticsCallbacks = [];
window.VKAnalyticsSentEvents = [];
window.VKAnalyticsSentGoals = [];

function getVKAnalytics(callback = null, onerror = null) {
    if (window.VKAnalyticsStatus === 'error') {
        console.error('VK Analytics is not available');
        return;
    }

    if (window.VKAnalyticsStatus === 'loading') {
        console.error('VK Analytics is being loaded');
        if (callback) {
            VKAnalyticsCallbacks.push(callback);
        }

        return;
    }

    if (window.VKAnalyticsStatus === 'initialized' && callback) {
        callback();
        return;
    }

    if (!window.VKAnalyticsStatus) {
        window.VKAnalyticsStatus = 'loading';

        const script = document.createElement("script");
        script.type = 'text/javascript';
        script.src = 'https://vk.com/js/api/openapi.js?169';
        script.onload = function() {
            window.VKAnalyticsStatus = 'initialized';

            if (callback) {
                callback();
            }

            VKAnalyticsCallbacks.forEach(callback => callback());
        };
        script.onabort = function () {
            window.VKAnalyticsStatus = 'error';
            if (onerror) {
                onerror();
            }
        }
        script.onerror = function () {
            window.VKAnalyticsStatus = 'error';
            if (onerror) {
                onerror();
            }
        }

        document.head.appendChild(script);
    }
}

function sendVKAnalyticsEvent(event, once = false) {
    if (once && VKAnalyticsSentEvents.includes(event)) {
        return;
    }

    console.info('Sending', event, 'event to VK');

    getVKAnalytics(function () {
        VK.Retargeting.Event(event);
        VKAnalyticsSentEvents.push(event);
    });
}

function sendVKAnalyticsGoal(event, once = false) {
    if (once && VKAnalyticsSentGoals.includes(event)) {
        return;
    }

    console.info('Sending', event, 'event to VK');

    getVKAnalytics(function () {
        VK.Goal(event);
        VKAnalyticsSentGoals.push(event);
    });
}
