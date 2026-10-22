import {hashBytes,frameUtf8,bytesToHex} from '../contracts/hashing.js';
import {D9_PROFILE} from '../content/world_profile_d9.js';
export async function worldIdentity(seed,domain,parts,sha256){const tuple=['SAQ-WORLD-D9',D9_PROFILE.version,seed,domain,...parts.map(String)],digest=bytesToHex(await hashBytes(frameUtf8(tuple),sha256));return {id:domain+':'+digest.slice(0,32),digest,tuple};}
