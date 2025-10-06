import { IconBedFlat, IconBuildingEstate, IconHome, IconTent } from '@tabler/icons-react';

import { LodgingType } from '../../../types/trips.ts';

export const typeIcons = {
  [LodgingType.HOTEL]: IconBuildingEstate,
  [LodgingType.HOME]: IconHome,
  [LodgingType.RENTAL]: IconBedFlat,
  [LodgingType.CAMP_SITE]: IconTent,
};
