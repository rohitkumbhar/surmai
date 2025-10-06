import { Stack } from '@mantine/core';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

import styles from './PDFViewer.module.css';

pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export const PDFViewer = ({ documentUrl }: { documentUrl: string }) => {
  const [numPages, setNumPages] = useState<number>();
  function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
    setNumPages(numPages);
  }

  return (
    <div>
      <Document
        file={documentUrl}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={(error) => {
          console.log('load error', error);
        }}
        className={styles.fitContainer}
      >
        <Stack gap={'xs'}>
          {Array.from(new Array(numPages), (_el, index) => (
            <Page
              scale={1.0}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              key={`page_${index + 1}`}
              pageNumber={index + 1}
            />
          ))}
        </Stack>
      </Document>
    </div>
  );
};
