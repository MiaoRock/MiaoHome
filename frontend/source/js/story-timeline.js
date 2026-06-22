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
        if (storyTimeline.dataset.page === 'admin') {
            titleDiv.classList.add('story-add-open');
            titleDiv.addEventListener('click', () => {
                document.getElementById('story-add').classList.add('show');
            });
        }

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
                time.setAttribute('datetime', item.dateText || '');
                time.textContent = item.dateText || '';

                const link = infoDiv.appendChild(document.createElement('a'));
                const linkText = item.story + ' - ' + item.title;
                link.className = 'article-sort-item-title';
                link.href = item.url || '#';
                link.title = linkText;
                link.textContent = linkText;

                if (storyTimeline.dataset.page === 'story') {
                    link.addEventListener('click', function (event) {
                        event.preventDefault();
                        if (typeof window.loadStoryByUrl === 'function') {
                            window.loadStoryByUrl(link.getAttribute('href'));
                        }
                    });
                }
            });

            const yearDiv = sortDiv.appendChild(document.createElement('div'));
            yearDiv.className = 'article-sort-item year';
            yearDiv.textContent = month;
        });

        if (window.pjax) {
            window.pjax.refresh(storyTimeline);
        } else {
            window.addEventListener('load', function () {
                if (window.pjax) {
                    window.pjax.refresh(storyTimeline);
                }
            }, {once: true});
        }
    } catch (e) {
        storyTimeline.innerHTML = '<div>story error</div>';
        console.error('加载文章失败', e);
    }
}

loadStory();