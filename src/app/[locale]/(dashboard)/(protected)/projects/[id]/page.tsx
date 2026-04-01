import { getDb } from '@/db';
import { generation, preview, project } from '@/db/schema';
import { constructMetadata } from '@/lib/metadata';
import { eq } from 'drizzle-orm';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProjectPreview } from './project-preview';

interface ProjectPageProps {
  params: Promise<{ id: string; locale: string }>;
}

export async function generateMetadata({
  params,
}: ProjectPageProps): Promise<Metadata> {
  const { id, locale } = await params;
  const db = await getDb();
  const [proj] = await db
    .select({ title: project.title })
    .from(project)
    .where(eq(project.id, id));

  if (!proj) return {};

  return constructMetadata({
    title: `${proj.title} | yino.ai Projects`,
    description: proj.title,
    locale: locale as 'en',
    pathname: `/projects/${id}`,
    noIndex: true,
  });
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params;
  const db = await getDb();

  const [proj] = await db.select().from(project).where(eq(project.id, id));

  if (!proj) notFound();

  const [prev] = await db
    .select()
    .from(preview)
    .where(eq(preview.projectId, id));

  const generations = await db
    .select({
      id: generation.id,
      type: generation.type,
      generatorId: generation.generatorId,
      status: generation.status,
      input: generation.input,
      output: generation.output,
      error: generation.error,
      comment: generation.comment,
      projectId: generation.projectId,
      createdAt: generation.createdAt,
      completedAt: generation.completedAt,
    })
    .from(generation)
    .where(eq(generation.projectId, id));

  return (
    <ProjectPreview
      project={proj}
      blocks={prev?.blocks as unknown[] | undefined}
      generations={generations.map((g) => ({
        ...g,
        input: g.input as { prompt?: string; [key: string]: unknown } | null,
        output: g.output as { url?: string; urls?: string[] } | null,
        error: g.error as { code?: string; message?: string } | null,
        createdAt: g.createdAt.toISOString(),
        completedAt: g.completedAt?.toISOString() ?? null,
      }))}
    />
  );
}
