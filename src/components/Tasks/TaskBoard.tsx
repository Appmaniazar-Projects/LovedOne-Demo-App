import React, { useState } from 'react';
import { Plus, Calendar, User, Flag, Clock } from 'lucide-react';
import { mockTasks } from '../../data/mockData';
import { Task } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';

const TaskBoard: React.FC = () => {
  const { theme } = useTheme();
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
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

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title || !taskForm.assignedTo || !taskForm.dueDate || !taskForm.caseId) {
      return;
    }

    const newTask: Task = {
      id: (tasks.length + 1).toString(),
      title: taskForm.title,
      description: taskForm.description,
      type: taskForm.type,
      priority: taskForm.priority,
      status: taskForm.status,
      assignedTo: taskForm.assignedTo,
      dueDate: new Date(taskForm.dueDate),
      caseId: taskForm.caseId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setTasks(prev => [newTask, ...prev]);
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

  const TaskCard: React.FC<{ task: Task }> = ({ task }) => {
    const overdue = isOverdue(task);
    const priorityColor = getPriorityColor(task.priority);
    const typeColor = getTypeColor(task.type);
    
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
          
          <div className={`flex items-center space-x-2 text-sm ${
            theme === 'dark' ? 'text-gray-400' : 'text-slate-500'
          }`}>
            <User className="w-4 h-4" />
            <span>{task.assignedTo}</span>
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
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 w-full md:w-auto justify-center"
        >
          <Plus className="w-5 h-5" />
          <span>New Task</span>
        </button>
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
          <div className="rounded-lg shadow-2xl w-full max-w-xl bg-white/30 dark:bg-gray-900/30 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 p-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-900">New Task</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">✕</button>
            </div>
            <form onSubmit={handleAddTask} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-900 dark:text-slate-900 mb-1">Task Title</label>
                  <input value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 border-slate-300 dark:border-gray-600 text-slate-900 dark:text-white" placeholder="e.g. Obtain death certificate" required />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-900 dark:text-slate-900 mb-1">Description</label>
                  <textarea value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 border-slate-300 dark:border-gray-600 text-slate-900 dark:text-white" rows={3} placeholder="Task details..." required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900 dark:text-slate-900 mb-1">Type</label>
                  <select value={taskForm.type} onChange={(e) => setTaskForm({ ...taskForm, type: e.target.value as Task['type'] })} className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 border-slate-300 dark:border-gray-600 text-slate-900 dark:text-white">
                    <option value="legal">Legal</option>
                    <option value="ceremonial">Ceremonial</option>
                    <option value="burial">Burial</option>
                    <option value="cremation">Cremation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900 dark:text-slate-900 mb-1">Priority</label>
                  <select value={taskForm.priority} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as Task['priority'] })} className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 border-slate-300 dark:border-gray-600 text-slate-900 dark:text-white">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900 dark:text-slate-900 mb-1">Status</label>
                  <select value={taskForm.status} onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value as Task['status'] })} className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 border-slate-300 dark:border-gray-600 text-slate-900 dark:text-white">
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900 dark:text-slate-900 mb-1">Assigned To</label>
                  <input value={taskForm.assignedTo} onChange={(e) => setTaskForm({ ...taskForm, assignedTo: e.target.value })} className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 border-slate-300 dark:border-gray-600 text-slate-900 dark:text-white" placeholder="Person name" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900 dark:text-slate-900 mb-1">Due Date</label>
                  <input type="date" value={taskForm.dueDate} onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })} className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 border-slate-300 dark:border-gray-600 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400 dark:hover:border-gray-500 transition-all cursor-pointer" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900 dark:text-slate-900 mb-1">Case ID</label>
                  <input value={taskForm.caseId} onChange={(e) => setTaskForm({ ...taskForm, caseId: e.target.value })} className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 border-slate-300 dark:border-gray-600 text-slate-900 dark:text-white" placeholder="e.g. 1" required />
                </div>
              </div>
              <div className="flex items-center justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg border border-slate-300 dark:border-gray-600 text-slate-900 dark:text-slate-900 hover:bg-slate-50 dark:hover:bg-gray-700">Cancel</button>
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