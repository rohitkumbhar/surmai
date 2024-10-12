import {Lodging, Transportation} from "../../../types/trips.ts";
import {Anchor, Badge, CloseButton, Divider, Group, Text} from "@mantine/core";
import {getAttachmentUrl} from "../../../lib";
import {IconFile} from "@tabler/icons-react";
import {useTranslation} from "react-i18next";
import {openConfirmModal} from "@mantine/modals";
import {notifications} from "@mantine/notifications";

export const Attachments = ({entity, refetch, onDelete}: {
  entity: Transportation | Lodging,
  refetch: () => void,
  onDelete: (attachmentName: string) => Promise<unknown>
}) => {

  const {t} = useTranslation()

  return (
    <>
      <Divider/>
      {entity.attachments && entity.attachments.length > 0 && <Group p={"sm"}>

        {(entity.attachments || []).map((attachmentName: string) => {
          return (
            <Anchor href={getAttachmentUrl(entity, attachmentName)} target={"_blank"} key={attachmentName}>
              <Badge variant={"transparent"} size={"lg"} radius={0}
                     leftSection={<IconFile/>}
                     rightSection={<CloseButton
                       title={t('delete_attachment', 'Delete Attachment')}
                       onClick={(event) => {
                         openConfirmModal({
                           title: t('delete_attachment', 'Delete Attachment'),
                           confirmProps: {color: 'red'},
                           children: (
                             <Text size="sm">
                               {t('attachment_deletion_confirmation', 'This action cannot be undone.')}
                             </Text>
                           ),
                           labels: {confirm: t('delete', 'Delete'), cancel: t('cancel', 'Cancel')},
                           onCancel: () => console.log('Cancel'),
                           onConfirm: () => {
                             onDelete(attachmentName)
                               .then(() => {
                                 notifications.show({
                                   title: 'Attachment deleted',
                                   message: `${attachmentName} has been deleted`,
                                   position: 'top-right'
                                 })
                                 refetch()
                               })
                           },
                         })

                         event.preventDefault()

                       }}/>}>{attachmentName}</Badge>
            </Anchor>
          )
        })}
      </Group>}

    </>
  )
}