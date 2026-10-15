// Third-stage ornaments surround the existing plant art without changing its bitmap.
const colors = {sunflower:'#ffd24b',clover:'#8ef2a4',berry:'#ff779d',lavender:'#c99bff',mushroom:'#aabfff',hive:'#ffcf69'};
const branches = {sunflower:['twin','solar'],clover:['meadow','lucky'],berry:['cluster','jam'],lavender:['chorus','perfume'],mushroom:['colony','moon'],hive:['swarm','royal']};
const leaves = color => [0,1,2].map(i=>`<ellipse cx="${16+i*3}" cy="${73-i*11}" rx="4" ry="8" fill="${color}" transform="rotate(-35 ${16+i*3} ${73-i*11})"/><ellipse cx="${84-i*3}" cy="${73-i*11}" rx="4" ry="8" fill="${color}" transform="rotate(35 ${84-i*3} ${73-i*11})"/>`).join('');
function ornaments(type,color){
 if(type==='berry')return [18,30,70,82].map((x,i)=>`<circle cx="${x}" cy="${i%2?70:53}" r="7" fill="#ee6090" stroke="#ffe8ba" stroke-width="1.5"/><path d="M${x-4} ${i%2?64:47}l4-5 4 5" fill="#79c57a"/>`).join('');
 if(type==='mushroom')return [17,83].map(x=>`<path d="M${x-3} 65v13h6V65" fill="#ece7ff"/><path d="M${x-10} 66q0-18 10-18t10 18Z" fill="#9c8cf2" stroke="#e4d5ff" stroke-width="2"/><circle cx="${x-3}" cy="57" r="2" fill="#fff"/>`).join('');
 if(type==='hive')return '<path d="M33 18l-2-13 12 7 7-11 7 11 12-7-2 13Z" fill="#ffda69" stroke="#fff5bf" stroke-width="2"/><path d="M36 20h28" stroke="#ffb64b" stroke-width="4"/>';
 if(type==='lavender')return [16,84].map(x=>`<path d="M${x} 77V38" stroke="#64bda3" stroke-width="3"/><ellipse cx="${x}" cy="39" rx="6" ry="14" fill="#caa0ff" stroke="#f8e5ff" stroke-width="1.5"/>`).join('');
 return leaves(color);
}
export function masterArt(markup,type,id){
 if(!Object.hasOwn(colors,type)||!branches[type].includes(id))return markup;
 const color=colors[type];
 return `<span class="plant-art master-art master-art--${type}" data-master-evolution="${id}" aria-hidden="true"><svg class="master-aura" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="43" fill="${color}" opacity=".18"/><circle cx="50" cy="50" r="40" fill="none" stroke="${color}" stroke-width="2" stroke-dasharray="3 7"/></svg><span class="master-plant">${markup}</span><svg class="master-crown" viewBox="0 0 100 100" aria-hidden="true">${ornaments(type,color)}<path d="M50 3l3 6 6 3-6 3-3 6-3-6-6-3 6-3Z" fill="#fff1ac" stroke="#fffbe3"/><path d="M11 27l2 4 4 2-4 2-2 4-2-4-4-2 4-2ZM89 25l2 4 4 2-4 2-2 4-2-4-4-2 4-2Z" fill="${color}"/></svg></span>`;
}
