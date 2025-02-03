import { animate, AnimationTriggerMetadata, style, transition, trigger } from '@angular/animations';
import { ANIMATION_TIMING } from './constants.animations';

export const triggerOpacityAnimations: AnimationTriggerMetadata = trigger('opacityAnimations', [
  transition(':enter', [
    style({ opacity: '0' }),
    animate(ANIMATION_TIMING, style({ opacity: '1' })),
  ]),
  transition(':leave', [
    style({ opacity: '1' }),
    animate(ANIMATION_TIMING, style({ opacity: '0' })),
  ]),
  transition('void => hide', animate('0s')),
]);
