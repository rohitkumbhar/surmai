import {ContextModalProps} from "@mantine/modals";
import {Button, Container, Group, Space} from "@mantine/core";
import {PDFViewer} from "./PDFViewer.tsx";
import {IconDownload} from "@tabler/icons-react";
import {ImageViewer} from "./ImageViewer.tsx";


export const AttachmentViewer = ({innerProps}: ContextModalProps<{
  fileName: string,
  attachmentUrl: string

}>) => {
  const {fileName, attachmentUrl} = innerProps

  const extension = fileName.split('.').pop()?.toLowerCase()
  const isPdf = extension === "pdf"
  const isImage = extension && ["jpg", "jpeg", "png", "webp", "bmp"].includes(extension)

  return <Container>
    <Group><Button component={'a'} href={`${attachmentUrl}?download=1`} w={"auto"} download={fileName}
                   rightSection={<IconDownload size={14}/>}>Download</Button></Group>
    <Space h="md"/>
    <Group> {isPdf && <PDFViewer documentUrl={attachmentUrl}/>}
      {isImage && <ImageViewer imageUrl={attachmentUrl} imageName={fileName}/>}
      {!(isPdf || isImage) && <div> Unable to render this file</div>}</Group>
  </Container>
}