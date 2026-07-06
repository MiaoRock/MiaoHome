async function loadStory() {
    const API_BASE = window.APP_CONFIG.API_BASE;
    const storyTimeline = document.getElementById('story-timeline');
    storyTimeline.innerHTML = '';

    try {
        const res = await fetch(`${API_BASE}/api/story/timeline`);
        const stories = await res.json();

        const titleDiv = storyTimeline.appendChild(document.createElement('div'));
        titleDiv.className = 'article-sort-title';
        titleDiv.textContent = '今日';

        const sortDiv = storyTimeline.appendChild(document.createElement('div'));
        sortDiv.className = 'article-sort';

        if (!stories.length) {
            storyTimeline.appendChild(document.createElement('div')).textContent = 'no story';
            return;
        }

        stories.forEach((item, index) => {
            const sortItem = sortDiv.appendChild(document.createElement('div'));
            sortItem.className = 'article-sort-item no-article-cover';

            const infoElement = sortItem.appendChild(document.createElement('div'));
            infoElement.className = 'article-sort-item-info';

            const timeElement = infoElement.appendChild(document.createElement('div'));
            timeElement.className = 'article-sort-item-time';

            const icon = timeElement.appendChild(document.createElement('i'));
            icon.className = 'far fa-calendar-alt';

            const time = timeElement.appendChild(document.createElement('time'));
            time.className = 'post-meta-date-created';
            time.setAttribute('datetime', item.date || '');
            time.textContent = item.date || '';

            const title = item.titleSub ? `${item.titleMain} - ${item.titleSub}` : item.titleMain;
            const link = infoElement.appendChild(document.createElement('a'));
            const linkText = `${item.storyMain}｜${title}`;
            link.className = 'article-sort-item-title';
            link.href = item.url || '#';
            link.title = linkText;
            link.textContent = linkText;

            const nextItem = stories[index + 1];
            if (!nextItem || nextItem.yearMonth !== item.yearMonth) {
                const year = sortDiv.appendChild(document.createElement('div'));
                year.className = 'article-sort-item year';
                year.textContent = item.yearMonth;
            }
        });

        window.miaoRefreshPjax(storyTimeline);
    } catch (e) {
        storyTimeline.innerHTML = '<div>story error</div>';
        console.error('加载文章失败', e);
    }
}

loadStory();