import { Button, rem } from '@mantine/core';
import { IconCalendar } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

export const AddActivitiesMenu = ({ onClick }: { onClick: () => void }) => {
  const { t } = useTranslation();
  return (
    <Button
      onClick={onClick}
      leftSection={<IconCalendar style={{ width: rem(18), height: rem(18) }} stroke={1.5} />}
      pr={12}
    >
      {t('activity_add_new', 'Add Activity')}
    </Button>
  );
};
