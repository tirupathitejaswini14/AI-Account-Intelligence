const cheerio = require('cheerio');
fetch('https://www.autovrse.com')
  .then(r=>r.text())
  .then(html => { 
    const ch = cheerio.load(html); 
    console.log('Title:', ch('title').first().text().trim()); 
    console.log('Desc:', ch('meta[name="description"]').attr('content') || ch('meta[property="og:description"]').attr('content')); 
    const texts = [];
    ch('p, h1, h2, h3').each((i, el) => {
      texts.push(ch(el).text().trim());
    });
    console.log('Body desc:', texts.join(' ').substring(0, 150));
  })
  .catch(e=>console.error(e))
