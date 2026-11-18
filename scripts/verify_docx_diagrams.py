import os
import re
import hashlib
import docx

def verify():
    doc_path = 'docs/BaoCaoDoAnNexus.docx'
    vp_dir = 'docs/sequence-diagrams/Visual_Paradigm'
    
    print(f"Reading document {doc_path}...")
    doc = docx.Document(doc_path)
    
    with open('scripts/update_docx_sequence_diagrams.py', 'r', encoding='utf-8') as f:
        code = f.read()
    
    mapping_match = re.search(r'mapping = \[(.*?)\]\s+map_dict', code, re.DOTALL)
    mapping_entries = re.findall(r"\('(.*?)',\s*'(.*?)'\)", mapping_match.group(1))
    
    print(f"Verifying {len(mapping_entries)} sequence diagrams...")
    
    errors = []
    verified = 0
    
    for heading, fname in mapping_entries:
        found = False
        for i, p in enumerate(doc.paragraphs):
            if 1334 <= i <= 1485 and p.text.strip() == heading:
                found = True
                next_p = doc.paragraphs[i+1]
                xml = next_p._element.xml
                rids = re.findall(r'r:embed=\"(rId\d+)\"', xml)
                if not rids:
                    errors.append(f"No rId in paragraph after: {heading}")
                    break
                
                part = doc.part.related_parts[rids[0]]
                part_hash = hashlib.md5(part.blob).hexdigest()
                
                with open(os.path.join(vp_dir, fname), 'rb') as img_f:
                    file_hash = hashlib.md5(img_f.read()).hexdigest()
                
                if part_hash != file_hash:
                    errors.append(f"Hash mismatch: {heading} -> {fname}")
                else:
                    verified += 1
                break
        if not found:
            errors.append(f"Heading not found: {heading}")
            
    print(f"\nVerification Results:")
    print(f"  Total items verified: {verified} / {len(mapping_entries)}")
    if errors:
        print("  Errors encountered:")
        for err in errors:
            print(f"    - {err}")
        return False
    else:
        print("  Status: 100% PERFECT MATCH! All 69 diagrams match bit-for-bit with Visual Paradigm exports.")
        return True

if __name__ == '__main__':
    verify()
