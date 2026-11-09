/* =========================================================
   QR CODE — self-contained encoder (byte mode, versions 1–40)
   Follows ISO/IEC 18004; structure after Nayuki's reference
   implementation (MIT). No network, no library.
   qrSvg(text,{ecl:"M",border:2}) -> "<svg …>"
   ========================================================= */
const QR=(()=>{
  const ECL={L:[0,1],M:[1,0],Q:[2,3],H:[3,2]}; // [table index, format bits]
  const ECC_PER_BLOCK=[
    [-1,7,10,15,20,26,18,20,24,30,18,20,24,26,30,22,24,28,30,28,28,28,28,30,30,26,28,30,30,30,30,30,30,30,30,30,30,30,30,30,30],
    [-1,10,16,26,18,24,16,18,22,22,26,30,22,22,24,24,28,28,26,26,26,26,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28],
    [-1,13,22,18,26,18,24,18,22,20,24,28,26,24,20,30,24,28,28,26,30,28,30,30,30,30,28,30,30,30,30,30,30,30,30,30,30,30,30,30,30],
    [-1,17,28,22,16,22,28,26,26,24,28,24,28,22,24,24,30,28,28,26,28,30,24,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30]];
  const NUM_BLOCKS=[
    [-1,1,1,1,1,1,2,2,2,2,4,4,4,4,4,6,6,6,6,7,8,8,9,9,10,12,12,12,13,14,15,16,17,18,19,19,20,21,22,24,25],
    [-1,1,1,1,2,2,4,4,4,5,5,5,8,9,9,10,10,11,13,14,16,17,17,18,20,21,23,25,26,28,29,31,33,35,37,38,40,43,45,47,49],
    [-1,1,1,2,2,4,4,6,6,8,8,8,10,12,16,12,17,16,18,21,20,23,23,25,27,29,34,34,35,38,40,43,45,48,51,53,56,59,62,65,68],
    [-1,1,1,2,4,4,4,5,6,8,8,11,11,16,16,18,16,19,21,25,25,25,34,30,32,35,37,40,42,45,48,51,54,57,60,63,66,70,74,77,81]];
  const rawModules=v=>{let r=(16*v+128)*v+64;if(v>=2){const n=Math.floor(v/7)+2;r-=(25*n-10)*n-55;if(v>=7)r-=36}return r};
  const dataCodewords=(v,e)=>Math.floor(rawModules(v)/8)-ECC_PER_BLOCK[e][v]*NUM_BLOCKS[e][v];
  /* GF(256) Reed–Solomon */
  const mul=(x,y)=>{let z=0;for(let i=7;i>=0;i--){z=(z<<1)^((z>>>7)*0x11D);z^=((y>>>i)&1)*x}return z&0xFF};
  function divisor(deg){const r=new Array(deg).fill(0);r[deg-1]=1;let root=1;for(let i=0;i<deg;i++){for(let j=0;j<r.length;j++){r[j]=mul(r[j],root);if(j+1<r.length)r[j]^=r[j+1]}root=mul(root,2)}return r}
  function remainder(data,div){const r=div.map(()=>0);for(const b of data){const f=b^r.shift();r.push(0);div.forEach((c,i)=>r[i]^=mul(c,f))}return r}
  const alignPos=(v,size)=>{if(v===1)return[];const n=Math.floor(v/7)+2,step=v===32?26:Math.ceil((v*4+4)/(n*2-2))*2;const r=[6];for(let p=size-7;r.length<n;p-=step)r.splice(1,0,p);return r};
  const MASKS=[(x,y)=>(x+y)%2===0,(x,y)=>y%2===0,(x,y)=>x%3===0,(x,y)=>(x+y)%3===0,(x,y)=>(Math.floor(x/3)+Math.floor(y/2))%2===0,(x,y)=>x*y%2+x*y%3===0,(x,y)=>(x*y%2+x*y%3)%2===0,(x,y)=>((x+y)%2+x*y%3)%2===0];

  function encode(text,eclName="M"){
    const bytes=Array.from(new TextEncoder().encode(text));const [e,fmtBits]=ECL[eclName];
    let ver=1,cap;
    for(;ver<=40;ver++){cap=dataCodewords(ver,e)*8;const need=4+(ver<10?8:16)+bytes.length*8;if(need<=cap)break}
    if(ver>40)throw new Error("QR: text too long");
    const bits=[];const put=(val,len)=>{for(let i=len-1;i>=0;i--)bits.push((val>>>i)&1)};
    put(4,4);put(bytes.length,ver<10?8:16);bytes.forEach(b=>put(b,8));
    put(0,Math.min(4,cap-bits.length));put(0,(8-bits.length%8)%8);
    for(let p=0xEC;bits.length<cap;p^=0xEC^0x11)put(p,8);
    const data=[];for(let i=0;i<bits.length;i+=8)data.push(parseInt(bits.slice(i,i+8).join(""),2));
    /* error correction + interleaving */
    const nb=NUM_BLOCKS[e][ver],eccLen=ECC_PER_BLOCK[e][ver],raw=Math.floor(rawModules(ver)/8),nShort=nb-raw%nb,shortLen=Math.floor(raw/nb);
    const div=divisor(eccLen),blocks=[];
    for(let i=0,k=0;i<nb;i++){const dat=data.slice(k,k+shortLen-eccLen+(i<nShort?0:1));k+=dat.length;const ecc=remainder(dat,div);if(i<nShort)dat.push(0);blocks.push(dat.concat(ecc))}
    const all=[];for(let i=0;i<blocks[0].length;i++)blocks.forEach((b,j)=>{if(i!==shortLen-eccLen||j>=nShort)all.push(b[i])});
    /* matrix */
    const size=ver*4+17,M=[...Array(size)].map(()=>Array(size).fill(false)),F=[...Array(size)].map(()=>Array(size).fill(false));
    const set=(x,y,d)=>{M[y][x]=d;F[y][x]=true};
    for(let i=0;i<size;i++){set(6,i,i%2===0);set(i,6,i%2===0)}
    const finder=(cx,cy)=>{for(let dy=-4;dy<=4;dy++)for(let dx=-4;dx<=4;dx++){const x=cx+dx,y=cy+dy,d=Math.max(Math.abs(dx),Math.abs(dy));if(x>=0&&x<size&&y>=0&&y<size)set(x,y,d!==2&&d!==4)}};
    finder(3,3);finder(size-4,3);finder(3,size-4);
    const ap=alignPos(ver,size),n=ap.length;
    for(let i=0;i<n;i++)for(let j=0;j<n;j++){if((i===0&&j===0)||(i===0&&j===n-1)||(i===n-1&&j===0))continue;for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)set(ap[i]+dx,ap[j]+dy,Math.max(Math.abs(dx),Math.abs(dy))!==1)}
    const drawFormat=mask=>{const d=fmtBits<<3|mask;let r=d;for(let i=0;i<10;i++)r=(r<<1)^((r>>>9)*0x537);const b=(d<<10|r)^0x5412,g=i=>((b>>>i)&1)===1;
      for(let i=0;i<=5;i++)set(8,i,g(i));set(8,7,g(6));set(8,8,g(7));set(7,8,g(8));for(let i=9;i<15;i++)set(14-i,8,g(i));
      for(let i=0;i<8;i++)set(size-1-i,8,g(i));for(let i=8;i<15;i++)set(8,size-15+i,g(i));set(8,size-8,true)};
    drawFormat(0);
    if(ver>=7){let r=ver;for(let i=0;i<12;i++)r=(r<<1)^((r>>>11)*0x1F25);const b=ver<<12|r;for(let i=0;i<18;i++){const bit=((b>>>i)&1)===1,a=size-11+i%3,c=Math.floor(i/3);set(a,c,bit);set(c,a,bit)}}
    let i=0;
    for(let right=size-1;right>=1;right-=2){if(right===6)right=5;for(let v=0;v<size;v++)for(let j=0;j<2;j++){const x=right-j,up=((right+1)&2)===0,y=up?size-1-v:v;if(!F[y][x]&&i<all.length*8){M[y][x]=((all[i>>>3]>>>(7-(i&7)))&1)===1;i++}}}
    /* choose the mask with the lowest penalty */
    const apply=m=>{for(let y=0;y<size;y++)for(let x=0;x<size;x++)if(!F[y][x]&&MASKS[m](x,y))M[y][x]=!M[y][x]};
    const penalty=()=>{let p=0,dark=0;
      for(let y=0;y<size;y++){let rx=1,ry=1;for(let x=0;x<size;x++){if(M[y][x])dark++;
        if(x>0){if(M[y][x]===M[y][x-1]){rx++;if(rx===5)p+=3;else if(rx>5)p++}else rx=1;if(M[x][y]===M[x-1][y]){ry++;if(ry===5)p+=3;else if(ry>5)p++}else ry=1}
        if(x<size-1&&y<size-1){const c=M[y][x];if(c===M[y][x+1]&&c===M[y+1][x]&&c===M[y+1][x+1])p+=3}}}
      const k=Math.ceil(Math.abs(dark*20-size*size*10)/(size*size))-1;return p+Math.max(0,k)*10};
    let best=0,bestP=Infinity;
    for(let m=0;m<8;m++){apply(m);drawFormat(m);const s=penalty();if(s<bestP){bestP=s;best=m}apply(m)}
    apply(best);drawFormat(best);
    return{size,modules:M,version:ver};
  }
  function svg(text,{ecl="M",border=2,dark="#0d2a21",light="#ffffff",title=""}={}){
    const q=encode(text,ecl),n=q.size+border*2;let d="";
    for(let y=0;y<q.size;y++)for(let x=0;x<q.size;x++)if(q.modules[y][x])d+=`M${x+border},${y+border}h1v1h-1z`;
    return`<svg class="qr" viewBox="0 0 ${n} ${n}" shape-rendering="crispEdges" role="img" aria-label="${title||"QR code"}"><rect width="${n}" height="${n}" fill="${light}"/><path d="${d}" fill="${dark}"/></svg>`;
  }
  return{encode,svg};
})();
const qrSvg=(text,o)=>QR.svg(text,o);
