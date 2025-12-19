import React, { useState, useEffect } from 'react';
import { Plus, Calendar, User, Flag, Clock } from 'lucide-react';
import { mockTasks } from '../../data/mockData';
import { Task } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';
import { useParams } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../../supabaseClient';
import { toast } from 'react-hot-toast';

interface StaffProfile {
  id: string;
  full_name: string;
  role: string;
  parlor_id?: string | null;
}

const TaskBoard: React.FC = () => {
  const { theme } = useTheme();
  const { parlorName } = useParams<{ parlorName: string }>();
  const [currentParlorId, setCurrentParlorId] = useState<string>('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    type: 'legal' as Task['type'],
    priority: 'medium' as Task['priority'],
    status: 'pending' as Task['status'],
    assignedTo: '',
    dueDate: '',
    caseId: ''
  });
  const [staffList, setStaffList] = useState<StaffProfile[]>([]);
  const [caseOptions, setCaseOptions] = useState<{ id: string; name: string }[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const loadUserRole = async () => {
      if (!isSupabaseConfigured()) {
        setUserRole(null);
        return;
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('Error fetching user for task board:', userError);
        setUserRole(null);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        console.error('Error fetching user role for task board:', profileError);
        setUserRole(null);
        return;
      }

      setUserRole(profile.role);
    };

    loadUserRole();
  }, []);

  useEffect(() => {
    const fetchParlorId = async () => {
      if (!isSupabaseConfigured() || !parlorName) return;

      const { data: parlorData, error: parlorError } = await supabase
        .from('parlors')
        .select('id')
        .eq('name', decodeURIComponent(parlorName))
        .single();

      if (parlorError) {
        console.error('Error fetching parlor for tasks:', parlorError);
        return;
      }

      if (parlorData && parlorData.id !== currentParlorId) {
        setCurrentParlorId(parlorData.id);
      }
    };

    fetchParlorId();
  }, [parlorName, currentParlorId]);

  useEffect(() => {
    const loadData = async () => {
      if (!isSupabaseConfigured()) {
        setTasks(mockTasks);
        return;
      }

      try {
        // Load tasks from Supabase with cross-branch visibility
        const { data: taskRows, error: tasksError } = await supabase
          .from('tasks')
          .select('id, title, description, type, priority, status, assigned_to, due_date, case_id, parlor_id, created_at, updated_at')
          .order('created_at', { ascending: false });

        if (tasksError) {
          console.error('Error loading tasks from Supabase:', tasksError);
          setTasks(mockTasks);
        } else {
          const mapped: Task[] = (taskRows || []).map((row: any) => ({
            id: row.id,
            title: row.title,
            description: row.description || '',
            type: row.type,
            priority: row.priority,
            status: row.status,
            assignedTo: row.assigned_to || '',
            dueDate: row.due_date ? new Date(row.due_date) : new Date(),
            caseId: row.case_id || '',
            parlorId: row.parlor_id || undefined,
            createdAt: row.created_at ? new Date(row.created_at) : new Date(),
            updatedAt: row.updated_at ? new Date(row.updated_at) : new Date()
          }));
          setTasks(mapped);
        }

        // Load staff for assignment dropdown
        let staffQuery = supabase
          .from('users')
          .select('id, full_name, role, parlor_id')
          .eq('role', 'staff');

        if (currentParlorId) {
          staffQuery = staffQuery.eq('parlor_id', currentParlorId);
        }

        const { data: staffRows, error: staffError } = await staffQuery;
        if (staffError) {
          console.error('Error loading staff for tasks:', staffError);
        } else {
          setStaffList(staffRows || []);
        }

        // Load cases for case selection in task form
        const { data: caseRows, error: casesError } = await supabase
          .from('cases')
          .select('id, deceased_name, case_status')
          .order('created_at', { ascending: false });

        if (casesError) {
          console.error('Error loading cases for tasks:', casesError);
        } else {
          setCaseOptions(
            (caseRows || []).map((row: any) => ({
              id: row.id as string,
              name: (row.deceased_name as string) || 'Unnamed case',
            }))
          );
        }
      } catch (err) {
        console.error('Unexpected error loading task board data:', err);
        setTasks(mockTasks);
      }
    };

    loadData();
  }, [currentParlorId]);

  const canManageTasks = userRole === 'admin' || userRole === 'super_admin';
  const canUpdateStatus = userRole === 'admin' || userRole === 'super_admin' || userRole === 'staff';

  const statusColumns = [
    { 
      id: 'pending', 
      title: 'Pending', 
      light: 'bg-slate-100',
      dark: 'bg-slate-800/50',
      textLight: 'text-slate-800',
      textDark: 'text-slate-200'
    },
    { 
      id: 'in-progress', 
      title: 'In Progress', 
      light: 'bg-blue-100',
      dark: 'bg-blue-900/30',
      textLight: 'text-blue-800',
      textDark: 'text-blue-200'
    },
    { 
      id: 'completed', 
      title: 'Completed', 
      light: 'bg-green-100',
      dark: 'bg-green-900/30',
      textLight: 'text-green-800',
      textDark: 'text-green-200'
    },
    { 
      id: 'overdue', 
      title: 'Overdue', 
      light: 'bg-red-100',
      dark: 'bg-red-900/30',
      textLight: 'text-red-800',
      textDark: 'text-red-200'
    }
  ];

  const getStatusColumnStyle = (column: typeof statusColumns[0]) => {
    return {
      color: theme === 'dark' ? column.dark : column.light,
      textColor: theme === 'dark' ? column.textDark : column.textLight
    };
  };

  const priorityColors = {
    low: {
      light: 'bg-green-100 text-green-800',
      dark: 'bg-green-900/30 text-green-300'
    },
    medium: {
      light: 'bg-yellow-100 text-yellow-800',
      dark: 'bg-yellow-900/30 text-yellow-300'
    },
    high: {
      light: 'bg-orange-100 text-orange-800',
      dark: 'bg-orange-900/30 text-orange-300'
    },
    urgent: {
      light: 'bg-red-100 text-red-800',
      dark: 'bg-red-900/30 text-red-300'
    }
  };

  const typeColors = {
    legal: {
      light: 'bg-purple-100 text-purple-800',
      dark: 'bg-purple-900/30 text-purple-300'
    },
    ceremonial: {
      light: 'bg-blue-100 text-blue-800',
      dark: 'bg-blue-900/30 text-blue-300'
    },
    burial: {
      light: 'bg-green-100 text-green-800',
      dark: 'bg-green-900/30 text-green-300'
    },
    cremation: {
      light: 'bg-orange-100 text-orange-800',
      dark: 'bg-orange-900/30 text-orange-300'
    }
  };

  const getPriorityColor = (priority: keyof typeof priorityColors) => {
    return priorityColors[priority]?.[theme] || priorityColors.medium[theme];
  };

  const getTypeColor = (type: keyof typeof typeColors) => {
    return typeColors[type]?.[theme] || typeColors.legal[theme];
  };

  const getTasksByStatus = (status: string) => {
    return tasks.filter(task => task.status === status);
  };

  const isOverdue = (task: Task) => {
    return new Date(task.dueDate) < new Date() && task.status !== 'completed';
  };

  const isValidUuid = (value: string) => {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSupabaseConfigured() && !canManageTasks) {
      toast.error('You do not have permission to create tasks');
      return;
    }

    if (!taskForm.title || !taskForm.dueDate || !taskForm.caseId) {
      toast.error('Please fill in all required fields');
      return;
    }

    const fallbackTask: Task = {
      id: (tasks.length + 1).toString(),
      title: taskForm.title,
      description: taskForm.description,
      type: taskForm.type,
      priority: taskForm.priority,
      status: taskForm.status,
      assignedTo: taskForm.assignedTo || '',
      dueDate: new Date(taskForm.dueDate),
      caseId: taskForm.caseId,
      parlorId: currentParlorId || undefined,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (!isSupabaseConfigured()) {
      setTasks(prev => [fallbackTask, ...prev]);
      setIsModalOpen(false);
      setTaskForm({
        title: '',
        description: '',
        type: 'legal',
        priority: 'medium',
        status: 'pending',
        assignedTo: '',
        dueDate: '',
        caseId: ''
      });
      toast.success('Task added locally');
      return;
    }

    if (!currentParlorId) {
      toast.error('Parlor is not loaded yet. Please try again in a moment.');
      return;
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        title: taskForm.title,
        description: taskForm.description,
        type: taskForm.type,
        priority: taskForm.priority,
        status: taskForm.status,
        assigned_to: taskForm.assignedTo || null,
        due_date: taskForm.dueDate,
        case_id: taskForm.caseId,
        parlor_id: currentParlorId
      })
      .select('id, title, description, type, priority, status, assigned_to, due_date, case_id, parlor_id, created_at, updated_at')
      .single();

    if (error || !data) {
      console.error('Error saving task to Supabase, using local fallback:', error);
      setTasks(prev => [fallbackTask, ...prev]);
      toast.success('Task added locally (offline mode)');
    } else {
      const saved: Task = {
        id: data.id,
        title: data.title,
        description: data.description || '',
        type: data.type,
        priority: data.priority,
        status: data.status,
        assignedTo: data.assigned_to || '',
        dueDate: data.due_date ? new Date(data.due_date) : new Date(),
        caseId: data.case_id || '',
        parlorId: data.parlor_id || undefined,
        createdAt: data.created_at ? new Date(data.created_at) : new Date(),
        updatedAt: data.updated_at ? new Date(data.updated_at) : new Date()
      };
      setTasks(prev => [saved, ...prev]);
      toast.success('Task created');
    }

    setIsModalOpen(false);
    setTaskForm({
      title: '',
      description: '',
      type: 'legal',
      priority: 'medium',
      status: 'pending',
      assignedTo: '',
      dueDate: '',
      caseId: ''
    });
  };

  const handleStatusChange = async (
    taskId: string,
    previousStatus: Task['status'],
    newStatus: Task['status']
  ) => {
    if (!canUpdateStatus) {
      toast.error('You do not have permission to update task status');
      return;
    }

    setTasks(prev =>
      prev.map(task =>
        task.id === taskId ? { ...task, status: newStatus, updatedAt: new Date() } : task
      )
    );

    // Only attempt Supabase update when configured and the task has a real UUID id.
    // This avoids 22P02 errors when working with mock/local tasks that use simple IDs like "1".
    if (!isSupabaseConfigured() || !isValidUuid(taskId)) {
      return;
    }

    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', taskId);

    if (error) {
      console.error('Error updating task status:', error);
      toast.error('Could not update task status');
      setTasks(prev =>
        prev.map(task =>
          task.id === taskId ? { ...task, status: previousStatus, updatedAt: new Date() } : task
        )
      );
    }
  };

  const getAssigneeName = (userId: string) => {
    if (!userId) return 'Unassigned';
    const staff = staffList.find(s => s.id === userId);
    return staff?.full_name || userId;
  };

  const TaskCard: React.FC<{ task: Task }> = ({ task }) => {
    const overdue = isOverdue(task);
    const priorityColor = getPriorityColor(task.priority);
    const typeColor = getTypeColor(task.type);
    const assigneeName = getAssigneeName(task.assignedTo);

    return (
      <div className={`rounded-lg shadow-sm border p-4 hover:shadow-md transition-all ${
        theme === 'dark' 
          ? (overdue ? 'border-red-800/50 bg-red-900/20 hover:bg-red-900/30' : 'border-gray-700 bg-gray-800 hover:bg-gray-700/80')
          : (overdue ? 'border-red-200 bg-red-50 hover:bg-red-100' : 'border-slate-200 bg-white hover:bg-slate-50')
      }`}>
        <div className="flex items-start justify-between mb-3">
          <h3 className={`font-medium text-sm ${
            theme === 'dark' ? 'text-white' : 'text-slate-900'
          }`}>
            {task.title}
          </h3>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColor}`}>
            {task.priority}
          </span>
        </div>
        
        <p className={`text-sm mb-3 ${
          theme === 'dark' ? 'text-gray-300' : 'text-slate-600'
        }`}>
          {task.description}
        </p>
        
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeColor}`}>
              {task.type}
            </span>
          </div>
          {canUpdateStatus && (
            <div className={`flex items-center space-x-2 text-sm ${
              theme === 'dark' ? 'text-gray-400' : 'text-slate-500'
            }`}>
              <Flag className="w-4 h-4" />
              <select
                value={task.status}
                onChange={(e) =>
                  handleStatusChange(
                    task.id,
                    task.status,
                    e.target.value as Task['status']
                  )
                }
                className="bg-transparent border border-slate-300 dark:border-gray-600 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          )}
          
          <div className={`flex items-center space-x-2 text-sm ${
            theme === 'dark' ? 'text-gray-400' : 'text-slate-500'
          }`}>
            <User className="w-4 h-4" />
            <span>{assigneeName}</span>
          </div>
          
          <div className={`flex items-center space-x-2 text-sm ${
            overdue 
              ? (theme === 'dark' ? 'text-red-400' : 'text-red-600')
              : (theme === 'dark' ? 'text-gray-400' : 'text-slate-500')
          }`}>
            <Calendar className="w-4 h-4" />
            <span>{task.dueDate.toLocaleDateString()}</span>
            {overdue && <Clock className="w-4 h-4" />}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Task Board</h1>
          <p className="text-slate-600 dark:text-gray-400">Track and manage workflow tasks</p>
        </div>
        {(!isSupabaseConfigured() || canManageTasks) && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 w-full md:w-auto justify-center"
          >
            <Plus className="w-5 h-5" />
            <span>New Task</span>
          </button>
        )}
      </div>

      {/* Task Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-gray-700 p-4 transition-colors duration-200">
          <p className="text-sm text-slate-600 dark:text-gray-400">Total Tasks</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{tasks.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-gray-700 p-4 transition-colors duration-200">
          <p className="text-sm text-slate-600 dark:text-gray-400">In Progress</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {tasks.filter(t => t.status === 'in-progress').length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-gray-700 p-4 transition-colors duration-200">
          <p className="text-sm text-slate-600 dark:text-gray-400">Completed</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {tasks.filter(t => t.status === 'completed').length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-gray-700 p-4 transition-colors duration-200">
          <p className="text-sm text-slate-600 dark:text-gray-400">Overdue</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
            {tasks.filter(t => isOverdue(t)).length}
          </p>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statusColumns.map((column) => {
          const columnStyle = getStatusColumnStyle(column);
          return (
            <div 
              key={column.id} 
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-gray-700 transition-colors duration-200"
            >
              <div 
                className={`${columnStyle.color} px-4 py-3 rounded-t-lg transition-colors duration-200`}
              >
                <h3 className={`font-semibold flex items-center justify-between ${
                  theme === 'dark' ? column.textDark : column.textLight
                }`}>
                  {column.title}
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                    theme === 'dark' 
                      ? 'bg-gray-700/50 text-white' 
                      : 'bg-white text-slate-600'
                  }`}>
                    {getTasksByStatus(column.id).length}
                  </span>
                </h3>
              </div>
              <div className="p-3 space-y-3 min-h-[400px] overflow-y-auto">
                {getTasksByStatus(column.id).map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
                {getTasksByStatus(column.id).length === 0 && (
                  <div className="text-center py-8 text-slate-400 dark:text-gray-500">
                    <p className="text-sm">No {column.title.toLowerCase()} tasks</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* New Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="rounded-lg shadow-2xl w-full max-w-xl bg-white/30 dark:bg-gray-900/30 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 p-8 text-slate-900 dark:text-white">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">New Task</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">✕</button>
            </div>
            <form onSubmit={handleAddTask} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-900 dark:text-white mb-1">Task Title</label>
                  <input value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 border-slate-300 dark:border-gray-600 text-slate-900 dark:text-white" placeholder="e.g. Obtain death certificate" required />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-900 dark:text-white mb-1">Description</label>
                  <textarea value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 border-slate-300 dark:border-gray-600 text-slate-900 dark:text-white" rows={3} placeholder="Task details..." required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900 dark:text-white mb-1">Type</label>
                  <select value={taskForm.type} onChange={(e) => setTaskForm({ ...taskForm, type: e.target.value as Task['type'] })} className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 border-slate-300 dark:border-gray-600 text-slate-900 dark:text-white">
                    <option value="legal">Legal</option>
                    <option value="ceremonial">Ceremonial</option>
                    <option value="burial">Burial</option>
                    <option value="cremation">Cremation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900 dark:text-white mb-1">Priority</label>
                  <select value={taskForm.priority} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as Task['priority'] })} className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 border-slate-300 dark:border-gray-600 text-slate-900 dark:text-white">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900 dark:text-white mb-1">Status</label>
                  <select value={taskForm.status} onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value as Task['status'] })} className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 border-slate-300 dark:border-gray-600 text-slate-900 dark:text-white">
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900 dark:text-white mb-1">Assigned To</label>
                  <select
                    value={taskForm.assignedTo}
                    onChange={(e) => setTaskForm({ ...taskForm, assignedTo: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 border-slate-300 dark:border-gray-600 text-slate-900 dark:text-white"
                    disabled={isSupabaseConfigured() && !canManageTasks}
                  >
                    <option value="">Unassigned</option>
                    {staffList.map((staff) => (
                      <option key={staff.id} value={staff.id}>
                        {staff.full_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900 dark:text-white mb-1">Due Date</label>
                  <input type="date" value={taskForm.dueDate} onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })} className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 border-slate-300 dark:border-gray-600 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400 dark:hover:border-gray-500 transition-all cursor-pointer" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900 dark:text-white mb-1">Case</label>
                  {isSupabaseConfigured() ? (
                    <select
                      value={taskForm.caseId}
                      onChange={(e) => setTaskForm({ ...taskForm, caseId: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 border-slate-300 dark:border-gray-600 text-slate-900 dark:text-white"
                      required
                    >
                      <option value="">Select case...</option>
                      {caseOptions.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      value={taskForm.caseId}
                      onChange={(e) => setTaskForm({ ...taskForm, caseId: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 border-slate-300 dark:border-gray-600 text-slate-900 dark:text-white"
                      placeholder="Case ID"
                      required
                    />
                  )}
                </div>
              </div>
              <div className="flex items-center justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg border border-slate-300 dark:border-gray-600 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-gray-700">Cancel</button>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">Add Task</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskBoard;