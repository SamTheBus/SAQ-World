import {drawWireframeOrbV4 as draw_wireframe_orb} from './creature_presentation_wireframe_orb_v4.js';
import {drawClockworkScarabV3 as draw_clockwork_scarab,drawTemporalWatcherV3 as draw_temporal_watcher,drawClockworkDroneV3 as draw_clockwork_drone} from './creature_presentation_clockwork_v3.js';
import {drawStarWeaverV3 as draw_star_weaver,drawNeonSpiderV3 as draw_neon_spider} from './creature_presentation_arthropods_v3.js';
import {drawCyberWraithV4 as draw_cyber_wraith} from './creature_presentation_cyber_wraith_v4.js';
// Source motifs adapted from SAQ Dungeon 387c78bfaf9f492fe7b6ff4539b956c12c2a7cdc,
// mob_renderer.js ordinary vType branches. World owns simulation and timing.
// These creatures retain contact actions; the Drone also fires ranged bolts.
// The lenses and lattice are body art, with World owning all hit authority.
export const DUNGEON_MOB_PAINTERS_V2B=Object.freeze({clockwork_scarab:draw_clockwork_scarab,star_weaver:draw_star_weaver,temporal_watcher:draw_temporal_watcher,clockwork_drone:draw_clockwork_drone,neon_spider:draw_neon_spider,wireframe_orb:draw_wireframe_orb,cyber_wraith:draw_cyber_wraith});
