async function loadStoryPage() {
    const url = window.location.pathname.replace(/\/?$/, '/');
    const {urlStory, urlTitle} = parseStoryUrl(url);
    await loadStoryContent(urlStory, urlTitle);
    await loadStoryList(urlStory);
    await loadStoryIndex(urlStory, urlTitle);
}

loadStoryPage();