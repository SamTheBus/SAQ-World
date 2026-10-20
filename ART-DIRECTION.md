# SAQ World art direction

The world and mobs use cel shading. This is Sammy's required visual direction.

- Build readable, solid silhouettes with crisp dark outlines.
- Use a small palette for each material: base color, hard shadow, and a restrained highlight.
- Keep the main light above and to the left. Place sharp shadow shapes below and to the right.
- Use the same treatment for terrain, buildings, props, characters, mobs, and their attack anatomy.
- Preserve solid body masses on magical and neon creatures. Use emissive marks as details.
- Keep silhouettes readable at normal gameplay zoom on a phone.
- Avoid soft gradient shading, painterly surface noise, and outline-only bodies.
- Animate the actual front attack anatomy. Supporting legs keep supporting the body.

The shared creature material renderer applies this direction to every ordinary
family, every elite body, the boss, boss cocoons, and the fallback enemy. The
five clockwork and arthropod redesigns also use hand-authored color planes.

World vector art uses the same hard material bands. Raster terrain and scenery
kits are simplified into discrete tones when decoded, once per cached asset.
World geometry, collision, culling, animation, gameplay, and saves stay intact.
The underlying temporary assets can still be replaced with final art. Any
replacement must retain this visual direction.
