import { ContextModalProps } from '@mantine/modals';
import { Trip } from '../../../types/trips.ts';
import { Alert, Button, Center, Container, Text } from '@mantine/core';
import { useState } from 'react';
import { exportCalendar } from '../../../lib/api';
import { useTranslation } from 'react-i18next';
import { showErrorNotification } from '../../../lib/notifications.tsx';
import { IconClockExclamation } from '@tabler/icons-react';

export const ExportTripCalendarModal = ({
  innerProps,
}: ContextModalProps<{
  trip: Trip;
}>) => {
  const { trip } = innerProps;
  const { t } = useTranslation();
  const [_preparing, setPreparing] = useState<boolean>(false);
  const [allTimezonesAvailable, setAllTimezonesAvailable] = useState(true)
  const [downloadLink, setDownloadLink] = useState<string | undefined>();

  const prepareICSData = () => {
    setPreparing(true);
    exportCalendar({ tripId: trip.id })
      .then((response) => {

        const data = Uint8Array.from(atob(response.data), (c) => c.charCodeAt(0))
        setAllTimezonesAvailable(response.allTimezonesAvailable)
        prepareDownload(data);
      })
      .catch((error) => {
        showErrorNotification({
          error: error,
          title: t('ics_error_title', 'ICS Export'),
          message: t('ics_error_desc', 'An error occurred while generating the ICS file for this trip.'),
        });
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

  return (
    <Container>
      <Text size={'sm'} p={'sm'}>
        {t(
          'prepare_ics_file',
          'Generate an iCalendar (.ics) file for your trip. This file can be downloaded and added to any calendar application of your choice.'
        )}
      </Text>
      {!_preparing && !allTimezonesAvailable && <Alert
        variant="light"
        title={t('timezones_info_incomplete_title', 'Timezones Unavailable')}
        icon={<IconClockExclamation />}
        mb="sm"

      >
        {t('timezones_info_incomplete_desc', 'Some timezone information in unavailable. Calendar may be inaccurate. Edit the trip data to set the associated destinations for timezone information.')}
      </Alert>}
      <Center mt={'sm'}>
        {!downloadLink && <Button onClick={prepareICSData}>{t('generate', 'Generate')}</Button>}
        {downloadLink && (
          <Button component={'a'} href={downloadLink} download={`${trip.name}.ics`} loading={_preparing}>
            {t('download', 'Download')}
          </Button>
        )}
      </Center>
    </Container>
  );
};
