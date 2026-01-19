export type Status = "idle" | "uploading" | "processing" | "complete" | "error";
export type UploadedFolder = {
  name: string;
  files: File[];
};
export type CleaningStats = {
  originalFiles: number;
  duplicatesRemoved: number;
  finalFiles: number;
  spaceSaved: string;
};
