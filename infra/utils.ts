export function isErrorWithStatusCode(
  error: unknown,
): error is { statusCode: number } {
  return (
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    typeof error["statusCode"] === "number"
  );
}
