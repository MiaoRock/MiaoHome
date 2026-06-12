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
            columns[0].appendChild(createGalleryAddCard());
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

function createGalleryAddCard() {
    const buttonCard = document.createElement('button');
    buttonCard.type = 'button';
    buttonCard.className = 'gallery-add-card';
    buttonCard.innerHTML = `
        <div class="gallery-add-icon">+</div>
    `;

    buttonCard.addEventListener('click', () => {
        const modal = getGalleryAdd();
        modal.classList.add('show');
    });

    return buttonCard;
}

function getGalleryAdd() {
    const API_BASE = window.APP_CONFIG.API_BASE;
    const existsModal = document.getElementById('gallery-add');
    if (existsModal) return existsModal;

    const modal = document.body.appendChild(document.createElement('div'));
    modal.id = 'gallery-add';

    const show = modal.appendChild(document.createElement('div'));
    show.className = 'gallery-add-show';

    const selectLabel = show.appendChild(document.createElement('label'));
    selectLabel.className = 'gallery-add-select';

    const fileInput = selectLabel.appendChild(document.createElement('input'));
    fileInput.id = 'gallery-add-file';
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.multiple = true;

    const selectIcon = selectLabel.appendChild(document.createElement('div'));
    selectIcon.className = 'gallery-add-select-icon';
    selectIcon.textContent = '＋';

    const footer = show.appendChild(document.createElement('div'));
    footer.className = 'gallery-add-footer';

    const info = footer.appendChild(document.createElement('div'));
    info.id = 'gallery-add-info';
    info.textContent = '未选择图片';

    const submitBtn = footer.appendChild(document.createElement('button'));
    submitBtn.id = 'gallery-add-submit';
    submitBtn.type = 'button';
    submitBtn.textContent = '上传';

    const closeBtn = footer.appendChild(document.createElement('button'));
    closeBtn.id = 'gallery-add-close';
    closeBtn.type = 'button';
    closeBtn.textContent = '关闭';

    const message = show.appendChild(document.createElement('div'));
    message.id = 'gallery-add-message';

    // 关闭按钮
    closeBtn.addEventListener('click', () => modal.classList.remove('show'));

    // 文件选择
    fileInput.addEventListener('change', () => {
        info.textContent = '';
        if (!fileInput.files.length) {
            info.textContent = '未选择图片';
            return;
        }
        Array.from(fileInput.files).forEach(file => {
            const fileName = info.appendChild(document.createElement('div'));
            fileName.textContent = file.name;
            fileName.title = file.name;
        });
    });

    // 上传
    submitBtn.addEventListener('click', async () => {
        if (!fileInput.files.length) {
            message.textContent = '请选择图片';
            return;
        }
        const formData = new FormData();
        Array.from(fileInput.files).forEach(file => formData.append('files', file));

        submitBtn.disabled = true;
        submitBtn.textContent = '上传中...';
        message.textContent = '';

        try {
            const res = await fetch(API_BASE + '/api/admin/gallery/add', { method: 'POST', body: formData });
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
            submitBtn.textContent = '上传';
        }
    });

    return modal;
}

loadGallery();
