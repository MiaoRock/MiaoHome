async function loadStoryPage() {
    const API_BASE = window.APP_CONFIG.API_BASE;
    const title = document.getElementById('story-title');
    const view = document.getElementById('story-view');

    title.textContent = '';
    view.textContent = '';

    try {
        const res = await fetch(`${API_BASE}/api/story`);
        const monthMap = await res.json();
        const stories = [];

        Object.keys(monthMap).forEach(function (month) {
            monthMap[month].forEach(function (item) {
                stories.push(item);
            });
        });

        if (!stories.length) {
            view.textContent = 'no story';
            return;
        }

        const currentUrl = getCurrentStoryUrl();
        let targetStory = stories[0];

        stories.forEach(function (story) {
            if (story.url === currentUrl) {
                targetStory = story;
            }
        });

        await loadStoryContent(targetStory);
    } catch (e) {
        view.textContent = 'story error';
        console.error('加载文章失败', e);
    }
}

async function loadStoryContent(story) {
    const API_BASE = window.APP_CONFIG.API_BASE;
    const title = document.getElementById('story-title');
    const view = document.getElementById('story-view');

    title.textContent = story.title || '';
    view.textContent = '';

    const mdUrl = getMarkdownUrl(story.url);
    const res = await fetch(`${API_BASE}${mdUrl}`);

    if (!res.ok) {
        view.textContent = 'story load error';
        console.error('文章请求失败', `${API_BASE}${mdUrl}`, res.status);
        return;
    }

    const mdText = await res.text();
    view.textContent = removeFrontMatter(mdText);
}

function getCurrentStoryUrl() {
    const path = window.location.pathname;

    if (!path.startsWith('/story/')) {
        return '';
    }

    if (path === '/story/' || path === '/story/index.html') {
        return '';
    }

    if (path.endsWith('/')) {
        return path;
    }

    return path + '/';
}

function getMarkdownUrl(url) {
    let result = url || '';

    if (result.endsWith('/')) {
        result = result.substring(0, result.length - 1);
    }

    return result + '.md';
}

function removeFrontMatter(mdText) {
    return mdText.replace(/^---\r?\n[\s\S]*?\r?\n---/, '').trim();
}

window.loadStoryByUrl = async function (url) {
    const API_BASE = window.APP_CONFIG.API_BASE;
    const res = await fetch(`${API_BASE}/api/story`);
    const monthMap = await res.json();
    const stories = [];

    Object.keys(monthMap).forEach(function (month) {
        monthMap[month].forEach(function (item) {
            stories.push(item);
        });
    });

    let targetStory = null;

    stories.forEach(function (story) {
        if (story.url === url) {
            targetStory = story;
        }
    });

    if (targetStory) {
        await loadStoryContent(targetStory);
        history.replaceState(null, '', targetStory.url);
    }
};

loadStoryPage();