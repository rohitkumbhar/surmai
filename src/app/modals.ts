import { EditBasicInfoForm } from '../components/trip/basic/EditBasicInfoForm.tsx';
import { UploadImageForm } from '../components/upload/UploadImageForm.tsx';
import { Collaborators } from '../components/trip/basic/Collaborators.tsx';
import { AttachmentViewer } from '../components/trip/attachments/AttachmentViewer.tsx';

export const modals = {
  editBasicInfoForm: EditBasicInfoForm,
  uploadImageForm: UploadImageForm,
  collaboratorsForm: Collaborators,
  attachmentViewer: AttachmentViewer,
};

declare module '@mantine/modals' {
  export interface MantineModalsOverride {
    modals: typeof modals;
  }
}
