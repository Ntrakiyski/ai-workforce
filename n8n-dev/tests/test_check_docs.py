"""Offline tests of document consistency checks; not n8n runtime tests."""
import json
import tempfile
import unittest
from pathlib import Path

import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from check_docs import check_repository


class CheckDocsTests(unittest.TestCase):
    def setup_repo(self, root: Path) -> None:
        (root / 'research').mkdir()
        (root / 'research' / 'evidence-index.json').write_text(json.dumps({
            'research_baseline': {'version': '2.47.7', 'commit': 'd' * 40, 'runtime_tested': False},
            'findings': [{'id': 'E-001', 'status': 'VERIFIED_SOURCE', 'url': 'https://example.com/source'}]
        }), encoding='utf-8')
        (root / 'README.md').write_text('# Root\n[ok](research/evidence-index.json)\n', encoding='utf-8')

    def test_valid_links_and_evidence(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            self.setup_repo(root)
            self.assertEqual([], check_repository(root, Path('research') / 'evidence-index.json'))

    def test_rejects_broken_link(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            self.setup_repo(root)
            (root / 'README.md').write_text('[broken](missing.md)\n', encoding='utf-8')
            self.assertTrue(any('broken local link' in x for x in check_repository(root, Path('research') / 'evidence-index.json')))

    def test_rejects_duplicate_evidence_ids(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            self.setup_repo(root)
            index = root / 'research' / 'evidence-index.json'
            data = json.loads(index.read_text(encoding='utf-8'))
            data['findings'].append(dict(data['findings'][0]))
            index.write_text(json.dumps(data), encoding='utf-8')
            self.assertTrue(any('Duplicate' in x for x in check_repository(root, Path('research') / 'evidence-index.json')))


if __name__ == '__main__':
    unittest.main()
