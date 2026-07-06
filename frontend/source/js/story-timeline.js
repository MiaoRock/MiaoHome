async function loadStory() {
    const API_BASE = window.APP_CONFIG.API_BASE;
    const storyTimeline = document.getElementById('story-timeline');
    storyTimeline.innerHTML = '';

    try {
        const res = await fetch(`${API_BASE}/api/story`);
        const stories = await res.json();
        const monthMap = stories.reduce((map, item) => {
            const yearMonth = item.yearMonth;
            if (!map[yearMonth]) {
                map[yearMonth] = [];
            }
            map[yearMonth].push(item);
            return map;
        }, {});

        const months = Object.keys(monthMap).sort((a, b) => b.localeCompare(a));

        const titleDiv = storyTimeline.appendChild(document.createElement('div'));
        titleDiv.className = 'article-sort-title';
        titleDiv.textContent = '今日';

        const sortDiv = storyTimeline.appendChild(document.createElement('div'));
        sortDiv.className = 'article-sort';

        if (!stories.length) {
            storyTimeline.appendChild(document.createElement('div')).textContent = 'no story';
            return;
        }

        months.forEach(month => {
            monthMap[month].forEach(item => {
                const sortItem = sortDiv.appendChild(document.createElement('div'));
                sortItem.className = 'article-sort-item no-article-cover';

                const infoDiv = sortItem.appendChild(document.createElement('div'));
                infoDiv.className = 'article-sort-item-info';

                const timeDiv = infoDiv.appendChild(document.createElement('div'));
                timeDiv.className = 'article-sort-item-time';

                const icon = timeDiv.appendChild(document.createElement('i'));
                icon.className = 'far fa-calendar-alt';

                const time = timeDiv.appendChild(document.createElement('time'));
                time.className = 'post-meta-date-created';
                time.setAttribute('datetime', item.date || '');
                time.textContent = item.date || '';

                const link = infoDiv.appendChild(document.createElement('a'));
                let linkText = item.story.replace(/-.*/, '').trim();
                if (item.author) {
                    linkText += ` by ${item.author}`;
                }
                linkText += `｜${item.title}`;
                link.className = 'article-sort-item-title';
                link.href = item.url || '#';
                link.title = linkText;
                link.textContent = linkText;
            });

            const yearDiv = sortDiv.appendChild(document.createElement('div'));
            yearDiv.className = 'article-sort-item year';
            yearDiv.textContent = month;
        });

        window.miaoRefreshPjax(storyTimeline);
    } catch (e) {
        storyTimeline.innerHTML = '<div>story error</div>';
        console.error('加载文章失败', e);
    }
}

loadStory();