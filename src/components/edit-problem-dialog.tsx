'use client';

import { useState, useTransition } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { editProblemAction } from '@/app/problem-actions';
import { toast } from 'sonner';
import { Edit, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  PROBLEM_STAGES,
  SEEKING_OPTIONS,
  MAX_SEEKING_SELECTIONS,
  type ProblemStage,
  type SeekingOption,
} from '@/lib/problem-constants';

interface EditProblemDialogProps {
  problem: {
    id: string;
    title: string;
    description: string;
    tags?: string[] | null;
    stage?: string | null;
    seeking?: string[] | null;
  };
}

export function EditProblemDialog({ problem }: EditProblemDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(problem.title);
  const [description, setDescription] = useState(problem.description);
  const [tags, setTags] = useState(problem.tags?.join(', ') || '');
  const [selectedStage, setSelectedStage] = useState<ProblemStage>(
    (problem.stage as ProblemStage) || 'EXPLORING'
  );
  const [selectedSeeking, setSelectedSeeking] = useState<SeekingOption[]>(
    (problem.seeking ?? []).filter((v): v is SeekingOption =>
      SEEKING_OPTIONS.some((o) => o.value === v)
    )
  );
  const [isPending, startTransition] = useTransition();

  const toggleSeeking = (value: SeekingOption) => {
    setSelectedSeeking((prev) => {
      if (prev.includes(value)) return prev.filter((v) => v !== value);
      if (prev.length >= MAX_SEEKING_SELECTIONS) {
        toast.warning(`You can select up to ${MAX_SEEKING_SELECTIONS} things you're currently seeking.`);
        return prev;
      }
      return [...prev, value];
    });
  };

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
    formData.append('stage', selectedStage);
    formData.append('seeking', selectedSeeking.join(','));

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
        <Button variant="outline" size="sm" className="border-border text-muted-foreground hover:text-foreground hover:bg-accent flex items-center gap-1.5 cursor-pointer">
          <Edit className="h-3.5 w-3.5" />
          Edit
        </Button>
      } />
      <DialogContent className="border-border bg-card text-foreground sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold">Edit Problem Context</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Modify the title, description, tags, stage, or seeking of this problem.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="edit-title" className="text-sm font-semibold text-foreground">
              Problem Name / Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="bg-background border-border text-foreground focus-visible:ring-violet-500/50"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="edit-description" className="text-sm font-semibold text-foreground">
              Problem Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={4}
              className="bg-background border-border text-foreground focus-visible:ring-violet-500/50 resize-y"
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="edit-tags" className="text-sm font-semibold text-foreground">
              Tags (comma-separated)
            </Label>
            <Input
              id="edit-tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="bg-background border-border text-foreground focus-visible:ring-violet-500/50"
            />
          </div>

          {/* Stage selector */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-foreground">
              Problem Stage
            </Label>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Select problem stage">
              {PROBLEM_STAGES.map((s) => {
                const isActive = selectedStage === s.value;
                return (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setSelectedStage(s.value as ProblemStage)}
                    aria-pressed={isActive}
                    className={cn(
                      'inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-all duration-150 cursor-pointer',
                      isActive
                        ? cn('border', s.bgClass, s.colorClass)
                        : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <span aria-hidden="true">{s.emoji}</span>
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Seeking multi-select */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              Currently Seeking
              <span className="text-[10px] font-normal text-muted-foreground">(optional — up to {MAX_SEEKING_SELECTIONS})</span>
            </Label>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Select what you are seeking">
              {SEEKING_OPTIONS.map((o) => {
                const isSelected = selectedSeeking.includes(o.value as SeekingOption);
                return (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => toggleSeeking(o.value as SeekingOption)}
                    aria-pressed={isSelected}
                    title={o.description}
                    className={cn(
                      'inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-all duration-150 cursor-pointer',
                      isSelected
                        ? 'border-violet-500/40 bg-violet-500/10 text-violet-600 dark:text-violet-400'
                        : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <span aria-hidden="true">{o.emoji}</span>
                    {o.label}
                  </button>
                );
              })}
            </div>
            {selectedSeeking.length === MAX_SEEKING_SELECTIONS && (
              <p className="text-[10px] text-muted-foreground">
                Maximum of {MAX_SEEKING_SELECTIONS} selections reached.
              </p>
            )}
          </div>

          <DialogFooter className="pt-4 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              className="text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold cursor-pointer"
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
