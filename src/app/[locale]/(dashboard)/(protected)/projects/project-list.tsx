'use client';

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import Link from 'next/link';

interface ProjectItem {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

export function ProjectList({ projects }: { projects: ProjectItem[] }) {
  if (projects.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed text-muted-foreground">
        No projects yet. Projects are created by agents via the API.
      </div>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((p) => (
        <Link key={p.id} href={`/projects/${p.id}`}>
          <Card className="transition-colors hover:border-primary/50 cursor-pointer">
            <CardHeader>
              <CardTitle className="text-base truncate">{p.title}</CardTitle>
              <CardDescription>
                {p.updatedAt.toISOString().slice(0, 10)}
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      ))}
    </div>
  );
}
