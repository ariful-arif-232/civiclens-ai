"""One-time, checksum-verified recovery of the original uploaded CivicLens source."""
import base64
import gzip
import hashlib
import io
import json
import pathlib
import shutil
import tarfile

BROKEN = 'bb354ff25011d8c28f825a72e1d24f1e3eca16c81f9e946f5a5106b8ce911964'
FIXED = '4f62672599126f8bbc2a717395413eb086a9ff1a58ed7ada72efd38dab388c50'
MANIFEST = '3b92613c13b27c0a236941fb55a6a61837c9f54cea70f13a709fb0b7882df24d'

def sha(data):
    return hashlib.sha256(data).hexdigest()

root = pathlib.Path.cwd().resolve()
if (root / 'package.json').exists():
    raise SystemExit('Application already exists. Refusing to repeat restore.')
parts = [root / '.bootstrap' / f'source{i:02d}' for i in range(14)]
encoded = b''.join(p.read_bytes()[:12000 if i < 13 else 9736] for i, p in enumerate(parts))
if len(encoded) != 165736:
    raise SystemExit('Unexpected source payload length; no changes made.')
data = bytearray(base64.b64decode(encoded, validate=True))
if sha(data) != BROKEN or data[75604] != 86:
    raise SystemExit('Unexpected source bytes; no changes made.')
# Precisely identified bit corruption. Reproduced by gzip -n -6 from the
# uploaded ZIP: only byte 75604 differs (0x56 -> 0x52).
data[75604] = 82
if sha(data) != FIXED:
    raise SystemExit('Corrected archive hash mismatch; no changes made.')
raw = gzip.decompress(bytes(data))
files = {}
with tarfile.open(fileobj=io.BytesIO(raw), mode='r:') as archive:
    for member in archive:
        if member.isdir():
            continue
        if not member.isfile():
            raise SystemExit('Unsupported non-regular archive entry.')
        path = pathlib.PurePosixPath(member.name)
        if path.is_absolute() or '..' in path.parts or '.git' in path.parts:
            raise SystemExit('Unsafe path in source archive.')
        name = str(path)
        if name in files:
            raise SystemExit('Duplicate source path.')
        if path.name.startswith('.env') and path.name != '.env.example':
            raise SystemExit('Environment secret files cannot be published.')
        files[name] = archive.extractfile(member).read()
manifest = ''.join(f'{sha(files[p])}  {p}\n' for p in sorted(files))
if len(files) != 76 or sha(manifest.encode()) != MANIFEST:
    raise SystemExit('Per-file hashes differ from original uploaded ZIP.')
json.loads(files['package-lock.json'])
# Refuse to overwrite user changes. CI is installed separately through the
# authorized connector instead of written using the Actions token.
selected = {p: v for p, v in files.items() if not p.startswith('.github/')}
for name, content in selected.items():
    dest = root / name
    if not dest.resolve().is_relative_to(root):
        raise SystemExit('Invalid source destination.')
    if dest.exists() and (not dest.is_file() or dest.read_bytes() != content):
        raise SystemExit('Existing changed file would be overwritten: ' + name)
for name, content in selected.items():
    dest = root / name
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(content)
    dest.chmod(0o644)
(root / 'docs' / 'SOURCE-RECOVERY.sha256').write_text(manifest)
(root / 'docs' / 'SOURCE-RECOVERY.md').write_text(
    '# Source recovery record\n\n'
    'The upload transport corrupted one compressed byte, causing a gzip CRC error. '
    'The byte was repaired by comparison with the original user-uploaded ZIP, '
    'not by bypassing archive validation. All 76 source-file SHA256 hashes matched '
    'the original ZIP before any files were restored.\n\n'
    'Original ZIP SHA256: e6c3ff18225698a56deb88e056d445754b6af5e1d854db6e058b683443b35e29\n\n'
    'Corrected gzip SHA256: ' + FIXED + '\n\n'
    'Original source manifest SHA256: ' + MANIFEST + '\n\n'
    'The existing GitHub commit history is retained without force-push. '
    'The earlier local development commits remain in civiclens-ai-history.bundle '
    'inside the original user ZIP; those commits have not been imported into '
    'this repository graph. No recreated commits are presented as originals.\n\n'
    'The source manifest describes the recovered baseline. Subsequent bug fixes '
    'are normal Git commits and are intentionally separate from that baseline.\n'
)
for name in ('.bootstrap', '.restore'):
    path = root / name
    if path.is_dir() and not path.is_symlink():
        shutil.rmtree(path)
print('PASS: gzip CRC, archive SHA256, and all 76 source checksums verified.')
print('Restored 75 source files; CI workflow installation is handled separately.')
