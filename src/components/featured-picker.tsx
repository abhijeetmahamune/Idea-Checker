'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Check } from 'lucide-react';

interface FeaturedPickerProps {
  title: string;
  icon: React.ReactNode;
  items: { id: string; label: string; sublabel?: string }[];
  selectedIds: string[];
  maxSelections: number;
  onSave: (ids: string[]) => Promise<{ success?: boolean; error?: string }>;
}

export function FeaturedPicker({
  title,
  icon,
  items,
  selectedIds: initialSelectedIds,
  maxSelections,
  onSave,
}: FeaturedPickerProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds);
  const [isPending, startTransition] = useTransition();

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= maxSelections) {
        return prev;
      }
      return [...prev, id];
    });
  };

  const handleSave = () => {
    startTransition(async () => {
      try {
        const result = await onSave(selectedIds);
        if (result?.error) {
          toast.error(result.error);
        } else {
          toast.success('Successfully saved featured items.');
        }
      } catch (error) {
        toast.error('An error occurred while saving.');
      }
    });
  };

  return (
    <Card className="bg-zinc-950/60 backdrop-blur-md border-border w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl text-white">
          {icon}
          {title}
        </CardTitle>
        <p className="text-sm text-zinc-400 mt-1">
          Select up to {maxSelections} to showcase on your profile
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length === 0 ? (
          <p className="text-zinc-500 text-sm">No items available</p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => {
              const isChecked = selectedIds.includes(item.id);
              const isDisabled = !isChecked && selectedIds.length >= maxSelections;

              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border border-zinc-800 bg-zinc-900/30 transition-colors ${
                    isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-zinc-700'
                  }`}
                  onClick={() => !isDisabled && toggleSelection(item.id)}
                >
                  <div
                    className={`flex-shrink-0 flex items-center justify-center w-[18px] h-[18px] rounded transition-colors ${
                      isChecked
                        ? 'bg-violet-600 border border-violet-600 text-white'
                        : 'border border-zinc-600'
                    }`}
                  >
                    {isChecked && <Check className="w-3 h-3" strokeWidth={3} />}
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-sm text-white truncate">{item.label}</span>
                    {item.sublabel && (
                      <span className="text-xs text-zinc-500 truncate">{item.sublabel}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div className="pt-4 flex justify-end">
          <Button
            onClick={handleSave}
            disabled={isPending}
            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white border-0"
          >
            {isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
