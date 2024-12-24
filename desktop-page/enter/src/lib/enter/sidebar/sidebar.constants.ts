export enum SidebarEnum {
  SAVE = 'save',
  DELETE = 'delete',
  COMMENT_LABEL = 'comment_label',
  COMMENT_AREA = 'comment_area',
  PORTFOLIO = 'portfolio',
  BROKER = 'broker',
  CURRENCY = 'currency',
}

export const SIDEBAR_CONSTANTS: { [key in SidebarEnum]: string } = {
  [SidebarEnum.SAVE]: 'Сохранить',
  [SidebarEnum.DELETE]: 'Удалить идею',
  [SidebarEnum.COMMENT_LABEL]: 'Комментарий',
  [SidebarEnum.COMMENT_AREA]: 'Добавьте описание своей идеи',
  [SidebarEnum.BROKER]: 'Брокер',
  [SidebarEnum.CURRENCY]: 'Валюта',
  [SidebarEnum.PORTFOLIO]: 'Портфель',
};
