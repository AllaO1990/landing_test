import { animate, AnimationTriggerMetadata, style, transition, trigger } from '@angular/animations';
import { ANIMATION_TIMING } from './constants.animations';

export const triggerWidthAnimations: AnimationTriggerMetadata = trigger('widthAnimations', [
  transition(':enter', [
    style({ width: '0', opacity: '0' }),
    animate(ANIMATION_TIMING, style({ width: '*', opacity: '1' })),
  ]),
  transition(':leave', [
    style({ width: '*', opacity: '1' }),
    animate(ANIMATION_TIMING, style({ width: '0', opacity: '0' })),
  ]),
  transition('void => hide', animate('0s')),
]);
