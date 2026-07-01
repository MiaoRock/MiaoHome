let activeIndexLink = null;
let activeListLink = null;
async function loadStoryPage() {
    const url = window.location.pathname.replace(/\/?$/, '/');
    const {urlStory, urlTitle} = parseStoryUrl(url);
    await loadStoryContent(url);
    await loadStoryList(urlStory);
    await loadStoryIndex(urlStory);
}

async function loadStoryContent(url) {
    const API_BASE = window.APP_CONFIG.API_BASE;
    const story = document.getElementById('story-story');
    const title = document.getElementById('story-title');
    const author = document.getElementById('story-author');
    const date = document.getElementById('story-date');
    const view = document.getElementById('story-view');
    const {urlStory, urlTitle} = parseStoryUrl(url);
    if (!urlStory || !urlTitle) {
        story.textContent = 'Story';
        title.textContent = '';
        author.textContent = '';
        date.textContent = '';
        view.textContent = 'Welcome to Miao Story Room';
        return;
    }
    const res = await fetch(`${API_BASE}/api/story/content?story=${encodeURIComponent(urlStory)}&title=${encodeURIComponent(urlTitle)}`);
    const storyContent = await res.json();
    story.textContent = storyContent.story;
    title.textContent = storyContent.title;
    author.textContent = storyContent.author;
    date.textContent = storyContent.date;
    view.textContent = storyContent.content;
}

async function loadStoryList(activeStoryName) {
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
            link.className = 'story-side-story';
            if (storyItem.story === activeStoryName) {
                link.classList.add('active');
            }

            const storyName = link.appendChild(document.createElement('div'));
            storyName.className = 'story-side-story-name';
            storyName.textContent = storyItem.storySub ? `${storyItem.story}-${storyItem.storySub}` : storyItem.story;

            const storyMeta = link.appendChild(document.createElement('div'));
            storyMeta.className = 'story-side-story-meta';
            storyMeta.textContent = `${storyItem.count} 篇 · ${storyItem.latestTitle || ''}`;

            link.addEventListener('click', async () => {
                if (activeListLink) {
                    activeListLink.classList.remove('active');
                }
                link.classList.add('active');
                activeListLink = link;
                await loadStoryIndex(storyItem);
            });
        });
    } catch (e) {
        storyListElement.innerHTML = '<div>story error</div>';
        console.error('加载story list失败', e);
        return null;
    }
}

async function loadStoryIndex(storyItem) {
    activeIndexLink = null;
    const API_BASE = window.APP_CONFIG.API_BASE;
    const storyIndexElement = document.getElementById('story-index');

    storyIndexElement.innerHTML = '';
    if (!storyItem) {
        storyIndexElement.textContent = 'Miao Story Index';
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/api/story/index?story=${encodeURIComponent(storyItem.story)}`);
        const index = await res.json();

        const indexStory = storyIndexElement.appendChild(document.createElement('div'));
        indexStory.className = 'index-story';
        indexStory.textContent = storyItem.storySub ? `${storyItem.story}-${storyItem.storySub}` : storyItem.story;

        index.forEach(titleItem => {
            const link = storyIndexElement.appendChild(document.createElement('a'));
            link.className = 'index-link';
            link.href = `/story/${encodeURIComponent(storyItem.story)}/${encodeURIComponent(titleItem.title)}/`;
            const title = link.appendChild(document.createElement('div'));
            title.className = 'index-title';
            title.textContent = titleItem.titleSub ? `${titleItem.title}-${titleItem.titleSub}` : titleItem.title;

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
    await loadStoryContent(url);
    history.replaceState(null, '', url);
}

function parseStoryUrl(url) {
    if (!path.startsWith('/story/') || path === '/story/' || path === '/story/index.html/') {
        return {
            urlStory: '',
            urlTitle: ''
        };
    }
    const parts = decodeURI(url).replace(/^\/story\/|\/$/g, '').split('/');
    return {
        urlStory: parts[0], urlTitle: parts[1]
    };
}

loadStoryPage();