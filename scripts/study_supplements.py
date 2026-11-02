"""Keep original source JSON; source-backed connection exercises now belong to quiz tabs."""
from pathlib import Path
import re,subprocess,sys
ROOT=Path(__file__).resolve().parents[1]
FILES={e:e+'-comic.html' for e in ['prehistory','gojoseon','samguk','nambuk','goryeo','islands','opening','colonial','modern']}
FILES['joseon']='joseon-all-comic.html'
def apply():
 for era,file in FILES.items():
  p=ROOT/'media'/file
  if p.exists():p.write_text(re.sub(r'<!--STUDY-ENRICHMENT-->[\\s\\S]*?<!--END-STUDY-ENRICHMENT-->','',p.read_text()))
 subprocess.run([sys.executable,str(ROOT/'scripts/build_connection_quiz.py')],check=True)
if __name__=='__main__':apply()
