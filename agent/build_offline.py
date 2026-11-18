"""Create a single-file edition from the same dashboard, engines and source cards as the PWA."""
from pathlib import Path
import argparse,base64,re

APP=Path(__file__).resolve().parent.parent/'docs'
ORDER=['config','inspection_data','training_engine','planner_engine','classification','parser_pwa','release_reference','always_on_ui','training_ui','planner_ui','mobile_core','dashboard']
def bundle():
    modules=["'use strict';\nconst modules=Object.create(null);"]
    for module in ORDER:
        source=(APP/(module+'.js')).read_text()
        exports=re.findall(r'^export (?:const|function) (\w+)',source,re.M)
        for items in re.findall(r'^export \{([^}]+)\};',source,re.M):
            exports.extend(x.strip() for x in items.split(','))
        source=re.sub(r"^import \{([^}]+)\} from '\./([\w]+)\.js';",r"const {\1}=modules['\2'];",source,flags=re.M)
        source=re.sub(r'^export \{[^}]+\};','',source,flags=re.M)
        source=re.sub(r'^export (?=const|function)','',source,flags=re.M)
        if module=='mobile_core':
            source=source.replace("await import('./dashboard.js');",'')
            source=source.replace("const isLocal=location.protocol==='file:';","const isLocal=true;")
            source=source.replace("if('serviceWorker' in navigator", "if(!isLocal && 'serviceWorker' in navigator")
        if module=='always_on_ui':
            source=re.sub(r"^const localFile=.*?;$",'const localFile=true;',source,flags=re.M)
        if re.search(r'^(import|export) ',source,re.M):
            raise ValueError('Unexpected module syntax in '+module)
        modules.append("modules['"+module+"']=(()=>{\n"+source+"\nreturn {"+','.join(exports)+"};\n})();")
    return '\n'.join(modules)
def build(dest):
    html=(APP/'index.html').read_text()
    html=html.replace('CO Tanker Intelligence · Samsung','CO Tanker Intelligence · Offline')
    html=re.sub(r'<link rel="manifest"[^>]+>','',html)
    icon=base64.b64encode((APP/'icons/icon192.png').read_bytes()).decode()
    html=html.replace('href="icons/icon192.png"','href="data:image/png;base64,'+icon+'"')
    html=html.replace('<link rel="stylesheet" href="styles.css">','<style>'+ (APP/'styles.css').read_text()+'</style>')
    source=bundle().replace('</script','<\\/script')
    html=html.replace('<script type="module" src="mobile_core.js"></script>','<script>'+source+'</script>')
    dest.write_text(html)
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('output',type=Path)
    build(parser.parse_args().output)
