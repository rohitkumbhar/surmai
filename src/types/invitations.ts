import { Entity } from "./trips";

export type InvitationMetadata = {
  trip: {
    name: string;
    description?: string;
    startDate: Date;
    endDate: Date;
  };
  sender: {
    name: string;
  };
};

export type Invitation = Entity & {
  message: string;
  from: string;
  metadata: InvitationMetadata;
  trip: string;
};
