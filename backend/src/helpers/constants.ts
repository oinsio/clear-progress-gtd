const PROPERTY_KEYS = {
  SPREADSHEET_ID: 'SPREADSHEET_ID',
  FOLDER_ID: 'FOLDER_ID',
  COVERS_FOLDER_ID: 'COVERS_FOLDER_ID',
} as const;

const COVER_HASH_PREFIX_LENGTH = 12;

function thumbnailUrl(fileId: string): string {
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`;
}
