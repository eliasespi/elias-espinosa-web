import {configured,db,imageUrl,el} from './api.js?v=5';
const status=document.querySelector('#status');
const grid=document.querySelector('#collections');
const viewer=document.querySelector('#viewer');
document.querySelector('#close-viewer').onclick=()=>viewer.close();
async function load(){
  if(!configured) return;
  status.textContent='Loading collections…';
  const projects=await db('photo_projects','select=*&published=eq.true&order=project_date.desc');
  const id=new URLSearchParams(location.search).get('project');
  if(id){
    const p=projects.find(x=>x.id===id);
    if(!p){status.textContent='Collection not found.';return}
    document.querySelector('#collection-title').textContent=p.title;
    document.title=p.title+' | Photography | Elias Espinosa';
    const back=el('a','← Photography','photo-back text-link');
    back.href='/photography/'; grid.before(back);
    const photos=await db('photo_images','select=*&project_id=eq.'+encodeURIComponent(id)+'&order=position.asc,id.asc');
    status.textContent=photos.length?'':'No photographs yet.';
    grid.classList.add('photo-images');
    for(const photo of photos){
      const figure=el('figure','','photo-frame'),button=el('button'),img=el('img');
      img.alt=photo.caption||p.title;img.loading='lazy';img.src=await imageUrl(photo.path);
      button.onclick=()=>{const large=document.querySelector('#large-photo');large.src=img.src;large.alt=img.alt;viewer.showModal()};
      button.append(img);figure.append(button);
      if(photo.caption)figure.append(el('figcaption',photo.caption));
      grid.append(figure);
    }
    return;
  }
  status.textContent=projects.length?'':'No collections yet.';
  projects.forEach((p,i)=>{
    const a=el('a','','photo-collection-link');
    a.href='/photography/?project='+encodeURIComponent(p.id);
    const year=(p.project_date||'').slice(0,4);
    a.append(el('span',String(i+1).padStart(2,'0'),'project-accordion-number'),el('h2',p.title),el('span',year,'photo-collection-meta'),el('span','→','photo-arrow'));
    grid.append(a);
  });
}
load().catch(()=>{status.textContent='Collections unavailable.'});
