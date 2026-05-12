async function loadGallery() {
    const container = document.getElementById('gallery');
    container.innerHTML = ''; // 清空容器

    try {
        const res = await fetch('http://localhost:3000/api/gallery');
        const images = await res.json();

        if (!images.length) {
            container.innerHTML = '<div class="no-content">no gallery</div>';
            return;
        }

        const htmlParts = images.map(file => {
            return `<img src="http://localhost:3000/gallery/${file}" alt="" class="gallery-item">`;
        });

        container.innerHTML = `<div class="gallery-grid">${htmlParts.join('')}</div>`;

    } catch (e) {
        container.innerHTML = '<div class="no-content">gallery error</div>';
        console.error('加载图片失败', e);
    }
}

async function loadStory() {
    const container = document.getElementById('story');
    container.innerHTML = '';

    try {
        const res = await fetch('http://localhost:3000/api/story');
        const monthMap = await res.json();

        const months = Object.keys(monthMap).sort((a, b) => b.localeCompare(a));

        if (!months.length) {
            container.innerHTML = '<div class="no-content">no story</div>';
            return;
        }

        const escapeHtml = str => String(str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');

        const htmlParts = ['<div class="article-sort-title">今日</div>', '<div class="article-sort">'];

        months.forEach(month => {
            monthMap[month].forEach(item => {
                const safeTitle = escapeHtml(item.title);
                const safeDate = escapeHtml(item.dateText);
                htmlParts.push(
                    `<div class="article-sort-item no-article-cover">
                        <div class="article-sort-item-info">
                            <div class="article-sort-item-time">
                                <i class="far fa-calendar-alt"></i>
                                <time class="post-meta-date-created" datetime="${safeDate}">${safeDate}</time>
                            </div>
                            <a class="article-sort-item-title" href="${item.url}" title="${safeTitle}">${safeTitle}</a>
                        </div>
                    </div>`
                );
            });
            htmlParts.push(`<div class="article-sort-item year">${escapeHtml(month)}</div>`);
        });

        htmlParts.push('</div>');
        container.innerHTML = htmlParts.join('');

    } catch (e) {
        container.innerHTML = '<div class="no-content">story error</div>';
        console.error('加载文章失败', e);
    }
}

loadGallery();
loadStory();