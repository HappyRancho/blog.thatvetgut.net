import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
const dir='research'; await mkdir(dir,{recursive:true});
const sites=[['public','https://www.thatvetguy.net/'],['cms','https://blog.thatvetguy.net/admin'],['public-about','https://www.thatvetguy.net/about'],['public-team','https://www.thatvetguy.net/team'],['petmd','https://www.petmd.com/'],['vca','https://vcahospitals.com/know-your-pet'],['akc','https://www.akc.org/expert-advice/'],['spruce','https://www.thesprucepets.com/'],['preventive','https://www.preventivevet.com/'],['dailypaws','https://www.dailypaws.com/'],['happypet','https://www.happypet.care/blog'],['dogsee','https://www.dogseechew.in/blog'],['wip','https://www.worksinprogress.co/'],['ghost','https://ghost.org/help/using-the-editor/'],['tiptap','https://tiptap.dev/docs/editor/getting-started/overview']];
const browser=await chromium.launch({headless:true});
const summary=[];
for(const [id,url] of sites){
 const page=await browser.newPage({viewport:{width:1440,height:1100}});
 try {const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:20000});await page.waitForTimeout(1800);
 const data=await page.evaluate(()=>({url:location.href,title:document.title,canonical:document.querySelector('link[rel=canonical]')?.href,headings:[...document.querySelectorAll('h1,h2,h3')].slice(0,60).map(n=>n.textContent.trim()),text:document.body.innerText.slice(0,25000),links:[...document.querySelectorAll('a[href]')].map(a=>({text:a.innerText.trim().slice(0,100),url:a.href})).filter(a=>a.text).slice(0,180),font:getComputedStyle(document.querySelector('h1')||document.body).fontFamily}));
 data.status=response?.status();await writeFile(`${dir}/${id}.json`,JSON.stringify(data,null,2));await page.screenshot({path:`${dir}/${id}.png`,fullPage:false});summary.push({id,url:data.url,status:data.status,title:data.title});
 // Inspect a real article when accessible, rather than relying on homepages alone.
 if(!['cms','ghost','tiptap'].includes(id)){const link=data.links.find(a=>a.url.startsWith(new URL(data.url).origin)&&a.text.length>30&&!/privacy|cookie|terms|contact|newsletter/i.test(a.text)&&a.url!==data.url);if(link){await page.goto(link.url,{waitUntil:'domcontentloaded',timeout:15000});await writeFile(`${dir}/${id}-article.txt`,`${page.url()}\n${await page.locator('body').innerText()}`);await page.screenshot({path:`${dir}/${id}-article.png`});}}
 }catch(e){summary.push({id,url,error:e.message});}finally{await page.close();}
}
await browser.close();
for(const c of ['publications','manuscripts','cms_users','authors']){try{const r=await fetch(`https://firestore.googleapis.com/v1/projects/adroit-bus-1ghtt/databases/ai-studio-thatvetguy-7ee5cb09-c3e8-4d7e-8c1c-f5ef3b5df638/documents/${c}?pageSize=2`);const data=await r.json();summary.push({collection:c,status:r.status,count:data.documents?.length||0,fields:c==='publications'?data.documents?.map(d=>Object.keys(d.fields||{})):undefined,error:data.error?.message});}catch(e){summary.push({collection:c,error:e.message});}}
await writeFile(`${dir}/summary.json`,JSON.stringify(summary,null,2));console.log(summary);
