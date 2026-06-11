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

        if (galleryWall.dataset.page === 'admin') {
            columns[0].appendChild(createGalleryAddCard(API_BASE));
            columnHeights[0] += 1;
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
            const ratio = img.naturalWidth ? img.naturalHeight / img.naturalWidth : 1;
            return {
                element: a, ratio
            };
        }));

        items.forEach(item => {
            const targetIndex = columnHeights.indexOf(Math.min(...columnHeights));
            columns[targetIndex].appendChild(item.element);
            columnHeights[targetIndex] += item.ratio;
        });

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

function createGalleryAddCard(API_BASE) {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'gallery-add-card';

    card.innerHTML = `
        <div class="gallery-add-icon">+</div>
        <div class="gallery-add-title">上传图片</div>
        <div class="gallery-add-desc">点击选择图片</div>
    `;

    card.addEventListener('click', function () {
        const modal = ensureGalleryUploadModal(API_BASE);
        modal.classList.add('show');
    });

    return card;
}

function ensureGalleryUploadModal(API_BASE) {
    let modal = document.getElementById('gallery-upload-modal');

    if (modal) {
        return modal;
    }

    modal = document.createElement('div');
    modal.id = 'gallery-upload-modal';
    modal.className = 'gallery-upload-modal';

    modal.innerHTML = `
        <div class="gallery-upload-dialog">
            <div class="gallery-upload-header">
                <div>
                    <div class="gallery-upload-title">上传图片</div>
                    <div class="gallery-upload-subtitle">选择图片后上传到图片墙</div>
                </div>
                <button type="button" class="gallery-upload-close">×</button>
            </div>

            <label class="gallery-upload-select">
                <input id="gallery-upload-file" type="file" accept="image/*" multiple>
                <div class="gallery-upload-select-icon">＋</div>
                <div class="gallery-upload-select-text">点击选择图片</div>
                <div class="gallery-upload-select-desc">支持 JPG / PNG / WEBP，多选上传</div>
            </label>

            <div class="gallery-upload-footer">
                <div id="gallery-upload-info" class="gallery-upload-info">未选择图片</div>
                <button id="gallery-upload-submit" type="button" class="gallery-upload-submit">上传</button>
            </div>

            <div id="gallery-upload-message" class="gallery-upload-message"></div>
        </div>
    `;

    document.body.appendChild(modal);

    const closeBtn = modal.querySelector('.gallery-upload-close');
    const fileInput = modal.querySelector('#gallery-upload-file');
    const info = modal.querySelector('#gallery-upload-info');
    const submitBtn = modal.querySelector('#gallery-upload-submit');
    const message = modal.querySelector('#gallery-upload-message');

    closeBtn.addEventListener('click', function () {
        modal.classList.remove('show');
    });

    modal.addEventListener('click', function (e) {
        if (e.target === modal) {
            modal.classList.remove('show');
        }
    });

    fileInput.addEventListener('change', function () {
        if (!fileInput.files.length) {
            info.innerHTML = '未选择图片';
            return;
        }

        info.innerHTML = '已选择 ' + fileInput.files.length + ' 张图片';
    });

    submitBtn.addEventListener('click', async function () {
        if (!fileInput.files.length) {
            message.innerHTML = '请选择图片';
            return;
        }

        const formData = new FormData();

        Array.from(fileInput.files).forEach(function (file) {
            formData.append('files', file);
        });

        submitBtn.disabled = true;
        submitBtn.innerHTML = '上传中...';
        message.innerHTML = '';

        try {
            const res = await fetch(`${API_BASE}/api/admin/gallery/upload`, {
                method: 'POST', body: formData
            });

            if (!res.ok) {
                message.innerHTML = '上传失败';
                submitBtn.disabled = false;
                submitBtn.innerHTML = '上传';
                return;
            }

            await res.json();

            fileInput.value = '';
            info.innerHTML = '未选择图片';
            message.innerHTML = '上传成功';

            modal.classList.remove('show');
            await loadGallery();
        } catch (e) {
            message.innerHTML = '上传失败';
            console.error('上传图片失败', e);
        }

        submitBtn.disabled = false;
        submitBtn.innerHTML = '上传';
    });

    return modal;
}

loadGallery();
