import {useTranslation} from "react-i18next";
import {useMediaQuery} from "@mantine/hooks";
import {Button, Menu, rem} from "@mantine/core";
import {IconChevronDown, IconPencil, IconPhoto, IconTrash, IconUsers} from "@tabler/icons-react";
import {closeModal, openContextModal} from "@mantine/modals";
import {Trip} from "../../../types/trips.ts";


export const BasicInfoMenu = ({trip, refetch}: {
  trip: Trip,
  refetch: () => void,
}) => {
  const {t} = useTranslation();
  const isMobile = useMediaQuery('(max-width: 50em)');

  return (<Menu>
    <Menu.Target>
      <Button
        rightSection={
          <IconChevronDown style={{width: rem(18), height: rem(18)}} stroke={1.5}/>
        }
        pr={12}
      >
        {t('actions', 'Actions')}
      </Button>
    </Menu.Target>
    <Menu.Dropdown>
      <Menu.Item
        onClick={() => {
          openContextModal({
            modal: 'editBasicInfoForm',
            title: t('edit_trip', 'Edit Trip'),
            radius: 'md',
            withCloseButton: false,
            fullScreen: isMobile,
            innerProps: {
              trip: trip,
              onSave: () => {
                console.log("Onsave called")
                refetch()
              }
            },
          });
        }}
        leftSection={
          <IconPencil
            style={{width: rem(16), height: rem(16)}}
            stroke={1.5}
          />
        }
      >
        {t('edit', 'Edit')}
      </Menu.Item>
      <Menu.Item
        onClick={() => {
          openContextModal({
            modal: 'uploadCoverImageForm',
            title: t('basic.add_cover_image', 'Add Cover Image'),
            radius: 'md',
            withCloseButton: false,
            fullScreen: isMobile,
            innerProps: {
              trip: trip,
              refetch: refetch
            },
          });

        }}
        leftSection={
          <IconPhoto
            style={{width: rem(16), height: rem(16)}}
            stroke={1.5}
          />
        }
      >
        {t('basic.add_cover_image', 'Add Cover Image')}
      </Menu.Item>
      <Menu.Item
        onClick={() => {
          openContextModal({
            modal: 'genericTransportationForm',
            title: t('transportation.add_new_flight', 'Add Flight'),
            radius: 'md',
            withCloseButton: false,
            fullScreen: isMobile,
            innerProps: {
              transportationType: 'flight',
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
          <IconUsers
            style={{width: rem(16), height: rem(16)}}
            stroke={1.5}
          />
        }
      >
        {t('basic.add_cover_image', 'Add Collaborators')}
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item
        c={"red"}
        onClick={() => {
          openContextModal({
            modal: 'genericTransportationForm',
            title: t('transportation.add_new_flight', 'Add Flight'),
            radius: 'md',
            withCloseButton: false,
            fullScreen: isMobile,
            innerProps: {
              transportationType: 'flight',
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
          <IconTrash
            style={{width: rem(16), height: rem(16)}}
            stroke={1.5}
          />
        }
      >
        {t('delete', 'Delete')}
      </Menu.Item>

    </Menu.Dropdown>
  </Menu>)
}