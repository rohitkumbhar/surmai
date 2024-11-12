import { useState } from 'react';
import { Button, Center, Stack, Stepper } from '@mantine/core';
import { ContextModalProps } from '@mantine/modals';
import { CroppedImage } from '../../types/trips.ts';
import { getCroppedImg } from './util.ts';
import { ImageDropZone } from './ImageDropZone.tsx';
import { CropModal } from './CropModal.tsx';

export const UploadImageForm = ({
  context,
  id,
  innerProps,
}: ContextModalProps<{
  aspectRatio: number;
  saveUploadedImage: (image: File | Blob) => void;
}>) => {
  const [uploadedFile, setUploadedFile] = useState<File | undefined>();
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CroppedImage | null>(null);

  const { aspectRatio, saveUploadedImage } = innerProps;
  const [active, setActive] = useState(0);
  const nextStep = () => setActive((current) => (current < 2 ? current + 1 : current));

  const completeUpload = () => {
    if (uploadedFile && croppedAreaPixels) {
      getCroppedImg(URL.createObjectURL(uploadedFile), croppedAreaPixels).then((file) => {
        saveUploadedImage(file as File);
        context.closeModal(id);
      });
    }
  };

  const onCropComplete = (_croppedArea: CroppedImage, croppedAreaPixels: CroppedImage) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  return (
    <Stack>
      <Stepper active={active} onStepClick={setActive} allowNextStepsSelect={false}>
        <Stepper.Step label="Upload Image">
          <ImageDropZone
            setUploadedFile={(file) => {
              setUploadedFile(file);
              nextStep();
            }}
          />
        </Stepper.Step>
        <Stepper.Step label="Crop Image">
          {uploadedFile && <CropModal file={uploadedFile} onCropComplete={onCropComplete} aspectRatio={aspectRatio} />}
          <Center>
            <Button w={'fit-content'} mt={'sm'} mb={'sm'} onClick={completeUpload}>
              Done
            </Button>
          </Center>
        </Stepper.Step>
        <Stepper.Completed>Completed, click back button to get to previous step</Stepper.Completed>
      </Stepper>
    </Stack>
  );
};
