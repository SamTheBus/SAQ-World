// Compatibility for cached clients from the rejected blanket-shading build.
// Preserve the original context and decoded image without changing any paint.
export const celShadeContext=context=>context;
export const prepareCelTexture=canvas=>canvas;
