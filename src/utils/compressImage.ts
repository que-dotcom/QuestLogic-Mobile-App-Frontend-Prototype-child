import * as ImageManipulator from 'expo-image-manipulator';

/** 送信可能な最大バイト数（4MB） */
const MAX_BYTES = 4 * 1024 * 1024;

/** リサイズ後の長辺最大画素数 */
const MAX_DIMENSION = 2048;

/**
 * 画像 URI を受け取り、4MB 以下に圧縮した JPEG の URI を返す。
 *
 * 手順:
 * 1. 長辺を MAX_DIMENSION (2048px) 以内にリサイズ
 * 2. quality=0.8 から開始し、0.1 刻みで下げながら 4MB 以下になるまでリトライ
 * 3. quality=0.1 でもサイズ超過の場合はその URI をそのまま返す（送信を試みる）
 */
export async function compressImage(uri: string): Promise<string> {
  const qualities = [0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1];

  for (const quality of qualities) {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: MAX_DIMENSION } }],
      { compress: quality, format: ImageManipulator.SaveFormat.JPEG }
    );

    const size = await getFileSize(result.uri);

    if (size === null || size <= MAX_BYTES) {
      return result.uri;
    }
  }

  // 全 quality 試行後もサイズ超過の場合は最低 quality の結果を返す
  const fallback = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: MAX_DIMENSION } }],
    { compress: 0.1, format: ImageManipulator.SaveFormat.JPEG }
  );
  return fallback.uri;
}

/**
 * URI のファイルサイズをバイト単位で取得する。
 * fetch → blob が使えない環境では null を返し、圧縮済みとして扱う。
 */
async function getFileSize(uri: string): Promise<number | null> {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    return blob.size;
  } catch {
    return null;
  }
}
