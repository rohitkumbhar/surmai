import { ContextModalProps } from '@mantine/modals';
import { Trip } from '../../../types/trips.ts';
import { Button, Center, Container, Text } from '@mantine/core';
import { useState } from 'react';
import { exportTripData } from '../../../lib/api';
import { useTranslation } from 'react-i18next';

export const ExportTripModal = ({
  innerProps,
}: ContextModalProps<{
  trip: Trip;
}>) => {
  const { trip } = innerProps;
  const { t } = useTranslation();
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
    const blob = new Blob([tripData], { type: 'application/zip' });

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
      <Text size={'sm'} p={'sm'}>
        {t('export_trip_description', 'Exporting this trip will create a zip file containing all the trip data.')}
      </Text>
      <Center>
        {!downloadLink && (
          <Button loading={preparing} onClick={prepareExport}>
            {t('prepare_export', 'Prepare Export')}
          </Button>
        )}
        {downloadLink && (
          <Button component={'a'} href={downloadLink} download={`trip-${trip.name}-${trip.id}.zip`}>
            {t('download', 'Download')}
          </Button>
        )}
      </Center>
    </Container>
  );
};
