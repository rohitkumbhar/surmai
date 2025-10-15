import { Accordion, Group, rem, Text } from '@mantine/core';
import { IconBed, IconCalendar, IconInfoSquare, IconPlane } from '@tabler/icons-react';
import { t } from 'i18next';

import { ActivitiesPanel } from './activities/ActivitiesPanel';
import { BasicInfo } from './basic/BasicInfo';
import { LodgingPanel } from './lodging/LodgingPanel';
import { TransportationPanel } from './transportation/TransportationPanel';

import type { Attachment, Expense, Trip } from '../../types/trips';

export const OrganizationTab = ({
  trip,
  tripAttachments,
  expenseMap,
  refetchTrip,
}: {
  trip: Trip;
  tripAttachments: Attachment[];
  expenseMap: Map<string, Expense>;
  refetchTrip: () => void;
}) => {
  return (
    <Accordion chevronPosition="right" variant="separated" multiple={true} mt={'sm'}>
      <Accordion.Item value={'basic_info'} key={'basic_info'}>
        <Accordion.Control
          icon={
            <IconInfoSquare
              style={{
                color: 'var(--mantine-primary-color-6)',
                width: rem(40),
                height: rem(40),
              }}
            />
          }
        >
          <Group wrap="nowrap">
            <div>
              <Text>{t('trip_basic_information', 'Basic Information')}</Text>
              <Text size="sm" c="dimmed" fw={400}>
                {t('trip_basic_info_description', 'View basic information about your trip')}
              </Text>
            </div>
          </Group>
        </Accordion.Control>
        <Accordion.Panel>
          <BasicInfo trip={trip} tripAttachments={tripAttachments} refetch={refetchTrip} />
        </Accordion.Panel>
      </Accordion.Item>

      <Accordion.Item value={'transportation'} key={'transportation'}>
        <Accordion.Control
          icon={
            <IconPlane
              style={{
                color: 'var(--mantine-primary-color-6)',
                width: rem(40),
                height: rem(40),
              }}
            />
          }
        >
          <Group wrap="nowrap">
            <div>
              <Text>{t('transportation_section_name', 'Transportation')}</Text>
              <Text size="sm" c="dimmed" fw={400}>
                {t(
                  'transportation_section_description',
                  'View and edit your transportation arrangements for this trip'
                )}
              </Text>
            </div>
          </Group>
        </Accordion.Control>
        <Accordion.Panel>
          <TransportationPanel trip={trip} tripAttachments={tripAttachments} expenseMap={expenseMap} refetchTrip={refetchTrip} />
        </Accordion.Panel>
      </Accordion.Item>

      <Accordion.Item value={'lodging'} key={'lodging'}>
        <Accordion.Control
          icon={
            <IconBed
              style={{
                color: 'var(--mantine-primary-color-6)',
                width: rem(40),
                height: rem(40),
              }}
            />
          }
        >
          <Group wrap="nowrap">
            <div>
              <Text>{t('lodging_section_name', 'Lodging')}</Text>
              <Text size="sm" c="dimmed" fw={400}>
                {t('lodging_section_description', 'View and edit your lodging arrangements for this trip')}
              </Text>
            </div>
          </Group>
        </Accordion.Control>
        <Accordion.Panel>
          <LodgingPanel trip={trip} tripAttachments={tripAttachments} expenseMap={expenseMap} refetchTrip={refetchTrip} />
        </Accordion.Panel>
      </Accordion.Item>

      <Accordion.Item value={'activities'} key={'activities'}>
        <Accordion.Control
          icon={
            <IconCalendar
              style={{
                color: 'var(--mantine-primary-color-6)',
                width: rem(40),
                height: rem(40),
              }}
            />
          }
        >
          <Group wrap="nowrap">
            <div>
              <Text>{t('activity_section_name', 'Activities')}</Text>
              <Text size="sm" c="dimmed" fw={400}>
                {t('activity_section_description', 'View and edit your activities for this trip')}
              </Text>
            </div>
          </Group>
        </Accordion.Control>
        <Accordion.Panel>
          <ActivitiesPanel trip={trip} tripAttachments={tripAttachments} expenseMap={expenseMap} refetchTrip={refetchTrip} />
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  );
};
