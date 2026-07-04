async function loadStoryListIndex() {
    await loadStoryList('');
    await loadStoryIndex('', '');
}

loadStoryListIndex();