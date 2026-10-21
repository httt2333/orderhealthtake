"""Build the dependency-free preview from the same source as the local server."""
from pathlib import Path
import re

root = Path(__file__).resolve().parents[1]
domain = (root / 'src/domain.js').read_text(encoding='utf-8')
examples = (root / 'src/package-examples.js').read_text(encoding='utf-8')
app = (root / 'src/app.js').read_text(encoding='utf-8')
app = re.sub(r"^import .+ from '\./(?:domain|package-examples)\.js';\r?\n", '', app, flags=re.M)
script = re.sub(r'\bexport (?=(?:const|function|class)\b)', '', domain + '\n' + examples + '\n' + app)
script = script.replace('</script', '<\\/script')
html = (root / 'index.html').read_text(encoding='utf-8')
html = html.replace('<link rel="stylesheet" href="./styles.css" />', '<style>\n' + (root/'styles.css').read_text(encoding='utf-8') + '\n</style>')
html = html.replace('<script type="module" src="./src/app.js"></script>', '<script type="module">\n' + script + '\n</script>')
html = '\n'.join(line.rstrip() for line in html.splitlines()) + '\n'
for filename in ['安心药盒_单文件预览.html', '安心药盒_V1.5_单文件预览.html']:
    (root/filename).write_text(html, encoding='utf-8')
print('Built both single-file previews with embedded packaging photos.')
