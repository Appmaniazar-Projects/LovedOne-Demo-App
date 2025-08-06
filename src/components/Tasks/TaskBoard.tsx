import React, { useState } from 'react';
import { Plus, Calendar, User, Flag, Clock } from 'lucide-react';
import { mockTasks } from '../../data/mockData';
import { Task } from '../../types';

const TaskBoard: React.FC = () => {
  const [tasks] = useState<Task[]>(mockTasks);

  const statusColumns = [
    { id: 'pending', title: 'Pending', color: 'bg-slate-100' },
    { id: 'in-progress', title: 'In Progress', color: 'bg-blue-100' },
    { id: 'completed', title: 'Completed', color: 'bg-green-100' },
    { id: 'overdue', title: 'Overdue', color: 'bg-red-100' }
  ];

  const priorityColors = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800'
  };

  const typeColors = {
    legal: 'bg-purple-100 text-purple-800',
    ceremonial: 'bg-blue-100 text-blue-800',
    burial: 'bg-green-100 text-green-800',
    cremation: 'bg-orange-100 text-orange-800'
  };

  const getTasksByStatus = (status: string) => {
    return tasks.filter(task => task.status === status);
  };

  const isOverdue = (task: Task) => {
    return new Date(task.dueDate) < new Date() && task.status !== 'completed';
  };

  const TaskCard: React.FC<{ task: Task }> = ({ task }) => {
    const overdue = isOverdue(task);
    
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow ${
        overdue ? 'border-red-200 bg-red-50' : 'border-slate-200'
      }`}>
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-medium text-slate-900 text-sm">{task.title}</h3>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[task.priority]}`}>
            {task.priority}
          </span>
        </div>
        
        <p className="text-sm text-slate-600 mb-3">{task.description}</p>
        
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeColors[task.type]}`}>
              {task.type}
            </span>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-slate-500">
            <User className="w-4 h-4" />
            <span>{task.assignedTo}</span>
          </div>
          
          <div className={`flex items-center space-x-2 text-sm ${overdue ? 'text-red-600' : 'text-slate-500'}`}>
            <Calendar className="w-4 h-4" />
            <span>{task.dueDate.toLocaleDateString()}</span>
            {overdue && <Clock className="w-4 h-4 text-red-500" />}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Task Board</h1>
          <p className="text-slate-600">Track and manage workflow tasks</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
          <Plus className="w-5 h-5" />
          <span>New Task</span>
        </button>
      </div>

      {/* Task Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-600">Total Tasks</p>
          <p className="text-2xl font-bold text-slate-900">{tasks.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-600">In Progress</p>
          <p className="text-2xl font-bold text-blue-600">
            {tasks.filter(t => t.status === 'in-progress').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-600">Completed</p>
          <p className="text-2xl font-bold text-green-600">
            {tasks.filter(t => t.status === 'completed').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-600">Overdue</p>
          <p className="text-2xl font-bold text-red-600">
            {tasks.filter(t => isOverdue(t)).length}
          </p>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statusColumns.map((column) => (
          <div key={column.id} className="bg-white rounded-lg shadow-sm border border-slate-200">
            <div className={`${column.color} px-4 py-3 rounded-t-lg`}>
              <h3 className="font-semibold text-slate-900 flex items-center justify-between">
                {column.title}
                <span className="bg-white rounded-full px-2 py-1 text-xs font-medium text-slate-600">
                  {getTasksByStatus(column.id).length}
                </span>
              </h3>
            </div>
            <div className="p-4 space-y-3 min-h-[400px]">
              {getTasksByStatus(column.id).map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
              {getTasksByStatus(column.id).length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  <p className="text-sm">No {column.title.toLowerCase()} tasks</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskBoard;