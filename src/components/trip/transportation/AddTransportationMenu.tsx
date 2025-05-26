import { Button, Menu, rem } from '@mantine/core';
import { IconBus, IconCar, IconChevronDown, IconPlane, IconShip, IconTrain } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

export const AddTransportationMenu = ({ onClick }: { onClick: (selectedType: string) => void }) => {
  const { t } = useTranslation();
  return (
    <Menu transitionProps={{ transition: 'pop-top-right' }} position="bottom-end" width={150} withinPortal>
      <Menu.Target>
        <Button
          rightSection={<IconChevronDown style={{ width: rem(18), height: rem(18) }} stroke={1.5} />}
          pr={12}
          data-testid={'add-transportation-button'}
        >
          {t('transportation_add_new', 'Add new')}
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item
          onClick={() => {
            onClick('flight');
          }}
          leftSection={<IconPlane style={{ width: rem(16), height: rem(16) }} stroke={1.5} />}
        >
          {t('transportation_flight', 'Flight')}
        </Menu.Item>

        <Menu.Item
          onClick={() => {
            onClick('bus');
          }}
          leftSection={<IconBus style={{ width: rem(16), height: rem(16) }} stroke={1.5} />}
        >
          {t('transportation_bus', 'Bus')}
        </Menu.Item>

        <Menu.Item
          onClick={() => {
            onClick('car');
          }}
          leftSection={<IconCar style={{ width: rem(16), height: rem(16) }} stroke={1.5} />}
        >
          {t('transportation_car_taxi', 'Car')}
        </Menu.Item>
        <Menu.Item
          onClick={() => {
            onClick('boat');
          }}
          leftSection={<IconShip style={{ width: rem(16), height: rem(16) }} stroke={1.5} />}
        >
          {t('transportation_boat', 'Boat')}
        </Menu.Item>
        <Menu.Item
          onClick={() => {
            onClick('train');
          }}
          leftSection={<IconTrain style={{ width: rem(16), height: rem(16) }} stroke={1.5} />}
        >
          {t('transportation_train', 'Train')}
        </Menu.Item>

        <Menu.Divider />
        <Menu.Item
          onClick={() => {
            onClick('car_rental');
          }}
          leftSection={<IconCar style={{ width: rem(16), height: rem(16) }} stroke={1.5} />}
        >
          {t('transportation_rental_car', 'Car Rental')}
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
};
