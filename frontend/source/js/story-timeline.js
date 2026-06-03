async function loadStory() {
    const API_BASE = window.APP_CONFIG.API_BASE;
    const container = document.getElementById('story-timeline');
    container.innerHTML = '';

    try {
        const res = await fetch(`${API_BASE}/api/story`);
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

        if (container.dataset.page === 'story') {
            const links = container.querySelectorAll('.article-sort-item-title');

            links.forEach(function (link) {
                link.addEventListener('click', function (event) {
                    event.preventDefault();

                    if (typeof window.loadStoryByUrl === 'function') {
                        window.loadStoryByUrl(link.getAttribute('href'));
                    }
                });
            });
        }
    } catch (e) {
        container.innerHTML = '<div class="no-content">story error</div>';
        console.error('加载文章失败', e);
    }
}

loadStory();