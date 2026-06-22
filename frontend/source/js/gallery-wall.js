async function loadGallery() {
    const API_BASE = window.APP_CONFIG.API_BASE;
    const galleryWall = document.getElementById('gallery-wall');
    galleryWall.innerHTML = '';

    try {
        const res = await fetch(`${API_BASE}/api/gallery`);
        const images = await res.json();

        const grid = galleryWall.appendChild(document.createElement('div'));
        grid.className = 'gallery-grid';

        const columnCount = 3;
        const columns = [];
        const columnHeights = new Array(columnCount).fill(0);

        for (let i = 0; i < columnCount; i++) {
            const col = grid.appendChild(document.createElement('div'));
            col.className = 'gallery-col';
            columns.push(col);
        }

        const gap = parseFloat(getComputedStyle(columns[0]).rowGap) || 0;

        if (galleryWall.dataset.page === 'admin') {
            const res = await fetch('/static/gallery/add-card.html');
            columns[0].innerHTML = await res.text()
            const addCard = columns[0].firstElementChild;
            const rect = addCard.getBoundingClientRect();
            columnHeights[0] += rect.height + gap;
        }

        if (!images.length) {
            galleryWall.appendChild(document.createElement('div')).textContent = 'no gallery';
            return;
        }

        const items = await Promise.all(images.map(async file => {
            const url = `${API_BASE}/gallery/${encodeURIComponent(file)}`;
            const thumbName = file.replace(/\.[^.]+$/, '.webp');
            const thumbUrl = `${API_BASE}/thumbs/${encodeURIComponent(thumbName)}`;
            const img = await loadImage(thumbUrl, url);
            img.alt = '';

            const a = document.createElement('a');
            a.href = `/gallery/${encodeURIComponent(file)}`;
            a.appendChild(img);

            return {
                element: a
            };
        }));

        items.forEach(item => {
            const targetIndex = columnHeights.indexOf(Math.min(...columnHeights));
            columns[targetIndex].appendChild(item.element);
            const rect = item.element.getBoundingClientRect();
            columnHeights[targetIndex] += rect.height + gap;
        });

        if (window.pjax) {
            window.pjax.refresh(galleryWall);
        } else {
            window.addEventListener('load', () => {
                if (window.pjax) {
                    window.pjax.refresh(galleryWall);
                }
            }, {once: true});
        }
    } catch (e) {
        galleryWall.innerHTML = '<div>gallery error</div>';
        console.error('加载图片失败', e);
    }
}

function loadImage(src, fbSrc) {
    return new Promise(resolve => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => {
            img.onerror = () => resolve(img);
            img.src = fbSrc;
        };
        img.src = src;
    });
}

loadGallery();
