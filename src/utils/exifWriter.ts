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
    const sourceExif = piexif.load(sourceDataUrl);

    // Canvas exports pixels in display orientation, so keep metadata but reset orientation
    // to avoid image viewers rotating the exported JPEG a second time.
    sourceExif["0th"] = sourceExif["0th"] || {};
    sourceExif["0th"][piexif.ImageIFD.Orientation] = 1;
    if (sourceExif["1st"]) {
      sourceExif["1st"][piexif.ImageIFD.Orientation] = 1;
    }

    const exif = piexif.dump(sourceExif);
    const inserted = piexif.insert(exif, exportedDataUrl);
    return await (await fetch(inserted)).blob();
  } catch {
    return exportedBlob;
  }
}
