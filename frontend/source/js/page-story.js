window.MiaoStory = window.MiaoStory || {};

window.MiaoStory.activeIndexLink = null;
window.MiaoStory.activeListLink = null;

if (!window.MiaoStory.storyScrollHandler) {
    window.MiaoStory.storyScrollHandler = updateStoryHeight;
    window.addEventListener('scroll', window.MiaoStory.storyScrollHandler);
    window.addEventListener('resize', window.MiaoStory.storyScrollHandler);
}

async function loadStoryPage() {
    const url = window.location.pathname.replace(/\/?$/, '/');
    const {urlStory, urlTitle} = parseStoryUrl(url);
    await loadStoryContent(urlStory, urlTitle);
    await loadStoryList(urlStory);
    await loadStoryIndex(urlStory, urlTitle);
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
            storyElement.textContent = storyItem.storySub ? `${storyItem.story} - ${storyItem.storySub}` : storyItem.story;

            const storyAuthor = link.appendChild(document.createElement('div'));
            storyAuthor.className = 'story-list-line';
            storyAuthor.textContent = storyItem.author ? `作者：${storyItem.author}` : '作者：无';

            const storyInfo = link.appendChild(document.createElement('div'));
            storyInfo.className = 'story-list-line';
            storyInfo.textContent = `已发布 ${storyItem.count} 篇`;

            const storyLatest = link.appendChild(document.createElement('div'));
            storyLatest.className = 'story-list-line';
            storyLatest.textContent = '最近更新：';

            const storyLatestTitle = link.appendChild(document.createElement('div'));
            storyLatestTitle.className = 'story-list-line';
            storyLatestTitle.textContent = storyItem.latestTitle;

            const storyLatestDate = link.appendChild(document.createElement('div'));
            storyLatestDate.className = 'story-list-line';
            storyLatestDate.textContent = storyItem.latestDate;

            if (storyItem.story === story) {
                link.classList.add('active');
                window.MiaoStory.activeListLink = link;
            }

            link.addEventListener('click', async () => {
                if (window.MiaoStory.activeListLink) {
                    window.MiaoStory.activeListLink.classList.remove('active');
                }
                link.classList.add('active');
                window.MiaoStory.activeListLink = link;
                await loadStoryIndex(storyItem.story, '');
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
        indexStory.textContent = storyInfo.storySub ? `${storyInfo.story} - ${storyInfo.storySub}` : storyInfo.story;

        index.forEach(titleItem => {
            const link = storyIndexElement.appendChild(document.createElement('a'));
            link.className = 'story-index-item';
            link.href = `/story/${encodeURIComponent(story)}/${encodeURIComponent(titleItem.title)}/`;

            const titleElement = link.appendChild(document.createElement('div'));
            titleElement.className = 'story-index-title';

            const titleText = titleItem.titleSub ? `${titleItem.title} - ${titleItem.titleSub}` : titleItem.title;
            titleElement.textContent = titleText;
            link.title = titleText;

            if (titleItem.title === title) {
                link.classList.add('active');
                window.MiaoStory.activeIndexLink = link;
            }

            link.addEventListener('click', event => {
                event.preventDefault();
                if (window.MiaoStory.activeIndexLink) {
                    window.MiaoStory.activeIndexLink.classList.remove('active');
                }
                link.classList.add('active');
                window.MiaoStory.activeIndexLink = link;
                loadStoryByUrl(link.getAttribute('href'));
            });
        });
        updateStoryHeight();
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

    const minListHeight = Math.min(
        maxListHeight,
        Math.max(window.innerHeight * 0.2, compactListHeight)
    );

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

loadStoryPage();