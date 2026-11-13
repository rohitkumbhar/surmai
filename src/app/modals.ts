import { InviteUserModal } from '@src/components/settings/InviteUserModal.tsx';
import { AttachmentViewer } from '@src/components/trip/attachments/AttachmentViewer.tsx';
import { Collaborators } from '@src/components/trip/basic/collaborators/Collaborators.tsx';
import { EditBasicInfoForm } from '@src/components/trip/basic/EditBasicInfoForm.tsx';
import { ExportTripCalendarModal } from '@src/components/trip/basic/ExportTripCalendar.tsx';
import { ExportTripModal } from '@src/components/trip/basic/ExportTripModal.tsx';
import { UploadImageForm } from '@src/components/upload/UploadImageForm.tsx';

export const modals = {
  editBasicInfoForm: EditBasicInfoForm,
  uploadImageForm: UploadImageForm,
  collaboratorsForm: Collaborators,
  attachmentViewer: AttachmentViewer,
  exportTripModal: ExportTripModal,
  exportTripCalendarModal: ExportTripCalendarModal,
  inviteUsersFormModal: InviteUserModal,
};

declare module '@mantine/modals' {
  export interface MantineModalsOverride {
    modals: typeof modals;
  }
}
