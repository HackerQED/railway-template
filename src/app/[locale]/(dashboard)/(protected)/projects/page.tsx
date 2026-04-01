import { getDb } from '@/db';
import { project } from '@/db/schema';
import { constructMetadata } from '@/lib/metadata';
import { getSession } from '@/lib/server';
import { desc, eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { ProjectList } from './project-list';

export const metadata = constructMetadata({
  title: 'Projects - yino.ai',
  description: 'Your generated media organized by project.',
  noIndex: true,
});

export default async function ProjectsPage() {
  const session = await getSession();
  if (!session?.user) redirect('/?loginRequired=true');

  const db = await getDb();
  const projects = await db
    .select({
      id: project.id,
      title: project.title,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    })
    .from(project)
    .where(eq(project.userId, session.user.id))
    .orderBy(desc(project.updatedAt));

  return (
    <div className="px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Projects</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your generated media organized by project
        </p>
      </div>
      <ProjectList projects={projects} />
    </div>
  );
}
