export interface Pod {
  id: string;
  deliveryAttemptId: string;
  imageUrl: string | null;
  note: string | null;
  capturedBy: string | null;
  capturedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PodSnapshot {
  id: string;
  deliveryAttemptId: string;
  imageUrl: string | null;
  note: string | null;
  capturedBy: string | null;
  capturedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertPodInput {
  deliveryAttemptId: string;
  imageUrl?: string | null;
  note?: string | null;
  capturedBy?: string | null;
  capturedAt?: string | null;
}
