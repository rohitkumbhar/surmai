import { Button, FileButton } from '@mantine/core';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { importTripData } from '../../lib/api';
import { showErrorNotification } from '../../lib/notifications.tsx';

export const ImportTripAction = () => {
  const [tripDataFile, setTripDataFile] = useState<File | null>(null);
  const [importing, setImporting] = useState<boolean>(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    if (tripDataFile) {
      setImporting(true);
      importTripData(tripDataFile)
        .then((res) => {
          navigate(`/trips/${res.tripId}`);
        })
        .catch((err) => {
          showErrorNotification({
            error: err,
            title: t('import_failed', 'Import failed'),
            message: t('import_failed_details', 'Unable to import {{name}}', { name: tripDataFile.name }),
          });
        })
        .finally(() => {
          setImporting(false);
        });
    }
  }, [tripDataFile, t, navigate]);

  return (
    <FileButton
      onChange={setTripDataFile}
      accept="application/json,application/zip"
      form={'tripData'}
      name={'tripData'}
    >
      {(props) => {
        return (
          <Button {...props} loading={importing} variant={'subtle'}>
            {t('import_trip', 'Import Trip')}
          </Button>
        );
      }}
    </FileButton>
  );
};
