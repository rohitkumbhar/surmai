import { Button, Container, Group, Space } from '@mantine/core';
import { IconDownload } from '@tabler/icons-react';

import { HtmlViewer } from './HtmlViewer.tsx';
import { ImageViewer } from './ImageViewer.tsx';
import { PDFViewer } from './PDFViewer.tsx';

import type { ContextModalProps } from '@mantine/modals';

export const AttachmentViewer = ({
  innerProps,
}: ContextModalProps<{
  fileName: string;
  attachmentUrl: string;
}>) => {
  const { fileName, attachmentUrl } = innerProps;

  const extension = fileName.split('.').pop()?.toLowerCase();
  const isPdf = extension === 'pdf';
  const isImage = extension && ['jpg', 'jpeg', 'png', 'webp', 'bmp'].includes(extension);
  const isHtml = extension && ['html', 'htm'].includes(extension);
  return (
    <Container>
      <Group>
        <Button
          component={'a'}
          href={`${attachmentUrl}?download=1`}
          w={'auto'}
          download={fileName}
          rightSection={<IconDownload size={14} />}
        >
          Download
        </Button>
      </Group>
      <Space h="md" />
      <Group>
        {' '}
        {isPdf && <PDFViewer documentUrl={attachmentUrl} />}
        {isImage && <ImageViewer imageUrl={attachmentUrl} imageName={fileName} />}
        {isHtml && <HtmlViewer url={attachmentUrl} />}
        {!(isPdf || isImage) && <div> Unable to render this file</div>}
      </Group>
    </Container>
  );
};
