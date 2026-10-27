'use client';

import * as React from "react"
import { AlertTriangle, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: "destructive" | "default"
  requireConfirmationText?: string
  loading?: boolean
  onConfirm: () => void | Promise<void>
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Delete",
  cancelText = "Cancel",
  variant = "destructive",
  requireConfirmationText,
  loading = false,
  onConfirm,
}: ConfirmDialogProps) {
  const [inputText, setInputText] = React.useState("")
  const isMatch = requireConfirmationText ? inputText === requireConfirmationText : true

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setInputText("")
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="gap-2 sm:text-left">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive ring-8 ring-destructive/5">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <DialogTitle className="text-lg">{title}</DialogTitle>
          <DialogDescription className="text-sm">{description}</DialogDescription>
        </DialogHeader>

        {requireConfirmationText && (
          <div className="my-2 space-y-2">
            <p className="text-xs text-muted-foreground">
              Please type <span className="font-semibold text-foreground">{requireConfirmationText}</span> to confirm:
            </p>
            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={requireConfirmationText}
              className="text-xs"
              autoFocus
            />
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            variant={variant}
            size="sm"
            onClick={onConfirm}
            disabled={!isMatch || loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
