import {plantArt} from './garden-sprites.mjs?v=20261015-20';
import {gardenIcon} from './garden-icons.mjs?v=20261020-24';

// Layout placeholders only. No SDK, ad requests, tracking, reward grants or
// progression interception. A real provider must be connected separately.
export const AD_PLACEMENTS=Object.freeze({
  'home-banner':Object.freeze({kind:'banner',title:'시작 화면 배너',headline:'광고 준비 중',detail:'배너 자리 · 실제 광고 없음'}),
  'result-reward':Object.freeze({kind:'reward',title:'선택형 보상 광고',headline:'보너스 꽃잎',detail:'선택형 광고 자리 · 보상 미적용'}),
});

export function adSlotHTML(id){
 if(!Object.hasOwn(AD_PLACEMENTS,id))return '';
 const item=AD_PLACEMENTS[id];
 return `<section class="garden-ad-slot garden-ad-slot--${item.kind}" data-ad-slot="${id}" aria-label="${item.title} 자리 · 미리보기"><span class="ad-tag">AD</span><div class="ad-slot-copy"><strong>${item.headline}</strong><small>${item.detail}</small></div><button type="button" class="ad-preview-button" data-ad-preview="${id}" aria-haspopup="dialog" aria-label="${item.title} 미리보기 · 실제 광고와 보상 없음">미리보기</button></section>`;
}

export function installAdPreview(doc=document){
 const dialog=doc.getElementById('ad-preview');if(!dialog)return null;
 let opener=null;
 function close(){if(dialog.open)dialog.close();}
 function open(id,trigger){
  if(!Object.hasOwn(AD_PLACEMENTS,id)||dialog.open)return false;
  const placement=AD_PLACEMENTS[id];
  opener=trigger;
  dialog.innerHTML=`<div class="sheet-heading ad-preview-heading"><div><p class="eyebrow">광고 미리보기</p><h2 id="ad-preview-title">${placement.title}</h2></div><button type="button" class="icon-button" data-close-ad aria-label="광고 미리보기 닫기">${gardenIcon('close')}</button></div><div class="ad-preview-stage" data-ad-kind="${placement.kind}"><span class="ad-tag">AD · 화면 예시</span><div class="ad-preview-art" aria-hidden="true">${plantArt('lavender',2)}</div><strong class="ad-preview-headline">잠깐의 쉼,<br>작은 선물</strong><p>${placement.kind==='reward'?'선택해서 보는 광고가 들어갈 자리예요.':'배너를 누른 뒤 보이는 화면의 예시예요.'}</p></div><p class="ad-preview-note">실제 광고를 재생하지 않으며<br>꽃잎이나 점수는 지급되지 않아요.</p><button type="button" class="secondary ad-preview-back" data-close-ad>${placement.kind==='reward'?'보상 없이 결과로 돌아가기':'시작 화면으로 돌아가기'}</button>`;
  dialog.showModal();dialog.querySelector('[data-close-ad]')?.focus({preventScroll:true});return true;
 }
 const click=event=>{const button=event.target.closest?.('[data-ad-preview]');if(button)open(button.dataset.adPreview,button);};
 const dialogClick=event=>{if(event.target.closest?.('[data-close-ad]'))close();};
 const onClose=()=>{if(opener?.isConnected)opener.focus({preventScroll:true});opener=null;};
 const cancel=event=>{event.preventDefault();close();};
 const landscape=doc.defaultView?.matchMedia('(orientation: landscape) and (pointer: coarse), (orientation: landscape) and (max-height: 600px) and (max-width: 1000px)');
 const rotate=()=>{if(landscape.matches)close();};
 doc.addEventListener('click',click);dialog.addEventListener('click',dialogClick);dialog.addEventListener('close',onClose);dialog.addEventListener('cancel',cancel);landscape?.addEventListener('change',rotate);
  return {close,destroy(){close();onClose();doc.removeEventListener('click',click);dialog.removeEventListener('click',dialogClick);dialog.removeEventListener('close',onClose);dialog.removeEventListener('cancel',cancel);landscape?.removeEventListener('change',rotate);}};
}
