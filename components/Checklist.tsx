import React, { useState, useCallback, FormEvent, KeyboardEvent } from 'react';
import type { ChecklistStateType, ChecklistItemType } from '../types';
import { ChecklistItem } from './ChecklistItem';
import { PlusIcon } from './icons/PlusIcon';
import { useKeystrokeSound } from '../hooks/useKeystrokeSound';
import { XIcon } from './icons/XIcon';

interface ChecklistProps {
  checklist: ChecklistStateType;
  onUpdate: (id: number, updatedData: Partial<ChecklistStateType>) => void;
  onRemove: (id: number) => void;
  canRemove: boolean;
}

export const Checklist: React.FC<ChecklistProps> = ({ checklist, onUpdate, onRemove, canRemove }) => {
  const [newItemText, setNewItemText] = useState<string>('');
  const playKeystrokeSound = useKeystrokeSound();

  const dragItemId = React.useRef<number | null>(null);
  const dragOverItemId = React.useRef<number | null>(null);
  const [draggingId, setDraggingId] = useState<number | null>(null);

  const handleFieldChange = (field: keyof ChecklistStateType, value: any) => {
    onUpdate(checklist.id, { [field]: value });
  };

  const handleItemsChange = (newItems: ChecklistItemType[]) => {
    onUpdate(checklist.id, { items: newItems });
  };
  
  const handleAddItem = useCallback((e: FormEvent) => {
    e.preventDefault();
    if (newItemText.trim() === '') return;
    const newItems = [
      ...checklist.items,
      { id: Date.now(), text: newItemText, type: 'item' as const, completed: false, indentation: 0 },
    ];
    handleItemsChange(newItems);
    setNewItemText('');
  }, [newItemText, checklist.items]);

  const handleAddSection = useCallback(() => {
    const newItems = [
        ...checklist.items,
        { id: Date.now(), text: 'New Section', type: 'section' as const, completed: false, indentation: 0 },
    ];
    handleItemsChange(newItems);
  }, [checklist.items]);

  const handleToggleItem = useCallback((id: number) => {
    const newItems = checklist.items.map(item =>
        item.id === id ? { ...item, completed: !item.completed } : item
    );
    handleItemsChange(newItems);
  }, [checklist.items]);

  const handleDeleteItem = useCallback((id: number) => {
    const newItems = checklist.items.filter(item => item.id !== id);
    handleItemsChange(newItems);
  }, [checklist.items]);

  const handleUpdateItemText = useCallback((id: number, newText: string) => {
    const newItems = checklist.items.map(item =>
        item.id === id ? { ...item, text: newText } : item
    );
    handleItemsChange(newItems);
  }, [checklist.items]);
  
  const handleIndentItem = useCallback((id: number, direction: 'increase' | 'decrease') => {
    const newItems = checklist.items.map(item => {
      if (item.id === id && item.type === 'item') {
        const newIndentation = direction === 'increase'
          ? Math.min(item.indentation + 1, 5)
          : Math.max(item.indentation - 1, 0);
        return { ...item, indentation: newIndentation };
      }
      return item;
    });
    handleItemsChange(newItems);
  }, [checklist.items]);

  const handleDragStart = useCallback((id: number) => {
    dragItemId.current = id;
    setDraggingId(id);
  }, []);

  const handleDragEnter = useCallback((id: number) => {
    dragOverItemId.current = id;
  }, []);

  const handleDrop = useCallback(() => {
    if (dragItemId.current === null || dragOverItemId.current === null) return;
    
    const draggedIndex = checklist.items.findIndex(item => item.id === dragItemId.current);
    const targetIndex = checklist.items.findIndex(item => item.id === dragOverItemId.current);

    if (draggedIndex === -1 || targetIndex === -1 || draggedIndex === targetIndex) return;
    
    const newItems = [...checklist.items];
    const [draggedItem] = newItems.splice(draggedIndex, 1);
    newItems.splice(targetIndex, 0, draggedItem);
    handleItemsChange(newItems);
  }, [checklist.items]);

  const handleDragEnd = useCallback(() => {
    dragItemId.current = null;
    dragOverItemId.current = null;
    setDraggingId(null);
  }, []);

  const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    playKeystrokeSound();
  };

  return (
    <div className="p-4 sm:p-8 lg:p-12 h-full w-full overflow-y-auto relative">
      {canRemove && (
        <button
          onClick={() => onRemove(checklist.id)}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-600 transition-colors no-print z-10"
          aria-label="Remove Checklist"
        >
          <XIcon />
        </button>
      )}
      <input
        type="text"
        value={checklist.title}
        onChange={(e) => handleFieldChange('title', e.target.value)}
        onKeyDown={handleInputKeyDown}
        placeholder="Checklist Title"
        className="text-3xl sm:text-4xl font-bold w-full bg-transparent outline-none pb-2 mb-2 text-black checklist-title"
      />
      <hr className="dashed" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-4">
          <div>
            <label className="text-sm text-gray-500 block">Type</label>
            <select 
                value={checklist.checklistType} 
                onChange={e => handleFieldChange('checklistType', e.target.value as any)}
                className="w-full bg-transparent text-lg text-black outline-none"
            >
                <option value=""></option>
                <option value="DO-CONFIRM">DO-CONFIRM</option>
                <option value="READ-DO">READ-DO</option>
            </select>
          </div>
          <div>
              <label className="text-sm text-gray-500 block">Context</label>
              <input
                type="text"
                value={checklist.context}
                onChange={(e) => handleFieldChange('context', e.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder="Description of checklist"
                className="w-full bg-transparent text-lg text-black outline-none"
              />
          </div>
      </div>
      <hr className="dashed" />
      <div className="space-y-1">
        {checklist.items.map((item, index) => {
          const nextItem = index < checklist.items.length - 1 ? checklist.items[index + 1] : null;
          const isBoundary = nextItem && item.type !== nextItem.type;
          return (
            <React.Fragment key={item.id}>
              <ChecklistItem
                item={item}
                onToggle={handleToggleItem}
                onDelete={handleDeleteItem}
                onUpdateText={handleUpdateItemText}
                onIndent={handleIndentItem}
                isDragging={draggingId === item.id}
                onDragStart={handleDragStart}
                onDragEnter={handleDragEnter}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
              />
              {isBoundary && <hr className="border-t border-gray-200 my-2" />}
            </React.Fragment>
          );
        })}
      </div>
      <form onSubmit={handleAddItem} className="mt-4 flex items-center gap-2 no-print">
        <input
          type="text"
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
          onKeyDown={handleInputKeyDown}
          placeholder="Add a new item..."
          className="flex-grow bg-gray-50 p-2 text-base text-black border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-300"
        />
        <button
          type="submit"
          className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 disabled:bg-gray-400"
          aria-label="Add Item"
        >
          <PlusIcon />
        </button>
      </form>
      <div className="mt-4 flex gap-2 no-print">
        <button onClick={handleAddSection} className="text-sm bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md transition-colors">Add Section</button>
      </div>
      <hr className="dashed"/>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mt-4">
          <div>
            <label className="text-sm text-gray-500 block">Checklist created by:</label>
            <input
                type="text"
                value={checklist.createdBy}
                onChange={(e) => handleFieldChange('createdBy', e.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder="<Name>"
                className="w-full bg-transparent text-lg text-black outline-none"
            />
          </div>
          <div>
              <label className="text-sm text-gray-500 block">Checklist completed by:</label>
              <input
                type="text"
                value={checklist.completedBy}
                onChange={(e) => handleFieldChange('completedBy', e.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder="<Name>"
                className="w-full bg-transparent text-lg text-black outline-none"
              />
          </div>
      </div>
    </div>
  );
};