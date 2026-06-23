import piexif from "piexifjs";

export function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export async function writeExifToJpeg(exportedBlob: Blob, sourceFile: File) {
  if (!sourceFile.type.includes("jpeg") && !sourceFile.name.match(/\.jpe?g$/i)) {
    return exportedBlob;
  }

  try {
    const [exportedDataUrl, sourceDataUrl] = await Promise.all([
      blobToDataUrl(exportedBlob),
      blobToDataUrl(sourceFile),
    ]);
    const exif = piexif.dump(piexif.load(sourceDataUrl));
    const inserted = piexif.insert(exif, exportedDataUrl);
    return await (await fetch(inserted)).blob();
  } catch {
    return exportedBlob;
  }
}
