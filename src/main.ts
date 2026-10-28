import './style.css';
import './mobile/mobile.css';
import { params } from './shell';
import { startDesktop } from './desktop';
import { startMobile } from './mobile/app';

// Phones and tablets (touch-first or narrow) get the mobile layout; ?ui=desktop|mobile overrides.
function wantMobile(): boolean {
  const forced = params.get('ui');
  if (forced === 'mobile') return true;
  if (forced === 'desktop') return false;
  const coarse = window.matchMedia('(pointer: coarse)').matches && !window.matchMedia('(any-pointer: fine)').matches;
  return coarse || window.innerWidth < 900;
}

if (wantMobile()) startMobile();
else startDesktop();
