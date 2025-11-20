
import React, { useState } from 'react';
import { AppNotification, NotificationSettings } from '../types';
import { SettingsIcon, BellIcon, CalendarIcon, ExpenseIcon } from './icons';

interface NotificationsViewProps {
    notifications: AppNotification[];
    onNotificationClick: (notification: AppNotification) => void;
    settings: NotificationSettings;
    onUpdateSettings: (settings: NotificationSettings) => void;
    onClearAll: () => void;
}

interface SettingsModalProps {
    settings: NotificationSettings;
    onSave: (settings: NotificationSettings) => void;
    onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ settings, onSave, onClose }) => {
    const [calendarEnabled, setCalendarEnabled] = useState(settings.calendar.enabled);
    const [dDayAlerts, setDDayAlerts] = useState(settings.calendar.dDayAlerts);
    const [todayEventAlerts, setTodayEventAlerts] = useState(settings.calendar.todayEventAlerts);
    
    const [budgetEnabled, setBudgetEnabled] = useState(settings.budget.enabled);
    const [monthlyLimit, setMonthlyLimit] = useState(settings.budget.monthlyLimit.toString());

    const handleSave = () => {
        onSave({
            calendar: {
                enabled: calendarEnabled,
                dDayAlerts,
                todayEventAlerts,
            },
            budget: {
                enabled: budgetEnabled,
                monthlyLimit: parseInt(monthlyLimit.replace(/,/g, ''), 10) || 0,
            }
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <SettingsIcon className="h-5 w-5 text-gray-500" />
                        알림 설정
                    </h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800">✕</button>
                </div>
                
                <div className="p-6 overflow-y-auto space-y-6">
                    {/* Calendar Settings */}
                    <div className="space-y-3">
                        <h4 className="font-semibold text-cyan-700 flex items-center gap-2">
                            <CalendarIcon className="h-5 w-5" />
                            캘린더 알림
                        </h4>
                        <div className="flex items-center justify-between">
                            <label className="text-gray-700">캘린더 알림 켜기</label>
                            <input 
                                type="checkbox" 
                                checked={calendarEnabled} 
                                onChange={(e) => setCalendarEnabled(e.target.checked)}
                                className="h-5 w-5 text-cyan-600 rounded focus:ring-cyan-500"
                            />
                        </div>
                        {calendarEnabled && (
                            <div className="ml-4 space-y-2 border-l-2 border-gray-200 pl-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">D-Day 알림 (1, 10, 50, 100일...)</span>
                                    <input 
                                        type="checkbox" 
                                        checked={dDayAlerts} 
                                        onChange={(e) => setDDayAlerts(e.target.checked)}
                                        className="h-4 w-4 text-cyan-600 rounded focus:ring-cyan-500"
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">당일 일정 알림</span>
                                    <input 
                                        type="checkbox" 
                                        checked={todayEventAlerts} 
                                        onChange={(e) => setTodayEventAlerts(e.target.checked)}
                                        className="h-4 w-4 text-cyan-600 rounded focus:ring-cyan-500"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <hr className="border-gray-200" />

                    {/* Budget Settings */}
                    <div className="space-y-3">
                        <h4 className="font-semibold text-cyan-700 flex items-center gap-2">
                            <ExpenseIcon className="h-5 w-5" />
                            가계부 알림
                        </h4>
                         <div className="flex items-center justify-between">
                            <label className="text-gray-700">지출 한도 알림 켜기</label>
                            <input 
                                type="checkbox" 
                                checked={budgetEnabled} 
                                onChange={(e) => setBudgetEnabled(e.target.checked)}
                                className="h-5 w-5 text-cyan-600 rounded focus:ring-cyan-500"
                            />
                        </div>
                        {budgetEnabled && (
                            <div className="ml-4 space-y-3 border-l-2 border-gray-200 pl-4">
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">월 지출 목표 금액 (원)</label>
                                    <input 
                                        type="text" 
                                        value={monthlyLimit} 
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/[^0-9]/g, '');
                                            setMonthlyLimit(val ? parseInt(val, 10).toLocaleString() : '');
                                        }}
                                        placeholder="예: 500,000"
                                        className="w-full p-2 bg-gray-50 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500"
                                    />
                                </div>
                                <p className="text-xs text-gray-500">
                                    지출이 목표 금액의 30%, 50%, 90%, 100%에 도달하면 알림을 보냅니다.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-2 rounded-b-lg">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400">취소</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-cyan-500 text-white rounded-md hover:bg-cyan-600">저장</button>
                </div>
            </div>
        </div>
    );
};

export const NotificationsView: React.FC<NotificationsViewProps> = ({ notifications, onNotificationClick, settings, onUpdateSettings, onClearAll }) => {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    return (
        <div className="h-full flex flex-col bg-white rounded-lg shadow-sm relative">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
                 <div className="flex items-center gap-2">
                    <BellIcon className="h-5 w-5 text-cyan-600" />
                    <h2 className="text-lg font-bold text-gray-800">알림</h2>
                    {notifications.length > 0 && (
                        <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                            {notifications.length}
                        </span>
                    )}
                 </div>
                 <div className="flex items-center gap-2">
                     {notifications.length > 0 && (
                        <button 
                            onClick={onClearAll}
                            className="text-xs text-gray-500 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 transition-colors font-medium"
                        >
                            알림 모두 지우기
                        </button>
                     )}
                     <button 
                        onClick={() => setIsSettingsOpen(true)}
                        className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
                        title="알림 설정"
                     >
                        <SettingsIcon className="h-5 w-5" />
                     </button>
                 </div>
            </div>

            <div className="flex-grow overflow-y-auto p-4">
                {notifications.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                        <BellIcon className="h-12 w-12 mb-2 opacity-20" />
                        <p>새로운 알림이 없습니다.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {notifications.map(notif => (
                            <div 
                                key={notif.id}
                                onClick={() => onNotificationClick(notif)}
                                className={`
                                    p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md relative group
                                    ${notif.type === 'calendar' ? 'bg-blue-50 border-blue-100' : ''}
                                    ${notif.type === 'budget' ? 'bg-red-50 border-red-100' : ''}
                                    ${notif.type === 'system' ? 'bg-gray-50 border-gray-200' : ''}
                                `}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className={`font-bold ${
                                        notif.type === 'calendar' ? 'text-blue-800' :
                                        notif.type === 'budget' ? 'text-red-800' : 'text-gray-800'
                                    }`}>
                                        {notif.title}
                                    </h4>
                                    <span className="text-xs text-gray-500">
                                        {new Date(notif.timestamp).toLocaleDateString()}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-700">{notif.message}</p>
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-xs bg-white px-2 py-1 rounded shadow text-gray-500">클릭하여 확인</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {isSettingsOpen && (
                <SettingsModal 
                    settings={settings} 
                    onSave={onUpdateSettings} 
                    onClose={() => setIsSettingsOpen(false)} 
                />
            )}
        </div>
    );
};
