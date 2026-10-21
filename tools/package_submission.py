"""Package the reviewable scenario-A deliverables without local state or Git files."""
from pathlib import Path
import argparse
import hashlib
import zipfile

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--hours', default='约8小时：补充调研约4小时，项目实现约4小时（提交者自述，分两天完成）')
parser.add_argument('--url', default='提交前补充公开部署链接；localhost不是远程可访问地址')
args = parser.parse_args()
out = ROOT.parent / '提交包'
out.mkdir(exist_ok=True)
target = out / '安心药盒_场景A_提交包.zip'
prefix = '安心药盒_场景A_提交包/'
guide = f'''安心药盒｜场景 A 提交说明

产品定位：为独立生活、长期使用多种药物的老人，提供“看自己的药盒照片、听本次安排、记录服药”的Web工具。

提交内容
1. 01_产品说明：用户、核心问题、优先理由、完整流程、智能参与方式与关键假设；另附6页包装识别与页面方案。
2. 02_可运行Demo与源码：无需第三方依赖，含单文件预览、源码、测试及运行说明。
3. 03_验证与复盘：已有证据、未验证假设、验证计划与再给两小时的优先事项。
4. 04_补充调研与历史PRD：两份原始调研报告、V1.0 PRD及材料来源说明。历史PRD不替代当前产品说明。

建议评审顺序
先看01_产品说明，再启动02中的Demo；添加用药→试用示例→选择一个包装→核对→填写测试安排→核对并保存→今天用药看图、听安排、记录。
五个包装是独立输入，不组成共同用药方案。演示请使用虚构安排或非药品道具，不根据包装规格编造个人用量。

启动方式
有Node.js 18+：进入02_可运行Demo与源码，双击启动Demo.cmd，打开 http://localhost:4173/#/elder/home 。也可运行 npm run dev 。
无Node.js：用浏览器打开同目录的安心药盒_V1.5_单文件预览.html；文件模式可能限制语音权限，完整体验建议本地服务器。

实现与模拟
已实现：本地照片选择/压缩/保存、安排录入与保存前核对、大图、逐项朗读、服药记录、常驻语音任务入口。
模拟：五张包装的识别结果是人工整理的预置数据；语音任务使用浏览器识别与规则匹配。
未实现：真实视觉AI/OCR、后台推送、账户及跨设备同步。网页关闭后不保证提醒。

验证结果
56项代码测试通过；已查看实际浏览器示例页和单文件预览；图文方案经逐页渲染检查。
尚未完成真实老人可用性、真实手机相机/麦克风/通知及模型识别准确率测试。文档手机图为设计示意，非实机截图。

工具与投入
AI/Coding工具：Codex；文档由Python/python-docx/Pillow生成、本机Word导出和Poppler渲染检查；运行时语音由浏览器提供。
实际投入时间：{args.hours}
远程Demo地址：{args.url}

提交前最后一项
按题目“部署下可验证Demo”要求补可访问的部署链接。当前压缩包提供本地可运行版本，不能将localhost发给异地评审作为在线地址。
素材：五张包装图片由提交者提供；来源文件名见源码 assets/demo-packages/catalog.json。产品问题与用户能力仍为待验证假设，本包不声称已完成真实用户研究。
'''
with zipfile.ZipFile(target, 'w', zipfile.ZIP_DEFLATED) as z:
    z.writestr(prefix+'00_先读我.txt', guide.encode('utf-8-sig'))
    z.write(ROOT/'挑战交付/04_提交说明.md', prefix+'提交说明.md')
    for name in ['01_产品说明.md','安心药盒_包装识别演示与页面方案.docx']:
        z.write(ROOT/'挑战交付'/name, prefix+'01_产品说明/'+name)
    z.write(ROOT/'挑战交付/03_复盘.md', prefix+'03_验证与复盘/复盘.md')
    z.write(ROOT/'QA_LOG.md', prefix+'03_验证与复盘/QA_LOG.md')
    for attachment in sorted((ROOT/'挑战交付/补充材料').glob('*.md')):
        z.write(attachment, prefix+'04_补充调研与历史PRD/'+attachment.name)
    names = ['index.html','styles.css','server.mjs','package.json','README.md','CODEX_HANDOFF.md','安心药盒_V1.5_单文件预览.html']
    for folder in ['src','assets','tests']:
        names.extend(str(p.relative_to(ROOT)) for p in (ROOT/folder).rglob('*') if p.is_file() and '__pycache__' not in p.parts)
    names.append('tools/build_single_preview.py')
    for name in names:
        z.write(ROOT/name, prefix+'02_可运行Demo与源码/'+name.replace('\\','/'))
    z.write(ROOT/'挑战交付/02_Demo运行说明.md', prefix+'02_可运行Demo与源码/运行说明.md')
    z.writestr(prefix+'02_可运行Demo与源码/启动Demo.cmd', '@echo off\r\ncd /d "%~dp0"\r\nwhere node >nul 2>nul\r\nif errorlevel 1 (\r\n echo Please install Node.js 18+ or open the single-file HTML preview.\r\n pause\r\n exit /b 1\r\n)\r\necho Open http://localhost:4173/#/elder/home\r\nnode server.mjs\r\npause\r\n')
with zipfile.ZipFile(target) as z:
    assert z.testzip() is None
    assert not any('/.git/' in n or '/artifacts/' in n for n in z.namelist())
    count = len(z.namelist())
digest = hashlib.sha256(target.read_bytes()).hexdigest()
(out/'安心药盒_场景A_提交包.sha256.txt').write_text(f'{digest}  {target.name}\n', encoding='utf-8')
print(f'{target}\n{count} files; {target.stat().st_size} bytes\nSHA256 {digest}')
