const ch = require('cheerio');
fetch('https://www.autovrse.com').then(r=>r.text()).then(html=>{
  const $ = ch.load(html);
  $('nav, footer, header').remove();
  const selectors = ['h1', 'h2', '.hero', '[class*="hero"]', '[class*="banner"]', 'main p', '.about', '[class*="about"]', '[class*="description"]', 'p'];
  const parts = [];
  for(const sel of selectors){
    $(sel).each((_,el)=>{
      const text = $(el).text().trim();
      if(text.length > 20 && text.length < 500 && !parts.includes(text)){
        parts.push(text);
      }
    });
    if(parts.length >= 5) break;
  }
  console.log('Parts:', parts);
}).catch(e=>console.log(e));
