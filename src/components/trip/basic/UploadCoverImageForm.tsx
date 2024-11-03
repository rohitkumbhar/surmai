import { useRef, useState } from 'react';
import {
  Button,
  Center,
  Group,
  rem,
  Stack,
  Stepper,
  Text,
  useMantineTheme,
} from '@mantine/core';
import { Dropzone, MIME_TYPES } from '@mantine/dropzone';
import { IconCloudUpload, IconDownload, IconX } from '@tabler/icons-react';
import classes from './UploadCoverImageForm.module.css';
import { ContextModalProps } from '@mantine/modals';
import { CroppedImage, Trip } from '../../../types/trips.ts';
import { useTranslation } from 'react-i18next';
import { uploadTripCoverImage } from '../../../lib';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from './util.ts';

const CoverImageDropZone = ({
  setUploadedFile,
}: {
  setUploadedFile: (val: File) => void;
}) => {
  const theme = useMantineTheme();
  const openRef = useRef<() => void>(null);
  const { t } = useTranslation();

  return (
    <div className={classes.wrapper}>
      <Dropzone
        multiple={false}
        openRef={openRef}
        onDrop={(val: File[]) => {
          setUploadedFile(val[0]);
        }}
        className={classes.dropzone}
        radius="md"
        accept={[MIME_TYPES.jpeg, MIME_TYPES.png, MIME_TYPES.webp]}
        maxSize={30 * 1024 ** 2}
      >
        <div style={{ pointerEvents: 'none' }}>
          <Group justify="center">
            <Dropzone.Accept>
              <IconDownload
                style={{ width: rem(50), height: rem(50) }}
                color={theme.colors.blue[6]}
                stroke={1.5}
              />
            </Dropzone.Accept>
            <Dropzone.Reject>
              <IconX
                style={{ width: rem(50), height: rem(50) }}
                color={theme.colors.red[6]}
                stroke={1.5}
              />
            </Dropzone.Reject>
            <Dropzone.Idle>
              <IconCloudUpload
                style={{ width: rem(50), height: rem(50) }}
                stroke={1.5}
              />
            </Dropzone.Idle>
          </Group>

          <Text ta="center" fw={700} fz="lg" mt="xl">
            <Dropzone.Accept>
              {t('basic.drop_files_here', 'Drop files here')}
            </Dropzone.Accept>
            <Dropzone.Reject>
              {t('basic.cover_image_limit', 'Image file less than 30mb')}
            </Dropzone.Reject>
            <Dropzone.Idle>
              {t('basic.upload-cover_image', 'Upload Cover Image')}
            </Dropzone.Idle>
          </Text>
          <Text ta="center" fz="sm" mt="xs" c="dimmed">
            {t(
              'basic.upload_cover_image',
              'Drag and drop an image in this area'
            )}
          </Text>
        </div>
      </Dropzone>

      <Button
        className={classes.control}
        size="md"
        radius="xl"
        onClick={() => openRef.current?.()}
      >
        {t('basic.select_cover_image', 'Upload Cover Image')}
      </Button>
    </div>
  );
};

const CropModal = ({
  file,
  onCropComplete,
}: {
  file: File;
  onCropComplete: (val: CroppedImage, val2: CroppedImage) => void;
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  return (
    <div style={{ height: '20rem', position: 'relative' }}>
      <Cropper
        image={URL.createObjectURL(file)}
        crop={crop}
        aspect={1920 / 400}
        onCropChange={setCrop}
        zoomWithScroll={true}
        onCropComplete={onCropComplete}
      />
    </div>
  );
};

export const UploadCoverImageForm = ({
  context,
  id,
  innerProps,
}: ContextModalProps<{
  trip: Trip;
  refetch: () => void;
}>) => {
  const [uploadedFile, setUploadedFile] = useState<File | undefined>();
  const [croppedAreaPixels, setCroppedAreaPixels] =
    useState<CroppedImage | null>(null);

  const { trip, refetch } = innerProps;
  const [active, setActive] = useState(0);
  const nextStep = () =>
    setActive((current) => (current < 2 ? current + 1 : current));

  const uploadCoverImage = (uploadedImage: File | Blob) => {
    uploadTripCoverImage(trip.id, uploadedImage).then(() => {
      refetch();
      context.closeModal(id);
    });
  };

  const completeUpload = () => {
    if (uploadedFile && croppedAreaPixels) {
      getCroppedImg(URL.createObjectURL(uploadedFile), croppedAreaPixels).then(
        (file) => {
          uploadCoverImage(file as File);
        }
      );
    }
  };

  const onCropComplete = (
    _croppedArea: CroppedImage,
    croppedAreaPixels: CroppedImage
  ) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  return (
    <Stack>
      <Stepper
        active={active}
        onStepClick={setActive}
        allowNextStepsSelect={false}
      >
        <Stepper.Step
          label="Upload Cover Image"
          description="Upload a cover image for your trip"
        >
          <CoverImageDropZone
            setUploadedFile={(file) => {
              setUploadedFile(file);
              nextStep();
            }}
          />
        </Stepper.Step>
        <Stepper.Step
          label="Crop Image"
          description="Crop yourt cover image show it shows up nicely on all pages"
        >
          {uploadedFile && (
            <CropModal file={uploadedFile} onCropComplete={onCropComplete} />
          )}
          <Center>
            <Button
              w={'fit-content'}
              mt={'sm'}
              mb={'sm'}
              onClick={completeUpload}
            >
              Done
            </Button>
          </Center>
        </Stepper.Step>
        <Stepper.Completed>
          Completed, click back button to get to previous step
        </Stepper.Completed>
      </Stepper>
    </Stack>
  );
};
