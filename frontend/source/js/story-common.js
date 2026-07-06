window.MiaoStory = window.MiaoStory || {};

window.MiaoStory.activeIndexLink = null;
window.MiaoStory.activeListLink = null;

if (!window.MiaoStory.storyScrollHandler) {
    window.MiaoStory.storyScrollHandler = updateStoryHeight;
    window.addEventListener('scroll', window.MiaoStory.storyScrollHandler);
    window.addEventListener('resize', window.MiaoStory.storyScrollHandler);
}

async function loadStoryContent(urlStory, urlTitle) {
    const API_BASE = window.APP_CONFIG.API_BASE;
    const story = document.getElementById('story-story');
    const title = document.getElementById('story-title');
    const author = document.getElementById('story-author');
    const date = document.getElementById('story-date');
    const view = document.getElementById('story-view');
    if (!urlStory || !urlTitle) {
        story.textContent = 'Miao Story';
        title.textContent = '';
        author.textContent = '';
        date.textContent = '';
        view.textContent = 'Welcome to Miao Story Room';
        return;
    }
    try {
        const res = await fetch(`${API_BASE}/api/story/content?story=${encodeURIComponent(urlStory)}&title=${encodeURIComponent(urlTitle)}`);
        const storyContent = await res.json();
        story.textContent = storyContent.story;
        title.textContent = storyContent.title;
        author.textContent = storyContent.author;
        date.textContent = storyContent.date;
        view.textContent = storyContent.content;
    } catch (e) {
        view.textContent = 'story error';
        console.error('加载story content失败', e);
    }
}

async function loadStoryList(story) {
    window.MiaoStory.activeListLink = null;
    const API_BASE = window.APP_CONFIG.API_BASE;
    const storyListElement = document.getElementById('story-list');

    storyListElement.innerHTML = '';

    if (storyListElement.dataset.page === 'admin') {
        const addDiv = storyListElement.appendChild(document.createElement('div'));
        addDiv.className = 'story-add-open';
        addDiv.textContent = '新增';

        addDiv.addEventListener('click', () => {
            document.getElementById('story-add').classList.add('show');
        });
    }

    try {
        const res = await fetch(`${API_BASE}/api/story/list`);
        const storyList = await res.json();
        if (!storyList.length) {
            storyListElement.textContent = 'no story';
            updateStoryHeight();
            return;
        }

        storyList.forEach(storyItem => {
            const link = storyListElement.appendChild(document.createElement('div'));
            link.className = 'story-list-item';

            const storyElement = link.appendChild(document.createElement('div'));
            storyElement.className = 'story-list-story';
            storyElement.textContent = storyItem.storySub ? `${storyItem.storyMain} - ${storyItem.storySub}` : storyItem.storyMain;

            const storyInfoLine = link.appendChild(document.createElement('div'));
            storyInfoLine.className = 'story-list-line';

            const storyInfo = storyInfoLine.appendChild(document.createElement('span'));
            storyInfo.textContent = `已发布 ${storyItem.count} 篇`;

            const storyAuthor = storyInfoLine.appendChild(document.createElement('span'));
            storyAuthor.textContent = storyItem.author ? `作者：${storyItem.author}` : '';

            const storyLatestLine = link.appendChild(document.createElement('div'));
            storyLatestLine.className = 'story-list-line';

            const storyLatestDate = storyLatestLine.appendChild(document.createElement('span'));
            storyLatestDate.textContent = `最新：${storyItem.latestDate}`;

            const storyLatestTitle = storyLatestLine.appendChild(document.createElement('span'));
            storyLatestTitle.textContent = `${storyItem.latestTitle}`;

            if (storyItem.storyMain === story) {
                link.classList.add('active');
                window.MiaoStory.activeListLink = link;
            }

            link.addEventListener('click', async () => {
                if (window.MiaoStory.activeListLink) {
                    window.MiaoStory.activeListLink.classList.remove('active');
                }
                link.classList.add('active');
                window.MiaoStory.activeListLink = link;
                await loadStoryIndex(storyItem.storyMain, '');
            });
        });
        updateStoryHeight();
    } catch (e) {
        storyListElement.innerHTML = '<div>story error</div>';
        console.error('加载story list失败', e);
        return null;
    }
}

async function loadStoryIndex(story, title) {
    window.MiaoStory.activeIndexLink = null;
    const API_BASE = window.APP_CONFIG.API_BASE;
    const storyIndexElement = document.getElementById('story-index');

    storyIndexElement.innerHTML = '';
    if (!story) {
        storyIndexElement.textContent = 'Miao Story Index';
        updateStoryHeight();
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/api/story/index?story=${encodeURIComponent(story)}`);
        const {index, ...storyInfo} = await res.json();

        const indexStory = storyIndexElement.appendChild(document.createElement('div'));
        indexStory.className = 'story-index-story';
        indexStory.textContent = storyInfo.storySub ? `${storyInfo.storyMain} - ${storyInfo.storySub}` : storyInfo.storyMain;

        index.forEach(titleItem => {
            const titleText = titleItem.titleSub ? `${titleItem.titleMain} - ${titleItem.titleSub}` : titleItem.titleMain;
            const link = storyIndexElement.appendChild(document.createElement('a'));
            link.className = 'story-index-item';
            link.href = `/story/${encodeURIComponent(story)}/${encodeURIComponent(titleItem.titleMain)}/`;

            if (storyIndexElement.dataset.page === 'admin') {
                const btn = link.appendChild(document.createElement('button'));
                btn.type = 'button';
                btn.textContent = '✎';
                btn.className = 'story-edit-btn';
                btn.addEventListener('click', event => {
                    event.preventDefault();
                    event.stopPropagation();
                    editStory(link.getAttribute('href'));
                });
            }

            const titleElement = link.appendChild(document.createElement('div'));
            titleElement.className = 'story-index-title';
            titleElement.textContent = titleText;

            link.title = titleText;

            if (titleItem.titleMain === title) {
                link.classList.add('active');
                window.MiaoStory.activeIndexLink = link;
            }
            if (storyIndexElement.dataset.page !== 'admin') {
                link.addEventListener('click', event => {
                    event.preventDefault();
                    window.scrollTo(0, 0);
                    if (window.MiaoStory.activeIndexLink) {
                        window.MiaoStory.activeIndexLink.classList.remove('active');
                    }
                    link.classList.add('active');
                    window.MiaoStory.activeIndexLink = link;
                    loadStoryByUrl(link.getAttribute('href'));
                });
            }
        });
        updateStoryHeight();

        if (storyIndexElement.dataset.page === 'admin') {
            window.miaoRefreshPjax(storyIndexElement);
        }
    } catch (e) {
        storyIndexElement.innerHTML = '<div>index error</div>';
        console.error('加载story index失败', e);
    }
}

async function loadStoryByUrl(url) {
    const {urlStory, urlTitle} = parseStoryUrl(url);
    await loadStoryContent(urlStory, urlTitle);
    history.replaceState(null, '', url);
    updateStoryHeight();
}

function parseStoryUrl(url) {
    if (!url.startsWith('/story/') || url === '/story/' || url === '/story/index.html/') {
        return {
            urlStory: '', urlTitle: ''
        };
    }
    const parts = decodeURI(url).replace(/^\/story\/|\/$/g, '').split('/');
    return {
        urlStory: parts[0] || '', urlTitle: parts[1] || ''
    };
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

function updateStoryHeight() {
    const storyList = document.getElementById('story-list');
    const storyIndex = document.getElementById('story-index');
    if (!storyList || !storyIndex) {
        return;
    }

    storyList.style.transform = '';
    storyList.style.height = '';
    storyIndex.style.height = '';
    storyList.style.overflowY = 'hidden';
    storyIndex.style.overflowY = 'hidden';

    storyList.classList.remove('compact');

    const top = 60 + window.innerWidth * 0.012;
    const gap = 0;

    const maxListHeight = window.innerHeight * 0.6;

    const listStyle = window.getComputedStyle(storyList);
    const listPaddingTop = parseFloat(listStyle.paddingTop) || 0;
    const listPaddingBottom = parseFloat(listStyle.paddingBottom) || 0;
    const listVerticalPadding = listPaddingTop + listPaddingBottom;

    const activeListHeight = window.MiaoStory.activeListLink ? window.MiaoStory.activeListLink.getBoundingClientRect().height : 0;
    const compactListHeight = activeListHeight + listVerticalPadding;

    const minListHeight = Math.min(maxListHeight, Math.max(window.innerHeight * 0.2, compactListHeight));

    const shrinkDistance = window.innerHeight * 0.4;
    const shrinkRate = Math.min(window.scrollY, shrinkDistance) / shrinkDistance;
    const listLimitHeight = maxListHeight - (maxListHeight - minListHeight) * shrinkRate;
    const listContentHeight = storyList.scrollHeight;

    storyList.style.top = `${top}px`;
    if (listContentHeight > listLimitHeight + 2) {
        storyList.style.height = `${listLimitHeight}px`;
        storyList.style.overflowY = 'auto';
    }

    const listRealHeight = storyList.getBoundingClientRect().height;
    const indexTop = top + listRealHeight + gap;
    const indexLimitHeight = Math.max(0, window.innerHeight - indexTop);
    const indexContentHeight = storyIndex.scrollHeight;

    storyIndex.style.top = `${indexTop}px`;
    if (indexContentHeight > indexLimitHeight + 2) {
        storyIndex.style.height = `${indexLimitHeight}px`;
        storyIndex.style.overflowY = 'auto';
    }

    const indexRealTop = storyIndex.getBoundingClientRect().top;
    const pushUp = indexTop - indexRealTop;

    if (pushUp > 0) {
        storyList.style.transform = `translateY(-${pushUp}px)`;
    }

    if (listContentHeight > minListHeight && listLimitHeight <= minListHeight + 1 && window.MiaoStory.activeListLink) {
        storyList.classList.add('compact');
        storyList.style.overflowY = 'hidden';
    }
}