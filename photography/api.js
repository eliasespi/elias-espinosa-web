import {url,key} from './config.js?v=5';
export const configured=Boolean(url&&key);
let token='';
export function setToken(value){token=value}
export async function request(path,options={}){
 if(!configured)throw Error('Storage not configured.');
 const response=await fetch(url+path,{...options,headers:{apikey:key,...(token?{Authorization:'Bearer '+token}:{}),...(options.headers||{})}});
 if(!response.ok)throw Error('Request failed ('+response.status+').');
 const raw=await response.text();return raw?JSON.parse(raw):null;
}
export function db(table,query='',options={}){return request('/rest/v1/'+table+'?'+query,{...options,headers:{'Content-Type':'application/json',Prefer:'return=representation',...(options.headers||{})}})}
export function objectPath(path){return path.split('/').map(encodeURIComponent).join('/')}
export async function imageUrl(path){const result=await request('/storage/v1/object/sign/photography/'+objectPath(path),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({expiresIn:900})});return url+'/storage/v1'+result.signedURL}
export function el(tag,text,cls){const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n}
