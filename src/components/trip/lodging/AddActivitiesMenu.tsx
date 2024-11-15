import { Button, Menu, rem } from '@mantine/core';
import { IconBedFlat, IconBuildingEstate, IconChevronDown, IconHome, IconTent } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { LodgingType } from '../../../types/trips.ts';

export const AddActivitiesMenu = ({ onClick }: { onClick: (type: string) => void }) => {
  const { t } = useTranslation();
  return (
    <Menu transitionProps={{ transition: 'pop-top-right' }} position="bottom-end" width={150} withinPortal>
      <Menu.Target>
        <Button rightSection={<IconChevronDown style={{ width: rem(18), height: rem(18) }} stroke={1.5} />} pr={12}>
          {t('lodging.add_new', 'Add new')}
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item
          onClick={() => {
            onClick(LodgingType.HOTEL);
            // openContextModal({
            //   modal: 'genericLodgingForm',
            //   title: t('lodging.add_hotel', 'Add Hotel'),
            //   radius: 'md',
            //   size: 'auto',
            //   withCloseButton: isMobile,
            //   fullScreen: isMobile,
            //   innerProps: {
            //     trip: trip,
            //     type: LodgingType.HOTEL,
            //     onSuccess: () => {
            //       refetch();
            //     },
            //     onCancel: () => {},
            //   },
            // });
          }}
          leftSection={<IconBuildingEstate style={{ width: rem(16), height: rem(16) }} stroke={1.5} />}
        >
          {t('lodging.hotel', 'Hotel')}
        </Menu.Item>

        <Menu.Item
          onClick={() => {
            onClick(LodgingType.HOME);

            // openContextModal({
            //   modal: 'genericLodgingForm',
            //   title: t('lodging.add_home', 'Add Home'),
            //   radius: 'md',
            //   size: 'auto',
            //   withCloseButton: isMobile,
            //   fullScreen: isMobile,
            //   innerProps: {
            //     trip: trip,
            //     type: LodgingType.HOME,
            //     onSuccess: () => {
            //       refetch();
            //     },
            //     onCancel: () => {},
            //   },
            // });
          }}
          leftSection={<IconHome style={{ width: rem(16), height: rem(16) }} stroke={1.5} />}
        >
          {t('transportation.home_stay', 'Home')}
        </Menu.Item>

        <Menu.Item
          onClick={() => {
            onClick(LodgingType.RENTAL);

            // openContextModal({
            //   modal: 'genericLodgingForm',
            //   title: t('lodging.rental', 'Add Rental'),
            //   radius: 'md',
            //   size: 'auto',
            //   withCloseButton: isMobile,
            //   fullScreen: isMobile,
            //   innerProps: {
            //     trip: trip,
            //     type: LodgingType.RENTAL,
            //     onSuccess: () => {
            //       refetch();
            //     },
            //     onCancel: () => {},
            //   },
            // });
          }}
          leftSection={<IconBedFlat style={{ width: rem(16), height: rem(16) }} stroke={1.5} />}
        >
          {t('transportation.vacation_rental', 'Rental')}
        </Menu.Item>

        <Menu.Item
          onClick={() => {
            onClick(LodgingType.CAMP_SITE);

            // openContextModal({
            //   modal: 'genericLodgingForm',
            //   title: t('lodging.add_camp_site', 'Add Camp Site'),
            //   radius: 'md',
            //   size: 'auto',
            //   withCloseButton: isMobile,
            //   fullScreen: isMobile,
            //   innerProps: {
            //     trip: trip,
            //     type: LodgingType.CAMP_SITE,
            //     onSuccess: () => {
            //       refetch();
            //     },
            //     onCancel: () => {},
            //   },
            // });
          }}
          leftSection={<IconTent style={{ width: rem(16), height: rem(16) }} stroke={1.5} />}
        >
          {t('transportation.camp_site', 'Camp Site')}
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
};
