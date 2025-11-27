import { Injectable } from '@angular/core';
import { scaleLinear } from 'd3-scale';

@Injectable()
export class StructureService {
  getColor(length: number, colorList: string[]): (value: number) => string {
    const add = length / colorList.length;
    const domain = Array.from({ length: colorList.length }, (_, i: number) => i * add);

    return scaleLinear(domain, colorList);
  }

  getStyleTag(document: Document, styleId: string): HTMLElement {
    const root: HTMLElement | null = document.querySelector(`style#${styleId}`);

    if (root !== null) {
      return root;
    }

    const style: HTMLElement = document.createElement('style');
    style.id = styleId;
    document.head.appendChild(style);

    return document.querySelector(`style#${styleId}`) as HTMLElement;
  }
}
