async function loadGallery() {
    const API_BASE = window.APP_CONFIG.API_BASE;
    const galleryWall = document.getElementById('gallery-wall');
    galleryWall.innerHTML = '';

    try {
        const res = await fetch(`${API_BASE}/api/gallery`);
        const images = await res.json();

        if (!images.length) {
            galleryWall.innerHTML = '<div class="no-content">no gallery</div>';
            return;
        }

        const grid = document.createElement('div');
        grid.className = 'gallery-grid';

        const columnCount = 3;
        const columns = [];
        const columnHeights = new Array(columnCount).fill(0);

        for (let i = 0; i < columnCount; i++) {
            const col = document.createElement('div');
            col.className = 'gallery-col';
            grid.appendChild(col);
            columns.push(col);
        }

        const items = await Promise.all(images.map(async file => {
            const url = `${API_BASE}/gallery/${encodeURIComponent(file)}`;
            const img = await loadImage(url);

            img.alt = '';

            const a = document.createElement('a');
            a.href = `/gallery/${encodeURIComponent(file)}`;
            a.appendChild(img);

            const ratio = img.naturalWidth ? img.naturalHeight / img.naturalWidth : 1;

            return {
                element: a,
                ratio
            };
        }));

        items.forEach(item => {
            const targetIndex = columnHeights.indexOf(Math.min(...columnHeights));
            columns[targetIndex].appendChild(item.element);
            columnHeights[targetIndex] += item.ratio;
        });

        galleryWall.appendChild(grid);

        if (window.pjax) {
            window.pjax.refresh(galleryWall);
        } else {
            window.addEventListener('load', function () {
                if (window.pjax) {
                    window.pjax.refresh(galleryWall);
                }
            }, { once: true });
        }
    } catch (e) {
        galleryWall.innerHTML = '<div class="no-content">gallery error</div>';
        console.error('加载图片失败', e);
    }
}

function loadImage(src) {
    return new Promise(resolve => {
        const img = new Image();

        img.onload = () => resolve(img);
        img.onerror = () => resolve(img);
        img.src = src;
    });
}

loadGallery();
