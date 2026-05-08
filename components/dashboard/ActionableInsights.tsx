import React from 'react';
import { localized } from '../../localization';

interface Task {
    id: string;
    label: string;
    completed: boolean;
}

interface RoutinePlan {
    morning: Task[];
    evening: Task[];
}

interface WeakPoint {
    category: string;
    description: string;
    impact: number;
    goalTitle: string;
    goalDescription: string;
}

interface ActionableInsightsProps {
    routines: RoutinePlan;
    weakPoint: WeakPoint;
}

const ActionableInsights: React.FC<ActionableInsightsProps> = ({ routines, weakPoint }) => {
    const allTasks = [...(routines?.morning || []), ...(routines?.evening || [])];
    const completedTasks = allTasks.filter(t => t.completed).length;
    const totalTasks = allTasks.length || 3;

    const displayMorning = routines?.morning?.length ? routines.morning : [
        { id: '1', label: 'Nazik temizleyici kullan', completed: true },
        { id: '2', label: 'Nemlendirici uygula', completed: false },
        { id: '3', label: 'SPF kullanmayı unutma', completed: false },
    ];
    const displayEvening = routines?.evening?.length ? routines.evening : [
        { id: '4', label: 'Cildini arındır', completed: true },
        { id: '5', label: 'Nemlendirici uygula', completed: false },
        { id: '6', label: 'Göz çevresi bakımını yap', completed: false },
    ];
    const wp = weakPoint || {
        category: localized('Skin Texture', 'Cilt Dokusu'),
        description: localized('Rough and matte signal', 'Pürüzlü ve mat görünüm'),
        impact: -0.6,
        goalTitle: localized('Repair skin texture', 'Cilt dokusunu toparla'),
        goalDescription: localized('Do not miss the task for 7 days.', '7 gün boyunca görevi kaçırma.')
    };

    const circumference = 2 * Math.PI * 18;
    const dashOffset = circumference - ((completedTasks / totalTasks) * circumference);

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '16px', marginBottom: '16px' }}>
            {/* ====== PLAN CARD ====== */}
            <div style={{
                background: '#fff', borderRadius: '24px', padding: '24px',
                boxShadow: '0 4px 24px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
            }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                        <p style={{ fontSize: '11px', fontWeight: 800, color: '#1D1D1F', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>
                            {localized("Today's Tasks", 'Bugünün Görevleri')}
                        </p>
                        <div style={{ position: 'relative', width: '40px', height: '40px' }}>
                            <svg width="40" height="40" viewBox="0 0 44 44" style={{ transform: 'rotate(-90deg)' }}>
                                <circle cx="22" cy="22" r="18" fill="none" stroke="#F2F2F7" strokeWidth="4" />
                                <circle cx="22" cy="22" r="18" fill="none" stroke="#10B981" strokeWidth="4"
                                    strokeDasharray={circumference} strokeDashoffset={dashOffset} strokeLinecap="round" />
                            </svg>
                            <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 800, color: '#1D1D1F' }}>
                                {completedTasks}/{totalTasks}
                            </span>
                        </div>
                    </div>

                    {/* Morning */}
                    <div style={{ marginBottom: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
                            </svg>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: '#8E8E93', textTransform: 'uppercase' }}>Sabah</span>
                        </div>
                        {displayMorning.map(task => (
                            <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                {task.completed ? (
                                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}><circle cx="10" cy="10" r="10" fill="#10B981"/><path d="M6 10l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                ) : (
                                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid #E5E5EA', flexShrink: 0 }} />
                                )}
                                <span style={{ fontSize: '12px', color: task.completed ? '#8E8E93' : '#1D1D1F', textDecoration: task.completed ? 'line-through' : 'none', fontWeight: 600, lineHeight: 1.4 }}>
                                    {task.label}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Evening */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                            </svg>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: '#8E8E93', textTransform: 'uppercase' }}>Akşam</span>
                        </div>
                        {displayEvening.map(task => (
                            <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                {task.completed ? (
                                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}><circle cx="10" cy="10" r="10" fill="#10B981"/><path d="M6 10l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                ) : (
                                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid #E5E5EA', flexShrink: 0 }} />
                                )}
                                <span style={{ fontSize: '12px', color: task.completed ? '#8E8E93' : '#1D1D1F', textDecoration: task.completed ? 'line-through' : 'none', fontWeight: 600, lineHeight: 1.4 }}>
                                    {task.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ====== WEAK POINT CARD ====== */}
            <div style={{
                background: '#fff', borderRadius: '24px', padding: '24px',
                boxShadow: '0 4px 24px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
            }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                        </svg>
                        <p style={{ fontSize: '11px', fontWeight: 800, color: '#EF4444', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>
                            {localized("Today's Priority", 'Bugünkü Öncelik')}
                        </p>
                    </div>

                    <p style={{ fontSize: '18px', fontWeight: 800, color: '#1C1C1E', margin: '0 0 4px', lineHeight: 1.2 }}>{wp.category}</p>
                    <p style={{ fontSize: '13px', color: '#8E8E93', margin: '0 0 16px' }}>{wp.description}</p>
                    
                    <div style={{ background: '#FEF2F2', border: '1px solid #FEE2E2', borderRadius: '12px', padding: '12px', marginBottom: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '12px', fontWeight: 600, color: '#EF4444' }}>{localized('Signal pulling the score down', 'Skoru aşağı çeken sinyal')}</span>
                            <span style={{ fontSize: '16px', fontWeight: 800, color: '#EF4444' }}>{wp.impact.toFixed(1)}</span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
                        </svg>
                        <p style={{ fontSize: '11px', fontWeight: 800, color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>
                            {localized('7-Day Target', '7 Günlük Hedef')}
                        </p>
                    </div>
                    
                    <p style={{ fontSize: '14px', fontWeight: 800, color: '#1C1C1E', margin: '0 0 4px' }}>{wp.goalTitle}</p>
                    <p style={{ fontSize: '12px', color: '#8E8E93', margin: 0 }}>{wp.goalDescription}</p>
                </div>

                <div style={{ marginTop: '24px' }}>
                    <button style={{
                        width: '100%', background: '#F8F8FA', border: 'none', borderRadius: '12px',
                        padding: '12px', fontSize: '13px', fontWeight: 800, color: '#1D1D1F',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer'
                    }}>
                        {localized('Open Locked Plan', 'Kilitli Planı Aç')}
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ActionableInsights;
