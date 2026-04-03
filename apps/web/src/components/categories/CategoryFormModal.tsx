'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useCreateCategory, useUpdateCategory } from '@/hooks/useCategories';
import type { ExpenseCategory } from '@finance-app/shared';

const PRESET_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BDC3C7', '#E8A87C',
  '#A8E6CF', '#FFB3BA', '#2E86AB', '#A23B72', '#F18F01',
];

interface CategoryFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  category?: ExpenseCategory;
}

export function CategoryFormModal({ open, onClose, onSuccess, category }: CategoryFormModalProps) {
  const { createCategory, isLoading: isCreating } = useCreateCategory();
  const { updateCategory, isLoading: isUpdating } = useUpdateCategory();

  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]!);
  const [error, setError] = useState<string | null>(null);

  const isLoading = isCreating || isUpdating;

  useEffect(() => {
    if (open) {
      setName(category?.name ?? '');
      setEmoji(category?.emoji ?? '');
      setColor(category?.color ?? PRESET_COLORS[0]!);
      setError(null);
    }
  }, [open, category]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) { setError('El nombre es requerido.'); return; }
    if (!emoji.trim()) { setError('El emoji es requerido.'); return; }
    if (!/^#[0-9A-Fa-f]{6}$/.test(color)) { setError('Color hex inválido.'); return; }

    const data = { name: name.trim(), emoji: emoji.trim(), color };
    const result = category
      ? await updateCategory(category.id, data)
      : await createCategory(data);

    if (result) {
      onSuccess();
      onClose();
    } else {
      setError(category ? 'No se pudo actualizar la categoría.' : 'No se pudo crear la categoría.');
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{category ? 'Editar categoría' : 'Nueva categoría'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Preview */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
              style={{ backgroundColor: color + '30', border: `2px solid ${color}` }}
            >
              {emoji || '?'}
            </div>
            <span className="text-sm font-medium text-slate-700">{name || 'Nombre de categoría'}</span>
          </div>

          {/* Nombre */}
          <div className="space-y-1.5">
            <Label>Nombre</Label>
            <Input
              placeholder="Ej: Mascota"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
            />
          </div>

          {/* Emoji */}
          <div className="space-y-1.5">
            <Label>Emoji</Label>
            <Input
              placeholder="Ej: 🐾"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              maxLength={10}
            />
          </div>

          {/* Color */}
          <div className="space-y-1.5">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
                  style={{
                    backgroundColor: c,
                    borderColor: color === c ? '#1E3A5F' : 'transparent',
                  }}
                />
              ))}
            </div>
            <Input
              placeholder="#FF6B6B"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              maxLength={7}
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-[#1E3A5F] hover:bg-[#2E86AB]" disabled={isLoading}>
              {isLoading ? 'Guardando...' : category ? 'Guardar cambios' : 'Crear categoría'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
