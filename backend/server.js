const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const sharp = require('sharp');

const app = express();
const PORT = process.env.PORT || 3000;

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }
    next();
});
app.use(express.json());

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
    const thumbPath = path.join(thumbDir, fileName);
    const inputBuffer = await fs.promises.readFile(sourcePath);
    await sharp(inputBuffer)
        .resize({
            width: 600, withoutEnlargement: true
        })
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
    res.json({
        files: req.files.map(file => ({
            name: file.filename,
            url: '/gallery/' + encodeURIComponent(file.filename),
            thumbUrl: '/thumbs/' + encodeURIComponent(file.filename)
        }))
    });
});

app.get('/api/story', (req, res) => {
    fs.readdir(storyDir, (err, files) => {
        if (err) return res.status(500).json({error: 'no story'});

        const markdownFiles = files.filter(f => f.endsWith('.md'));
        const timeline = markdownFiles.map(file => {
            const filePath = path.join(storyDir, file);
            const content = fs.readFileSync(filePath, 'utf8');
            const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
            const fm = {};
            if (match) {
                match[1].split(/\r?\n/).forEach(line => {
                    const m = line.match(/^([a-zA-Z0-9_-]+)\s*:\s*(.*)$/);
                    if (m) fm[m[1].trim()] = m[2].trim().replace(/^['"]|['"]$/g, '');
                });
            }
            const story = fm.story || '';
            const title = fm.title || '';
            const rawDateText = fm.date || '';
            const dateText = rawDateText.trim()
                .replace(/^(\d{4})-(\d{1,2})-(\d{1,2})(.*)$/, (m, y, month, day, rest) => {
                    return y + '-' + month.padStart(2, '0') + '-' + day.padStart(2, '0') + rest;
                });
            const parseDateText = dateText.replace(/\s+/, 'T');
            const time = new Date(parseDateText).getTime() || 0;
            const yearMonth = String(parseDateText).slice(0, 7);
            const url = '/story/' + encodeURIComponent(file.replace(/\.md$/, '')) + '/';
            return {
                story, title, dateText, time: time, yearMonth: yearMonth, url: url
            };
        });
        const sortedList = timeline.sort((a, b) => b.time - a.time);
        res.json(sortedList);
    });
});

app.post('/api/admin/story/add', async (req, res) => {
    try {
        const {story, title, date, content, fileName} = req.body;
        const filePath = path.join(storyDir, fileName);
        const markdown = `---\nstory: ${story}\ntitle: ${title}\ndate: ${date}\n---\n\n${content}`;
        await fs.promises.writeFile(filePath, markdown, 'utf8');
        res.json({
            message: '新增成功'
        });
    } catch (err) {
        console.error('新增Story失败', err);
        res.status(500).json({
            error: '新增失败'
        });
    }
});

app.listen(PORT, '127.0.0.1', () => {
    console.log(`Server running on http://127.0.0.1:${PORT}`);
});