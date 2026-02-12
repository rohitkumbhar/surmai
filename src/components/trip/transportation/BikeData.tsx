import { Box, Divider, Grid, Group, HoverCard, Modal, rem, Stack, Text, Title, Tooltip } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { openConfirmModal } from '@mantine/modals';
import { IconBike, IconInfoCircle } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

import { useSurmaiContext } from '../../../app/useSurmaiContext.ts';
import { deleteTransportation, deleteTransportationAttachment } from '../../../lib/api';
import { showDeleteNotification } from '../../../lib/notifications.tsx';
import { formatDateTime } from '../../../lib/time.ts';
import { TimezoneInfo } from '../../util/TimezoneInfo.tsx';
import { Attachments } from '../attachments/Attachments.tsx';
import { DataLine } from '../DataLine.tsx';
import { BikeForm } from './BikeForm.tsx';

import type { Attachment, Expense, Transportation, Trip } from '../../../types/trips.ts';

export const BikeData = ({
  trip,
  transportation,
  refetch,
  tripAttachments,
  expenseMap,
}: {
  trip: Trip;
  transportation: Transportation;
  refetch: () => void;
  tripAttachments?: Attachment[];
  expenseMap: Map<string, Expense>;
}) => {
  const { t } = useTranslation();
  const { isMobile } = useSurmaiContext();
  const [opened, { open, close }] = useDisclosure(false);
  const TypeIcon = IconBike;

  const transportationAttachments = tripAttachments?.filter((attachment) =>
    transportation.attachmentReferences?.includes(attachment.id)
  );

  // Get expense from map, handle null/undefined cases
  const expense = transportation.expenseId ? expenseMap.get(transportation.expenseId) : undefined;
  const costValue = expense?.cost?.value;
  const costCurrency = expense?.cost?.currency;

  return (
    <DataLine
      link={transportation.link}
      onEdit={() => {
        open();
      }}
      onDelete={() => {
        openConfirmModal({
          title: t('delete_transportation', 'Delete Transportation'),
          confirmProps: { color: 'red' },
          children: <Text size="sm">{t('deletion_confirmation', 'This action cannot be undone.')}</Text>,
          labels: {
            confirm: t('delete', 'Delete'),
            cancel: t('cancel', 'Cancel'),
          },
          onCancel: () => {},
          onConfirm: () => {
            deleteTransportation(transportation.id).then(() => {
              showDeleteNotification({
                title: t('transportation_section_name', 'Transportation'),
                message: t(
                  'transportation_deleted',
                  'Transportation from {{origin}} to {{destination}} has been deleted',
                  {
                    origin: transportation.origin,
                    destination: transportation.destination,
                  }
                ),
              });
              refetch();
            });
          },
        });
      }}
    >
      <Modal
        opened={opened}
        size="auto"
        fullScreen={isMobile}
        title={t('transportation_edit_' + transportation.type, 'Edit Transportation')}
        onClose={close}
      >
        <BikeForm
          transportationType={'bike'}
          transportation={transportation}
          exitingAttachments={transportationAttachments}
          trip={trip}
          expenseMap={expenseMap}
          onSuccess={() => {
            refetch();
            close();
          }}
          onCancel={() => {
            close();
          }}
        />
      </Modal>

      <Grid align={'top'} p={'xs'} grow={false}>
        <Grid.Col span={{ base: 12, sm: 12, md: 1, lg: 1 }} p={'md'}>
          <Box component="div" visibleFrom={'md'}>
            <Tooltip label={t(`transportation_${transportation.type}`, `${transportation.type}`)}>
              <TypeIcon
                size={'xs'}
                stroke={0.5}
                style={{
                  color: 'var(--mantine-primary-color-6)',
                  width: rem(50),
                  height: rem(50),
                }}
              />
            </Tooltip>
          </Box>
          <Box component="div" hiddenFrom={'md'}>
            <Title size={'lg'}>{t(`transportation_${transportation.type}`, `${transportation.type}`)}</Title>
            <Divider mt={'5px'} />
          </Box>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 5, md: 2, lg: 2.5 }}>
          <Text size="xs" c={'dimmed'}>
            {t('transportation_from', 'From')}
          </Text>
          {!transportation.metadata.origin && <Text size="md">{transportation.origin}</Text>}
          {transportation.metadata.origin && (
            <HoverCard withArrow width={200} shadow="lg">
              <HoverCard.Target>
                <Group>
                  <Text size="md">
                    {transportation.origin}
                    &nbsp;
                    <IconInfoCircle size={12} />
                  </Text>
                </Group>
              </HoverCard.Target>
              <HoverCard.Dropdown>
                <Stack>
                  <Text size="md">{transportation.metadata.origin.name}</Text>
                  <TimezoneInfo timezone={transportation.metadata.origin.timezone} />
                </Stack>
              </HoverCard.Dropdown>
            </HoverCard>
          )}
          <Text size="xs">{formatDateTime(transportation.departureTime)}</Text>
          <Text size="xs">{transportation.metadata.originAddress}</Text>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 5, md: 2, lg: 2.5 }}>
          <Text size="xs" c={'dimmed'}>
            {t('transportation_to', 'To')}
          </Text>

          {!transportation.metadata.destination && <Text size="md">{transportation.destination}</Text>}
          {transportation.metadata.destination && (
            <HoverCard withArrow width={200} shadow="md">
              <HoverCard.Target>
                <Group>
                  <Text size="md">
                    {transportation.destination}
                    &nbsp;
                    <IconInfoCircle size={12} />
                  </Text>
                </Group>
              </HoverCard.Target>
              <HoverCard.Dropdown>
                <Stack>
                  <Text size="md">{transportation.metadata.destination.name}</Text>
                  <TimezoneInfo timezone={transportation.metadata.destination.timezone} />
                </Stack>
              </HoverCard.Dropdown>
            </HoverCard>
          )}
          <Text size="xs">{formatDateTime(transportation.arrivalTime)}</Text>
          <Text size="xs">{transportation.metadata.destinationAddress}</Text>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 5, md: 2, lg: 2 }}>
          <Text size="xs" c={'dimmed'}>
            {t('transportation_elevation_gain', 'Elevation Gain')}
          </Text>
          <Group gap={1}>
            <Text size="md">{transportation.metadata.elevationGain || ''}</Text>
          </Group>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 2, lg: 2 }}>
          <Text size="sm" c={'dimmed'}>
            {t('transportation_distance', 'Distance')}
          </Text>
          <Text size="md">{transportation.metadata.distance || ''}</Text>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 2, lg: 2 }}>
          <Text size="xs" c={'dimmed'}>
            {t('cost', 'Cost')}
          </Text>
          <Text size="md">{costValue ? `${costValue} ${costCurrency || ''}` : ''}</Text>
        </Grid.Col>
      </Grid>
      {transportationAttachments && (
        <Attachments
          onDelete={(attachmentId) =>
            deleteTransportationAttachment(transportation.id, attachmentId).then(() => refetch())
          }
          attachments={transportationAttachments}
        />
      )}
    </DataLine>
  );
};
