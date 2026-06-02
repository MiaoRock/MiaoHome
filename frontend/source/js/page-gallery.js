async function loadGalleryPage() {
    const API_BASE = window.APP_CONFIG.API_BASE;
    const preview = document.getElementById('gallery-view');
    const list = document.getElementById('gallery-list');

    list.innerHTML = '';

    try {
        const res = await fetch(`${API_BASE}/api/gallery`);
        const images = await res.json();

        if (!images.length) {
            list.innerHTML = '<div class="no-content">no gallery</div>';
            return;
        }

        images.forEach((file, index) => {
            const url = `${API_BASE}/gallery/${encodeURIComponent(file)}`;

            const img = document.createElement('img');
            img.src = url;
            img.alt = '';
            img.className = 'gallery-thumb';

            img.addEventListener('click', () => {
                preview.src = url;
            });

            list.appendChild(img);

            if (index === 0) {
                preview.src = url;
            }
        });

    } catch (e) {
        list.innerHTML = '<div class="no-content">gallery error</div>';
        console.error('加载图片失败', e);
    }
}

loadGalleryPage();
