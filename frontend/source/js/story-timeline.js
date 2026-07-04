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

                if (storyTimeline.dataset.page === 'admin') {
                    const btn = infoDiv.appendChild(document.createElement('button'));
                    btn.type = 'button';
                    btn.textContent = '✎';
                    btn.className = 'story-edit-btn';
                    btn.dataset.url = link.getAttribute('href');
                    btn.addEventListener('click', () => {
                        editStory(btn.dataset.url);
                    });
                }
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

async function editStory(url) {
    const API_BASE = window.APP_CONFIG.API_BASE;
    const mdUrl = url.replace(/\/$/, '') + '.md';
    const res = await fetch(`${API_BASE}${mdUrl}`);
    if (!res.ok) {
        alert('读取失败');
        return;
    }
    const mdText = await res.text();
    const fmMatch = mdText.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n)?/);
    const fm = {};
    if (fmMatch) {
        fmMatch[1].split(/\r?\n/).forEach(line => {
            const m = line.match(/^([a-zA-Z0-9_-]+)\s*:\s*(.*)$/);
            if (m) {
                fm[m[1].trim()] = m[2].trim().replace(/^['"]|['"]$/g, '');
            }
        });
    }
    const content = mdText.replace(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n)?/, '');

    const storyInput = document.getElementById('story-add-story');
    const storySubInput = document.getElementById('story-add-story-sub');
    const titleInput = document.getElementById('story-add-title');
    const titleSubInput = document.getElementById('story-add-title-sub');
    const authorInput = document.getElementById('story-add-author');
    const dateInput = document.getElementById('story-add-date');
    const timeInput = document.getElementById('story-add-time');
    const contentInput = document.getElementById('story-add-content');
    const storyParts = (fm.story || '').split(/\s+-\s+/).map(item => item.trim());
    const titleParts = (fm.title || '').split(/\s+-\s+/).map(item => item.trim());
    const dateParts = (fm.date || '').trim().replace('T', ' ').split(/\s+/);
    storyInput.value = storyParts[0] || '';
    storySubInput.value = storyParts[1] || '';
    titleInput.value = titleParts[0] || '';
    titleSubInput.value = titleParts[1] || '';
    authorInput.value = fm.author || '';
    dateInput.value = dateParts[0] || '';
    timeInput.value = dateParts[1] || '';
    contentInput.value = content;
    document.getElementById('story-add').classList.add('show');
}

loadStory();