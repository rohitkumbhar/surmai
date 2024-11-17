import { Activity, Trip } from '../../../types/trips.ts';
import { Grid, Modal, Text, Title } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { DataLine } from '../DataLine.tsx';
import { openConfirmModal } from '@mantine/modals';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { Attachments } from '../attachments/Attachments.tsx';
import { deleteActivity, formatDate } from '../../../lib';
import { formatTime } from '../common/util.ts';
import { GenericActivityForm } from './GenericActivityForm.tsx';
import { notifications } from '@mantine/notifications';

export const GenericActivityData = ({
  trip,
  activity,
  refetch,
}: {
  trip: Trip;
  activity: Activity;
  refetch: () => void;
}) => {
  const { t, i18n } = useTranslation();
  const [formOpened, { open: openForm, close: closeForm }] = useDisclosure(false);
  const isMobile = useMediaQuery('(max-width: 50em)');

  return (
    <DataLine
      onEdit={() => {
        openForm();
      }}
      onDelete={() => {
        openConfirmModal({
          title: t('delete_activity', 'Delete Activity'),
          confirmProps: { color: 'red' },
          children: <Text size="sm">{t('deletion_confirmation', 'This action cannot be undone.')}</Text>,
          labels: {
            confirm: t('delete', 'Delete'),
            cancel: t('cancel', 'Cancel'),
          },
          onCancel: () => console.log('Cancel'),
          onConfirm: () => {
            deleteActivity(activity.id).then(() => {
              notifications.show({
                title: 'Deleted',
                message: `Activity ${activity.name} has been deleted`,
                position: 'top-right',
              });
              refetch();
            });
          },
        });
      }}
    >
      <Modal
        opened={formOpened}
        fullScreen={isMobile}
        size="auto"
        title={t('activity.edit', 'Edit Activity')}
        onClose={() => {
          closeForm();
        }}
      >
        <GenericActivityForm
          activity={activity}
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
      <Grid align={'top'} p={'xs'} grow={false}>
        {/* <Grid.Col span={{ base: 12, sm: 12, md: 1, lg: 1 }} p={'md'}>
          <Box component="div" visibleFrom={'md'}>
            <Tooltip label={t(`lodging.${lodging.type}`, lodging.type)}>
              <TypeIcon size={'sm'} stroke={1} />
            </Tooltip>
          </Box>
          <Box component="div" hiddenFrom={'md'}>
            <Title size={'lg'}>{t(`lodging.${lodging.type}`, lodging.type)}</Title>
            <Divider mt={'5px'} />
          </Box>
        </Grid.Col>*/}

        <Grid.Col span={{ base: 12, sm: 5, md: 2, lg: 2 }}>
          <Text size="sm" c={'dimmed'}>
            {t('activity.start_date', 'Date/Time')}
          </Text>
          <Title size="sm">
            {`${formatDate(i18n.language, activity.startDate)} ${formatTime(i18n.language, activity.startDate)}`}
          </Title>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 3, lg: 4 }}>
          <Title size="xs" c={'dimmed'}>
            {t('lodging.name', 'Name')}
          </Title>
          <Text size="md">{activity.name}</Text>
          <Text size="sm" c={'dimmed'}>
            {activity.description}
          </Text>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 2, lg: 3 }}>
          <Title size="xs" c={'dimmed'}>
            {t('lodging.address', 'Address')}
          </Title>
          <Text size="md">{activity.address}</Text>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 2, lg: 2 }}>
          <Text size="sm" c={'dimmed'}>
            {t('cost', 'Cost')}
          </Text>
          <Title size="md">
            {activity.cost?.value ? `${activity.cost.value} ${activity.cost.currency || ''}` : 'Unknown'}
          </Title>
        </Grid.Col>
      </Grid>
      <Attachments
        entity={activity}
        refetch={refetch}
        onDelete={() => {
          return new Promise<unknown>(() => {
            return true;
          });
        }}
      />
    </DataLine>
  );
};
