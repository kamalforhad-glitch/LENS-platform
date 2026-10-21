const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function createBmpDib(sourcePngBuf, width, height) {
  const { data } = await sharp(sourcePngBuf)
    .resize(width, height)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const andRowBytes = Math.ceil(width / 32) * 4;
  const andMaskSize = andRowBytes * height;
  const xorSize = width * height * 4;
  const dibSize = 40 + xorSize + andMaskSize;

  const dib = Buffer.alloc(dibSize);

  dib.writeUInt32LE(40, 0); // biSize
  dib.writeInt32LE(width, 4); // biWidth
  dib.writeInt32LE(height * 2, 8); // biHeight (doubled)
  dib.writeUInt16LE(1, 12); // biPlanes
  dib.writeUInt16LE(32, 14); // biBitCount
  dib.writeUInt32LE(0, 16); // biCompression
  dib.writeUInt32LE(xorSize + andMaskSize, 20); // biSizeImage
  dib.writeInt32LE(0, 24);
  dib.writeInt32LE(0, 28);
  dib.writeUInt32LE(0, 32);
  dib.writeUInt32LE(0, 36);

  let xorOffset = 40;
  for (let y = height - 1; y >= 0; y--) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      dib[xorOffset] = data[idx + 2];     // B
      dib[xorOffset + 1] = data[idx + 1]; // G
      dib[xorOffset + 2] = data[idx];     // R
      dib[xorOffset + 3] = data[idx + 3]; // A
      xorOffset += 4;
    }
  }

  let andOffset = 40 + xorSize;
  for (let y = height - 1; y >= 0; y--) {
    const rowBuf = Buffer.alloc(andRowBytes);
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      if (data[idx + 3] < 128) {
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
  const rootDir = path.resolve(__dirname, '..');
  const sourceLogoPath = path.join(rootDir, 'public/images/logo/lens-logo.png');
  const icoPath = path.join(rootDir, 'public/favicon.ico');

  // Load and trim official wordmark
  const trimmed = await sharp(sourceLogoPath).trim().toBuffer({ resolveWithObject: true });
  const logoW = 450;
  const logoH = Math.round(logoW * (trimmed.info.height / trimmed.info.width));
  const resizedLogoBuf = await sharp(trimmed.data).resize(logoW, logoH).toBuffer();

  const brandMark512 = await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 10, g: 22, b: 40, alpha: 1 } // #0a1628
    }
  })
  .composite([{ input: resizedLogoBuf, top: Math.round((512 - logoH) / 2), left: Math.round((512 - logoW) / 2) }])
  .png()
  .toBuffer();

  const sizes = [16, 32, 48];
  const images = [];

  for (const s of sizes) {
    const dib = await createBmpDib(brandMark512, s, s);
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
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(img.buffer.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    offset += img.buffer.length;
  }

  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(sizes.length, 4);

  const icoBuf = Buffer.concat([header, ...entries, ...images.map(i => i.buffer)]);
  fs.writeFileSync(icoPath, icoBuf);
  console.log(`Successfully generated ${icoPath} (${icoBuf.length} bytes, sizes: ${sizes.join(', ')})`);
}

generateFavicon().catch(err => {
  console.error(err);
  process.exit(1);
});
