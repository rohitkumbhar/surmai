import { Activity, Trip } from '../../../types/trips.ts';
import { useQuery } from '@tanstack/react-query';
import { listActivities } from '../../../lib';
import { Card, Container, Flex, LoadingOverlay, Modal, Stack, Title, Text } from '@mantine/core';
import { AddActivitiesMenu } from './AddActivitiesMenu.tsx';
import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { GenericActivityData } from './GenericActivityData.tsx';
import { GenericActivityForm } from './GenericActivityForm.tsx';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';

export const ActivitiesPanel = ({ trip }: { trip: Trip }) => {
  const { t } = useTranslation();
  const tripId = trip.id;
  const { isPending, isError, data, error, refetch } = useQuery<Activity[]>({
    queryKey: ['listActivities', tripId],
    queryFn: () => listActivities(tripId || ''),
  });

  const isMobile = useMediaQuery('(max-width: 50em)');
  const [formOpened, { open: openForm, close: closeForm }] = useDisclosure(false);

  if (isPending) {
    return <LoadingOverlay visible={true} zIndex={1000} overlayProps={{ radius: 'sm', blur: 2 }} />;
  }

  if (isError) {
    throw new Error(error.message);
  }

  return (
    <Container py={'xs'} size="lg">
      <Modal
        opened={formOpened}
        fullScreen={isMobile}
        size="auto"
        title={t('activity.add_new', 'Add Activity')}
        onClose={() => {
          closeForm();
        }}
      >
        <GenericActivityForm
          trip={trip}
          onSuccess={() => {
            refetch();
            closeForm();
          }}
          onCancel={() => {
            closeForm();
          }}
        />
      </Modal>

      <Flex mih={50} gap="md" justify="flex-end" align="center" direction="row" wrap="wrap">
        <AddActivitiesMenu
          onClick={() => {
            openForm();
          }}
        />
      </Flex>
      {
        <Stack mt={'sm'}>
          <Title order={5}>{t('activities', 'Activities')}</Title>
          {data.length === 0 && (
            <Card withBorder>
              <Text c={'dimmed'}>{t('activities.no_data', 'No Activities')}</Text>
            </Card>
          )}
          {data.map((t: Activity) => {
            return (
              <Fragment key={t.id}>
                <GenericActivityData refetch={refetch} trip={trip} activity={t} />
              </Fragment>
            );
          })}
        </Stack>
      }
    </Container>
  );
};
