import { useEffect, useState } from 'react';
import DOMPurify from 'dompurify';
import { getHtmlFile } from '../../../lib/api';

export const HtmlViewer = ({ url }: { url: string }) => {
  const [htmlContents, setHtmlContents] = useState<string>();

  useEffect(() => {
    getHtmlFile(url).then((text) => {
      setHtmlContents(DOMPurify.sanitize(text));
    });
  }, [url]);

  return <div dangerouslySetInnerHTML={{ __html: htmlContents as string }} />;
};
