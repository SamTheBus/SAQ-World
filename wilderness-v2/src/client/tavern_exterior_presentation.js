// Presentation only: dedicated tankard sign and a warm, understated threshold.
export function drawTavernEntrance(c,b,frontage){const x=frontage.x+39,y=frontage.y-29;
 c.fillStyle='#70573c';c.fillRect(x-2,y+4,4,30);c.fillStyle='#403327';c.strokeStyle='#d1b782';c.lineWidth=2;c.fillRect(x-17,y-14,34,26);c.strokeRect(x-17,y-14,34,26);
 c.fillStyle='#c6a369';c.fillRect(x-8,y-7,12,15);c.fillStyle='#e7d8ad';c.fillRect(x-9,y-9,15,4);c.strokeStyle='#c6a369';c.beginPath();c.roundRect(x+3,y-5,8,10,3);c.stroke();
 const dx=b.x*32,dy=b.doorPoint[1]*32;c.fillStyle='#bd9962';c.fillRect(dx-8,dy-8,16,5);c.fillStyle='#dec691';c.fillRect(dx-6,dy+32,12,4);c.fillStyle='#574839';c.fillRect(dx-20,dy+8,7,18);c.fillStyle='#e7bd67';c.fillRect(dx-18,dy+10,3,9);
}
