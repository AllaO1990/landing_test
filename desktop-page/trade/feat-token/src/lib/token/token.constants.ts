import { TokenTitleTypes } from './token.types';

export const TOKEN_CONSTANT_TITLE: { [key in TokenTitleTypes]: string } = {
	[TokenTitleTypes.ADD]: 'Добавить токен',
	[TokenTitleTypes.CHANGE]: 'Изменить токен',
};
