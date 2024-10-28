import {ContextModalProps} from "@mantine/modals";
import DocViewer, {JPGRenderer, PDFRenderer, PNGRenderer} from "react-doc-viewer";

import {pdfjs} from "react-pdf";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.mjs?url";

pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export const AttachmentViewer = ({innerProps}: ContextModalProps<{
  fileName: string,
  attachmentUrl: string

}>) => {
  const {attachmentUrl} = innerProps
  return <DocViewer pluginRenderers={[PDFRenderer, PNGRenderer, JPGRenderer]}
                    documents={[{uri: attachmentUrl}]}/>;
}