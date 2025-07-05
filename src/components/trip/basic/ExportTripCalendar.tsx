import { ContextModalProps } from '@mantine/modals';
import { Trip } from '../../../types/trips.ts';
import { Button, Center, Container, Text } from '@mantine/core';
import { useEffect, useState } from 'react';
import { exportCalendar } from '../../../lib/api';
import { useTranslation } from 'react-i18next';

export const ExportTripCalendarModal = ({
  innerProps,
}: ContextModalProps<{
  trip: Trip;
}>) => {
  const { trip } = innerProps;
  const { t } = useTranslation();
  const [_preparing, setPreparing] = useState<boolean>(false);
  const [downloadLink, setDownloadLink] = useState<string | undefined>();

  const prepareICSData = () => {
    setPreparing(true);
    exportCalendar({ tripId: trip.id })
      .then((data) => {
        prepareDownload(data);
      })
      .finally(() => setPreparing(false));
  };

  const prepareDownload = (tripData: any) => {
    const blob = new Blob([tripData], { type: 'text/calendar' });

    // If we are replacing a previously generated file we need to
    // manually revoke the object URL to avoid memory leaks.
    if (downloadLink) {
      window.URL.revokeObjectURL(downloadLink);
    }

    const dataUrl = window.URL.createObjectURL(blob);
    setDownloadLink(dataUrl);
  };

  useEffect(() => {
    prepareICSData();
  }, []);

  return (
    <Container>
      <Text size={'sm'} p={'sm'}>
        {t('trip_calendar', 'Add this trip to your calendar. Download as an ICS file or add to a calendar service.')}
      </Text>
      <Center>
        {/*{!downloadLink && (
          <Button loading={preparing} onClick={prepareExport}>
            {t('prepare_export', 'Prepare Export')}
          </Button>
        )}*/}
        {downloadLink && (
          <Button component={'a'} href={downloadLink} download={`trip-${trip.name}.ics`}>
            {t('download_ics', 'Download ICS')}
          </Button>
        )}
      </Center>
    </Container>
  );
};
