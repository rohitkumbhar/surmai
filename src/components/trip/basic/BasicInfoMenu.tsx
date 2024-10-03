import {useTranslation} from "react-i18next";
import {useMediaQuery} from "@mantine/hooks";
import {Button, Menu, rem, Text} from "@mantine/core";
import {IconChevronDown, IconPencil, IconPhoto, IconTrash, IconUsers} from "@tabler/icons-react";
import {closeModal, openConfirmModal, openContextModal} from "@mantine/modals";
import {Trip} from "../../../types/trips.ts";
import {deleteTrip} from "../../../lib";
import {notifications} from "@mantine/notifications";


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
            size: "auto",
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
            modal: 'collaboratorsForm',
            title: t('basic.add_collaborators', 'Add Collaborators'),
            radius: 'md',
            withCloseButton: false,
            fullScreen: isMobile,
            size: "auto",
            innerProps: {
              trip: trip,
              onSave: () => {
                refetch()
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
      <Menu.Divider/>
      <Menu.Item
        c={"red"}
        onClick={() => {
          openConfirmModal({
            title: t('delete_trip', 'Delete Trip'),
            confirmProps: {color: 'red'},
            children: (
              <Text size="sm">
                {t('deletion_confirmation', 'This action cannot be undone.')}
              </Text>
            ),
            labels: {confirm: t('delete', 'Delete'), cancel: t('cancel', 'Cancel')},
            onCancel: () => {

            },
            onConfirm: () => {
              deleteTrip(trip.id).then(() => {
                notifications.show({
                  title: 'Deleted',
                  message: `Trip ${trip.name} has been deleted`,
                  position: 'top-right'
                })
                refetch()
              })
            },
          })
        }
        }
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