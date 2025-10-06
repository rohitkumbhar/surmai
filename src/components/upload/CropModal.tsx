import { useState } from 'react';
import Cropper from 'react-easy-crop';

import type { CroppedImage } from '../../types/trips.ts';

export const CropModal = ({
  file,
  aspectRatio,
  onCropComplete,
}: {
  file: File;
  aspectRatio: number;
  onCropComplete: (val: CroppedImage, val2: CroppedImage) => void;
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  return (
    <div style={{ height: '20rem', position: 'relative' }}>
      <Cropper
        image={URL.createObjectURL(file)}
        crop={crop}
        zoom={zoom}
        aspect={aspectRatio}
        onCropChange={setCrop}
        onZoomChange={setZoom}
        zoomWithScroll={true}
        onCropComplete={onCropComplete}
        showGrid={true}
        cropShape={'rect'}
      />
    </div>
  );
};
