import { Button, Menu, rem } from '@mantine/core';
import { IconBedFlat, IconBuildingEstate, IconChevronDown, IconHome, IconTent } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { LodgingType } from '../../../types/trips.ts';

export const AddLodgingMenu = ({ onClick }: { onClick: (type: string) => void }) => {
  const { t } = useTranslation();
  return (
    <Menu transitionProps={{ transition: 'pop-top-right' }} position="bottom-end" width={150} withinPortal>
      <Menu.Target>
        <Button rightSection={<IconChevronDown style={{ width: rem(18), height: rem(18) }} stroke={1.5} />} pr={12}>
          {t('lodging_add_new', 'Add new')}
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item
          onClick={() => {
            onClick(LodgingType.HOTEL);
          }}
          leftSection={<IconBuildingEstate style={{ width: rem(16), height: rem(16) }} stroke={1.5} />}
        >
          {t('lodging_hotel', 'Hotel')}
        </Menu.Item>

        <Menu.Item
          onClick={() => {
            onClick(LodgingType.HOME);
          }}
          leftSection={<IconHome style={{ width: rem(16), height: rem(16) }} stroke={1.5} />}
        >
          {t('lodging_home_stay', 'Home')}
        </Menu.Item>

        <Menu.Item
          onClick={() => {
            onClick(LodgingType.RENTAL);
          }}
          leftSection={<IconBedFlat style={{ width: rem(16), height: rem(16) }} stroke={1.5} />}
        >
          {t('lodging_vacation_rental', 'Rental')}
        </Menu.Item>

        <Menu.Item
          onClick={() => {
            onClick(LodgingType.CAMP_SITE);
          }}
          leftSection={<IconTent style={{ width: rem(16), height: rem(16) }} stroke={1.5} />}
        >
          {t('lodging_camp_site', 'Camp Site')}
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
};
