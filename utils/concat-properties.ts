export const concatProperties = (appearance: string, data: object | null = null) => {
  return Object.assign(Object.create(null), data, { appearance });
};
