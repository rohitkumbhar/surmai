import { ContextModalProps } from '@mantine/modals';
import { Trip } from '../../../types/trips.ts';
import { Button, Center, Container } from '@mantine/core';
import { useState } from 'react';
import { exportTripData } from '../../../lib';

export const ExportTripModal = ({
  /*  context,
                                  id,*/
  innerProps,
}: ContextModalProps<{
  trip: Trip;
}>) => {
  const { trip } = innerProps;

  const [downloadLink, setDownloadLink] = useState<string | undefined>();

  const prepareExport = () => {
    exportTripData(trip.id).then((data) => {
      prepareDownload(data);
    });
  };

  const replacer = (key: string, value: any) => {
    console.log('key ==> ', key);

    if (key === 'attachmentData') {
      console.log('vvvv', value);

      for (const [k, v] of Object.entries(value)) {
        console.log('k =>', k);
        console.log('v =>', v);
        console.log('json-v =>', JSON.stringify(v));
      }
    }
    return value;
  };

  const prepareDownload = (tripData: any) => {
    console.log('download data => ', tripData);

    console.log('download data => ', JSON.stringify(tripData, replacer));

    const blob = new Blob([JSON.stringify(tripData)], { type: 'application/json' });
    console.log('download data => ', blob);

    // If we are replacing a previously generated file we need to
    // manually revoke the object URL to avoid memory leaks.
    if (downloadLink) {
      window.URL.revokeObjectURL(downloadLink);
    }

    const dataUrl = window.URL.createObjectURL(blob);

    // returns a URL you can use as a href
    setDownloadLink(dataUrl);
  };

  return (
    <Container>
      <Center>
        {!downloadLink && <Button onClick={prepareExport}>Prepare</Button>}
        {downloadLink && (
          <Button component={'a'} href={downloadLink} download={`trip-${trip.name}-${trip.id}.json`}>
            Download
          </Button>
        )}
      </Center>
    </Container>
  );
};
