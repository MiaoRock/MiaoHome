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


hexo.extend.tag.register('home_story', function(args){
    const storyDir = path.join(hexo.source_dir,'story')
    const root = hexo.config.root||'/'

    const escapeHtml = str => String(str||'')
        .replace(/&/g,'&amp;')
        .replace(/</g,'&lt;')
        .replace(/>/g,'&gt;')
        .replace(/"/g,'&quot;')
        .replace(/'/g,'&#39;')

    const parseFrontMatter = content => {
        const text = content.replace(/^\s*\uFEFF?\s*/,'')
        const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/)
        const result = {}
        if(!match) return result
        match[1].split(/\r?\n/).forEach(line=>{
            const m = line.match(/^([a-zA-Z0-9_-]+)\s*:\s*(.*)$/)
            if(m) result[m[1].trim()] = m[2].trim().replace(/^['"]|['"]$/g,'')
        })
        return result
    }

    let list = []
    try{
        const files = fs.readdirSync(storyDir).filter(f=>f.endsWith('.md'))
        list = files.map(file=>{
            const filePath = path.join(storyDir,file)
            const content = fs.readFileSync(filePath,'utf8')
            const fm = parseFrontMatter(content)
            const title = fm.title||file.replace(/\.md$/,'')
            const dateText = fm.date||''
            const time = new Date(dateText).getTime()
            return {title,dateText,time:isNaN(time)?0:time,year:dateText?String(dateText).slice(0,4):'',url:root+'story/'+encodeURIComponent(file.replace(/\.md$/,''))+'/'}
        })
    }catch(e){
        return '<div class="home-story-empty">story 文件夹不存在或无 Markdown 文件</div>'
    }

    list = list.filter(i=>i.dateText).sort((a,b)=>b.time-a.time)
    const yearMap = {}
    list.forEach(item=>{if(!yearMap[item.year]) yearMap[item.year]=[];yearMap[item.year].push(item)})
    const years = Object.keys(yearMap).sort((a,b)=>Number(b)-Number(a))

    let html = '<div class="timeline">'
    html += '<div class="timeline-item headline"><div class="timeline-item-title"><div class="item-circle">全部文章 - '+list.length+'</div></div></div>'
    years.forEach(year=>{
        html += '<div class="timeline-item"><div class="timeline-item-title"><div class="item-circle">'+escapeHtml(year)+'</div></div></div>'
        yearMap[year].forEach(item=>{
            html += '<div class="timeline-item"><div class="timeline-item-title"><div class="item-circle"></div></div>'
            html += '<div class="timeline-item-content"><time datetime="'+escapeHtml(item.dateText)+'">'+escapeHtml(item.dateText)+'</time>'
            html += '<a href="'+item.url+'" title="'+escapeHtml(item.title)+'">'+escapeHtml(item.title)+'</a></div></div>'
        })
    })
    html += '</div>'
    return html
})