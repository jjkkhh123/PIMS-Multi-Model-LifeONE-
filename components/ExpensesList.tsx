
import React, { useState } from 'react';
import { Expense } from '../types.ts';
import { EditIcon, DeleteIcon, SaveIcon } from './icons.tsx';

// Props for the list component
interface ExpensesListProps {
  expenses: Expense[];
  onUpdate?: (expense: Expense) => void;
  onDelete?: (id: string) => void;
}

// Props for the form
interface ExpenseFormProps {
    expense: Expense; // Editing always happens on an existing expense
    onSave: (expense: Expense) => void;
    onCancel: () => void;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ expense, onSave, onCancel }) => {
    const [item, setItem] = useState(expense.item);
    const [amount, setAmount] = useState(expense.amount.toString());
    const [date, setDate] = useState(expense.date);
    const [category, setCategory] = useState(expense.category || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const parsedAmount = parseFloat(amount);
        if (!item.trim() || isNaN(parsedAmount) || parsedAmount <= 0) return;

        onSave({
            ...expense,
            item: item.trim(),
            amount: parsedAmount,
            date,
            category: category.trim() || undefined,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="p-3 bg-gray-50 rounded-lg space-y-3">
            <div className="grid grid-cols-2 gap-3">
                <input
                    type="text"
                    placeholder="항목"
                    value={item}
                    onChange={e => setItem(e.target.value)}
                    className="w-full p-2 bg-white text-gray-800 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    required
                />
                 <input
                    type="number"
                    placeholder="금액"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="w-full p-2 bg-white text-gray-800 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    required
                />
            </div>
             <div className="grid grid-cols-2 gap-3">
                <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full p-2 bg-white text-gray-800 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    required
                />
                <input
                    type="text"
                    placeholder="카테고리 (선택 사항)"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full p-2 bg-white text-gray-800 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
            </div>
            <div className="flex justify-end gap-2">
                <button type="button" onClick={onCancel} className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300">
                    취소
                </button>
                <button type="submit" className="px-3 py-1 bg-cyan-500 text-white rounded-md hover:bg-cyan-600 flex items-center gap-1">
                    <SaveIcon className="h-4 w-4" />
                    저장
                </button>
            </div>
        </form>
    );
};


export const ExpensesList: React.FC<ExpensesListProps> = ({ expenses, onUpdate, onDelete }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  
  if (expenses.length === 0) return null;

  const handleSaveUpdate = (expense: Expense) => {
    onUpdate?.(expense);
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    onDelete?.(id);
  };

  const formatDateHeader = (dateStr: string) => {
      try {
        const [year, month, day] = dateStr.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        return date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' });
      } catch(e) {
          return dateStr;
      }
  };

  return (
    <section>
      <div className="space-y-2">
        {expenses.map((expense, index) => {
          const showDateHeader = index === 0 || expenses[index - 1].date !== expense.date;

          return (
            <div key={expense.id}>
                {showDateHeader && (
                    <div className="flex items-center gap-3 mt-5 mb-2 first:mt-0">
                        <div className="text-sm font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                            {formatDateHeader(expense.date)}
                        </div>
                        <div className="h-px bg-gray-200 flex-grow"></div>
                    </div>
                )}

                <div className="pl-1">
                    {editingId === expense.id ? (
                    <ExpenseForm
                        expense={expense}
                        onSave={handleSaveUpdate}
                        onCancel={() => setEditingId(null)}
                    />
                    ) : (
                    <div className="p-3 bg-white border border-gray-200 rounded-lg flex justify-between items-center group hover:shadow-sm transition-shadow">
                        <div className="flex items-center gap-3 overflow-hidden">
                        {expense.imageUrl && (
                            <img 
                            src={expense.imageUrl} 
                            alt="Receipt thumbnail" 
                            className="w-10 h-10 object-cover rounded-md flex-shrink-0"
                            />
                        )}
                        <div className="overflow-hidden">
                            <p className="font-semibold text-gray-800 truncate">{expense.item}</p>
                            <p className="text-xs text-gray-500 truncate">
                                {expense.category || '카테고리 미지정'}
                            </p>
                        </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <p className={`font-bold text-lg ${expense.type === 'income' ? 'text-green-600' : 'text-blue-600'}`}>
                            {expense.type === 'income' ? '+' : ''}{expense.amount.toLocaleString('ko-KR')}원
                            </p>
                            {onUpdate && onDelete && (
                                <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => setEditingId(expense.id)} className="p-1 text-gray-500 hover:text-cyan-600" disabled={!!editingId}>
                                        <EditIcon className="h-5 w-5" />
                                    </button>
                                    <button onClick={() => handleDelete(expense.id)} className="p-1 text-gray-500 hover:text-red-500">
                                        <DeleteIcon className="h-5 w-5" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                    )}
                </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
