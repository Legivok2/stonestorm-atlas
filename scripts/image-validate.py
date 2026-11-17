"""Verify staging raster bytes and create a preview; never modify source art."""
import hashlib
import json
import sys
import warnings
from pathlib import Path
from PIL import Image

Image.MAX_IMAGE_PIXELS = 40_000_000
warnings.simplefilter('error', Image.DecompressionBombWarning)
source = Path(sys.argv[1])
try:
    if source.stat().st_size > 12 * 1024 * 1024:
        raise ValueError('Image exceeds 12 MiB')
    with Image.open(source) as image:
        fmt = image.format
        image.verify()
    if fmt not in ('WEBP', 'PNG', 'JPEG', 'GIF', 'AVIF'):
        raise ValueError('Unsupported raster format')
    with Image.open(source) as image:
        image.load()
        width, height = image.size
        if width < 1 or height < 1 or width * height > 40_000_000:
            raise ValueError('Invalid image dimensions')
        if len(sys.argv) > 2:
            preview = Path(sys.argv[2])
            preview.parent.mkdir(parents=True, exist_ok=True)
            thumb = image.convert('RGBA')
            thumb.thumbnail((480, 360))
            thumb.save(preview, 'WEBP', quality=78, method=3)
    print(json.dumps({'valid': True, 'format': fmt, 'width': width, 'height': height,
                      'bytes': source.stat().st_size,
                      'sha256': hashlib.sha256(source.read_bytes()).hexdigest()}))
except Exception as error:
    print(json.dumps({'valid': False, 'error': type(error).__name__ + ': ' + str(error)}))
    sys.exit(1)
