export interface MasterySummary {
  totalQuestions: number;
  tracked: number;
  mastered: number;
  due: number;
  accuracy: number;
}

export interface CourseMastery {
  courseId: string;
  subjectSlug: string;
  subjectName: string;
  totalQuestions: number;
  tracked: number;
  mastered: number;
  due: number;
  accuracy: number;
  masteryPercent: number;
}

export interface MasteryBoard {
  summary: MasterySummary;
  courses: CourseMastery[];
}
