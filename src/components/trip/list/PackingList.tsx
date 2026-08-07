import { Box, Button, Group, Paper, Text } from '@mantine/core';
import { IconPencil } from '@tabler/icons-react';
import { lazy, Suspense, useState } from 'react';
import { useTranslation } from 'react-i18next';

import styles from './PackingList.module.css';
import { savePackingList } from '../../../lib/api/index.ts';
import { showSaveSuccessNotification } from '../../../lib/notifications.tsx';

import type { Trip } from '../../../types/trips.ts';

const PackingListEditor = lazy(() => import('./PackingListEditor.tsx'));

export const PackingList = ({ trip, refetch }: { trip: Trip; refetch: () => void }) => {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);

  return (
    <Paper p={'xs'} mt="sm">
      {!editing && (
        <Box>
          {trip.list && <div className={styles.tiptap} dangerouslySetInnerHTML={{ __html: trip.list }} />}
          {!trip.list && (
            <Text>
              {t(
                'no_list_yet',
                'This trip does not have a packing list yet. You can use the editor to add a list.'
              )}
            </Text>
          )}
          {trip.canUpdate && (
            <Group justify={'flex-end'} mt={'md'}>
              <Button
                aria-label={t('start_list', 'Add List')}
                leftSection={<IconPencil height={20} />}
                onClick={() => {
                  setEditing(true);
                }}
              >
                {trip.list ? t('edit', 'Edit List') : t('start_list', 'Add List')}
              </Button>
            </Group>
          )}
        </Box>
      )}
      {editing && (
        <Suspense fallback={<div>Loading...</div>}>
          <PackingListEditor
            list={trip.list || ''}
            onSave={(contents) => {
              savePackingList(trip.id, contents).then(() => {
                refetch();
                setEditing(false);
                showSaveSuccessNotification({
                  title: t('trip_updated', 'Trip Updated'),
                  message: t('list_saved', 'Packing list saved'),
                });
              });
            }}
          />
        </Suspense>
      )}
    </Paper>
  );
};
