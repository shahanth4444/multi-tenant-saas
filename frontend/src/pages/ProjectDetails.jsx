import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api'

export default function ProjectDetails() {
  const { projectId } = useParams()
  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'medium' })
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const p = await api.get('/projects?limit=100')
    setProject(p.data.data.projects.find(x => x.id === projectId) || null)
    const t = await api.get(`/projects/${projectId}/tasks`)
    setTasks(t.data.data.tasks || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [projectId])

  async function addTask() {
    await api.post(`/projects/${projectId}/tasks`, taskForm)
    setTaskForm({ title: '', description: '', priority: 'medium' })
    await load()
  }

  async function changeStatus(taskId, status) {
    await api.patch(`/tasks/${taskId}/status`, { status })
    await load()
  }

  if (loading) {
    return (
      <div className="container py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="grid md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="container py-8">
        <div className="card">
          <div className="card-body">
            <div className="empty-state">
              <div className="empty-state-title">Project not found</div>
              <div className="empty-state-subtitle">The project you're looking for doesn't exist</div>
              <Link to="/projects" className="btn btn-primary mt-4">
                Back to Projects
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const tasksByStatus = {
    todo: tasks.filter(t => t.status === 'todo'),
    in_progress: tasks.filter(t => t.status === 'in_progress'),
    completed: tasks.filter(t => t.status === 'completed'),
  }

  return (
    <div className="container py-8 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <Link to="/projects" className="text-purple-600 hover:text-purple-700 font-medium mb-4 inline-flex items-center gap-2">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Projects
        </Link>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2 mt-4">
          {project.name}
        </h1>
        {project.description && (
          <p className="text-gray-600 text-lg">{project.description}</p>
        )}
        <div className="flex items-center gap-4 mt-4">
          <span className={`badge ${getStatusBadge(project.status)}`}>
            {project.status}
          </span>
          <span className="text-sm text-gray-600">
            Created by {project.createdBy?.fullName || 'Unknown'}
          </span>
        </div>
      </div>

      {/* Add Task Form */}
      <div className="card mb-6">
        <div className="card-header">Add New Task</div>
        <div className="card-body">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              placeholder="Task title"
              value={taskForm.title}
              onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
              className="input flex-1"
            />
            <input
              placeholder="Description"
              value={taskForm.description}
              onChange={e => setTaskForm({ ...taskForm, description: e.target.value })}
              className="input flex-1"
            />
            <select
              value={taskForm.priority}
              onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}
              className="input sm:w-32"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <button onClick={addTask} className="btn btn-primary whitespace-nowrap">
              Add Task
            </button>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid md:grid-cols-3 gap-6">
        <TaskColumn
          title="To Do"
          tasks={tasksByStatus.todo}
          onChangeStatus={changeStatus}
          color="from-blue-500 to-cyan-500"
        />
        <TaskColumn
          title="In Progress"
          tasks={tasksByStatus.in_progress}
          onChangeStatus={changeStatus}
          color="from-purple-500 to-pink-500"
        />
        <TaskColumn
          title="Completed"
          tasks={tasksByStatus.completed}
          onChangeStatus={changeStatus}
          color="from-green-500 to-emerald-500"
        />
      </div>
    </div>
  )
}

function TaskColumn({ title, tasks, onChangeStatus, color }) {
  return (
    <div className="card">
      <div className={`card-header bg-gradient-to-r ${color} text-white rounded-t-2xl`}>
        <div className="flex items-center justify-between">
          <span>{title}</span>
          <span className="badge bg-white/20 text-white border-white/30">
            {tasks.length}
          </span>
        </div>
      </div>
      <div className="card-body space-y-3">
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <svg className="h-12 w-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <div className="text-sm">No tasks</div>
          </div>
        ) : (
          tasks.map((t, idx) => (
            <TaskCard
              key={t.id}
              task={t}
              onChangeStatus={onChangeStatus}
              delay={idx * 50}
            />
          ))
        )}
      </div>
    </div>
  )
}

function TaskCard({ task, onChangeStatus, delay }) {
  const [showActions, setShowActions] = useState(false)

  return (
    <div
      className="p-4 rounded-xl bg-gradient-to-br from-gray-50 to-white border border-gray-200 hover:border-purple-200 hover:shadow-md transition-all duration-300 animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="mb-3">
        <h4 className="font-semibold text-gray-900 mb-1">{task.title}</h4>
        {task.description && (
          <p className="text-sm text-gray-600">{task.description}</p>
        )}
      </div>

      <div className="flex items-center justify-between">
        <span className={`badge ${getPriorityBadge(task.priority)}`}>
          {task.priority}
        </span>

        <button
          onClick={() => setShowActions(!showActions)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>
      </div>

      {showActions && (
        <div className="mt-3 pt-3 border-t border-gray-200 flex gap-2 animate-fade-in">
          <button
            onClick={() => onChangeStatus(task.id, 'todo')}
            className="btn btn-secondary text-xs py-1 px-2 flex-1"
          >
            To Do
          </button>
          <button
            onClick={() => onChangeStatus(task.id, 'in_progress')}
            className="btn btn-secondary text-xs py-1 px-2 flex-1"
          >
            In Progress
          </button>
          <button
            onClick={() => onChangeStatus(task.id, 'completed')}
            className="btn btn-success text-xs py-1 px-2 flex-1"
          >
            Done
          </button>
        </div>
      )}
    </div>
  )
}

function getStatusBadge(status) {
  switch (status) {
    case 'active': return 'badge-primary'
    case 'archived': return 'badge-gray'
    case 'completed': return 'badge-success'
    default: return 'badge-gray'
  }
}

function getPriorityBadge(priority) {
  switch (priority) {
    case 'high': return 'badge-danger'
    case 'medium': return 'badge-warning'
    case 'low': return 'badge-info'
    default: return 'badge-gray'
  }
}
