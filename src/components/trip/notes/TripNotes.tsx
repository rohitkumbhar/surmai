import { Button, Group, Text } from '@mantine/core';
import { IconPencil } from '@tabler/icons-react';
import { lazy, Suspense, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { saveTripNotes } from '../../../lib/api';
import { showSaveSuccessNotification } from '../../../lib/notifications.tsx';
import styles from './TripNotes.module.css';

import type { Trip } from '../../../types/trips.ts';

const NotesEditor = lazy(() => import('./NotesEditor.tsx'));

export const TripNotes = ({ trip, refetch }: { trip: Trip; refetch: () => void }) => {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);

  return (
    <>
      {!editing && (
        <>
          {trip.notes && <div className={styles.tiptap} dangerouslySetInnerHTML={{ __html: trip.notes }} />}
          {!trip.notes && (
            <Text>
              {t(
                'no_notes_yet',
                'This trip does not have any notes yet. You can use notes to jot down anything that is not covered under Organization or just for brainstorming with collaborators. For example, a task list or links to local attractions.'
              )}
            </Text>
          )}
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
    </>
  );
};
