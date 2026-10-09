from pathlib import Path
import textwrap

src = Path('/vercel/share/v0-project/docs/engineering-handbook.md').read_text(encoding='utf-8')
out = Path('/vercel/share/v0-project/docs/engineering-handbook.pdf')

# Small dependency-free PDF writer for the repository handbook.
lines = []
for raw in src.splitlines():
    raw = raw.replace('`', '').replace('**', '').replace('*', '')
    if raw.startswith('# '):
        lines += ['', raw[2:].upper(), '']
    elif raw.startswith('## '):
        lines += ['', raw[3:], '']
    elif raw.startswith('### '):
        lines += ['', raw[4:], '']
    elif raw.startswith('```'):
        lines += ['', '[code block]', '']
    elif raw.startswith('|'):
        lines.append(raw.replace('|', ' | '))
    elif raw.startswith('> '):
        lines.append('NOTE: ' + raw[2:])
    elif raw.startswith('- '):
        lines.append('• ' + raw[2:])
    elif raw.startswith(tuple(f'{i}. ' for i in range(1, 10))):
        lines.append(raw)
    else:
        lines.append(raw)

wrapped = []
for line in lines:
    if not line:
        wrapped.append('')
    else:
        wrapped.extend(textwrap.wrap(line, width=96, break_long_words=False, break_on_hyphens=False) or [''])

pages = [wrapped[i:i+54] for i in range(0, len(wrapped), 54)] or [['SATCOM Engineering Handbook']]
objects = []
# PDF objects are assembled after page count is known.
font_obj = 3
page_objs = []
content_objs = []
for page_index, page in enumerate(pages):
    commands = ['BT', '/F1 9 Tf', '42 760 Td', '12 TL']
    for line in page:
        safe = line.replace('\\', '\\\\').replace('(', '\\(').replace(')', '\\)')
        if line.isupper() and len(line) < 90:
            commands += ['/F1 13 Tf', f'({safe}) Tj', '/F1 9 Tf', '0 -16 Td']
        else:
            commands += [f'({safe}) Tj', '0 -12 Td']
    commands += ['ET']
    content = '\n'.join(commands).encode('latin-1', 'replace')
    content_objs.append(content)

# Object numbering: catalog=1, pages=2, font=3, then content/page pairs.
next_obj = 4
for content in content_objs:
    content_no = next_obj; page_no = next_obj + 1; next_obj += 2
    content_objs[content_objs.index(content)] = (content_no, content)
    page_objs.append(page_no)

pdf = bytearray(b'%PDF-1.4\n%\xe2\xe3\xcf\xd3\n')
offsets = []

def add_obj(num, body):
    offsets.append(len(pdf))
    pdf.extend(f'{num} 0 obj\n'.encode())
    pdf.extend(body)
    pdf.extend(b'\nendobj\n')

add_obj(1, b'<< /Type /Catalog /Pages 2 0 R >>')
add_obj(2, ('<< /Type /Pages /Kids [' + ' '.join(f'{n} 0 R' for n in page_objs) + f'] /Count {len(page_objs)} >>').encode())
add_obj(3, b'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>')
for (content_no, content), page_no in zip(content_objs, page_objs):
    add_obj(content_no, f'<< /Length {len(content)} >>\nstream\n'.encode() + content + b'\nendstream')
    add_obj(page_no, f'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents {content_no} 0 R >>'.encode())

xref = len(pdf)
pdf.extend(f'xref\n0 {len(offsets)+1}\n0000000000 65535 f \n'.encode())
for off in offsets:
    pdf.extend(f'{off:010d} 00000 n \n'.encode())
pdf.extend(f'trailer\n<< /Size {len(offsets)+1} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF\n'.encode())
out.write_bytes(pdf)
print(f'Wrote {out} ({len(pdf)} bytes, {len(page_objs)} pages)')
