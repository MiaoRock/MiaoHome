async function loadStoryPage() {
    const story = document.getElementById('story-story');
    const title = document.getElementById('story-title');
    const author = document.getElementById('story-author');
    const date = document.getElementById('story-date');
    const view = document.getElementById('story-view');

    story.textContent = '';
    title.textContent = '';
    author.textContent = '';
    date.textContent = '';
    view.textContent = '';

    try {
        const stories = await getStories();
        if (!stories.length) {
            view.textContent = 'no story';
            return;
        }
        const path = window.location.pathname.replace(/\/?$/, '/');
        const currentUrl = !path.startsWith('/story/') || path === '/story/' || path === '/story/index.html/' ? '' : path;
        const targetStory = stories.find(story => story.url === currentUrl) || stories[0];
        await loadStoryContent(targetStory);
    } catch (e) {
        view.textContent = 'story error';
        console.error('加载文章失败', e);
    }
}

async function loadStoryContent(story) {
    const API_BASE = window.APP_CONFIG.API_BASE;
    const storyElement = document.getElementById('story-story');
    const title = document.getElementById('story-title');
    const author = document.getElementById('story-author');
    const date = document.getElementById('story-date');
    const view = document.getElementById('story-view');

    storyElement.textContent = story.story;
    title.textContent = story.title;
    author.textContent = story.author;
    date.textContent = story.date;
    view.textContent = '';

    const mdUrl = story.url.replace(/\/$/, '') + '.md';
    const res = await fetch(`${API_BASE}${mdUrl}`);
    if (!res.ok) {
        view.textContent = 'story load error';
        console.error('文章请求失败', `${API_BASE}${mdUrl}`, res.status);
        return;
    }

    const mdText = await res.text();
    view.textContent = mdText.replace(/^---\r?\n[\s\S]*?\r?\n---/, '').trim();
}

async function getStories() {
    const API_BASE = window.APP_CONFIG.API_BASE;
    const res = await fetch(`${API_BASE}/api/story`);
    return await res.json();
}

window.loadStoryByUrl = async function (url) {
    const stories = await getStories();
    const targetStory = stories.find(story => story.url === url);
    if (targetStory) {
        await loadStoryContent(targetStory);
        history.replaceState(null, '', targetStory.url);
    }
};

loadStoryPage();