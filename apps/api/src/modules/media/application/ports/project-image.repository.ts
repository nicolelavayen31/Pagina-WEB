export type ProjectImageView = {
  id: string;
  altText: string | null;
  caption: string | null;
  sortOrder: number;
  width: number;
  height: number;
  sizeBytes: number;
};

export type NewProjectImage = ProjectImageView & { projectId: string; storageKey: string; mimeType: string };

export type DeliverableImage = { storageKey: string; projectIsPublished: boolean };

export abstract class ProjectImageRepository {
  /** `null` when the project does not exist. */
  abstract findProjectCover(projectId: string): Promise<{ coverImageId: string | null } | null>;
  abstract maxSortOrder(projectId: string): Promise<number | null>;
  abstract add(image: NewProjectImage): Promise<ProjectImageView>;
  abstract setCover(projectId: string, imageId: string): Promise<void>;
  abstract findStorageKey(projectId: string, imageId: string): Promise<string | null>;
  abstract delete(imageId: string): Promise<void>;
  abstract findDeliverable(imageId: string): Promise<DeliverableImage | null>;
}
