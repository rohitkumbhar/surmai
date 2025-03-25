import { Trip } from '../../../types/trips.ts';
import { Button, Group, Paper } from '@mantine/core';
import { saveTripNotes } from '../../../lib/api';
import { showSaveSuccessNotification } from '../../../lib/notifications.tsx';
import { useTranslation } from 'react-i18next';
import { IconPencil } from '@tabler/icons-react';
import { lazy, Suspense, useState } from 'react';

const NotesEditor = lazy(() => import('./NotesEditor.tsx'));

export const TripNotes = ({ trip, refetch }: { trip: Trip; refetch: () => void }) => {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);

  return (
    <Paper bg={'var(--mantine-color-body)'} mt={'md'} p={'md'}>
      {!editing && (
        <>
          <div dangerouslySetInnerHTML={{ __html: trip.notes || 'Click edit to add notes' }} />
          <Group justify={'flex-end'}>
            <Button
              leftSection={<IconPencil height={20} />}
              onClick={() => {
                setEditing(true);
              }}
            >
              {t('edit', 'Edit')}
            </Button>
          </Group>
        </>
      )}
      {editing && (
        <Suspense fallback={<div>Loading...</div>}>
          <NotesEditor
            notes={trip.notes || ''}
            onSave={(contents) => {
              saveTripNotes(trip.id, contents).then(() => {
                refetch();
                setEditing(false);
                showSaveSuccessNotification({
                  title: t('trip_updated', 'Trip Updated'),
                  message: t('trip_notes_saved', 'Trip notes saved'),
                });
              });
            }}
          />
        </Suspense>
      )}
    </Paper>
  );
};
