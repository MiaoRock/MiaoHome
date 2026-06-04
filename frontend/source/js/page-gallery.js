async function loadGalleryPage() {
    const API_BASE = window.APP_CONFIG.API_BASE;
    const view = document.getElementById('gallery-view');
    const list = document.getElementById('gallery-list');
    const title = document.getElementById('gallery-title');

    list.innerHTML = '';
    title.textContent = '';

    try {
        const res = await fetch(`${API_BASE}/api/gallery`);
        const images = await res.json();

        if (!images.length) {
            list.innerHTML = '<div class="no-content">no gallery</div>';
            return;
        }

        const selectedFile = getGalleryFileFromPath();
        const targetFile = images.includes(selectedFile) ? selectedFile : images[0];

        images.forEach(file => {
            const url = `${API_BASE}/gallery/${encodeURIComponent(file)}`;
            const img = list.appendChild(document.createElement('img'));
            img.src = url;
            img.alt = '';
            img.className = 'gallery-thumb';

            img.addEventListener('click', function () {
                view.src = url;
                title.textContent = getFileNameWithoutSuffix(file);
                history.replaceState(null, '', `/gallery/${encodeURIComponent(file)}/`);
            });
        });

        view.src = `${API_BASE}/gallery/${encodeURIComponent(targetFile)}`;
        title.textContent = getFileNameWithoutSuffix(targetFile);
    } catch (e) {
        list.innerHTML = '<div class="no-content">gallery error</div>';
        console.error('加载图片失败', e);
    }
}

function getGalleryFileFromPath() {
    const path = window.location.pathname;
    const prefix = '/gallery/';

    if (!path.startsWith(prefix)) {
        return '';
    }
    const file = path.substring(prefix.length).replace(/\/+$/, '');
    if (!file || file === 'index.html') {
        return '';
    }
    return decodeURIComponent(file);
}

function getFileNameWithoutSuffix(file) {
    return file.replace(/\.[^/.]+$/, '');
}

loadGalleryPage();