const fs = require('fs');
const path = require('path');
hexo.extend.tag.register('home_gallery', function () {
    const dir = path.join(hexo.source_dir, 'gallery');
    let files = [];

    try {
        files = fs.readdirSync(dir);
    } catch (e) {
        return '<div>no images</div>';
    }

    const images = files
        .filter(f => /\.(png|jpg|jpeg|webp|gif)$/i.test(f))
        .map((file, index) => {
            return `<img class="${index === 0 ? 'gallery-main' : 'gallery-sub'}"
                        src="/gallery/${file}" alt="">`;
        })
        .join('');

    return `<div class="gallery-grid">${images}</div>`;
});


hexo.extend.tag.register('home_story', function (args) {
    const storyDir = path.join(hexo.source_dir, 'story')
    const root = hexo.config.root || '/'

    const escapeHtml = str => String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')

    const parseFrontMatter = content => {
        const text = content.replace(/^\s*\uFEFF?\s*/, '')
        const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/)
        const result = {}
        if (!match) return result
        match[1].split(/\r?\n/).forEach(line => {
            const m = line.match(/^([a-zA-Z0-9_-]+)\s*:\s*(.*)$/)
            if (m) result[m[1].trim()] = m[2].trim().replace(/^['"]|['"]$/g, '')
        })
        return result
    }

    let list = []
    try {
        const files = fs.readdirSync(storyDir).filter(f => f.endsWith('.md'))
        list = files.map(file => {
            const filePath = path.join(storyDir, file)
            const content = fs.readFileSync(filePath, 'utf8')
            const fm = parseFrontMatter(content)
            const title = fm.title || file.replace(/\.md$/, '')
            const dateText = fm.date || ''
            const time = new Date(dateText).getTime()
            return {
                title, dateText, time: isNaN(time) ? 0 : time, yearMonth: dateText ? String(dateText).slice(0, 7) : '', // 取 YYYY-MM
                url: root + 'story/' + encodeURIComponent(file.replace(/\.md$/, '')) + '/'
            }
        })
    } catch (e) {
        return '<div>no story</div>'
    }

    list = list.filter(i => i.dateText).sort((a, b) => b.time - a.time)

    const monthMap = {}
    list.forEach(item => {
        if (!monthMap[item.yearMonth]) monthMap[item.yearMonth] = []
        monthMap[item.yearMonth].push(item)
    })
    const months = Object.keys(monthMap).sort((a, b) => b.localeCompare(a))

    let html = '<div class="article-sort-title">今日</div>'
    html += '<div class="article-sort">'
    months.forEach(month => {
        monthMap[month].forEach(item => {
            html += '<div class="article-sort-item no-article-cover">'
            html += '<div class="article-sort-item-info">'
            html += '<div class="article-sort-item-time">'
            html += '<i class="far fa-calendar-alt"></i>'
            html += '<time class="post-meta-date-created" datetime="' + escapeHtml(item.dateText) + '">' + escapeHtml(item.dateText) + '</time>'
            html += '</div>'
            html += '<a class="article-sort-item-title" href="' + item.url + '" title="' + escapeHtml(item.title) + '">' + escapeHtml(item.title) + '</a>'
            html += '</div>'
            html += '</div>'
        })
        html += '<div class="article-sort-item year">' + escapeHtml(month) + '</div>'
    })
    html += '</div>'
    return html
})