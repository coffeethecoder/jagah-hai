"""docs/TALK.md -> docs/TALK.docx, the printable copy of the talk script.

Usage:  python docs/talk_docx.py            (needs: pip install python-docx)

Handles only what TALK.md uses: headings, one table, > spoken lines, "Do:" actions, lists, **bold**, `code`, links.
"""
import pathlib
import re

from docx import Document
from docx.opc.constants import RELATIONSHIP_TYPE as RT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor

HERE = pathlib.Path(__file__).parent
SRC, OUT = HERE / 'TALK.md', HERE / 'TALK.docx'
NIGHT, BRAND, INK, INK2, MUTED = (RGBColor.from_string(h) for h in ('1D1030', '5B35C8', '1F1629', '4D4459', '6E6579'))
SERIF, SANS = 'Georgia', 'Arial'
PLAIN = {'', 'Plan', 'Before you start', 'For questions'}   # elsewhere, loose paragraphs are stage directions

doc = Document()
sec = doc.sections[0]
sec.page_width, sec.page_height = Cm(21), Cm(29.7)
sec.left_margin = sec.right_margin = Cm(2.4)
sec.top_margin = sec.bottom_margin = Cm(2.2)


def style(name, family, size, color, bold=None):
    f = doc.styles[name].font
    f.name, f.size, f.color.rgb = family, Pt(size), color
    doc.styles[name].element.rPr.rFonts.set(qn('w:eastAsia'), family)
    if bold is not None:
        f.bold = bold


style('Normal', SANS, 10.5, INK)
doc.styles['Normal'].paragraph_format.space_after = Pt(6)
doc.styles['Normal'].paragraph_format.line_spacing = 1.25
style('Title', SERIF, 30, NIGHT, bold=False)
style('Heading 1', SERIF, 20, NIGHT, bold=False)
style('Heading 2', SANS, 12.5, NIGHT, bold=True)
for name, before, after in (('Heading 1', 18, 8), ('Heading 2', 16, 6)):
    pf = doc.styles[name].paragraph_format
    pf.space_before, pf.space_after, pf.keep_with_next = Pt(before), Pt(after), True


def el(tag, **attrs):
    e = OxmlElement(tag)
    for k, v in attrs.items():
        e.set(qn('w:' + k), v)
    return e


def link(p, url):
    h = OxmlElement('w:hyperlink')
    h.set(qn('r:id'), doc.part.relate_to(url, RT.HYPERLINK, is_external=True))
    r, rpr, t = OxmlElement('w:r'), OxmlElement('w:rPr'), OxmlElement('w:t')
    rpr.append(el('w:color', val='5B35C8'))
    rpr.append(el('w:u', val='single'))
    t.text = url
    r.append(rpr)
    r.append(t)
    h.append(r)
    p._p.append(h)


def runs(p, text, size=None, family=None, color=None, italic=False):
    """Inline **bold**, `code` and bare URLs."""
    for part in re.split(r'(\*\*.+?\*\*|`.+?`|https?://\S+)', text):
        if not part:
            continue
        if part.startswith('http'):
            link(p, part)
            continue
        bold, code = part.startswith('**'), part.startswith('`')
        r = p.add_run(part[2:-2] if bold else part[1:-1] if code else part)
        r.bold = bold or None
        r.italic = italic or None
        if code:
            r.font.name, r.font.size = 'Menlo', Pt(9.5)
        else:
            if family:
                r.font.name = family
            if size:
                r.font.size = Pt(size)
        if color is not None:
            r.font.color.rgb = color


def small(p, text):
    r = p.add_run(text)
    r.font.size, r.font.color.rgb = Pt(9), MUTED
    return r


# Header, and "Page n" in the footer.
small(sec.header.paragraphs[0], "The Train Isn't Full: talk and demo script")
footer = sec.footer.paragraphs[0]
footer.alignment = 2
small(footer, 'Page ')
for kind in ('begin', None, 'end'):
    r = small(footer, '')
    if kind:
        r._r.append(el('w:fldChar', fldCharType=kind))
    else:
        t = OxmlElement('w:instrText')
        t.set(qn('xml:space'), 'preserve')
        t.text = 'PAGE'
        r._r.append(t)

lines = SRC.read_text(encoding='utf-8').split('\n')
section, i, first = '', 0, True
while i < len(lines):
    line = lines[i]
    if not line.strip():
        i += 1
    elif line.startswith('# '):
        doc.add_paragraph("The Train Isn't Full", style='Title')
        p = doc.add_paragraph()
        r = p.add_run(line[2:])
        r.font.size, r.font.color.rgb = Pt(14), BRAND
        p.paragraph_format.space_after = Pt(14)
        i += 1
    elif line.startswith('## '):
        section = line[3:]
        h = doc.add_heading(section, level=1)
        h.paragraph_format.page_break_before = section not in ('Plan', 'Before you start') and not first
        first = False
        i += 1
    elif line.startswith('### '):
        m = re.match(r'(.*?)(?: \((\d+:\d\d)\))?$', line[4:])
        p = doc.add_heading(m.group(1), level=2)
        if m.group(2):   # the time, in brand colour
            r = p.add_run('   ' + m.group(2))
            r.font.color.rgb, r.bold = BRAND, False
        i += 1
    elif line.startswith('|'):
        rows = []
        while i < len(lines) and lines[i].startswith('|'):
            if not re.match(r'^\|[-| ]+\|$', lines[i]):
                rows.append([c.strip() for c in lines[i].strip('|').split('|')])
            i += 1
        t = doc.add_table(rows=len(rows), cols=len(rows[0]))
        t.style, t.autofit = 'Table Grid', False
        for ri, row in enumerate(rows):
            for ci, text in enumerate(row):
                cell = t.cell(ri, ci)
                cell.width = Cm(13) if ci == 0 else Cm(3)
                p = cell.paragraphs[0]
                p.paragraph_format.space_before = p.paragraph_format.space_after = Pt(3)
                runs(p, f'**{text}**' if ri == 0 else text)
                if ri == 0:
                    cell._tc.get_or_add_tcPr().append(el('w:shd', val='clear', color='auto', fill='EEE8FB'))
        doc.add_paragraph()
    elif line.startswith('>'):
        # What you say: larger serif, with a violet rule on the left.
        while i < len(lines) and lines[i].startswith('>'):
            text = lines[i][1:].strip()
            if text:
                p = doc.add_paragraph()
                bdr = el('w:pBdr')
                bdr.append(el('w:left', val='single', sz='18', space='10', color='5B35C8'))
                p._p.get_or_add_pPr().append(bdr)
                runs(p, text, size=13, family=SERIF)
                pf = p.paragraph_format
                pf.left_indent, pf.space_after, pf.line_spacing = Cm(0.5), Pt(9), 1.35
            i += 1
    elif re.match(r'^\d+\. ', line):
        if section == 'Before you start':
            runs(doc.add_paragraph(style='List Number'), re.sub(r'^\d+\. ', '', line))
        else:   # keep the written number; Word's numbering would restart at 1 for each list anyway
            p = doc.add_paragraph()
            runs(p, line)
            p.paragraph_format.left_indent = Cm(0.6)
        i += 1
    elif re.match(r'^ +- ', line):
        p = doc.add_paragraph(style='List Bullet 2')
        runs(p, line.strip()[2:])
        p.paragraph_format.space_after = Pt(2)
        i += 1
    elif line.startswith('- '):
        m = re.match(r'- \*\*(.+?)\*\* (.*)', line)
        if m:   # a bold lead on its own line, then the rest
            p = doc.add_paragraph()
            r = p.add_run(m.group(1))
            r.bold, r.font.size = True, Pt(11.5)
            p.paragraph_format.space_after, p.paragraph_format.keep_with_next = Pt(2), True
            p = doc.add_paragraph()
            runs(p, m.group(2), size=11.5)
            p.paragraph_format.space_after = Pt(12)
        else:
            runs(doc.add_paragraph(style='List Bullet'), line[2:])
        i += 1
    else:
        text = line
        while i + 1 < len(lines) and lines[i + 1].strip() and not re.match(r'^(#|>|\||- |\d+\. | +- )', lines[i + 1]):
            i += 1
            text += ' ' + lines[i]
        p = doc.add_paragraph()
        if text.startswith('Do: '):   # what you click, in a shaded box
            p._p.get_or_add_pPr().append(el('w:shd', val='clear', color='auto', fill='EEE8FB'))
            r = p.add_run('DO  ')
            r.bold, r.font.color.rgb, r.font.size = True, BRAND, Pt(9.5)
            runs(p, text[4].upper() + text[5:], size=11)
            pf = p.paragraph_format
            pf.left_indent = pf.right_indent = Cm(0.2)
            pf.space_before, pf.space_after = Pt(6), Pt(8)
        elif section not in PLAIN:   # a stage direction
            runs(p, text, color=INK2, italic=True)
        else:
            runs(p, text)
        i += 1

doc.save(OUT)
print('wrote', OUT)
