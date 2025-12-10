import { animate, AnimationTriggerMetadata, state, style, transition, trigger } from '@angular/animations';
import { ANIMATION_TIMING } from './constants.animations';

export const triggerExpansionAnimations: AnimationTriggerMetadata = trigger('expansionAnimations', [
  state('show', style({ height: '*', visibility: 'visible' })),
  state('hide', style({ height: '0', visibility: 'hidden' })),
  transition('show <=> hide', animate(ANIMATION_TIMING)),
  transition('void => hide', animate('0s')),
]);
