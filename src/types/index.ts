// Domain types for "Núcleo Avalanche de IA".
// Provisional shapes for the rebuild scaffold — will be refined against the real
// API/DB payloads once authenticated access (Claude-in-Chrome / API token) is set up.

export interface Category {
  id: string;
  slug: string;
  name: string;
  description?: string;
}

export interface Lesson {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  durationMin?: number;
  videoUrl?: string;
  cover?: string;
  materialHtml?: string;
  section?: string;
}

export interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  description?: string;
  coverImage?: string;
  categorySlug: string;
  modules: Module[];
}

export interface GameItem {
  id: string;
  slug: string;
  title: string;
  category: string;
  xpReward: number;
  description: string;
  status: "available" | "completed" | "locked";
  iconName: string;
}

export interface DownloadableResource {
  id: string;
  title: string;
  fileType: "pdf" | "zip" | "code" | "video";
  size: string;
  fileName: string;
  downloadUrl: string;
  description: string;
}

export interface AdminStats {
  totalStudents: number;
  activeStudentsToday: number;
  totalCourses: number;
  totalLessons: number;
  completionRatePercent: number;
  gamesPlayed: number;
}

