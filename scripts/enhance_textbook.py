#!/usr/bin/env python3
"""Optional source-geometry-only blue-bold SVGs and full-width region candidates."""
import argparse
import html
import json
import math
from pathlib import Path
import re
import fitz
from extract_textbook import sha256, write_json

USE = re.compile(r'<use\b[^>]*?/>')
ATTR = re.compile(r'([\w:-]+)="([^"]*)"')
BLUE = '#123b75'

def enhance_svg(page, svg):
    chars = {}
    for block in page.get_text('rawdict')['blocks']:
        for line in block.get('lines', []):
            for span in line['spans']:
                for c in span['chars']:
                    x,y = c['origin']
                    key = (c['c'], math.floor(x), math.floor(y))
                    chars.setdefault(key, []).append((x,y,bool(span['flags'] & 16)))
    audit = {'glyphUses':0, 'matchedGlyphUses':0, 'boldGlyphUsesRecolored':0, 'unmatchedGlyphUses':0,
             'color': BLUE, 'method':'exact source glyph path with character/baseline match within 0.035 PDF points'}
    def replace(match):
        tag = match.group(0)
        attrs = dict(ATTR.findall(tag))
        if 'data-text' not in attrs or 'transform' not in attrs:
            return tag
        audit['glyphUses'] += 1
        numbers = [float(n) for n in re.findall(r'[-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?', attrs['transform'])]
        if not attrs['transform'].startswith('matrix(') or len(numbers) != 6:
            audit['unmatchedGlyphUses'] += 1
            return tag
        x,y=numbers[4:]
        ch=html.unescape(attrs['data-text'])
        matched=[]
        for dx in [-1,0,1]:
            for dy in [-1,0,1]:
                for a,b,bold in chars.get((ch,math.floor(x)+dx,math.floor(y)+dy),[]):
                    if abs(x-a)<0.035 and abs(y-b)<0.035:
                        matched.append(bold)
        if not matched or len(set(matched)) != 1:
            audit['unmatchedGlyphUses'] += 1
            return tag
        audit['matchedGlyphUses'] += 1
        if matched[0]:
            audit['boldGlyphUsesRecolored'] += 1
            tag = re.sub(r'\sfill="[^"]*"', '', tag)
            return tag[:-2] + f' fill="{BLUE}"/>'
        return tag
    enhanced=USE.sub(replace, svg)
    # Only <use> tags selected above change; definitions, images, all other nodes are untouched.
    return enhanced,audit

def regions(page, data):
    protected=[]
    for b in data['textBlocks']:
        protected.extend(l['bbox'] for l in b['lines'])
    boundaries=[]
    tables=[]
    if data.get('tableCandidates') is not None:
        tables=data['tableCandidates']
        for table in tables:
            for row in table.get('rows',[]):
                boundaries += [row['bbox'][1],row['bbox'][3]]
    else:
        try:
            for table in page.find_tables().tables:
                rows=[{'bbox':list(r.bbox), 'cells':[list(c) if c else None for c in r.cells]} for r in table.rows]
                tables.append({'bbox':list(table.bbox),'rows':rows,'rowCount':table.row_count,
                               'columnCount':table.col_count,'reviewStatus':'unverified'})
                for r in rows:
                    boundaries += [r['bbox'][1],r['bbox'][3]]
        except Exception as exc:
            tables=[{'reviewStatus':'detection-failed','error':str(exc)}]
    # Never split a detected table, even at an apparent row boundary. Merged
    # labels and inherited column headings can span rows. Include every cell
    # and row extent, rather than trusting the outer bbox alone.
    table_envelopes=[]
    unreliable_geometry=not tables or any(t.get('reviewStatus')=='detection-failed' for t in tables)
    for table in tables:
        boxes=[]
        if table.get('bbox'): boxes.append(table['bbox'])
        for row in table.get('rows',[]):
            if row.get('bbox'): boxes.append(row['bbox'])
            boxes.extend(cell for cell in row.get('cells',[]) if cell)
        if not boxes:
            unreliable_geometry=True
            continue
        envelope=[min(b[0] for b in boxes),min(b[1] for b in boxes),
                  max(b[2] for b in boxes),max(b[3] for b in boxes)]
        table_envelopes.append(envelope)
        protected.append(envelope)
    # No inferred semantic cuts on pages whose table structure is unknown.
    if unreliable_geometry:
        protected.append([0,0,page.rect.width,page.rect.height])
    for b in data['imagePlacements']:
        box=list(b['bbox'])
        # A detected table row bounds caption context. Never extend protection into the next row.
        containing=[r['bbox'][3] for t in tables for r in t.get('rows',[]) if
                    r['bbox'][0] <= box[0]+1 and r['bbox'][2] >= box[2]-1 and
                    r['bbox'][1] <= box[1]+0.3 and r['bbox'][3] >= box[3]-0.3]
        limit=min(containing)-0.31 if containing else page.rect.height
        box[3]=max(box[3],min(limit,box[3]+36))
        protected.append(box)
    # Whitespace bands allow complete coverage beyond detected tables; never reorder columns.
    edges=sorted(set([0.,page.rect.height]+[max(0.,min(page.rect.height,box[k])) for box in protected for k in [1,3]]))
    boundaries += [(a+b)/2 for a,b in zip(edges,edges[1:]) if b-a>=3]
    safe=sorted(set(round(y,4) for y in boundaries if 0<y<page.rect.height and
                    not any(box[1]-0.3<y<box[3]+0.3 for box in protected)))
    selected=[0.]
    while True:
        # Prefer a moderate-height region; avoid tiny strips and never force an unsafe cut.
        possible=[y for y in safe if y-selected[-1]>=70 and page.rect.height-y>=50]
        if not possible or page.rect.height-selected[-1]<=260:
            break
        next_y=min(possible,key=lambda y:abs(y-selected[-1]-210))
        selected.append(next_y)
    selected.append(page.rect.height)
    result=[{'id':f"p{data['pdfPage']:03d}-r{i+1:02d}",'label':f'구간 {i+1}',
             'bbox':[0,a,page.rect.width,b], 'reviewStatus':'unverified',
             'format':'full-width-source-region','sourceOrder':i,
             'textAndImageBoundaryCheck':'passed','semanticRowCaptionAssociation':'not-verified',
             'tableBoundaryCheck':'complete-detected-table-envelopes-preserved',
             'tableRowAndCellBoundaryCheck':'not-verified' if unreliable_geometry else 'passed',
             'tableBoundaryCheckScope':'detected-row-and-cell-bboxes-only; not semantic proof',
             'segmentationPolicy':'whole-page-fallback' if unreliable_geometry else 'whole-table-envelope-protection'}
            for i,(a,b) in enumerate(zip(selected,selected[1:]))]
    return result,tables

def run(root):
    root=Path(root)
    manifest=json.loads((root/'manifest.json').read_text())
    doc=fitz.open(root/manifest['source']['pdfPath'])
    (root/'enhanced').mkdir(exist_ok=True)
    audits=[]
    for i,p in enumerate(manifest['pages']):
        page=doc[i]
        data=json.loads((root/p['dataPath']).read_text())
        svg,audit=enhance_svg(page,page.get_svg_image(text_as_path=True))
        path=f'enhanced/page-{i+1:03d}.svg'
        (root/path).write_text(svg,encoding='utf-8')
        data['enhancedSvgPath']=path
        png_path=f'enhanced/page-{i+1:03d}.png'
        # Never rasterize the whole SVG: masks/strokes can differ from the PDF.
        # Safe original placeholder until corrected pixel-mask pass succeeds.
        import shutil
        shutil.copyfile(root/p['imagePath'],root/png_path)
        data['enhancedImagePath']=png_path
        data['enhancementAudit']=audit
        data['regions'],data['tableCandidates']=regions(page,data)
        write_json(root/p['dataPath'],data)
        p['enhancedImagePath']=png_path
        p['enhancedSvgPath']=path
        p['enhancedImageSha256']=sha256(root/png_path)
        p['dataSha256']=sha256(root/p['dataPath'])
        p['regionCount']=len(data['regions'])
        audits.append({'pdfPage':i+1,**audit,'regionCount':len(data['regions'])})
        if (i+1)%12==0:
            print(f'Enhanced {i+1}/144',flush=True)
    manifest['enhancement']={'color':BLUE,'mode':'bold-source-glyph-fill-only','originalAvailable':True,
                             'reviewStatus':'unverified','noNormalGlyphRecolor':True}
    write_json(root/'manifest.json',manifest)
    write_json(root/'enhancement-audit.json',audits)
    print({key:sum(a[key] for a in audits) for key in ['glyphUses','matchedGlyphUses','boldGlyphUsesRecolored','unmatchedGlyphUses']})

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output',required=True)
    args=parser.parse_args()
    run(args.output)
    from render_source_overlay import run as render_verified_overlay
    render_verified_overlay(args.output)
