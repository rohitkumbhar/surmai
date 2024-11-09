import { CroppedImage } from '../../types/trips.ts';
import { useState } from 'react';
import Cropper from 'react-easy-crop';

export const CropModal = ({
                            file,
                            aspectRatio,
                            onCropComplete,
                          }: {
  file: File;
  aspectRatio: number,
  onCropComplete: (val: CroppedImage, val2: CroppedImage) => void;
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  return (
    <div style={{ height: '20rem', position: 'relative' }}>
      <Cropper
        image={URL.createObjectURL(file)}
        crop={crop}
        aspect={aspectRatio}
        onCropChange={setCrop}
        zoomWithScroll={true}
        onCropComplete={onCropComplete}
      />
    </div>
  );
};