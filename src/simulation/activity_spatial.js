// Ephemeral spatial index. Instance is always part of the key; no durable IDs here.
export function createSpatialIndex(cellSize=256) {
  const cells=new Map(),keysById=new Map();
  const key=(instance,x,y)=>`${instance}/${x}/${y}`;
  function remove(id){for(const k of keysById.get(id)??[]){const c=cells.get(k);c.delete(id);if(!c.size)cells.delete(k);}keysById.delete(id);}
  function insert(id,instance,points){remove(id);const keys=new Set(points.map(p=>key(instance,Math.floor(p.x/cellSize),Math.floor(p.y/cellSize))));
    for(const k of keys){if(!cells.has(k))cells.set(k,new Set());cells.get(k).add(id);}keysById.set(id,keys);}
  function query(instance,point,radius){const ids=new Set();
    for(let y=Math.floor((point.y-radius)/cellSize);y<=Math.floor((point.y+radius)/cellSize);y++)
      for(let x=Math.floor((point.x-radius)/cellSize);x<=Math.floor((point.x+radius)/cellSize);x++)for(const id of cells.get(key(instance,x,y))??[])ids.add(id);
    return [...ids].sort();}
  return {insert,remove,query,stats:()=>({cells:cells.size,records:keysById.size})};
}
