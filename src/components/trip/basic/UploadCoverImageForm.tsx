import {useRef} from 'react';
import {Button, Group, rem, Text, useMantineTheme} from '@mantine/core';
import {Dropzone, MIME_TYPES} from '@mantine/dropzone';
import {IconCloudUpload, IconDownload, IconX} from '@tabler/icons-react';
import classes from './UploadCoverImageForm.module.css';
import {ContextModalProps} from "@mantine/modals";
import {Trip} from "../../../types/trips.ts";

export const UploadCoverImageForm = ({context, id, innerProps}: ContextModalProps<{
  trip: Trip,
  refetch: () => void
}>) => {


  const {trip , refetch } = innerProps;
  const theme = useMantineTheme();
  const openRef = useRef<() => void>(null);

  return (
    <div className={classes.wrapper}>
      <Dropzone
        openRef={openRef}
        onDrop={() => {
        }}
        className={classes.dropzone}
        radius="md"
        accept={[MIME_TYPES.pdf]}
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
            <Dropzone.Accept>Drop files here</Dropzone.Accept>
            <Dropzone.Reject>Pdf file less than 30mb</Dropzone.Reject>
            <Dropzone.Idle>Upload resume</Dropzone.Idle>
          </Text>
          <Text ta="center" fz="sm" mt="xs" c="dimmed">
            Drag&apos;n&apos;drop files here to upload. We can accept only <i>.pdf</i> files that
            are less than 30mb in size.
          </Text>
        </div>
      </Dropzone>

      <Button className={classes.control} size="md" radius="xl" onClick={() => openRef.current?.()}>
        Select files
      </Button>
    </div>
  );
}