import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4173'],{stdio:'ignore'});
let browser;
try {
 for(let i=0;i<40;i++){try{if((await fetch('http://127.0.0.1:4173')).ok)break;}catch{}await new Promise(r=>setTimeout(r,250));}
 browser=await chromium.launch({headless:true});
 await mkdir('screenshots',{recursive:true});
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 page.setDefaultTimeout(12000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4173');
 await page.getByRole('link',{name:'Read the story',exact:true}).waitFor();
 await page.screenshot({path:'screenshots/home-desktop.png',fullPage:true});
 assert.equal(await page.locator('.article-grid .article-card').count(),3);
 await page.getByRole('link',{name:'Read the story',exact:true}).click();
 await page.getByRole('heading',{name:'Your dog is vomiting. What should you do next?'}).waitFor();
 await page.getByRole('button',{name:'Bookmark article',exact:true}).click();
 assert.equal(await page.getByRole('button',{name:'Remove bookmark',exact:true}).getAttribute('aria-pressed'),'true');
 await page.getByRole('button',{name:'Toggle larger article text'}).click();
 assert.equal(await page.locator('.prose.large').count(),1);
 await page.getByRole('button',{name:'Share article',exact:true}).click();
 assert.equal(await page.locator('dialog[open]').count(),1);
 await page.keyboard.press('Escape');
 assert.equal(await page.locator('dialog[open]').count(),0);
 await page.goto('http://127.0.0.1:4173/search?q=rabies');
 await page.getByRole('heading',{name:'The reading room.'}).waitFor();
 await page.getByRole('link',{name:'Rabies prevention starts with shared responsibility',exact:true}).waitFor();
 await page.goto('http://127.0.0.1:4173/article/does-not-exist');
 await page.getByRole('heading',{name:'This article is not available.'}).waitFor();
 await page.goto('http://127.0.0.1:4173/admin');
 await page.getByRole('heading',{name:'Co-founder access'}).waitFor();
 assert.equal(await page.getByRole('button',{name:'New article',exact:true}).count(),0);
 for(const width of [390,320]){
   await page.setViewportSize({width,height:844});
   await page.goto('http://127.0.0.1:4173');
   await page.getByRole('link',{name:'Read the story',exact:true}).waitFor();
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`Homepage horizontal overflow at ${width}px`);
   await page.getByRole('button',{name:'Open menu'}).click();
   await page.getByRole('link',{name:'All articles',exact:true}).click();
   await page.getByRole('heading',{name:'The reading room.'}).waitFor();
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`Archive horizontal overflow at ${width}px`);
 }
 await page.setViewportSize({width:390,height:844});
 await page.goto('http://127.0.0.1:4173');
 await page.getByRole('link',{name:'Read the story',exact:true}).waitFor();
 await page.screenshot({path:'screenshots/home-mobile.png',fullPage:true});
 assert.deepEqual(errors,[]);
 console.log('Browser checks passed: desktop/mobile routes, search, bookmarks, reading controls, share dialog, unavailable article, CMS gate and horizontal overflow.');
} finally {await browser?.close();server.kill('SIGTERM');server.unref();}
