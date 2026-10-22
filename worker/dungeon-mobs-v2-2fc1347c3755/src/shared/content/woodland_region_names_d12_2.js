import {freezeWire,requireContract as check} from '../contracts/wire.js';

// Regional names are geography content. Cave generation consumes the region's
// authoritative display name and never invents a Fort-relative substitute.
export const WOODLAND_REGION_NAME_ROOTS_D12_2=freezeWire(['Alder','Moss','Green','Pine']);
export const WOODLAND_REGION_NAME_ENDINGS_D12_2=freezeWire(['wild','grove','wood','reach']);

export function woodlandRegionNameD12_2(rootIndex,endingIndex){
 check(Number.isInteger(rootIndex)&&Number.isInteger(endingIndex),'Invalid Woodland region name indices');
 return WOODLAND_REGION_NAME_ROOTS_D12_2[rootIndex%WOODLAND_REGION_NAME_ROOTS_D12_2.length]+WOODLAND_REGION_NAME_ENDINGS_D12_2[endingIndex%WOODLAND_REGION_NAME_ENDINGS_D12_2.length];
}
