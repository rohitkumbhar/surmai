import { ContextModalProps } from '@mantine/modals';
import { Trip } from '../../../types/trips.ts';
import { Button, Center, Container, Text } from '@mantine/core';
import { useState } from 'react';
import { exportTripData } from '../../../lib';

export const ExportTripModal = ({
  innerProps,
}: ContextModalProps<{
  trip: Trip;
}>) => {
  const { trip } = innerProps;

  const [preparing, setPreparing] = useState<boolean>(false);
  const [downloadLink, setDownloadLink] = useState<string | undefined>();

  const prepareExport = () => {
    setPreparing(true);
    exportTripData(trip.id)
      .then((data) => {
        prepareDownload(data);
      })
      .finally(() => setPreparing(false));
  };

  const prepareDownload = (tripData: any) => {
    const blob = new Blob([JSON.stringify(tripData)], { type: 'application/json' });

    // If we are replacing a previously generated file we need to
    // manually revoke the object URL to avoid memory leaks.
    if (downloadLink) {
      window.URL.revokeObjectURL(downloadLink);
    }

    const dataUrl = window.URL.createObjectURL(blob);
    setDownloadLink(dataUrl);
  };

  return (
    <Container>
      <Text>Trip data will be downloaded as a JSON file. Attachments will be included in Base64 encoded format.</Text>
      <Center>
        {!downloadLink && (
          <Button loading={preparing} onClick={prepareExport}>
            Prepare
          </Button>
        )}
        {downloadLink && (
          <Button component={'a'} href={downloadLink} download={`trip-${trip.name}-${trip.id}.json`}>
            Download
          </Button>
        )}
      </Center>
    </Container>
  );
};
