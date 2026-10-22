import {celShadeContext} from './cel_materials_v1.js';
import {drawArachnidTreantD12_5A,drawTreantCocoonD12_5A} from './boss_presentation_d12_5.js';
import {drawProofSlime} from './hero_presentation.js';
export const drawCelBoss=(c,...args)=>drawArachnidTreantD12_5A(celShadeContext(c),...args);
export const drawCelCocoon=(c,...args)=>drawTreantCocoonD12_5A(celShadeContext(c),...args);
export const drawCelFallbackMob=(c,...args)=>drawProofSlime(celShadeContext(c),...args);
