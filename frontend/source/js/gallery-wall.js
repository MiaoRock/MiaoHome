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
            const thumbUrl = `${API_BASE}/thumbs/${encodeURIComponent(file)}`;
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
        galleryWall.innerHTML = '<div class="no-content">gallery error</div>';
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

async function loadGalleryAdd() {
    const API_BASE = window.APP_CONFIG.API_BASE;

    const modal = document.getElementById('gallery-add');
    const res = await fetch('/static/gallery/add.html');
    modal.innerHTML = await res.text();

    const fileInput = document.getElementById('gallery-add-file');
    const info = document.getElementById('gallery-add-info');
    const submitBtn = document.getElementById('gallery-add-submit');
    const closeBtn = document.getElementById('gallery-add-close');
    const message = document.getElementById('gallery-add-message');

    fileInput.addEventListener('change', () => {
        info.textContent = '';
        if (!fileInput.files.length) {
            info.textContent = '未选择图片';
            return;
        }
        Array.from(fileInput.files).forEach(file => {
            info.textContent += file.name + ' ';
        });
        info.scrollLeft = 0;
    });

    closeBtn.addEventListener('click', () => {
        fileInput.value = '';
        info.textContent = '未选择图片';
        info.scrollLeft = 0;
        message.textContent = '';
        submitBtn.disabled = false;
        modal.classList.remove('show');
    });

    submitBtn.addEventListener('click', async () => {
        if (!fileInput.files.length) {
            message.textContent = '请选择图片';
            return;
        }
        const formData = new FormData();
        Array.from(fileInput.files).forEach(file => {
            formData.append('files', file);
        });

        submitBtn.disabled = true;
        closeBtn.disabled = true;
        message.textContent = '上传中...';

        try {
            const res = await fetch(API_BASE + '/api/admin/gallery/add', {
                method: 'POST', body: formData
            });

            if (!res.ok) {
                message.textContent = '上传失败';
                return;
            }

            fileInput.value = '';
            info.textContent = '未选择图片';
            message.textContent = '上传成功';
            modal.classList.remove('show');

            await loadGallery();
        } catch (e) {
            message.textContent = '上传失败';
            console.error('上传图片失败', e);
        } finally {
            submitBtn.disabled = false;
            closeBtn.disabled = false;
        }
    });
}

loadGalleryAdd();
loadGallery();
