import {
  ActionIcon,
  Badge,
  Card,
  Group,
  Stack,
  Text,
  Tooltip,
} from '@mantine/core';
import {
  IconCheck,
  IconPlus,
  IconStarFilled,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

import { CATEGORIES, getCategoryForPOI, getCategoryLabel } from './constants';
import type { POI } from './types';

export const POICard = ({
  poi,
  isAdded,
  isSaving,
  onAdd,
}: {
  poi: POI;
  isAdded: boolean;
  isSaving: boolean;
  onAdd: (poi: POI) => void;
}) => {
  const { t } = useTranslation();
  const catLabel = getCategoryLabel(poi);
  const cat = getCategoryForPOI(poi);
  const catInfo = CATEGORIES.find((c) => c.value === cat) || CATEGORIES[0];

  return (
    <Card
      withBorder
      padding="sm"
      radius="md"
      style={{
        transition: 'all 0.15s ease',
        borderColor: isAdded ? 'var(--mantine-color-teal-4)' : undefined,
        background: isAdded ? 'var(--mantine-color-teal-0)' : undefined,
      }}
    >
      <Group justify="space-between" align="flex-start" wrap="nowrap" gap="sm">
        <Stack gap={4} flex={1} style={{ minWidth: 0 }}>
          <Text fw={600} size="sm" lineClamp={1}>
            {poi.tags.name}
          </Text>
          {catLabel && (
            <Badge
              size="xs"
              variant="light"
              color={catInfo.color}
              radius="sm"
              style={{ alignSelf: 'flex-start' }}
            >
              {catLabel}
            </Badge>
          )}
          {poi.tags['addr:street'] && (
            <Text size="xs" c="dimmed" lineClamp={1}>
              {[poi.tags['addr:housenumber'], poi.tags['addr:street']].filter(Boolean).join(' ')}
            </Text>
          )}
          {(poi.tags.rating || poi.tags.stars) && (
            <Group gap={4}>
              <IconStarFilled size={12} color="#fcc419" />
              <Text size="xs" fw={600}>
                {poi.tags.rating || poi.tags.stars}
              </Text>
            </Group>
          )}
        </Stack>
        <Tooltip
          label={
            isAdded
              ? t('explorer_added', 'Added!')
              : t('explorer_add_to_trip', 'Add to Trip')
          }
        >
          <ActionIcon
            variant={isAdded ? 'filled' : 'light'}
            color={isAdded ? 'teal' : catInfo.color}
            size="lg"
            radius="md"
            onClick={() => !isAdded && onAdd(poi)}
            disabled={isSaving}
            style={{ transition: 'all 0.2s ease' }}
          >
            {isAdded ? <IconCheck size={18} /> : <IconPlus size={18} />}
          </ActionIcon>
        </Tooltip>
      </Group>
    </Card>
  );
};
