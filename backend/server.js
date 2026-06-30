const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const sharp = require('sharp');

const app = express();
const PORT = process.env.PORT || 3000;
const FRONT_MATTER_REG = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n)?/
const FRONT_MATTER_LINE_REG = /^([a-zA-Z0-9_-]+)\s*:\s*(.*)$/;

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }
    next();
});
app.use(express.json({
    limit: '20mb'
}));

const galleryDir = path.join(__dirname, 'gallery');
const thumbDir = path.join(__dirname, 'thumbs');
const storyDir = path.join(__dirname, 'story');

app.use('/gallery', express.static(galleryDir));
app.use('/thumbs', express.static(thumbDir));
app.use('/story', express.static(storyDir));

app.get('/api/gallery', async (req, res) => {
    try {
        const files = await fs.promises.readdir(galleryDir);
        const fileList = await Promise.all(files
            .filter(file => !file.startsWith('.'))
            .map(async file => {
                const stat = await fs.promises.stat(path.join(galleryDir, file));
                return {
                    name: file, time: stat.mtimeMs
                };
            }));
        fileList.sort((a, b) => b.time - a.time);
        res.json(fileList.map(file => file.name));
    } catch (err) {
        res.status(500).json({error: 'no gallery'});
    }
});

const createThumb = async fileName => {
    const sourcePath = path.join(galleryDir, fileName);
    const thumbName = path.parse(fileName).name + '.webp';
    const thumbPath = path.join(thumbDir, thumbName);
    const inputBuffer = await fs.promises.readFile(sourcePath);
    await sharp(inputBuffer)
        .resize({width: 600, withoutEnlargement: true})
        .webp({quality: 80})
        .toFile(thumbPath);
};

const galleryStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, galleryDir);
    }, filename: (req, file, cb) => {
        cb(null, Buffer.from(file.originalname, 'latin1').toString('utf8'));
    }
});

const galleryAdd = multer({
    storage: galleryStorage, limits: {
        fileSize: 50 * 1024 * 1024
    }
});

app.post('/api/admin/gallery/add', galleryAdd.array('files', 20), async (req, res) => {
    await Promise.all(req.files.map(file => createThumb(file.filename)));
    res.json({message: 'success'});
});

app.post('/api/admin/gallery/touch', async (req, res) => {
    try {
        const {file} = req.body;
        const filePath = path.join(galleryDir, path.basename(String(file || '')));
        const stat = await fs.promises.stat(filePath);
        if (!stat.isFile()) {
            return res.status(404).json({error: 'file not found'});
        }
        const now = new Date();
        await fs.promises.utimes(filePath, now, now);
        res.json({message: 'success'});
    } catch (err) {
        console.error('touch gallery failed', err);
        res.status(500).json({error: 'failed'});
    }
});

app.get('/api/story', async (req, res) => {
    try {
        const dirs = await fs.promises.readdir(storyDir, {withFileTypes: true});
        const timeline = [];

        for (const dir of dirs) {
            if (!dir.isDirectory() || dir.name === 'info') {
                continue;
            }

            const storyPath = path.join(storyDir, dir.name);
            const files = await fs.promises.readdir(storyPath);
            const markdownFiles = files.filter(file => file.endsWith('.md'));

            markdownFiles.forEach(file => {
                const filePath = path.join(storyPath, file);
                const content = fs.readFileSync(filePath, 'utf8');
                const fm = parseFrontMatter(content);

                const story = fm.story || '';
                const title = fm.title || '';
                const rawDateText = fm.date || '';
                const author = fm.author || '';

                const date = rawDateText.trim()
                    .replace(/^(\d{4})-(\d{1,2})-(\d{1,2})(.*)$/, (m, y, month, day, rest) => {
                        return y + '-' + month.padStart(2, '0') + '-' + day.padStart(2, '0') + rest;
                    });

                const parseDateText = date.replace(/\s+/, 'T');
                const time = new Date(parseDateText).getTime() || 0;
                const yearMonth = String(parseDateText).slice(0, 7);
                const url = '/story/' + encodeURIComponent(dir.name) + '/' + encodeURIComponent(file.replace(/\.md$/, '')) + '/';

                timeline.push({
                    story, title, author, date, time, yearMonth, url
                });
            });
        }

        const sortedList = timeline.sort((a, b) => b.time - a.time);
        res.json(sortedList);
    } catch (err) {
        console.error('查询Story失败', err);
        res.status(500).json({error: 'no story'});
    }
});

app.get('/api/story/list', async (req, res) => {
    try {
        const storyInfoDir = path.join(storyDir, 'info');
        const files = await fs.promises.readdir(storyInfoDir);
        const storyList = await Promise.all(files.filter(file => file.endsWith('.md')).map(async file => {
            const content = await fs.promises.readFile(path.join(storyInfoDir, file), 'utf8');
            const fm = parseFrontMatter(content);
            return {
                story: fm.story || '',
                storySub: fm.storySub || '',
                count: Number(fm.count || 0),
                latestTitle: fm.latestTitle || '',
                latestDate: fm.latestDate || '',
                author: fm.author || ''
            };
        }));
        res.json(storyList);
    } catch (err) {
        console.error('查询Story列表失败', err);
        res.status(500).json({error: 'failed'});
    }
});

app.get('/api/story/episode', async (req, res) => {
    try {
        const {story} = req.query;
        const storyInfoPath = path.join(storyDir, 'info', `${story}.md`);
        const content = await fs.promises.readFile(storyInfoPath, 'utf8');
        const episodeContent = content.replace(FRONT_MATTER_REG, '').trim();
        const storyEpisode = episodeContent ? JSON.parse(episodeContent) : [];
        res.json(storyEpisode);
    } catch (err) {
        console.error('查询Story章节失败', err);
        res.status(500).json({error: 'failed'});
    }
});

app.post('/api/admin/story/add', async (req, res) => {
    try {
        const {storyMain, storySub, titleMain, titleSub, author, dateTime, content} = req.body;
        const story = storySub ? `${storyMain}-${storySub}` : storyMain;
        const title = titleSub ? `${titleMain}-${titleSub}` : titleMain;
        const filePath = path.join(storyDir, storyMain, `${titleMain}.md`);
        const storyInfoPath = path.join(storyDir, 'info', `${storyMain}.md`);
        const storyInfo = fs.existsSync(storyInfoPath) ? await fs.promises.readFile(storyInfoPath, 'utf8') : '';
        const storyInfoContent = storyInfo.replace(FRONT_MATTER_REG, '').trim();
        const storyEpisode = storyInfoContent ? JSON.parse(storyInfoContent) : [];
        const episode = storyEpisode.find(episode => episode.title === title);
        if (episode) {
            episode.titleSub = titleSub;
            episode.author = author;
            episode.date = dateTime;
        } else {
            storyEpisode.push({
                title: titleMain,
                titleSub: titleSub,
                author: author,
                date: dateTime,
            });
        }

        const infoMarkdown = `---\nstory: ${storyMain}\nstorySub: ${storySub}\ncount: ${storyEpisode.length}\nlatestTitle: ${title}\nlatestDate: ${dateTime}\nauthor: ${author}\n---\n${JSON.stringify(storyEpisode, null, 4)}`;
        const markdown = `---\nstory: ${story}\ntitle: ${title}\nauthor: ${author}\ndate: ${dateTime}\n---\n${content}`;

        await fs.promises.writeFile(storyInfoPath, infoMarkdown, 'utf8');
        await fs.promises.mkdir(path.dirname(filePath), {recursive: true});
        await fs.promises.writeFile(filePath, markdown, 'utf8');
        res.json({message: 'success'});
    } catch (err) {
        console.error('新增Story失败', err);
        res.status(500).json({error: 'failed'});
    }
});

function parseFrontMatter(content) {
    const match = content.match(FRONT_MATTER_REG);
    const fm = {};
    if (match) {
        match[1].split(/\r?\n/).forEach(line => {
            const m = line.match(FRONT_MATTER_LINE_REG);
            if (m) {
                fm[m[1].trim()] = m[2].trim();
            }
        });
    }
    return fm;
}

app.listen(PORT, '127.0.0.1', () => {
    console.log(`Server running on http://127.0.0.1:${PORT}`);
});