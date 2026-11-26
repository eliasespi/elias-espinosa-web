import {request,db,setToken,imageUrl,objectPath,el} from './api.js?v=5';
const login=document.querySelector('#login'),editor=document.querySelector('#editor'),notice=document.querySelector('#notice'),projects=document.querySelector('#projects');
let busy=false;
function say(s){notice.textContent=s}
function button(label,action){const b=el('button',label);b.type='button';b.onclick=()=>run(action);return b}
async function run(action){if(busy)return;busy=true;try{await action()}catch(e){say(e.message+' Please try again or sign in again.')}finally{busy=false}}
async function signOut(){try{await request('/auth/v1/logout',{method:'POST'})}catch{}setToken('');editor.hidden=true;login.hidden=false;projects.replaceChildren();login.reset();say('Signed out.')}
if(location.protocol!=='https:'){login.hidden=true;say('HTTPS is required. Do not enter your password over HTTP.')}
login.onsubmit=e=>{e.preventDefault();run(async()=>{if(location.protocol!=='https:')throw Error('HTTPS required.');const form=new FormData(login);const session=await request('/auth/v1/token?grant_type=password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:form.get('email'),password:form.get('password')})});setToken(session.access_token);login.reset();const allowed=await db('photo_admins','select=user_id');if(!allowed.length){await signOut();throw Error('This account is not authorized.')}login.hidden=true;editor.hidden=false;say('Signed in.');await render()})};
document.querySelector('#logout').onclick=()=>run(signOut);
document.querySelector('#create').onsubmit=e=>{e.preventDefault();run(async()=>{const f=new FormData(e.target);await db('photo_projects','',{method:'POST',body:JSON.stringify({title:String(f.get('title')).trim(),project_date:f.get('date')||null})});e.target.reset();await render();say('Collection created.')})};
const projectQuery=id=>'id=eq.'+encodeURIComponent(id);
const imageQuery=id=>'id=eq.'+encodeURIComponent(id);
async function removeFile(path){await request('/storage/v1/object/photography/'+objectPath(path),{method:'DELETE'})}
async function render(){
 const rows=await db('photo_projects','select=*&order=created_at.desc');projects.replaceChildren();
 for(const p of rows){
 const item=el('section','','studio-item'),title=el('h2',p.title),state=el('p',p.published?'Published':'Draft');
 const actions=el('div','','studio-actions');
 actions.append(button(p.published?'Unpublish':'Publish',async()=>{await db('photo_projects',projectQuery(p.id),{method:'PATCH',body:JSON.stringify({published:!p.published})});await render()}));
 const rename=el('form'),label=el('label','Collection name'),input=el('input');input.value=p.title;input.required=true;input.maxLength=200;label.append(input);const save=el('button','Save name');rename.append(label,save);rename.onsubmit=e=>{e.preventDefault();run(async()=>{await db('photo_projects',projectQuery(p.id),{method:'PATCH',body:JSON.stringify({title:input.value.trim()})});await render()})};
 const photos=await db('photo_images','select=*&project_id=eq.'+encodeURIComponent(p.id)+'&order=position.asc,id.asc');
 actions.append(button('Delete collection',async()=>{if(!confirm('Delete this collection and its photographs?'))return;for(const photo of photos)await removeFile(photo.path);await db('photo_projects',projectQuery(p.id),{method:'DELETE'});await render()}));
 const upload=el('form'),uploadLabel=el('label','Add photos'),files=el('input');files.type='file';files.multiple=true;files.accept='image/jpeg,image/png,image/webp,image/avif';files.required=true;uploadLabel.append(files);upload.append(uploadLabel,el('button','Upload'));
 upload.onsubmit=e=>{e.preventDefault();run(async()=>{let pos=Math.max(-1,...photos.map(x=>x.position))+1;let count=0;for(const file of files.files){if(!['image/jpeg','image/png','image/webp','image/avif'].includes(file.type)||file.size>20971520)throw Error('Use JPEG, PNG, WebP or AVIF under 20 MB.');const path=p.id+'/'+crypto.randomUUID()+'.'+({'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/avif':'avif'}[file.type]);await request('/storage/v1/object/photography/'+objectPath(path),{method:'POST',headers:{'Content-Type':file.type},body:file});try{await db('photo_images','',{method:'POST',body:JSON.stringify({project_id:p.id,path,position:pos++})})}catch(e){await removeFile(path).catch(()=>{});throw e}say('Uploaded '+(++count)+' photo(s).')}await render()})};
 item.append(title,state,actions,rename,upload);
 for(let i=0;i<photos.length;i++){const photo=photos[i],row=el('div','','studio-photo'),img=el('img');img.alt=photo.caption||'';try{img.src=await imageUrl(photo.path)}catch{}const cap=el('input');cap.value=photo.caption||'';cap.placeholder='Caption / alt text';cap.setAttribute('aria-label','Photo caption');row.append(img,cap,button('Save caption',async()=>{await db('photo_images',imageQuery(photo.id),{method:'PATCH',body:JSON.stringify({caption:cap.value})});say('Caption saved.')}),button('Delete',async()=>{if(!confirm('Delete this photograph?'))return;await removeFile(photo.path);await db('photo_images',imageQuery(photo.id),{method:'DELETE'});await render()}));if(i>0)row.append(button('Move up',async()=>{const prev=photos[i-1];await db('photo_images',imageQuery(photo.id),{method:'PATCH',body:JSON.stringify({position:prev.position})});await db('photo_images',imageQuery(prev.id),{method:'PATCH',body:JSON.stringify({position:photo.position})});await render()}));item.append(row)}
 projects.append(item);
 }
}
