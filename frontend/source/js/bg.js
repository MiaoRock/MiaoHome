(function () {
    if (document.getElementById('miao-bg')) return;

    const bg = document.createElement('div');
    bg.id = 'miao-bg';
    bg.innerHTML = `
        <video autoplay muted loop playsinline poster="/img/home/bg.jpg">
            <source src="/img/home/bg.webm" type="video/webm">
            <source src="/img/home/bg.mp4" type="video/mp4">
        </video>
    `;

    document.body.insertBefore(bg, document.body.firstChild);
})();