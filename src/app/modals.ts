import { EditBasicInfoForm } from '../components/trip/basic/EditBasicInfoForm.tsx';
import { UploadImageForm } from '../components/upload/UploadImageForm.tsx';
import { Collaborators } from '../components/trip/basic/collaborators/Collaborators.tsx';
import { AttachmentViewer } from '../components/trip/attachments/AttachmentViewer.tsx';
import { ExportTripModal } from '../components/trip/basic/ExportTripModal.tsx';
import { InviteUserModal } from '../components/settings/InviteUserModal.tsx';
import { ExportTripCalendarModal } from '../components/trip/basic/ExportTripCalendar.tsx';

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
