import type { PageModule } from '../app/router';

/**
 * The level map now opens the game directly. This route only exists so old
 * links and bookmarks to a lesson detail URL land in the game instead of a
 * dead page or an extra "Mulai lesson" step.
 */
function render(ctx: Parameters<PageModule['render']>[0]): void {
  const subjectSlug = ctx.params.subject ?? '';
  const lessonSlug = ctx.params.lessonSlug ?? '';

  if (!subjectSlug || !lessonSlug) {
    ctx.navigate('/learn', { replace: true });
    return;
  }

  ctx.navigate(`/learn/${subjectSlug}/lesson/${lessonSlug}/play`, { replace: true });
}

export { render };
export const meta = { title: 'Lesson' };
