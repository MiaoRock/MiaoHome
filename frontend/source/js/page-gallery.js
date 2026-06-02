async function loadGalleryPage() {
    const API_BASE = window.APP_CONFIG.API_BASE;
    const preview = document.getElementById('gallery-view');
    const list = document.getElementById('gallery-list');
    const title = document.getElementById('gallery-title');

    list.innerHTML = '';

    try {
        const res = await fetch(`${API_BASE}/api/gallery`);
        const images = await res.json();

        if (!images.length) {
            list.innerHTML = '<div class="no-content">no gallery</div>';
            return;
        }

        const selectedFile = getGalleryFileFromPath();
        let selectedUrl = '';

        images.forEach((file, index) => {
            const url = `${API_BASE}/gallery/${encodeURIComponent(file)}`;

            const img = document.createElement('img');
            img.src = url;
            img.alt = '';
            img.className = 'gallery-thumb';

            img.addEventListener('click', function () {
                preview.src = url;
                history.replaceState(null, '', `/gallery/${encodeURIComponent(file)}/`);
            });

            list.appendChild(img);

            if (selectedFile && selectedFile === file) {
                selectedUrl = url;
            }

            if (!selectedFile && index === 0) {
                selectedUrl = url;
            }
        });

        if (!selectedUrl) {
            selectedUrl = `${API_BASE}/gallery/${encodeURIComponent(images[0])}`;
        }

        preview.src = selectedUrl;
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
    let file = path.substring(prefix.length);
    file = file.replace(/\/+$/, '');
    if (!file || file === 'index.html') {
        return '';
    }
    return decodeURIComponent(file);
}

loadGalleryPage();
