import { LodgingType } from '../../../types/trips.ts';
import { IconBedFlat, IconBuildingEstate, IconHome, IconTent } from '@tabler/icons-react';

export const typeIcons = {
  [LodgingType.HOTEL]: IconBuildingEstate,
  [LodgingType.HOME]: IconHome,
  [LodgingType.RENTAL]: IconBedFlat,
  [LodgingType.CAMP_SITE]: IconTent,
};
