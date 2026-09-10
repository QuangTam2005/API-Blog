import { existsSync, statSync, readFileSync } from 'node:fs';

const files = [
  'public/assets/img/preview-home.webp',
  'public/assets/img/preview-archive.webp',
  'public/assets/img/preview-java-spring.webp',
  'public/assets/img/preview-api.webp',
];

for (const file of files) {
  if (!existsSync(file)) throw new Error(`Thiếu ảnh preview: ${file}`);
  const buffer = readFileSync(file);
  if (buffer.subarray(0, 4).toString() !== 'RIFF' || buffer.subarray(8, 12).toString() !== 'WEBP') {
    throw new Error(`Ảnh không phải WebP hợp lệ: ${file}`);
  }
  const bytes = statSync(file).size;
  if (bytes >= 300 * 1024) throw new Error(`Ảnh preview vượt 300 KB: ${file}`);
  console.log(`${file}: ${bytes} bytes, WebP`);
}
