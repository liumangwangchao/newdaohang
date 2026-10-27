(async function(){
 const content=document.getElementById('content'), nav=document.getElementById('category-nav');
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 try{
  const res=await fetch('/.netlify/functions/api?action=public',{cache:'no-store'});
  if(!res.ok) throw new Error('服务器返回 '+res.status);
  const data=await res.json(); const categories=(data.categories||[]).filter(c=>c.visible!==false).sort((a,b)=>(a.sort||0)-(b.sort||0)); const sites=data.sites||[];
  if(!categories.length){content.innerHTML='<p class="empty">暂时还没有导航内容，请登录后台添加分类和网址。</p>';return;}
  nav.innerHTML=categories.map((c,i)=>`<a class="category-link${i===0?' active':''}" href="#cat-${esc(c.id)}">${esc(c.name)}</a>`).join('');
  content.innerHTML=categories.map(c=>{const list=sites.filter(s=>String(s.categoryId)===String(c.id)&&s.visible!==false).sort((a,b)=>(a.sort||0)-(b.sort||0));return `<section class="category-section" id="cat-${esc(c.id)}"><h2 class="category-title">${esc(c.name)}</h2>${list.length?`<div class="site-grid">${list.map(s=>`<a class="site-card" href="${esc(s.url)}" target="_blank" rel="noopener noreferrer"><div class="site-name">${esc(s.name)}</div><div class="site-url">${esc(s.url)}</div></a>`).join('')}</div>`:'<div class="empty">此分类暂无网址</div>'}</section>`}).join('');
  nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.querySelectorAll('a').forEach(x=>x.classList.remove('active'));a.classList.add('active')}));
 }catch(e){content.innerHTML='<p class="empty">导航数据加载失败。请检查 Netlify Functions 是否部署成功，稍后刷新重试。</p>';console.error(e)}
})();
