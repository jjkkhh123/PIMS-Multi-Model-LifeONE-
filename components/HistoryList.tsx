

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { HistoryItem, ChatSession } from '../types';
import { AddIcon, EditIcon, DeleteIcon, SaveIcon } from './icons.tsx';


interface HistoryListProps {
  history: HistoryItem[];
  onSelectItem: (item: HistoryItem) => void;
  isLoading: boolean;
}

export const HistoryList: React.FC<HistoryListProps> = ({ history, onSelectItem, isLoading }) => {
  if (history.length === 0 && !isLoading) {
    return (
      <div className="text-center py-10 text-gray-500 h-full flex flex-col justify-center">
        <p className="font-semibold">처리 내역이 없습니다.</p>
        <p className="text-sm mt-1">입력을 시작하여 데이터를 정리하세요.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {isLoading && history.length > 0 && (
         <div className="w-full text-left p-3 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-200">
            <svg className="animate-spin h-5 w-5 text-cyan-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="ml-3 text-gray-600">새로운 내역 처리 중...</span>
         </div>
      )}
      {history.map((item) => {
        const incomeItems = item.output.expenses.filter(e => e.type === 'income');
        const expenseItems = item.output.expenses.filter(e => e.type === 'expense');
        
        return (
          <button
            key={item.id}
            onClick={() => onSelectItem(item)}
            className="w-full text-left p-3 bg-white rounded-lg transition-colors hover:bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <div className="flex justify-between items-center">
              <p className="font-semibold text-gray-800 truncate pr-2">
                {item.input.text || item.input.imageName || 'Image Input'}
              </p>
              <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                {new Date(item.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-1 flex gap-x-3 gap-y-1 flex-wrap">
              {item.output.contacts.length > 0 && <span>연락처: {item.output.contacts.length}</span>}
              {item.output.schedule.length > 0 && <span>일정: {item.output.schedule.length}</span>}
              {incomeItems.length > 0 && <span>수입: {incomeItems.length}</span>}
              {expenseItems.length > 0 && <span>지출: {expenseItems.length}</span>}
              {item.output.diary.length > 0 && <span>일기: {item.output.diary.length}</span>}
            </div>
          </button>
        );
      })}
    </div>
  );
};

// --- ChatHistoryList Component ---

interface ChatHistoryListProps {
  chatSessions: ChatSession[];
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onUpdateChatTitle: (sessionId: string, newTitle: string) => void;
  onDeleteChatSession: (sessionId: string) => void;
}

export const ChatHistoryList: React.FC<ChatHistoryListProps> = ({
  chatSessions,
  onSelectChat,
  onNewChat,
  onUpdateChatTitle,
  onDeleteChatSession
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId && editInputRef.current) {
        editInputRef.current.focus();
    }
  }, [editingId]);

  const filteredSessions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return chatSessions;
    return chatSessions.filter(session => session.title.toLowerCase().includes(q));
  }, [chatSessions, searchQuery]);

  const handleStartEditing = (session: ChatSession) => {
    setEditingId(session.id);
    setEditingTitle(session.title);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingTitle(e.target.value);
  };
  
  const handleTitleSave = () => {
    if (editingId && editingTitle.trim()) {
      onUpdateChatTitle(editingId, editingTitle.trim());
    }
    setEditingId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
        handleTitleSave();
    } else if (e.key === 'Escape') {
        setEditingId(null);
    }
  };

  const handleDelete = (sessionId: string) => {
    onDeleteChatSession(sessionId);
  };

  const header = (
    <div className="flex justify-between items-center mb-4">
      <div className="flex items-center bg-white border border-gray-300 rounded-lg px-3 py-2 w-full max-w-xs">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        <input
          type="search"
          placeholder="대화 검색"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="ml-2 bg-transparent text-sm text-gray-800 placeholder-gray-500 focus:outline-none w-full"
          aria-label="대화 기록 검색"
        />
      </div>
      <button
        onClick={onNewChat}
        className="flex items-center gap-1 px-3 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600"
      >
        <AddIcon className="h-5 w-5" />
        새 대화
      </button>
    </div>
  );

  return (
    <section>
        {header}
        
        {filteredSessions.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
                <p>{searchQuery ? '검색된 대화가 없습니다.' : '저장된 대화가 없습니다.'}</p>
            </div>
        ) : (
            <div className="space-y-2">
                {filteredSessions.map(session => (
                    <div key={session.id} className="p-3 bg-white border border-gray-200 rounded-lg group flex justify-between items-center transition-shadow hover:shadow-md">
                        {editingId === session.id ? (
                           <div className="flex-grow flex items-center">
                                <input
                                    ref={editInputRef}
                                    type="text"
                                    value={editingTitle}
                                    onChange={handleTitleChange}
                                    onBlur={handleTitleSave}
                                    onKeyDown={handleKeyDown}
                                    className="w-full text-left truncate py-1 px-2 rounded-md text-sm bg-gray-100 text-gray-900 border border-cyan-500 focus:outline-none"
                                />
                                 <button onClick={handleTitleSave} className="ml-2 p-1 text-gray-500 hover:text-green-600"><SaveIcon className="h-5 w-5" /></button>
                           </div>
                        ) : (
                            <>
                                <button
                                    onClick={() => onSelectChat(session.id)}
                                    className="text-left flex-grow truncate pr-4"
                                    title={session.title}
                                >
                                    <p className="font-semibold text-gray-800 truncate">{session.title}</p>
                                    <p className="text-xs text-gray-500 truncate mt-1">
                                        {session.messages[session.messages.length - 1]?.text || "..."}
                                    </p>
                                </button>
                                <div className="flex gap-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleStartEditing(session); }}
                                        className="p-1 text-gray-500 hover:text-cyan-600"
                                        aria-label="제목 수정"
                                    >
                                        <EditIcon className="h-5 w-5" />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDelete(session.id); }}
                                        className="p-1 text-gray-500 hover:text-red-500"
                                        aria-label="삭제"
                                    >
                                        <DeleteIcon className="h-5 w-5" />
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>
        )}
    </section>
  );
};