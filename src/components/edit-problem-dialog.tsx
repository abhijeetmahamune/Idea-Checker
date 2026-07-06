'use client';

import { useState, useTransition } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { editProblemAction } from '@/app/problem-actions';
import { toast } from 'sonner';
import { Edit, Loader2 } from 'lucide-react';

interface EditProblemDialogProps {
  problem: {
    id: string;
    title: string;
    description: string;
    tags?: string[] | null;
  };
}

export function EditProblemDialog({ problem }: EditProblemDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(problem.title);
  const [description, setDescription] = useState(problem.description);
  const [tags, setTags] = useState(problem.tags?.join(', ') || '');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (title.length < 5) {
      toast.error('Title must be at least 5 characters long.');
      return;
    }
    if (description.length < 20) {
      toast.error('Description must be at least 20 characters long.');
      return;
    }

    const formData = new FormData();
    formData.append('id', problem.id);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('tags', tags);

    startTransition(async () => {
      const result = await editProblemAction(formData);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success('Problem context updated successfully!');
        setOpen(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button variant="outline" size="sm" className="border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900 flex items-center gap-1.5">
          <Edit className="h-3.5 w-3.5" />
          Edit
        </Button>
      } />
      <DialogContent className="border-zinc-900 bg-zinc-950 text-white sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit Problem Context</DialogTitle>
          <DialogDescription className="text-zinc-500">
            Modify the title, description, or tags of this problem workspace.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-semibold">
              Problem Name / Title <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="bg-background/50 border-border focus-visible:ring-violet-500/50"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-semibold">
              Problem Description <span className="text-rose-500">*</span>
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={5}
              className="bg-background/50 border-border focus-visible:ring-violet-500/50 resize-y"
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags" className="text-sm font-semibold">
              Tags (comma-separated)
            </Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="bg-background/50 border-border focus-visible:ring-violet-500/50"
            />
          </div>

          <DialogFooter className="pt-4 border-t border-zinc-900">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              className="text-zinc-400 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
