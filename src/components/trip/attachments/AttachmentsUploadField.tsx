import { Button, Group, Stack, Text } from '@mantine/core';
import { Dropzone, IMAGE_MIME_TYPE, PDF_MIME_TYPE } from '@mantine/dropzone';
import { modals } from '@mantine/modals';
import { useTranslation } from 'react-i18next';

export const AttachmentsUploadField = ({ files, setFiles }: { files: File[]; setFiles: (files: File[]) => void }) => {
  const { t } = useTranslation();
  return (
    <Stack>
      <Text component={'div'} size={'md'}>
        {t('attachments', 'Attachments')}
        <Text size={'xs'} c={'dimmed'}>
          {t('activity_attachments_desc', 'Upload any related documents e.g. confirmation email')}
        </Text>
      </Text>
      <Group>
        {files.map((file) => (
          <Text key={file.name} size={'sm'}>
            {file.name}
          </Text>
        ))}
      </Group>

      <Dropzone
        onDrop={setFiles}
        onReject={(rejectedFiles) => {
          modals.open({
            title: t('files_rejected', 'Rejected Files'),
            children: (
              <>
                {rejectedFiles.map((file, index) => (
                  <Text key={index} size={'sm'}>
                    {file.file.name}
                  </Text>
                ))}
                <Button fullWidth onClick={() => modals.closeAll()} mt="md">
                  {t('close', 'Close')}
                </Button>
              </>
            ),
          });
        }}
        maxSize={5 * 1024 ** 2}
        accept={[...IMAGE_MIME_TYPE, ...PDF_MIME_TYPE]}
        bd={'dashed 1px'}
      >
        <Group justify="center" mih={80} gap="xl" style={{ pointerEvents: 'none' }}>
          <div>
            <Text size={'sm'} inline>
              {t('drag_select_attachments', 'Drag attachments here or click to select files')}
            </Text>
          </div>
        </Group>
      </Dropzone>
    </Stack>
  );
};
