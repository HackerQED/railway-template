'use client';

import {
  createApiKeyAction,
  listApiKeysAction,
  revokeApiKeyAction,
} from '@/actions/api-keys';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  CheckIcon,
  CopyIcon,
  KeyIcon,
  Loader2Icon,
  PlusIcon,
  TrashIcon,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

interface ApiKeyItem {
  id: string;
  name: string;
  keyPrefix: string;
  lastUsedAt: Date | null;
  createdAt: Date;
}

function formatDate(date: Date | null): string {
  if (!date) return 'Never';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button variant="outline" size="sm" onClick={handleCopy}>
      {copied ? (
        <CheckIcon className="size-3.5" />
      ) : (
        <CopyIcon className="size-3.5" />
      )}
      {copied ? 'Copied' : 'Copy'}
    </Button>
  );
}

export default function ApiKeysPageClient() {
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [keyToRevoke, setKeyToRevoke] = useState<ApiKeyItem | null>(null);

  const fetchKeys = useCallback(async () => {
    const result = await listApiKeysAction({});
    if (result?.data?.success && result.data.data) {
      setKeys(result.data.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const handleCreate = async () => {
    if (!newKeyName.trim()) return;
    setCreating(true);
    try {
      const result = await createApiKeyAction({ name: newKeyName.trim() });
      if (result?.data?.success && result.data.data) {
        setNewKeyValue(result.data.data.key);
        toast.success('API key created');
        fetchKeys();
      } else {
        toast.error('Failed to create API key');
      }
    } catch {
      toast.error('Failed to create API key');
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async () => {
    if (!keyToRevoke) return;
    setRevoking(keyToRevoke.id);
    try {
      const result = await revokeApiKeyAction({ id: keyToRevoke.id });
      if (result?.data?.success) {
        toast.success('API key revoked');
        setRevokeDialogOpen(false);
        setKeyToRevoke(null);
        fetchKeys();
      } else {
        toast.error('Failed to revoke API key');
      }
    } catch {
      toast.error('Failed to revoke API key');
    } finally {
      setRevoking(null);
    }
  };

  const handleCreateDialogClose = (open: boolean) => {
    if (!open) {
      // Reset state when closing
      setNewKeyName('');
      setNewKeyValue(null);
    }
    setCreateDialogOpen(open);
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <KeyIcon className="size-5" />
                API Keys
              </CardTitle>
              <CardDescription>
                Manage API keys for programmatic access. Keys are used with{' '}
                <code className="text-xs bg-muted px-1 py-0.5 rounded">
                  Authorization: Bearer &lt;key&gt;
                </code>
              </CardDescription>
            </div>
            <Dialog
              open={createDialogOpen}
              onOpenChange={handleCreateDialogClose}
            >
              <DialogTrigger asChild>
                <Button size="sm">
                  <PlusIcon className="size-4" />
                  Create Key
                </Button>
              </DialogTrigger>
              <DialogContent>
                {newKeyValue ? (
                  <>
                    <DialogHeader>
                      <DialogTitle>API Key Created</DialogTitle>
                      <DialogDescription>
                        Copy your API key now. You won't be able to see it
                        again.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <code className="flex-1 rounded-md border bg-muted px-3 py-2 text-sm font-mono break-all">
                          {newKeyValue}
                        </code>
                        <CopyButton value={newKeyValue} />
                      </div>
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">Done</Button>
                      </DialogClose>
                    </DialogFooter>
                  </>
                ) : (
                  <>
                    <DialogHeader>
                      <DialogTitle>Create API Key</DialogTitle>
                      <DialogDescription>
                        Give your key a name to identify it later.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="key-name">Name</Label>
                        <Input
                          id="key-name"
                          placeholder="e.g. Production Agent"
                          value={newKeyName}
                          onChange={(e) => setNewKeyName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && newKeyName.trim()) {
                              handleCreate();
                            }
                          }}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogClose>
                      <Button
                        onClick={handleCreate}
                        disabled={creating || !newKeyName.trim()}
                      >
                        {creating && (
                          <Loader2Icon className="size-4 animate-spin" />
                        )}
                        Create
                      </Button>
                    </DialogFooter>
                  </>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2Icon className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : keys.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <KeyIcon className="size-10 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">
                No API keys yet. Create one to get started.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead className="w-[80px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {keys.map((k) => (
                  <TableRow key={k.id}>
                    <TableCell className="font-medium">{k.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-mono text-xs">
                        {k.keyPrefix}...
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(k.createdAt)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(k.lastUsedAt)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          setKeyToRevoke(k);
                          setRevokeDialogOpen(true);
                        }}
                      >
                        <TrashIcon className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Revoke confirmation dialog */}
      <Dialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke API Key</DialogTitle>
            <DialogDescription>
              Are you sure you want to revoke{' '}
              <strong>{keyToRevoke?.name}</strong>? This action cannot be
              undone. Any applications using this key will lose access.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleRevoke}
              disabled={revoking !== null}
            >
              {revoking && <Loader2Icon className="size-4 animate-spin" />}
              Revoke
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
