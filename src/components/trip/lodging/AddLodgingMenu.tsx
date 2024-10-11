import {Button, Menu, rem} from '@mantine/core';
import {IconBedFlat, IconBuildingEstate, IconChevronDown, IconHome, IconTent,} from '@tabler/icons-react';
import {useTranslation} from "react-i18next";
import {closeModal, openContextModal} from '@mantine/modals';
import {Trip} from "../../../types/trips.ts";
import {useMediaQuery} from "@mantine/hooks";

export const AddLodgingMenu = ({trip, refetch}: {
  trip: Trip,
  refetch: () => void,
}) => {

  const {t} = useTranslation();
  const isMobile = useMediaQuery('(max-width: 50em)');
  return (
    <Menu
      transitionProps={{transition: 'pop-top-right'}}
      position="bottom-end"
      width={150}
      withinPortal
    >
      <Menu.Target>
        <Button
          rightSection={
            <IconChevronDown style={{width: rem(18), height: rem(18)}} stroke={1.5}/>
          }
          pr={12}
        >
          {t('lodging.add_new', 'Add new')}
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item
          onClick={() => {
            openContextModal({
              modal: 'genericLodgingForm',
              title: t('lodging.add_hotel', 'Add Hotel'),
              radius: 'md',
              size: 'auto',
              withCloseButton: isMobile,
              fullScreen: isMobile,
              innerProps: {
                trip: trip,
                type: 'hotel',
                onSuccess: () => {
                  refetch()
                },
                onCancel: () => {
                }
              },
            });

          }}
          leftSection={
            <IconBuildingEstate
              style={{width: rem(16), height: rem(16)}}
              stroke={1.5}
            />
          }
        >
          {t('lodging.hotel', 'Hotel')}
        </Menu.Item>

        <Menu.Item
          onClick={() => {
            openContextModal({
              modal: 'genericTransportationForm',
              title: t('transportation.add_bus', 'Add Bus'),
              radius: 'md',
              withCloseButton: isMobile,
              fullScreen: isMobile,
              innerProps: {
                transportationType: 'bus',
                trip: trip,
                onSuccess: () => {
                  closeModal('genericTransportationForm')
                  refetch()
                },
                onCancel: () => {
                  closeModal('genericTransportationForm')
                }
              },
            });
          }}
          leftSection={
            <IconHome
              style={{width: rem(16), height: rem(16)}}
              stroke={1.5}
            />
          }
        >
          {t('transportation.home_stay', 'Home')}
        </Menu.Item>

        <Menu.Item
          onClick={() => {

            openContextModal({
              modal: 'genericTransportationForm',
              title: t('transportation.add_boat', 'Add Car/Taxi'),
              radius: 'md',
              withCloseButton: isMobile,
              fullScreen: isMobile,
              innerProps: {
                transportationType: 'car',
                trip: trip,
                onSuccess: () => {
                  closeModal('genericTransportationForm')
                  refetch()
                },
                onCancel: () => {
                  closeModal('genericTransportationForm')
                }
              },
            });
          }}
          leftSection={
            <IconBedFlat
              style={{width: rem(16), height: rem(16)}}
              stroke={1.5}
            />
          }
        >
          {t('transportation.vacation_rental', 'Vac. Rental')}

        </Menu.Item>

        <Menu.Item
          onClick={() => {

            openContextModal({
              modal: 'genericTransportationForm',
              title: t('transportation.add_boat', 'Add Car/Taxi'),
              radius: 'md',
              withCloseButton: isMobile,
              fullScreen: isMobile,
              innerProps: {
                transportationType: 'car',
                trip: trip,
                onSuccess: () => {
                  closeModal('genericTransportationForm')
                  refetch()
                },
                onCancel: () => {
                  closeModal('genericTransportationForm')
                }
              },
            });
          }}
          leftSection={
            <IconTent
              style={{width: rem(16), height: rem(16)}}
              stroke={1.5}
            />
          }
        >
          {t('transportation.camp_site', 'Camp Site')}

        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}