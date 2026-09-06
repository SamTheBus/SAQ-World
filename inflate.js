const encoded = globalThis.__SAQ_GZ_B64__;
if (!encoded) throw new Error("Missing bundled SAQ module data");
const compressed = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0));
const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream("gzip"));
globalThis.__SAQ_MODULES__ = JSON.parse(await new Response(stream).text());
await import("./game.js?v=d585fe8eb952e738");
