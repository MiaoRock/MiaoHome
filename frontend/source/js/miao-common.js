window.APP_CONFIG = {
    API_BASE: window.location.hostname === 'localhost'
        ? 'http://localhost:3000'
        : ''
};

window.miaoRefreshPjax = function (element) {
    if (!element) {
        return;
    }

    if (window.pjax) {
        window.pjax.refresh(element);
    } else {
        window.addEventListener('load', () => {
            if (window.pjax) {
                window.pjax.refresh(element);
            }
        }, {once: true});
    }
};