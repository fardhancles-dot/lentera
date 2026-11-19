export type MusicFormat = 'mp3' | 'ogg' | 'wav';

/** Public configuration returned by get_background_music(). */
export interface ActiveBackgroundMusic {
  id: string;
  title: string;
  url: string;
  format: MusicFormat;
  mimeType: string;
  sizeBytes: number;
  updatedAt: string;
}

/** Admin row, including inactive tracks and the storage path. */
export interface AdminMusicTrack extends ActiveBackgroundMusic {
  storagePath: string;
  isActive: boolean;
  isPrimary: boolean;
  createdAt: string;
}
