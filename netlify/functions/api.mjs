import { getStore } from '@netlify/blobs';
import crypto from 'node:crypto';

const COOKIE = 'nav_admin_session';
const DEFAULT_DATA = {
  categories: [
    { id: 'cat-common', name: '常用', sort: 1, visible: true },
    { id: 'cat-images', name: '免费图床', sort: 2, visible: true },
    { id: 'cat-video', name: '娱乐影音', sort: 3, visible: true },
    { id: 'cat-social', name: '社交社区', sort: 4, visible: true },
    { id: 'cat-tools', name: '实用工具', sort: 5, visible: true }
  ], sites: []
};
const json = (data, status=200, extra={}) => new Response(JSON.stringify(data), { status, headers: { 'content-type':'application/json; charset=utf-8', 'cache-control':'no-store', ...extra } });
const b64 = v => Buffer.from(v).toString('base64url');
function sign(value){ return crypto.createHmac('sha256', process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD || 'change-this-secret-before-deploy').update(value).digest('base64url'); }
function cookieValue(req){ const raw=req.headers.get('cookie')||''; const match=raw.split(';').map(x=>x.trim()).find(x=>x.startsWith(COOKIE+'=')); return match?decodeURIComponent(match.slice(COOKIE.length+1)):''; }
function isAuthed(req){
 const token=cookieValue(req); if(!token) return false; const parts=token.split('.'); if(parts.length!==2) return false;
 const [payload,signature]=parts; const expected=sign(payload); const a=Buffer.from(signature),b=Buffer.from(expected); if(a.length!==b.length||!crypto.timingSafeEqual(a,b)) return false;
 try { const data=JSON.parse(Buffer.from(payload,'base64url').toString()); return data.exp>Date.now(); } catch { return false; }
}
function sessionCookie(){ const payload=b64(JSON.stringify({exp:Date.now()+7*24*60*60*1000})); const token=payload+'.'+sign(payload); return `${COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=604800`; }
function clearCookie(){ return `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`; }
async function readData(){
 const store=getStore('nav-data'); const data=await store.get('site-data',{type:'json'});
 if(data && Array.isArray(data.categories) && Array.isArray(data.sites)) return data;
 await store.setJSON('site-data',DEFAULT_DATA); return structuredClone(DEFAULT_DATA);
}
function cleanText(v,max=180){return String(v??'').trim().slice(0,max)}
function normalize(data){
 if(!data||!Array.isArray(data.categories)||!Array.isArray(data.sites)) throw new Error('数据格式不正确');
 const categories=data.categories.slice(0,100).map((c,i)=>({id:cleanText(c.id,80)||crypto.randomUUID(),name:cleanText(c.name,80),sort:Number(c.sort)||i+1,visible:c.visible!==false})).filter(c=>c.name);
 const ids=new Set(categories.map(c=>String(c.id)));
 const sites=data.sites.slice(0,3000).map((s,i)=>({id:cleanText(s.id,80)||crypto.randomUUID(),categoryId:cleanText(s.categoryId,80),name:cleanText(s.name,120),url:cleanText(s.url,1500),sort:Number(s.sort)||i+1,visible:s.visible!==false})).filter(s=>s.name&&/^https?:\/\//i.test(s.url)&&ids.has(String(s.categoryId)));
 return {categories,sites};
}
export default async (req) => {
 const url=new URL(req.url); const action=url.searchParams.get('action')||'';
 try {
  if(req.method==='GET'&&action==='public') { const data=await readData(); return json({categories:data.categories,sites:data.sites}); }
  if(req.method==='POST'&&action==='login') {
   const body=await req.json(); const password=String(body.password||''); const configured=process.env.ADMIN_PASSWORD;
   if(!configured) return json({error:'尚未设置 Netlify 环境变量 ADMIN_PASSWORD。'},500);
   const a=Buffer.from(password),b=Buffer.from(configured); if(a.length!==b.length||!crypto.timingSafeEqual(a,b)) return json({error:'密码错误'},401);
   return json({ok:true},200,{'set-cookie':sessionCookie()});
  }
  if(action==='logout'&&req.method==='POST') return json({ok:true},200,{'set-cookie':clearCookie()});
  if(!isAuthed(req)) return json({error:'未登录或登录已过期，请重新登录。'},401);
  if(req.method==='GET'&&action==='admin') return json(await readData());
  if(req.method==='POST'&&action==='save') {
   const body=await req.json(); let data; try{data=normalize(body)}catch(e){return json({error:e.message},400)}
   await getStore('nav-data').setJSON('site-data',data); return json({ok:true,categories:data.categories.length,sites:data.sites.length});
  }
  return json({error:'不支持的请求'},404);
 } catch(e) { console.error(e); return json({error:'服务器处理失败，请查看 Netlify Functions 日志。'},500); }
};
