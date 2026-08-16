import type { DBAPIKey } from "@srouter/types";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type KeyDeleteDialogProps = {
    keyToDelete: DBAPIKey | null;
    deleting: boolean;
    onClose: () => void;
    onConfirm: (keyId: string) => Promise<void>;
};

function maskKey(key: string): string {
    if (key.length <= 14) return key;
    return `${key.slice(0, 10)}••••••••${key.slice(-4)}`;
}

export function KeyDeleteDialog({
    keyToDelete,
    deleting,
    onClose,
    onConfirm
}: KeyDeleteDialogProps) {
    if (!keyToDelete) return null;

    return (
        <Dialog open={Boolean(keyToDelete)} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md bg-card border-border p-6">
                <DialogHeader className="space-y-1 text-left">
                    <DialogTitle className="text-base font-semibold text-destructive">
                        Revoke API Key
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
                        Are you sure you want to revoke{" "}
                        <span className="font-semibold text-foreground">{keyToDelete.name}</span>?
                        Any downstream requests using this token will immediately fail with HTTP 401
                        Unauthorized.
                    </DialogDescription>
                </DialogHeader>

                <div className="rounded-md border border-border bg-secondary/30 p-3 text-xs font-mono space-y-1 my-1">
                    <div className="text-muted-foreground text-[11px]">Token identifier</div>
                    <code className="text-foreground text-xs">{maskKey(keyToDelete.key)}</code>
                </div>

                <DialogFooter className="pt-2 gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        className="h-8.5 text-xs font-medium cursor-pointer"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        disabled={deleting}
                        onClick={() => void onConfirm(keyToDelete.id)}
                        className="h-8.5 text-xs font-semibold cursor-pointer shadow-xs"
                    >
                        {deleting ? "Revoking…" : "Revoke Key"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
