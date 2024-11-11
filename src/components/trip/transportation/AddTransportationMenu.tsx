import { Button, Menu, rem } from '@mantine/core';
import {
  IconBus,
  IconCar,
  IconChevronDown,
  IconPlane,
  IconShip,
  IconTrain,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { closeModal, openContextModal } from '@mantine/modals';
import { Trip } from '../../../types/trips.ts';
import { useMediaQuery } from '@mantine/hooks';

export const AddTransportationMenu = ({
  trip,
  refetch,
  onClick
}: {
  trip: Trip;
  onClick: (selectedType: string) => void
  refetch: () => void;
}) => {
  const { t } = useTranslation();
  const isMobile = useMediaQuery('(max-width: 50em)');
  return (
    <Menu
      transitionProps={{ transition: 'pop-top-right' }}
      position="bottom-end"
      width={150}
      withinPortal
    >
      <Menu.Target>
        <Button
          rightSection={
            <IconChevronDown
              style={{ width: rem(18), height: rem(18) }}
              stroke={1.5}
            />
          }
          pr={12}
        >
          {t('transportation.add_new', 'Add new')}
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item
          onClick={() => {
            // openContextModal({
            //   modal: 'genericTransportationForm',
            //   title: t('transportation.add_new_flight', 'Add Flight'),
            //   radius: 'md',
            //   withCloseButton: false,
            //   size: 'auto',
            //   fullScreen: isMobile,
            //   innerProps: {
            //     transportationType: 'flight',
            //     trip: trip,
            //     onSuccess: () => {
            //       closeModal('genericTransportationForm');
            //       refetch();
            //     },
            //     onCancel: () => {
            //       closeModal('genericTransportationForm');
            //     },
            //   },
            // });

            onClick('flight')

          }}
          leftSection={
            <IconPlane
              style={{ width: rem(16), height: rem(16) }}
              stroke={1.5}
            />
          }
        >
          {t('transportation.flight', 'Flight')}
        </Menu.Item>

        <Menu.Item
          onClick={() => {
            // openContextModal({
            //   modal: 'genericTransportationForm',
            //   title: t('transportation.add_bus', 'Add Bus'),
            //   radius: 'md',
            //   withCloseButton: false,
            //   size: 'auto',
            //   fullScreen: isMobile,
            //   innerProps: {
            //     transportationType: 'bus',
            //     trip: trip,
            //     onSuccess: () => {
            //       closeModal('genericTransportationForm');
            //       refetch();
            //     },
            //     onCancel: () => {
            //       closeModal('genericTransportationForm');
            //     },
            //   },
            // });
            onClick('bus')

          }}
          leftSection={
            <IconBus style={{ width: rem(16), height: rem(16) }} stroke={1.5} />
          }
        >
          {t('transportation.bus', 'Bus')}
        </Menu.Item>

        <Menu.Item
          onClick={() => {
            // openContextModal({
            //   modal: 'genericTransportationForm',
            //   title: t('transportation.add_boat', 'Add Car/Taxi'),
            //   radius: 'md',
            //   withCloseButton: false,
            //   size: 'auto',
            //   fullScreen: isMobile,
            //   innerProps: {
            //     transportationType: 'car',
            //     trip: trip,
            //     onSuccess: () => {
            //       closeModal('genericTransportationForm');
            //       refetch();
            //     },
            //     onCancel: () => {
            //       closeModal('genericTransportationForm');
            //     },
            //   },
            // });
            onClick('car')

          }}
          leftSection={
            <IconCar style={{ width: rem(16), height: rem(16) }} stroke={1.5} />
          }
        >
          {t('transportation.car_taxi', 'Car')}
        </Menu.Item>
        <Menu.Item
          onClick={() => {
            // openContextModal({
            //   modal: 'genericTransportationForm',
            //   title: t('transportation.add_boat', 'Add Boat Ride'),
            //   radius: 'md',
            //   withCloseButton: false,
            //   size: 'auto',
            //   fullScreen: isMobile,
            //   innerProps: {
            //     transportationType: 'boat',
            //     trip: trip,
            //     onSuccess: () => {
            //       closeModal('genericTransportationForm');
            //       refetch();
            //     },
            //     onCancel: () => {
            //       closeModal('genericTransportationForm');
            //     },
            //   },
            // });
            onClick('boat')

          }}
          leftSection={
            <IconShip
              style={{ width: rem(16), height: rem(16) }}
              stroke={1.5}
            />
          }
        >
          {t('transportation.boat', 'Boat')}
        </Menu.Item>
        <Menu.Item
          onClick={() => {
            // openContextModal({
            //   modal: 'genericTransportationForm',
            //   title: t('transportation.add_train', 'Add Train Ride'),
            //   radius: 'md',
            //   withCloseButton: false,
            //   size: 'auto',
            //   fullScreen: isMobile,
            //   innerProps: {
            //     transportationType: 'train',
            //     trip: trip,
            //     onSuccess: () => {
            //       closeModal('genericTransportationForm');
            //       refetch();
            //     },
            //     onCancel: () => {
            //       closeModal('genericTransportationForm');
            //     },
            //   },
            // });
            onClick('train')

          }}
          leftSection={
            <IconTrain
              style={{ width: rem(16), height: rem(16) }}
              stroke={1.5}
            />
          }
        >
          {t('transportation.train', 'Train')}
        </Menu.Item>

        <Menu.Divider />
        <Menu.Item
          onClick={() => {
            openContextModal({
              modal: 'carRentalForm',
              title: t('transportation.add_rental_car', 'Add Rental Car'),
              radius: 'md',
              withCloseButton: false,
              size: 'auto',
              fullScreen: isMobile,
              innerProps: {
                trip: trip,
                onSuccess: () => {
                  closeModal('carRentalForm');
                  refetch();
                },
                onCancel: () => {
                  closeModal('carRentalForm');
                },
              },
            });

            // setSelectedOption('rental_car')
          }}
          leftSection={
            <IconCar style={{ width: rem(16), height: rem(16) }} stroke={1.5} />
          }
        >
          {t('transportation.rental_car', 'Car Rental')}
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
};
