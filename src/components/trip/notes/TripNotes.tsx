import { Box, Button, Group, Paper, Text } from '@mantine/core';
import { IconPencil } from '@tabler/icons-react';
import { lazy, Suspense, useState } from 'react';
import { useTranslation } from 'react-i18next';

import styles from '@src/components/trip/notes/TripNotes.module.css';
import { saveTripNotes } from '@src/lib/api';
import { showSaveSuccessNotification } from '@src/lib/notifications.tsx';

import type { Trip } from '@src/types/trips.ts';

const NotesEditor = lazy(() => import('@src/components/trip/notes/NotesEditor.tsx'));

export const TripNotes = ({ trip, refetch }: { trip: Trip; refetch: () => void }) => {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);

  return (
    <Paper p={'xs'} mt="sm">
      {!editing && (
        <Box>
          {trip.notes && <div className={styles.tiptap} dangerouslySetInnerHTML={{ __html: trip.notes }} />}
          {!trip.notes && (
            <Text>
              {t(
                'no_notes_yet',
                'This trip does not have any notes yet. You can use notes to jot down anything that is not covered under Organization or just for brainstorming with collaborators. For example, a task list or links to local attractions.'
              )}
            </Text>
          )}
          {trip.canUpdate && (
            <Group justify={'flex-end'} mt={'md'}>
              <Button
                aria-label={t('start_notes', 'Add Notes')}
                leftSection={<IconPencil height={20} />}
                onClick={() => {
                  setEditing(true);
                }}
              >
                {trip.notes ? t('edit', 'Edit') : t('start_notes', 'Add Notes')}
              </Button>
            </Group>
          )}
        </Box>
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
