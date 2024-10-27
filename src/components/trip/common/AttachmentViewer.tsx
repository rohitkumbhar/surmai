import {ContextModalProps} from "@mantine/modals";
import DocViewer, {JPGRenderer, PDFRenderer, PNGRenderer} from "react-doc-viewer";
import {pdfjs} from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'react-pdf/node_modules/pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

export const AttachmentViewer = ({context, id, innerProps}: ContextModalProps<{
  fileName: string,
  attachmentUrl: string
}>) => {
  const {attachmentUrl} = innerProps
  // return <p>View {`${fileName}`} Attachment at {`${attachmentUrl}`}</p>
  return <DocViewer pluginRenderers={[PDFRenderer, PNGRenderer, JPGRenderer]}
                    documents={[{uri: attachmentUrl}]}/>;
}