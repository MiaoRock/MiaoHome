async function loadStoryList() {
    const API_BASE = window.APP_CONFIG.API_BASE;
    const storyListElement = document.getElementById('story-list');
    const storyEpisodeElement = document.getElementById('story-episode');

    storyListElement.innerHTML = '';
    storyEpisodeElement.innerHTML = '';

    try {
        const res = await fetch(`${API_BASE}/api/story/list`);
        const storyList = await res.json();
        if (!storyList.length) {
            storyListElement.textContent = 'no story';
            storyEpisodeElement.textContent = 'no episode';
            return;
        }

        const storyBody = storyListElement.appendChild(document.createElement('div'));
        storyBody.className = 'story-side-list';

        const renderEpisode = async storyItem => {
            storyEpisodeElement.innerHTML = '';

            const res = await fetch(`${API_BASE}/api/story/episode?story=${encodeURIComponent(storyItem.story)}`);
            const episodes = await res.json();

            const episodeTitle = storyEpisodeElement.appendChild(document.createElement('div'));
            episodeTitle.className = 'story-side-title';
            episodeTitle.textContent = storyItem.storySub ? `${storyItem.story}-${storyItem.storySub}` : storyItem.story;

            const episodeBody = storyEpisodeElement.appendChild(document.createElement('div'));
            episodeBody.className = 'story-side-list';

            episodes.forEach(item => {
                const link = episodeBody.appendChild(document.createElement('a'));
                link.className = 'story-side-episode';
                link.href = `/story/${encodeURIComponent(storyItem.story)}/${encodeURIComponent(item.title)}/`;

                const title = link.appendChild(document.createElement('div'));
                title.className = 'story-side-episode-title';
                title.textContent = item.titleSub ? `${item.title}-${item.titleSub}` : item.title;

                link.addEventListener('click', event => {
                    event.preventDefault();

                    episodeBody.querySelectorAll('.story-side-episode').forEach(item => {
                        item.classList.remove('active');
                    });

                    link.classList.add('active');

                    if (typeof window.loadStoryByUrl === 'function') {
                        window.loadStoryByUrl(link.getAttribute('href'));
                    }
                });
            });
        };

        storyList.forEach((item, index) => {
            const storyItem = storyBody.appendChild(document.createElement('div'));
            storyItem.className = 'story-side-story';

            if (index === 0) {
                storyItem.classList.add('active');
            }

            const storyName = storyItem.appendChild(document.createElement('div'));
            storyName.className = 'story-side-story-name';
            storyName.textContent = item.storySub ? `${item.story}-${item.storySub}` : item.story;

            const storyMeta = storyItem.appendChild(document.createElement('div'));
            storyMeta.className = 'story-side-story-meta';
            storyMeta.textContent = `${item.count} 篇 · ${item.latestTitle || ''}`;

            storyItem.addEventListener('click', async () => {
                storyBody.querySelectorAll('.story-side-story').forEach(item => {
                    item.classList.remove('active');
                });

                storyItem.classList.add('active');
                await renderEpisode(item);
            });
        });

        await renderEpisode(storyList[0]);
    } catch (e) {
        storyListElement.innerHTML = '<div>story error</div>';
        storyEpisodeElement.innerHTML = '<div>episode error</div>';
        console.error('加载story list失败', e);
    }
}

loadStoryList();