export class Price {
  readonly classList: string[] = ['short', 'long'];

  updateClass(element: HTMLElement, status: boolean): void {
    element.classList.remove(this.classList[Number(!status)]);
    element.classList.add(this.classList[Number(status)]);
  }

  removeClass(element: HTMLElement): void {
    element.classList.remove(...this.classList);
  }
}
