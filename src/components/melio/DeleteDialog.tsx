import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

export function DeleteDialog({ name, onCancel, onConfirm }: { name: string | null; onCancel: () => void; onConfirm: () => void }) {
  return <Dialog open={name !== null} onOpenChange={(open) => { if (!open) onCancel(); }}>
    <DialogContent className="max-w-sm">
      <DialogTitle>Delete “{name}”?</DialogTitle>
      <DialogDescription>This cannot be undone.</DialogDescription>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button variant="destructive" onClick={onConfirm}>Delete</Button>
      </div>
    </DialogContent>
  </Dialog>;
}