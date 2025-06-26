import { Size } from 'cc';

export class FitToBox2D {
  /**
   * Adjusts the dimensions of an image to fit within a reference box while maintaining the aspect ratio.
   *
   * @param imageSize - The original size of the image.
   * @param sizeReference - The size of the reference box to fit the image into.
   * @returns A new `Size` object with the adjusted dimensions that fit within the reference box.
   */
  public static fitToBox2D(imageSize: Size, sizeReference: Size): Size {
    if (imageSize.width > imageSize.height) {
      const scale = sizeReference.width / imageSize.width;
      return new Size(
        sizeReference.width,
        imageSize.height * scale
      );
    } else {
      const scale = sizeReference.height / imageSize.height;
      return new Size(
        imageSize.width * scale,
        sizeReference.height,
      );
    }
  }
}


