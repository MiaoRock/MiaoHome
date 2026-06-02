async function loadInfo() {
    fetch('/static/info.html')
        .then(res => res.text())
        .then(html => document.getElementById('miao-info').innerHTML = html)
        .catch(err => console.error(err));
}

loadInfo();