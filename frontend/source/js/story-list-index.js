async function loadStoryListIndex(story, title) {
    await loadStoryList(story);
    await loadStoryIndex(story, title);
}

loadStoryListIndex('', '');