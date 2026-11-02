"""Deterministic pixel crops from existing verified official-exam photographs. No generated imagery."""
from pathlib import Path
from PIL import Image
import json,hashlib
root=Path(__file__).resolve().parents[1];spec=json.loads((root/'scripts/fixtures/ancient-artifact-crops.json').read_text());manifest=json.loads((root/'media/cbt-originals/manifest.json').read_text())['files'];gallery=json.loads((root/'media/culture-gallery.json').read_text());audit=[]
for x in spec:
 p=root/'media/cbt-originals'/f'{x["exam"]}.webp';want=manifest[p.name];want=want if isinstance(want,str)else want['sha256'];assert hashlib.sha256(p.read_bytes()).hexdigest()==want
 im=Image.open(p);a,b,c,d=x['rect'];assert 0<=a<c<=im.width and 0<=b<d<=im.height
 dst=root/'media/culture-photos'/f'ancient-{x["key"]}.png';im.crop((a,b,c,d)).save(dst)
 entry={k:x[k]for k in['name','country','period','feature','caution']};entry['src']=str(dst.relative_to(root));entry['source']={'title':f'국사편찬위원회 한능검 {x["exam"].split("-")[0]}회 {int(x["exam"].split("-")[1])}번 {x["option"]}번 보기 · 원본 사진','url':'/media/cbt-originals/'+p.name};entry['examRefs']=[{'round':r,'number':n,'option':o}for r,n,o in x['refs']]
 # Preserve existing reviewed entries and order; source crop names are stable across rebuilds.
 bucket=gallery[x['era']];prior=next((i for i,y in enumerate(bucket)if y['src']==entry['src']),None)
 if prior is None:assert not any(y['name']==entry['name']for values in gallery.values()for y in values);bucket.append(entry)
 else:bucket[prior]=entry
 audit.append({'key':x['key'],'era':x['era'],'src':entry['src'],'input':str(p.relative_to(root)),'inputSha256':want,'rect':x['rect'],'outputSha256':hashlib.sha256(dst.read_bytes()).hexdigest(),'refs':entry['examRefs']})
(root/'media/culture-gallery.json').write_text(json.dumps(gallery,ensure_ascii=False,indent=2)+'\n');(root/'scripts/fixtures/ancient-artifact-audit.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2)+'\n');print('9actual-photo crops; original exam bytes untouched')
