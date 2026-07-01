var activeIndexLink = null;
var activeListLink = null;

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
        story.textContent = 'Story';
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
    activeListLink = null;
    const API_BASE = window.APP_CONFIG.API_BASE;
    const storyListElement = document.getElementById('story-list');

    storyListElement.innerHTML = '';

    try {
        const res = await fetch(`${API_BASE}/api/story/list`);
        const storyList = await res.json();
        if (!storyList.length) {
            storyListElement.textContent = 'no story';
            return;
        }

        storyList.forEach(storyItem => {
            const link = storyListElement.appendChild(document.createElement('div'));
            link.className = 'story-list-item';

            const storyElement = link.appendChild(document.createElement('div'));
            storyElement.className = 'story-list-story';
            storyElement.textContent = storyItem.storySub ? `${storyItem.story}-${storyItem.storySub}` : storyItem.story;

            const storyInfo = link.appendChild(document.createElement('div'));
            storyInfo.className = 'story-list-story-info';
            storyInfo.textContent = `${storyItem.count} 篇 · ${storyItem.latestDate || ''}`;

            const storyLatest = link.appendChild(document.createElement('div'));
            storyLatest.className = 'story-list-latest';

            let latestText = storyItem.latestTitle || '';
            if (storyItem.author) {
                latestText += ` by ${storyItem.author}`;
            }
            storyLatest.textContent = latestText ? `最新｜${latestText}` : '';

            if (storyItem.story === story) {
                link.classList.add('active');
                activeListLink = link;
            }

            link.addEventListener('click', async () => {
                if (activeListLink) {
                    activeListLink.classList.remove('active');
                }
                link.classList.add('active');
                activeListLink = link;
                await loadStoryIndex(storyItem.story, '');
                updateStorySideHeight();
            });
        });
        updateStorySideHeight();
    } catch (e) {
        storyListElement.innerHTML = '<div>story error</div>';
        console.error('加载story list失败', e);
        return null;
    }
}

async function loadStoryIndex(story, title) {
    activeIndexLink = null;
    const API_BASE = window.APP_CONFIG.API_BASE;
    const storyIndexElement = document.getElementById('story-index');

    storyIndexElement.innerHTML = '';
    if (!story) {
        storyIndexElement.textContent = 'Miao Story Index';
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/api/story/index?story=${encodeURIComponent(story)}`);
        const {index, ...storyInfo} = await res.json();

        const indexStory = storyIndexElement.appendChild(document.createElement('div'));
        indexStory.className = 'story-index-story';
        indexStory.textContent = storyInfo.storySub ? `${storyInfo.story}-${storyInfo.storySub}` : storyInfo.story;

        index.forEach(titleItem => {
            const link = storyIndexElement.appendChild(document.createElement('a'));
            link.className = 'story-index-item';
            link.href = `/story/${encodeURIComponent(story)}/${encodeURIComponent(titleItem.title)}/`;

            const timeElement = link.appendChild(document.createElement('div'));
            timeElement.className = 'story-index-time';

            const icon = timeElement.appendChild(document.createElement('i'));
            icon.className = 'far fa-calendar-alt';

            const time = timeElement.appendChild(document.createElement('time'));
            time.className = 'story-index-date';
            time.setAttribute('datetime', titleItem.date || '');
            time.textContent = titleItem.date || '';

            const titleElement = link.appendChild(document.createElement('div'));
            titleElement.className = 'story-index-title';

            let titleText = titleItem.titleSub ? `${titleItem.title}-${titleItem.titleSub}` : titleItem.title;
            if (titleItem.author) {
                titleText += ` by ${titleItem.author}`;
            }

            titleElement.textContent = titleText;
            link.title = titleText;

            if (titleItem.title === title) {
                link.classList.add('active');
                activeIndexLink = link;
            }

            link.addEventListener('click', event => {
                event.preventDefault();
                if (activeIndexLink) {
                    activeIndexLink.classList.remove('active');
                }
                link.classList.add('active');
                activeIndexLink = link;
                loadStoryByUrl(link.getAttribute('href'));
            });
        });
    } catch (e) {
        storyIndexElement.innerHTML = '<div>index error</div>';
        console.error('加载story index失败', e);
    }
}

async function loadStoryByUrl(url) {
    const {urlStory, urlTitle} = parseStoryUrl(url);
    await loadStoryContent(urlStory, urlTitle);
    history.replaceState(null, '', url);
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

function updateStorySideHeight() {
    const storyList = document.getElementById('story-list');
    const storyIndex = document.getElementById('story-index');

    if (!storyList || !storyIndex) {
        return;
    }

    storyList.style.transform = '';

    const top = 60 + window.innerWidth * 0.012;
    const gap = 16;

    const maxListHeight = window.innerHeight * 0.6;
    const minListHeight = window.innerHeight * 0.2;

    const shrinkDistance = window.innerHeight * 0.4;
    const shrinkRate = Math.min(window.scrollY, shrinkDistance) / shrinkDistance;

    const listHeight = maxListHeight - (maxListHeight - minListHeight) * shrinkRate;

    storyList.style.top = `${top}px`;
    storyList.style.height = `${listHeight}px`;

    const indexTop = top + storyList.getBoundingClientRect().height + gap;
    const indexHeight = window.innerHeight - indexTop;

    storyIndex.style.top = `${indexTop}px`;
    storyIndex.style.height = `${indexHeight}px`;

    const indexRealTop = storyIndex.getBoundingClientRect().top;
    const pushUp = indexTop - indexRealTop;

    if (pushUp > 0) {
        storyList.style.transform = `translateY(-${pushUp}px)`;
    }

    if (listHeight <= minListHeight + 1 && activeListLink) {
        storyList.classList.add('compact');
    } else {
        storyList.classList.remove('compact');
    }
}

window.addEventListener('scroll', updateStorySideHeight);
window.addEventListener('resize', updateStorySideHeight);

loadStoryPage();