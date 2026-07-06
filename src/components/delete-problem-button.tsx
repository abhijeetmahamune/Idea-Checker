'use client';

import { useState, useTransition } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { deleteProblemAction } from '@/app/problem-actions';
import { toast } from 'sonner';
import { Trash, Loader2 } from 'lucide-react';

interface DeleteProblemButtonProps {
  problemId: string;
}

export function DeleteProblemButton({ problemId }: DeleteProblemButtonProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    const formData = new FormData();
    formData.append('id', problemId);

    startTransition(async () => {
      const result = await deleteProblemAction(formData);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success('Problem context deleted.');
        setOpen(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button variant="ghost" size="sm" className="text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 flex items-center gap-1.5 transition-colors">
          <Trash className="h-3.5 w-3.5" />
          Delete
        </Button>
      } />
      <DialogContent className="border-zinc-900 bg-zinc-950 text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-rose-400 flex items-center gap-2">
            <Trash className="h-5 w-5" />
            Delete Problem Context
          </DialogTitle>
          <DialogDescription className="text-zinc-400 pt-2 leading-relaxed">
            Are you absolutely sure? This will soft-delete the problem and cascade to **soft-delete all solution proposals and evaluations** associated with it. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="pt-4 border-t border-zinc-900 gap-2 sm:gap-0">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setOpen(false)}
            className="text-zinc-400 hover:text-white"
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={isPending}
            onClick={handleDelete}
            className="bg-rose-600 hover:bg-rose-500 text-white font-semibold flex items-center justify-center gap-1.5"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Confirm Delete'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
