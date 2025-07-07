import { animate, AnimationTriggerMetadata, style, transition, trigger } from '@angular/animations';
import { ANIMATION_TIMING } from './constants.animations';

export const triggerOpacityAnimations = (timing: string = ANIMATION_TIMING): AnimationTriggerMetadata =>
  trigger('opacityAnimations', [
    transition(':enter', [style({ opacity: '0' }), animate(timing, style({ opacity: '1' }))]),
    transition(':leave', [style({ opacity: '1' }), animate(timing, style({ opacity: '0' }))]),
    transition('void => hide', animate('0s')),
  ]);
