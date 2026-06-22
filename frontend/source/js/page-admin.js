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

async function loadStoryAdd() {
    const API_BASE = window.APP_CONFIG.API_BASE;
    const modal = document.getElementById('story-add');
    const res = await fetch('/static/story/add.html');
    modal.innerHTML = await res.text();

    const storyInput = document.getElementById('story-add-story');
    const storySubInput = document.getElementById('story-add-story-sub');
    const titleInput = document.getElementById('story-add-title');
    const titleSubInput = document.getElementById('story-add-title-sub');
    const dateInput = document.getElementById('story-add-date');
    const contentInput = document.getElementById('story-add-content');
    const submitBtn = document.getElementById('story-add-submit');
    const closeBtn = document.getElementById('story-add-close');
    const message = document.getElementById('story-add-message');
    dateInput.value = getToday();
    closeBtn.addEventListener('click', () => {
        storyInput.value = '';
        titleInput.value = '';
        dateInput.value = getToday();
        contentInput.value = '';
        message.textContent = '';
        modal.classList.remove('show');
    });
    submitBtn.addEventListener('click', async () => {
        const storyMain = storyInput.value.trim();
        const storySub = storySubInput.value.trim();
        const titleMain = titleInput.value.trim();
        const titleSub = titleSubInput.value.trim();
        if (!storyMain || !titleMain || !date || !content) {
            message.textContent = '请填写完整内容';
            return;
        }
        const story = storySub ? `${storyMain} - ${storySub}` : storyMain;
        const title = titleSub ? `${titleMain} - ${titleSub}` : titleMain;
        const fileName = `${storyMain}-${titleMain}.md`;
        const date = dateInput.value;
        const content = contentInput.value.trim();

        submitBtn.disabled = true;
        closeBtn.disabled = true;
        message.textContent = '保存中...';
        try {
            const res = await fetch(API_BASE + '/api/admin/story/add', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({story, title, date, content, fileName})
            });
            if (!res.ok) {
                message.textContent = '保存失败';
                return;
            }
            message.textContent = '保存成功';
            await loadStory();
        } catch (e) {
            message.textContent = '保存失败';
            console.error('新增Story失败', e);
        } finally {
            submitBtn.disabled = false;
            closeBtn.disabled = false;
        }
    });
}

function getToday() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

loadStoryAdd();