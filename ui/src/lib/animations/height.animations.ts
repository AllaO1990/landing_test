import { animate, AnimationTriggerMetadata, style, transition, trigger } from '@angular/animations';
import { ANIMATION_TIMING } from './constants.animations';

export const triggerHeightAnimations: AnimationTriggerMetadata = trigger('heightAnimations', [
  transition(':enter', [
    style({ height: '0', opacity: '0' }),
    animate(ANIMATION_TIMING, style({ height: '*', opacity: '1' })),
  ]),
  transition(':leave', [
    style({ height: '*', opacity: '1' }),
    animate(ANIMATION_TIMING, style({ height: '0', opacity: '0' })),
  ]),
  transition('void => hide', animate('0s')),
]);
