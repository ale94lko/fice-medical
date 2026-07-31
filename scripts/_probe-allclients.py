from pathlib import Path
import re

p = Path(
  r'C:\Users\leofl\.cursor\projects\d-LANDA-GITHUB-fice-medical'
  r'\agent-transcripts\550062af-9380-4165-9493-1b82eb1b0306'
  r'\550062af-9380-4165-9493-1b82eb1b0306.jsonl'
)
text = p.read_text(encoding='utf-8', errors='ignore')
for m in re.finditer(r'.{0,80}allclients.{0,80}', text, flags=re.I):
  print(m.group(0).replace('\\n', ' ')[:200])
  print('---')
