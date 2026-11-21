/**
 * 의뢰 이미지 클라이언트 압축 (브라우저 전용)
 * - 긴 변 maxSide px 로 축소 후 JPEG 로 재인코딩 → data URL
 * - 서버 허용 한도(약 450KB data URL)를 넘지 않도록 품질을 단계적으로 낮춤
 * - 재인코딩 과정에서 EXIF(위치정보 등) 메타데이터가 제거되는 효과도 있음
 */

const MAX_DATA_URL_LENGTH = 440_000;
const MAX_FILE_BYTES = 15 * 1024 * 1024;
const ACCEPTED = /^image\/(png|jpeg|webp)$/;

export const ACCEPTED_IMAGE_TYPES = 'image/png,image/jpeg,image/webp';

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('이미지를 읽을 수 없습니다.'));
    img.src = src;
  });
}

export async function compressImage(file: File, maxSide = 900): Promise<string> {
  if (!ACCEPTED.test(file.type)) throw new Error('PNG / JPEG / WEBP 이미지만 올릴 수 있습니다.');
  if (file.size > MAX_FILE_BYTES) throw new Error('15MB 이하 이미지만 올릴 수 있습니다.');

  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('이미지 처리를 지원하지 않는 브라우저입니다.');
    ctx.fillStyle = '#ffffff'; // 투명 배경 → 흰색 (JPEG)
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);

    for (let quality = 0.85; quality >= 0.45; quality -= 0.1) {
      const data = canvas.toDataURL('image/jpeg', quality);
      if (data.length <= MAX_DATA_URL_LENGTH) return data;
    }
    throw new Error('이미지가 너무 복잡해 용량을 줄이지 못했습니다. 더 작은 이미지를 사용해 주세요.');
  } finally {
    URL.revokeObjectURL(url);
  }
}
