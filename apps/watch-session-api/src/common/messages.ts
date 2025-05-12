export const ERROR_MESSAGES = {
  SESSION_NOT_FOUND: "Session not found",
  SESSION_ID_REQUIRED: "Session ID is required for this operation",
  SESSION_EXPIRED: "Session has expired",
  USER_ID_REQUIRED: "User ID is required for this operation",
  MEDIA_VIDEO_ID_REQUIRED: "Media Video ID is required for this operation",
  ID_MUST_BE_UUID: "ID must be a valid UUID",
  USER_AGENT_REQUIRED: "User-Agent header is required for session creation",
  CONTENT_ID_REQUIRED: "Content ID is required for this operation",
  USER_ID_CONTENT_ID_REQUIRED:
    "User ID and Content ID are required for this operation",
  SESSION_LIMIT_REACHED:
    "Maximum concurrent session limit reached. Please logout from an existing session or wait for one to expire.",
  SESSION_ALREADY_EXISTS:
    "A session already exists for this device and profile",
  NOT_FOUND: "The requested resource was not found",
  VALIDATION_ERROR: "Validation error",
  INTERNAL_ERROR:
    "An internal server error occurred while processing your request",
  CONTINUE_WATCHING_NOT_FOUND: "No continue watching data found",
  PROFILE_ID_REQUIRED: "Profile ID is required for this operation",
  CONTENT_ID_AND_MEDIA_VIDEO_ID_REQUIRED:
    "Content ID and Media Video ID are required for this operation",
  INVALID_DATE_FORMAT: "Invalid date format",
} as const;
