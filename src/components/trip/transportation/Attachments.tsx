import {Transportation} from "../../../types/trips.ts";
import {Anchor, Badge, CloseButton, Group, Text} from "@mantine/core";
import {deleteTransportationAttachment, getAttachmentUrl} from "../../../lib";
import {IconFile} from "@tabler/icons-react";
import {useTranslation} from "react-i18next";
import {openConfirmModal} from "@mantine/modals";
import {notifications} from "@mantine/notifications";

export const Attachments = ({transportation, refetch}: { transportation: Transportation, refetch: () => void }) => {

  const {t} = useTranslation()

  return (
    <>
      {transportation.attachments && transportation.attachments.length > 0 && <Group p={"sm"}>
        {(transportation.attachments || []).map((attachmentName: string) => {
          return (
            <Anchor href={getAttachmentUrl(transportation, attachmentName)} target={"_blank"} key={attachmentName}>
              <Badge variant={"transparent"} size={"xl"} bd={"1px solid #ccc"} radius={0}
                     leftSection={<IconFile/>}
                     rightSection={<CloseButton
                       title={t('delete_attachment', 'Delete Attachment')}
                       onClick={(event) => {
                         openConfirmModal({
                           title: t('delete_attachment', 'Delete Attachment'),
                           confirmProps: { color: 'red' },
                           children: (
                             <Text size="sm">
                               {t('attachment_deletion_confirmation', 'This action cannot be undone.')}
                             </Text>
                           ),
                           labels: {confirm: t('delete', 'Delete'), cancel: t('cancel', 'Cancel')},
                           onCancel: () => console.log('Cancel'),
                           onConfirm: () => {
                             deleteTransportationAttachment(transportation.id, attachmentName).then(() => {
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