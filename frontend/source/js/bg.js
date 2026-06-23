(function () {
    if (document.getElementById('miao-bg')) return;

    const bg = document.createElement('div');
    bg.id = 'miao-bg';

    const video = document.createElement('video');
    video.id = 'miao-bg-video';
    video.autoplay = true;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = 'none';
    video.poster = '/img/home/bg.jpg';

    bg.appendChild(video);
    document.body.insertBefore(bg, document.body.firstChild);

    const loadBgVideo = () => {
        if (video.dataset.loaded) return;

        video.dataset.loaded = 'true';

        const webmSource = document.createElement('source');
        webmSource.src = '/img/home/bg.webm';
        webmSource.type = 'video/webm';

        const mp4Source = document.createElement('source');
        mp4Source.src = '/img/home/bg.mp4';
        mp4Source.type = 'video/mp4';

        video.appendChild(webmSource);
        video.appendChild(mp4Source);
        video.load();
        video.play().catch(() => {});
    };

    window.addEventListener('load', () => {
        setTimeout(loadBgVideo, 1000);
    }, {once: true});
})();