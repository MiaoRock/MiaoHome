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
            storyInfo.textContent = `${storyItem.count} 篇 · ${storyItem.latestTitle || ''}`;

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
            });
        });
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

            const titleElement = link.appendChild(document.createElement('div'));
            titleElement.className = 'story-index-title';
            titleElement.textContent = titleItem.titleSub ? `${titleItem.title}-${titleItem.titleSub}` : titleItem.title;

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

loadStoryPage();