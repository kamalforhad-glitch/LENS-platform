const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function createBmpDib(svgBuf, width, height) {
  const { data } = await sharp(svgBuf)
    .resize(width, height)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const andRowBytes = Math.ceil(width / 32) * 4;
  const andMaskSize = andRowBytes * height;
  const xorSize = width * height * 4;
  const dibSize = 40 + xorSize + andMaskSize;

  const dib = Buffer.alloc(dibSize);

  // BITMAPINFOHEADER (40 bytes)
  dib.writeUInt32LE(40, 0); // biSize
  dib.writeInt32LE(width, 4); // biWidth
  dib.writeInt32LE(height * 2, 8); // biHeight (doubled for XOR + AND masks)
  dib.writeUInt16LE(1, 12); // biPlanes
  dib.writeUInt16LE(32, 14); // biBitCount (32-bit BGRA)
  dib.writeUInt32LE(0, 16); // biCompression (BI_RGB)
  dib.writeUInt32LE(xorSize + andMaskSize, 20); // biSizeImage
  dib.writeInt32LE(0, 24); // biXPelsPerMeter
  dib.writeInt32LE(0, 28); // biYPelsPerMeter
  dib.writeUInt32LE(0, 32); // biClrUsed
  dib.writeUInt32LE(0, 36); // biClrImportant

  // XOR mask (bottom-up BGRA)
  let xorOffset = 40;
  for (let y = height - 1; y >= 0; y--) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3];

      dib[xorOffset] = b;
      dib[xorOffset + 1] = g;
      dib[xorOffset + 2] = r;
      dib[xorOffset + 3] = a;
      xorOffset += 4;
    }
  }

  // AND mask (bottom-up 1-bit per pixel: 1 = transparent, 0 = opaque)
  let andOffset = 40 + xorSize;
  for (let y = height - 1; y >= 0; y--) {
    const rowBuf = Buffer.alloc(andRowBytes);
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const a = data[idx + 3];
      if (a < 128) {
        const bytePos = Math.floor(x / 8);
        const bitPos = 7 - (x % 8);
        rowBuf[bytePos] |= (1 << bitPos);
      }
    }
    rowBuf.copy(dib, andOffset);
    andOffset += andRowBytes;
  }

  return dib;
}

async function generateFavicon() {
  const svgPath = path.join(__dirname, '..', 'public', 'favicon.svg');
  const icoPath = path.join(__dirname, '..', 'public', 'favicon.ico');
  const svgBuf = fs.readFileSync(svgPath);

  const sizes = [16, 32, 48];
  const images = [];

  for (const s of sizes) {
    const dib = await createBmpDib(svgBuf, s, s);
    images.push({ width: s, height: s, buffer: dib });
  }

  const headerSize = 6;
  const dirEntrySize = 16;
  let offset = headerSize + sizes.length * dirEntrySize;
  const entries = [];

  for (const img of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(img.width >= 256 ? 0 : img.width, 0);
    entry.writeUInt8(img.height >= 256 ? 0 : img.height, 1);
    entry.writeUInt8(0, 2); // colors
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // planes
    entry.writeUInt16LE(32, 6); // bpp
    entry.writeUInt32LE(img.buffer.length, 8); // size
    entry.writeUInt32LE(offset, 12); // offset
    entries.push(entry);
    offset += img.buffer.length;
  }

  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // ICO type 1
  header.writeUInt16LE(sizes.length, 4);

  const icoBuf = Buffer.concat([header, ...entries, ...images.map(i => i.buffer)]);
  fs.writeFileSync(icoPath, icoBuf);
  console.log(`Successfully generated ${icoPath} (${icoBuf.length} bytes, sizes: ${sizes.join(', ')})`);
}

generateFavicon().catch(err => {
  console.error(err);
  process.exit(1);
});
