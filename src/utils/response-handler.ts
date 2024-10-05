export const handleDataResponse = (
  message: string,
  statusCode?: string | null,
) => {
  return {
    statusCode: statusCode ?? 'OK',
    message,
  };
};
