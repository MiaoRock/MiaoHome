const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    next();
});

app.use('/gallery', express.static(path.join(__dirname, 'gallery')));
app.use('/story', express.static(path.join(__dirname, 'story')));

app.get('/api/gallery', (req, res) => {
    const galleryDir = path.join(__dirname, 'gallery');

    fs.readdir(galleryDir, (err, files) => {
        if (err) return res.status(500).json({error: 'no gallery'});

        const imageFiles = files.filter(f => /\.(png|jpg|jpeg|webp|gif)$/i.test(f));

        if (!imageFiles.length) return res.json([]);

        res.json(imageFiles);
    });
});

app.get('/api/story', (req, res) => {
    const storyDir = path.join(__dirname, 'story');
    const root = '/';

    const parseFrontMatter = content => {
        const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
        const result = {};
        if (!match) return result;
        match[1].split(/\r?\n/).forEach(line => {
            const m = line.match(/^([a-zA-Z0-9_-]+)\s*:\s*(.*)$/);
            if (m) result[m[1].trim()] = m[2].trim().replace(/^['"]|['"]$/g, '');
        });
        return result;
    };

    fs.readdir(storyDir, (err, files) => {
        if (err) return res.status(500).json({error: 'no story'});

        const markdownFiles = files.filter(f => f.endsWith('.md'));

        const timeline = markdownFiles.map(file => {
            const filePath = path.join(storyDir, file);
            const content = fs.readFileSync(filePath, 'utf8');
            const fm = parseFrontMatter(content);
            const story = fm.story || '';
            const title = fm.title || file.replace(/\.md$/, '');
            const dateText = fm.date || '';
            const time = new Date(dateText).getTime();
            return {
                story,
                title,
                dateText,
                time: isNaN(time) ? 0 : time,
                yearMonth: dateText ? String(dateText).slice(0, 7) : '',
                url: root + 'story/' + encodeURIComponent(file.replace(/\.md$/, '')) + '/'
            };
        });

        const sortedList = timeline.filter(i => i.dateText).sort((a, b) => b.time - a.time);

        const monthMap = sortedList.reduce((map, item) => {
            if (!map[item.yearMonth]) map[item.yearMonth] = [];
            map[item.yearMonth].push(item);
            return map;
        }, {});

        res.json(monthMap);
    });
});

app.listen(PORT, () => {
    console.log(`后端 API 已启动: http://localhost:${PORT}`);
});