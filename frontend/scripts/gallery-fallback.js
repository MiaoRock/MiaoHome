const fs = require('fs');
const path = require('path');

hexo.extend.filter.register('server_middleware', function (app) {
    app.use(function (req, res, next) {
        const urlPath = req.url.split('?')[0];

        if (!urlPath.startsWith('/gallery/')) {
            next();
            return;
        }

        if (urlPath === '/gallery/' || urlPath === '/gallery/index.html') {
            next();
            return;
        }

        const indexPath = path.join(hexo.public_dir, 'gallery', 'index.html');

        if (!fs.existsSync(indexPath)) {
            next();
            return;
        }

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        fs.createReadStream(indexPath).pipe(res);
    });
});