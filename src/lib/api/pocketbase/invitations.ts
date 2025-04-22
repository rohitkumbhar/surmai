import { pb } from './pocketbase.ts';
import { Invitation } from '../../../types/invitations.ts';

export const sendCollaborationInvitation = (email: string, message: string, tripId: string): Promise<Invitation> => {
  return pb.collection('invitations').create({
    recipientEmail: email.toLowerCase(),
    message,
    trip: tripId,
  });
};

export const listInvitations = (): Promise<Invitation[]> => {
  return pb
    .collection('invitations')
    .getList(1, 50, {
      filter: `status="open"`,
      sort: '-created',
    })
    .then((result) => result.items as unknown as Invitation[]);
};

export const invitationAction = ({ invitationId, accept }: { invitationId: string; accept: boolean }) => {
  return pb.collection('invitations').update(invitationId, {
    status: accept ? 'accepted' : 'rejected',
  });
};
