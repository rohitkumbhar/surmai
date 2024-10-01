import {useRef} from 'react';
import {Button, Group, rem, Text, useMantineTheme} from '@mantine/core';
import {Dropzone, MIME_TYPES} from '@mantine/dropzone';
import {IconCloudUpload, IconDownload, IconX} from '@tabler/icons-react';
import classes from './UploadCoverImageForm.module.css';
import {ContextModalProps} from "@mantine/modals";
import {Trip} from "../../../types/trips.ts";
import {useTranslation} from "react-i18next";
import {uploadTripCoverImage} from "../../../lib";

export const UploadCoverImageForm = ({context, id, innerProps}: ContextModalProps<{
  trip: Trip,
  refetch: () => void
}>) => {


  const {t} = useTranslation()
  const {trip, refetch} = innerProps;
  const theme = useMantineTheme();
  const openRef = useRef<() => void>(null);

  return (
    <div className={classes.wrapper}>
      <Dropzone
        multiple={false}
        openRef={openRef}
        onDrop={(val: File[]) => {
          uploadTripCoverImage(trip.id, val[0]).then(() => {
            refetch()
            context.closeModal(id)
          })
        }}
        className={classes.dropzone}
        radius="md"
        accept={[MIME_TYPES.jpeg, MIME_TYPES.png, MIME_TYPES.webp]}
        maxSize={30 * 1024 ** 2}
      >
        <div style={{pointerEvents: 'none'}}>
          <Group justify="center">
            <Dropzone.Accept>
              <IconDownload
                style={{width: rem(50), height: rem(50)}}
                color={theme.colors.blue[6]}
                stroke={1.5}
              />
            </Dropzone.Accept>
            <Dropzone.Reject>
              <IconX
                style={{width: rem(50), height: rem(50)}}
                color={theme.colors.red[6]}
                stroke={1.5}
              />
            </Dropzone.Reject>
            <Dropzone.Idle>
              <IconCloudUpload style={{width: rem(50), height: rem(50)}} stroke={1.5}/>
            </Dropzone.Idle>
          </Group>

          <Text ta="center" fw={700} fz="lg" mt="xl">
            <Dropzone.Accept>{t('basic.drop_files_here', 'Drop files here')}</Dropzone.Accept>
            <Dropzone.Reject>{t('basic.cover_image_limit', 'Image file less than 30mb')}</Dropzone.Reject>
            <Dropzone.Idle>{t('basic.upload-cover_image', 'Upload Cover Image')}</Dropzone.Idle>
          </Text>
          <Text ta="center" fz="sm" mt="xs" c="dimmed">
            {t('basic.upload_cover_image', 'Drag and drop an image in this area')}
          </Text>
        </div>
      </Dropzone>

      <Button className={classes.control} size="md" radius="xl" onClick={() => openRef.current?.()}>
        {t('basic.select_cover_image', 'Upload Cover Image')}
      </Button>
    </div>
  );
}