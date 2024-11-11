import { EditBasicInfoForm } from '../components/trip/basic/EditBasicInfoForm.tsx';
import { UploadImageForm } from '../components/upload/UploadImageForm.tsx';
import { CarRentalForm } from '../components/trip/transportation/CarRentalForm.tsx';
import { GenericTransportationModeForm } from '../components/trip/transportation/GenericTransportationModeForm.tsx';
import { Collaborators } from '../components/trip/basic/Collaborators.tsx';
import { GenericLodgingForm } from '../components/trip/lodging/GenericLodgingForm.tsx';
import { AttachmentViewer } from '../components/trip/attachments/AttachmentViewer.tsx';

export const modals = {
  editBasicInfoForm: EditBasicInfoForm,
  uploadImageForm: UploadImageForm,
  carRentalForm: CarRentalForm,
  genericTransportationForm: GenericTransportationModeForm,
  collaboratorsForm: Collaborators,
  genericLodgingForm: GenericLodgingForm,
  attachmentViewer: AttachmentViewer,
};

declare module '@mantine/modals' {
  export interface MantineModalsOverride {
    modals: typeof modals;
  }
}
