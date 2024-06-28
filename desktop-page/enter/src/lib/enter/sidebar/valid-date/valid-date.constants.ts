export enum ValidDateEnum {
  TITLE = 'title',
  CALENDAR = 'calendar',
  CHECKBOX = 'checkbox',
}

export const VALID_DATE_CONSTANTS: { [key in ValidDateEnum]: string } = {
  [ValidDateEnum.TITLE]: 'Действует до',
  [ValidDateEnum.CALENDAR]: 'Дата действия',
  [ValidDateEnum.CHECKBOX]: 'бессрочная',
};
