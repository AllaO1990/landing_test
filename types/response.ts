export interface Charge<T> {
	data: T | null;
	isLoaded: boolean;
	isLoading: boolean;
}

export interface Response<T> {
	data: T;
	message: string;
	success: boolean;
}

export enum ResponseMessage {
	success = 'Success',
}

export interface DataList<T> {
	total: number;
	items: T[];
}
